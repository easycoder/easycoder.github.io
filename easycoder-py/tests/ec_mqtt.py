import time
import uuid
from easycoder import Handler, ECObject, ECValue, RuntimeError
import paho.mqtt.client as mqtt
from binascii import hexlify, unhexlify
    
#############################################################################
# MQTT client class
class MQTTClient():
    def __init__(self):
        super().__init__()

    def create(self, program=None, clientID='EasyCoder-MQTT-Hub', broker='EasyCoder-MQTT-Hub', port=1883, topics=None):
        self.program = program
        # Avoid client ID collisions on public brokers
        clientID += f"-{uuid.uuid4().hex[:6]}"
        self.clientID = clientID
        self.broker = broker
        self.port = port
        self.topics = [] if topics is None else topics
        self.onMessagePC = None
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=self.clientID) # type: ignore
        self.client.reconnect_delay_set(min_delay=1, max_delay=5)
    
        # Setup callbacks
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect

    def on_connect(self, client, userdata, flags, reason_code, properties):
        print(f"Client {self.clientID} connected")
        if self.program is None:
            for item in self.topics:
                self.client.subscribe(item.get('name'), qos=item.get('qos', 1))
                print(f"Subscribe to topic: {item} (program is None)")
        else:
            for item in self.topics:
                topic = self.program.getObject(self.program.getVariable(item))
                self.client.subscribe(topic.getName(), qos=topic.getQOS())
                print(f"Subscribed to topic: {topic.getName()} with QoS {topic.getQOS()}")

    def on_disconnect(self, client, userdata, flags, reason_code, properties=None):
        try:
            code_val = reason_code.value if hasattr(reason_code, 'value') else reason_code
        except Exception:
            code_val = reason_code
        print(f"Disconnected: reason_code={code_val}") 

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
        except Exception:
            payload = str(msg.payload)
        
        # Check if this is a chunked message
        is_chunked = payload.startswith('part:') or payload.startswith('last:')
        
        if is_chunked:
            # Handle dechunking
            confirmation = self.receive_part(payload)
            print(f"[chunked] Part received: {confirmation}")
            
            # If complete, invoke callback
            if self.receive_complete:
                # Create a mock message object with the reassembled payload
                class MockMessage:
                    def __init__(self, topic, payload_str):
                        self.topic = topic
                        self.payload_str = payload_str
                    def decode(self, encoding='utf-8'):
                        return self.payload_str
                
                self.message = MockMessage(msg.topic, self.received_message)
                self.receive_complete = False  # Reset for next message
                
                print("Message reassembled")
                
                if self.program is None:
                    print(f"[standalone] {msg.topic}: {self.received_message}")
                elif self.onMessagePC is not None:
                    self.program.run(self.onMessagePC)
                    self.program.flushCB()
        else:
            # Non-chunked message - handle directly
            print(f"Message received on topic {msg.topic}: {payload[0:40]}{'...' if len(payload)>40 else ''}")
            if self.program is None:
                print(f"[standalone] {msg.topic}: {payload}")
            elif self.onMessagePC is not None:
                self.message = msg
                if self.program is not None:
                    self.program.run(self.onMessagePC)
                    self.program.flushCB()
    
    def getMessageTopic(self):
        return self.message.topic
    
    def getMessagePayload(self):
        return self.message.payload_str

    def onMessage(self, pc):
        self.onMessagePC = pc
    
    def sendMessage(self, topic, message, qos):
        # Use chunking for large messages
        self.send_chunked(topic, message, qos=qos)
    
    def run(self):
        self.client.connect(self.broker, int(self.port), 60)
        self.client.loop_start()

    def chunk_message(self, message: str, chunk_size: int = 1000):
        """Split message into hex-encoded chunks for transmission.

        Returns list of (part_num, hex_text) tuples.
        """
        msg_bytes = message.encode('utf-8')
        chunks = []
        for i in range(0, len(msg_bytes), chunk_size):
            chunk = msg_bytes[i:i + chunk_size]
            hex_text = hexlify(chunk).decode('ascii')
            chunks.append((len(chunks), hex_text))
        return chunks

    def send_chunked(self, topic: str, message: str, qos: int = 1, chunk_size: int = 1000):
        """Send a large message as a series of chunked MQTT messages.

        Sends parts as: part:{n},text:{hex_encoded_text}
        Last part prefixed with: last:{n},text:{hex_encoded_text}
        """
        chunks = self.chunk_message(message, chunk_size)
        if not chunks:
            return

        for part_num, hex_text in chunks[:-1]:
            msg = f"part:{part_num},text:{hex_text}"
            self.client.publish(topic, msg, qos=qos)
            confirmation = f"part {part_num} {len(hex_text)}"
            print(f"[chunked] Part sent: {confirmation}")

        # Send last part
        last_num, hex_text = chunks[-1]
        msg = f"last:{last_num},text:{hex_text}"
        self.client.publish(topic, msg, qos=qos)
        confirmation = f"part {last_num} {len(hex_text)}"
        print(f"[chunked] Part sent: {confirmation}")

    def init_receive_buffer(self):
        """Initialize buffer for receiving chunked messages."""
        self.receive_buffer = []
        self.receive_part_count = 0
        self.receive_complete = False

    def receive_part(self, msg: str) -> str:
        """Process an incoming chunked part.

        Returns confirmation message: '{part} {size}' or error.
        """
        try:
            is_last = msg.startswith('last:')
            prefix = 'last:' if is_last else 'part:'
            msg_data = msg[len(prefix):]

            # Parse format: "0,text:{hex}" or "{num},text:{hex}"
            items = msg_data.split(',', 1)  # Split into at most 2 parts
            if len(items) < 2:
                return 'Error: invalid part format'
            
            # First item is the part number
            try:
                part_num = int(items[0])
            except ValueError:
                return f'Error: invalid part number: {items[0]}'
            
            # Second item should be "text:{hex}"
            if not items[1].startswith('text:'):
                return 'Error: missing text field'
            hex_text = items[1][5:]  # Strip "text:"

            if part_num is None or hex_text is None:
                return 'Error: invalid part format'

            # Initialize on part 0
            if part_num == 0:
                self.init_receive_buffer()

            # Verify sequence
            if part_num != self.receive_part_count:
                return f'Error: sequence mismatch, expected {self.receive_part_count}, got {part_num}'

            # Decode and accumulate
            try:
                decoded = unhexlify(hex_text).decode('utf-8')
            except Exception as e:
                return f'Error: decode failed: {e}'

            self.receive_buffer.append(decoded)
            self.receive_part_count += 1

            # If last part, merge buffer
            if is_last:
                self.receive_complete = True
                self.received_message = ''.join(self.receive_buffer)
                return f'last {part_num} {sum(len(b) for b in self.receive_buffer)}'

            return f'{part_num} {len(decoded)}'

        except Exception as e:
            return f'Error: {e}'

    def get_received_message(self) -> str:
        """Return the reassembled message if complete."""
        if self.receive_complete:
            return self.received_message
        return ''
        
###############################################################################
# An MQTT topic
class ECTopic(ECObject):
    def __init__(self):
        super().__init__()

    def create(self, name, qos=1):
        super().__init__()
        super().setName(name)
        self.qos = qos

    def getName(self):
        return super().getName()

    def getQOS(self):
        return self.qos

###############################################################################
# The MQTT compiler and rutime handlers
class MQTT(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)
        self.spoke = None

    def getName(self):
        return 'mqtt'

    #############################################################################
    # Keyword handlers

    # init {topic} name {name} qos {qos}
    def k_init(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECTopic)
            command['topic'] = record['name']
            self.skip('name')
            command['name'] = self.nextValue()
            self.skip('qos')
            command['qos'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_init(self, command):
        record = self.getVariable(command['topic'])
        topic = ECTopic()
        topic.create(self.textify(command['name']), qos=int(self.textify(command['qos'])))
        record['object'] = topic
        return self.nextPC()

    # mqtt id {clientID} broker {broker} port {port} topics {topic} [and {topic} ...]
    def k_mqtt(self, command):
        while True:
            token = self.peek()
            if token == 'id':
                self.nextToken()
                command['clientID'] = self.nextValue()
            elif token == 'broker':
                self.nextToken()
                command['broker'] = self.nextValue()
            elif token == 'port':
                self.nextToken()
                command['port'] = self.nextValue()
            elif token == 'topics':
                self.nextToken()
                topics = []
                while self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, ECTopic())
                    topics.append(record['name'])
                    if self.peek() == 'and': self.nextToken()
                    else:break
                command['topics'] = topics
            else:
                self.add(command)
                return True
        return False

    def r_mqtt(self, command):
        if hasattr(self.program, 'mqttClient'):
            raise RuntimeError(self.program, 'MQQT client already defined')
        clientID = self.textify(command['clientID'])
        broker = self.textify(command['broker'])
        port = self.textify(command['port'])
        topics = command['topics']
        client = MQTTClient()
        client.create(self.program, clientID, broker, port, topics)
        client.run()
        self.program.mqttClient = client
        return self.nextPC()

    # on mqtt message {action}
    def k_on(self, command):
        token = self.peek()
        if token == 'mqtt':
            self.nextToken()
            if self.nextIs('message'):
                self.nextToken()
                command['goto'] = 0
                self.add(command)
                cmd = {}
                cmd['domain'] = 'core'
                cmd['lino'] = command['lino']
                cmd['keyword'] = 'gotoPC'
                cmd['goto'] = 0
                cmd['debug'] = False
                self.add(cmd)
                # Add the action and a 'stop'
                self.compileOne()
                cmd = {}
                cmd['domain'] = 'core'
                cmd['lino'] = command['lino']
                cmd['keyword'] = 'stop'
                cmd['debug'] = False
                self.add(cmd)
                # Fixup the link
                command['goto'] = self.getCodeSize()
                return True
        return False

    def r_on(self, command):
        self.program.mqttClient.onMessage(self.nextPC()+1)
        return command['goto']

    # send {message} to {topic}
    def k_send(self, command):
        if self.nextIs('mqtt'):
            command['message'] = self.nextValue()
            self.skip('from')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, MQTTClient)
                command['from'] = record['name']
            self.skip('to')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, MQTTClient)
                command['to'] = record['name']
            self.add(command)
            return True
        return False

    def r_send(self, command):
        if not hasattr(self.program, 'mqttClient'):
            raise RuntimeError(self.program, 'No MQTT client defined')
        topic = self.getObject(self.getVariable(command['to']))
        message = self.textify(command['message'])
        self.program.mqttClient.sendMessage(topic.getName(), message, topic.getQOS())
        return self.nextPC()

    # Declare a topic variable
    def k_topic(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECTopic')

    def r_topic(self, command):
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        token = self.nextToken()
        if token == 'mqtt':
            value = ECValue(domain=self.getName())
            token = self.nextToken()
            if token in ['topic', 'message']:
                value.setType(token)
                return value
        else:
            return self.getValue()
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_message(self, v):
        return self.program.mqttClient.getMessagePayload()

    def v_topic(self, v):
        return self.program.mqttClient.getMessageTopic()

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        return condition

    #############################################################################
    # Condition handlers

if __name__ == '__main__':

    clientID = 'EasyCoder-MQTT-Hub'
    broker = 'test.mosquitto.org'
    port = 1883
    request = {'name': '38:54:39:34:62:d7/request', 'qos': 1}
    response = {'name': '38:54:39:34:62:d7/response', 'qos': 1}
    topics = [request]

    client = MQTTClient()
    client.create(program=None, clientID=clientID, broker=broker, port=port, topics=topics)
    client.run()

    print(f"Subscribed to {request['name']} on {broker}:{port}. Waiting for messages (Ctrl+C to exit)...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping...")
        client.client.loop_stop()
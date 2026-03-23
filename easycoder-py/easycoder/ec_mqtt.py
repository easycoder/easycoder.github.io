from cmath import log
from easycoder import Handler, ECObject, ECValue, RuntimeError
import paho.mqtt.client as mqtt
import time
import threading
import json
 
#############################################################################
# MQTT client class
class MQTTClient():
    def __init__(self):
        super().__init__()

    def create(self, program, token, clientID, broker, port, topics):
        self.program = program
        self.token = token
        self.clientID = clientID
        self.broker = broker
        self.port = port
        self.topics = topics
        self.onConnectPC = None
        self.onMessagePC = None
        self.timeout = False
        self.messages = {}
        self.chunked_messages = {}  # Store incoming chunked messages {topic: {part_num: data}}
        self.confirmation_lock = threading.Lock()
        self.chunk_size = 1024  # Default chunk size
        self.last_send_time = None  # Time taken for last message transmission (seconds)
        self.connected = False  # Track if we've processed initial connection
        self.client = mqtt.Client(
            client_id=self.clientID,
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2 # type: ignore
        )
        if broker == 'mqtt.flespi.io':
            self.client.username_pw_set(self.token, "")
            self.client.tls_set()  # Enable TLS for port 8883
        elif broker == 'test.mosquitto.org':
            pass
        else:
            if isinstance(self.token, dict):
                self.client.username_pw_set(self.token['username'], self.token['password'])
            self.client.tls_set()  # Enable TLS
    
        # Setup callbacks
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, reason_code, properties):
        # Only process connection logic once to avoid duplicate subscriptions and handlers
        if self.connected:
            # print(f"Client {self.clientID} reconnected (ignored)")
            return
            
        self.connected = True
        print(f"Client {self.clientID} connected")
        for item in self.topics:
            topic = self.program.getObject(self.program.getVariable(item))
            self.client.subscribe(topic.getName(), qos=topic.getQoS())
            print(f"Subscribed to topic: {topic.getName().strip()} with QoS {topic.getQoS()}")

        if self.onConnectPC is not None:
            self.program.queueIntent(self.onConnectPC)
    
    def on_message(self, client, userdata, msg):
        payload = msg.payload.decode('utf-8', errors='replace')
        topic = msg.topic
        
        # Check if this is a chunked message (format: "!part!<n> <total><data>")
        if payload.startswith('!part!'):
            # Extract: "!part!<n> <total><data>"
            header_end = payload.find(' ', 6)  # Find space after part number
            if header_end > 6:
                try:
                    part_num = int(payload[6:header_end])  # Extract part number
                    # Find next space to get total_chunks
                    total_end = payload.find(' ', header_end + 1)
                    if total_end > header_end:
                        total_chunks = int(payload[header_end + 1:total_end])
                        data = payload[total_end + 1:]  # Rest is data
                        
                        # Initialize chunked message storage if this is part 0
                        if part_num == 0:
                            self.chunked_messages[topic] = {}
                        
                        # Store this chunk with its part number
                        if topic in self.chunked_messages:
                            self.chunked_messages[topic][part_num] = data
                            # print(f"Received chunk {part_num}/{total_chunks - 1} on topic {topic}")
                except (ValueError, IndexError):
                    pass
            return
            
        elif payload.startswith('!last!'):
            # Final chunk: "!last!<total><data>"
            try:
                # Find where the total ends and data begins (first space after !last!)
                space_pos = payload.find(' ', 6)
                if space_pos > 6:
                    total_chunks = int(payload[6:space_pos])
                    data = payload[space_pos + 1:]  # Rest is data
                    
                    # Initialize topic storage if not present (single chunk case)
                    if topic not in self.chunked_messages:
                        self.chunked_messages[topic] = {}
                    
                    # Store the last chunk
                    self.chunked_messages[topic][total_chunks - 1] = data
                    
                    # Verify all chunks are present
                    expected_parts = set(range(total_chunks))
                    received_parts = set(self.chunked_messages[topic].keys())
                    
                    if expected_parts == received_parts:
                        # All chunks received - assemble complete message
                        message_parts = [self.chunked_messages[topic][i] for i in sorted(self.chunked_messages[topic].keys())]
                        complete_message = ''.join(message_parts)
                        del self.chunked_messages[topic]
                        
                        # Confirmation is now handled at the EasyCoder level
                        # print(f"All chunks received for topic {topic} ({len(complete_message)} bytes total).")
                        try:
                            self.message = json.loads(complete_message)
                        except:
                            self.message = complete_message
                        try:
                            self.message['message'] = json.loads(self.message['message']) # type: ignore
                        except:
                            pass
                        
                        if self.onMessagePC is not None:
                            # print(f'Calling onMessagePC callback: {self.onMessagePC}')
                            self.program.queueIntent(self.onMessagePC)
                    else:
                        missing = expected_parts - received_parts
                        print(f"Warning: Missing chunks {missing} for topic {topic}")
            except (ValueError, IndexError):
                pass
            return
    
    def getMessageTopic(self):
        return self.message.topic # type: ignore
    
    def getReceivedMessage(self):
        return self.message

    def onMessage(self, pc):
        self.onMessagePC = pc

    def sendMessage(self, topic, message, qos, chunk_size=0):
        """Send a message, chunking at the UTF-8 byte level.
        Stores transmission time in self.last_send_time (seconds).
        """
        send_start = time.time()
        if isinstance(message, bytes):
            message_str = message.decode('utf-8', errors='replace')
        else:
            message_str = str(message)

        message_bytes = message_str.encode('utf-8')
        if chunk_size <= 0:
            chunk_size = len(message_bytes) or 1  # avoid div-by-zero

        message_len = len(message_bytes)
        num_chunks = (message_len + chunk_size - 1) // chunk_size

        # print(f'Sending message ({message_len} bytes) in {num_chunks} chunks of size {chunk_size} to topic {topic} with QoS {qos}')

        self._send_rapid_fire(topic, message_bytes, qos, chunk_size, num_chunks)

        self.last_send_time = time.time() - send_start
        # print(f'Message transmission complete in {self.last_send_time:.3f} seconds')
    
    def _send_rapid_fire(self, topic, message_bytes, qos, chunk_size, num_chunks):
        """Send all chunks rapidly; chunking is done on UTF-8 bytes."""
        # print(f"Sending all {num_chunks} chunks as fast as possible...")
        for i in range(num_chunks):
            start = i * chunk_size
            end = min(start + chunk_size, len(message_bytes))
            chunk_data = message_bytes[start:end]

            if i == num_chunks - 1:
                header = f"!last!{num_chunks} ".encode('ascii')
            else:
                header = f"!part!{i} {num_chunks} ".encode('ascii')

            chunk_msg = header + chunk_data

            # Send without waiting
            try:
                self.client.publish(topic, chunk_msg, qos=qos)
                # print(f"Sent chunk {i}/{num_chunks - 1} to topic {topic} with QoS {qos}: {len(chunk_msg)} bytes")
            except Exception as e:
                print(f"Error publishing chunk {i}/{num_chunks - 1} to topic '{topic}': {e}")
        # No waiting here; confirmations are handled in EasyCoder using sender identity
    
    # Start the MQTT client loop
    def run(self):
        self.client.connect(self.broker, int(self.port), 60)
        self.client.loop_start()
        
###############################################################################
# An MQTT topic
class ECTopic(ECObject):
    def __init__(self):
        super().__init__()

    def getName(self):
        v = self.getValue()
        if v is None:
            return ""
        if v is None:
            return ""
        return v["name"]

    def getQoS(self):
        v = self.getValue()
        if v is None:
            return 0
        if v is None:
            return 0
        return int(v["qos"])
    
    def textify(self):
        v = self.getValue()
        if v is None:
            return ""
        return f'{{"name": "{v["name"]}", "qos": {v["qos"]}}}'

###############################################################################
###############################################################################
# The MQTT compiler and runtime handlers
class MQTT(Handler):

    MQTT_CLAUSE_KEYWORDS = {'token', 'id', 'broker', 'port', 'subscribe', 'action'}

    def __init__(self, compiler):
        Handler.__init__(self, compiler)
        self.spoke = None

    def getName(self):
        return 'mqtt'

    def decrypt_fernet_token(self, encrypted_token, secret_key):
        try:
            from cryptography.fernet import Fernet, InvalidToken
        except Exception as e:
            raise RuntimeError(self.program, "Missing dependency 'cryptography' for encrypted MQTT token support") from e

        try:
            cipher = Fernet(secret_key.encode('utf-8'))
            plain = cipher.decrypt(encrypted_token.encode('utf-8'))
            return plain.decode('utf-8')
        except (ValueError, InvalidToken) as e:
            raise RuntimeError(self.program, 'Invalid encrypted token/secret key or decryption failed') from e

    #############################################################################
    # Keyword handlers

    # init {topic} name {name} qos {qos}
    def k_init(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECTopic)
            command['topic'] = record['name']
            self.skip('name')
            name =self.nextValue()
            command['name'] = name
            self.skip('qos')
            command['qos'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_init(self, command):
        record = self.getVariable(command['topic'])
        topic = ECTopic()
        value = {}
        value['name'] = self.textify(command['name'])
        value['qos'] = int(self.textify(command['qos']))
        topic.setValue(value)
        record['object'] = topic
        return self.nextPC()

    # mqtt id {clientID} broker {broker} port {port} topics {topic} [and {topic} ...]
    def k_mqtt(self, command):
        command['requires'] = {}
        while True:
            token = self.peek()
            if token == 'token':
                self.nextToken()
                command['token'] = self.nextValue()
                if self.peek() not in self.MQTT_CLAUSE_KEYWORDS:
                    command['tokenKey'] = self.nextValue()
            elif token == 'id':
                self.nextToken()
                command['clientID'] = self.nextValue()
            elif token == 'broker':
                self.nextToken()
                command['broker'] = self.nextValue()
            elif token == 'port':
                self.nextToken()
                command['port'] = self.nextValue()
            elif token == 'subscribe':
                self.nextToken()
                topics = []
                while self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, ECTopic())
                    topics.append(record['name'])
                    if self.peek() == 'and': self.nextToken()
                    else:break
                command['topics'] = topics
            elif token == 'action':
                self.nextToken()
                reqList = []
                action = self.nextToken()
                if self.nextIs('requires'):
                    while True:
                        reqList.append(self.nextToken())
                        if self.peek() == 'and':
                            self.nextToken()
                        else:
                            break
                command['requires'][action] = reqList
            else:
                break
        self.add(command)
        return True

    def r_mqtt(self, command):
        if hasattr(self.program, 'mqttClient'):
            raise RuntimeError(self.program, 'MQQT client already defined')
        token = self.textify(command['token'])
        broker = self.textify(command['broker'])
        if 'tokenKey' in command:
            token_key = self.textify(command['tokenKey'])
            if broker == 'mqtt.flespi.io':
                token = self.decrypt_fernet_token(token, token_key)
            else:
                token = {'username': token, 'password': token_key}
        clientID = self.textify(command['clientID'])
        broker = self.textify(command['broker'])
        port = self.textify(command['port'])
        self.requires = command['requires']
        topics = command['topics']
        client = MQTTClient()
        client.create(self.program, token, clientID, broker, port, topics)
        client.run()
        self.program.mqttClient = client
        return self.nextPC()

    # on mqtt message {action}
    def k_on(self, command):
        token = self.peek()
        if token == 'mqtt':
            self.nextToken()
            event = self.nextToken()
            if event in ['connect', 'message']:
                command['event'] = event
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
        event = command['event']
        if event == 'connect':
            self.program.mqttClient.onConnectPC = self.nextPC()+1
        elif event == 'message':
            self.program.mqttClient.onMessagePC = self.nextPC()+1
        return command['goto']

    # send {message} to {topic}
    def k_send(self, command):
        if self.nextIs('to'):
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, ECTopic)
                command['to'] = record['name']
                while True:
                    token = self.peek()
                    if token in ('sender', 'action', 'message', 'qos'):
                        self.nextToken()
                        if token == 'sender':
                            if self.nextIsSymbol():
                                record = self.getSymbolRecord()
                                self.checkObjectType(record, ECTopic)
                                command['sender'] = record['name']
                        elif token == 'action':
                            command['action'] = self.nextValue()
                        elif token == 'qos':
                            command['qos'] = self.nextValue()
                        elif token == 'message':
                            command['message'] = self.nextValue()
                    else:
                        break
                self.add(command)
                return True

            command['message'] = self.nextValue()
            self.skip('to')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, MQTTClient)
                command['to'] = record['name']
                token = self.peek()
                if token == 'with':
                    self.nextToken()
                    while True:
                        token = self.nextToken()
                        if token == 'qos':
                            command['qos'] = self.nextValue()
                        if self.peek() == 'and':
                            self.nextToken()
                        else:
                            break
            self.add(command)
            return True
        return False

    def r_send(self, command):
        if not hasattr(self.program, 'mqttClient'):
            raise RuntimeError(self.program, 'No MQTT client defined')
        topic = self.getVariable(command['to'])
        qos = int(self.textify(command['qos'])) if 'qos' in command else 1
        payload = {}
        payload['sender'] = self.textify(self.getVariable(command['sender'])) if 'sender' in command else None
        action = self.textify(command['action']) if 'action' in command else None
        payload['action'] = action
        payload['message'] = self.textify(command['message']) if 'message' in command else None
#        print('Message: ', payload['message'])
        if action == None:
            raise RuntimeError(self.program, 'MQTT send command missing action field')
        if action in self.requires:
            requires = self.requires[action]
            for item in requires:
                if payload[item] is None:
                    raise RuntimeError(self.program, f'MQTT send command missing required field: {item}')  
        topicDict = self.getInnerObject(self.getObject(topic))
        topicName = topicDict['name']
#        print(json.dumps(payload))
        # print(f'Sending to topic {topicName} with QoS {qos}: {json.dumps(payload)[:20]}...')
        self.program.mqttClient.sendMessage(topicName, json.dumps(payload), qos, chunk_size=1024)  
        if self.program.mqttClient.timeout:
            return 0
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
        token = self.getToken()
        if token == 'the':
            token = self.nextToken()
        if self.isSymbol():
            record = self.getSymbolRecord()
            object = self.getObject(record)
            if isinstance(object, ECTopic):
                return ECValue(domain=self.getName(), type='topic', content=record['name'])
            else: return None
        else:
            if token == 'mqtt':
                token = self.nextToken()
                if token == 'message':
                    return ECValue(domain=self.getName(), type='mqtt', content=token)
            # else:
            #     return self.getValue()
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_message(self, v):
        return self.program.mqttClient.message
    
    def v_mqtt(self, v):
        content = v.getContent()
        if content == 'message':
            return self.program.mqttClient.message
        return None

    def v_topic(self, v):
        topic = self.getObject(self.getVariable(self.textify(v.getContent())))
        return f'{{"name": "{topic.getName()}", "qos": {topic.getQoS()}}}'

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        return None

    #############################################################################
    # Condition handlers

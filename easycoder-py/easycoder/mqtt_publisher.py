import paho.mqtt.client as mqtt
import json
import uuid
import time

def on_connect(client, userdata, flags, rc, properties=None):
    """Callback for when the client connects."""
    if rc == 0:
        print(f"✅ {userdata['client_id']} connected to Flespi")
        # Subscribe to personal reply topic
        reply_topic = userdata["reply_topic"]
        client.subscribe(reply_topic)
        print(f"📡 Subscribed to reply topic: {reply_topic}")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback for when a message is received on reply topic."""
    print(f"\n📨 {userdata['client_id']} received reply:")
    print(f"   Topic: {msg.topic}")
    print(f"   Message: {msg.payload.decode()}")

def on_disconnect(client, userdata, disconnect_flags, reason_code, properties=None):
    print(f"⚠️  {userdata['client_id']} disconnected")

class MQTTClient:
    def __init__(self, client_id, flespi_token):
        self.client_id = client_id
        self.reply_topic = f"replies/{client_id}"
        self.flespi_token = flespi_token
        
        # Create client with userdata
        self.client = mqtt.Client(
            client_id=client_id,
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2, # type: ignore
            userdata={
                "client_id": client_id,
                "reply_topic": self.reply_topic
            }
        )
        
        # Set credentials - Flespi uses token as username, empty password
        self.client.username_pw_set(flespi_token, "")
        self.client.tls_set()
        
        # Set callbacks
        self.client.on_connect = on_connect
        self.client.on_message = on_message
        self.client.on_disconnect = on_disconnect
        
    def send_request(self, data):
        """Send a request to the central listener."""
        request_topic = f"requests/{self.client_id}"
        
        message = {
            "from": self.client_id,
            "reply_to": self.reply_topic,  # Return address
            "data": data,
            "message_id": str(uuid.uuid4()),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        payload = json.dumps(message)
        result = self.client.publish(request_topic, payload)
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"📤 {self.client_id} sent request to {request_topic}")
        else:
            print(f"❌ Failed to send message: {result.rc}")
    
    def start(self):
        """Connect and start the client loop."""
        try:
            self.client.connect("mqtt.flespi.io", 8883, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"❌ Connection error: {e}")
    
    def stop(self):
        """Stop the client."""
        self.client.loop_stop()
        self.client.disconnect()

# Example usage
if __name__ == "__main__":
    FLESPI_TOKEN = "kgDkpyDUubtAchcj9ts85QPJOwE1C2MKjNuoeb4nisd23pM33uTb5m7AGuMNhJMP"
    
    # Create a test client
    client1 = MQTTClient("device_001", FLESPI_TOKEN)
    client1.start()
    
    # Wait for connection
    time.sleep(2)
    
    # Send some test messages
    for i in range(3):
        client1.send_request({
            "request_type": "data_update",
            "value": i * 10,
            "iteration": i
        })
        time.sleep(1)  # Wait between messages
    
    # Keep running to receive replies
    print("\n⏳ Waiting for replies (Ctrl+C to stop)...")
    try:
        time.sleep(10)
    except KeyboardInterrupt:
        print("\n🛑 Stopping...")
    
    client1.stop()
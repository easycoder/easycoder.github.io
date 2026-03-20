import paho.mqtt.client as mqtt
import json
import time

def on_connect(client, userdata, flags, rc, properties=None):
    """Callback for when the client connects to the broker."""
    if rc == 0:
        print("✅ Connected successfully to Flespi")
        # Subscribe to all request topics
        client.subscribe("requests/#")
        print("📡 Subscribed to 'requests/#'")
    else:
        print(f"❌ Connection failed with code {rc}")

def on_message(client, userdata, msg):
    """Callback for when a message is received."""
    print(f"\n📨 Received message on topic: {msg.topic}")
    print(f"   Payload: {msg.payload.decode()}")
    
    try:
        # Parse the JSON payload
        data = json.loads(msg.payload.decode())
        
        # Extract sender from topic (e.g., "requests/client001" -> "client001")
        sender_id = msg.topic.split('/')[-1] if '/' in msg.topic else "unknown"
        
        # Get the reply topic from the message, or use default
        reply_topic = data.get("reply_to", f"replies/{sender_id}")
        
        # Process the request (this is your business logic)
        print(f"   Sender: {sender_id}")
        print(f"   Reply to: {reply_topic}")
        
        # Create a response
        response = {
            "status": "processed",
            "original_sender": sender_id,
            "original_topic": msg.topic,
            "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "message": f"Hello {sender_id}, your request has been processed",
            "original_data": data
        }
        
        # Publish the response to the reply topic
        client.publish(reply_topic, json.dumps(response))
        print(f"✅ Replied to: {reply_topic}")
        
    except json.JSONDecodeError:
        print("❌ Error: Message is not valid JSON")
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def on_disconnect(client, userdata, disconnect_flags, reason_code, properties=None):
    print(f"⚠️  Disconnected with code: {reason_code}")

def main():
    # Configuration
    FLESPI_TOKEN = "kgDkpyDUubtAchcj9ts85QPJOwE1C2MKjNuoeb4nisd23pM33uTb5m7AGuMNhJMP"  # Replace with your token
    
    # Create MQTT client
    client = mqtt.Client(
        client_id="central_listener",
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2 # type: ignore
    )    
    # Set credentials - Flespi uses token as username, empty password
    client.username_pw_set(FLESPI_TOKEN, "")
    
    # Enable TLS for secure connection (port 8883)
    client.tls_set()
    
    # Set callbacks
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    
    # Connect to Flespi
    print("🔌 Connecting to Flespi MQTT broker...")
    try:
        client.connect("mqtt.flespi.io", 8883, 60)
        
        # Start the network loop
        print("🔄 Starting message loop...")
        client.loop_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        client.disconnect()
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    main()
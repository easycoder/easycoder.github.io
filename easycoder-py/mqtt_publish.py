#!/usr/bin/env python3
"""Simple MQTT publisher for testing"""
import paho.mqtt.client as mqtt
import sys
import time

# Configuration
BROKER = "mqtt.flespi.io"
PORT = 8883
TOKEN = "10RKW59yIvqbvyWfhLaVUx0dIyknVPJwL2CgFNTlcPFhg91aOCoN2UoYzgBQqtdC"
TOPIC = "test/easycoder"
USE_TLS = True

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")

def on_publish(client, userdata, mid, reason_code, properties):
    print(f"Message {mid} published")

def main():
    # Parse command line arguments
    topic = TOPIC
    message = "Test message"
    
    if len(sys.argv) > 1:
        topic = sys.argv[1]
    if len(sys.argv) > 2:
        message = " ".join(sys.argv[2:])
    
    print(f"Starting MQTT publisher...")
    print(f"Broker: {BROKER}:{PORT}")
    print(f"Topic: {topic}")
    print(f"Message: {message}")
    
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"publisher_{TOKEN[:8]}")
    
    if USE_TLS:
        client.username_pw_set("flespi", TOKEN)
        client.tls_set()
    
    client.on_connect = on_connect
    client.on_publish = on_publish
    
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    # Wait for connection
    time.sleep(1)
    
    # Publish message
    result = client.publish(topic, message, qos=1)
    
    # Wait for publish to complete
    time.sleep(1)
    
    client.loop_stop()
    client.disconnect()
    print("Done.")

if __name__ == "__main__":
    main()

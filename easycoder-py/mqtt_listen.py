#!/usr/bin/env python3
"""Simple MQTT listener for testing"""
import paho.mqtt.client as mqtt
import sys

# Configuration
BROKER = "mqtt.flespi.io"
PORT = 8883
TOKEN = "10RKW59yIvqbvyWfhLaVUx0dIyknVPJwL2CgFNTlcPFhg91aOCoN2UoYzgBQqtdC"
TOPIC = "test/easycoder"
USE_TLS = True

def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    client.subscribe(TOPIC)
    print(f"Subscribed to {TOPIC}")

def on_message(client, userdata, msg):
    print(f"\n[{msg.topic}] {msg.payload.decode('utf-8')}")

def main():
    # Allow topic override from command line
    topic = sys.argv[1] if len(sys.argv) > 1 else TOPIC
    
    print(f"Starting MQTT listener...")
    print(f"Broker: {BROKER}:{PORT}")
    print(f"Topic: {topic}")
    
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"listener_{TOKEN[:8]}")
    
    if USE_TLS:
        client.username_pw_set("flespi", TOKEN)
        client.tls_set()
    
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Override topic in callback if provided
    if len(sys.argv) > 1:
        TOPIC = topic
        client.on_connect = lambda c, u, f, r, p: (
            print(f"Connected with result code {r}"),
            c.subscribe(topic),
            print(f"Subscribed to {topic}")
        )
    
    client.connect(BROKER, PORT, 60)
    
    print("Listening for messages... (Ctrl+C to exit)")
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nDisconnecting...")
        client.disconnect()

if __name__ == "__main__":
    main()

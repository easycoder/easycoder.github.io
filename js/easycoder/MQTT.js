/**
 * EasyCoder MQTT Plugin for JavaScript
 * 
 * Provides MQTT client functionality with support for:
 * - Topic declaration and subscription
 * - MQTT client connection
 * - Message publishing and receiving
 * - Message chunking for large payloads
 * - Event handlers (on connect, on message)
 * 
 * Based on the Python implementation in ec_mqtt.py
 * Requires: MQTT.js library (https://github.com/mqttjs/MQTT.js)
 */

const EasyCoder_MQTT = {

    name: `EasyCoder_MQTT`,

    // MQTT Client class
    MQTTClient: class {
        constructor() {
            this.program = null;
            this.token = null;
            this.clientID = null;
            this.broker = null;
            this.port = null;
            this.topics = [];
            this.client = null;
            this.onConnectPC = null;
            this.onMessagePC = null;
            this.message = null;
            this.chunkedMessages = {};  // Store incoming chunked messages
            this.chunkSize = 1024;      // Default chunk size
            this.lastSendTime = null;   // Time for last transmission
            this.connected = false;     // Ignore duplicate reconnect callbacks
        }

        create(program, token, clientID, broker, port, topics) {
            this.program = program;
            this.token = token;
            this.clientID = clientID;
            this.broker = broker;
            this.port = parseInt(port, 10);
            this.topics = topics || [];
            const isBrowser = typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined';

            let url;
            const options = {
                clientId: this.clientID
            };

            if (this.broker === 'mqtt.flespi.io') {
                const wsPort = this.port === 8883 ? 443 : this.port;
                url = isBrowser
                    ? `wss://${this.broker}:${wsPort}`
                    : `mqtts://${this.broker}:${this.port}`;
                options.username = this.token;
                options.password = '';
            } else if (this.broker === 'test.mosquitto.org') {
                url = isBrowser
                    ? `wss://${this.broker}:8081`
                    : `mqtt://${this.broker}:${this.port}`;
            } else {
                throw new Error('Unsupported MQTT broker');
            }

            this.client = mqtt.connect(url, options);

            // Setup event handlers
            this.client.on('connect', () => this.onConnect());
            this.client.on('message', (topic, payload) => this.onMessage(topic, payload));
            this.client.on('error', (error) => console.error('MQTT connection error:', error));
            this.client.on('close', () => console.warn('MQTT connection closed'));
        }

        onConnect() {
            if (this.connected) {
                return;
            }

            this.connected = true;
            EasyCoder.writeToDebugConsole(`Client ${this.clientID} connected`);
            
            // Subscribe to all topics
            for (const topicName of this.topics) {
                const topicRecord = this.program.getSymbolRecord(topicName);
                const topic = topicRecord.object;
                const qos = topic.getQoS();
                this.client.subscribe(topic.getName(), { qos });
                EasyCoder.writeToDebugConsole(`Subscribed to topic: ${topic.getName()} with QoS ${qos}`);
            }

            this._queueProgramCallback(this.onConnectPC);
        }

        onMessage(topic, payload) {
            const payloadBytes = this._toUint8Array(payload);
            if (this._startsWithAscii(payloadBytes, '!part!')) {
                try {
                    const partEnd = this._indexByte(payloadBytes, 0x20, 6); // space
                    if (partEnd > 6) {
                        const partNum = this._parseAsciiInt(payloadBytes.slice(6, partEnd));
                        const totalEnd = this._indexByte(payloadBytes, 0x20, partEnd + 1);
                        if (totalEnd > partEnd) {
                            const totalChunks = this._parseAsciiInt(payloadBytes.slice(partEnd + 1, totalEnd));
                            const data = payloadBytes.slice(totalEnd + 1);

                            if (partNum === 0) {
                                this.chunkedMessages[topic] = {};
                            }

                            if (this.chunkedMessages[topic]) {
                                this.chunkedMessages[topic][partNum] = data;
                                // EasyCoder.writeToDebugConsole(`Received chunk ${partNum}/${totalChunks - 1} on topic ${topic}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing chunked message:', e);
                }
                return;
            }

            if (this._startsWithAscii(payloadBytes, '!last!')) {
                try {
                    const totalEnd = this._indexByte(payloadBytes, 0x20, 6); // space
                    if (totalEnd > 6) {
                        const totalChunks = this._parseAsciiInt(payloadBytes.slice(6, totalEnd));
                        const data = payloadBytes.slice(totalEnd + 1);

                        if (!this.chunkedMessages[topic]) {
                            this.chunkedMessages[topic] = {};
                        }

                        this.chunkedMessages[topic][totalChunks - 1] = data;

                        const expectedParts = new Set();
                        for (let i = 0; i < totalChunks; i++) {
                            expectedParts.add(i);
                        }
                        const receivedParts = new Set(Object.keys(this.chunkedMessages[topic]).map(k => parseInt(k)));

                        if (expectedParts.size === receivedParts.size &&
                            [...expectedParts].every(p => receivedParts.has(p))) {
                            const messageParts = [];
                            for (let i = 0; i < totalChunks; i++) {
                                messageParts.push(this.chunkedMessages[topic][i]);
                            }
                            const completeMessage = this._decodeUtf8(this._concatBytes(messageParts));
                            delete this.chunkedMessages[topic];

                            try {
                                this.message = JSON.parse(completeMessage);
                                try {
                                    this.message.message = JSON.parse(this.message.message);
                                } catch (e) {
                                }
                            } catch (e) {
                                this.message = completeMessage;
                            }

                            this._queueProgramCallback(this.onMessagePC);
                        } else {
                            console.warn('Warning: Missing chunks for topic ' + topic);
                        }
                    }
                } catch (e) {
                    console.error('Error assembling chunked message:', e);
                }
                return;
            }

            const message = this._decodeUtf8(payloadBytes);

            // Regular non-chunked message
            try {
                this.message = JSON.parse(message);
                try {
                    this.message.message = JSON.parse(this.message.message);
                } catch (e) {
                    // Leave message as string
                }
            } catch (e) {
                this.message = message;
            }

            this._queueProgramCallback(this.onMessagePC);
        }

        getReceivedMessage() {
            let value = this.message;
            value = value && value.message ? value.message : value;
            return value;
        }

        sendMessage(topic, message, qos, chunkSize) {
            const sendStart = Date.now();
            // Match Python behavior: non-positive chunk size means "single chunk"
            chunkSize = Number(chunkSize || 0);

            // Convert message to string
            let messageStr;
            if (message instanceof Uint8Array) {
                messageStr = this._decodeUtf8(message);
            } else if (typeof message === 'string') {
                messageStr = message;
            } else {
                messageStr = String(message);
            }

            // Convert to UTF-8 bytes
            const encoder = new TextEncoder();
            const messageBytes = encoder.encode(messageStr);
            if (chunkSize <= 0) {
                chunkSize = messageBytes.length || 1;
            }
            const messageLen = messageBytes.length;
            const numChunks = Math.ceil(messageLen / chunkSize);

            // EasyCoder.writeToDebugConsole(`Sending message (${messageLen} bytes) in ${numChunks} chunks of size ${chunkSize} to topic ${topic} with QoS ${qos}`);

            this._sendRapidFire(topic, messageBytes, qos, chunkSize, numChunks);

            this.lastSendTime = (Date.now() - sendStart) / 1000;
            // EasyCoder.writeToDebugConsole(`Message transmission complete in ${this.lastSendTime.toFixed(3)} seconds`);
        }

        _sendRapidFire(topic, messageBytes, qos, chunkSize, numChunks) {
            for (let i = 0; i < numChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, messageBytes.length);
                const chunkData = messageBytes.slice(start, end);

                let header;
                if (i === numChunks - 1) {
                    header = `!last!${numChunks} `;
                } else {
                    header = `!part!${i} ${numChunks} `;
                }

                const headerBytes = new TextEncoder().encode(header);
                const chunkMsg = this._concatBytes([headerBytes, chunkData]);
                this.client.publish(topic, chunkMsg, { qos });
                // EasyCoder.writeToDebugConsole(`Sent chunk ${i}/${numChunks - 1} to topic ${topic} with QoS ${qos}: ${chunkMsg.byteLength} bytes`);
            }
        }

        _toUint8Array(value) {
            if (value instanceof Uint8Array) {
                return value;
            }
            if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
                return new Uint8Array(value);
            }
            if (typeof value === 'string') {
                return new TextEncoder().encode(value);
            }
            if (value && value.buffer instanceof ArrayBuffer) {
                return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || 0);
            }
            return new Uint8Array(0);
        }

        _decodeUtf8(bytes) {
            return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        }

        _concatBytes(parts) {
            const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
            const merged = new Uint8Array(total);
            let offset = 0;
            for (const part of parts) {
                merged.set(part, offset);
                offset += part.byteLength;
            }
            return merged;
        }

        _startsWithAscii(bytes, text) {
            const ascii = new TextEncoder().encode(text);
            if (bytes.byteLength < ascii.byteLength) {
                return false;
            }
            for (let i = 0; i < ascii.byteLength; i++) {
                if (bytes[i] !== ascii[i]) {
                    return false;
                }
            }
            return true;
        }

        _indexByte(bytes, byteValue, fromIndex) {
            for (let i = fromIndex; i < bytes.byteLength; i++) {
                if (bytes[i] === byteValue) {
                    return i;
                }
            }
            return -1;
        }

        _parseAsciiInt(bytes) {
            const parsed = parseInt(new TextDecoder('ascii').decode(bytes), 10);
            if (Number.isNaN(parsed)) {
                throw new Error('Invalid numeric header');
            }
            return parsed;
        }

        _queueProgramCallback(pc) {
            if (pc === null || pc === undefined) {
                return;
            }
            if (this.program && typeof this.program.queueIntent === 'function') {
                this.program.queueIntent(pc);
                return;
            }
            if (this.program && typeof this.program.run === 'function') {
                this.program.run(pc);
            }
        }
    },

    // ECTopic class - represents an MQTT topic
    ECTopic: class {
        constructor() {
            this.value = null;
        }

        setValue(value) {
            this.value = value;
        }

        getValue() {
            return this.value;
        }

        getName() {
            if (!this.value) return '';
            return this.value.name || '';
        }

        getQoS() {
            if (!this.value) return 0;
            return parseInt(this.value.qos) || 0;
        }

        textify() {
            if (!this.value) return '';
            return JSON.stringify({
                name: this.value.name,
                qos: this.value.qos
            });
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: init {topic} name {name} qos {qos}
    Init: {
        compile: compiler => {
            const lino = compiler.getLino();
            if (compiler.nextIsSymbol()) {
                const record = compiler.getSymbolRecord();
                const topic = record.name;
                compiler.skip('name');
                const name = compiler.getValue();
                compiler.skip('qos');
                const qos = compiler.getValue();
                
                compiler.addCommand({
                    domain: 'mqtt',
                    keyword: 'init',
                    lino,
                    topic,
                    name,
                    qos
                });
                return true;
            }
            return false;
        },

        run: program => {
            const command = program[program.pc];
            const record = program.getSymbolRecord(command.topic);
            const topic = new EasyCoder_MQTT.ECTopic();
            const value = {
                name: program.getValue(command.name),
                qos: parseInt(program.getValue(command.qos))
            };
            topic.setValue(value);
            record.object = topic;
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: mqtt token {token} id {clientID} broker {broker} port {port} subscribe {topic} [and {topic} ...]
    MQTT: {
        compile: compiler => {
            const lino = compiler.getLino();
            const command = {
                domain: 'mqtt',
                keyword: 'mqtt',
                lino,
                requires: {},
                topics: []
            };

            compiler.nextToken(); // skip 'mqtt'
            while (true) {
                const token = compiler.getToken();
                if (token === 'token') {
                    command.token = compiler.getNextValue();
                } else if (token === 'id') {
                    command.clientID = compiler.getNextValue();
                } else if (token === 'broker') {
                    command.broker = compiler.getNextValue();
                } else if (token === 'port') {
                    command.port = compiler.getNextValue();
                } else if (token === 'subscribe') {
                    const topics = [];
                    while (compiler.nextIsSymbol()) {
                        const record = compiler.getSymbolRecord();
                        topics.push(record.name);
                        if (compiler.peek() === 'and') {
                            compiler.next();
                        } else {
                            compiler.next();
                            break;
                        }
                    }
                    command.topics = topics;
                } else if (token === 'action') {
                    const action = compiler.nextToken();
                    const reqList = [];
                    if (compiler.nextIs('requires')) {
                        while (true) {
                            reqList.push(compiler.nextToken());
                            if (compiler.peek() === 'and') {
                                compiler.next();
                            } else {
                                compiler.next();
                                break;
                            }
                        }
                    }
                    command.requires[action] = reqList;
                } else {
                    break;
                }
            }

            compiler.addCommand(command);
            return true;
        },

        run: program => {
            const command = program[program.pc];
            
            if (program.mqttClient) {
                program.runtimeError(command.lino, 'MQTT client already defined');
            }

            const token = program.getValue(command.token);
            const clientID = program.getValue(command.clientID);
            const broker = program.getValue(command.broker);
            const port = program.getValue(command.port);
            const topics = command.topics;

            const client = new EasyCoder_MQTT.MQTTClient();
            try {
                client.create(program, token, clientID, broker, port, topics);
            } catch (error) {
                program.runtimeError(command.lino, error.message || String(error));
            }
            program.mqttClient = client;
            program.mqttRequires = command.requires;

            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: on mqtt (connect|message) {action}
    On: {
        compile: compiler => {
            const lino = compiler.getLino();
            const token = compiler.peek();
            
            if (token === 'mqtt') {
                compiler.next();
                const event = compiler.nextToken();
                
                if (event === 'connect' || event === 'message') {
                    compiler.next();
                    
                    const command = {
                        domain: 'mqtt',
                        keyword: 'on',
                        lino,
                        event,
                        goto: 0
                    };
                    compiler.addCommand(command);
				    return compiler.completeHandler();
                }
            }
            return false;
        },

        run: program => {
            const command = program[program.pc];
            const event = command.event;

            if (!program.mqttClient) {
                program.runtimeError(command.lino, 'No MQTT client defined');
            }
            
            if (event === 'connect') {
                program.mqttClient.onConnectPC = command.pc + 2;
            } else if (event === 'message') {
                program.mqttClient.onMessagePC = command.pc + 2;
            }
            
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: send mqtt {message} to {topic} [with qos {qos}] [sender {sender}] [action {action}] [message {message}]
    Send: {
        compile: compiler => {
            const lino = compiler.getLino();
            const command = {
                domain: 'mqtt',
                keyword: 'send',
                lino,
                qos: 1  // default QoS
            };

            // First check for "send mqtt" or "send to"
            if (compiler.nextTokenIs('to')) {
                if (compiler.nextIsSymbol()) {
                    const record = compiler.getSymbolRecord();
                    command.to = record.name;
                    compiler.nextToken()

                    // Parse optional parameters
                    while (true) {
                        const token = compiler.getToken();
                        if (token === 'sender' || token === 'action' || 
                            token === 'qos' || token === 'message') {
                            
                            if (token === 'sender') {
                                if (compiler.nextIsSymbol()) {
                                    const rec = compiler.getSymbolRecord();
                                    command.sender = rec.name;
                                    compiler.nextToken();
                                }
                            } else if (token === 'action') {
                                command.action = compiler.getNextValue();
                            } else if (token === 'qos') {
                                command.qos = compiler.getNextValue();
                            } else if (token === 'message') {
                                command.message = compiler.getNextValue();
                            }
                        } else {
                            break;
                        }
                    }

                    compiler.addCommand(command);
                    return true;
                }
            } else {
                // Format: send mqtt {message} to {topic}
                command.message = compiler.getNextValue();
                compiler.skip('to');
                
                if (compiler.nextIsSymbol()) {
                    const record = compiler.getSymbolRecord();
                    command.to = record.name;
                    
                    const token = compiler.peek();
                    if (token === 'with') {
                        compiler.next();
                        while (true) {
                            const tok = compiler.nextToken();
                            if (tok === 'qos') {
                                command.qos = compiler.getNextValue();
                            }
                            if (compiler.peek() === 'and') {
                                compiler.next();
                            } else {
                                break;
                            }
                        }
                    }
                    
                    compiler.addCommand(command);
                    return true;
                }
            }
            
            return false;
        },

        run: program => {
            const command = program[program.pc];
            
            if (!program.mqttClient) {
                program.runtimeError(command.lino, 'No MQTT client defined');
            }

            const topicRecord = program.getSymbolRecord(command.to);
            const topic = topicRecord.object;
            const qos = command.qos ? parseInt(program.getValue(command.qos)) : 1;

            // Build payload
            const payload = {};
            
            if (command.sender) {
                const senderRecord = program.getSymbolRecord(command.sender);
                payload.sender = senderRecord.object.textify();
            }
            
            payload.action = command.action ? program.getValue(command.action) : null;
            payload.message = command.message ? program.getValue(command.message) : null;

            // Validate required fields
            if (!payload.action) {
                program.runtimeError(command.lino, 'MQTT send command missing action field');
            }

            // Check action requirements
            if (program.mqttRequires && program.mqttRequires[payload.action]) {
                const requires = program.mqttRequires[payload.action];
                for (const item of requires) {
                    if (!payload[item]) {
                        program.runtimeError(command.lino, `MQTT send command missing required field: ${item}`);
                    }
                }
            }

            const topicName = topic.getName();
            // EasyCoder.writeToDebugConsole(`MQTT Publish to ${topicName} with QoS ${qos}: ${JSON.stringify(payload)}`);
            program.mqttClient.sendMessage(topicName, JSON.stringify(payload), qos, 1024);

            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Command: topic {name}
    Topic: {
        compile: compiler => {
			compiler.compileVariable(`mqtt`, `topic`);
			return true;
        },

        run: program => {
            const command = program[program.pc];
            return command.pc + 1;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Value handlers
    value: {
        compile: compiler => {
            let token = compiler.getToken();
            
            if (token === 'the') {
                token = compiler.nextToken();
            }

            if (compiler.isSymbol()) {
                const record = compiler.getSymbolRecord();
                if (record.object && record.object instanceof EasyCoder_MQTT.ECTopic) {
                    return {
                        domain: 'mqtt',
                        type: 'topic',
                        content: record.name
                    };
                }
            } else if (token === 'mqtt') {
                token = compiler.nextToken();
                if (token === 'message') {
                    compiler.nextToken();
                    return {
                        domain: 'mqtt',
                        type: 'mqtt',
                        content: 'message'
                    };
                }
            }

            return null;
        },

        get: (program, value) => {
            if (value.type === 'mqtt') {
                if (value.content === 'message') {
                    const message = program.mqttClient ? program.mqttClient.getReceivedMessage() : null;
                    let content = '';
                    if (typeof message === 'string') {
                        content = message;
                    } else if (message === null || typeof message === 'undefined') {
                        content = '';
                    } else {
                        try {
                            content = JSON.stringify(message, null, 2);
                        } catch (error) {
                            content = String(message);
                        }
                    }
                    return {
                        type: 'constant',
                        numeric: false,
                        content
                    };
                }
            } else if (value.type === 'topic') {
                const record = program.getSymbolRecord(value.content);
                const topic = record.object;
                return {
                    type: 'constant',
                    numeric: false,
                    content: topic.textify()
                };
            }
            return null;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Condition handlers
    condition: {
        compile: () => {
            return {};
        },

        test: () => {
            return false;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Dispatcher - routes keywords to handlers
    getHandler: (name) => {
        switch (name) {
            case 'init':
                return EasyCoder_MQTT.Init;
            case 'mqtt':
                return EasyCoder_MQTT.MQTT;
            case 'on':
                return EasyCoder_MQTT.On;
            case 'send':
                return EasyCoder_MQTT.Send;
            case 'topic':
                return EasyCoder_MQTT.Topic;
            default:
                return null;
        }
    },

    /////////////////////////////////////////////////////////////////////////////
    // Main compile handler
    compile: (compiler) => {
        const token = compiler.getToken();
        const handler = EasyCoder_MQTT.getHandler(token);
        
        if (!handler) {
            return false;
        }
        
        return handler.compile(compiler);
    },

    /////////////////////////////////////////////////////////////////////////////
    // Main run handler
    run: (program) => {
        const command = program[program.pc];
        const handler = EasyCoder_MQTT.getHandler(command.keyword);
        
        if (!handler) {
            program.runtimeError(command.lino, `Unknown keyword '${command.keyword}' in 'mqtt' package`);
        }
        
        return handler.run(program);
    }
};

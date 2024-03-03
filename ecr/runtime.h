class Runtime {

    private:

        // An array containing the commands in the compiled code.
        // This roughly corresponds to lines of the original script
        TextArray* codeArray;
        // An array of unique text items found in the script
        TextArray* keyArray;
        // An array of commands, where each is a single element or an array of elements
        CommandArray* commands;
        // An array of symbols
        SymbolArray* symbols;
        // An array of keyword objects, one for each element of the code array
        KeywordArray* keywordArray;
        // The command that is to be executed
        Command* command;
        // The keyword id for the current command
        int keywordCode;
        // The current program counter
        int pc;
        // The value types
        TextArray* valueTypes;
        // A temporary value to hold the index of a command getCommandProperty
        int commandPropertyIndex;

        // Constants
        Text* c_openBrace = new Text("{");
        Text* c_target = new Text("target");

        ///////////////////////////////////////////////////////////////////////
        // Set up the value types
        void setupValueTypes() {
            valueTypes = new TextArray("valueTypes");
            valueTypes->add("text");
            valueTypes->add("int");
            valueTypes->add("boolean");
            valueTypes->add("symbol");
            valueTypes->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a symbol
        Symbol* getSymbol(const char* key) {
            const char* keyCode = nullptr;
            const char* nameCode = nullptr;
            Element* element;
            Text* left;
            Text* right;
            int index;
            // Get the key of the variable
            for (int index = 0; index < command->getSize(); index++) {
                element = command->get(index);
                int colon = element->positionOf(':');
                if (colon < 0) {
                    continue;
                }
                left = element->left(colon);
                right = element->from(colon + 1);
                // If this one matches, break out.
                if (keyArray->get(left)->is(key)) {
                    keyCode = left->getText();
                    nameCode = right->getText();
                    break;
                } else {
                    delete left;
                    delete right;
                    continue;
                }
            }
            if (nameCode == nullptr) {
                printf("Key '%s' not found in command\n", key);
                command->dump();
                exit(1);
            }
            // Now we have the key code, so check if it has a # prefix
            Symbol* symbol;
            if (nameCode[0] != '#') {
                // This is the first time this symbol has been seen
                // Get the symbol's name
                Text* name = keyArray->get(atoi(nameCode));
                // Look up the symbol
                for (int s = 0; s < symbols->getSize(); s++) {
                    symbol = symbols->get(s);
                    if (symbol->getName()->is(name)) {
                        // Replace the symbol name key with its index prefixed by #
                        char buf[16];
                        strcpy(buf, keyCode);
                        strcat(buf, ":#");
                        sprintf(&buf[strlen(buf)],"%d", s);
                        element->setElement(new Text(buf));
                        break;
                    }
                }
            } else {
                // It's been seen before, so fetch it directly
                symbol = symbols->get(atoi(&nameCode[1]));
            }
            delete left;
            delete right;
            return symbol;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get items from an {a}:{b} pair
        // If 'select' is false return the key; if true return the value
        // This will always be a text constant (so it doesn't need to be deleted)
        Text* getItemText(int n, bool select) {
            Element* element = command->get(n);
            if (element->is("}")) {
                return element->getElement();
            }
            int colon = element->positionOf(':');
            if (colon < 0) {
                return nullptr;
            }
            Text* left = element->left(colon);
            Text* right = element->from(colon + 1);
            Text* retval;
            if (right->is("{")) {
                retval = c_openBrace;
            }
            else {
                retval = keyArray->get(atoi((select ? right : left)->getText()));
            }
            delete left;
            delete right;
            return retval;
        }

    public:

        void setCodeArray(TextArray* arg) { codeArray = arg; }
        TextArray* getCodeArray() { return codeArray; }
        void setKeyArray(TextArray* arg) { keyArray = arg; }
        TextArray* getKeyArray() { return keyArray; }
        void setCommands(CommandArray* arg) { commands = arg; }
        CommandArray* getCommands() { return commands; }
        void setSymbols(SymbolArray* arg) { symbols = arg; }
        SymbolArray* getSymbols() { return symbols; }
        void setKeywordArray(KeywordArray* arg) { keywordArray = arg; }
        KeywordArray* getKeywordArray() { return keywordArray; }
        void setCommand(Command* arg) { command = arg; }
        Command* getCommand() { return command; }
        void setKeywordCode(int arg) { keywordCode = arg; }
        int getKeywordCode() { return keywordCode; }
        void setPC(int arg) { pc = arg; }
        int getPC() { return pc; }

        ///////////////////////////////////////////////////////////////////////
        // Find a named command property
        Text* getCommandProperty(int n, const char* key) {
            for (; n < command->getSize(); n++) {
                Text* item = getItemText(n, false);
                if (item == nullptr) {
                    continue;
                } else if (item->is(key)) {
                    return getItemText(n, true);
                }
            }
            return nullptr;
        }

        Text* getCommandProperty(int n, Text* key) {
            return getCommandProperty(n, key->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a named command property
        Text* getCommandProperty(const char* key) {
            int n = 0;
            Text* prop = nullptr;
            while (n < command->getSize()) {
                prop = getCommandProperty(n, key);
                if (prop != nullptr) {
                    break;
                }
                n++;
            }
            commandPropertyIndex = n;
            return prop;
        }

        ///////////////////////////////////////////////////////////////////////
        // Process values recursively
        // This is entered when an element <n>:{ is found, where <n>
        // is the key code for an element such as "value".
        RuntimeValue* getRuntimeValue(int n) {
            RuntimeValue* runtimeValue = new RuntimeValue();
            while (true) {
                // Get the value type
                Text* valueType = getCommandProperty(n, "type");
                if (valueTypes->contains(valueType)) {
                    Text* content = getCommandProperty(n, "content");
                    // Deal with each of the value types
                    if (valueType->is("text")) {
                        runtimeValue->setTextValue(content->getText());
                        return runtimeValue;
                    } else if (valueType->is("int")) {
                        runtimeValue->setIntValue(atoi(content->getText()));
                        return runtimeValue;
                    } else if (valueType->is("boolean")) {
                        runtimeValue->setBoolValue(content->is("true"));
                        return runtimeValue;
                    } else if (valueType->is("symbol")) {
                        Symbol* symbol = getSymbol("name");
                        symbol->detach();
                        return symbol->getValue();
                    } else{
                        printf("Unrecognized value type %s in item %s:\n", valueType->getText(), command->get(n)->getElement()->getText());
                        command->dump();
                        exit(1);
                    }
                } else {
                    printf("Value type %s not found in %s:\n", valueType->getText(), command->get(n)->getElement()->getText());
                    command->dump();
                    exit(1);
                }
            }
            printf("Value not found in %s:\n", command->get(n)->getElement()->getText());
            command->dump();
            exit(1);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named element of a command
        RuntimeValue* getRuntimeValue(const char* name) {
            // Look for this name then process it
            Text* valueType = getCommandProperty(0, "value");
            for (int n = 0; n < command->getSize(); n++) {
                Element* element = command->get(n);
                // Deal with lines of the form <n>:<m>
                int colon = element->positionOf(':');
                if (colon > 0) {
                    Text* left = element->left(colon);
                    if (keyArray->get(left)->is(name)) {
                        // Verify that the right-hand element is an open brace
                        Text* right = element->from(colon + 1);
                        if (right->is("{")) {
                            delete right;
                            return getRuntimeValue(++n);
                        } else {
                            printf("Item %d of command; expecting '{' but got %s:\n", n, right->getText());
                            command->dump();
                            exit(1);
                        }
                    }
                    delete left;
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named element of a command, as text
        const char* getTextValue(const char* key) {
            RuntimeValue* value = getRuntimeValue("value");
            char* buf;
            switch (value->getType()) {
                case TEXT_VALUE: {
                        const char* v = value->getTextValue();
                        int  len = strlen(v);
                        buf = new char[len + 1];
                        strcpy(buf, v);
                    }
                    break;
                case INT_VALUE:
                    buf = new char[12];
                    sprintf(buf, "%d", value->getIntValue());
                    break;
                case BOOL_VALUE:
                    buf = new char[6];
                    sprintf(buf, "%s", value->getBoolValue() ? "true" : "false");
                    break;
            };
            return buf;
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Set the value of a variable
        void setSymbolValue(const char* key, RuntimeValue* runtimeValue) {
            // First we find the variable. Start by flattening the symbol array.
            symbols->flatten();
            Symbol* symbol = getSymbol(key);
            // Put the given value into the symbol
            symbol->setValue(runtimeValue);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Dump the values of all variables
        void showSymbolValues() {
            for (int s = 0; s < symbols->getSize(); s++) {
                Symbol* symbol = symbols->get(s);
                symbol->dump();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        Runtime() {
            setupValueTypes();
        }

        ///////////////////////////////////////////////////////////////////////
        ~Runtime() {
            delete valueTypes;
            delete c_openBrace;
            delete c_target;
        }
};

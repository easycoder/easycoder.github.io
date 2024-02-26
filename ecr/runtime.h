class Runtime {

    private:

        // An array containing the commands in the compiled code.
        // This roughly corresponds to lines of the original script
        TextArray* codeArray;
        // An array of unique text items found in the script
        TextArray* keyArray;
        // An array of commands, where each is an array of attributes
        TextArray** commands;
        // An array of keyword objects, one for each element of the code array
        KeywordArray* keywordArray;
        // The command that is to be executed
        TextArray* command;
        // The keyword id for this command
        int keywordCode;
        // The current program counter
        int pc;
        // The value types
        TextArray* valueTypes;

    public:

        void setCodeArray(TextArray* arg) { codeArray = arg; }
        TextArray* getCodeArray() { return codeArray; }
        void setKeyArray(TextArray* arg) { keyArray = arg; }
        TextArray* getKeyArray() { return keyArray; }
        void setCommands(TextArray** arg) { commands = arg; }
        TextArray** getCommands() { return commands; }
        void setKeywordArray(KeywordArray* arg) { keywordArray = arg; }
        KeywordArray* getKeywordArray() { return keywordArray; }
        void setCommand(TextArray* arg) { command = arg; }
        TextArray* getCommand() { return command; }
        void setKeywordCode(int arg) { keywordCode = arg; }
        int getKeywordCode() { return keywordCode; }
        void setPC(int arg) { pc = arg; }
        int getPC() { return pc; }

        ///////////////////////////////////////////////////////////////////////
        // Set up the value types
        void setupValueTypes() {
            valueTypes = new TextArray("valueTypes");
            valueTypes->add("text");
            valueTypes->add("int");
            valueTypes->add("boolean");
            valueTypes->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Report an unexpected element
        void unexpectedElement(TextArray* command, int n, Text* t) {
            print("Unexpected element at line %s, item %d: %s\n", command->getText(2), n, t->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Scan a sequence to find the matching '}'
        RuntimeValue* parseSequence(int n) {
            TextArray* args = new TextArray("args");
            while (true) {
                Text* item = command->get(++n);
                print("%s\n", item->getText());
                int colon = item->positionOf(':');
                if (colon > 0) {
                    Text* left = item->left(colon);
                    Text* from = item->from(colon + 1);
                    print("%s : %s\n", keyArray->get(left)->getText(), keyArray->get(from)->getText());
                    // switch (values->getIndex(left))
                    // {
                    //     case _CORE_TEXT_:
                    //         printf("->%s\n", from->getText());
                    //         break;

                    //     case _CORE_INT_:
                    //         break;
    
                    //     case _CORE_BOOL_:
                    //         break;
                    // }
                    delete left;
                    delete from;
                } else {
                    if (item->is("}")) {
                        print("Close brace\n");
                        break;
                    }
                }
            }
            delete args;
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a keyword from an {a}:{b} pair
        Text* getItemText(int n, bool select) {
            Text* item = command->get(n);
            int colon = item->positionOf(':');
            Text* left = item->left(colon);
            Text* from = item->from(colon + 1);
            int code = atoi((select ? from : left)->getText());
            delete left;
            delete from;
            return keyArray->get(code);
        }

        ///////////////////////////////////////////////////////////////////////
        // Process values recursively
        RuntimeValue* getRuntimeValue(int n) {
            RuntimeValue* runtimeValue = new RuntimeValue();
            while (true) {
                // Get the value type (is this always the first item?)
                Text* key = getItemText(n, false);
                if (key->is("type")) {
                    Text* valueType = getItemText(n, true);
                    if (valueTypes->contains(valueType)) {
                        key = getItemText(n + 1, false);
                        // Get the content
                        if (key->is("content")) {
                            // Deal with each of the value types
                            if (valueType->is("text")) {
                                runtimeValue->setTextValue(getItemText(n + 1, true)->getText());
                                return runtimeValue;
                            } else if (valueType->is("int")) {
                                runtimeValue->setIntValue(atoi(getItemText(n + 1, true)->getText()));
                                return runtimeValue;
                            } else if (valueType->is("boolean")) {
                                runtimeValue->setBoolValue(getItemText(n + 1, true)->is("true"));
                                return runtimeValue;
                            } else{
                                printf("Unrecognized value type %s in item %s:\n", valueType->getText(), command->get(n)->getText());
                                command->dump();
                                exit(1);
                            }
                        } else {
                            printf("Unrecognized key %s in item %s:\n", key->getText(), command->get(n)->getText());
                            command->dump();
                            exit(1);
                        }
                    } else {
                        printf("Unrecognized key %s in item %s:\n", key->getText(), command->get(n)->getText());
                        command->dump();
                        exit(1);
                    }
                }
                printf("Expected 'type': got '%s':\n", key->getText());
                command->dump();
                exit(1);
                return nullptr;
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a command
        RuntimeValue* getRuntimeValue(const char* name) {
            // Look for this name then process it
            for (int n = 0; n < command->getSize(); n++) {
                Text* item = command->get(n);
                // Deal with lines of the form <n>:<m>
                int colon = item->positionOf(':');
                if (colon > 0) {
                    Text* left = item->left(colon);
                    if (keyArray->get(left)->is(name)) {
                        // Verify that 'from' is an open brace
                        Text* from = item->from(colon + 1);
                        if (from->is("{")) {
                            delete from;
                            return getRuntimeValue(++n);
                        } else {
                            printf("Item %d of command; expecting '{' but got %s:\n", n, from->getText());
                            command->dump();
                            exit(1);
                        }
                    }
                    delete left;
                    // Test if we've found an embedded value
                    // if (values->getValueKeywords()->contains(keyArray->get(left)) && from->is("{")) {
                    //     return parseSequence(n);
                    // } else if (from->isNumeric()) {
                    //     print("%d: %s - %s\n", n, keyArray->get(left)->getText(), keyArray->get(from)->getText());
                    // } else {
                    //     unexpectedElement(command, n, item);
                    // }
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        Runtime() {
            setupValueTypes();
        }

        ///////////////////////////////////////////////////////////////////////
        ~Runtime() {
            delete valueTypes;
        }
};

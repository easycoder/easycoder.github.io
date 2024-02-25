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
        // Report an unexpected element
        void unexpectedElement(TextArray* command, int n, Text* t) {
            print("Unexpected element at line %s, item %d: %s\n", command->getText(2), n, t->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Scan a sequence to find the matching '}'
        RuntimeValue* parseSequence(int n) {
            TextArray* args = new TextArray();
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
                } else {
                    if (item->is("}")) {
                        print("Close brace\n");
                        break;
                    }
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Process values recursively
        RuntimeValue* getRuntimeValue(int n) {
            return nullptr;
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
                            return getRuntimeValue(n);
                        } else {
                            print("Item %d of command; expecting '{' but got %s:\n", n, from->getText());
                            command->dump();
                            exit;
                        }
                    }
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
        Runtime() {}

        ///////////////////////////////////////////////////////////////////////
        ~Runtime() {}
};

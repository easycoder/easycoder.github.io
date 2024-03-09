class Runtime {

    private:

        // The functions object
        Functions* functions;
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
        // The current program counter
        int pc;
        // The value types
        TextArray* valueTypes;
        // The values in the 'core' domain
        CoreValues* coreValues;
        // A temporary value to hold the index of a command getCommandProperty
        int commandPropertyIndex;

        // Constants
        Text* c_openBrace = new Text("{");
        Text* c_target = new Text("target");

        ///////////////////////////////////////////////////////////////////////
        // Set up the value types
        void setupValueTypes() {
            valueTypes = new TextArray();
            valueTypes->add("text");
            valueTypes->add("int");
            valueTypes->add("boolean");
            valueTypes->add("symbol");
            valueTypes->flatten();
        }

    public:

        void setFunctions(Functions* arg) { functions = arg; }
        Functions* getFunctions() { return functions; }
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
        void setCoreValues(CoreValues* arg) { coreValues = arg; }
        CoreValues* getCoreValues() { return coreValues; }
        void setCommand(Command* arg) { command = arg; }
        Command* getCommand() { return command; }
        void setPC(int arg) { pc = arg; }
        int getPC() { return pc; }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named element of a command, as text
        const char* getTextValue(const char* key) {
            return command->getTextValue(key);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Set the value of a variable
        void setSymbolValue(const char* key, RuntimeValue* runtimeValue) {
            command->setSymbolValue(key, runtimeValue);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Print the line number
        const char* getLineNumber() {
            return command->getElements()->get(0)->getElement()->getText();
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Error exit
        void notImplemented(const char* code) {
            functions->notImplemented(code);
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

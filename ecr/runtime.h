class Runtime {

    private:

        // The threads object
        ThreadArray* threads;
        // The functions object
        Functions* functions;
        // An array containing the commands in the compiled code.
        // This roughly corresponds to lines of the original script
        TextArray* codeArray;
        // An array of unique text items found in the script
        TextArray* keyArray;
        // An array of commands, where each is an array of elements
        ElementArray** commands;
        // An array of symbols
        SymbolArray* symbols;
        // An array of keyword objects, one for each element of the code array
        KeywordArray* keywordArray;
        // The command that is to be executed
        Command* command;
        // The number of code lines
        int codeSize;
        // The current program counter
        int pc;
        // The values in the 'core' domain
        CoreValues* coreValues;
        // The conditions in the 'core' domain
        CoreConditions* coreConditions;

    public:

        void setThreads(ThreadArray* arg) { threads = arg; }
        ThreadArray* getThreads() { return threads; }
        void setFunctions(Functions* arg) { functions = arg; }
        Functions* getFunctions() { return functions; }
        void setCodeArray(TextArray* arg) { codeArray = arg; }
        TextArray* getCodeArray() { return codeArray; }
        void setKeyArray(TextArray* arg) { keyArray = arg; }
        TextArray* getKeyArray() { return keyArray; }
        void setCommands(ElementArray** arg) { commands = arg; }
        ElementArray** getCommands() { return commands; }
        void setSymbols(SymbolArray* arg) { symbols = arg; }
        SymbolArray* getSymbols() { return symbols; }
        void setKeywordArray(KeywordArray* arg) { keywordArray = arg; }
        KeywordArray* getKeywordArray() { return keywordArray; }
        void setCommand(Command* arg) { command = arg; }
        Command* getCommand() { return command; }
        void setCodeSize(int arg) { codeSize = arg; }
        int getCodeSize() { return codeSize; }
        void setPC(int arg) { pc = arg; }
        int getPC() { return pc; }
        // Domain-specific
        void setCoreValues(CoreValues* arg) { coreValues = arg; }
        CoreValues* getCoreValues() { return coreValues; }
        void setCoreConditions(CoreConditions* arg) { coreConditions = arg; }
        CoreConditions* getCoreConditions() { return coreConditions; }

        ///////////////////////////////////////////////////////////////////////
        // Get the named parameter
        Text* getParameter(ElementArray* elements, const char* key) {
            return command->getParameter(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the named runtime value
        RuntimeValue* getRuntimeValue(ElementArray* elements, const char* key) {
            return command->getRuntimeValue(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the named runtime condition
        bool getCondition(ElementArray* elements) {
            return command->getCondition(elements);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named element of a command, as text
        const char* getTextValue(ElementArray* elements, const char* key) {
            return command->getTextValue(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a symbol
        Symbol* getSymbol(ElementArray* elements, const char* key) {
            return command->getSymbol(elements, key);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Set the value of a symbol
        void setSymbolValue(ElementArray* elements, const char* key, RuntimeValue* runtimeValue) {
            command->setSymbolValue(elements, key, runtimeValue);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Get the value of a symbol
        RuntimeValue* getSymbolValue(ElementArray* elements, const char* key) {
            return command->getSymbolValue(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a named value property
        Text* getValueProperty(ElementArray* elements, const char* key) {
            return functions->getValueProperty(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Find the code for a named value property
        Text* getCommandProperty(ElementArray* elements, const char* key) {
            return command->getCommandProperty(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a label
        Symbol* getLabel(const char* name) {
            for (int n = 0; n < codeSize; n++) {
                ElementArray* elements = commands[n];
                command->showElements(elements, 0);
                const char* keyword = command->getCommandPropertyCode(elements, "keyword");
                if (keyword == nullptr) {
                    continue;
                }
                if (strcmp(keyword, "label") == 0) {
                    RuntimeValue* value = getRuntimeValue(elements, "name");
                    if (value->getTextValue() != nullptr) {
                        Symbol* symbol = getSymbol(elements, name);
                        if (symbol != nullptr) {
                            return symbol;
                        }
                    }
                }
            }
            return nullptr;
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Get the line number
        int getLineNumber(ElementArray* elements) {
            return elements->getLineNumber();
        }

        ///////////////////////////////////////////////////////////////////////
        Runtime() {}

        ///////////////////////////////////////////////////////////////////////
        ~Runtime() {}
};

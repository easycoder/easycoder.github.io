class Run {

    private:
        TextArray* domains;
        ThreadArray* threads;
        Runtime* runtime;
        TextArray* codeArray;
        TextArray* keyArray;
        CommandArray* commands;
        SymbolArray* symbols;
        Functions* functions;
        // Domain-specific
        CoreKeywords* coreKeywords;
        CoreValues* coreValues;
        CoreConditions* coreConditions;

        ///////////////////////////////////////////////////////////////////////
        // Set up the runtime
        void setupRuntime() {
            runtime = new Runtime();
            runtime->setThreads(threads);
            runtime->setFunctions(functions);
            runtime->setCodeArray(codeArray);
            runtime->setKeyArray(keyArray);
            runtime->setCommands(commands);
            runtime->setSymbols(symbols);
            // Set the value handlers for each domain
            runtime->setCoreValues(coreValues);
        }

    public:

        ///////////////////////////////////////////////////////////////////////
        // Run a sequence of commands from the current program counter
        int runFrom(Runtime* runtime, int pc) {
            do {
                // print("Command %d\n", pc);
                Command* command = commands->get(pc);
                command->setKeyArray(keyArray);
                command->setSymbols(symbols);
                command->setCoreValues(coreValues);
                runtime->setCommand(command);
                runtime->setPC(pc);
                int c = command->getElementCode(command->getElements(), 2);
                // Choose the right domain and call its run handler
                switch (command->getElementCode(command->getElements(), 1)) {
                    case DOMAIN_CORE:
                        pc = coreKeywords->run(runtime, c);
                        break;
                }
            } while (pc >= 0);
            return pc;
        };

        ///////////////////////////////////////////////////////////////////////
        // Split text into lines and add them to the array
        TextArray* split(Text* t, char separator) {
            TextArray* ta = new TextArray();
            const char* content = t->getText();
            int n = 0;
            while (true) {
                if (content[n] == separator || content[n] == '\0') {
                    char* cc = new char[n + 1];
                    memcpy(cc, content, n);
                    cc[n] = '\0';
                    if (strlen(cc) > 0) {
                        ta->add(new Text(cc));
                    }
                    delete[] cc;
                    if (content[n] == '\0') {
                        break;
                    }
                    content = &content[++n];
                    n = 0;
                } else {
                    n++;
                }
            }
            ta->flatten();
            return ta;
        }

        ///////////////////////////////////////////////////////////////////////
        // Value parser
        ElementArray* parseValue(TextArray* codes, int* n) {
            ElementArray* value = new ElementArray();
            while (*n < codes->getSize()) {
                Text* item = codes->get(*n);
                // print("%s\n", item->getText());
                if (item->is("}") || item->is("]")) {
                    break;
                } else {
                    int colon = item->positionOf(':');
                    Text* right = item->from(colon + 1);
                    if (right->is("{") || right->is("[")) {
                        (*n)++;
                        value->add(new Element(item, parseValue(codes, n)));
                    } else {
                        value->add(new Element(item));
                    }
                    delete right;
                }
                (*n)++;
            }
            value->flatten();
            return value;
        }

        ///////////////////////////////////////////////////////////////////////
        // Command parser
        Command* parseCommand(TextArray* codes, int* n) {
            Command* command = new Command(functions);
            int size = codes->getSize();
            while (*n < size) {
                Text* item = codes->get(*n);
                // print("--- %s\n", item->getText());
                if (item->is("}") || item->is("]")) {
                    break;
                }
                int colon = item->positionOf(':');
                if (colon > 0) {
                    Text* left = item->left(colon);
                    Text* right = item->from(colon + 1);
                    if (right->is("{") || right->is("[")) {
                        (*n)++;
                        command->add(new Element(item, parseValue(codes, n)));
                    } else {
                        command->add(new Element(item));
                    }
                    delete left;
                    delete right;
                } else {
                    command->add(new Element(item));
                }
                (*n)++;
            }
            command->flatten();
            return command;
        }

        ///////////////////////////////////////////////////////////////////////
        // Finish execution
        void finish() {
            delete domains;
            delete codeArray;
            delete keyArray;
            delete coreKeywords;
            delete commands;
            delete threads;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        Run(Text* codes, Text* keys) {
            
            // Convert each part of the scanned script to a TextArray
            codeArray = split(codes, '\n');
            keyArray = split(keys, '\n');
            delete codes;
            delete keys;

            // codeArray->info();
            // keyArray->info();

            // Initialise the list of domains
            domains = new TextArray();
            domains->add("core");
            domains->flatten();

            // Get the keywords and their handlers.
            // Do this for each domain.
            coreKeywords = new CoreKeywords(keyArray);
            coreValues = new CoreValues(keyArray);
            // coreKeywords->info();

            // Create an array of symbols
            symbols = new SymbolArray();
            // Create a "functions" object
            functions = new Functions(keyArray, symbols);

            int codeSize = codeArray->getSize();
            // Create the array of commands and a list of initial keywords
            commands = new CommandArray();
            for (int n = 0; n < codeSize; n++) {
                Text* codeLine = codeArray->get(n); 
                TextArray* ta = split(codeLine, ',');
                
                // Parse the command and add it to the command array
                int *pointer = new int[1];
                pointer[0] = 0;
                Command* command = parseCommand(ta, pointer);
                commands->add(command);

                // Get the line number - item 0 in the command
                command->setLineNumber(command->getElementCode(command->getElements(), 0));
                // Get the domain - item 1 in the command
                int domainIndex = command->getElementCode(command->getElements(), 1);
                // Get the keyword - item 2 in the command
                Text* tt = keyArray->get(command->getElementCode(command->getElements(), 2));

                // Look up the keyword in this domain and save its code as the value for this command
                KeywordArray* keywords;
                switch (domainIndex) {
                    case DOMAIN_CORE:
                        keywords = coreKeywords->getKeywords();
                        break;
                    default:
                        print("Unknown domain index %d\n", domainIndex);
                        exit(1);
                }
            }
            commands->flatten();
            threads = new ThreadArray();
            setupRuntime();

            // Run until there are no more threads waiting
            int pc = 0;
            while (true) {
                pc = runFrom(runtime, pc);
                if (pc == FINISHED) {
                    break;
                }
                if (pc > 0) {
                    continue;
                }
                while (pc == STOPPED) {
                    pc = threads->getNextThread();
                    if (pc > 0) {
                        break;
                    }
                    // print("Stopped\n");
                }
            }
            finish();
        };

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Run() {}
};


class Run {

    private:
        TextArray* domains;
        ThreadArray* threads;
        Runtime* runtime;
        TextArray* codeArray;
        TextArray* keyArray;
        ElementArray** commands;
        SymbolArray* symbols;
        Functions* functions;
        ElementArray* currentElements;
        int codeSize;
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
            runtime->setCodeSize(codeSize);
            // Set the value handlers for each domain
            runtime->setCoreValues(coreValues);
        }

    public:

        ///////////////////////////////////////////////////////////////////////
        // Run a sequence of commands from the current program counter
        int runFrom(Runtime* runtime, int pc) {
            do {
                print("Command %d\n", pc);
                currentElements = commands[pc];
                Command* command = new Command(functions);
                command->setKeyArray(keyArray);
                command->setSymbols(symbols);
                command->setCoreValues(coreValues);
                runtime->setCommand(command);
                runtime->setPC(pc);
                if (singleStep) {
                    print("Line %d\n", runtime->getLineNumber(currentElements));
                }
                int c = command->getElementCode(currentElements, 2);
                // Choose the right domain and call its run handler
                switch (command->getElementCode(currentElements, 1)) {
                    case DOMAIN_CORE:
                        pc = coreKeywords->run(currentElements, runtime, c);
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
            ElementArray* elements = new ElementArray();
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
                        elements->add(new Element(item, parseValue(codes, n)));
                    } else {
                        elements->add(new Element(item));
                    }
                    delete right;
                }
                (*n)++;
            }
            elements->flatten();
            return elements;
        }

        ///////////////////////////////////////////////////////////////////////
        // Command parser
        ElementArray* parseCommand(TextArray* codes, int* n) {
            ElementArray* elements = new ElementArray();
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
                        elements->add(new Element(item, parseValue(codes, n)));
                    } else {
                        elements->add(new Element(item));
                    }
                    delete left;
                    delete right;
                } else {
                    elements->add(new Element(item));
                }
                (*n)++;
            }
            elements->flatten();
            return elements;
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
        // Run a script
        void run(Text* codes, Text* keys) {
            
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

            codeSize = codeArray->getSize();
            // Create the array of commands and a list of initial keywords
            commands = new ElementArray*[codeSize];
            for (int n = 0; n < codeSize; n++) {
                print("Parse line %d\n", n);
                Text* codeLine = codeArray->get(n); 
                TextArray* ta = split(codeLine, ',');
                
                // Parse each command and add it to the command array
                int *pointer = new int[1];
                pointer[0] = 0;
                ElementArray* elements = parseCommand(ta, pointer);
                elements->flatten();
                commands[n] = elements;
                Command* command = new Command(functions);

                // Get the domain - item 1 in the command
                elements->dump();
                int domainIndex = command->getElementCode(elements, 1);
                // Get the keyword - item 2 in the command
                Text* tt = keyArray->get(command->getElementCode(elements, 2));

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
        // Constructor
        Run(Text* codes, Text* keys) {
            try {
                run(codes, keys);
            }
            catch (const char* ex) {
                printf("Line %d: %s\n", runtime->getLineNumber(currentElements), ex);
            }
            catch (...) {
                printf("Line %d: Unknown exception\n", runtime->getLineNumber(currentElements));
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Run() {}
};


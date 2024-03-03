class Run {

    private:
        TextArray* domains;
        Runtime* runtime;
        TextArray* codeArray;
        TextArray* keyArray;
        CommandArray* commands;
        CoreKeywords* coreKeywords;
        int* scriptKeywordCodes;
        SymbolArray* symbols;

        ///////////////////////////////////////////////////////////////////////
        // Set up the runtime
        void setupRuntime() {
            runtime = new Runtime();
            runtime->setCodeArray(codeArray);
            runtime->setKeyArray(keyArray);
            runtime->setCommands(commands);
            runtime->setSymbols(symbols);
        }

    public:

        ///////////////////////////////////////////////////////////////////////
        // Run a sequence of commands from the current program counter
        int runFrom(Runtime* runtime, int pc) {
            do {
                // print("Command %d\n", pc);
                Command* command = commands->get(pc);
                runtime->setCommand(command);
                runtime->setPC(pc);
                runtime->setKeywordCode(scriptKeywordCodes[pc]);
                // Choose the right domain and call its run handler
                switch (atoi(command->get(1)->getElement()->getText())) {
                    case DOMAIN_CORE:
                        pc = coreKeywords->run(runtime, scriptKeywordCodes[pc]);
                        break;
                }
                if (pc < 0) {
                    return pc;
                }
            } while (pc > 0);
            return 0;
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
                        ta->add(new Text(cc, cc));
                    }
                    delete cc;
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
        // Recursive parser
        Command* parse(TextArray* codes, int* n) {
            Command* command = new Command();
            while (*n < codes->getSize()) {
                Text* item = codes->get(*n);
                int colon = item->positionOf(':');
                if (colon > 0) {
                    Text* left = item->left(colon);
                    Text* right = item->from(colon + 1);
                    if (right->is("{")) {
                        command->add(new Element(item));
                        (*n)++;
                        command->add(new Element(parse(codes, n)));
                    }
                    else if (right->is("[")) {
                        command->add(new Element(item));
                    } else {
                        command->add(new Element(item));
                    }
                } else if (item->is("}")) {
                    break;
                } else if (item->is("]")) {
                    break;
                }
                else {
                    command->add(new Element(item));
                }
                (*n)++;
            }
            command->flatten();
            return command;
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
            domains = new TextArray("domains");
            domains->add("core");
            domains->flatten();

            // Get the keywords and their handlers.
            // Do this for each domain.
            coreKeywords = new CoreKeywords();
            // coreKeywords->info();

            int codeSize = codeArray->getSize();
            // Create the command data array
            commands = new CommandArray();
            // Create the array of commands and a list of initial keywords
            scriptKeywordCodes = new int[codeSize];
            for (int n = 0; n < codeSize; n++) {
                Text* codeLine = codeArray->get(n); 
                TextArray* ta = split(codeLine, ',');
                // Get the keyword - item 2 in the command
                Text* tt = keyArray->get(atoi(ta->get(2)->getText()));
                // Look up the keyword and save its code as the value for this command
                bool flag = false;
                for (int k = 0; k < keyArray->getSize(); k++) {
                    if (tt->is(keyArray->get(k)->getText())) {
                        scriptKeywordCodes[n] = k;
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    print("No handler found for keyword '%s'\n", tt->getText());
                    return;
                }
                // Parse the command and add it to the command array
                int *pointer = new int[1];
                pointer[0] = 0;
                commands->add(parse(ta, pointer));





                // commands[n] = elements;
                // TextArray* cmd = commands[n];
                // // Next, get the initial keyword code for the command
                // int domainIndex = atoi(cmd->get(1)->getText());
                // // Get the name of the keyword from the key array
                // Text* tt = keyArray->get(atoi(cmd->get(2)->getText()));
                // // Select the domain
                // KeywordArray* keywords;
                // switch (domainIndex) {
                //     case DOMAIN_CORE:
                //         keywords = coreKeywords->getKeywords();
                //         break;
                //     default:
                //         print("Unknown domain index %d\n", domainIndex);
                //         return;
                // }
                // // Create an array of symbols
                // symbols = new SymbolArray();
            }
            commands->flatten();
            commands->dump();
            setupRuntime();
            if (runFrom(runtime, 0) < 0) {
                print("Program exit requested\n");
                delete domains;
                delete codeArray;
                delete keyArray;
                delete coreKeywords;
                delete commands;
                delete domains;
            }
        };

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Run() {
            // print("Run: Destructor executed\n");
         }
};


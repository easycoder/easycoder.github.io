class Run {

    private:
        TextArray* domains;
        Runtime* runtime;
        TextArray* codeArray;
        TextArray* keyArray;
        TextArray** commands;
        CoreKeywords* coreKeywords;
        CoreValues* coreValues;
        int* scriptKeywordCodes;

        ///////////////////////////////////////////////////////////////////////
        // Set up the runtime
        void setupRuntime() {
            runtime = new Runtime();
            runtime->setCodeArray(codeArray);
            runtime->setKeyArray(keyArray);
            runtime->setCommands(commands);
        }

    public:

        ///////////////////////////////////////////////////////////////////////
        // Run a sequence of commands from the current program counter
        int runFrom(Runtime* runtime, int pc) {
            do {
                print("Run command %d\n", pc);
                TextArray* command = commands[pc];
                runtime->setCommand(command);
                runtime->setPC(pc);
                runtime->setKeywordCode(scriptKeywordCodes[pc]);
                // Choose the right domain and call its run handler
                switch (atoi(commands[pc]->get(1)->getText())) {
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
        // Constructor
        Run(Text* codes, Text* keys) {
            
            // Convert each part of the scanned script to a TextArray
            codeArray = new TextArray("codeArray");
            codeArray->parse(codes, '\n');
            keyArray = new TextArray("keyArray");
            keyArray->parse(keys, '\n');
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
            // KeywordArray* keywords = new KeywordArray("keywords");
            coreKeywords = new CoreKeywords();
            // coreKeywords->info();
            ValueArray* values = new ValueArray("values");
            CoreValues* coreValues = new CoreValues();
            // CoreValues->info();

            int codeSize = codeArray->getSize();
            // Create the command data array
            commands = new TextArray*[codeSize];
            // Create arrays of elements for each item of the command array
            scriptKeywordCodes = new int[codeSize];
            for (int n = 0; n < codeSize; n++) {
                // First parse each command into its elements
                TextArray* elements = new TextArray("commandElement");
                elements->parse(codeArray->get(n), ',');
                commands[n] = elements;
                TextArray* cmd = commands[n];
                // Next, get the initial keyword code for the command
                int domainIndex = atoi(cmd->get(1)->getText());
                // Get the name of the keyword from the key array
                Text* tt = keyArray->get(atoi(cmd->get(2)->getText()));
                // Select the domain
                KeywordArray* keywords;
                switch (domainIndex) {
                    case DOMAIN_CORE:
                        keywords = coreKeywords->getKeywords();
                        break;
                    default:
                        print("Unknown domain index %d\n", domainIndex);
                        return;
                }
                // and look for the keyword in the list of those handled by the domain
                bool flag = false;
                for (int k = 0; k < keywords->getSize(); k++) {
                    if (tt->is(keywords->get(k)->getName())) {
                        scriptKeywordCodes[n] = k;
                        flag = true;
                        break;
                    }
                }
                if (!flag) {
                    print("No handler found for keyword '%s'\n", tt->getText());
                    return;
                }

            }
            setupRuntime();
            if (runFrom(runtime, 0) < 0) {
                print("Program exit requested\n");
                delete domains;
                delete codeArray;
                delete keyArray;
                delete values;
                for (int n = 0; n < codeSize; n++) {
                    delete commands[n];
                }
                delete commands;
                // delete domains;
            }
        };

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Run() {
            // print("Run: Destructor executed\n");
         }
};


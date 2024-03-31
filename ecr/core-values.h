// Values for the 'core' domain
class CoreValues {

    private:

        enum coreIndices {
            SYMBOL,
            CAT,
            TIMESTAMP,
            NOW,
            EMPTY
        };

        int index = 0;
        int* map;
        TextArray* keyArray;
        KeywordArray* keywords;
        Text* domain = new Text("core");

        ///////////////////////////////////////////////////////////////////////
        // Add a keyword. Only add keywords that are found in the key array.
        // The map contains the index of the variable (and thus its handler)
        // against the index of its name in the key array.
        void add(const char* name) {
            int size = keyArray->getSize();
            for (int n = 0; n < size; n++) {
                if (keyArray->get(n)->is(name)) {
                    // printf("Adding %s at position %d pointing to %d\n", name, n, index);
                    Keyword* keyword = new Keyword();
                    keyword->setName(new Text(name));
                    keyword->setDomain(domain);
                    keyword->setIndex(n);
                    map[n] = index;
                    keywords->add(keyword);
                }
            }
            index++;
        }

    public:

        void info() {
            print("This is the list of keywords defined for the 'core' package\n");
            for (int n = 0; n < keywords->getSize(); n++) {
                Keyword* k = (Keyword*)keywords->get(n);
                print("%s\n", k->getName()->getText());
            }
            print("-----------------\n");
        };

        ///////////////////////////////////////////////////////////////////////
        // Get the keyword array
        KeywordArray* getKeywords() {
            return keywords;
        }

        ///////////////////////////////////////////////////////////////////////
        // Run a command. All necessary information is passed in
        RuntimeValue* run(int code, Functions* functions, void* data) {
            RuntimeValue* runtimeValue = new RuntimeValue();
            int index = map[code];
            switch (index)
            {
                case SYMBOL: {
                    // functions->showSymbolValues();
                    Symbol* symbol = functions->getSymbol("name");
                    return symbol->getValue()->copy();
                }
                case CAT: {
                    RuntimeValueArray* runtimeValues = (RuntimeValueArray*)data;
                    Text* value = new Text();
                    for (int n = 0; n < runtimeValues->getSize(); n++) {
                        value->append(runtimeValues->get(n)->getTextValue());
                    }
                    runtimeValue->setType(TEXT_VALUE);
                    runtimeValue->setTextValue(value->copy()->getText());
                    delete value;
                    return runtimeValue;
                }
                case TIMESTAMP: {
                    runtimeValue->setType(INT_VALUE);
                    struct timeval now;
                    gettimeofday(&now, 0);
                    long millis = now.tv_sec * 1000 + now.tv_usec / 1000;
                    runtimeValue->setIntValue(millis);
                    return runtimeValue;
                }
                case NOW: {
                    runtimeValue->setType(INT_VALUE);
                    struct timeval now;
                    gettimeofday(&now, 0);
                    runtimeValue->setIntValue(now.tv_sec);
                    return runtimeValue;
                }
                case EMPTY: {
                    runtimeValue->setType(TEXT_VALUE);
                    runtimeValue->setTextValue("");
                    return runtimeValue;
                }
                default:
                    print("Unknown keyword in CoreValues\n");
                    exit(1);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        CoreValues(TextArray* array) {
            keyArray = array;
            int arraySize = array->getSize();
            map = new int[arraySize];
            for (int n = 0; n < arraySize; n++) {
                map[n] = -1;
            }
            keywords = new KeywordArray();
            add("symbol");
            add("cat");
            add("timestamp");
            add("now");
            add("empty");
            keywords->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~CoreValues() {
            delete domain;
            delete[] map;
            print("CoreValues: Destructor executed\n");
        }
};

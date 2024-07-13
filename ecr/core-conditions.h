// Conditions for the 'core' domain
class CoreConditions {

    private:

        enum coreIndices {
            IS,
            LESS,
            GREATER
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
        // Run a condition. All necessary information is passed in
        bool run(Condition* condition, Functions* functions) {
            bool result = false;
            RuntimeValue* value1;
            RuntimeValue* value2;
            const char* type = condition->getType();
            value1 = condition->getValue(0);
            // 'none', 'list', 'object', 'even', 'odd', 'empty'
            if (strcmp(type, "string") == 0) {
                result = (value1->getType() == TEXT_VALUE);
            }
            else if (strcmp(type, "numeric") == 0) {
                result = (value1->getType() == INT_VALUE);
            }
            else if (strcmp(type, "boolean") == 0) {
                result = (value1->getType() == BOOL_VALUE);
            }
            else if (strcmp(type, "even") == 0) {
                result = (value1->getIntValue() % 2 == 0);
            }
            else if (strcmp(type, "odd") == 0) {
                result = (value1->getIntValue() % 2 == 1);
            }
            else if (strcmp(type, "empty") == 0) {
                result = (strlen(value1->getTextValue()) == 0);
            }
            else if (strcmp(type, "is") == 0) {
                value2 = condition->getValue(1);
                result = (value1->getIntValue() == value2->getIntValue());
            }
            else if (strcmp(type, "greater") == 0) {
                value2 = condition->getValue(1);
                result = (value1->getIntValue() > value2->getIntValue());
            }
            else if (strcmp(type, "less") == 0) {
                value2 = condition->getValue(1);
                result = (value1->getIntValue() < value2->getIntValue());
            }
            return condition->isNegate() ? !result : result;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        CoreConditions(TextArray* array) {
            keyArray = array;
            map = new int[array->getSize()];
            keywords = new KeywordArray();
            keywords->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~CoreConditions() {
            delete domain;
            print("CoreConditions: Destructor executed\n");
        }
};

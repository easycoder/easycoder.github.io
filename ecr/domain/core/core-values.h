#include "symbol.h"
#include "cat.h"

// Values for the 'core' domain
class CoreValues {

    private:

        enum coreIndices {
            SYMBOL,
            CAT
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
                    printf("Adding %s at position %d pointing to %d\n", name, n, index);
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
        RuntimeValue* run(int code, ElementArray* value, SymbolArray* symbols, Functions* functions) {
            // functions->showSymbolValues();
            int index = map[code];
            switch (index)
            {
                case SYMBOL:
                    return core_symbol(functions);
                case CAT:
                    return core_cat(functions);
                default:
                    print("Unknown keyword code %d in CoreValues\n", index);
                    exit(1);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        CoreValues(TextArray* array) {
            keyArray = array;
            map = new int[array->getSize()];
            keywords = new KeywordArray();
            add("symbol");
            add("cat");
            keywords->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~CoreValues() {
            delete domain;
            print("CoreValues: Destructor executed\n");
        }
};

class Symbol {

    private:

        Text* name;
        int elements;
        int index;
        bool valueHolder;
        bool used;
        RuntimeValue** values = nullptr;

    public:

        Text* getName() {
            return name;
        }

        void setName(Text* t) {
            name = t;
        }

        int getType() {
            return values[index]->getType();
        }

        void setType(int t) {
            values[index]->setType(t);
        }

        void setValue(RuntimeValue* v) {
            if (values[index] != nullptr) {
                delete values[index];
            }
            values[index] = v;
        }

        void setTextValue(const char* v) {
            values[index]->setTextValue(v);
        }

        void setIntValue(int v) {
            values[index]->setIntValue(v);
        }

        void setBoolValue(bool v) {
            values[index]->setBoolValue(v);
        }

        RuntimeValue* getValue() {
            return values[index];
        }

        const char* getTextValue() {
            return values[index]->getTextValue();
        }

        int getIntValue() {
            return values[index]->getIntValue();
        }

        bool getBoolValue() {
            return values[index]->getBoolValue();
        }

        void detach() {
            RuntimeValue* runtimeValue = new RuntimeValue();
            int type = getType();
            const char* tVal = getTextValue();
            char* tBuf = new char[strlen(tVal) + 1];
            strcpy(tBuf, tVal);
            runtimeValue->setTextValue(tBuf);
            runtimeValue->setIntValue(getIntValue());
            runtimeValue->setBoolValue(getBoolValue());
            runtimeValue->setType(getType());
            delete values[index];
            values[index] = runtimeValue;
        }

        void dump() {
            printf("%s: ", name->getText());
            if (*values == nullptr) {
                printf("unassigned\n");
                return;
            }
            RuntimeValue* value = getValue();
            switch (value->getType()) {
                case TEXT_VALUE:
                    printf("%s\n", value->getTextValue());
                    break;
                case INT_VALUE:
                    printf("%ld\n", value->getIntValue());
                    break;
                case BOOL_VALUE:
                    printf("%s\n", value->getBoolValue() ? "true" : "false");
                    break;
            };
        }

        void init(Text* name) {
            setName(name);
            elements = 1;
            index = 0;
            valueHolder = false;
            used = false;
            values = new RuntimeValue*[1];
            values[0] = nullptr;
        }

        Symbol(Text* name) {
            init(name);
        }

        Symbol(const char* name) {
            init(new Text(name));
        }

        ~Symbol() {
            delete name;
            name = nullptr;
            delete[] values;
            values = nullptr;
        }
};

// SymbolArray is a memory-efficient class for managing an array of symbols
class SymbolArray {

    private:
        
        const char* name;
        int size = 0;                              // the number of keywords
        Symbol** array = nullptr;                 // the array of keywords
        LinkedList* list = new LinkedList();       // A list to hold new keywords as they are added
        TextArray* choices;
        
    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array and list combined)
        int getSize() {
            return this->size + list->getSize();
        };

        ///////////////////////////////////////////////////////////////////////
        // Get a specified item.
        // If the index is greater than the array size but not greater than
        // the combined size of array and list, return the item from the list.
        Symbol* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Symbol*)list->get(n - size);
            }
            return nullptr;
        };

        ///////////////////////////////////////////////////////////////////////
        // Add a value. This goes into the linked list.
        void add(Symbol* v) {
            list->add(v);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the index of the value whose name is given.

        int getIndex(Text* t) {
            if (list->getSize() > 0) {
                flatten();
            }
            for (int n = 0; n < size; n++) {
                if (array[n]->getName()->is(t)) {
                    return n;
                }
            }
            return -1;
        }

        int getIndex(Symbol* v) {
            return getIndex(v->getName());
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            if (list->getSize() == 0) {
                return;
            }
            Symbol** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Symbol*[total];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    // print("Copying item %d: %s\n", size, get(size));
                    array[size] = oldArray[size];
                    size++;
                }
                if (oldArray != nullptr) {
                    delete[] oldArray;
                }
                // Copy the list to the new array
                int n = 0;
                while (n < list->getSize()) {
                    // print("Moving item %d: %s\n", n, (char*)list->get(n));
                    array[size++] = (Symbol*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("SymbolArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            print("This is all the items in SymbolArray:\n");
            for (int n = 0; n < size; n++) {
                print("%s\n", get(n)->getName()->getText());
            }
            print("-----------------\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Initializer
        void init(const char* name) {
            this->name = name;
        }

        ///////////////////////////////////////////////////////////////////////
        // Named constructor
        SymbolArray(const char* name) {
            init(name);
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        SymbolArray() {
            init("<noname>");
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~SymbolArray() {
            delete array;
            delete list;
            #if DESTROY
            print("SymbolArray: Delete %s\n", name);
            #endif
        }
};


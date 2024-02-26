class Value {

    private:

        Text* name;
        Text* domain;
        int code;

    public:

        Text* getName() {
            return name;
        }

        int getCode() {
            return code;
        }

        Value(Text* name, Text* domain, int code) {
            this->name = name;
            this->domain = domain;
            this->code = code;
        }

        ~Value() {
            print("Value: Delete %s\n", name->getText());
            delete name;
            delete domain;
        }
};

// ValueArray is a memory-efficient class for managing arrays of Values
class ValueArray {

    private:
        
        const char* name;
        int size = 0;                        // the number of values
        Value** array = nullptr;             // the array of values
        TextArray* valueKeywords;            // An array of value keywords
        LinkedList* list;                    // A list to hold new values as they are added
        
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
        Value* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Value*)list->get(n - size);
            }
            return nullptr;
        };

        ///////////////////////////////////////////////////////////////////////
        // Add a value. This goes into the linked list.
        void add(const Value* v) {
            list->add(v);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the value keywords
        TextArray* getValueKeywords() {
            return valueKeywords;
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

        int getIndex(Value* v) {
            return getIndex(v->getName());
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Value** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Value*[total];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    // print("Copying item %d: %s\n", size, get(size));
                    array[size] = oldArray[size];
                    size++;
                }
                if (oldArray != nullptr) {
                    delete oldArray;
                }
                // Copy the list to the new array
                int n = 0;
                while (n < list->getSize()) {
                    // print("Moving item %d: %s\n", n, (char*)list->get(n));
                    array[size++] = (Value*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("ValueArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            print("This is all the items in ValueArray:\n");
            for (int n = 0; n < size; n++) {
                print("%s\n", get(n)->getName()->getText());
            }
            print("-----------------\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Initialiser
        void init() {
            list = new LinkedList();
            valueKeywords = new TextArray("valueKeywords");
            valueKeywords->add("value");
            valueKeywords->add("value1");
            valueKeywords->add("value2");
            valueKeywords->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Named constructor
        ValueArray(const char* name) {
            this->name = name;
            init();
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        ValueArray() {
            init();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~ValueArray() {
            delete array;
            delete list;
            delete valueKeywords;
            #if DESTROY
            print("ValueArray: Delete %s\n", name);
            #endif
        }
};

class Keyword {

    private:

        Text* name;
        Text* domain;

    public:

        ///////////////////////////////////////////////////////////////////////
        // Set the name of the keyword
        void setName(Text* name) {
            this->name = name;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the name of the keyword
        Text* getName() {
            return name;
        }

        ///////////////////////////////////////////////////////////////////////
        // Set the domain of the keyword
        void setDomain(Text* domain) {
            this->domain = domain;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the domain of the keyword
        Text* getDomain() {
            return this->domain;
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        Keyword() {
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Keyword() {
            print("Keyword: Destructor executed\n");
         }
};

// KeywordArray is a memory-efficient class for managing arrays of Keywords
class KeywordArray {

    private:
        
        int size = 0;                              // the number of keywords
        Keyword** array = nullptr;                 // the array of keywords
        LinkedList* list = new LinkedList();       // A list to hold new keywords as they are added
        
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
        Keyword* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Keyword*)list->get(n - size);
            }
            return nullptr;
        };

        ///////////////////////////////////////////////////////////////////////
        // Add a value. This goes into the linked list.
        void add(Keyword* v) {
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

        int getIndex(Keyword* v) {
            return getIndex(v->getName());
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Keyword** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Keyword*[sizeof(void*) * total];
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
                    array[size++] = (Keyword*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("KeywordArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            print("This is all the items in KeywordArray:\n");
            for (int n = 0; n < size; n++) {
                print("%s\n", get(n)->getName()->getText());
            }
            print("-----------------\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        KeywordArray() {
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~KeywordArray() {
            delete array;
            delete list;
            print("KeywordArray: Destructor executed\n");
        }
};

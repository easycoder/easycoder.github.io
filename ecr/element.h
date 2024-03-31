// A single element in a Command

class ElementArray;

class Element {

    private:

        Text* element = nullptr;
        ElementArray* value = nullptr;

    public:

        ///////////////////////////////////////////////////////////////////////
        // Initialize this element
        void init(Text* t) {
            int length = strlen(t->getText());
            char* temp = new char[length + 1];
            strcpy(temp, t->getText());
            temp[length] = '\0';
            element = new Text(temp);
        }
    
        ///////////////////////////////////////////////////////////////////////
        // Get the element
        Text* getElement() {
            return element;
        }
    
        ///////////////////////////////////////////////////////////////////////
        // Set the element text
        void setElement(Text* t) {
            if (element != nullptr) {
                delete element;
                init(t);
            }
        }
    
        ///////////////////////////////////////////////////////////////////////
        // Get the value
        ElementArray* getValue() {
            return value;
        }

        ///////////////////////////////////////////////////////////////////////
        // Find the position of a character inside this element
        // Calls the same function in Text
        int positionOf(char c) {
            if (element != nullptr) {
                return element->positionOf(c);
            }
            sprintf(exceptionBuffer, "Element->positionOf: No element\n");
            throw exceptionBuffer;
        }

        ///////////////////////////////////////////////////////////////////////
        // Test if this element is identical to some Text
        // Calls the same function in Text
        bool is(const char* s) {
            return element->is(s);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the leftmost N characters as a new Text
        // Calls the same function in Text
        Text* left(int n) {
            return element->left(n);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get from character N to the end as a new Text
        // Calls the same function in Text
        Text* from(int n) {
            return element->from(n);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print the value
        void dump() {
            print("%s ", element->getText());
            if (value != nullptr) {
                print("<value>");
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Print the value
        void dumpnl() {
            dump();
            print("\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        Element(const char* t) {
            element = new Text(t);
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor for a simple element
        Element(Text* t) {
            element = t;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor for a value
        Element(Text* t, ElementArray* val) {
           element = t;
           value = val;
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Element() {
            delete element;
        }
};

// ElementArray is a memory-efficient class for managing arrays of elements.
class ElementArray {

    private:
        int size = 0;                  // the number of items
        Element** array = nullptr;     // the array of items
        LinkedList* list;              // A list to hold new data items as they are added
        
    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array and list combined)
        int getSize() {
            return this->size + list->getSize();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a specified item.
        // If the index is greater than the array size but not greater than
        // the combined size of array and list, return the item from the list.
        Element* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Element*)list->get(n - size);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a value. This goes into the linked list.
        void add(Element* element) {
            list->add(element);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Get the line number
        int getLineNumber() {
            return atoi(array[0]->getElement()->getText()) + 1;
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Element** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Element*[total];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    array[size] = oldArray[size];
                    size++;
                }
                if (oldArray != nullptr) {
                    delete[] oldArray;
                }
                // Copy the list to the new array
                int n = 0;
                while (n < list->getSize()) {
                    array[size++] = (Element*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("ElementArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            for (int n = 0; n < size; n++) {
                print("-- Element %d: ", n);
                get(n)->dump();
            }
            print("\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        ElementArray() {
            list = new LinkedList();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~ElementArray() {
            delete array;
            array = nullptr;
            delete list;
            list = nullptr;
            #if DESTROY
            print("ElementArray: Delete %s\n", name);
            #endif
         }
};

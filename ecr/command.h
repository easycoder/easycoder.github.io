// A single element in a Command

class Command;

class Element {

    private:

        Text* element = nullptr;
        Command* command = nullptr;

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
        // Get the command
        Command* getCommand() {
            return command;
        }
    
        ///////////////////////////////////////////////////////////////////////
        // Set the command
        // void setCommand(Command* cmd) {
        //     if (element != nullptr) {
        //         delete element;
        //     }
        //     if (command != nullptr) {
        //         delete command;
        //     }
        //     command = cmd;
        // }

        ///////////////////////////////////////////////////////////////////////
        // Find the position of a character inside this element
        // Calls the same function in Text
        int positionOf(char c) {
            if (element != nullptr) {
                return element->positionOf(c);
            }
            printf("Element->positionOf: No element\n");
            exit(1);
            return -1;
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
        // Constructor
        Element(const char* t) {
            element = new Text(t);
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        Element(Text* t) {
            element = t;
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        Element(Command* cmd) {
            command = cmd;
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Element() {
            delete element;
        }
};

/*
    Command is an array of items, held initially in a linked list and then in an array.
    There are two lists and two arrays; one is of Elements and the other of Commands.
    When either is added, an empty one is also added to the other list, so the lists stay in step.
    Command is therefore a recursive data structure similar to a directory tree.
*/

class Command {

    private:
        int line;
        int size = 0;                         // the number of items
        Element** elements = nullptr;         // an array of Element objects
        LinkedList* list;                     // A list to hold new Element items as they are added
        
    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array and list combined)
        int getSize() {
            return this->size + list->getSize();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a specified Element.
        // If the index is greater than the array size but not greater than
        // the combined size of array and list, return the item from the list.
        Element* get(int n) {
            if (n < size) {
                return elements[n];
            }
            else if (n < size + list->getSize()) {
                return (Element*)list->get(n - size);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Add an element. This goes into the linked list.
        void add(Element* element) {
            list->add(element);
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Element** oldElements = elements;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                elements = new Element*[total];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    elements[size] = oldElements[size];
                    size++;
                }
                if (oldElements != nullptr) {
                    delete oldElements;
                }
                // Copy the list to the new array
                for (int n = 0; n < list->getSize(); n++) {
                    elements[size++] = (Element*)list->get(n);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Build a command recursively
        void parse(TextArray* tt) {
            int n = 0;
            while (n < tt->getSize()) {
                n++;
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            for (int n = 0; n < size; n++) {
                Element* el = get(n);
                if (el->getElement() == nullptr) {
                    print("Command ");
                    el->getCommand()->dump();
                } else {
                    print("%s ", el->getElement()->getText());
                }
            }
            print("end ");
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("Commands: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        Command() {
            list = new LinkedList();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Command() {
            delete elements;
            elements = nullptr;
            delete list;
            list = nullptr;
         }
};

/*
    TextArray is a memory-efficient class for managing arrays of strings.
    A typically usage is to break a piece of text into lines and have them
    available by line number.
*/

class CommandArray {

    private:
        const char* name;
        int size = 0;                  // the number of items
        Command** array = nullptr;     // the array of items
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
        Command* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Command*)list->get(n - size);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a command. This goes into the linked list.
        void add(Command* command) {
            list->add(command);
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Command** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Command*[total];
                // Copy the old array to the new
                size = 0;
                while (size < oldSize) {
                    array[size] = oldArray[size];
                    size++;
                }
                if (oldArray != nullptr) {
                    delete oldArray;
                }
                // Copy the list to the new array
                int n = 0;
                while (n < list->getSize()) {
                    array[size++] = (Command*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("CommandArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            for (int n = 0; n < size; n++) {
                print("Command %d: ", n);
                get(n)->dump();
                print("\n");
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Named constructor
        CommandArray(const char* name) {
            this->name = name;
            list = new LinkedList(name);
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        CommandArray() {
            list = new LinkedList("<noname>");
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~CommandArray() {
            delete array;
            array = nullptr;
            delete list;
            list = nullptr;
            #if DESTROY
            print("CommandArray: Delete %s\n", name);
            #endif
         }
};

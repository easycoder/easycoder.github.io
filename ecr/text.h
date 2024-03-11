class Text {
    private:

        const char* text = nullptr;
        int length = 0;

    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the content of this text
        const char* getText() {
            return text;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the length of this text
        int getLength() {
            return length;
        }

        ///////////////////////////////////////////////////////////////////////
        // Test if this text is identical to some string
        bool is(const char* s) {
            return strcmp(text, s) == 0;
        }

        ///////////////////////////////////////////////////////////////////////
        // Test if this text is identical to another text
        bool is(Text* t) {
            return is(t->text);
        }

        ///////////////////////////////////////////////////////////////////////
        // Find the position of a character inside this text
        int positionOf(char c) {
            for (int n = 0; n < length; n++) {
                if (text[n] == c) {
                    return n;
                }
            }
            return -1;
        }

        ///////////////////////////////////////////////////////////////////////
        // Test if the content of this item has a numeric value
        bool isNumeric() {
            for (int n = 0; n < length; n++) {
                if (!isdigit(text[n])) {
                    return false;
                }
            }
            return true;
        }

        ///////////////////////////////////////////////////////////////////////
        // Replace one character with another. Creates a new Text
        Text* replaceChar(char from, char to) {
            char* temp = new char[length + 1];
            strcpy(temp, text);
            for (int n = 0; n < length; n++) {
                if (text[n] == from) {
                    temp[n] = to;
                } else {
                    temp[n] = text[n];
                }
                temp[n] = '\0';
            }
            Text* tt = new Text((const char*)temp);
            delete[] temp;
            return tt;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the leftmost N characters as a new Text
        Text* left(int n) {
            char* t = new char[n + 1];
            strncpy(t, text, n);
            t[n] = '\0';
            Text* tt = new Text(t);
            delete[] t;
            return tt;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the rightmost N characters as a new Text
        Text* right(int n) {
            char* t = new char[n + 1];
            strncpy(t, text + length - n, n);
            t[n] = '\0';
            Text* tt = new Text(t);
            delete[] t;
            return tt;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get from character N to the end as a new Text
        Text* from(int n) {
            if (n > length) {
                n = length;
            }
            int len = length - n;
            char* t = new char[len + 1];
            if (len > 0) {
                strncpy(t, text + n, len);
            }
            t[len] = '\0';
            Text* tt = new Text(t);
            delete[] t;
            return tt;
        }

        ///////////////////////////////////////////////////////////////////////
        // Append to this Text
        void append(const char* t) {
            if (text == nullptr) {
                text = t;
            } else {
                int len = strlen(text) + strlen(t);
                char* tt = new char[len + 1];
                strcpy(tt, text);
                strcat(tt, t);
                delete[] text;
                text = tt;
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Initialize this Text
        void init(const char* t) {
            length = strlen(t);
            char* temp = new char[length + 1];
            strcpy(temp, (char*)t);
            temp[length] = '\0';
            text = temp;
        }
    
        ///////////////////////////////////////////////////////////////////////
        // Set the content of this text
        void setText(const char* t) {
            delete text;
            init(t);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print the value of this Text
        void dump() {
            print("%s\n", text);
        }

        ///////////////////////////////////////////////////////////////////////
        // 1-argument constructor. This creates a copy of the calling data

        Text(const char* t) {
            init(t);
        }

        ///////////////////////////////////////////////////////////////////////
        // 1-argument constructor. This creates a copy of the calling data

        Text(Text* t) {
            init(t->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // No-argument constructor
        Text() {}

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Text() {
            delete[] text;
        }
};

/*
    TextArray is a memory-efficient class for managing arrays of strings.
    A typically usage is to break a piece of text into lines and have them
    available by line number.
*/

class TextArray {

    private:
        int size = 0;                  // the number of items
        Text** array = nullptr;        // the array of items
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
        Text* get(int n) {
            if (n < size) {
                Text* t = array[n];
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Text*)list->get(n - size);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the item whose index is passed in as a Text.
        Text* get(Text* t) {
            return get(atoi(t->getText()));
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the text of an item
        const char* getText(int n) {
            return get(n)->getText();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the value of an item (known to be numeric)
        int getValueOf(int n) {
            return atoi(get(n)->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Add an item. This goes into the linked list.
        void add(Text* item) {
            list->add(item);
        }

        void add(const char* item) {
            list->add(new Text(item));
        }

        ///////////////////////////////////////////////////////////////////////
        // Test if this array contains the given text
        bool contains(Text* t) {
            flatten();   // just in case
            for (int n = 0; n < size; n++) {
                if ((get(n)->is(t))) {
                    return true;
                }
            }
            return false;
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            Text** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Text*[total];
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
                    array[size++] = (Text*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            print("This is all the items in TextArray:\n");
            for (int n = 0; n < getSize(); n++) {
                print("%s\n", getText(n));
            }
            print("-----------------\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("TextArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        TextArray() {
            list = new LinkedList();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~TextArray() {
            delete array;
            array = nullptr;
            delete list;
            list = nullptr;
            #if DESTROY
            print("TextArray: Delete %s\n", name);
            #endif
         }
};
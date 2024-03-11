class RuntimeValue {

    private:

        int type;
        const char* textValue;
        int intValue;
        bool boolValue;
        char valuebuf[10];

    public:

        int getType() {
            return type;
        }

        void setType(int t) {
            type = t;
        }

        void setTextValue(const char* t) {
            type = TEXT_VALUE;
            textValue = t;
        }

        void setIntValue(int i) {
            type = INT_VALUE;
            intValue = i;
        }

        void setBoolValue(bool b) {
            type = BOOL_VALUE;
            boolValue = b;
        }

        const char* getTextValue() {
            switch (type) {
                case TEXT_VALUE:
                    return textValue;
                case INT_VALUE:
                    sprintf(valuebuf, "%d", intValue);
                    return valuebuf;
                case BOOL_VALUE:
                    return boolValue ? "true" : "false";
            };
            return nullptr;
        }

        int getIntValue() {
            switch (type) {
                case TEXT_VALUE:
                    return atoi(textValue);
                case INT_VALUE:
                    return intValue;
                case BOOL_VALUE:
                    return boolValue ? 1 : 0;
            };
            return 0;
        }

        bool getBoolValue() {
            switch (type) {
                case TEXT_VALUE:
                    return atoi(textValue) != 0 ? true : false;
                case INT_VALUE:
                    return intValue != 0 ? true : false;
                case BOOL_VALUE:
                    return boolValue;
            };
            return false;
        }

        RuntimeValue* copy() {
            RuntimeValue* rtv = new RuntimeValue();
            if (type == TEXT_VALUE) {
                char* buf = new char[strlen(textValue) + 1];
                strcpy(buf, textValue);
                rtv->setTextValue(buf);
            } else {
                rtv->setTextValue(nullptr);
            }
            rtv->setIntValue(intValue);
            rtv->setBoolValue(boolValue);
            rtv->setType(type);
            return rtv;
        }

        RuntimeValue() {}

        ~RuntimeValue() {}
};

// RuntimeValueArray is a memory-efficient class for managing arrays of RuntimeValue.
class RuntimeValueArray {

    private:
        int size = 0;                       // the number of items
        RuntimeValue** array = nullptr;     // the array of items
        LinkedList* list;                   // A list to hold new data items as they are added
        
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
        RuntimeValue* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (RuntimeValue*)list->get(n - size);
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a value. This goes into the linked list.
        void add(RuntimeValue* item) {
            list->add(item);
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            RuntimeValue** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new RuntimeValue*[total];
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
                    array[size++] = (RuntimeValue*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("RuntimeValue: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the values in the array
        void dump() {
            for (int n = 0; n < getSize(); n++) {
                RuntimeValue* rv = get(n);
                print("-- %s\n", rv->getTextValue());
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        RuntimeValueArray() {
            list = new LinkedList();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~RuntimeValueArray() {
            delete array;
            array = nullptr;
            delete list;
            list = nullptr;
            #if DESTROY
            print("RuntimeValueArray: Delete %s\n", name);
            #endif
         }
};


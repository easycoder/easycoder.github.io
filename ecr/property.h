class PropertyArray;

class Property {

    private:

        Text* key = nullptr; 
        Text* value = nullptr; 
        PropertyArray* properties = nullptr;
        bool newKey = false;

    public:

        void setName(Text* t) {
            key = t;
        }

        void setValue(Text* t) {
            value = t;
        }

        void setProperties(PropertyArray* pa) {
            properties = pa;
        }

        Text* getKey() {
            return key;
        }

        bool hasValue() {
            return value != nullptr;
        }

        Text* getValue() {
            return value;
        }

        bool hasProperties() {
            return properties != nullptr;
        }

        PropertyArray* getProperties() {
            return properties;
        }

        void dump(bool newline) {
            print("%s->%s", key->getText(), value->getText());
            if (newline) {
                print("\n");
            }
        }

        Property(Text* k, Text* v) {
            key = k;
            value = v;
            properties = nullptr;
        }

        Property(Text* k, PropertyArray* p) {
            key = k;
            value = nullptr;
            properties = p;
        }

        Property(const char* k, PropertyArray* p) {
            key = new Text(k);
            newKey = true;
            value = nullptr;
            properties = p;
        }

        ~Property() {
            if (newKey) {
                delete key;
            }
        }
};

// PropertyArray is a memory-efficient class for managing an array of properties
class PropertyArray {

    private:
        
        int size = 0;                              // the number of properties
        Property** array = nullptr;                // the array of properties
        LinkedList* list = new LinkedList();       // A list to hold new properties as they are added
        
    public:
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array and list combined)
        int getSize() {
            return this->size + list->getSize();
        };

        ///////////////////////////////////////////////////////////////////////
        // Get a specified property.
        // If the index is greater than the array size but not greater than
        // the combined size of array and list, return the item from the list.
        Property* get(int n) {
            if (n < size) {
                return array[n];
            }
            else if (n < size + list->getSize()) {
                return (Property*)list->get(n - size);
            }
            return nullptr;
        };

        ///////////////////////////////////////////////////////////////////////
        // Get a property by key
        Property* getProperty(const char* key) {
            for (int n = 0; n < size; n++) {
                Property* property = get(n);
                const char* k = property->getKey()->getText();
                if (property->getKey()->is(key)) {
                    return property;
                }
            }
            return nullptr;
        }

        Property* getProperty(Text* key) {
            return getProperty(key->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a property. This goes into the linked list.
        void addProperty(Property* prop) {
            list->add(prop);
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a property. This goes into the linked list.
        void addProperty(Text* key, Text* value) {
            list->add(new Property(key, value));
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a property. This goes into the linked list.
        void addProperty(Text* key, PropertyArray* value) {
            list->add(new Property(key, value));
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a property. This goes into the linked list.
        void addProperty(const char* key, PropertyArray* value) {
            list->add(new Property(key, value));
        }

        ///////////////////////////////////////////////////////////////////////
        // Set a property. If it doesn't exist, add it.
        void setProperty(const char* key, Text* value) {
            flatten();
            if (getProperty(key) == nullptr) {
                list->add(new Property(new Text(key), value));
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Set a property. If it doesn't exist, add it.
        void setProperty(Text* key, Text* value) {
            flatten();
            if (getProperty(key) == nullptr) {
                list->add(new Property(key, value));
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Set a property. If it doesn't exist, add it.
        void setProperty(Text* key, PropertyArray* value) {
            flatten();
            if (getProperty(key) == nullptr) {
                list->add(new Property(key, value));
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Set a property. If it doesn't exist, add it.
        void setProperty(const char* key, PropertyArray* value) {
            flatten();
            if (getProperty(key) == nullptr) {
                list->add(new Property(key, value));
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten this item by creating a single array to hold all the data.
        void flatten() {
            if (list->getSize() == 0) {
                return;
            }
            Property** oldArray = array;
            int oldSize = size;
            // Create a new array big enough for the old array and the list
            int total = oldSize + list->getSize();
            if (total > 0) {
                array = new Property*[total];
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
                    array[size++] = (Property*)list->get(n++);
                }
                list->clear();
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a copy of this array
        PropertyArray* copy() {
            PropertyArray* pa = new PropertyArray[size];
            for (int n = 0; n < size; n++) {
                Property* p = get(n);
                Text* key = p->getKey();
                Text* value = p->getValue();
                PropertyArray* properties = p->getProperties();

                if (p->hasValue()) {
                    pa->addProperty(key, value);
                } else {
                    pa->addProperty(key, properties);
                }
            }
            return pa;
        }

        ///////////////////////////////////////////////////////////////////////
        // Provide info about the object
        void info() {
            print("PropertyArray: list size=%d, array size=%d\n", list->getSize(), size);
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the properties in the array
        void dump(bool newline) {
            for (int n = 0; n < size; n++) {
                if (n > 0) {
                    print(", ");
                }
                Property* p = get(n);
                if (p->getValue() == nullptr) {
                    print("%s->{", p->getKey()->getText());
                    p->getProperties()->dump(false);
                    print("}");
                } else {
                    p->dump(false);
                }
            }
            if (newline) {
                print("\n");
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        PropertyArray() {
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~PropertyArray() {
            delete array;
            delete list;
        }
};


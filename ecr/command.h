// Command is an array of elements, held initially in a linked list and then in an array.
class Command {

    private:
        int line;                      // the number of items
        Functions* functions;
        ElementArray* elements = nullptr;     // an array of Element objects
        CoreValues* coreValues;
        int* noDomainValueMap;
        KeywordArray* noDomainValueTypes;     // an array of no-domain value types
        int valueIndex = 0;                   // used while building the nodomain array

        ///////////////////////////////////////////////////////////////////////
        // Get item codes from an {a}:{b} pair
        // If 'select' is false return the key; if true return the value
        // if 'text' is true return the key text, otherwise the code
        Text* getKeyValue(Element* element, bool select, bool text) {
            if (element->is("}")) {
                return element->getElement();
            }
            int colon = element->positionOf(':');
            if (colon < 0) {
                return nullptr;
            }
            Text* left = element->left(colon);
            Text* right = element->from(colon + 1);
            Text* retval = new Text(select ? right : left);
            if (text) {
                retval = getKeyArray()->get(atoi(retval->getText()));
            }
            delete left;
            delete right;
            return retval;
        }
        
    public:

        ///////////////////////////////////////////////////////////////////////
        // Get the element array
        ElementArray* getElements() {
            return elements;
        }
    
        ///////////////////////////////////////////////////////////////////////
        // Get the size (the number of elements in the array and list combined)
        int getSize() {
            return elements->getSize();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a specified Element.
        // If the index is greater than the array size but not greater than
        // the combined size of array and list, return the item from the list.
        Element* get(ElementArray* value, int n) {
            return value->get(n);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the text of a specified Element.
        Text* getElementText(ElementArray* value, int n) {
            return value->get(n)->getElement();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the code of a specified Element (known to be a numeric value).
        int getElementCode(ElementArray* value, int n) {
            return atoi(getElementText(value, n)->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Set the line number
        void setLineNumber(int l) {
            line = l;
        }

        ///////////////////////////////////////////////////////////////////////
        // Set the key array
        void setKeyArray(TextArray* keyArray) {
            functions->setKeyArray(keyArray);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the key array
        TextArray* getKeyArray() {
            return functions->getKeyArray();
        }

        ///////////////////////////////////////////////////////////////////////
        // Set the symbol array
        void setSymbols(SymbolArray* symbols) {
            functions->setSymbols(symbols);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the symbols
        SymbolArray* getSymbols() {
            return functions->getSymbols();
        }

        ///////////////////////////////////////////////////////////////////////
        // Set the core values
        void setCoreValues(CoreValues* v) {
            coreValues = v;
        }

        ///////////////////////////////////////////////////////////////////////
        // Add an element. This goes into the linked list.
        void add(Element* element) {
            elements->add(element);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Set the value of a variable
        void setSymbolValue(const char* key, RuntimeValue* runtimeValue) {
            // First we find the variable. Start by flattening the symbol array.
            Symbol* symbol = getSymbol(key);
            // Put the given value into the symbol
            symbol->setValue(runtimeValue);
        }

        ///////////////////////////////////////////////////////////////////////
        // Add a no-domain value type
        void addNoDomainType(const char* name) {
            int size = getKeyArray()->getSize();
            for (int n = 0; n < size; n++) {
                if (getKeyArray()->get(n)->is(name)) {
                    // printf("Adding %s at position %d pointing to %d\n", name, n, valueIndex);
                    Keyword* keyword = new Keyword();
                    keyword->setName(new Text(name));
                    keyword->setDomain(nullptr);
                    keyword->setIndex(n);
                    noDomainValueMap[n] = valueIndex;
                    noDomainValueTypes->add(keyword);
                }
            }
            valueIndex++;
        }

        ///////////////////////////////////////////////////////////////////////
        // Set up the no-domain key array
        void setupNoDomainKeyArray() {
            noDomainValueMap = new int[getKeyArray()->getSize()];
            noDomainValueTypes = new KeywordArray();
            addNoDomainType("text");
            addNoDomainType("int");
            addNoDomainType("boolean");
            addNoDomainType("cat");
            noDomainValueTypes->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a value element
        RuntimeValue* getRuntimeValue(ElementArray* value) {
            RuntimeValue* runtimeValue = new RuntimeValue();
            const char* domain = functions->getValuePropertyCode(value, "domain");
            const char* type = functions->getValuePropertyCode(value, "type");
            // Test for the special case 'cat'
            int t = atoi(type);
            if (strcmp(getKeyArray()->getText(t), "cat") == 0) {
                return coreValues->run(t, value, getSymbols(), functions);
            }
            if (domain == nullptr) {
                // Here if no domain specified
                Text* valueProperty = functions->getValueProperty(value, "content");
                if (valueProperty == nullptr) {
                    return nullptr;
                }
                int tt = noDomainValueMap[t];
                runtimeValue->setType(tt);
                const char* content = valueProperty->getText();
                switch (tt) {
                    case TEXT_VALUE:
                        runtimeValue->setTextValue(content);
                        break;
                    case INT_VALUE:
                        runtimeValue->setIntValue(atoi(content));
                        break;
                    case BOOL_VALUE:
                        runtimeValue->setBoolValue(atoi(content) != 0 ? "true" : "false");
                }
            } else {
                // Here it's domain-specific
                switch (atoi(domain)) {
                    case DOMAIN_CORE:
                        functions->setElements(value);
                        return coreValues->run(t, value, getSymbols(), functions);
                };
            }
            return runtimeValue;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named value in a command
        RuntimeValue* getRuntimeValue(const char* name) {
            // Look for this name then process it
            for (int n = 0; n < elements->getSize(); n++) {
                Element* element = elements->get(n);
                // Look for a value part
                int colon = element->positionOf(':');
                if (colon > 0) {
                    Text* left = element->left(colon);
                    if (getKeyArray()->get(atoi(left->getText()))->is(name)) {
                        // Verify that the right-hand element is an open brace
                        Text* right = element->from(colon + 1);
                        if (right->is("{")) {
                            delete right;
                            // print("Process an inner value\n");
                            return getRuntimeValue(element->getValue());
                        } else {
                            printf("Item %d of command; expecting '{' but got %s:\n", n, right->getText());
                            dump();
                            exit(1);
                        }
                    }
                    delete left;
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Find the code for a named value property
        const char* getCommandPropertyCode(const char* key) {
            for (int n = 0; n < getSize(); n++) {
                Text* item = getKeyValue(elements->get(n), false, true);
                if (item == nullptr) {
                    continue;
                } else if (item->is(key)) {
                    Text* value = getKeyValue(elements->get(n), true, false);
                    return value->getText();
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a named value property
        Text* getCommandProperty(const char* key) {
            int val = atoi(getCommandPropertyCode(key));
            if (val >= 0) {
                return getKeyArray()->get(val);
            }
            return nullptr;
        }

        Text* getCommandProperty(Text* key) {
            return getCommandProperty(key->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a symbol
        Symbol* getSymbol(const char* key) {
            return functions->getSymbol(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named element of a command, as text
        const char* getTextValue(const char* key) {
            RuntimeValue* value = getRuntimeValue(key);
            if (value == nullptr) {
                return nullptr;
            }
            char* buf;
            switch (value->getType()) {
                case TEXT_VALUE: {
                        const char* v = value->getTextValue();
                        int  len = strlen(v);
                        buf = new char[len + 1];
                        strcpy(buf, v);
                    }
                    break;
                case INT_VALUE:
                    buf = new char[12];
                    sprintf(buf, "%d", value->getIntValue());
                    break;
                case BOOL_VALUE:
                    buf = new char[6];
                    sprintf(buf, "%s", value->getBoolValue() ? "true" : "false");
                    break;
                case CAT_VALUE:
                    break;
            };
            return buf;
        }

        ///////////////////////////////////////////////////////////////////////
        // Flatten the element array
        void flatten() {
            elements->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the elements in the command
        void dump() {
            elements->dump();
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        Command(Functions* functions) {
            this->functions = functions;
            functions->setElements(elements = new ElementArray());
            setupNoDomainKeyArray();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Command() {
            delete elements;
            elements = nullptr;
            delete noDomainValueTypes;
            noDomainValueTypes = nullptr;
            delete[] noDomainValueMap;
         }
};

// CommandArray is a memory-efficient class for managing arrays of commands.
class CommandArray {

    private:
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
                    delete[] oldArray;
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
            }
            print("\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        CommandArray() {
            list = new LinkedList();
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

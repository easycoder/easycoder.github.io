// Command is an array of elements, held initially in a linked list and then in an array.
class Command {

    private:
        int line;                             // the number of items
        Functions* functions;
        // ElementArray* elements = nullptr;     // an array of Element objects
        CoreValues* coreValues;
        CoreConditions* coreConditions;
        int* noDomainValueMap;
        KeywordArray* noDomainValueTypes;     // an array of no-domain value types
        int valueIndex = 0;                   // used while building the nodomain array
        
        ///////////////////////////////////////////////////////////////////////
        // Get a key
        Text* getKey(int index) {
            return getKeyArray()->get(index);
        }

        Text* getKey(const char* index) {
            return getKey(atoi(index));
        }

        Text* getKey(Text* index) {
            return getKey(atoi(index->getText()));
        }

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
                retval = getKey(retval->getText());
            }
            delete left;
            delete right;
            return retval;
        }
        
    public:

        ///////////////////////////////////////////////////////////////////////
        // Show an element list in detail
        void showElements(ElementArray* elements, int indent) {
            for (int m = 0; m < indent; m++) {
                print("  ");
            }
            for (int n = 0; n < elements->getSize(); n++) {
                Element* element = elements->get(n);
                ElementArray* value = element->getValue();
                if (value != nullptr) {
                    print("\n");
                    showElements(value, indent + 1);
                } else {
                    Text* text = element->getElement();
                    int p = text->positionOf(':');
                    if (p > 0) {
                        Text* left = text->left(p);
                        Text* right = text->from(p + 1);
                        print("%s:", getKey(left)->getText());
                        if (right->is("{")) {
                            print("{");
                        } else {
                            print("%s, ", getKey(right)->getText());
                        }
                    }
                }
            }
            print("\n");
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a specified Element.
        Element* get(ElementArray* elements, int n) {
            return elements->get(n);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the text of a specified Element.
        Text* getElementText(ElementArray* elements, int n) {
            return elements->get(n)->getElement();
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the code of a specified Element (known to be a numeric value).
        int getElementCode(ElementArray* elements, int n) {
            return atoi(getElementText(elements, n)->getText());
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
        // Set the core conditions
        void setCoreConditions(CoreConditions* c) {
            coreConditions = c;
        }

        ///////////////////////////////////////////////////////////////////////
        // Add an element. This goes into the linked list.
        void add(ElementArray* elements, Element* element) {
            elements->add(element);
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a symbol
        Symbol* getSymbol(ElementArray* elements, const char* key) {
            return functions->getSymbol(elements, key);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Set the value of a variable
        void setSymbolValue(ElementArray* elements, const char* key, RuntimeValue* runtimeValue) {
            Symbol* symbol = getSymbol(elements, key);
            symbol->setValue(runtimeValue);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Get the value of a variable
        RuntimeValue* getSymbolValue(ElementArray* elements, const char* key) {
            Symbol* symbol = getSymbol(elements, key);
            return symbol->getValue();
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Get the line number
        // int getLineNumber(ElementArray* elements) {
        //     return atoi(elements->get(0)->getElement()->getText()) + 1;
        // }

        ///////////////////////////////////////////////////////////////////////
        // Add a no-domain value type
        void addNoDomainType(const char* name) {
            int size = getKeyArray()->getSize();
            for (int n = 0; n < size; n++) {
                if (getKey(n)->is(name)) {
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
        // Get the named parameter
        Text* getParameter(ElementArray* elements, const char* key) {
            return functions->getValueProperty(elements, key);
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a named element array
        ElementArray* getElementArray(ElementArray* elements, const char* name) {
            // Look for the named array
            for (int n = 0; n < elements->getSize(); n++) {
                Element* element = elements->get(n);
                // Look for a value part
                int colon = element->positionOf(':');
                if (colon > 0) {
                    Text* left = element->left(colon);
                    if (getKey(left->getText())->is(name)) {
                        // Verify that the right-hand element is an open brace
                        Text* right = element->from(colon + 1);
                        if (right->is("{")) {
                            delete right;
                            return element->getValue();
                        }
                    }
                    delete left;
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get a named element array
        // ElementArray* getElementArray(const char* name) {
        //     return getElementArray(elements, name);
        // }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a value element
        RuntimeValue* getRuntimeValue(ElementArray* elements) {
            RuntimeValue* runtimeValue = new RuntimeValue();
            const char* domain = functions->getValuePropertyCode(elements, "domain");
            const char* type = functions->getValuePropertyCode(elements, "type");
            functions->setElements(elements);
            // Test for the special case 'cat'
            int t = atoi(type);
            const char* token = getKeyArray()->getText(t);
            if (strcmp(token, "cat") == 0) {
                // Find the cat array
                for (int n = 0; n < elements->getSize(); n++) {
                    Element* el = elements->get(n);
                    // Look for a value part
                    int colon = el->positionOf(':');
                    if (colon > 0) {
                        Text* left = el->left(colon);
                        if (getKey(left->getText())->is("value")) {
                            delete left;
                            ElementArray* values = el->getValue();
                            int size = values->getSize();
                            RuntimeValueArray* rva = new RuntimeValueArray();
                            // Get the component parts of the 'cat'
                            for (int m = 0; m < size; m++) {
                                RuntimeValue* rv = getRuntimeValue(values->get(m)->getValue());
                                rva->add(rv);
                            }
                            rva->flatten();
                            return coreValues->run(t, functions, rva);
                        }
                        delete left;
                    }
                }
                sprintf(exceptionBuffer, "Bad value in 'cat'\n");
                throw exceptionBuffer;
            }

            // Test for the special case 'property'
            if (strcmp(token, "property") == 0) {
                Symbol* target = functions->getSymbol(elements, "target");
                ElementArray* ela = getElementArray(elements, "name");
                target->getProperties()->flatten();
                const char* keyValue = getRuntimeValue(ela)->getTextValue();
                PropertyArray* properties = target->getProperties();
                properties->dump(true);
                Property* property = properties->getProperty(keyValue);
                if (property == nullptr) {
                    sprintf(exceptionBuffer, "Property '%s' not found\n", keyValue);
                    throw exceptionBuffer;
                }
                Text* value = property->getValue();
                if (value != nullptr) {
                    runtimeValue->setType(TEXT_VALUE);
                    runtimeValue->setTextValue(value->getText());
                    return runtimeValue;
                }
                sprintf(exceptionBuffer, "Property '%s' is an object\n", keyValue);
                throw exceptionBuffer;
            }

            if (domain == nullptr) {
                // Here if no domain specified
                Text* valueProperty = functions->getValueProperty(elements, "content");
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
                        functions->setElements(elements);
                        return coreValues->run(t, functions, nullptr);
                };
            }
            return runtimeValue;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named value in a command
        // RuntimeValue* getRuntimeValue(ElementArray* elements, const char* name) {
        //     return elements == nullptr ? nullptr : getRuntimeValue(elements);
        // }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named value in a command
        RuntimeValue* getRuntimeValue(ElementArray* elements, const char* name) {
            // Look for this name then process it
            for (int n = 0; n < elements->getSize(); n++) {
                Element* element = elements->get(n);
                // Look for a value part
                int colon = element->positionOf(':');
                if (colon > 0) {
                    Text* left = element->left(colon);
                    if (getKey(left->getText())->is(name)) {
                        // Verify that the right-hand element is an open brace
                        Text* right = element->from(colon + 1);
                        if (right->is("{")) {
                            delete right;
                            return getRuntimeValue(element->getValue());
                        } else {
                            dump();
                            sprintf(exceptionBuffer, "Expecting '{' but got %s\n", right->getText());
                            throw exceptionBuffer;
                        }
                    }
                    delete left;
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Process a condition
        bool processCondition(ElementArray* elements) {
            Text* domain = nullptr;
            Text* type = nullptr;
            functions->setElements(elements);
            Condition* condition = new Condition();
            int size = elements->getSize();
            for (int n = 0; n < size; n++) {
                Element* element = elements->get(n);
                int colon = element->positionOf(':');
                Text* left = element->left(colon);
                Text* right = element->from(colon + 1);
                Text* name = getKey(left->getText());
                if (right->is("{")) {
                    condition->addValue(getRuntimeValue(element->getValue()));
                } else if (name->is("negate")) {
                    const char* tf = getKey(right->getText())->getText();
                    if (strcmp(tf, "True") == 0) {
                        condition->setNegate(true);
                    }
                    else {
                        condition->setNegate(false);
                    }
                } else if (name->is("domain")) {
                    domain = getKey(right->copy());
                } else if (name->is("type")) {
                    type = getKey(right->copy());
                } else {
                    sprintf(exceptionBuffer, "Unknown property '%s' at line %d\n", getKey(left->getText())->getText(), elements->getLineNumber());
                    throw exceptionBuffer;
                }
                delete left;
                delete right;
            }

            if (domain == nullptr) {
                sprintf(exceptionBuffer, "No domain specified at line %d\n", elements->getLineNumber());
                throw exceptionBuffer;
            }
            if (type == nullptr) {
                sprintf(exceptionBuffer, "No condition type specified at line %d\n", elements->getLineNumber());
                throw exceptionBuffer;
            }
            condition->flatten();
            condition->setType(type->getText());
            functions->setElements(elements);
            if (domain->is("core")) {
                return coreConditions->run(condition, functions);
            };
            return false;
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the named runtime condition
        bool getCondition(ElementArray* elements) {
            // Look for this name then process it
            for (int n = 0; n < elements->getSize(); n++) {
                Element* element = elements->get(n);
                // Look for a value part
                int colon = element->positionOf(':');
                if (colon > 0) {
                    Text* left = element->left(colon);
                    if (getKey(left->getText())->is("condition")) {
                        // Verify that the right-hand element is an open brace
                        Text* right = element->from(colon + 1);
                        if (right->is("{")) {
                            delete right;
                            // print("Process a condition\n");
                            return processCondition(element->getValue());
                        } else {
                            dump();
                            sprintf(exceptionBuffer, "Item %d of command; expecting '{' but got %s:\n", n, right->getText());
                            throw exceptionBuffer;
                        }
                    }
                    delete left;
                }
            }
            return false;
        }

        // ///////////////////////////////////////////////////////////////////////
        // // Find a label
        // Symbol* getLabel(const char* name) {
        //     for (int n = 0; n < elements->getSize(); n++) {
        //         Element* element = elements->get(n);
        //         if (element == nullptr) {
        //             continue;
        //         // } else if (element->is(name)) {
        //         //     return value->getText();
        //         }
        //     }
        //     return nullptr;
        // }

        ///////////////////////////////////////////////////////////////////////
        // Find the code for a named value property
        const char* getCommandPropertyCode(ElementArray* elements, const char* key) {
            for (int n = 0; n < elements->getSize(); n++) {
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
        Text* getCommandProperty(ElementArray* elements, const char* key) {
            int val = atoi(getCommandPropertyCode(elements, key));
            if (val >= 0) {
                return getKey(val);
            }
            return nullptr;
        }

        Text* getCommandProperty(ElementArray* elements, Text* key) {
            return getCommandProperty(elements, key->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Get the runtime value of a named element of a command, as text
        const char* getTextValue(ElementArray* elements, const char* key) {
            RuntimeValue* value = getRuntimeValue(elements, key);
            if (value == nullptr) {
                return nullptr;
            }
            return value->getTextValue();
        }

        ///////////////////////////////////////////////////////////////////////
        // Print all the elements in the command
        void dump() {
            // elements->dump();
        }

        ///////////////////////////////////////////////////////////////////////
        // Default constructor
        Command(Functions* functions) {
            this->functions = functions;
            // functions->setElements(elements = new ElementArray());
            setupNoDomainKeyArray();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Command() {
            // delete elements;
            // elements = nullptr;
            // delete noDomainValueTypes;
            noDomainValueTypes = nullptr;
            delete[] noDomainValueMap;
         }
};
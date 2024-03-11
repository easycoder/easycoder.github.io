class Functions {

    private:

        TextArray* keyArray;
        SymbolArray* symbols;
        ElementArray* elements;
        TextArray* value;
    
    public:

        void setKeyArray(TextArray* keyArray) {
            this->keyArray = keyArray;
        }

        void setSymbols(SymbolArray* symbols) {
            this->symbols = symbols;
        }

        void setElements(ElementArray* elements) {
            this->elements = elements;
        }

        TextArray* getKeyArray() {
            return keyArray;
        }

        SymbolArray* getSymbols() {
            return symbols;
        }

        ElementArray* getElements() {
            return elements;
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
                retval = keyArray->get(atoi(retval->getText()));
            }
            delete left;
            delete right;
            return retval;
        }

        ///////////////////////////////////////////////////////////////////////
        // Find the code for a named value property
        const char* getValuePropertyCode(ElementArray* value, const char* key) {
            for (int n = 0; n < value->getSize(); n++) {
                Text* item = getKeyValue(value->get(n), false, true);
                if (item == nullptr) {
                    continue;
                } else if (item->is(key)) {
                    Text* t = getKeyValue(value->get(n), true, false);
                    return t->getText();
                }
            }
            return nullptr;
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a named value property
        Text* getValueProperty(ElementArray* value, const char* key) {
            const char* code = getValuePropertyCode(value, key);
            if (code != nullptr) {
                int val = atoi(code);
                if (val >= 0) {
                    return keyArray->get(val);
                }
            }
            return nullptr;
        }

        Text* getValueProperty(ElementArray* value, Text* key) {
            return getValueProperty(value, key->getText());
        }

        ///////////////////////////////////////////////////////////////////////
        // Find a symbol
        Symbol* getSymbol(const char* key) {
            symbols->flatten();
            const char* keyCode = nullptr;
            const char* nameCode = nullptr;
            Element* element;
            Text* left;
            Text* right;
            int index;
            // Get the key of the variable
            for (int index = 0; index < elements->getSize(); index++) {
                element = elements->get(index);
                int colon = element->positionOf(':');
                if (colon < 0) {
                    continue;
                }
                left = element->left(colon);
                right = element->from(colon + 1);
                // If this one matches, break out.
                if (keyArray->get(left)->is(key)) {
                    keyCode = left->getText();
                    nameCode = right->getText();
                    break;
                } else {
                    delete left;
                    delete right;
                    continue;
                }
            }
            if (nameCode == nullptr) {
                printf("Key '%s' not found in element array\n", key);
                elements->dump();
                exit(1);
            }
            // Now we have the key code, so check if it has a # prefix
            Symbol* symbol;
            if (nameCode[0] != '#') {
                // This is the first time this symbol has been seen
                // Get the symbol's name
                Text* name = keyArray->get(atoi(nameCode));
                // Look up the symbol
                for (int s = 0; s < symbols->getSize(); s++) {
                    symbol = symbols->get(s);
                    if (symbol->getName()->is(name)) {
                        // Replace the symbol name key with its index prefixed by #
                        char buf[16];
                        strcpy(buf, keyCode);
                        strcat(buf, ":#");
                        sprintf(&buf[strlen(buf)],"%d", s);
                        element->setElement(new Text(buf));
                        break;
                    }
                }
            } else {
                // It's been seen before, so fetch it directly
                symbol = symbols->get(atoi(&nameCode[1]));
            }
            delete left;
            delete right;
            return symbol;
        }

        Symbol* getSymbol(ElementArray* elements, const char* key) {
            this->elements = elements;
            return getSymbol(key);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Dump the values of all variables
        void showSymbolValues() {
            for (int s = 0; s < symbols->getSize(); s++) {
                Symbol* symbol = symbols->get(s);
                symbol->dump();
            }
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Error exit
        void notImplemented(const char* code) {
            printf("'%s' not implemented\n", code);
            exit(1);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Constructor
        Functions(TextArray* keyArray, SymbolArray* symbols) {
            setKeyArray(keyArray);
            setSymbols(symbols);
        }
        
        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~Functions() {
        }
};

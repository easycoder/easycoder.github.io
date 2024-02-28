class RuntimeValue {

    private:

        int type;
        const char* textValue;
        int intValue;
        bool boolValue;

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
            return textValue;
        }

        int getIntValue() {
            return intValue;
        }

        bool getBoolValue() {
            return boolValue;
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

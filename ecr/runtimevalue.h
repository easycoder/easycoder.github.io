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

        RuntimeValue() {}

        ~RuntimeValue() {}
};

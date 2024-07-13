class Condition {

    private:

        const char* type;
        bool negate = false;
        RuntimeValueArray* values;

    public:

        void setType(const char* type) {
            this->type = type;
        }

        const char* getType() {
            return type;
        }

        void setNegate(bool negate) {
            this->negate = negate;
        }

        bool isNegate() {
            return negate;
        }

        void addValue(RuntimeValue* value) {
            values->add(value);
        }

        RuntimeValue* getValue(int index) {
            return values->get(index);
        }

        void flatten() {
            values->flatten();
        }

        void dump() {
            values->flatten();
            print("%s: ", type);
            for (int n = 0; n < values->getSize(); n++) {
                print("%s ", values->get(n)->getTextValue());
            }
            print("\n");
        }

        Condition() {
            values = new RuntimeValueArray();
        }

        ~Condition() {
            delete values;
        }
};


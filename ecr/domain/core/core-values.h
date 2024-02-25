#include "../../debug.h"

// Values for the 'core' domain
class CoreValues {

    private:

        ValueArray* values;
        Text* domain = new Text("core");

        void add(Text* name, int code)  {
            values->add(new Value(name, domain, code));
        }

        void add(const char* name, int code) {
            add(new Text(name), code);
        }

    public:

        void dump() {
            print("This is the list of value keywords defined for the 'core' package\n");
            for (int n = 0; n < values->getSize(); n++) {
                Value* v = values->get(n);
                print("%s\n", v->getName()->getText());
            }
            print("-----------------\n");
        };

        void init(ValueArray* values) {
            this->values = values;
            add("text", _CORE_TEXT_);
            add("int", _CORE_INT_);
            add("bool", _CORE_BOOL_);
        };

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        CoreValues() {}

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~CoreValues() {
            delete domain;
            print("CoreValues: Destructor executed\n");
        }
};

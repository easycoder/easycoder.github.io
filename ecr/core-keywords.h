// Keywords for the 'core' domain
class CoreKeywords {

    private:

        enum coreIndices {
            ADD,
            APPEND,
            ARRAY,
            BEGIN,
            CLEAR,
            CLOSE,
            DECREMENT,
            DELETE,
            DUMMY,
            END,
            EXIT,
            FILE,
            FORK,
            GET,
            GOSUB,
            GO,
            GOTO,
            GOTOPC,
            IF,
            INCREMENT,
            INDEX,
            INIT,
            MULTIPLY,
            OBJECT,
            OPEN,
            POP,
            POST,
            PRINT,
            PUSH,
            PUT,
            READ,
            REPLACE,
            RETURN,
            SCRIPT,
            SET,
            SPLIT,
            STACK,
            STOP,
            SYSTEM,
            TAKE,
            VARIABLE,
            WAIT,
            WHILE,
            WRITE
        };

        int index = 0;
        int* map;
        TextArray* keyArray;
        KeywordArray* keywords;
        Text* domain = new Text("core");

        ///////////////////////////////////////////////////////////////////////
        // Add a keyword. Only add keywords that are found in the key array.
        // The map contains the index of the variable (and thus its handler)
        // against the index of its name in the key array.
        void add(const char* name) {
            int size = keyArray->getSize();
            for (int n = 0; n < size; n++) {
                if (keyArray->get(n)->is(name)) {
                    Keyword* keyword = new Keyword();
                    keyword->setName(new Text(name));
                    keyword->setDomain(domain);
                    keyword->setIndex(n);
                    map[n] = index;
                    keywords->add(keyword);
                    break;
                }
            }
            index++;
        }

    public:

        void info() {
            print("This is the list of keywords defined for the 'core' package\n");
            for (int n = 0; n < keywords->getSize(); n++) {
                Keyword* k = (Keyword*)keywords->get(n);
                print("%s\n", k->getName()->getText());
            }
            print("-----------------\n");
        };

        ///////////////////////////////////////////////////////////////////////
        // Get the keyword array
        KeywordArray* getKeywords() {
            return keywords;
        }

        ///////////////////////////////////////////////////////////////////////
        // Run a command. All the information needed is in 'runtime'
        int run(Runtime* runtime, int code) {
            RuntimeValue* runtimeValue;
            RuntimeValue* runtimeValue2;
            int next = runtime->getPC() + 1;
            int index = map[code];
            switch (index)
            {
                case ADD: {
                    runtimeValue = runtime->getRuntimeValue("value1");
                    runtimeValue2 = runtime->getRuntimeValue("value2");
                    Symbol* target = runtime->getSymbol("target");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    runtimeValue->setIntValue(runtimeValue->getIntValue() + runtimeValue2->getIntValue());
                    runtime->setSymbolValue("target", runtimeValue->copy());
                    return next;
                }
                case APPEND:
                    return -1;
                case ARRAY:
                    return -1;
                case BEGIN:
                    return -1;
                case CLEAR:
                    return -1;
                case CLOSE:
                    return -1;
                case DECREMENT:
                    return -1;
                case DELETE:
                    return -1;
                case DUMMY:
                    return -1;
                case END:
                    return -1;
                case EXIT:{
                    return -1;
                }
                case FILE:
                    return -1;
                case FORK:
                    return -1;
                case GET:
                    return -1;
                case GOSUB:
                    return -1;
                case GO:
                case GOTO:
                    return -1;
                case GOTOPC:
                    return -1;
                case IF:
                    return -1;
                case INCREMENT:
                    return -1;
                case INDEX:
                    return -1;
                case INIT:
                    return -1;
                case MULTIPLY:
                    return -1;
                case OBJECT:
                    return -1;
                case OPEN:
                    return -1;
                case POP:
                    return -1;
                case POST:
                    return -1;
                case PRINT:{
                    const char* buf = runtime->getTextValue("value");
                    if (buf == nullptr) {
                        print("No 'value' at line %d\n", atoi(runtime->getLineNumber()) + 1);
                        exit(1);
                    }
                    printf("->%s\n", buf);
                    delete[] buf;
                    return next;
                }
                case PUSH:
                    return -1;
                case PUT:{
                    runtimeValue = runtime->getRuntimeValue("value");
                    runtime->setSymbolValue("target", runtimeValue->copy());
                    return runtime->getPC() + 1;
                }
                case READ:
                    return -1;
                case REPLACE:
                    return -1;
                case RETURN:
                    return -1;
                case SCRIPT:
                    return -1;
                case SET:
                    return -1;
                case SPLIT:
                    return -1;
                case STACK:
                    return -1;
                case STOP:
                    return -1;
                case SYSTEM:
                    return -1;
                case TAKE:
                    return -1;
                case VARIABLE:{
                    int pc = runtime->getPC();
                    Symbol* symbol = new Symbol(runtime->getCommand()->getCommandProperty("name"));
                    runtime->getSymbols()->add(symbol);
                    return next;
                }
                case WAIT:
                    return -1;
                case WHILE:
                    return -1;
                case WRITE:
                    return -1;
                default:
                    print("Unknown keyword code %d in core-keywords\n", index);
                    return -1;
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // Constructor
        CoreKeywords(TextArray* array) {
            keyArray = array;
            map = new int[array->getSize()];
            keywords = new KeywordArray();
            add("add");
            add("append");
            add("array");
            add("begin");
            add("clear");
            add("close");
            add("decrement");
            add("delete");
            add("dummy");
            add("end");
            add("exit");
            add("file");
            add("fork");
            add("get");
            add("gosub");
            add("go");
            add("goto");
            add("gotoPC");
            add("if");
            add("increment");
            add("index");
            add("init");
            add("multiply");
            add("object");
            add("open");
            add("pop");
            add("post");
            add("print");
            add("push");
            add("put");
            add("read");
            add("replace");
            add("return");
            add("script");
            add("set");
            add("split");
            add("stack");
            add("stop");
            add("system");
            add("take");
            add("variable");
            add("wait");
            add("while");
            add("write");
            keywords->flatten();
        }

        ///////////////////////////////////////////////////////////////////////
        // Destructor
        ~CoreKeywords() {
            delete[] map;
            print("CoreKeywords: Destructor executed\n");
         }
};

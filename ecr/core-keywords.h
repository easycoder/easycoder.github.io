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
            DIVIDE,
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
            RuntimeValue* runtimeValue = nullptr;
            RuntimeValue* runtimeValue2 = nullptr;
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
                // case APPEND:
                // case ARRAY:
                // case BEGIN:
                // case CLEAR:
                // case CLOSE:
                // case DECREMENT:
                // case DELETE:
                case DIVIDE: {
                    runtimeValue = runtime->getRuntimeValue("value1");
                    runtimeValue2 = runtime->getRuntimeValue("value2");
                    Symbol* target = runtime->getSymbol("target");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    runtimeValue->setIntValue(runtimeValue->getIntValue() / runtimeValue2->getIntValue());
                    runtime->setSymbolValue("target", runtimeValue->copy());
                    return next;
                }
                // case DUMMY:
                // case END:
                case EXIT:
                    return FINISHED;
                // case FILE:
                // case FORK:
                // case GET:
                // case GOSUB:
                // case GO:
                // case GOTO:
                case GOTOPC:
                    return atoi(runtime->getValueProperty(runtime->getCommand()->getElements(), "goto")->getText());
                // case IF:
                // case INCREMENT:
                // case INDEX:
                // case INIT:
                case MULTIPLY: {
                    runtimeValue = runtime->getRuntimeValue("value1");
                    runtimeValue2 = runtime->getRuntimeValue("value2");
                    Symbol* target = runtime->getSymbol("target");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    runtimeValue->setIntValue(runtimeValue->getIntValue() * runtimeValue2->getIntValue());
                    runtime->setSymbolValue("target", runtimeValue->copy());
                    return next;
                }
                // case OBJECT:
                // case OPEN:
                // case POP:
                // case POST:
                case PRINT:{
                    const char* buf = runtime->getTextValue("value");
                    if (buf == nullptr) {
                        print("No 'value' at line %d\n", atoi(runtime->getLineNumber()) + 1);
                        exit(1);
                    }
                    printf("->%s\n", buf);
                    return next;
                }
                // case PUSH:
                case PUT:{
                    runtimeValue = runtime->getRuntimeValue("value");
                    runtime->setSymbolValue("target", runtimeValue->copy());
                    return runtime->getPC() + 1;
                }
                // case READ:
                // case REPLACE:
                // case RETURN:
                // case SCRIPT:
                // case SET:
                // case SPLIT:
                // case STACK:
                case STOP:
                    return STOPPED;
                // case SYSTEM:
                case TAKE: {
                    runtimeValue = runtime->getRuntimeValue("value1");
                    runtimeValue2 = runtime->getRuntimeValue("value2");
                    Symbol* target = runtime->getSymbol("target");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    runtimeValue->setIntValue(runtimeValue2->getIntValue() - runtimeValue->getIntValue());
                    runtime->setSymbolValue("target", runtimeValue->copy());
                    return next;
                }
                case VARIABLE:{
                    Symbol* symbol = new Symbol(runtime->getCommand()->getCommandProperty("name"));
                    runtime->getSymbols()->add(symbol);
                    return next;
                }
                case WAIT: {
                    runtimeValue = runtime->getRuntimeValue("value");
                    Text* multiplier = runtime->getParameter("multiplier");
                    long delay = runtimeValue->getIntValue() * atoi(multiplier->getText());
                    runtime->getThreads()->add(new Thread(delay, next));
                    return STOPPED;
                }
                case WHILE: {
                    bool condition = runtime->getCondition();
                    return condition ? next + 1 : next;
                    // return runtime->getCondition() ? next + 1 : next;
                }
                // case WRITE:
                default:
                    print("Unknown keyword code %d in core-keywords\n", index);
                    return FINISHED;
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
            add("divide");
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

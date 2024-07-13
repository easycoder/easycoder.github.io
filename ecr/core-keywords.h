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
            DEBUG,
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
        int run(ElementArray* elements, Runtime* runtime, int code) {
            RuntimeValue* runtimeValue = nullptr;
            RuntimeValue* runtimeValue2 = nullptr;
            int next = runtime->getPC() + 1;
            int index = map[code];
            switch (index)
            {
                case ADD: {
                    Symbol* target = runtime->getSymbol(elements, "target");
                    runtimeValue = runtime->getRuntimeValue(elements, "value1");
                    runtimeValue2 = runtime->getRuntimeValue(elements, "value2");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    target->setIntValue(runtimeValue->getIntValue() + runtimeValue2->getIntValue());
                    return next;
                }
                // case APPEND:
                // case ARRAY:
                // case BEGIN:
                // case CLEAR:
                // case CLOSE:
                case DEBUG: {
                    Text* type = runtime->getParameter(elements, "type");
                    singleStep = (type->is("step"));
                    return next;
                }
                case DECREMENT: {
                    Symbol* target = runtime->getSymbol(elements, "target");
                    runtimeValue = target->getValue();
                    runtimeValue->setIntValue(runtimeValue->getIntValue() - 1);
                    runtime->setSymbolValue(elements, "target", runtimeValue->copy());
                    return next;
                }
                // case DELETE:
                case DIVIDE: {
                    Symbol* target = runtime->getSymbol(elements, "target");
                    runtimeValue = runtime->getRuntimeValue(elements, "value1");
                    runtimeValue2 = runtime->getRuntimeValue(elements, "value2");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    target->setIntValue(runtimeValue->getIntValue() / runtimeValue2->getIntValue());
                    return next;
                }
                // case DUMMY:
                // case END:
                case EXIT:
                    return FINISHED;
                // case FILE:
                case FORK: {
                    runtime->getThreads()->add(new Thread(0, next));
                    Text* name = runtime->getCommandProperty(elements, "fork");
                    Symbol* label = runtime->getLabel(name->getText());
                    return next;
                }
                // case GET:
                // case GOSUB:
                // case GO:
                // case GOTO:
                case GOTOPC:
                    return atoi(runtime->getValueProperty(elements, "goto")->getText());
                case IF: {
                    return runtime->getCondition(elements) ? next + 1 : next;
                }
                case INCREMENT: {
                    Symbol* target = runtime->getSymbol(elements, "target");
                    target->setIntValue(target->getIntValue() + 1);
                    return next;
                }
                case INDEX:{
                    Symbol* target = runtime->getSymbol(elements, "target");
                    runtimeValue = runtime->getRuntimeValue(elements, "value");
                    target->setIndex(runtimeValue->getIntValue());
                    return next;
                }
                // case INIT:
                case MULTIPLY: {
                    Symbol* target = runtime->getSymbol(elements, "target");
                    runtimeValue = runtime->getRuntimeValue(elements, "value1");
                    runtimeValue2 = runtime->getRuntimeValue(elements, "value2");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    target->setIntValue(runtimeValue->getIntValue() * runtimeValue2->getIntValue());
                    return next;
                }
                case OBJECT:{
                    Symbol* symbol = new Symbol(runtime->getCommand()->getCommandProperty(elements, "name"));
                    runtime->getSymbols()->add(symbol);
                    return next;
                }
                // case OPEN:
                // case POP:
                // case POST:
                case PRINT:{
                    const char* buf = runtime->getTextValue(elements, "value");
                    if (buf == nullptr) {
                        sprintf(exceptionBuffer, "No 'value' at line %d\n", runtime->getLineNumber(elements) + 1);
                        throw exceptionBuffer;
                    }
                    printf("->%s\n", buf);
                    return next;
                }
                // case PUSH:
                case PUT:{
                    runtimeValue = runtime->getRuntimeValue(elements, "value");
                    runtime->setSymbolValue(elements, "target", runtimeValue->copy());
                    return next;
                }
                // case READ:
                // case REPLACE:
                // case RETURN:
                // case SCRIPT:
                case SET: {
                    Text* type = runtime->getParameter(elements, "type");
                    if (type->is("set")) {
                        Symbol* target = runtime->getSymbol(elements, "target");
                        target->setBoolValue(true);
                    } else if (type->is("elements")) {
                        Symbol* symbol = runtime->getCommand()->getSymbol(elements, "name");
                        runtimeValue = runtime->getRuntimeValue(elements, "value");
                        symbol->setElements(runtimeValue->getIntValue());
                    } else if (type->is("property")) {
                        Symbol* target = runtime->getSymbol(elements, "target");
                        Symbol* object = runtime->getSymbol(elements, "object");
                        runtimeValue = runtime->getRuntimeValue(elements, "value1");
                        if (object == nullptr) {
                            runtimeValue2 = runtime->getRuntimeValue(elements, "value2");
                            target->setProperty(runtimeValue, runtimeValue2);
                        } else {
                            target->setProperty(runtimeValue, object->getProperties());
                        }
                    } else if (type->is("setprop")) {
                        Symbol* source = runtime->getSymbol(elements, "source");
                        Symbol* target = runtime->getSymbol(elements, "target");
                        runtimeValue = runtime->getRuntimeValue(elements, "key");
                        PropertyArray* properties = source->getProperties();
                        properties->flatten();
                        Property* property = properties->getProperty(runtimeValue->getTextValue());
                        target->setProperties(property->getProperties());
                    }
                    return next;
                }
                // case SPLIT:
                // case STACK:
                case STOP:
                    return STOPPED;
                // case SYSTEM:
                case TAKE: {
                    Symbol* target = runtime->getSymbol(elements, "target");
                    runtimeValue = runtime->getRuntimeValue(elements, "value1");
                    runtimeValue2 = runtime->getRuntimeValue(elements, "value2");
                    if (runtimeValue2 == nullptr) {
                        runtimeValue2 = target->getValue();
                    }
                    target->setIntValue(runtimeValue2->getIntValue() - runtimeValue->getIntValue());
                    return next;
                }
                case VARIABLE:{
                    Symbol* symbol = new Symbol(runtime->getCommand()->getCommandProperty(elements, "name"));
                    runtime->getSymbols()->add(symbol);
                    return next;
                }
                case WAIT: {
                    runtimeValue = runtime->getRuntimeValue(elements, "value");
                    Text* multiplier = runtime->getParameter(elements, "multiplier");
                    long delay = runtimeValue->getIntValue() * atoi(multiplier->getText());
                    runtime->getThreads()->add(new Thread(delay, next));
                    return STOPPED;
                }
                case WHILE: {
                    return runtime->getCondition(elements) ? next + 1 : next;
                }
                // case WRITE:
                default:
                    sprintf(exceptionBuffer, "Unknown keyword code '%d'\n", code);
                    throw exceptionBuffer;
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
            add("debug");
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

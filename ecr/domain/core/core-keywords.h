#include "add.h"
#include "append.h"
#include "array.h"
#include "begin.h"
#include "clear.h"
#include "close.h"
#include "decrement.h"
#include "delete.h"
#include "divide.h"
#include "dummy.h"
#include "end.h"
#include "exit.h"
#include "file.h"
#include "fork.h"
#include "get.h"
#include "gosub.h"
#include "goto.h"
#include "gotopc.h"
#include "if.h"
#include "increment.h"
#include "index.h"
#include "init.h"
#include "multiply.h"
#include "object.h"
#include "open.h"
#include "pop.h"
#include "post.h"
#include "print.h"
#include "push.h"
#include "put.h"
#include "read.h"
#include "replace.h"
#include "return.h"
#include "script.h"
#include "set.h"
#include "split.h"
#include "stack.h"
#include "stop.h"
#include "system.h"
#include "take.h"
#include "variable.h"
#include "wait.h"
#include "while.h"
#include "write.h"

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
            int index = map[code];
            switch (index)
            {
                case ADD:
                    return core_add(runtime);
                case APPEND:
                    return core_append(runtime);
                case ARRAY:
                    return core_array(runtime);
                case BEGIN:
                    return core_begin(runtime);
                case CLEAR:
                    return core_clear(runtime);
                case CLOSE:
                    return core_close(runtime);
                case DECREMENT:
                    return core_decrement(runtime);
                case DELETE:
                    return core_delete(runtime);
                case DUMMY:
                    return core_dummy(runtime);
                case END:
                    return core_end(runtime);
                case EXIT:
                    return core_exit(runtime);
                case FILE:
                    return core_file(runtime);
                case FORK:
                    return core_fork(runtime);
                case GET:
                    return core_get(runtime);
                case GOSUB:
                    return core_gosub(runtime);
                case GO:
                case GOTO:
                    return core_goto(runtime);
                case GOTOPC:
                    return core_gotoPC(runtime);
                case IF:
                    return core_if(runtime);
                case INCREMENT:
                    return core_increment(runtime);
                case INDEX:
                    return core_index(runtime);
                case INIT:
                    return core_init(runtime);
                case MULTIPLY:
                    return core_multiply(runtime);
                case OBJECT:
                    return core_object(runtime);
                case OPEN:
                    return core_open(runtime);
                case POP:
                    return core_pop(runtime);
                case POST:
                    return core_post(runtime);
                case PRINT:
                    return core_print(runtime);
                case PUSH:
                    return core_push(runtime);
                case PUT:
                    return core_put(runtime);
                case READ:
                    return core_read(runtime);
                case REPLACE:
                    return core_replace(runtime);
                case RETURN:
                    return core_return(runtime);
                case SCRIPT:
                    return core_script(runtime);
                case SET:
                    return core_set(runtime);
                case SPLIT:
                    return core_split(runtime);
                case STACK:
                    return core_stack(runtime);
                case STOP:
                    return core_stop(runtime);
                case SYSTEM:
                    return core_system(runtime);
                case TAKE:
                    return core_take(runtime);
                case VARIABLE:
                    return core_variable(runtime);
                case WAIT:
                    return core_wait(runtime);
                case WHILE:
                    return core_while(runtime);
                case WRITE:
                    return core_write(runtime);
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

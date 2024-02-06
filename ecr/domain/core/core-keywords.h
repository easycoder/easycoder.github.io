#ifndef CORE_KEYWORDS_H
#define CORE_KEYWORDS_H

struct HashItem {
    const char* name;
    char* next;
};

class CoreKeywords {

    private:

        int size = 0;
        HashItem* table;

    public:

        void addKeyword(const char* keyword) {
            HashItem* item = &table[size];
            item->name = keyword;
            item->next = NULL;
            size++;
        };

        CoreKeywords() {
            table = (HashItem*)malloc(sizeof(HashItem) * 100);
            addKeyword("add");
            addKeyword("append");
            addKeyword("array");
            addKeyword("begin");
            addKeyword("clear");
            addKeyword("close");
            addKeyword("decrement");
            addKeyword("delete");
            addKeyword("divide");
            addKeyword("dummy");
            addKeyword("end");
            addKeyword("exit");
            addKeyword("file");
            addKeyword("fork");
            addKeyword("get");
            addKeyword("gosub");
            addKeyword("go");
            addKeyword("goto");
            addKeyword("gotoPC");
            addKeyword("if");
            addKeyword("increment");
            addKeyword("index");
            addKeyword("init");
            addKeyword("multiply");
            addKeyword("object");
            addKeyword("open");
            addKeyword("pop");
            addKeyword("post");
            addKeyword("print");
            addKeyword("push");
            addKeyword("put");
            addKeyword("read");
            addKeyword("replace");
            addKeyword("return");
            addKeyword("script");
            addKeyword("set");
            addKeyword("split");
            addKeyword("stack");
            addKeyword("stop");
            addKeyword("system");
            addKeyword("take");
            addKeyword("take");
            addKeyword("variable");
            addKeyword("wait");
            addKeyword("while");
            addKeyword("write");

            for (int n = 0; n < size; n++) {
                printf("%s\n", table[n].name);
            }
        };

};

#endif

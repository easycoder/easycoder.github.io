int core_print(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s: print\n", runtime->getCommand()->get(0)->getText());
    #endif

    const char* buf = runtime->getTextValue("value");
    printf("->%s\n", buf);
    delete buf;

    return runtime->getPC() + 1;
};

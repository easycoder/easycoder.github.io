int core_print(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s ", runtime->getLineNumber());
    #endif

    const char* buf = runtime->getTextValue("value");
    if (buf == nullptr) {
        print("No value at line %s\n", runtime->getLineNumber());
        exit(1);
    }
    printf("->%s\n", buf);
    delete[] buf;

    return runtime->getPC() + 1;
};

int core_exit(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s\n", runtime->getLineNumber());
    #endif
    
    return -1;
};

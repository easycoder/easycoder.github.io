int core_exit(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s: exit\n", runtime->getCommand()->get(0)->getText());
    #endif
    
    return -1;
};

int core_variable(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s\n", runtime->getLineNumber());
    #endif

    int pc = runtime->getPC();
    Symbol* symbol = new Symbol(runtime->getCommand()->getCommandProperty("name"));
    runtime->getSymbols()->add(symbol);

    return runtime->getPC() + 1;
};

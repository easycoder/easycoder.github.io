int core_variable(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s: variable\n", runtime->getCommand()->get(0)->getText());
    #endif

    int pc = runtime->getPC();
    Symbol* symbol = new Symbol(runtime->getCommandProperty(0, "name"));
    runtime->getSymbols()->add(symbol);

    return runtime->getPC() + 1;
};

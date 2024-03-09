int core_put(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s\n", runtime->getLineNumber());
    #endif

    RuntimeValue* runtimeValue = runtime->getCommand()->getRuntimeValue("value");
    runtime->setSymbolValue("target", runtimeValue->copy());

    return runtime->getPC() + 1;
};

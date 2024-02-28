int core_put(Runtime* runtime) {
    #if KEYWORDS
    printf("Line %s: put\n", runtime->getCommand()->get(0)->getText());
    #endif

    RuntimeValue* runtimeValue = runtime->getRuntimeValue("value");
    runtime->setSymbolValue("target", runtimeValue->copy());

    return runtime->getPC() + 1;
};

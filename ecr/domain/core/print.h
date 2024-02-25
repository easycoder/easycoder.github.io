int core_print(Runtime* runtime) {
    print("print handler\n");
    RuntimeValue* value = runtime->getRuntimeValue("value");
    switch (value->getType()) {
        case TEXT_VALUE:
            printf("->%s\n", value->getTextValue());
            break;
        case INT_VALUE:
            printf("->%d\n", value->getIntValue());
            break;
        case BOOL_VALUE:
            printf("->%s\n", value->getBoolValue() ? "true" : "false");
            break;
    };

    return runtime->getPC() + 1;
};

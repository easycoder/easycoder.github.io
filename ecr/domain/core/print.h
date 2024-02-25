int core_print(Runtime* runtime) {
    print("print handler\n");
    RuntimeValue* value = runtime->getRuntimeValue("value");

    return runtime->getPC() + 1;
};

int core_variable(Runtime* runtime) {
    print("variable handler\n");

    return runtime->getPC() + 1;
};

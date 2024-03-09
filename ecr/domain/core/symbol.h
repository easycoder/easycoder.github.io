RuntimeValue* core_symbol(Functions* functions) {
    Symbol* symbol = functions->getSymbol("name");
    return symbol->getValue();
};

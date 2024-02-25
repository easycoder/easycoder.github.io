class RuntimeValue {

    private:

        int type;
        void* content;

    public:

        int getType() {
            return type;
        }

        void* getContent() {
            return content;
        }

        RuntimeValue(int type, void* content) {
            this->type = type;
            this->content = content;
        }

        ~RuntimeValue() {}
};

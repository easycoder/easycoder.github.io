class Compress:

    def __init__(self, compiled, scriptName):
        print(f'Compress {scriptName}')

        self.sequence = 0
        self.shortCodes = {}

        self.codeFile = open(f'{scriptName}.code', 'w')
        self.keyFile = open(f'{scriptName}.keys', 'w')

        self.processCompiled(compiled)
        
        self.codeFile.close()
        self.keyFile.close()

    # Process the compiled script
    def processCompiled(self, compiled):
        for command in compiled:
            self.processCommand(command)
        self.writeToCodeFile('\n')

    # Process a single command
    def processCommand(self, command):
        self.first = True
        # Do the keyword first
        self.processValue('keyword', command['keyword'])
        for key in command:
            if key != 'keyword':
                value = command[key]
                self.processValue(key, value)
        self.writeToCodeFile('\n')
    
    # Process a list. This may be called recursively
    def processList(self, list):
        for value in list:
            self.processValue(None, value)

    # Process a dictionary. This may be called recursively
    def processDictionary(self, dictionary):
        for key in dictionary:
            self.processValue(key, dictionary[key])

    # Process a value
    def processValue(self, key, value):
        if type(value) is list:
            self.writeToCodeFile(f',{self.getShortCode(key)}:[')
            self.processList(value)
            self.writeToCodeFile(',]')
        elif type(value) is dict:
            self.writeToCodeFile(f',{self.getShortCode(key)}:{{')
            self.processDictionary(value)
            self.writeToCodeFile(',}')
        else:
            if key == 'lino':
                self.writeToCodeFile(f',#{value}')
            else:
                keyShortCode = self.getShortCode(key)
                valueShortCode = self.getShortCode(f'{value}')
                if not self.first:
                    self.writeToCodeFile(',')
                if key == None:
                    self.writeToCodeFile(f'{valueShortCode}')
                else:
                    self.writeToCodeFile(f'{keyShortCode}:{valueShortCode}')
                self.first = False
    
    # Get a shortcode or add a new one if it doesn't exist
    def getShortCode(self, key):
        if self.shortCodes.get(key) is not None:
            return self.shortCodes[key]
        else:
            s = self.sequence
            self.shortCodes[key] = s
            self.sequence = s + 1
            self.keyFile.write(f'{key}\n')
            return s
    
    # Write to the code file
    def writeToCodeFile(self, value):
        self.codeFile.write(value)
        # print(value)

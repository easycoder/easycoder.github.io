class Compress:

    def __init__(self, compiled, scriptName):
        print(f'Compress {scriptName}')

        self.sequence = 0
        self.shortCodes = {}

        self.outFile = open(f'{scriptName}.eco', 'w')
        self.keys = ''

        self.processCompiled(compiled)

        # print(self.keys)
        self.outFile.write(f'\n{self.keys}\n')
        self.outFile.close()

    # Process the compiled script
    def processCompiled(self, compiled):
        for command in compiled:
            self.processCommand(command)

    # Process a single command
    def processCommand(self, command):
        self.first = True
        # Do the domain, keyword and line number first
        domain = self.getShortCode(command['domain'])
        keyword = self.getShortCode(command['keyword'])
        # lino = self.getShortCode(command['lino'])
        lino = command['lino']
        self.writeToOutFile(f'{lino},{domain},{keyword},')
        for key in command:
            if not key in ['debug', 'lino', 'domain', 'keyword']:
                value = command[key]
                self.processValue(key, value)
        self.writeToOutFile('\n')
    
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
            self.writeToOutFile(f',{self.getShortCode(key)}:[')
            self.processList(value)
            self.writeToOutFile(',]')
        elif type(value) is dict:
            if key == None:
                key = 'value'
            self.writeToOutFile(f',{self.getShortCode(key)}:{{')
            self.processDictionary(value)
            self.writeToOutFile(',}')
        else:
            keyShortCode = self.getShortCode(key)
            valueShortCode = self.getShortCode(f'{value}')
            if not self.first:
                self.writeToOutFile(',')
            if key == None:
                self.writeToOutFile(f'{valueShortCode}')
            else:
                self.writeToOutFile(f'{keyShortCode}:{valueShortCode}')
            self.first = False
    
    # Get a shortcode or add a new one if it doesn't exist
    def getShortCode(self, key):
        if self.shortCodes.get(key) is not None:
            return self.shortCodes[key]
        else:
            s = self.sequence
            self.shortCodes[key] = s
            self.sequence = s + 1
            self.keys = f'{self.keys}{key}\n'
            return s
    
    # Write to the code file
    def writeToOutFile(self, value):
        self.outFile.write(value)
        # print(value)

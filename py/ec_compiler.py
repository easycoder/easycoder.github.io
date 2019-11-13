from ec_classes import Token, Error
from ec_value import Value
from ec_condition import Condition

class Compiler:

	def __init__(self, program):
		self.program = program
		self.domains = self.program.domains
		self.value = Value(self)
		self.condition = Condition(self)
		self.marker = 0
		self.script = self.program.script
		self.tokens = self.script.tokens
		self.symbols = self.program.symbols
		self.code = self.program.code
		self.warnings = []
		self.program.compiler = self
		self.addCommand = self.program.add
	
	def getPC(self):
		return len(self.program.code)
	
	def getIndex(self):
		return self.index
	
	# Move the index along
	def next(self):
		self.index += 1

	# Get the current token
	def getToken(self):
		if self.index >= len(self.tokens):
			raise Error('Premature end of script')
		return self.tokens[self.index].token
	
	# Get the next token
	def nextToken(self):
		self.index += 1
		return self.getToken()
	
	def peek(self):
		try:
			return self.tokens[self.index + 1].token
		except:
			return None
	
	# Get a value
	def getValue(self):
		return self.value.compileValue()
	
	# Get the next value
	def nextValue(self):
		self.index += 1
		return self.value.compileValue()
	
	# Get a condition
	def getCondition(self):
		return self.condition.compileCondition()
	
	# Get the next condition
	def nextCondition(self):
		self.index += 1
		return self.condition.compileCondition()
	
	def tokenIs(self, value):
		return self.getToken() == value
	
	def nextIs(self, value):
		return self.nextToken() == value
		
	def getCommandAt(self, pc):
		return self.program.code[pc]

	def isSymbol(self):
		try:
			self.symbols[self.getToken()]
			return True
		except:
			return False

	def nextIsSymbol(self):
		self.next()
		return self.isSymbol()

	def mark(self):
		self.marker = self.index

	def rewind(self):
		return self.marker
	
	def getLino(self):
		if self.index >= len(self.tokens):
			return 0
		return self.tokens[self.index].lino
	
	def warning(self, message):
		self.warnings.append(message)

	def getSymbolRecord(self):
		symbolRecord = self.code[self.symbols[self.getToken()]]
		symbolRecord['used'] = True
		return symbolRecord
	
	def compileLabel(self, command):
		return self.compileSymbol(command, self.getToken(), False)

	def compileVariable(self, command, valueHolder):
		return self.compileSymbol(command, self.nextToken(), valueHolder)

	def compileSymbol(self, command, name, valueHolder):
		try:
			self.symbols[name]
			raise Error(f'Duplicate symbol name "{name}"')
		except:
			self.symbols[name] = self.getPC()
			command['isSymbol'] = True
			command['used'] = False
			command['valueHolder'] = valueHolder
			command['name'] = name
			command['elements'] = 1
			command['index'] = 0
			command['value'] = [None]
			command['debug'] = False
			self.addCommand(command)
			return True

	# Compile the current token
	def compileToken(self):
		token = self.getToken()
		if not token:
			return
		self.mark()
		for domain in self.domains:
			try:
				handler = domain.keywordHandler(token)
				command = {}
				command['domain'] = domain.getName()
				command['lino'] = self.tokens[self.index].lino
				command['keyword'] = token
				command['debug'] = True
				if handler(command):
					return
			except Exception as err:
				self.warning(f'No handler found for "{token}" in domain "{domain.getName()}"')
				self.rewind()
		raise Error(f'I can\'t compile "{token}"')

	# Compile a single command
	def compileOne(self):
		keyword = self.getToken()
		if not keyword:
			return
		#print(f'Compile keyword "{keyword}"')
		if keyword.endswith(':'):
			command = {}
			command['domain'] = None
			command['lino'] = self.tokens[self.index].lino
			self.compileLabel(command)
		else:
			self.compileToken()

	# Compile the script
	def compileFrom(self, index, stopOn):
		self.index = index
		while True:
			token = self.tokens[self.index]
			keyword = token.token
			if not keyword is 'else':
				self.compileOne()
				if self.index == len(self.tokens) - 1:
					return
				token = self.nextToken()
				if token in stopOn:
					return

	def compileFromHere(self, stopOn):
		self.compileFrom(self.getIndex(), stopOn)

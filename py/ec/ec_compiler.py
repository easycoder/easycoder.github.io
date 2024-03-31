from ec_classes import Token, FatalError
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
			FatalError(self, 'Premature end of script')
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

	# Get a constant
	def getConstant(self, token):
		self.index += 1
		return self.value.compileConstant(token)

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
		token=self.getToken()
		try:
			self.symbols[token]
		except:
			return False
		return True

	def nextIsSymbol(self):
		self.next()
		return self.isSymbol()

	def rewindTo(self, index):
		self.index = index

	def getLino(self):
		if self.index >= len(self.tokens):
			return 0
		return self.tokens[self.index].lino

	def warning(self, message):
		self.warnings.append(message)

	def showWarnings(self):
		for warning in self.warnings:
			print(f'Line {self.getLino() + 1}: {warning}')

	def getSymbolRecord(self):
		token = self.getToken()
		symbol = self.symbols[token]
		if symbol != None:
			symbolRecord = self.code[symbol]
			symbolRecord['used'] = True
			return symbolRecord
		return None

	def compileLabel(self, command):
		return self.compileSymbol(command, self.getToken(), False)

	def compileVariable(self, command, valueHolder = False):
		return self.compileSymbol(command, self.nextToken(), valueHolder)

	def compileSymbol(self, command, name, valueHolder):
		try:
			v = self.symbols[name]
		except:
			v = None
		if v:
			FatalError(self, f'Duplicate symbol name "{name}"')
			return False
		self.symbols[name] = self.getPC()
		command['type'] = 'symbol'
		command['valueHolder'] = valueHolder
		command['name'] = name
		command['elements'] = 1
		command['index'] = 0
		command['value'] = []
		command['properties'] = {}
		command['used'] = False
		command['debug'] = False
		self.addCommand(command)
		return True

	# Compile the current token
	def compileToken(self):
		token = self.getToken()
		# print(f'Compile {token}')
		if not token:
			return False
		mark = self.getIndex()
		for domain in self.domains:
			handler = domain.keywordHandler(token)
			if handler:
				command = {}
				command['domain'] = domain.getName()
				command['lino'] = self.tokens[self.index].lino
				command['keyword'] = token
				command['type'] = None
				command['debug'] = True
				result = handler(command)
				if result:
					return result
				else:
					self.rewindTo(mark)
			else:
				self.rewindTo(mark)
		FatalError(self, f'No handler found for "{token}"')
		return False

	# Compile a single command
	def compileOne(self):
		keyword = self.getToken()
		if not keyword:
			return False
		# print(f'Compile keyword "{keyword}"')
		if keyword.endswith(':'):
			command = {}
			command['domain'] = None
			command['keyword'] = 'label'
			command['lino'] = self.tokens[self.index].lino
			return self.compileLabel(command)
		else:
			return self.compileToken()

	# Compile the script
	def compileFrom(self, index, stopOn):
		self.index = index
		while True:
			token = self.tokens[self.index]
			keyword = token.token
#			line = self.script.lines[token.lino]
#			print(f'{keyword} - {line}')
#			if keyword != 'else':
			if self.compileOne() == True:
				if self.index == len(self.tokens) - 1:
					return True
				token = self.nextToken()
				if token in stopOn:
					return True
			else:
				return False

	def compileFromHere(self, stopOn):
		return self.compileFrom(self.getIndex(), stopOn)

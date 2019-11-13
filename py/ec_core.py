import json, math, hashlib, threading
from datetime import datetime
from random import randrange
from ec_classes import Error
from ec_handler import Handler

APPENDING = 'appending'
BOOLEAN= 'boolean'
CONDITION = 'condition'
CONSTANT = 'constant'
CONTENT = 'content'
CORE = 'core'
COUNT = 'count'
DEBUG = 'debug'
DOMAIN = 'domain'
END = 'end'
ELEMENTS = 'elements'
ELSE = 'else'
FALSE = 'false'
FILE = 'file'
FORK = 'fork'
GIVING = 'giving'
GOSUB = 'gosub'
GOTO = 'goto'
INDEX = 'index'
KEY = 'key'
KEYWORD = 'keyword'
LINE = 'line'
LINO = 'lino'
MODE = 'mode'
NAME = 'name'
NUMERIC = 'numeric'
PATH = 'path'
PROGRAM = 'program'
PROPERTY = 'property'
READING = 'reading'
START = 'start'
STEP = 'step'
TARGET = 'target'
TEXT = 'text'
TO = 'to'
TRUE = 'true'
TYPE = 'type'
VALUE = 'value'
VALUE1 = 'value1'
VALUE2 = 'value2'
VALUEHOLDER = 'valueHolder'
WRITING = 'writing'

class Core(Handler):

	def __init__(self, compiler):
		Handler.__init__(self, compiler)
	
	def getName(self):
		return CORE
	
	#############################################################################
	# Keyword handlers

	def k_add(self, command):
		# Get the (first) value
		command[VALUE1] = self.nextValue()
		if self.nextToken() == TO:
			if self.nextIsSymbol():
				symbolRecord = self.getSymbolRecord()
				if symbolRecord[VALUEHOLDER]:
					if self.peek() == GIVING:
						# This variable must be treated as a second value
						command[VALUE2] = self.getValue()
						self.nextToken()
						command[TARGET] = self.nextToken()
						self.add(command)
						return True
					else:
						# Here the variable is the target
						command[TARGET] = self.getToken()
						self.add(command)
						return True
				self.warning(f'core.take: Expected value holder')
			else:
				# Here we have 2 values so GIVING must come next
				command[VALUE2] = self.getValue()
				if self.nextToken() == GIVING:
					command[TARGET] = self.nextToken()
					self.add(command)
					return True
				self.warning(f'core.take: Expected "giving"')
		return False
	
	def r_add(self, command):
		value1 = command[VALUE1]
		try:
			value2 = command[VALUE2]
		except:
			value2 = None
		target = self.getVariable(command[TARGET])
		if not target[VALUEHOLDER]:
			raise self.variableDoesNotHoldAValueError(command[LINO], target[NAME])
		value = self.getSymbolValue(target)
		if value == None:
			value = {}
			value[TYPE] = NUMERIC
		if value2:
			value[CONTENT] = self.getRuntimeValue(value2) + self.getRuntimeValue(value1)
		else:
			if not isinstance(value[CONTENT], int) and not value[CONTENT] == None:
				raise self.nonNumericValueError(command[LINO])
			value[CONTENT] = int(self.getRuntimeValue(value)) + int(self.getRuntimeValue(value1))
		self.putSymbolValue(target, value)
		return self.nextPC()

	def k_append(self, command):
		command[VALUE] = self.nextValue()
		if self.nextIs(TO):
			if self.nextIsSymbol():
				symbolRecord = self.getSymbolRecord()
				if symbolRecord[VALUEHOLDER]:
					command[TARGET] = symbolRecord[NAME]
					self.add(command)
					return True
				self.warning(f'Variable "{symbolRecord["name"]}" does not hold a value')
		return False
	
	def r_append(self, command):
		value = self.getRuntimeValue(command[VALUE])
		target = self.getVariable(command[TARGET])
		val = self.getSymbolValue(target)
		content = val[CONTENT]
		if content == '':
			content = []
		content.append(value)
		val[CONTENT] = content
		self.putSymbolValue(target, val)
		return self.nextPC()

	def k_begin(self, command):
		if self.nextToken() == END:
			cmd = {}
			cmd[DOMAIN] = CORE
			cmd[KEYWORD] = END
			cmd[DEBUG] = True
			cmd[LINO] = command[LINO]
			self.addCommand(cmd)
		else:
			self.compileFromHere([END])
		return True

	def k_clear(self, command):
		if self.nextIsSymbol():
			target = self.getSymbolRecord()
			if target[VALUEHOLDER]:
				command[TARGET] = target[NAME]
				self.add(command)
				return True
		return False
	
	def r_clear(self, command):
		target = self.getVariable(command[TARGET])
		val = {}
		val[TYPE] = BOOLEAN
		val[CONTENT] = False
		self.putSymbolValue(target, val)
		self.add(command)
		return self.nextPC()

	def k_close(self, command):
		if self.nextIsSymbol():
			fileRecord = self.getSymbolRecord()
			if fileRecord[KEYWORD] == FILE:
				command[FILE] = fileRecord[NAME]
				self.add(command)
				return True
		return False
	
	def r_close(self, command):
		fileRecord = self.getVariable(command[FILE])
		fileRecord[FILE].close()
		return self.nextPC()

	def k_debug(self, command):
		token = self.peek()
		if token in [STEP, PROGRAM]:
			command[MODE] = token
			self.nextToken()
		else:
			command[MODE] = None
		self.add(command)
		return True
	
	def k_decrement(self, command):
		if self.nextIsSymbol():
			symbolRecord = self.getSymbolRecord()
			if symbolRecord[VALUEHOLDER]:
				command[TARGET] = self.getToken()
				self.add(command)
				return True
			self.warning(f'Variable "{symbolRecord["name"]}" does not hold a value')
		return False
	
	def r_decrement(self, command):
		return self.incdec(command, '-')

	def k_dictionary(self, command):
		return self.compileVariable(command, False)
	
	def r_dictionary(self, command):
		return self.nextPC()
	
	def r_debug(self, command):
		if command[MODE] == STEP:
			self.program.debugStep = True
		elif command[MODE] == PROGRAM:
			for item in self.code:
				print(json.dumps(item, indent = 2))
		return self.nextPC()

	def k_divide(self, command):
		# Get the (first) value
		command[VALUE1] = self.nextValue()
		if self.nextToken() == 'by':
			command[VALUE2] = self.nextValue()
			if self.peek() == GIVING:
				self.nextToken()
				if (self.nextIsSymbol()):
					command[TARGET] = self.getToken()
					self.add(command)
					return True
				else:
					raise Error('Symbol expected')
			else:
				# First value must be a variable
				if command[VALUE1][TYPE] == 'symbol':
					command[TARGET] = command[VALUE1][NAME]
					self.add(command)
					return True
				else:
					raise Error('First value must be a variable')
		return False
	
	def r_divide(self, command):
		value1 = command[VALUE1]
		try:
			value2 = command[VALUE2]
		except:
			value2 = None
		target = self.getVariable(command[TARGET])
		if not target[VALUEHOLDER]:
			raise self.variableDoesNotHoldAValueError(command[LINO], target[NAME])
		value = self.getSymbolValue(target)
		if value == None:
			value = {}
			value[TYPE] = NUMERIC
		if value2:
			value[CONTENT] = int(self.getRuntimeValue(value1) / self.getRuntimeValue(value2))
		else:
			if not isinstance(value[CONTENT], int) and not value[CONTENT] == None:
				raise self.nonNumericValueError(command[LINO])
			value[CONTENT] = int(self.getRuntimeValue(value) / self.getRuntimeValue(value1))
		self.putSymbolValue(target, value)
		return self.nextPC()
	
	def k_dummy(self, command):
		self.add(command)
		return True
	
	def r_dummy(self, command):
		return self.nextPC()

	def k_end(self, command):
		self.add(command)
		return True
	
	def r_end(self, command):
		return self.nextPC()

	def k_exit(self, command):
		self.add(command)
		return True
	
	def r_exit(self, command):
		return 0
	
	def k_file(self, command):
		return self.compileVariable(command, False)
	
	def r_file(self, command):
		return self.nextPC()

	def k_fork(self, command):
		if self.peek() == TO:
			self.nextToken()
		command[FORK] = self.nextToken()
		self.add(command)
		return True
	
	def r_fork(self, command):
		next = self.nextPC()
		label = command[FORK]
		try:
			label = self.symbols[label + ':']
		except:
			raise Error(f'There is no label "{label + ":"}"')
		self.run(label)
		return next

	def k_gosub(self, command):
		if self.peek() == TO:
			self.nextToken()
		command[GOSUB] = self.nextToken()
		self.add(command)
		return True

	def r_gosub(self, command):
		label = command[GOSUB]
		try:
			self.stack.append(self.nextPC())
			return self.symbols[label + ':']
		except:
			raise Error(f'There is no label "{label + ":"}"')
	
	def k_go(self, command):
		if self.peek() == TO:
			self.nextToken()
			return self.k_goto(command)

	def k_goto(self, command):
		command[KEYWORD] = GOTO
		command[GOTO] = self.nextToken()
		self.add(command)
		return True

	def r_goto(self, command):
		label = command[GOTO]
		try:
			return self.symbols[label + ':']
		except:
			raise Error(f'There is no label "{label + ":"}"')

	def r_gotoPC(self, command):
		return command[GOTO]

	def k_if(self, command):
		command[CONDITION] = self.nextCondition()
		self.addCommand(command)
		self.nextToken()
		pcElse = self.getPC()
		cmd = {}
		cmd[LINO] = command[LINO]
		cmd[DOMAIN] = CORE
		cmd[KEYWORD] = 'gotoPC'
		cmd[GOTO] = 0
		cmd[DEBUG] = False		
		self.addCommand(cmd)
		# Get the 'then' code
		self.compileOne()
		if self.peek() == ELSE:
			self.nextToken()
			# Add a GOTO to skip the ELSE
			pcNext = self.getPC()
			cmd = {}
			cmd[LINO] = command[LINO]
			cmd[DOMAIN] = CORE
			cmd[KEYWORD] = 'gotoPC'
			cmd[GOTO] = 0
			cmd[DEBUG] = False	
			self.addCommand(cmd)
			# Fixup the link to the ELSE branch
			self.getCommandAt(pcElse)[GOTO] = self.getPC()
			# Process the ELSE branch
			self.nextToken()
			self.compileOne()
			# Fixup the pcNext GOTO
			self.getCommandAt(pcNext)[GOTO] = self.getPC()
		else:
			# We're already at the next command
			self.getCommandAt(pcElse)[GOTO] = self.getPC()
		return True
	
	def r_if(self, command):
		test = self.program.condition.testCondition(command[CONDITION])
		if test:
			self.program.pc += 2
		else:
			self.program.pc += 1
		return self.program.pc

	def k_increment(self, command):
		if self.nextIsSymbol():
			symbolRecord = self.getSymbolRecord()
			if symbolRecord[VALUEHOLDER]:
				command[TARGET] = self.getToken()
				self.add(command)
				return True
			self.warning(f'Variable "{symbolRecord["name"]}" does not hold a value')
		return False
	
	def r_increment(self, command):
		return self.incdec(command, '+')

	def k_index(self, command):
		# get the variable
		if self.nextIsSymbol():
			command[TARGET] = self.getToken()
			if self.nextToken() == TO:
				# get the value
				command[VALUE] = self.nextValue()
				self.add(command)
				return True
		return False
	
	def r_index(self, command):
		symbolRecord = self.getVariable(command[TARGET])
		symbolRecord[INDEX] = self.getRuntimeValue(command[VALUE])
		return self.nextPC()

	def k_multiply(self, command):
		# Get the (first) value
		command[VALUE1] = self.nextValue()
		if self.nextToken() == 'by':
			command[VALUE2] = self.nextValue()
			if self.peek() == GIVING:
				self.nextToken()
				if (self.nextIsSymbol()):
					command[TARGET] = self.getToken()
					self.add(command)
					return True
				else:
					raise Error('Symbol expected')
			else:
				# First value must be a variable
				if command[VALUE1][TYPE] == 'symbol':
					command[TARGET] = command[VALUE1][NAME]
					self.add(command)
					return True
				else:
					raise Error('First value must be a variable')
		return False
	
	def r_multiply(self, command):
		value1 = command[VALUE1]
		try:
			value2 = command[VALUE2]
		except:
			value2 = None
		target = self.getVariable(command[TARGET])
		if not target[VALUEHOLDER]:
			raise self.variableDoesNotHoldAValueError(command[LINO], target[NAME])
		value = self.getSymbolValue(target)
		if value == None:
			value = {}
			value[TYPE] = NUMERIC
		if value2:
			value[CONTENT] = int(self.getRuntimeValue(value1) * self.getRuntimeValue(value2))
		else:
			if not isinstance(value[CONTENT], int) and not value[CONTENT] == None:
				raise self.nonNumericValueError(command[LINO])
			value[CONTENT] = int(self.getRuntimeValue(value) * self.getRuntimeValue(value1))
		self.putSymbolValue(target, value)
		return self.nextPC()

	def k_open(self, command):
		if self.nextIsSymbol():
			symbolRecord = self.getSymbolRecord()
			command[TARGET] = symbolRecord[NAME]
			command[PATH] = self.nextValue()
			if symbolRecord[KEYWORD] == FILE:
				if self.peek() == 'for':
					self.nextToken()
					token = self.nextToken()
					if token == APPENDING:
						mode = 'a+'
					elif token == READING:
						mode = 'r'
					elif token == WRITING:
						mode = 'w+'
					else:
						raise Error(f'Unknown file open mode {token}')
					command[MODE] = mode
					self.add(command)
					return True
		return False
	
	def r_open(self, command):
		symbolRecord = self.getVariable(command[TARGET])
		path = self.getRuntimeValue(command[PATH])
		symbolRecord[FILE] = open(path, command[MODE])
		return self.nextPC()

	def k_print(self, command):
		command[VALUE] = self.nextValue()
		self.add(command)
		return True
	
	def r_print(self, command):
		value = self.getRuntimeValue(command[VALUE])
		print(f'-> {value}')
		return self.nextPC()

	def k_put(self, command):
		command[VALUE] = self.nextValue()
		if self.nextIs('into'):
			if self.nextIsSymbol():
				symbolRecord = self.getSymbolRecord()
				command[TARGET] = symbolRecord[NAME]
			if symbolRecord[VALUEHOLDER]:
					self.add(command)
					return True
			elif symbolRecord[KEYWORD] == 'dictionary':
				if self.peek() == 'as':
					self.nextToken()
				command[KEYWORD] = 'putDict'
				command[KEY] = self.nextValue()
				self.add(command)
				return True
			else:
				raise Error(f'Symbol {symbolRecord["name"]} is not a value holder')
			self.warning(f'core:put: No such variable: "{self.getToken()}"')
		return False
	
	def r_put(self, command):
		value = self.evaluate(command[VALUE])
		symbolRecord = self.getVariable(command[TARGET])
		if not symbolRecord[VALUEHOLDER]:
			raise Error(f'{symbolRecord["name"]} does not hold a value')
		self.putSymbolValue(symbolRecord, value)
		# if (target.imported) {
		# 	const exporterRecord = target.exporter.getSymbolRecord(target.exportedName);
		# 	exporterRecord.value[exporterRecord.index] = value;
		# }
		return self.nextPC()
	
	def r_putDict(self, command):
		key = self.getRuntimeValue(command[KEY])
		value = self.getRuntimeValue(command[VALUE])
		symbolRecord = self.getVariable(command[TARGET])
		record = self.getSymbolValue(symbolRecord)
		if record == None:
			record = {}
			record[TYPE] = TEXT
			content = {}
		else:
			content = record[CONTENT]
		if content is None:
			content = {}
		record[TYPE] = NUMERIC if isinstance(value, int) else TEXT
		content[key] = value
		record[CONTENT] = content
		self.putSymbolValue(symbolRecord, record)
		return self.nextPC()

	def k_read(self, command):
		if self.peek() == LINE:
			self.nextToken()
			command[LINE] = True
		else:
			command[LINE] = False
		if self.nextIsSymbol():
				symbolRecord = self.getSymbolRecord()
				if symbolRecord[VALUEHOLDER]:
					if self.peek() == 'from':
						self.nextToken()
						if self.nextIsSymbol():
							fileRecord = self.getSymbolRecord()
							if fileRecord[KEYWORD] == FILE:
								command[TARGET] = symbolRecord[NAME]
								command[FILE] = fileRecord[NAME]
								self.add(command)
								return True
		return False
	
	def r_read(self, command):
		symbolRecord = self.getVariable(command[TARGET])
		fileRecord = self.getVariable(command[FILE])
		line = command[LINE]
		file = fileRecord[FILE]
		if file.mode == 'r':
			value = {}
			value[TYPE] = CONSTANT
			value[NUMERIC] = False
			value[CONTENT] = file.readline().strip() if line else file.read()
			self.putSymbolValue(symbolRecord, value)
		return self.nextPC()

	def k_return(self, command):
		self.add(command)
		return True
	
	def r_return(self, command):
		return self.stack.pop()

	def k_script(self, command):
		self.program.name = self.nextToken()
		return True

	def k_set(self, command):
		if self.nextIsSymbol():
			target = self.getSymbolRecord()
			if target[VALUEHOLDER]:
				command[TYPE] = 'set'
				command[TARGET] = target[NAME]
				self.add(command)
				return True

		token = self.getToken()
		if token == 'the':
			token = self.nextToken()
		if token == ELEMENTS:
			self.nextToken()
			if self.peek() == 'of':
				self.nextToken()
			if self.nextIsSymbol():
				command[TYPE] = ELEMENTS
				command[NAME] = self.getToken()
				if self.peek() == TO:
					self.nextToken()
				command[ELEMENTS] = self.nextValue()
				self.add(command)
				return True

		if token == PROPERTY:
			command[TYPE] = PROPERTY
			command[NAME] = self.nextValue()
			if self.nextIs('of'):
				if self.nextIsSymbol():
					command[TARGET] = self.getSymbolRecord()[NAME]
					if self.nextIs(TO):
						command[VALUE] = self.nextValue()
						self.add(command)
						return True

		if token == 'element':
			command[TYPE] = 'element'
			command[INDEX] = self.nextValue()
			if self.nextIs('of'):
				if self.nextIsSymbol():
					command[TARGET] = self.getSymbolRecord()[NAME]
					if self.nextIs(TO):
						command[VALUE] = self.nextValue()
						self.add(command)
						return True

		return False
	
	def r_set(self, command):
		cmdType = command[TYPE]
		if cmdType == 'set':
			target = self.getVariable(command[TARGET])
			val = {}
			val[TYPE] = BOOLEAN
			val[CONTENT] = True
			self.putSymbolValue(target, val)
			return self.nextPC()

		if cmdType == ELEMENTS:
			symbolRecord = self.getVariable(command[NAME])
			elements = self.getRuntimeValue(command[ELEMENTS])
			symbolRecord[ELEMENTS] = elements
			symbolRecord[VALUE] = [None] * elements
			return self.nextPC()
		
		if cmdType == PROPERTY:
			value = self.getRuntimeValue(command[VALUE])
			name = self.getRuntimeValue(command[NAME])
			target = self.getVariable(command[TARGET])
			val = self.getSymbolValue(target)
			content = val[CONTENT]
			if content == '':
				content = {}
			else:
				content = json.loads(content)
			content[name] = value
			val[CONTENT] = content
			self.putSymbolValue(target, val)
			return self.nextPC()
		
		if cmdType == 'element':
			value = self.getRuntimeValue(command[VALUE])
			index = self.getRuntimeValue(command[INDEX])
			target = self.getVariable(command[TARGET])
			val = self.getSymbolValue(target)
			content = val[CONTENT]
			if content == '':
				content = []
			# else:
			# 	content = json.loads(content)
			content[index] = value
			val[CONTENT] = content
			self.putSymbolValue(target, val)
			return self.nextPC()

	def k_stop(self, command):
		self.add(command)
		return True
	
	def r_stop(self, command):
		return 0
	
	def k_take(self, command):
		# Get the (first) value
		command[VALUE1] = self.nextValue()
		if self.nextToken() == 'from':
			if self.nextIsSymbol():
				symbolRecord = self.getSymbolRecord()
				if symbolRecord[VALUEHOLDER]:
					if self.peek() == GIVING:
						# This variable must be treated as a second value
						command[VALUE2] = self.getValue()
						self.nextToken()
						command[TARGET] = self.nextToken()
						self.add(command)
						return True
					else:
						# Here the variable is the target
						command[TARGET] = self.getToken()
						self.add(command)
						return True
				self.warning(f'core.take: Expected value holder')
			else:
				# Here we have 2 values so GIVING must come next
				command[VALUE2] = self.getValue()
				if self.nextToken() == GIVING:
					command[TARGET] = self.nextToken()
					self.add(command)
					return True
				self.warning(f'core.take: Expected "giving"')
		return False
	
	def r_take(self, command):
		value1 = command[VALUE1]
		try:
			value2 = command[VALUE2]
		except:
			value2 = None
		target = self.getVariable(command[TARGET])
		if not target[VALUEHOLDER]:
			raise self.variableDoesNotHoldAValueError(command[LINO], target[NAME])
		value = self.getSymbolValue(target)
		if value == None:
			value = {}
			value[TYPE] = NUMERIC
		if value2:
			value[CONTENT] = self.getRuntimeValue(value2) - self.getRuntimeValue(value1)
		else:
			if not isinstance(value, int) and not value[CONTENT] == None:
				raise self.nonNumericValueError(command[LINO])
			value[CONTENT] = int(self.getRuntimeValue(value)) - int(self.getRuntimeValue(value1))
		self.putSymbolValue(target, value)
		return self.nextPC()

	def k_toggle(self, command):
		if self.nextIsSymbol():
			target = self.getSymbolRecord()
			if target[VALUEHOLDER]:
				command[TARGET] = target[NAME]
				self.add(command)
				return True
		return False
	
	def r_toggle(self, command):
		target = self.getVariable(command[TARGET])
		value = self.getSymbolValue(target)
		val = {}
		val[TYPE] = BOOLEAN
		val[CONTENT] = not value[CONTENT]
		self.putSymbolValue(target, val)
		self.add(command)
		return self.nextPC()

	def k_variable(self, command):
		return self.compileVariable(command, True)
	
	def r_variable(self, command):
		return self.nextPC()

	def k_wait(self, command):
		command[VALUE] = self.nextValue()
		multipliers = {}
		multipliers['milli'] = 1
		multipliers['millis'] = 1
		multipliers['tick'] = 10
		multipliers['ticks'] = 10
		multipliers['second'] = 1000
		multipliers['seconds'] = 1000
		multipliers['minute'] = 60000
		multipliers['minutes7'] = 60000
		command['multiplier'] = multipliers['second']
		token = self.peek()
		if token in multipliers:
			self.nextToken()
			command['multiplier'] = multipliers[token]
		self.add(command)
		return True
	
	def r_wait(self, command):
		value = self.getRuntimeValue(command[VALUE]) * command['multiplier']
		next = self.nextPC()
		threading.Timer(value/1000.0, lambda: (self.run(next))).start()
		return 0
	
	def k_while(self, command):
		command[CONDITION] = self.nextCondition()
		test = self.getPC()
		self.addCommand(command)
		# Set up a goto for when the test fails
		fail = self.getPC()
		cmd = {}
		cmd[LINO] = command[LINO]
		cmd[DOMAIN] = CORE
		cmd[KEYWORD] = 'gotoPC'
		cmd[GOTO] = 0
		cmd[DEBUG] = False
		self.addCommand(cmd)
		# Do the body of the while
		self.nextToken()
		self.compileOne()
		# Repeat the test
		cmd = {}
		cmd[LINO] = command[LINO]
		cmd[DOMAIN] = CORE
		cmd[KEYWORD] = 'gotoPC'
		cmd[GOTO] = test
		cmd[DEBUG] = False
		self.addCommand(cmd)
		# Fixup the GOTO on completion
		self.getCommandAt(fail)[GOTO] = self.getPC()
		return True

	def r_while(self, command):
		test = self.program.condition.testCondition(command[CONDITION])
		if test:
			self.program.pc += 2
		else:
			self.program.pc += 1
		return self.program.pc
	
	def k_write(self, command):
		if self.peek() == LINE:
			self.nextToken()
			command[LINE] = True
		else:
			command[LINE] = False
		command[VALUE] = self.nextValue()
		if self.peek() == TO:
			self.nextToken()
			if self.nextIsSymbol():
				fileRecord = self.getSymbolRecord()
				if fileRecord[KEYWORD] == FILE:
					command[FILE] = fileRecord[NAME]
					self.add(command)
					return True
		return False
	
	def r_write(self, command):
		value = self.getRuntimeValue(command[VALUE])
		fileRecord = self.getVariable(command[FILE])
		file = fileRecord[FILE]
		if file.mode in ['w+', 'a+']:
			file.write(value)
			if command[LINE]:
				file.write('\n')
		return self.nextPC()

	#############################################################################
	# Support functions

	def incdec(self, command, mode):
		symbolRecord = self.getVariable(command[TARGET])
		if not symbolRecord[VALUEHOLDER]:
			raise Error(f'{symbolRecord["name"]} does not hold a value')
		value = self.getSymbolValue(symbolRecord)
		if mode == '+':
			value[CONTENT] += 1
		else:
			value[CONTENT] -= 1
		self.putSymbolValue(symbolRecord, value)
		return self.nextPC()

	#############################################################################
	# Compile a value in this domain
	def compileValue(self):
		value = {}
		value[DOMAIN] = CORE
		token = self.getToken()
		if self.isSymbol():
			value[NAME] = token
			symbolRecord = self.getSymbolRecord()
			keyword = symbolRecord[KEYWORD]
			if keyword == 'module':
				value[TYPE] = 'module'
				return value

			if keyword in ['variable', 'dictionary']:
				# value[TYPE] = self.peek()
				# if value[TYPE] in ['format', 'modulo']:
				# 	self.nextToken()
				# 	value[VALUE] = self.nextValue()
				# 	return value
				value[TYPE] = 'symbol'
				return value
			return None

		if token == TRUE:
			self.nextToken()
			value[TYPE] = BOOLEAN
			value[CONTENT] = True
			return value

		if token == FALSE:
			self.nextToken()
			value[TYPE] = BOOLEAN
			value[CONTENT] = False
			return value

		value[TYPE] = token

		if token == 'random':
			self.nextToken()
			value['range'] = self.getValue()
			return value
			
		if token in ['cos', 'sin', 'tan']:
			value['angle'] = self.nextValue()
			if self.nextToken() == 'radius':
				value['radius'] = self.nextValue()
				return value
			return None
			
		if token in ['now', 'today', 'newline', 'break', 'empty']:
			return value
			
		if token in ['date', 'encode', 'decode', 'lowercase', 'hash']:
			value[VALUE] = self.nextValue()
			return value
		
		if (token in ['datime', 'datetime']):
			value[TYPE] = 'datime'
			value['timestamp'] = self.nextValue()
			if self.peek() == 'format':
				self.nextToken()
				value['format'] = self.nextValue()
			else:
				value['format'] = None
			return value

		if token == 'element':
			value[INDEX] = self.nextValue()
			if self.nextToken() == 'of':
				if self.nextIsSymbol():
					symbolRecord = self.getSymbolRecord()
					if symbolRecord[KEYWORD] == 'variable':
						value[TARGET] = symbolRecord[NAME]
						return value
			return None

		if token == PROPERTY:
			value[NAME] = self.nextValue()
			if self.nextToken() == 'of':
				if self.nextIsSymbol():
					symbolRecord = self.getSymbolRecord()
					if symbolRecord[KEYWORD] == 'variable':
						value[TARGET] = symbolRecord[NAME]
						return value
			return None
						
		if token == 'arg':
			value[VALUE] = self.nextValue()
			if self.getToken() == 'of':
				if self.nextIsSymbol():
					symbolRecord = self.getSymbolRecord()
					value[TARGET] = symbolRecord[NAME]
					self.nextToken()
					return value
			return None

		if self.getToken() == 'the':
			self.nextToken()
			
		token = self.getToken()
		value[TYPE] = token

		if token == ELEMENTS:
			if self.nextIs('of'):
				if self.nextIsSymbol():
					value[NAME] = self.getToken()
					return value
			return None

		if token == INDEX:
			if self.nextIs('of'):
				if self.nextIsSymbol():
					if self.peek() == 'in':
						value[TYPE] = 'indexOf'
						if self.nextIsSymbol():
							value[TARGET] = self.getSymbolRecord()[NAME]
							return value
					else:
						value[NAME] = self.getToken()
						return value
				else:
					value[VALUE1] = self.getValue()
					if self.nextIs('in'):
						value[TYPE] = 'indexOf'
						if self.nextIsSymbol():
							value[TARGET] = self.getSymbolRecord()[NAME]
							return value
			return None

		if token == VALUE:
			value[TYPE] = 'valueOf'
			if self.nextIs('of'):
				value[VALUE] = self.nextValue()
				return value
			return None

		if token == 'length':
			value[TYPE] = 'lengthOf'
			if self.nextIs('of'):
				value[VALUE] = self.nextValue()
				return value
			return None

		if token in ['left', 'right']:
			value[COUNT] = self.nextValue()
			if self.nextToken() == 'of':
				value[VALUE] = self.nextValue()
				return value
			return None
					
		if token == 'from':
			value[START] = self.nextValue()
			if self.peek() == TO:
				self.nextToken()
				value[TO] = self.nextValue()
			else:
				value[TO] = None
			if self.nextToken() == 'of':
				value[VALUE] = self.nextValue()
				return value

		if token == 'position':
			if self.nextIs('of'):
				value['last'] = False
				if self.nextIs('the'):
					if self.nextIs('last'):
						self.nextToken()
						value['last'] = True
				value['needle'] = self.getValue()
				if self.nextToken() == 'in':
					value['haystack'] = self.nextValue()
					return value

		if token in ['message', 'error']:
			self.nextToken()
			return value
		
		if token == 'timestamp':
			if self.nextIs('of'):
				value['datime'] = self.nextValue()
				if self.peek() == 'format':
					self.nextToken()
					value['format'] = self.nextValue()
				else:
					value['format'] = None
				return value
			return None

		return None
	
	#############################################################################
	# Modify a value or leave it unchanged.
	def modifyValue(self, value):
		if self.peek() == 'modulo':
			self.nextToken()
			mv = {}
			mv[DOMAIN] = CORE
			mv[TYPE] = 'modulo'
			mv[VALUE] = value
			mv['modval'] = self.nextValue()
			value = mv

		return value

	#############################################################################
	# Value handlers

	def v_boolean(self, v):
		value = {}
		value[TYPE] = BOOLEAN
		value[CONTENT] = v[CONTENT]
		return value

	def v_cos(self, v):
		angle = self.getRuntimeValue(v['angle'])
		radius = self.getRuntimeValue(v['radius'])
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = round(math.cos(angle * 0.01745329) * radius)
		return value
	
	def v_datime(self, v):
		ts = self.getRuntimeValue(v['timestamp'])
		fmt = v['format']
		if fmt == None:
			fmt = '%b %d %Y %H:%M:%S'
		else:
			fmt = self.getRuntimeValue(fmt)
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = datetime.fromtimestamp(ts/1000).strftime(fmt)
		return value

	def v_decode(self, v):
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = self.program.decode(v[VALUE][CONTENT])
		return value

	def v_element(self, v):
		index = self.getRuntimeValue(v[INDEX])
		target = self.getVariable(v[TARGET])
		val = self.getSymbolValue(target)
		content = val[CONTENT]
		value = {}
		value[TYPE] = NUMERIC if isinstance(content, int) else TEXT
		value[CONTENT] = content[index]
		return value
	
	def v_elements(self, v):
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = self.getVariable(v[NAME])[ELEMENTS]
		return value
	
	def v_empty(self, v):
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = ''
		return value

	def v_encode(self, v):
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = self.program.encode(v[VALUE][CONTENT])
		return value

	def v_from(self, v):
		content = self.getRuntimeValue(v[VALUE])
		start = self.getRuntimeValue(v[START])
		to = v[TO]
		if not to == None:
			to = self.getRuntimeValue(to)
		value = {}
		value[TYPE] = TEXT
		if to == None:
			value[CONTENT] = content[start:]
		else:
			value[CONTENT] = content[start:to]
		return value

	def v_hash(self, v):
		hashval = self.getRuntimeValue(v[VALUE])
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = hashlib.sha256(hashval.encode('utf-8')).hexdigest()
		return value

	def v_index(self, v):
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = self.getVariable(v[NAME])[INDEX]
		return value

	def v_indexOf(self, v):
		value1 = v[VALUE1]
		target = self.getVariable(v[TARGET])
		try:
			index = target[VALUE].index(value1)
		except:
			index = -1
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = index
		return value
	
	def v_left(self, v):
		content = self.getRuntimeValue(v[VALUE])
		count = self.getRuntimeValue(v[COUNT])
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = content[0:count]
		return value
	
	def v_lengthOf(self, v):
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = len(v[VALUE][CONTENT])
		return value

	def v_lowercase(self, v):
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = v[VALUE][CONTENT].lower()
		return value

	def v_modulo(self, v):
		val = self.getRuntimeValue(v[VALUE])
		modval = self.getRuntimeValue(v['modval'])
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = val % modval
		return value

	def v_newline(self, v):
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = '\n'
		return value

	def v_now(self, v):
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = int(datetime.now().timestamp())*1000
		return value

	def v_position(self, v):
		needle = self.getRuntimeValue(v['needle'])
		haystack = self.getRuntimeValue(v['haystack'])
		last = v['last']
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = haystack.rfind(needle) if last else haystack.find(needle)
		return value

	def v_property(self, v):
		name = self.getRuntimeValue(v[NAME])
		target = self.getVariable(v[TARGET])
		target = self.getSymbolValue(target)
		content = target[CONTENT]
		if content == '':
			content = {}
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = content[name]
		return value

	def v_random(self, v):
		range = self.getRuntimeValue(v['range'])
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = randrange(range)
		return value
	
	def v_right(self, v):
		content = self.getRuntimeValue(v[VALUE])
		count = self.getRuntimeValue(v[COUNT])
		value = {}
		value[TYPE] = TEXT
		value[CONTENT] = content[-count:]
		return value

	def v_sin(self, v):
		angle = self.getRuntimeValue(v['angle'])
		radius = self.getRuntimeValue(v['radius'])
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = round(math.sin(angle * 0.01745329) * radius)
		return value

	def v_tan(self, v):
		angle = self.getRuntimeValue(v['angle'])
		radius = self.getRuntimeValue(v['radius'])
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = round(math.tan(angle * 0.01745329) * radius)
		return value

	def v_timestamp(self, v):
		dt = self.getRuntimeValue(v['datime'])
		fmt = v['format']
		if fmt == None:
			fmt = '%b %d %Y %H:%M:%S'
		else:
			fmt = self.getRuntimeValue(fmt)
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = int(datetime.strptime(dt, fmt).timestamp()*1000)
		return value

	def v_today(self, v):
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = int(datetime.combine(datetime.now().date(),datetime.min.time()).timestamp())*1000
		return value

	def v_symbol(self, symbolRecord):
		result = {}
		if symbolRecord[KEYWORD] == 'variable':
			symbolValue = self.getSymbolValue(symbolRecord)
			if symbolValue == None:
				return None
			result[TYPE] = symbolValue[TYPE]
			content = symbolValue[CONTENT]
			if symbolValue[TYPE] in [BOOLEAN, NUMERIC]:
				result[CONTENT] = content
				return result
			try:
				result[CONTENT] = content
			except:
				result[CONTENT] = ''
			return result
		else:
			return ''

	def v_valueOf(self, v):
		v = self.getRuntimeValue(v[VALUE])
		value = {}
		value[TYPE] = NUMERIC
		value[CONTENT] = int(v)
		return value
		
	#############################################################################
	# Compile a condition
	def compileCondition(self):
		condition = {}
		if self.isSymbol():
			symbolRecord = self.getSymbolRecord()
			if symbolRecord[KEYWORD] == 'module':
				if self.nextIs('is'):
					condition['sense'] = True
					if self.nextIs('not'):
						self.nextToken()
						condition['sense'] = False
					if self.tokenIs('running'):
						condition[TYPE] = 'moduleRunning'
						condition[NAME] = symbolRecord[NAME]
						return condition
				return None
		if self.getToken() == 'not':
			condition[TYPE] = 'not'
			condition[VALUE] = self.nextValue()
			return condition
		try:
			condition[VALUE1] = self.getValue()
			token = self.nextToken()
			condition[TYPE] = token
			if token == 'includes':
				condition[VALUE2] = self.nextValue()
				return condition
			if token == 'is':
				if self.peek() == 'not':
					self.nextToken()
					condition['negate'] = True
				else:
					condition['negate'] = False
				token = self.nextToken()
				condition[TYPE] = token
				if token in [NUMERIC, 'even', 'odd', BOOLEAN]:
					return condition
				if token in ['greater', 'less']:
					if self.nextToken() == 'than':
						condition[VALUE2] = self.nextValue()
						return condition
				condition[TYPE] = 'is'
				condition[VALUE2] = self.getValue()
				return condition
			if condition[VALUE1]:
				# It's a boolean if
				condition[TYPE] = BOOLEAN
				return condition
		except Error as err:
			self.warning(f'Can\'t get a conditional: {err}')
		return None

	def isNegate(self):
		token = self.getToken()
		if token == 'not':
			self.nextToken()
			return True
		return False

	#############################################################################
	# Condition handlers
		
	def c_boolean(self, condition):
		return type(self.getRuntimeValue(condition[VALUE1])) == bool
	
	def c_numeric(self, condition):
		return isinstance(self.getRuntimeValue(condition[VALUE1]), int)
	
	def c_not(self, condition):
		return not self.getRuntimeValue(condition[VALUE1])
	
	def c_even(self, condition):
		return self.getRuntimeValue(condition[VALUE1]) % 2 == 0
	
	def c_odd(self, condition):
		return self.getRuntimeValue(condition[VALUE1]) % 2 == 1
	
	def c_is(self, condition):
		comparison = self.program.compare(condition[VALUE1], condition[VALUE2])
		return comparison != 0 if condition['negate'] else comparison == 0
	
	def c_greater(self, condition):
		comparison = self.program.compare(condition[VALUE1], condition[VALUE2])
		return comparison <= 0 if condition['negate'] else comparison > 0
	
	def c_less(self, condition):
		comparison = self.program.compare(condition[VALUE1], condition[VALUE2])
		return comparison >= 0 if condition['negate'] else comparison < 0
	
	def c_includes(self, condition):
		value1 = self.getRuntimeValue(condition[VALUE1])
		value2 = self.getRuntimeValue(condition[VALUE1])
		return value1 in value2

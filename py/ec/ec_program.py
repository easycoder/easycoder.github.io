import time, json
from copy import deepcopy
from collections import deque
from ec_classes import Script, Token, FatalError, RuntimeError
from ec_compiler import Compiler
from ec_compress import Compress

class Program:

	def __init__(self, argv, domains, options):

		scriptName = argv[0]
		f = open(scriptName, 'r')
		source = f.read()
		f.close()
		self.argv = argv
		self.options = options
		self.domains = []
		self.domainIndex = {}
		self.name = '<anon>'
		self.code = []
		self.symbols = {}
		self.onError = 0
		self.pc = 0
		self.debugStep = False
		self.script = Script(source)
		self.stack = []
		self.compiler = Compiler(self)
		self.value = self.compiler.value
		self.condition = self.compiler.condition
		for domain in domains:
			handler = domain(self.compiler)
			self.domains.append(handler)
			self.domainIndex[handler.getName()] = handler
		self.queue = deque()

		startCompile = time.time()
		self.tokenise(self.script)
		if self.compiler.compileFrom(0, []):
			finishCompile = time.time()
			s = len(self.script.lines)
			t = len(self.script.tokens)
			print(f'Compiled {self.name}: {s} lines ({t} tokens) in ' +
				f'{round((finishCompile - startCompile) * 1000)} ms')
			for name in self.symbols.keys():
				record = self.code[self.symbols[name]]
				if name[-1] != ':' and not record['used']:
					print(f'Variable "{name}" not used')
			if self.options['object']:
				n = scriptName.find('.')
				f = open(f'{scriptName[0:n]}.json', 'w')
				f.write(json.dumps(self.code, sort_keys=True, indent=2))
				Compress(self.code, scriptName[0:n])
				f.close()
			else:
				print(f'Run {self.name}')
				self.run(0)
		else:
			self.compiler.showWarnings()
			return

	# Add a command to the code list
	def add(self, command):
		self.code.append(command)

	def getSymbolRecord(self, name):
		try:
			target = self.code[self.symbols[name]]
		except:
			RuntimeError(self.compiler.program, f'Unknown symbol \'{name}\'')
			return None

		return target

	def doValue(self, value):
		if value == None:
			FatalError(self.compiler, f'Undefined value (variable not initialized?)')

		result = {}
		valType = value['type']
		if valType in ['boolean', 'int', 'text', 'object']:
			result = value
		elif valType == 'cat':
			content = ''
			for part in value['parts']:
				val = self.doValue(part)
				if val == None:
					val = ''
				if val != '':
					val = str(val['content'])
					if val == None:
						val = ''
					content += val
			result['type'] = 'text'
			result['content'] = content
		elif valType == 'symbol':
			name = value['name']
			symbolRecord = self.getSymbolRecord(name)
			if symbolRecord['value'] == [None]:
				RuntimeWarning(self.compiler.program, f'Variable "{name}" has no value')
				return None
			handler = self.domainIndex[symbolRecord['domain']].valueHandler('symbol')
			result = handler(symbolRecord)
		else:
			# Call the given domain to handle a value
			domain = self.domainIndex[value['domain']]
			handler = domain.valueHandler(value['type'])
			if handler:
				result = handler(value)

		return result

	def constant(self, content, numeric):
		result = {}
		result['type'] = 'int' if numeric else 'text'
		result['content'] = content
		return result

	def evaluate(self, value):
		if value == None:
			result = {}
			result['type'] = 'text'
			result['content'] = ''
			return result

		result = self.doValue(value)
		if result:
			return result
		return None

	def getValue(self, value):
		return self.evaluate(value).content

	def getRuntimeValue(self, value):
		if value is None:
			return None
		v = self.evaluate(value)
		if v != None:
			content = v['content']
			if v['type'] == 'boolean':
				return True if content else False
			if v['type'] in ['int', 'float', 'text', 'object']:
				return content
			return ''
		return None

	def getSymbolValue(self, symbolRecord):
		if len(symbolRecord['value']) == 0:
			return None
		value = symbolRecord['value'][symbolRecord['index']]
		copy = deepcopy(value)
		return copy

	def putSymbolValue(self, symbolRecord, value):
		if symbolRecord['value'] == None or symbolRecord['value'] == []:
			symbolRecord['value'] = [value]
		else:
			index = symbolRecord['index']
			if index == None:
				index = 0
			symbolRecord['value'][index] = value

	def encode(self, value):
		return value

	def decode(self, value):
		return value

	# Tokenise the script
	def tokenise(self, script):
		index = 0
		lino = 0
		for line in script.lines:
			length = len(line)
			token = ''
			inSpace = True
			n = 0
			while n < length:
				c = line[n]
				if len(c.strip()) == 0:
					if (inSpace):
						n += 1
						continue
					script.tokens.append(Token(lino, token))
					index += 1
					token = ''
					inSpace = True
					n += 1
					continue
				inSpace = False
				if c == '`':
					m = n
					n += 1
					while n < len(line) - 1:
						if line[n] == '`':
							break
						n += 1
					# n += 1
					token = line[m:n+1]
				elif c == '!':
					break
				else:
					token += c
				n += 1
			if len(token) > 0:
				script.tokens.append(Token(lino, token))
				index += 1
			lino += 1
		return

	# Run the script
	def run(self, pc):
		# print(f'Run from {pc}')
		length = len(self.queue)
		self.queue.append(pc)
		if length > 0:
			return

		while len(self.queue):
			self.pc = self.queue.popleft()
			while True:
				command = self.code[self.pc]
				domainName = command['domain']
				if domainName == None:
					self.pc += 1
				else:
					keyword = command['keyword']
					if self.debugStep and command['debug']:
						lino = command['lino'] + 1
						line = self.script.lines[command['lino']].strip()
						print(f'{self.name}: Line {lino}: {domainName}:{keyword}:  {line}')
					domain = self.domainIndex[domainName]
					handler = domain.runHandler(keyword)
					if handler:
						command = self.code[self.pc]
						command['program'] = self
						self.pc = handler(command)
						try:
							if self.pc == 0 or self.pc >= len(self.code):
								return 0
						except:
							return 0
				if self.pc < 0:
					return -1

	def nonNumericValueError(self):
		FatalError(self.compiler, 'Non-numeric value')

	def variableDoesNotHoldAValueError(self, name):
		raise FatalError(self.compiler, f'Variable "{name}" does not hold a value')

	def noneValueError(self, name):
		raise FatalError(self.compiler, f'Value is None')

	def compare(self, value1, value2):
		val1 = self.evaluate(value1)
		val2 = self.evaluate(value2)
		if val1 == None or val2 == None:
			return 0
		v1 = val1['content']
		v2 = val2['content']
		if v1 == None and v2 != None or v1 != None and v2 == None:
			return 0
		if v1 != None and val1['type'] == 'int':
			if not val2['type'] == 'int':
				if type(v2) is str:
					try:
						v2 = int(v2)
					except:
						lino = self.code[self.pc]['lino'] + 1
						RuntimeError(None, f'Line {lino}: \'{v2}\' is not an integer')
		else:
			if v2 != None and val2['type'] == 'int':
				v2 = str(v2)
			if v1 == None:
				v1 = ''
			if v2 == None:
				v2 = ''
		if type(v1) == int:
			if type(v2) != int:
				v1 = f'{v1}'
		if type(v2) == int:
			if type(v1) != int:
				v2 = f'{v2}'
		if v1 > v2:
			return 1
		if v1 < v2:
			return -1
		return 0

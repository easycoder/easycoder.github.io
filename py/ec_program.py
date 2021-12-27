import time, json
from copy import copy
from collections import deque 
from ec_classes import Script, Token, FatalError, RuntimeError
from ec_compiler import Compiler

class Program:

	def __init__(self, source, domainMap):

		self.domainMap = domainMap
		self.domainList = {}
		self.domains = []
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
		for name in domainMap:
			if name[0] != '_':
				domain = domainMap[name](self.compiler)
				self.domains.append(domain)
		self.domainList = {}
		for domain in self.domains:
			self.domainList[domain.getName()] = domain
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
			print(f'Run {self.name}')
			self.run(0)
		else:
			self.compiler.showWarnings()
			return
	
	# Add a command to the code list
	def add(self, command):
		self.code.append(command)

	def getSymbolRecord(self, name):
		target = self.code[self.symbols[name]]
		return target

	def doValue(self, value):
		if value == None:
			FatalError(self.compiler, f'Undefined value (variable not initialized?)')
			return None
		
		valType = value['type']
		result = {}
		if valType in ['boolean', 'int', 'text', 'json']:
			result = value
		elif valType == 'cat':
			content = ''
			for part in value['parts']:
				val = self.doValue(part)
				if val == None:
					return None
				val = str(val['content'])
				if val == None:
					return None
				content += val
			result['type'] = 'text'
			result['content'] = content
		elif valType == 'symbol':
			name = value['name']
			symbolRecord = self.getSymbolRecord(name)
			if symbolRecord['value'] == [None]:
				RuntimeError(f'Variable "{name}" has no value')
				return None
			handler = self.domainList[symbolRecord['domain']].valueHandler('symbol')
			result = handler(symbolRecord)
		else:
			# Call the given domain to handle a value
			domain = self.domainList[value['domain']]
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
		v = self.evaluate(value)
		if v != None:
			content = v['content']
			if v['type'] == 'boolean':
				return True if content else False
			if v['type'] in ['int', 'float', 'text', 'json']:
				return content
			return ''
		return None
	
	def getSymbolValue(self, symbolRecord):
		value = copy(symbolRecord['value'][symbolRecord['index']])
		return value
	
	def putSymbolValue(self, symbolRecord, value):
		symbolRecord['value'][symbolRecord['index']] = value
	
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
						print(f'{self.name}: Line {lino}: PC: {self.pc} {domainName}:{keyword}:  {line}')
					domain = self.domainList[domainName]
					handler = domain.runHandler(keyword)
					if handler:
						self.pc = handler(self.code[self.pc])
						if self.pc == 0 or self.pc >= len(self.code):
							return 0
				if self.pc < 0:
					return -1
	
	def nonNumericValueError(self):
		FatalError(self.compiler, 'Non-numeric value')

	def variableDoesNotHoldAValueError(self, name):
		raise FatalError(self.compiler, f'Variable "{name}" does not hold a value')

	def compare(self, value1, value2):
		val1 = self.evaluate(value1)
		val2 = self.evaluate(value2)
		v1 = val1['content']
		v2 = val2['content']
		if not v1 == None and val1['type'] == 'int':
			if not val2['type'] == 'int':
				v2 = 0 if v2 == None else int(v2)
		else:
			if not v2 == None and val2['type'] == 'int':
				v2 = str(v2)
			if v1 == None:
				v1 = ''
			if v2 == None:
				v2 = ''
		if v1 > v2:
			return 1
		if v1 < v2:
			return -1
		return 0

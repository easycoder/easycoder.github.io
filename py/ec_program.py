import time, json
from copy import copy
from collections import deque 
from ec_classes import Script, Token, Error
from ec_compiler import Compiler
from ec_value import Value
from ec_condition import Condition

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
			if not name[0] is '_':
				domain = domainMap[name](self.compiler)
				self.domains.append(domain)
		self.domainList = {}
		for domain in self.domains:
			self.domainList[domain.getName()] = domain
		self.queue = deque()

		startCompile = time.time()
		self.tokenise(self.script)
		try:
			self.compiler.compileFrom(0, [])
			finishCompile = time.time()
			s = len(self.script.lines)
			t = len(self.script.tokens)
			print(f'Compiled {self.name}: {s} lines ({t} tokens) in ' +
				f'{round((finishCompile - startCompile) * 1000)} ms')
			self.run(0)
		except Error as err:
			print(err)
			if (err != 'stop'):
				if (self.onError):
					self.run(self.onError)
	
	# Add a command to the code list
	def add(self, command):
		self.code.append(command)

	def getSymbolRecord(self, name):
		target = self.code[self.symbols[name]]
		"""
		if (target.alias) {
			return this.getSymbolRecord(target.alias);
		}
		if (target.exporter) {
			if (target.exporter != this) {
				return target.exporter.getSymbolRecord(target.exportedName);
			}
		}
		"""
		return target

	def doValue(self, value):
		if value == None:
			raise Error(f'{self.code[self.pc].lino}: Undefined value (variable not initialized?)')
		
		valType = value['type']
		result = {}
		if valType in ['boolean', 'numeric', 'text', 'json']:
			result = value
		elif valType == 'cat':
			content = ''
			for part in value['parts']:
				content += str(self.doValue(part)['content'])
			result['type'] = 'text'
			result['content'] = content
		elif valType == 'symbol':
			symbolRecord = self.getSymbolRecord(value['name'])
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
		result['type'] = 'numeric' if numeric else 'text'
		result['content'] = content
		return result

	def evaluate(self, value):
		if not value:
			result = {}
			result['type'] = 'text'
			result['content'] = ''
			return result

		result = self.doValue(value)
		if result:
			return result

		raise Error(f'Line {self.code[self.pc]["lino"]+1}: I can\'t decode value: {value}')

	def getValue(self, value):
		return self.evaluate(value).content

	def getRuntimeValue(self, value):
		v = self.evaluate(value)
		content = v['content']
		if v['type'] == 'boolean':
			return True if content else False
		if v['type'] in ['numeric', 'text', 'json']:
			return content
		return ''
	
	def getSymbolValue(self, symbolRecord):
		value = copy(symbolRecord['value'][symbolRecord['index']])
		return value
	
	def putSymbolValue(self, symbolRecord, value):
		content = value['content']
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
				if len(c.strip()) is 0:
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
				if c is '`':
					m = n
					n += 1
					while n < len(line) - 1:
						if line[n] is '`':
							break
						n += 1
					# n += 1
					token = line[m:n+1]
				elif c is '!':
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
				if not self.pc or self.pc >= len(self.code):
					break
	
	def nonNumericValueError(self, lino):
		raise Error(f'Line {lino}: Non-numeric value')

	def variableDoesNotHoldAValueError(self, lino, name):
		raise Error(f'Line {lino}: Variable "{name}" does not hold a value')

	def compare(self, value1, value2):
		val1 = self.evaluate(value1)
		val2 = self.evaluate(value2)
		v1 = val1['content']
		v2 = val2['content']
		if not v1 == None and val1['type'] == 'numeric':
			if not val2['type'] == 'numeric':
				v2 = 0 if v2 == None else int(v2)
		else:
			if not v2 == None and val2['type'] == 'numeric':
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

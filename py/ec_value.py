from ec_classes import Error

class Value:

	def __init__(self, compiler):
		self.domains = compiler.domains
		self.getToken = compiler.getToken
		self.nextToken = compiler.nextToken
		self.peek = compiler.peek
		self.tokenIs = compiler.tokenIs

	def getItem(self):
		token = self.getToken()
		if not token:
			return None

		if token == 'true':
			self.nextToken()
			value = {}
			value['type'] = 'boolean'
			value['content'] = True
			return value

		if token == 'false':
			value = {}
			value['type'] = 'boolean'
			value['content'] = False
			return value

		# Check for a string constant
		if token[0] == '`':
			value = {}
			value['type'] = 'text'
			value['content'] = token[1 : len(token) - 1]
			return value

		# Check for a numeric constant
		if token.isnumeric():
			val = eval(token)
			if isinstance(val, int):
				value = {}
				value['type'] = 'numeric'
				value['content'] = val
				return value
			else:
				raise Error(f'{token} is not an integer')

		# See if any of the domains can handle it
		for domain in self.domains:
			try:
				return domain.compileValue()
			except Exception as err:
				raise Error(f'Cannot get value of "{token}": {err}')

		return None

	def compileValue(self):
		token = self.getToken()
		item = self.getItem()
		if not item:
			raise Error(f'Undefined value: "{token}"')

		if self.peek() == 'cat':
			value = {}
			value['type'] = 'cat'
			value['numeric'] = False
			value['parts'] = [item]
			while self.peek() == 'cat':
				self.nextToken()
				self.nextToken()
				value['parts'].append(self.getItem())
		else:
			value = item

	# See if any domain has something to add to the value
		for domain in self.domains:
			value = domain.modifyValue(value)

		return value
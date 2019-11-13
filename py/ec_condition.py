from ec_classes import Error

class Condition:

	def __init__(self, compiler):
		self.domains = compiler.domains
		self.getToken = compiler.getToken
		self.nextToken = compiler.nextToken
		self.peek = compiler.peek
		self.tokenIs = compiler.tokenIs
		self.mark = compiler.mark
		self.rewind = compiler.rewind
		self.program = compiler.program

	def compileCondition(self):
		self.mark()
		for domain in self.domains:
			code = domain.compileCondition()
			if code:
				code['domain'] = domain.getName()
				return code
			self.rewind()

	def testCondition(self, condition):
		handler = self.program.domainList[condition['domain']]
		handler = handler.conditionHandler(condition['type'])
		return handler(condition)
class Condition:

	def __init__(self, compiler):
		self.domains = compiler.domains
		self.getToken = compiler.getToken
		self.nextToken = compiler.nextToken
		self.peek = compiler.peek
		self.getIndex = compiler.getIndex
		self.tokenIs = compiler.tokenIs
		self.rewindTo = compiler.rewindTo
		self.program = compiler.program

	def compileCondition(self):
		mark = self.getIndex()
		for domain in self.domains:
			condition = domain.compileCondition()
			if condition != None:
				condition.domain= domain.getName()
				return condition
			self.rewindTo(mark)
			return None

	def testCondition(self, condition):
		handler = self.program.domainIndex[condition.domain]
		handler = handler.conditionHandler(condition.type)
		return handler(condition)

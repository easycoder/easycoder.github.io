import types

class Condition:

	def __init__(self, compiler):
		self.compiler = compiler
		self.getToken = compiler.getToken
		self.nextToken = compiler.nextToken
		self.peek = compiler.peek
		self.getIndex = compiler.getIndex
		self.tokenIs = compiler.tokenIs
		self.rewindTo = compiler.rewindTo
		self.program = compiler.program
		self.negate = False

	# Parse a single condition term using the domain loop
	def _parseConditionTerm(self):
		mark = self.getIndex()
		for domain in self.compiler.program.getDomains():
			condition = domain.compileCondition()
			if condition is not None:
				condition.domain = domain.getName()
				return condition
			self.rewindTo(mark)
		return None

	# Parse AND expressions (higher precedence than OR)
	def _parseAndExpression(self):
		left = self._parseConditionTerm()
		if left is None:
			return None
		while self.peek() == 'and':
			self.nextToken()  # advance to 'and'
			self.nextToken()  # advance past 'and' to first token of next term
			right = self._parseConditionTerm()
			if right is None:
				return left
			node = types.SimpleNamespace(domain='core', type='and', left=left, right=right)
			left = node
		return left

	# Parse OR expressions (lower precedence than AND)
	def _parseOrExpression(self):
		left = self._parseAndExpression()
		if left is None:
			return None
		while self.peek() == 'or':
			self.nextToken()  # advance to 'or'
			self.nextToken()  # advance past 'or' to first token of next term
			right = self._parseAndExpression()
			if right is None:
				return left
			node = types.SimpleNamespace(domain='core', type='or', left=left, right=right)
			left = node
		return left

	def compileCondition(self):
		return self._parseOrExpression()

	def testCondition(self, condition):
		handler = self.program.domainIndex[condition.domain]
		handler = handler.conditionHandler(condition.type)
		return handler(condition)

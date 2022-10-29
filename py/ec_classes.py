class FatalError():
	def __init__(self, compiler, message):
		lino = compiler.tokens[compiler.index].lino + 1
		print(f'Line {lino}: {message}')

class RuntimeError:
	def __init__(self, message):
		print(f'Runtime Error: {message}')
		quit()

class Script:
	def __init__(self, source):
		self.lines = source.splitlines()
		self.tokens = []

class Token:
	def __init__(self, lino, token):
		self.lino = lino
		self.token = token
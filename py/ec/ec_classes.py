import sys

class FatalError():
	def __init__(self, compiler, message):
		compiler.showWarnings()
		lino = compiler.tokens[compiler.index].lino
		script = compiler.script.lines[lino].strip()
		print(f'Compile error in {compiler.program.name} at line {lino + 1} ({script}): {message}')
		sys.exit()

class RuntimeError:
	def __init__(self, program, message):
		if program == None:
			sys.exit(f'Runtime Error: {message}')
		else:
			code = program.code[program.pc]
			lino = code['lino']
			script = program.script.lines[lino].strip()
			print(f'Runtime Error in {program.name} at line {lino + 1} ({script}): {message}')
			sys.exit()

class RuntimeWarning:
	def __init__(self, program, message):
		if program == None:
			print(f'Runtime Warning: {message}')
		else:
			code = program.code[program.pc]
			lino = code['lino']
			script = program.script.lines[lino].strip()
			print(f'Runtime Warning in {program.name} at line {lino + 1} ({script}): {message}')

class Script:
	def __init__(self, source):
		self.lines = source.splitlines()
		self.tokens = []

class Token:
	def __init__(self, lino, token):
		self.lino = lino
		self.token = token
	
class Condition():
	negate = False

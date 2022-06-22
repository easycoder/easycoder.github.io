import sys
from ec_program import Program
from ec_core import Core
from ec_autogui import Autogui

class EasyCoder:

	def __init__(self):
		self.version = 1

	domainMap = {}
	domainMap['core'] = Core
#	domainMap['autogui'] = Autogui

	scriptName = '/home/graham/Dropbox/Code/VisualStudio/EasyCoder/easycoder.github.io/py/benchmark.ecs'
	f = open(scriptName, 'r')
	source = f.read()
	f.close()

	Program(source, domainMap)

if __name__ == '__main__':
    EasyCoder()
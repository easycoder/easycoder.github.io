#!/bin/python3

import sys, os
sys.path.append('/home/graham/bin/easycoder')
from ec_program import Program
from ec_core import Core
from ec_p100 import P100

class EasyCoder:

	def __init__(self):
		self.version = 1

	print(os.getcwd())

	if (len(sys.argv) > 1):
		scriptName = None
		argv = []
		options = {}
		options['object'] = False
		options['format'] = False
		index = 1
		while index < len(sys.argv):
			arg = sys.argv[index]
			if arg == '-o':
				options['object'] = True
			else:
				argv.append(arg)
			index = index + 1
		if len(argv) == 0:
			print('Syntax: ec <scriptname>')
			exit
		Program(argv, [Core, P100], options)
	else:
		print('Syntax: ec <scriptname>')

if __name__ == '__main__':
    EasyCoder()

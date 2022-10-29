#! /bin/python

import sys
from ec_program import Program
from ec_core import Core

class EasyCoder:

	def __init__(self):
		self.version = 1

	if (len(sys.argv) > 1):
		scriptName = sys.argv[1]

		f = open(scriptName, 'r')
		source = f.read()
		f.close()

	Program(source, [Core])

if __name__ == '__main__':
    EasyCoder()

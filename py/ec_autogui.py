import pyautogui
from ec_classes import Error
from ec_handler import Handler

AUTOGUI = 'autogui'
DOWN = 'down'
DURATION = 'duration'
IN = 'in'
LEFT = 'left'
MODE = 'mode'
MULTIPLIER = 'multiplier'
RIGHT = 'right'
TO = 'to'
UP = 'up'
VALUE = 'value'
VALUE2 = 'value2'

class Autogui(Handler):

	def __init__(self, compiler):
		Handler.__init__(self, compiler)
	
	def getName(self):
		return AUTOGUI
	
	#############################################################################
	# Keyword handlers

	def k_click(self, command):
		self.add(command)
		return True

	def r_click(self, command):
		pyautogui.click()

	def k_drag(self, command):
		token = self.nextToken()
		command[MODE] = token
		return self.dragMove(command, token)
	
	def r_drag(self, command):
		mode = command[MODE]
		val = self.getRuntimeValue(command[VALUE])
		duration = self.getRuntimeValue(command[DURATION]) * command[MULTIPLIER]
		if mode == LEFT:
			pyautogui.dragRel(-val, None, duration)
		elif mode == RIGHT:
			pyautogui.dragRel(val, None, duration)
		elif mode == UP:
			pyautogui.dragRel(None, -val, duration)
		elif mode == DOWN:
			pyautogui.dragRel(None, val, duration)
		return self.nextPC()
	
	def k_move(self, command):
		token = self.nextToken()
		command[MODE] = token
		if token == TO:
			command[VALUE] = self.nextValue()
			command[VALUE2] = self.nextValue()
			command[DURATION] = 0
			self.add(command)
			return True
		return self.dragMove(command, token)
	
	def r_move(self, command):
		mode = command[MODE]
		val = self.getRuntimeValue(command[VALUE])
		if mode == TO:
			pyautogui.moveTo(val, self.getRuntimeValue(command[VALUE2]))
		else:
			duration = self.getRuntimeValue(command[DURATION]) * command[MULTIPLIER]
			if mode == LEFT:
				pyautogui.moveRel(-val, None, duration)
			elif mode == RIGHT:
				pyautogui.moveRel(val, None, duration)
			elif mode == UP:
				pyautogui.moveRel(None, -val, duration)
			elif mode == DOWN:
				pyautogui.moveRel(None, val, duration)
		return self.nextPC()

	#############################################################################
	# Support functions

	def dragMove(self,command, token):
		if token in [LEFT, RIGHT, UP, DOWN]:
			command[VALUE] = self.nextValue()
			multiplier = 1
			if self.peek() == IN:
				self.nextToken()
				command[DURATION] = self.nextValue()
				token = self.nextToken()
				if token in ['milli', 'millis']:
					multiplier = 0.001
				elif token in ['tick', 'ticks']:
					multiplier = 0.01
				elif token in ['second', 'seconds']:
					multiplier = 1
				elif token in ['minute', 'minutes']:
					multiplier = 1
			command[MULTIPLIER] = multiplier
			self.add(command)
			return True
		return False

	#############################################################################
	# Compile a value in this domain
	def compileValue(self):
		return None
	
	#############################################################################
	# Modify a value or leave it unchanged.
	def modifyValue(self, value):
		return value

	#############################################################################
	# Value handlers

	#############################################################################
	# Compile a condition
	def compileCondition(self):
		return None

	#############################################################################
	# Condition handlers
		

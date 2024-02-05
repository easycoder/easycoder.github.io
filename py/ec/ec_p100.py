from ec_classes import FatalError, RuntimeError
from ec_handler import Handler
from PyP100 import PyP100

class P100(Handler):

    loginEmail = None
    loginPassword = None

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'p100'

    #############################################################################
    # Keyword handlers

    def k_relay(self, command):
        command['address'] = self.nextValue()
        command['email'] = self.nextValue()
        command['password'] = self.nextValue()
        command['state'] = self.nextValue()
        self.add(command)
        return True

    def r_relay(self, command):
        try:
            address = self.getRuntimeValue(command['address'])
            email = self.getRuntimeValue(command['email'])
            password = self.getRuntimeValue(command['password'])
            state = self.getRuntimeValue(command['state'])
            p100 = PyP100.P100(address, email, password)
            p100.handshake()
            p100.login()
            if state == 'on':
                p100.turnOn()
            else:
                p100.turnOff()
        except Exception as e:
            print(f'Relay: {e}')
        return self.nextPC()

    def k_set(self, command):
        if self.tokenIs('p100'):
            token = self.nextToken()
            if token == 'email':
                if self.nextIs('to'):
                    command['email'] = self.nextValue()
            elif token == 'password':
                if self.nextIs('to'):
                    command['password'] = self.nextValue()
            else:
                FatalError(self.compiler, f'I don\'t understand \'rbr {token}\'')
            self.add(command)
        return True

    def r_set(self, command):
        if 'email' in command:
            self.loginEmail = self.getRuntimeValue(command['email'])
        if 'password' in command:
            self.loginPassword = self.getRuntimeValue(command['password'])
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = {}
        value['domain'] = 'rbr'
        if self.tokenIs('the'):
            self.nextToken()
        token = self.getToken()
        if token == 'xxxxx':
            return value

        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_xxxxx(self, v):
        value = {}
        return value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        return condition

    #############################################################################
    # Condition handlers

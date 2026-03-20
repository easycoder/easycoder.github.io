from easycoder import Handler, ECValue
import os
from psutil import Process

class PSUtil(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'psutil'

    #############################################################################
    # Keyword handlers

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = ECValue(domain=self.getName())
        if self.tokenIs('the'):
            self.nextToken()
        token = self.getToken()
        if token in ['mem', 'memory']:
            value.setType('memory')
            return value
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_memory(self, v):
        process: Process = Process(os.getpid())
        megabytes: float = process.memory_info().rss / (1024 * 1024)
        return ECValue(domain=self.getName(), type=float, content=megabytes)

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        return None

    #############################################################################
    # Condition handlers

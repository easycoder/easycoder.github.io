from easycoder import Handler, FatalError, RuntimeError, math

class Points(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'points'

    #############################################################################
    # Keyword handlers

    def k_point(self, command):
        return self.compileVariable(command, False)

    def r_point(self, command):
        return self.nextPC()

    # set {point} to {xvalue} {yvalue}
    def k_set(self, command):
        if self.nextIsSymbol():
            pointRecord = self.getSymbolRecord()
            if pointRecord['keyword'] == 'point':
                if self.nextIs('to'):
                    xValue = self.nextValue()
                    yValue = self.nextValue()
                    command['x'] = xValue
                    command['y'] = yValue
                    command['name'] = pointRecord['name']
                    self.add(command)
                    return True
        return False

    def r_set(self, command):
        pointRecord = self.getVariable(command['name'])
        x = self.textify(command['x'])
        y = self.textify(command['y'])
        pointRecord['x'] = x
        pointRecord['y'] = y
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = {}
        value['domain'] = 'points'
        if self.tokenIs('the'):
            self.nextToken()
        token = self.getToken()
        if token == 'distance':
            if self.nextIs('between'):
                if self.nextIsSymbol():
                    point1Record = self.getSymbolRecord()
                    if point1Record['keyword'] == 'point':
                        if self.nextIs('and'):
                            if self.nextIsSymbol():
                                point2Record = self.getSymbolRecord()
                                if point2Record['keyword'] == 'point':
                                    value['type'] = 'difference'
                                    value['point1'] = point1Record['name']
                                    value['point2'] = point2Record['name']
            return value
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_difference(self, v):
        point1 = self.getVariable(v['point1'])
        point2 = self.getVariable(v['point2'])
        dx = point2['x'] - point1['x']
        dy = point2['y'] - point1['y']
        value = {}
        value['type'] = int
        value['content'] = int(math.sqrt(dx*dx + dy*dy))
        return value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        return condition

    #############################################################################
    # Condition handlers

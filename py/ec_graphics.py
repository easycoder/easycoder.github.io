from ec_classes import FatalError, RuntimeError
from ec_handler import Handler
from pyctures import *

class Graphics(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'graphics'

    #############################################################################
    # Keyword handlers

    def k_attach(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['name'] = record['name']
            if self.nextIs('to'):
                value = self.nextValue()
                command['id'] = value
            self.add(command)
        return True

    def r_attach(self, command):
        target = self.getVariable(command['name'])
        id = self.getRuntimeValue(command['id'])
        element = getElement(id)
        if element == None:
            FatalError(self.program.compiler, f'There is no screen element with id \'{id}\'')
            return -1
        self.putSymbolValue(target, {'type': 'text', 'content': id})
        return self.nextPC()

    def k_create(self, command):
        if self.nextIs('screen'):
            while True:
                token = self.peek()
                if token == 'at':
                    self.nextToken()
                    command['left'] = self.nextValue()
                    command['top'] = self.nextValue()
                elif token == 'size':
                    self.nextToken()
                    command['width'] = self.nextValue()
                    command['height'] = self.nextValue()
                elif token == 'fill':
                    self.nextToken()
                    command['fill'] = self.nextValue()
                else:
                    break
            self.add(command)
            return True
        return False

    def r_create(self, command):
        createScreen(command)
        return self.nextPC()

    def k_ellipse(self, command):
        return self.compileVariable(command)

    def r_ellipse(self, command):
        return self.nextPC()

    def k_image(self, command):
        return self.compileVariable(command)

    def r_image(self, command):
        return self.nextPC()

    def k_on(self, command):
        token = self.nextToken()
        command['type'] = token
        if token == 'click':
            command['event'] = token
            if self.peek() == 'in':
                self.nextToken()
            if self.nextIs('screen'):
                command['target'] = None
            elif self.isSymbol():
                target = self.getSymbolRecord()
                command['target'] = target['name']
            else:
                FatalError(self.program.compiler, f'{self.getToken()} is not a screen element')
                return False
            command['goto'] = self.getPC() + 2
            self.add(command)
            self.nextToken()
            pcNext = self.getPC()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.addCommand(cmd)
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.addCommand(cmd)
            # Fixup the link
            self.getCommandAt(pcNext)['goto'] = self.getPC()
            return True
        elif token == 'tick':
            command['event'] = token
            command['goto'] = self.getPC() + 2
            self.add(command)
            self.nextToken()
            pcNext = self.getPC()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.addCommand(cmd)
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.addCommand(cmd)
            # Fixup the link
            self.getCommandAt(pcNext)['goto'] = self.getPC()
            return True
        return False

    def r_on(self, command):
        pc = command['goto']
        if command['type'] == 'click':
            event = command['event']
            if event == 'click':
                target = command['target']
                if target == None:
                    value = 'screen'
                else:
                    widget = self.getVariable(target)
                value = widget['value'][widget['index']]
                setOnClick(value['content'], lambda: self.run(pc))
        elif command['type'] == 'tick':
            setOnTick(lambda: self.run(pc))
        return self.nextPC()

    def k_rectangle(self, command):
        return self.compileVariable(command)

    def r_rectangle(self, command):
        return self.nextPC()

    def k_render(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            name = record['name']
            type = record['keyword']
            command['type'] = type
            if record['isValueHolder']:
                command['name'] = name
                if self.peek() == 'in':
                    self.nextToken()
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        type = record['type']
                        name = record['name']
                        if type in ['rectangle', 'ellipse']:
                            command['parent'] = record['name']
                            self.add(command)
                            return True
                        else:
                            self.warning(f'{name} cannot be a parent of another element')
                            return False
                command['parent'] = 'screen'
                self.add(command)
                return True
            FatalError(self.program.compiler, f'This variable type cannot be rendered')
            return False
        FatalError(self.program.compiler, 'Nothing specified to render')
        return False

    def r_render(self, command):
        variable = self.getVariable(command['name'])
        parent = command['parent']
        value = self.getRuntimeValue(variable)
        result = render(value, parent)
        if result != None:
            RuntimeError(command['program'], f'Rendering error: {result}')
        return self.nextPC()

    def k_set(self, command):
        if self.peek() == 'the':
            self.nextToken()
        token = self.peek()
        if token == 'text':
            self.nextToken()
            command['variant'] = 'setText'
            if self.peek() == 'of':
                self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                command['name'] = record['name']
                if record['keyword'] != 'text':
                    RuntimeError(command['program'], f'Symbol type is not \'text\'')
                if self.peek() == 'to':
                    self.nextToken()
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
            return False
        elif token == 'background':
            self.nextToken()
            command['variant'] = 'setBackground'
            if self.peek() == 'color':
                self.nextToken()
            if self.peek() == 'of':
                self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                command['name'] = record['name']
                if not record['keyword'] in ['rectangle', 'ellipse']:
                    RuntimeError(command['program'], f'Symbol type is not \'rectangle\' or \'ellipse\'')
                if self.peek() == 'to':
                    self.nextToken()
                    command['value'] = self.nextValue()
                    self.add(command)
                return True
            return False
        return False

    def r_set(self, command):
        variant = command['variant']
        if variant == 'setText':
            variable = self.getVariable(command['name'])
            element = self.getSymbolValue(variable)
            value = self.getRuntimeValue(command['value'])
            setText(element['content'], value)
        elif variant == 'setBackground':
            variable = self.getVariable(command['name'])
            element = self.getSymbolValue(variable)
            value = self.getRuntimeValue(command['value'])
            setBackground(element['content'], value)
        return self.nextPC()

    def k_show(self, command):
        if self.nextIs('screen'):
            command['name'] = None
            self.add(command)
            return True
        return False

    def r_show(self, command):
        showScreen()
        return self.nextPC()

    def k_spec(self, command):
        return self.compileVariable(command, True)

    def r_spec(self, command):
        return self.nextPC()

    def k_text(self, command):
        return self.compileVariable(command)

    def r_text(self, command):
        return self.nextPC()
    
    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = {}
        value['domain'] = 'graphics'
        token = self.getToken()
        if self.isSymbol():
            value['name'] = token
            symbolRecord = self.getSymbolRecord()
            keyword = symbolRecord['keyword']
            if keyword == 'module':
                value['type'] = 'module'
                return value

            if symbolRecord['isValueHolder'] == True or keyword == 'dictionary':
                value['type'] = 'symbol'
                return value
            return None

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

    def v_symbol(self, symbolRecord):
        result = {}
        if symbolRecord['isValueHolder']:
            symbolValue = self.getSymbolValue(symbolRecord)
            if symbolValue == None:
                return None
            result['type'] = symbolValue['type']
            content = symbolValue['content']
            if content == None:
                return ''
            result['content'] = content
            return result
        else:
            return ''

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        return condition

    #############################################################################
    # Condition handlers

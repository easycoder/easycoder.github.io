from ec_classes import FatalError, RuntimeError
from ec_handler import Handler
from graphson import createScreen, renderSpec, renderScreen, getElement, closeScreen, setOnClick

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
            FatalError(self.program.compiler, f'There is no screen element with id \'{self.getToken()}\'')
        self.putSymbolValue(target, {'type': 'text', 'content': id})
        return self.nextPC()

    def k_close(self, command):
        if self.nextToken() == 'screen':
            self.add(command)
        return True

    def r_close(self, command):
        closeScreen(self.screen)
        self.screen = None
        return self.nextPC()

    def k_create(self, command):
        if self.nextToken() == 'screen':
            self.add(command)
            return True
        return False

    def r_create(self, command):
        self.screen = createScreen()
        return self.nextPC()

    def k_label(self, command):
        return self.compileVariable(command, 'label', False)

    def r_label(self, command):
        return self.nextPC()

    def k_on(self, command):
        token = self.nextToken()
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
            # Fixup the link
            self.getCommandAt(pcNext)['goto'] = self.getPC()
            return True
        return False

    def r_on(self, command):
        event = command['event']
        if event == 'click':
            target = command['target']
            if target == None:
                value = 'screen'
            else:
                widget = self.getVariable(target)
                value = widget['value'][widget['index']]
            pc = command['goto']
            setOnClick(value['content'], lambda: self.run(pc))
        return self.nextPC()

    def k_rectangle(self, command):
        return self.compileVariable(command, 'rectangle', False)

    def r_rectangle(self, command):
        return self.nextPC()

    def k_render(self, command):
        if self.nextIs('screen'):
            command['name'] = None
            self.add(command)
            return True
        elif self.isSymbol():
            record = self.getSymbolRecord()
            name = record['name']
            type = record['type']
            command['type'] = type
            if type == 'variable':
                command['name'] = name
                if self.peek() == 'in':
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
        if command['name'] == None:
            renderScreen(self.screen)
        else:
            variable = self.getVariable(command['name'])
            spec = self.getRuntimeValue(variable)
            offset = {'dx': 0, 'dy': 0}
            result = renderSpec(self.screen, spec, offset)
            if result != None:
                RuntimeError(f'Rendering error: {result}')
        return self.nextPC()
    
    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = {}
        value['domain'] = 'graphics'
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

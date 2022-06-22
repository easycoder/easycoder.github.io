import json, math, hashlib, threading, os, requests, time
from datetime import datetime, timezone
from random import randrange
from ec_classes import FatalError, RuntimeError
from ec_handler import Handler
from ec_timestamp import getTimestamp

class Core(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'core'

    #############################################################################
    # Keyword handlers

    def k_add(self, command):
        # Get the (first) value
        command['value1'] = self.nextValue()
        if self.nextToken() == 'to':
            if self.nextIsSymbol():
                symbolRecord = self.getSymbolRecord()
                if symbolRecord['valueHolder']:
                    if self.peek() == 'giving':
                        # This variable must be treated as a second value
                        command['value2'] = self.getValue()
                        self.nextToken()
                        command['target'] = self.nextToken()
                        self.add(command)
                        return True
                    else:
                        # Here the variable is the target
                        command['target'] = self.getToken()
                        self.add(command)
                        return True
                self.warning(f'core.take: Expected value holder')
            else:
                # Here we have 2 values so 'giving' must come next
                command['value2'] = self.getValue()
                if self.nextToken() == 'giving':
                    command['target'] = self.nextToken()
                    self.add(command)
                    return True
                self.warning(f'core.take: Expected "giving"')
        return False

    def r_add(self, command):
        value1 = command['value1']
        try:
            value2 = command['value2']
        except:
            value2 = None
        target = self.getVariable(command['target'])
        if not target['valueHolder']:
            self.variableDoesNotHoldAValueError(target['name'])
            return None
        value = self.getSymbolValue(target)
        if value == None:
            value = {}
            value['type'] = 'int'
        if value2:
            v1 = int(self.getRuntimeValue(value1))
            v2 = int(self.getRuntimeValue(value2))
            value['content'] = v1+v2
        else:
#            if value['type'] != 'int' and value['content'] != None:
#                self.nonNumericValueError()
            v = self.getRuntimeValue(value)
            v = int(v)
            v1 = int(self.getRuntimeValue(value1))
            value['content'] = v+v1
        self.putSymbolValue(target, value)
        return self.nextPC()

    def k_append(self, command):
        command['value'] = self.nextValue()
        if self.nextIs('to'):
            if self.nextIsSymbol():
                symbolRecord = self.getSymbolRecord()
                if symbolRecord['valueHolder']:
                    command['target'] = symbolRecord['name']
                    self.add(command)
                    return True
                self.warning(f'Variable "{symbolRecord["name"]}" does not hold a value')
        return False

    def r_append(self, command):
        value = self.getRuntimeValue(command['value'])
        target = self.getVariable(command['target'])
        val = self.getSymbolValue(target)
        content = val['content']
        if content == '':
            content = []
        content.append(value)
        val['content'] = content
        self.putSymbolValue(target, val)
        return self.nextPC()

    def k_begin(self, command):
        if self.nextToken() == 'end':
            cmd = {}
            cmd['domain'] = 'core'
            cmd['keyword'] = 'end'
            cmd['debug'] = True
            cmd['lino'] = command['lino']
            self.addCommand(cmd)
        else:
            return self.compileFromHere(['end'])

    def k_clear(self, command):
        if self.nextIsSymbol():
            target = self.getSymbolRecord()
            if target['valueHolder']:
                command['target'] = target['name']
                self.add(command)
                return True
        return False

    def r_clear(self, command):
        target = self.getVariable(command['target'])
        val = {}
        val['type'] = 'boolean'
        val['content'] = False
        self.putSymbolValue(target, val)
        self.add(command)
        return self.nextPC()

    def k_close(self, command):
        if self.nextIsSymbol():
            fileRecord = self.getSymbolRecord()
            if fileRecord['keyword'] == 'file':
                command['file'] = fileRecord['name']
                self.add(command)
                return True
        return False

    def r_close(self, command):
        fileRecord = self.getVariable(command['file'])
        fileRecord['file'].close()
        return self.nextPC()

    def k_debug(self, command):
        token = self.peek()
        if token in ['step', 'program']:
            command['mode'] = token
            self.nextToken()
        else:
            command['mode'] = None
        self.add(command)
        return True

    def r_debug(self, command):
        if command['mode'] == 'step':
            self.program.debugStep = True
        elif command['mode'] == 'program':
            for item in self.code:
                print(json.dumps(item, indent = 2))
        return self.nextPC()

    def k_decrement(self, command):
        if self.nextIsSymbol():
            symbolRecord = self.getSymbolRecord()
            if symbolRecord['valueHolder']:
                command['target'] = self.getToken()
                self.add(command)
                return True
            self.warning(f'Variable "{symbolRecord["name"]}" does not hold a value')
        return False

    def r_decrement(self, command):
        return self.incdec(command, '-')

    def k_dictionary(self, command):
        return self.compileVariable(command, False)

    def r_dictionary(self, command):
        return self.nextPC()

    def k_divide(self, command):
        # Get the (first) value
        command['value1'] = self.nextValue()
        if self.nextToken() == 'by':
            command['value2'] = self.nextValue()
            if self.peek() == 'giving':
                self.nextToken()
                if (self.nextIsSymbol()):
                    command['target'] = self.getToken()
                    self.add(command)
                    return True
                FatalError(self.compiler, f'{self.code[self.pc].lino}: Symbol expected')
            else:
                # First value must be a variable
                if command['value1']['type'] == 'symbol':
                    command['target'] = command['value1']['name']
                    self.add(command)
                    return True
                FatalError(self.compiler, f'{self.code[self.pc].lino}: First value must be a variable')
        return False

    def r_divide(self, command):
        value1 = command['value1']
        try:
            value2 = command['value2']
        except:
            value2 = None
        target = self.getVariable(command['target'])
        if not target['valueHolder']:
            self.variableDoesNotHoldAValueError(target['name'])
            return None
        value = self.getSymbolValue(target)
        if value == None:
            value = {}
            value['type'] = 'int'
        if value2:
            v1 = int(self.getRuntimeValue(value1))
            v2 = int(self.getRuntimeValue(value2))
            value['content'] = v1/v2
        else:
            if value['type'] != 'int' and value['content'] != None:
                self.nonNumericValueError(self.compiler, command['lino'])
            v = int(self.getRuntimeValue(value))
            v1 = int(self.getRuntimeValue(value1))
            value['content'] = v/v1
        self.putSymbolValue(target, value)
        return self.nextPC()

    def k_dummy(self, command):
        self.add(command)
        return True

    def r_dummy(self, command):
        return self.nextPC()

    def k_end(self, command):
        self.add(command)
        return True

    def r_end(self, command):
        return self.nextPC()

    def k_exit(self, command):
        self.add(command)
        return True

    def r_exit(self, command):
        return 0

    def k_file(self, command):
        return self.compileVariable(command, False)

    def r_file(self, command):
        return self.nextPC()

    def k_fork(self, command):
        if self.peek() == 'to':
            self.nextToken()
        command['fork'] = self.nextToken()
        self.add(command)
        return True

    def r_fork(self, command):
        next = self.nextPC()
        label = command['fork']
        try:
            label = self.symbols[label + ':']
        except:
            FatalError(self.compiler, f'There is no label "{label + ":"}"')
            return None
        self.run(label)
        return next

    def k_get(self, command):
        self.add(command)
        if self.nextIsSymbol():
            symbolRecord = self.getSymbolRecord()
            if symbolRecord['valueHolder']:
                command['target'] = self.getToken()
            else:
                FatalError(self.compiler, f'Variable "{symbolRecord["name"]}" does not hold a value')
        if self.nextIs('from'):
            command['url'] = self.nextValue()
            return True
        return False

    def r_get(self, command):
        url = self.getRuntimeValue(command['url'])
        response = requests.get(url, auth = ('user', 'pass'))
        symbolRecord = self.getVariable(command['target'])
        value = {}
        value['type'] = 'text'
        value['content'] = response.text
        self.putSymbolValue(symbolRecord, value)
        return self.nextPC()

    def k_gosub(self, command):
        if self.peek() == 'to':
            self.nextToken()
        command['gosub'] = self.nextToken()
        self.add(command)
        return True

    def r_gosub(self, command):
        label = command['gosub'] + ':'
        address = self.symbols[label]
        if address != None:
            self.stack.append(self.nextPC())
            return address
        FatalError(self.program.compiler, f'There is no label "{label + ":"}"')
        return None

    def k_go(self, command):
        if self.peek() == 'to':
            self.nextToken()
            return self.k_goto(command)

    def k_goto(self, command):
        command['keyword'] = 'goto'
        command['goto'] = self.nextToken()
        self.add(command)
        return True

    def r_goto(self, command):
        label = f'{command["goto"]}:'
        if self.symbols[label]:
            return self.symbols[label]
        FatalError(self.program.compiler, f'There is no label "{label}"')
        return None

    def r_gotoPC(self, command):
        return command['goto']

    def k_if(self, command):
        command['condition'] = self.nextCondition()
        self.addCommand(command)
        self.nextToken()
        pcElse = self.getPC()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = 0
        cmd['debug'] = False
        self.addCommand(cmd)
        # Get the 'then' code
        self.compileOne()
        if self.peek() == 'else':
            self.nextToken()
            # Add a 'goto' to skip the 'else'
            pcNext = self.getPC()
            cmd = {}
            cmd['lino'] = command['lino']
            cmd['domain'] = 'core'
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.addCommand(cmd)
            # Fixup the link to the 'else' branch
            self.getCommandAt(pcElse)['goto'] = self.getPC()
            # Process the 'else' branch
            self.nextToken()
            self.compileOne()
            # Fixup the pcNext 'goto'
            self.getCommandAt(pcNext)['goto'] = self.getPC()
        else:
            # We're already at the next command
            self.getCommandAt(pcElse)['goto'] = self.getPC()
        return True

    def r_if(self, command):
        test = self.program.condition.testCondition(command['condition'])
        if test:
            self.program.pc += 2
        else:
            self.program.pc += 1
        return self.program.pc

    def k_increment(self, command):
        if self.nextIsSymbol():
            symbolRecord = self.getSymbolRecord()
            if symbolRecord['valueHolder']:
                command['target'] = self.getToken()
                self.add(command)
                return True
            self.warning(f'Variable "{symbolRecord["name"]}" does not hold a value')
        return False

    def r_increment(self, command):
        return self.incdec(command, '+')

    def k_index(self, command):
        # get the variable
        if self.nextIsSymbol():
            command['target'] = self.getToken()
            if self.nextToken() == 'to':
                # get the value
                command['value'] = self.nextValue()
                self.add(command)
                return True
        return False

    def r_index(self, command):
        symbolRecord = self.getVariable(command['target'])
        symbolRecord['index'] = self.getRuntimeValue(command['value'])
        return self.nextPC()

    def k_input(self, command):
        # get the variable
        if self.nextIsSymbol():
            command['target'] = self.getToken()
            command['prompt'] = ': '
            if self.peek() == 'with':
                self.nextToken()
                command['prompt'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_input(self, command):
        symbolRecord = self.getVariable(command['target'])
        prompt = command['prompt']['content']
        value = {}
        value['type'] = 'text'
        value['numeric'] = False
        value['content'] = prompt+input(prompt)
        self.putSymbolValue(symbolRecord, value)
        return self.nextPC()

    def k_multiply(self, command):
        # Get the (first) value
        command['value1'] = self.nextValue()
        if self.nextToken() == 'by':
            command['value2'] = self.nextValue()
            if self.peek() == 'giving':
                self.nextToken()
                if (self.nextIsSymbol()):
                    command['target'] = self.getToken()
                    self.add(command)
                    return True
                FatalError(f'self.compiler, Symbol expected')
            else:
                # First value must be a variable
                if command['value1']['type'] == 'symbol':
                    command['target'] = command['value1']['name']
                    self.add(command)
                    return True
                FatalError(f'self.compiler, First value must be a variable')
        return False

    def r_multiply(self, command):
        value1 = command['value1']
        try:
            value2 = command['value2']
        except:
            value2 = None
        target = self.getVariable(command['target'])
        if not target['valueHolder']:
            self.variableDoesNotHoldAValueError(target['name'])
            return None
        value = self.getSymbolValue(target)
        if value == None:
            value = {}
            value['type'] = 'int'
        if value2:
            v1 = int(self.getRuntimeValue(value1))
            v2 = int(self.getRuntimeValue(value2))
            value['content'] = v1*v2
        else:
            if value['type'] != 'int' and value['content'] != None:
                self.nonNumericValueError()
                return None
            v = int(self.getRuntimeValue(value))
            v1 = int(self.getRuntimeValue(value1))
            value['content'] = v*v1
        self.putSymbolValue(target, value)
        return self.nextPC()

    def k_open(self, command):
        if self.nextIsSymbol():
            symbolRecord = self.getSymbolRecord()
            command['target'] = symbolRecord['name']
            command['path'] = self.nextValue()
            if symbolRecord['keyword'] == 'file':
                if self.peek() == 'for':
                    self.nextToken()
                    token = self.nextToken()
                    if token == 'appending':
                        mode = 'a+'
                    elif token == 'reading':
                        mode = 'r'
                    elif token == 'writing':
                        mode = 'w'
                    else:
                        FatalError(f'self.compiler, Unknown file open mode {token}')
                        return False
                    command['mode'] = mode
                    self.add(command)
                    return True
            else:
                FatalError(self.compiler, f'Variable "{self.getToken()}" is not a file')
        else:
            self.warning(f'core.open: Variable "{self.getToken()}" not declared')
        return False

    def r_open(self, command):
        symbolRecord = self.getVariable(command['target'])
        path = self.getRuntimeValue(command['path'])
        if command['mode'] == 'r' and os.path.exists(path) or command['mode'] != 'r':
            symbolRecord['file'] = open(path, command['mode'])
            return self.nextPC()
        RuntimeError(f"File {path} does not exist")
        return -1

    def k_post(self, command):
        self.add(command)
        if self.nextIs('to'):
            command['value'] = self.getConstant('')
            command['url'] = self.getValue()
        else:
            command['value'] = self.getValue()
            if self.nextIs('to'):
                command['url'] = self.nextValue()
        if self.peek() == 'giving':
            self.nextToken()
            command['result'] = self.nextToken()
        self.add(command)
        return True

    def r_post(self, command):
        value = self.getRuntimeValue(command['value'])
        url = self.getRuntimeValue(command['url'])
        try:
            response = requests.post(url, json=value)
            if command.get('result'):
                value = {}
                value['type'] = 'text'
                value['numeric'] = False
                value['content'] = response.text
                result = self.getVariable(command['result'])
                self.program.putSymbolValue(result, value);
        except  Exception as e:
            print(e)
        return self.nextPC()

    def k_print(self, command):
        value = self.nextValue()
        if value != None:
            command['value'] = value
            self.add(command)
            return True
        FatalError(self.program.compiler, 'I can\'t print this value')
        return False

    def r_print(self, command):
        value = self.getRuntimeValue(command['value'])
        if value != None:
            print(f'-> {value}')
            return self.nextPC()

    def k_put(self, command):
        command['value'] = self.nextValue()
        if self.nextIs('into'):
            if self.nextIsSymbol():
                symbolRecord = self.getSymbolRecord()
                command['target'] = symbolRecord['name']
                if symbolRecord['valueHolder']:
                        self.add(command)
                        return True
                elif symbolRecord['keyword'] == 'dictionary':
                    if self.peek() == 'as':
                        self.nextToken()
                    command['keyword'] = 'putDict'
                    command['key'] = self.nextValue()
                    self.add(command)
                    return True
                else:
                    FatalError(self.program.compiler, f'Symbol {symbolRecord["name"]} is not a value holder')
            else:
                FatalError(self.program.compiler, f'No such variable: "{self.getToken()}"')
        return False

    def r_put(self, command):
        value = self.evaluate(command['value'])
        if value == None:
            return -1
        symbolRecord = self.getVariable(command['target'])
        if not symbolRecord['valueHolder']:
            FatalError(self.program.compiler, f'{symbolRecord["name"]} does not hold a value')
            return -1
        self.putSymbolValue(symbolRecord, value)
        return self.nextPC()

    def r_putDict(self, command):
        key = self.getRuntimeValue(command['key'])
        value = self.getRuntimeValue(command['value'])
        symbolRecord = self.getVariable(command['target'])
        record = self.getSymbolValue(symbolRecord)
        if record == None:
            record = {}
            record['type'] = 'text'
            content = {}
        else:
            content = record['content']
        if content is None:
            content = {}
        record['type'] = 'int' if isinstance(value, int) else 'text'
        content[key] = value
        record['content'] = content
        self.putSymbolValue(symbolRecord, record)
        return self.nextPC()

    def k_read(self, command):
        if self.peek() == 'line':
            self.nextToken()
            command['line'] = True
        else:
            command['line'] = False
        if self.nextIsSymbol():
                symbolRecord = self.getSymbolRecord()
                if symbolRecord['valueHolder']:
                    if self.peek() == 'from':
                        self.nextToken()
                        if self.nextIsSymbol():
                            fileRecord = self.getSymbolRecord()
                            if fileRecord['keyword'] == 'file':
                                command['target'] = symbolRecord['name']
                                command['file'] = fileRecord['name']
                                self.add(command)
                                return True
        return False

    def r_read(self, command):
        symbolRecord = self.getVariable(command['target'])
        fileRecord = self.getVariable(command['file'])
        line = command['line']
        file = fileRecord['file']
        if file.mode == 'r':
            value = {}
            content = file.readline().strip() if line else file.read()
            value['type'] = 'text'
            value['numeric'] = False
            value['content'] = content
            self.putSymbolValue(symbolRecord, value)
        return self.nextPC()

    def k_replace(self, command):
        original = self.nextValue()
        if self.nextIs('with'):
            replacement = self.nextValue()
            if self.nextIs('in'):
                if self.nextIsSymbol():
                    templateRecord = self.getSymbolRecord()
                    command['original'] = original
                    command['replacement'] = replacement
                    command['target'] = templateRecord['name']
                    self.add(command)
                    return True
        return False

    def r_replace(self, command):
        templateRecord = self.getVariable(command['target'])
        content = self.getSymbolValue(templateRecord)['content']
        original = self.getRuntimeValue(command['original'])
        replacement = self.getRuntimeValue(command['replacement'])
        content = content.replace(original, replacement)
        value = {}
        value['type'] = 'text'
        value['numeric'] = False
        value['content'] = content
        self.putSymbolValue(templateRecord, value)
        return self.nextPC()

    def k_return(self, command):
        self.add(command)
        return True

    def r_return(self, command):
        return self.stack.pop()

    def k_script(self, command):
        self.program.name = self.nextToken()
        return True

    def k_set(self, command):
        if self.nextIsSymbol():
            target = self.getSymbolRecord()
            if target['valueHolder']:
                command['type'] = 'set'
                command['target'] = target['name']
                self.add(command)
                return True

        token = self.getToken()
        if token == 'the':
            token = self.nextToken()
        if token == 'elements':
            self.nextToken()
            if self.peek() == 'of':
                self.nextToken()
            if self.nextIsSymbol():
                command['type'] = 'elements'
                command['name'] = self.getToken()
                if self.peek() == 'to':
                    self.nextToken()
                command['elements'] = self.nextValue()
                self.add(command)
                return True

        if token == 'property':
            command['type'] = 'property'
            command['name'] = self.nextValue()
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    command['target'] = self.getSymbolRecord()['name']
                    if self.nextIs('to'):
                        command['value'] = self.nextValue()
                        self.add(command)
                        return True

        if token == 'element':
            command['type'] = 'element'
            command['index'] = self.nextValue()
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    command['target'] = self.getSymbolRecord()['name']
                    if self.nextIs('to'):
                        command['value'] = self.nextValue()
                        self.add(command)
                        return True

        return False

    def r_set(self, command):
        cmdType = command['type']
        if cmdType == 'set':
            target = self.getVariable(command['target'])
            val = {}
            val['type'] = 'boolean'
            val['content'] = True
            self.putSymbolValue(target, val)
            return self.nextPC()

        if cmdType == 'elements':
            symbolRecord = self.getVariable(command['name'])
            elements = self.getRuntimeValue(command['elements'])
            symbolRecord['elements'] = elements
            symbolRecord['value'] = [None] * elements
            return self.nextPC()

        if cmdType == 'property':
            value = self.getRuntimeValue(command['value'])
            name = self.getRuntimeValue(command['name'])
            target = self.getVariable(command['target'])
            val = self.getSymbolValue(target)
            content = val['content']
            if content == '':
                content = {}
            content[name] = value
            val['content'] = content
            self.putSymbolValue(target, val)
            return self.nextPC()

        if cmdType == 'element':
            value = self.getRuntimeValue(command['value'])
            index = self.getRuntimeValue(command['index'])
            target = self.getVariable(command['target'])
            val = self.getSymbolValue(target)
            content = val['content']
            if content == '':
                content = []
            # else:
            # 	content = json.loads(content)
            content[index] = value
            val['content'] = content
            self.putSymbolValue(target, val)
            return self.nextPC()

    def k_stop(self, command):
        self.add(command)
        return True

    def r_stop(self, command):
        return 0

    def k_take(self, command):
        # Get the (first) value
        command['value1'] = self.nextValue()
        if self.nextToken() == 'from':
            if self.nextIsSymbol():
                symbolRecord = self.getSymbolRecord()
                if symbolRecord['valueHolder']:
                    if self.peek() == 'giving':
                        # This variable must be treated as a second value
                        command['value2'] = self.getValue()
                        self.nextToken()
                        command['target'] = self.nextToken()
                        self.add(command)
                        return True
                    else:
                        # Here the variable is the target
                        command['target'] = self.getToken()
                        self.add(command)
                        return True
                self.warning(f'core.take: Expected value holder')
            else:
                # Here we have 2 values so 'giving' must come next
                command['value2'] = self.getValue()
                if self.nextToken() == 'giving':
                    command['target'] = self.nextToken()
                    self.add(command)
                    return True
                self.warning(f'core.take: Expected "giving"')
        return False

    def r_take(self, command):
        value1 = command['value1']
        try:
            value2 = command['value2']
        except:
            value2 = None
        target = self.getVariable(command['target'])
        if not target['valueHolder']:
            self.variableDoesNotHoldAValueError(target['name'])
            return None
        value = self.getSymbolValue(target)
        if value == None:
            value = {}
            value['type'] = 'int'
        if value2:
            v1 = int(self.getRuntimeValue(value1))
            v2 = int(self.getRuntimeValue(value2))
            value['content'] = v2-v1
        else:
#            if value['type'] != 'int' and value['content'] != None:
#                self.nonNumericValueError()
#                return None
            v = int(self.getRuntimeValue(value))
            v1 = int(self.getRuntimeValue(value1))
            value['content'] = v-v1
        self.putSymbolValue(target, value)
        return self.nextPC()

    def k_toggle(self, command):
        if self.nextIsSymbol():
            target = self.getSymbolRecord()
            if target['valueHolder']:
                command['target'] = target['name']
                self.add(command)
                return True
        return False

    def r_toggle(self, command):
        target = self.getVariable(command['target'])
        value = self.getSymbolValue(target)
        val = {}
        val['type'] = 'boolean'
        val['content'] = not value['content']
        self.putSymbolValue(target, val)
        self.add(command)
        return self.nextPC()

    def k_variable(self, command):
        return self.compileVariable(command, True)

    def r_variable(self, command):
        return self.nextPC()

    def k_wait(self, command):
        command['value'] = self.nextValue()
        multipliers = {}
        multipliers['milli'] = 1
        multipliers['millis'] = 1
        multipliers['tick'] = 10
        multipliers['ticks'] = 10
        multipliers['second'] = 1000
        multipliers['seconds'] = 1000
        multipliers['minute'] = 60000
        multipliers['minutes7'] = 60000
        command['multiplier'] = multipliers['second']
        token = self.peek()
        if token in multipliers:
            self.nextToken()
            command['multiplier'] = multipliers[token]
        self.add(command)
        return True

    def r_wait(self, command):
        value = self.getRuntimeValue(command['value']) * command['multiplier']
        next = self.nextPC()
        threading.Timer(value/1000.0, lambda: (self.run(next))).start()
        return 0

    def k_while(self, command):
        code = self.nextCondition()
        if code == None:
            return None
        # token = self.getToken()
        command['condition'] = code
        test = self.getPC()
        self.addCommand(command)
        # Set up a goto for when the test fails
        fail = self.getPC()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = 0
        cmd['debug'] = False
        self.addCommand(cmd)
        # Do the body of the while
        self.nextToken()
        if self.compileOne() == False:
            return False
        # Repeat the test
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = test
        cmd['debug'] = False
        self.addCommand(cmd)
        # Fixup the 'goto' on completion
        self.getCommandAt(fail)['goto'] = self.getPC()
        return True

    def r_while(self, command):
        test = self.program.condition.testCondition(command['condition'])
        if test:
            self.program.pc += 2
        else:
            self.program.pc += 1
        return self.program.pc

    def k_write(self, command):
        if self.peek() == 'line':
            self.nextToken()
            command['line'] = True
        else:
            command['line'] = False
        command['value'] = self.nextValue()
        if self.peek() == 'to':
            self.nextToken()
            if self.nextIsSymbol():
                fileRecord = self.getSymbolRecord()
                if fileRecord['keyword'] == 'file':
                    command['file'] = fileRecord['name']
                    self.add(command)
                    return True
        return False

    def r_write(self, command):
        value = self.getRuntimeValue(command['value'])
        fileRecord = self.getVariable(command['file'])
        file = fileRecord['file']
        if file.mode in ['w', 'w+', 'a+']:
            file.write(value)
            if command['line']:
                file.write('\n')
        return self.nextPC()

    #############################################################################
    # Support functions

    def incdec(self, command, mode):
        symbolRecord = self.getVariable(command['target'])
        if not symbolRecord['valueHolder']:
            FatalError(self.program.compiler, f'{symbolRecord["name"]} does not hold a value')
            return None
        value = self.getSymbolValue(symbolRecord)
        if mode == '+':
            value['content'] += 1
        else:
            value['content'] -= 1
        self.putSymbolValue(symbolRecord, value)
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = {}
        value['domain'] = 'core'
        token = self.getToken()
        if self.isSymbol():
            value['name'] = token
            symbolRecord = self.getSymbolRecord()
            keyword = symbolRecord['keyword']
            if keyword == 'module':
                value['type'] = 'module'
                return value

            if keyword in ['variable', 'dictionary']:
                value['type'] = 'symbol'
                return value
            return None

        value['type'] = token

        if token == 'random':
            self.nextToken()
            value['range'] = self.getValue()
            return value

        if token in ['cos', 'sin', 'tan']:
            value['angle'] = self.nextValue()
            if self.nextToken() == 'radius':
                value['radius'] = self.nextValue()
                return value
            return None

        if token in ['now', 'today', 'newline', 'break', 'empty']:
            return value

        if token in ['date', 'encode', 'decode', 'stringify', 'json', 'lowercase', 'hash', 'float', 'integer']:
            value['content'] = self.nextValue()
            return value

        if (token in ['datime', 'datetime']):
            value['type'] = 'datime'
            value['timestamp'] = self.nextValue()
            if self.peek() == 'format':
                self.nextToken()
                value['format'] = self.nextValue()
            else:
                value['format'] = None
            return value

        if token == 'element':
            value['index'] = self.nextValue()
            if self.nextToken() == 'of':
                if self.nextIsSymbol():
                    symbolRecord = self.getSymbolRecord()
                    if symbolRecord['keyword'] == 'variable':
                        value['target'] = symbolRecord['name']
                        return value
            return None

        if token == 'property':
            value['name'] = self.nextValue()
            if self.nextToken() == 'of':
                if self.nextIsSymbol():
                    symbolRecord = self.getSymbolRecord()
                    if symbolRecord['keyword'] == 'variable':
                        value['target'] = symbolRecord['name']
                        return value
            return None

        if token == 'arg':
            value['content'] = self.nextValue()
            if self.getToken() == 'of':
                if self.nextIsSymbol():
                    symbolRecord = self.getSymbolRecord()
                    if symbolRecord['keyword'] == 'variable':
                        value['target'] = symbolRecord['name']
                        return value
            return None

        if token == 'trim':
            self.nextToken()
            value['content'] = self.getValue()
            return value

        if self.getToken() == 'the':
            self.nextToken()

        token = self.getToken()
        value['type'] = token

        if token == 'elements':
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    value['name'] = self.getToken()
                    return value
            return None

        if token == 'count':
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    value['name'] = self.getToken()
                    return value
            return None

        if token == 'index':
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    if self.peek() == 'in':
                        value['type'] = 'indexOf'
                        if self.nextIsSymbol():
                            value['target'] = self.getSymbolRecord()['name']
                            return value
                    else:
                        value['name'] = self.getToken()
                        return value
                else:
                    value['value1'] = self.getValue()
                    if self.nextIs('in'):
                        value['type'] = 'indexOf'
                        if self.nextIsSymbol():
                            value['target'] = self.getSymbolRecord()['name']
                            return value
            return None

        if token == 'value':
            value['type'] = 'valueOf'
            if self.nextIs('of'):
                value['content'] = self.nextValue()
                return value
            return None

        if token == 'length':
            value['type'] = 'lengthOf'
            if self.nextIs('of'):
                value['content'] = self.nextValue()
                return value
            return None

        if token in ['left', 'right']:
            value['count'] = self.nextValue()
            if self.nextToken() == 'of':
                value['content'] = self.nextValue()
                return value
            return None

        if token == 'from':
            value['start'] = self.nextValue()
            if self.peek() == 'to':
                self.nextToken()
                value['to'] = self.nextValue()
            else:
                value['to'] = None
            if self.nextToken() == 'of':
                value['content'] = self.nextValue()
                return value

        if token == 'position':
            if self.nextIs('of'):
                value['last'] = False
                if self.nextIs('the'):
                    if self.nextIs('last'):
                        self.nextToken()
                        value['last'] = True
                value['needle'] = self.getValue()
                if self.nextToken() == 'in':
                    value['haystack'] = self.nextValue()
                    return value

        if token in ['message', 'error']:
            self.nextToken()
            return value

        if token == 'timestamp':
            value['format'] = None
            if self.peek() == 'of':
                self.nextToken()
                value['datime'] = self.nextValue()
                if self.peek() == 'format':
                    self.nextToken()
                    value['format'] = self.nextValue()
            return value

        if token == 'files':
            if self.nextIs('of'):
                value['target'] = self.nextValue()
                return value
            return None


        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        if self.peek() == 'modulo':
            self.nextToken()
            mv = {}
            mv['domain'] = 'core'
            mv['type'] = 'modulo'
            mv['content'] = value
            mv['modval'] = self.nextValue()
            value = mv

        return value

    #############################################################################
    # Value handlers

    def v_boolean(self, v):
        value = {}
        value['type'] = 'boolean'
        value['content'] = v['content']
        return value

    def v_cos(self, v):
        angle = self.getRuntimeValue(v['angle'])
        radius = self.getRuntimeValue(v['radius'])
        value = {}
        value['type'] = 'int'
        value['content'] = round(math.cos(angle * 0.01745329) * radius)
        return value

    def v_datime(self, v):
        ts = self.getRuntimeValue(v['timestamp'])
        fmt = v['format']
        if fmt == None:
            fmt = '%b %d %Y %H:%M:%S'
        else:
            fmt = self.getRuntimeValue(fmt)
        value = {}
        value['type'] = 'text'
        value['content'] = datetime.fromtimestamp(ts/1000).strftime(fmt)
        return value

    def v_decode(self, v):
        value = {}
        value['type'] = 'text'
        value['content'] = self.program.decode(v['content'])
        return value

    def v_element(self, v):
        index = self.getRuntimeValue(v['index'])
        target = self.getVariable(v['target'])
        val = self.getSymbolValue(target)
        content = val['content']
        value = {}
        value['type'] = 'int' if isinstance(content, int) else 'text'
        value['content'] = content[index]
        return value

    def v_elements(self, v):
        value = {}
        value['type'] = 'int'
        value['content'] = self.getVariable(v['name'])['elements']
        return value

    def v_count(self, v):
        variable = self.getVariable(v['name'])
        content = variable['value'][variable['index']]['content']
        value = {}
        value['type'] = 'int'
        value['content'] = len(content)
        return value

    def v_empty(self, v):
        value = {}
        value['type'] = 'text'
        value['content'] = ''
        return value

    def v_encode(self, v):
        value = {}
        value['type'] = 'text'
        value['content'] = self.program.encode(v['content'])
        return value

    def v_stringify(self, v):
        item = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'text'
        value['content'] = json.dumps(item)
        return value

    def v_json(self, v):
        item = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'object'
        value['content'] = json.loads(item)
        return value

    def v_from(self, v):
        content = self.getRuntimeValue(v['content'])
        start = self.getRuntimeValue(v['start'])
        to = v['to']
        if not to == None:
            to = self.getRuntimeValue(to)
        value = {}
        value['type'] = 'text'
        if to == None:
            value['content'] = content[start:]
        else:
            value['content'] = content[start:to]
        return value

    def v_hash(self, v):
        hashval = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'text'
        value['content'] = hashlib.sha256(hashval.encode('utf-8')).hexdigest()
        return value

    def v_float(self, v):
        val = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'float'
        value['content'] = float(val)
        return value

    def v_index(self, v):
        value = {}
        value['type'] = 'int'
        value['content'] = self.getVariable(v['name'])['index']
        return value

    def v_indexOf(self, v):
        value1 = v['value1']
        target = self.getVariable(v['target'])
        try:
            index = target['value'].index(value1)
        except:
            index = -1
        value = {}
        value['type'] = 'int'
        value['content'] = index
        return value

    def v_integer(self, v):
        val = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'int'
        value['content'] = int(val)
        return value

    def v_left(self, v):
        content = self.getRuntimeValue(v['content'])
        count = self.getRuntimeValue(v['count'])
        value = {}
        value['type'] = 'text'
        value['content'] = content[0:count]
        return value

    def v_lengthOf(self, v):
        content = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'int'
        value['content'] = len(content)
        return value

    def v_lowercase(self, v):
        value = {}
        value['type'] = 'text'
        value['content'] = v['content']['content'].lower()
        return value

    def v_modulo(self, v):
        val = self.getRuntimeValue(v['content'])
        modval = self.getRuntimeValue(v['modval'])
        value = {}
        value['type'] = 'int'
        value['content'] = val % modval
        return value

    def v_newline(self, v):
        value = {}
        value['type'] = 'text'
        value['content'] = '\n'
        return value

    def v_now(self, v):
        value = {}
        value['type'] = 'int'
        value['content'] = getTimestamp(time.time())
        return value

    def v_position(self, v):
        needle = self.getRuntimeValue(v['needle'])
        haystack = self.getRuntimeValue(v['haystack'])
        last = v['last']
        value = {}
        value['type'] = 'int'
        value['content'] = haystack.rfind(needle) if last else haystack.find(needle)
        return value

    def v_property(self, v):
        name = self.getRuntimeValue(v['name'])
        target = self.getVariable(v['target'])
        target = self.getSymbolValue(target)
        content = target['content']
        if content == '':
            content = ''
            content['name'] = '(anon)'
        value = {}
        value['type'] = 'text'
        if content.get(name):
            value['content'] = content[name]
        else:
            value['content'] = ''
        return value

    def v_random(self, v):
        range = self.getRuntimeValue(v['range'])
        value = {}
        value['type'] = 'int'
        value['content'] = randrange(range)
        return value

    def v_right(self, v):
        content = self.getRuntimeValue(v['content'])
        count = self.getRuntimeValue(v['count'])
        value = {}
        value['type'] = 'text'
        value['content'] = content[-count:]
        return value

    def v_sin(self, v):
        angle = self.getRuntimeValue(v['angle'])
        radius = self.getRuntimeValue(v['radius'])
        value = {}
        value['type'] = 'int'
        value['content'] = round(math.sin(angle * 0.01745329) * radius)
        return value

    def v_tan(self, v):
        angle = self.getRuntimeValue(v['angle'])
        radius = self.getRuntimeValue(v['radius'])
        value = {}
        value['type'] = 'int'
        value['content'] = round(math.tan(angle * 0.01745329) * radius)
        return value

    def v_timestamp(self, v):
        value = {}
        value['type'] = 'int'
        fmt = v['format']
        if fmt == None:
            value['content'] = int(time.time())
        else:
            fmt = self.getRuntimeValue(fmt)
            dt = self.getRuntimeValue(v['datime'])
            spec = datetime.strptime(dt, fmt)
            t = datetime.now().replace(hour=spec.hour, minute=spec.minute, second=spec.second, microsecond=0)
            value['content'] = int(t.timestamp())
        return value

    def v_today(self, v):
        value = {}
        value['type'] = 'int'
        value['content'] = int(datetime.combine(datetime.now().date(),datetime.min.time()).timestamp())*1000
        return value

    def v_symbol(self, symbolRecord):
        result = {}
        if symbolRecord['keyword'] == 'variable':
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

    def v_valueOf(self, v):
        v = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'int'
        value['content'] = int(v)
        return value

    def v_files(self, v):
        v = self.getRuntimeValue(v['target'])
        value = {}
        value['type'] = 'text'
        value['content'] = os.listdir(v)
        return value

    def v_trim(self, v):
        v = self.getRuntimeValue(v['content'])
        value = {}
        value['type'] = 'text'
        value['content'] = v.strip()
        return value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = {}
        if self.getToken() == 'not':
            condition['type'] = 'not'
            condition['value'] = self.nextValue()
            return condition
        if self.getToken() == 'file':
            path = self.nextValue()
            if self.peek() == 'exists':
                condition['type'] = 'exists'
                condition['path'] = path
                self.nextToken()
                return condition
            return None
        value = self.getValue()
        if value == None:
            return None
        condition['value1'] = value
        token = self.peek()
        condition['type'] = token
        if token == 'includes':
            condition['value2'] = self.nextValue()
            return condition
        if token == 'is':
            token = self.nextToken()
            if self.peek() == 'not':
                self.nextToken()
                condition['negate'] = True
            else:
                condition['negate'] = False
            token = self.nextToken()
            condition['type'] = token
            if token in ['numeric', 'even', 'odd', 'boolean', 'empty']:
                return condition
            if token in ['greater', 'less']:
                if self.nextToken() == 'than':
                    condition['value2'] = self.nextValue()
                    return condition
            condition['type'] = 'is'
            condition['value2'] = self.getValue()
            return condition
        if condition['value1']:
            # It's a boolean if
            condition['type'] = 'boolean'
            return condition

        self.warning(f'I can\'t get a conditional:')
        return None

    def isNegate(self):
        token = self.getToken()
        if token == 'not':
            self.nextToken()
            return True
        return False

    #############################################################################
    # Condition handlers

    def c_boolean(self, condition):
        return type(self.getRuntimeValue(condition['value1'])) == bool

    def c_numeric(self, condition):
        return isinstance(self.getRuntimeValue(condition['value1']), int)

    def c_not(self, condition):
        return not self.getRuntimeValue(condition['value1'])

    def c_even(self, condition):
        return self.getRuntimeValue(condition['value1']) % 2 == 0

    def c_odd(self, condition):
        return self.getRuntimeValue(condition['value1']) % 2 == 1

    def c_is(self, condition):
        comparison = self.program.compare(condition['value1'], condition['value2'])
        return comparison != 0 if condition['negate'] else comparison == 0

    def c_greater(self, condition):
        comparison = self.program.compare(condition['value1'], condition['value2'])
        return comparison <= 0 if condition['negate'] else comparison > 0

    def c_less(self, condition):
        comparison = self.program.compare(condition['value1'], condition['value2'])
        return comparison >= 0 if condition['negate'] else comparison < 0

    def c_includes(self, condition):
        value1 = self.getRuntimeValue(condition['value1'])
        value2 = self.getRuntimeValue(condition['value1'])
        return value1 in value2

    def c_empty(self, condition):
        value = self.getRuntimeValue(condition['value1'])
        comparison = len(value) == 0
        return not comparison if condition['negate'] else comparison

    def c_exists(self, condition):
        path = self.getRuntimeValue(condition['path'])
        return os.path.exists(path)

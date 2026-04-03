import json, math, hashlib, threading, os, subprocess, time
import base64, binascii, random, requests, paramiko, uuid
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from .ec_classes import (
    FatalError,
    RuntimeWarning,
    RuntimeError,
    RuntimeAssertionError,
    NoValueError,
    NoValueRuntimeError,
    ECObject,
    ECVariable,
    ECDictionary,
    ECList,
    ECQueue,
    ECFile,
    ECStack,
    ECSSH,
    ECValue,
    ECModule
)

from .ec_handler import Handler

class Core(Handler):

    def __init__(self, compiler):
        super().__init__(compiler)
        self.encoding = 'utf-8'

    def getName(self):
        return 'core'
    
    def noSymbolWarning(self):
        self.warning(f'Symbol "{self.getToken()}" not found')

    def resolveLocalPath(self, raw_path):
        path = Path(raw_path).expanduser()
        if not path.is_absolute():
            script_path = Path(self.program.scriptName).expanduser()
            if not script_path.is_absolute():
                script_path = (Path.cwd() / script_path).resolve()
            path = script_path.parent / path
        return path.resolve()
    
    def processOr(self, command, orHere):
        self.add(command)
        if self.peek() == 'or':
            self.nextToken()
            self.nextToken()
            # Add a 'goto' to skip the 'or'
            cmd = {}
            cmd['lino'] = command['lino']
            cmd['domain'] = 'core'
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            skip = self.getCodeSize()
            self.add(cmd)
            # Process the 'or'
            self.getCommandAt(orHere)['or'] = self.getCodeSize()
            self.compileOne()
            # Fixup the skip
            self.getCommandAt(skip)['goto'] = self.getCodeSize()

    #############################################################################
    # Keyword handlers

    # Arithmetic add
    # add {value} to {variable}
    # add {value1} to {value2} giving {variable}
    def k_add(self, command):
        # Get the (first) value
        command['value1'] = self.nextValue()
        if command['value1'] == None: return False
        self.skip('to')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if not isinstance(self.getObject(record), ECVariable): return False
            # If 'giving' comes next, this variable is the second value
            if self.peek() == 'giving':
                v2 = ECValue(type='symbol', name=record['name'])
                command['value2'] = v2
                self.nextToken()
                # Now get the target variable
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, ECVariable)
                    command['target'] = record['name']
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
            else:
                # Here the variable is the target
                command['target'] = record['name']
                if self.getObject(record).isMutable():
                    orPC = self.getCodeSize()
                    self.processOr(command, orPC)
                    return True
        else:
            # Here we have 2 values so 'giving' must come next
            command['value2'] = self.getValue()
            if self.nextToken() == 'giving':
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, ECVariable)
                    command['target'] = record['name']
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
            # raise FatalError(self.compiler, 'Cannot add values: target variable expected')
        return False

    def r_add(self, command):
        try:
            value1 = self.textify(command['value1'])
            value2 = self.textify(command['value2']) if 'value2' in command else None
            target = self.getVariable(command['target'])
            if value2 != None:
                targetValue = ECValue(type=int, content=int(value1) + int(value2))
            else:
                targetValue = self.getSymbolValue(target)
                targetValue.setContent(int(targetValue.getContent()) + int(value1))
            self.putSymbolValue(target, targetValue)
            return self.nextPC()
        except Exception as e:
            msg = f'Arithmetic error in add: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Append a value to a list or a queue
    # append {value} to {list/queue}
    def k_append(self, command):
        command['value'] = self.nextValue()
        if self.nextIs('to'):
            if self.peek() == 'json':
                self.nextToken()
                if self.nextIs('file'):
                    command['file'] = self.nextValue()
                    command['jsonFile'] = True
                    command['or'] = None
                    save = self.getCodeSize()
                    self.processOr(command, save)
                    return True
                return False
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.program.checkObjectType(self.getObject(record), (ECList, ECQueue))
                command['target'] = record['name']
                self.add(command)
                return True
        return False

    def r_append(self, command):
        if command.get('jsonFile'):
            value = self.textify(command['value'])
            filename = self.textify(command['file'])
            path = self.resolveLocalPath(filename)
            try:
                if isinstance(value, str) and value.startswith(('{', '[')):
                    value = json.loads(value)
            except:
                pass
            try:
                if os.path.exists(path):
                    with open(path, 'r') as f:
                        array = json.loads(f.read())
                else:
                    array = []
                if not isinstance(array, list):
                    raise ValueError('File does not contain a JSON array')
                array.append(value)
                with open(path, 'w') as f:
                    f.write(json.dumps(array, indent=2))
            except Exception as e:
                errorReason = f'Unable to append to JSON file {filename}: {str(e)}'
                self.program.errorMessage = errorReason
                if command['or'] != None:
                    print(f'Exception "{errorReason}": Running the "or" clause')
                    return command['or']
                else:
                    RuntimeError(self.program, f'Error: {errorReason}')
            return self.nextPC()
        value = self.textify(command['value'])
        target = self.getObject(self.getVariable(command['target']))
        target.append(value)
        return self.nextPC()

    #assert {condition} [with {message}]
    def k_assert(self, command):
        command['test'] = self.nextCondition()
        if self.peek() == 'with':
            self.nextToken()
            command['with'] = self.nextValue()
        else:
            command['with'] = None
        self.add(command)
        return True

    def r_assert(self, command):
        test = self.program.condition.testCondition(command['test'])
        if test:
            return self.nextPC()
        RuntimeAssertionError(self.program, self.textify(command['with']))

    # Begin a block
    def k_begin(self, command):
        if self.nextToken() == 'end':
            cmd = {}
            cmd['domain'] = 'core'
            cmd['keyword'] = 'end'
            cmd['debug'] = True
            cmd['lino'] = command['lino']
            self.add(cmd)
            return self.nextPC()
        else:
            return self.compileFromHere(['end'])

    # clear {variable}
    # clear entry {name} of {dictionary}
    # clear item {index} of {list}
    def k_clear(self, command):
        token = self.nextToken()
        if token == 'breakpoint':
            command['breakpoint'] = True
            self.add(command)
            return True
        elif token == 'entry':
            command['key'] = self.nextValue()
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(self.getObject(record), ECDictionary)
                command['target'] = record['name']
                self.add(command)
                return True
        elif token == 'item':
            command['index'] = self.nextValue()
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(self.getObject(record), ECList)
                command['target'] = record['name']
                self.add(command)
                return True
        elif self.isSymbol():
            record = self.getSymbolRecord()
            command['target'] = record['name']
            object = self.getObject(record)
            if isinstance(object, ECSSH):
                self.add(command)
                return True
            if isinstance(object, ECVariable):
                self.add(command)
                return True
        return False

    def r_clear(self, command):
        if 'breakpoint' in command:
            self.program.breakpoint = False
        elif 'key' in command:
            key = self.textify(command['key'])
            record = self.getVariable(command['target'])
            self.getObject(record).setEntry(key, ECValue(type=bool, content=False))
        elif 'index' in command:
            index = self.textify(command['index'])
            record = self.getVariable(command['target'])
            self.getObject(record).setItem(index, ECValue(type=bool, content=False))
        else:
            target = self.getVariable(command['target'])
            if target['keyword'] == 'ssh':
                target['ssh'] = None
            else:
                self.putSymbolValue(target, ECValue(type=bool, content=False))
        return self.nextPC()

    # Close a file
    # close {file}
    def k_close(self, command):
        if self.nextIsSymbol():
            fileRecord = self.getSymbolRecord()
            if isinstance(self.getObject(fileRecord), ECFile):
                command['file'] = fileRecord['name']
                self.add(command)
                return True
        return False

    def r_close(self, command):
        fileRecord = self.getVariable(command['file'])
        fileRecord['file'].close()
        return self.nextPC()

    # copy {variable} to {variable}
    # copy {dictionary} to {dictionary}
    # copy {list} to {list}
    def k_copy(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            sourceObject = self.getObject(record)
            if self.isObjectType(sourceObject, (ECVariable, ECDictionary, ECList)):
                command['source'] = record['name']
                self.skip('to')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    targetObject = self.getObject(record)
                    # Check that the types match
                    if type(sourceObject) != type(targetObject):
                        raise FatalError(self.compiler, 'Cannot copy - type mismatch')
                    command['target'] = record['name']
                    self.add(command)
                    return True
        return False

    def r_copy(self, command):
        sourceRecord = self.getVariable(command['source'])
        targetRecord = self.getVariable(command['target'])
        # Copy the value (type already checked at compile time)
        self.putSymbolValue(targetRecord, self.textify(sourceRecord))
        return self.nextPC()

    # Create directory
    # create directory {name}
    def k_create(self, command):
        if self.nextIs('directory'):
            command['item'] = 'directory'
            command['path'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_create(self, command):
        if command['item'] == 'directory':
            path = self.textify(command['path'])
            local_path = self.resolveLocalPath(path)
            if not os.path.exists(local_path):
                os.makedirs(local_path)
        return self.nextPC()

    # Debug the script
    def k_debug(self, command):
        token = self.peek()
        if token == 'compile':
            self.compiler.debugCompile = True
            self.nextToken()
            return True
        elif token in ['step', 'stop', 'skip', 'breakpoint', 'program', 'custom']:
            command['mode'] = token
            self.nextToken()
        elif token == 'stack':
            command['mode'] = self.nextToken()
            if (self.nextIsSymbol()):
                command['stack'] = self.getToken()
                if self.peek() == 'as':
                    self.nextToken()
                    command['as'] = self.nextValue()
                else:
                    command['as'] = 'Stack'
            else:
                return False
        else:
            command['mode'] = None
        self.add(command)
        return True

    def r_debug(self, command):
        if command['mode'] == 'compile':
            self.program.debugStep = True
        elif command['mode'] == 'step':
            self.program.debugStep = True
        elif command['mode'] == 'stop':
            self.program.debugStep = False
        elif command['mode'] == 'skip':
            self.program.debugSkip = True
        elif command['mode'] == 'breakpoint':
            self.program.breakpoint = True
        elif command['mode'] == 'program':
            for item in self.code:
                print(json.dumps(item, indent = 2))
        elif command['mode'] == 'stack':
            stackRecord = self.getVariable(command['stack'])
            value = self.getSymbolValue(stackRecord)
            print(f'{self.textify(command["as"])}:',json.dumps(self.getSymbolValue(stackRecord), indent = 2))
        elif command['mode'] == 'custom':
            # Custom debugging code goes in here
            record = self.getVariable('Script')
            print('(Debug) Script:',record)
            value = self.textify(record)
            print('(Debug) Value:',value)
            pass
        return self.nextPC()

    # Decrement a variable
    # decrement {variable}
    def k_decrement(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(self.getObject(record), ECVariable)
            command['target'] = record['name']
            self.add(command)
            return True
        return False

    def r_decrement(self, command):
        return self.incdec(command, '-')

    # Delete a file or a property
    # delete file {filename}
    # delete entry/item/property/element {name/number} of {variable}
    def k_delete(self, command):
        token = self.nextToken( )
        command['type'] = token
        if token == 'file':
            command['filename'] = self.nextValue()
            self.add(command)
            return True
        elif token in ('entry', 'item', 'property', 'element'):
            command['key'] = self.nextValue()
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                command['variable'] = record['name']
                if token == 'entry':
                    self.checkObjectType(self.getObject(record), ECDictionary)
                elif token == 'item':
                    self.checkObjectType(self.getObject(record), ECList)
                self.add(command)
                return True
            self.warning(f'Core.delete: variable expected; got {self.getToken()}')
        else:
            self.warning(f'Core.delete: "file", "entry", "item", "property" or "element" expected; got {token}')
        return False

    def r_delete(self, command):
        type = command['type']
        if type == 'file':
            filename = self.textify(command['filename'])
            if filename != None:
                path = self.resolveLocalPath(filename)
                if os.path.isfile(path): os.remove(path)
        elif type == 'entry':
            key = self.textify(command['key'])
            record = self.getVariable(command['variable'])
            self.getObject(record).deleteEntry(key)
        elif type == 'item':
            key = self.textify(command['key'])
            record = self.getVariable(command['variable'])
            self.getObject(record).deleteItem(key)
        elif type == 'property':
            raise NotImplementedError('Core.delete property not implemented yet')
            key = self.textify(command['key'])
            record = self.getVariable(command['var'])
            value = self.getSymbolValue(record)
            content = value.getContent()
            content.pop(key, None)
            value.setContent(content)
            self.putSymbolValue(record, value)
        elif type == 'element':
            key = self.textify(command['key'])
            record = self.getVariable(command['variable'])
            value = self.getSymbolValue(record)
            content = value.getContent()
            if isinstance(key, int):
                if key >= 0 and key < len(content): del(content[key])
            elif isinstance(key, str):
                if key in content: content.remove(key)
            else: RuntimeError(self.program, f'Index {key} out of range')
            value.setContent(content)
            self.putSymbolValue(record, value)
        return self.nextPC()

    # Declare a dictionary variable
    def k_dictionary(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECDictionary')

    def r_dictionary(self, command):
        return self.nextPC()


    # Arithmetic divide
    # divide {variable} by {value}
    # divide {value1} by {value2} giving {variable}
    def k_divide(self, command):
        # Get the (first) item. If it's a symbol, it may be the target variable
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECVariable)
            # Hold onto the variable and its value
            variable1 = record['name']
            value1 = self.getValue()
        else:
            # Here we have a value
            value1 = self.getValue()
            variable1 = None
        self.skip('by')
        command['value2'] = self.nextValue()
        # if 'giving' comes next, the target is the next value
        if self.peek() == 'giving':
            self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, ECVariable)
                command['target'] = record['name']
                command['value1'] = value1
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
        else:
            # Here the first variable is the target
            if variable1 != None:
                command['target'] = variable1
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
        return False

    def r_divide(self, command):
        try:
            value1 = self.textify(command['value1']) if 'value1' in command else None
            value2 = self.textify(command['value2'])
            target = self.getVariable(command['target'])
            self.checkObjectType(target, ECVariable)
            if value1 != None:
                targetValue = ECValue(type=int, content=int(value1) // int(value2))
            else:
                targetValue = self.getSymbolValue(target)
                targetValue.setContent(int(targetValue.getContent()) // int(value2))
            self.putSymbolValue(target, targetValue)
            return self.nextPC()
        except Exception as e:
            msg = f'Arithmetic error in divide: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # download [binary] {url} to {path}
    def k_download(self, command):
        if self.nextIs('binary'):
            command['binary'] = True
            self.nextToken()
        else: command['binary'] = False
        command['url'] = self.getValue()
        self.skip('to')
        command['path'] = self.nextValue()
        self.add(command)
        return True
    
    def r_download(self, command):
        binary = command['binary']
        url = self.textify(command['url'])
        path = self.textify(command['path'])
        mode = 'wb' if binary else 'w'
        response = requests.get(url, stream=True)
        local_path = self.resolveLocalPath(path)
        with open(local_path, mode) as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk: f.write(chunk if binary else chunk.decode('utf-8'))
        return self.nextPC()

    # Match a begin
    def k_end(self, command):
        self.add(command)
        return True

    def r_end(self, command):
        return self.nextPC()

    # Exit the script
    def k_exit(self, command):
        self.add(command)
        return True

    def r_exit(self, command):
        if self.program.parent == None and self.program.graphics != None:
            self.program.graphics.force_exit(None)
        return -1

    # Declare a file variable
    def k_file(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECFile')

    def r_file(self, command):
        return self.nextPC()

    # Fork to a label
    # fork [to] {label}
    def k_fork(self, command):
        self.skip('to')  # Optional 'to' (core-reserved keyword, plugin-safe)
        command['fork'] = self.nextToken()
        self.add(command)
        return True

    def r_fork(self, command):
        next = self.nextPC()
        label = command['fork']
        try:
            label = self.symbols[label + ':']
        except:
            RuntimeError(self.program, f'There is no label "{label + ":"}"')
            return None
        self.run(label)
        return next

    # get {variable) from url {url} [or {command}]
    def k_get(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if isinstance(self.getObject(record), ECObject):
                command['target'] = self.getToken()
            else:
                NoValueError(self.compiler, record)
        if self.nextIs('from'):
            if self.nextIs('url'):
                url = self.nextValue()
                if url != None:
                    command['url'] = url
                    command['or'] = None
                    get = self.getCodeSize()
                    if self.peek() == 'timeout':
                        self.nextToken()
                        command['timeout'] = self.nextValue()
                    else:
                        timeout = ECValue(type = int, content = 5)
                        command['timeout'] = timeout
                    self.processOr(command, get)
                    return True
        return False

    def r_get(self, command):
        global errorCode, errorReason
        retval = ECValue(type=str)
        url = self.textify(command['url'])
        target = self.getVariable(command['target'])
        response = {}
        try:
            timeout = self.textify(command['timeout'])
            response = requests.get(url, auth = ('user', 'pass'), timeout=timeout)
            if response.status_code >= 400:
                errorCode = response.status_code
                errorReason = response.reason
                self.program.errorMessage = f'Error code {errorCode}: {errorReason}'
                if command['or'] != None:
                    return command['or']
                else:
                    RuntimeError(self.program, self.program.errorMessage)
        except Exception as e:
            errorReason = str(e)
            self.program.errorMessage = f'Error: {errorReason}'
            if command['or'] != None:
                return command['or']
            else:
                RuntimeError(self.program, self.program.errorMessage)
        retval.setContent(response.text) # type: ignore
        self.program.putSymbolValue(target, retval)
        return self.nextPC()

    # Go to a label
    # go [to] {label}
    def k_go(self, command):
        self.skip('to')  # Optional 'to' (core-reserved keyword, plugin-safe)
        return self.k_goto(command)

    def k_goto(self, command):
        command['keyword'] = 'goto'
        command['goto'] = self.nextToken()
        self.add(command)
        return True

    def r_goto(self, command):
        label = f'{command["goto"]}:'
        try:
            if self.symbols[label]:
                return self.symbols[label]
        except:
            pass
        RuntimeError(self.program, f'There is no label "{label}"')
        return None

    def r_gotoPC(self, command):
        return command['goto']

    # Call a subroutine
    # gosub [to] {label}
    def k_gosub(self, command):
        self.skip('to')  # Optional 'to' (core-reserved keyword, plugin-safe)
        command['gosub'] = self.nextToken()
        self.add(command)
        return True

    def r_gosub(self, command):
        label = command['gosub'] + ':'
        if label in self.symbols:
            address = self.symbols[label]
            self.stack.append(self.nextPC())
            return address
        RuntimeError(self.program, f'There is no label "{label}"')
        return None

    # if <condition> <action> [else <action>]
    def k_if(self, command):
        command['condition'] = self.nextCondition()
        self.add(command)
        self.nextToken()
        pcElse = self.getCodeSize()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = 0
        cmd['debug'] = False
        self.add(cmd)
        # Get the 'then' code
        self.compileOne()
        if self.peek() == 'else':
            self.nextToken()
            # Add a 'goto' to skip the 'else'
            pcNext = self.getCodeSize()
            cmd = {}
            cmd['lino'] = command['lino']
            cmd['domain'] = 'core'
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.add(cmd)
            # Fixup the link to the 'else' branch
            self.getCommandAt(pcElse)['goto'] = self.getCodeSize()
            # Process the 'else' branch
            self.nextToken()
            self.compileOne()
            # Fixup the pcNext 'goto'
            self.getCommandAt(pcNext)['goto'] = self.getCodeSize()
        else:
            # We're already at the next command
            self.getCommandAt(pcElse)['goto'] = self.getCodeSize()
        return True

    def r_if(self, command):
        test = self.program.condition.testCondition(command['condition'])
        if test:
            self.program.pc += 2
        else:
            self.program.pc += 1
        return self.program.pc

    # Import one or more variables
    def k_import(self, command):
        self.add(command)
        imports = []
        while True:
            vartype = self.nextToken()
            for domain in self.program.getDomains():
                handler = domain.keywordHandler(vartype)
                if handler != None:
                    variable = {}
                    if not handler(variable):
                        raise RuntimeError(self.program, f'Failed to handle variable type "{vartype}"')
                    imports.append(variable)
            if self.peek() != 'and':
                break
            self.nextToken()
        command['imports'] = imports
        return True

    def r_import(self, command):
        exports = self.program.exports
        imports = command['imports']
        if len(imports) < len(exports):
            RuntimeError(self.program, 'Too few imports')
        elif len(imports) > len(exports):
            RuntimeError(self.program, 'Too many imports')
        for n in range(0, len(imports)):
            exportRecord = exports[n]
            importRecord = imports[n]
            if importRecord['classname'] != exportRecord['classname']:
                raise RuntimeError(self.program, f'Import {n} does not match export (wrong type)')
            name = importRecord['name']
            importRecord.clear()
            importRecord['name'] = name
            importRecord['domain'] = exportRecord['domain']
            importRecord['keyword'] = exportRecord['keyword']
            importRecord['import'] = exportRecord
        return self.nextPC()

    # Increment a variable
    def k_increment(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(self.getObject(record), ECVariable)
            command['target'] = record['name']
            self.add(command)
            return True
        return False

    def r_increment(self, command):
        return self.incdec(command, '+')

    # Index to a specified element in a variable
    # index {variable} to {value}
    def k_index(self, command):
        # get the variable
        if self.nextIsSymbol():
            command['target'] = self.getToken()
            if self.nextToken() == 'to':
                # get the value
                command['value'] = self.nextValue()
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
        return False

    def r_index(self, command):
        try:
            value = self.textify(command['value'])
            record = self.getVariable(command['target'])
            self.getObject(record).setIndex(value)
            return self.nextPC()
        except Exception as e:
            msg = f'Index error: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Input a value from the terminal
    # input {variable} [with {prompt}]
    def k_input(self, command):
        # get the variable
        if self.nextIsSymbol():
            command['target'] = self.getToken()
            value = ECValue(type=str, content=': ')
            command['prompt'] = value
            if self.peek() == 'with':
                self.nextToken()
                command['prompt'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_input(self, command):
        record = self.getVariable(command['target'])
        prompt = self.textify(command['prompt'])
        value = ECValue(type=str, content=input(prompt))
        self.putSymbolValue(record, value)
        return self.nextPC()

    # Declare a list variable
    def k_list(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECList')

    def r_list(self, command):
        return self.nextPC()

    # 1 Load a plugin. This is done at compile time.
    # 2 Load text from a file or ssh
    def k_load(self, command):
        self.nextToken()
        if self.tokenIs('plugin'):
            clazz = self.nextToken()
            if self.nextIs('from'):
                source = self.nextToken()
                self.program.importPlugin(f'{source}:{clazz}')
                return True
        elif self.isSymbol():
            record = self.getSymbolRecord()
            if isinstance(self.getObject(record), (ECVariable, ECDictionary, ECList)):
                command['target'] = record['name']
                if self.nextIs('from'):
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if record['keyword'] == 'ssh':
                            command['ssh'] = record['name']
                            command['path'] = self.nextValue()
                        else:
                            command['file'] = self.getValue()
                    else:
                        command['file'] = self.getValue()
                    command['or'] = None
                    load = self.getCodeSize()
                    self.processOr(command, load)
                    return True
        else:
            FatalError(self.compiler, f'I don\'t understand \'{self.getToken()}\'')
        return False

    def r_load(self, command):
        errorReason = None
        target = self.getVariable(command['target'])
        if 'ssh' in command:
            ssh = self.getVariable(command['ssh'])
            path = self.textify(command['path'])
            sftp = ssh['sftp']
            # print(f'Loading from path: {Path(path).expanduser()}')
            try:
                with sftp.open(path, 'r') as remote_file: content = remote_file.read().decode()
            except:
                errorReason = f'Unable to read from {path}'
                self.program.errorMessage = errorReason
                if command['or'] != None:
                    print(f'Exception "{errorReason}": Running the "or" clause')
                    return command['or']
                else:
                    RuntimeError(self.program, f'Error: {errorReason}')
        else:
            filename = self.textify(command['file'])
            try:
                path = self.resolveLocalPath(filename)
                with open(path) as f: content = f.read()
            except:
                errorReason = f'Unable to read from {filename}'

        if errorReason:
            self.program.errorMessage = errorReason
            if command['or'] != None:
                print(f'Exception "{errorReason}": Running the "or" clause')
                return command['or']
            else:
                RuntimeError(self.program, f'Error: {errorReason}')

        value = ECValue(type=str, content=content)
        try:
            self.putSymbolValue(target, value)
        except Exception as e:
            print(f'Exception "{e}": Running the "or" clause')
            return command['or']
        return self.nextPC()

    # Lock a variable
    def k_lock(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['target'] = record['name']
            self.add(command)
            return True
        return False

    def r_lock(self, command):
        target = self.getVariable(command['target'])
        target['locked'] = True
        return self.nextPC()

    # Log a message
    def k_log(self, command):
        command['log'] = True
        command['keyword'] = 'print'
        return self.k_print(command)

    # Declare a module variable
    def k_module(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECModule')

    def r_module(self, command):
        return self.nextPC()

    # Arithmetic multiply
    # multiply {variable} by {value}
    # multiply {value1} by {value2} giving {variable}
    def k_multiply(self, command):
        # Get the (first) item. If it's a symbol, it may be the target variable
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECVariable)
            # Hold onto the variable and its value
            variable1 = record['name']
            value1 = self.getValue()
        else:
            # Here we have a value
            value1 = self.getValue()
            variable1 = None
        self.skip('by')
        command['value2'] = self.nextValue()
        # if 'giving' comes next, the target is the next value
        if self.peek() == 'giving':
            self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, ECVariable)
                command['target'] = record['name']
                command['value1'] = value1
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
        else:
            # Here the first variable is the target
            if variable1 != None:
                command['target'] = variable1
                orPC = self.getCodeSize()
                self.processOr(command, orPC)
                return True
        return False

    def r_multiply(self, command):
        try:
            value1 = self.textify(command['value1']) if 'value1' in command else None
            value2 = self.textify(command['value2'])
            target = self.getVariable(command['target'])
            self.checkObjectType(target, ECVariable)
            if value1 != None:
                targetValue = ECValue(type=int, content=int(value1) * int(value2))
            else:
                targetValue = self.getSymbolValue(target)
                targetValue.setContent(int(targetValue.getContent()) * int(value2))
            self.putSymbolValue(target, targetValue)
            return self.nextPC()
        except Exception as e:
            msg = f'Arithmetic error in multiply: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Negate a variable
    def k_negate(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record['hasValue']:
                command['target'] = self.getToken()
                self.add(command)
                return True
            self.warning(f'Core.negate: Variable {record["name"]} does not hold a value')
        return False

    def r_negate(self, command):
        record = self.getVariable(command['target'])
        if not record['hasValue']:
            NoValueRuntimeError(self.program, record)
            return None
        value = self.getSymbolValue(record)
        if value == None:
            RuntimeError(self.program, f'{record["name"]} has not been initialised')
        value.setContent(value.getContent() * -1)
        self.putSymbolValue(record, value)
        return self.nextPC()

    # on message {action}
    def k_on(self, command):
        token = self.nextToken()
        if token == 'message':
            self.nextToken()
            command['goto'] = 0
            self.add(command)
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.add(cmd)
            # Add the action and a 'stop'
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.add(cmd)
            # Fixup the link
            command['goto'] = self.getCodeSize()
            return True
        return False

    def r_on(self, command):
        self.program.onMessage(self.nextPC()+1)
        return command['goto']

    # Open a file
    # open {file} for reading/writing/appending
    def k_open(self, command):
        # open <filename> as <file-variable> for reading/writing/appending
        command['path'] = self.nextValue()
        if self.peek() == 'as':
            self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if record['keyword'] == 'file':
                    command['target'] = record['name']
                    if self.peek() == 'for':
                        self.nextToken()
                        token = self.nextToken()
                        if token == 'appending':
                            mode = 'a'
                        elif token == 'reading':
                            mode = 'r'
                        elif token == 'writing':
                            mode = 'w'
                        else:
                            FatalError(self.compiler, f'Unknown file open mode "{token}"')
                            return False
                        command['mode'] = mode
                    else:
                        command['mode'] = 'r'
                    orPC = self.getCodeSize()
                    self.processOr(command, orPC)
                    return True
                else:
                    FatalError(self.compiler, f'Variable "{record["name"]}" is not a file')
            else:
                self.warning(f'Core.open: Variable "{self.getToken()}" not declared')
        return False

    def r_open(self, command):
        record = self.getVariable(command['target'])
        path = self.textify(command['path'])
        file_path = self.resolveLocalPath(path)
        try:
            if command['mode'] == 'r' and not os.path.exists(file_path):
                raise FileNotFoundError(f"File {path} does not exist")
            record['file'] = open(file_path, command['mode'])
            return self.nextPC()
        except Exception as e:
            msg = str(e)
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Dummy command to hit a debugger breakpoint
    def k_pass(self, command):
        self.add(command)
        return True

    def r_pass(self, command):
        return self.nextPC()

    # Pop a value from a stack or a queue
    # pop {variable} from {stack/queue}
    def k_pop(self, command):
        if (self.nextIsSymbol()):
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECObject)
            command['target'] = record['name']
            if self.peek() == 'from':
                self.nextToken()
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, (ECStack, ECQueue))
                    command['from'] = record['name']
                    orPC = self.getCodeSize()
                    self.processOr(command, orPC)
                    return True
        return False

    def r_pop(self, command):
        try:
            record = self.getVariable(command['target'])
            stackRecord = self.getVariable(command['from'])
            value = stackRecord['object'].pop()
            self.putSymbolValue(record, value)
            return self.nextPC()
        except Exception as e:
            msg = f'Pop failed: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Perform an HTTP POST
    # post {value} to {url} [giving {variable}] [or {command}]
    def k_post(self, command):
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
        else:
            command['result'] = None
        command['or'] = None
        post = self.getCodeSize()
        self.processOr(command, post)
        return True

    def r_post(self, command):
        global errorCode, errorReason
        retval = ECValue(type=str, content = '')
        value = self.textify(command['value'])
        url = self.textify(command['url'])
        try:
            response = requests.post(url, value, timeout=5)
            retval.setContent(response.text) # type: ignore
            if response.status_code >= 400:
                errorCode = response.status_code
                errorReason = response.reason
                self.program.errorMessage = f'Error code {errorCode}: {errorReason}'
                if command['or'] != None:
                    print(f'Error {errorCode} {errorReason}: Running the "or" clause')
                    return command['or']
                else:
                    RuntimeError(self.program, self.program.errorMessage)
        except Exception as e:
            errorReason = str(e)
            self.program.errorMessage = f'Error: {errorReason}'
            if command['or'] != None:
                print(f'Exception "{errorReason}": Running the "or" clause')
                return command['or']
            else:
                RuntimeError(self.program, self.program.errorMessage)
        if command['result'] != None:
            result = self.getVariable(command['result'])
            self.program.putSymbolValue(result, retval)
        return self.nextPC()

    # Print a value
    def k_print(self, command):
        value = self.nextValue()
        if value != None:
            command['value'] = value
            self.add(command)
            return True
        FatalError(self.compiler, 'I can\'t print this value')
        return False

    def r_print(self, command):
        value = self.textify(command['value'])
        program = command['program']
        code = program.code[program.pc]
        lino = str(code['lino'] + 1)
#        while len(lino) < 5: lino = f' {lino}'
        if value == None: value = '<empty>'
        if 'log' in command:
            print(f'{datetime.now().time()}:{self.program.name}:{lino}->{value}')
        else:
            print(value)
        return self.nextPC()

    # push {value} to/onto {stack}
    def k_push(self, command):
        value = self.nextValue()
        command['value'] = value
        peekValue = self.peek()
        if peekValue in ['onto', 'to']:
            self.nextToken()
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                self.checkObjectType(record, (ECStack, ECQueue))
                command['to'] = record['name']
                self.add(command)
                return True
        return False

    def r_push(self, command):
        value = deepcopy(self.evaluate(command['value']))
        stackRecord = self.getVariable(command['to'])
        stackRecord['object'].push(value)
        return self.nextPC()

    # put {value} into {variable/dictionary/list}
    def k_put(self, command):
        value = self.nextValue()
        if value != None:
            command['value'] = value
            valueType = value.getType()
            if self.nextIs('into'):
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    command['target'] = record['name']
                    object = self.getObject(record)
                    self.checkObjectType(object, (ECVariable, ECDictionary, ECList))
                    if (isinstance(object, ECVariable) and not valueType in ('dict', 'list', 'json') or
                        isinstance(object, (ECDictionary, ECList))):
                        command['or'] = None
                        self.processOr(command, self.getCodeSize())
                        return True
                else:
                    FatalError(self.compiler, f'Symbol {self.getToken()} is not a variable')
        return False

    def r_put(self, command):
        value = self.evaluate(command['value'])
        record = self.getVariable(command['target'])
        self.putSymbolValue(record, value)
        return self.nextPC()

    # Declare a queue variable
    def k_queue(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECQueue')

    def r_queue(self, command):
        return self.nextPC()

    # Read from a file
    # read {variable} from {file}
    def k_read(self, command):
        if self.peek() == 'line':
            self.nextToken()
            command['line'] = True
        else:
            command['line'] = False
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(self.getObject(record), ECVariable)
            if self.peek() == 'from':
                self.nextToken()
                if self.nextIsSymbol():
                    fileRecord = self.getSymbolRecord()
                    self.checkObjectType(fileRecord['object'], ECFile)
                    command['target'] = record['name']
                    command['file'] = fileRecord['name']
                    orPC = self.getCodeSize()
                    self.processOr(command, orPC)
                    return True
            return False
        FatalError(self.compiler, f'Symbol "{self.getToken()}" has not been declared')
        return False

    def r_read(self, command):
        try:
            record = self.getVariable(command['target'])
            fileRecord = self.getVariable(command['file'])
            line = command['line']
            file = fileRecord['file']
            if file.mode == 'r':
                if line:
                    content = file.readline().split('\n')[0]
                else:
                    content = file.readline().rstrip('\n')
                value = ECValue(type=str, content=content)
                self.putSymbolValue(record, value)
            return self.nextPC()
        except Exception as e:
            msg = f'Read error: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Release the parent script
    def k_release(self, command):
        if self.nextIs('parent'):
            self.add(command)
            return True
        return False

    def r_release(self, command):
        self.program.releaseParent()
        return self.nextPC()

    # Replace a substring
    #replace {value} with {value} in {variable}
    def k_replace(self, command):
        original = self.nextValue()
        if self.peek() == 'with':
            self.nextToken()
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
        content = self.getSymbolValue(templateRecord).getContent()
        original = self.textify(command['original'])
        replacement = self.textify(command['replacement'])
        content = content.replace(original, str(replacement))
        value = ECValue(type=str, content=content)
        self.putSymbolValue(templateRecord, value)
        return self.nextPC()

    # Reset a variable
    def k_reset(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['target'] = record['name']
            self.add(command)
            return True
        return False

    def r_reset(self, command):
        record = self.getVariable(command['target'])
        self.getObject(record).reset()
        return self.nextPC()

    # Return from subroutine
    def k_return(self, command):
        next_token = self.peek()
        if next_token is not None and (
            self.compiler.hasValue(next_token) or
            next_token.startswith('`') or
            (len(next_token) > 0 and next_token[0].isdigit())
        ):
            return False
        self.add(command)
        return True

    def r_return(self, command):
        self.program.debugSkip = False
        return self.stack.pop()

    # Compile and run a script
    # run {path} [as {module}] [with {variable} [and {variable}...]]
    def k_run(self, command):
        try:
            command['path'] = self.nextValue()
        except Exception as e:
            self.warning(f'Core.run: Path expected')
            return False
        if self.nextIs('as'):
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if record['keyword'] == 'module':
                    name = record['name']
                    command['module'] = name
                else: FatalError(self.compiler, f'Symbol \'name\' is not a module')
            else: FatalError(self.compiler, 'Module name expected after \'as\'')
        else: FatalError(self.compiler, '\'as {module name}\' expected')
        exports = []
        if self.peek() == 'with':
            self.nextToken()
            while True:
                name = self.nextToken()
                record = self.getSymbolRecord()
                exports.append(name)
                if self.peek() != 'and':
                    break
                self.nextToken()
        command['exports'] = json.dumps(exports)
        self.add(command)
        return True

    def r_run(self, command):
        module = self.getVariable(command['module'])
        path = self.textify(command['path'])
        exports = json.loads(command['exports'])
        for n in range(0, len(exports)):
            exports[n] = self.getVariable(exports[n])
        module['path'] = path
        parent = ECValue()
        parent.program = self.program # type: ignore
        parent.pc = self.nextPC() # type: ignore
        parent.waiting = True # type: ignore
        program_class = self.program.__class__
        program_instance = program_class(path)
        program_instance.start(parent, module, exports)
        self.getObject(module).setValue(program_instance)
        return 0

    # Save a value to a file
    def k_save(self, command):
        command['content'] = self.nextValue()
        self.skip('to')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record['keyword'] == 'ssh':
                command['ssh'] = record['name']
                command['path'] = self.nextValue()
            else:
                command['file'] = self.getValue()
        else:
            command['file'] = self.getValue()
        command['or'] = None
        save = self.getCodeSize()
        self.processOr(command, save)
        return True

    def r_save(self, command):
        errorReason = None
        content = self.textify(command['content'])
        if 'ssh' in command:
            ssh = self.getVariable(command['ssh'])
            path = self.textify(command['path'])
            sftp = ssh['sftp']
            if path.endswith('.json'): content = json.dumps(content)
            try:
                with sftp.open(path, 'w') as remote_file: remote_file.write(content)
            except:
                errorReason = 'Unable to write to {path}'
                self.program.errorMessage = errorReason
                if command['or'] != None:
                    print(f'Exception "{errorReason}": Running the "or" clause')
                    return command['or']
                else:
                    RuntimeError(self.program, f'Error: {errorReason}')
        else:
            filename = self.textify(command['file'])
            try:
                if content == None:
                    content = ''
                elif isinstance(content, dict) or isinstance(content, list):
                    content = json.dumps(content)
                elif not isinstance(content, str):
                    content = self.textify(content)
                path = self.resolveLocalPath(filename)
                with open(path, 'w') as f: f.write(content)
            except Exception as e:
                errorReason = f'Unable to write to {filename}: {str(e)}'

        if errorReason:
            self.program.errorMessage = errorReason
            if command['or'] != None:
                print(f'Exception "{errorReason}": Running the "or" clause')
                return command['or']
            else:
                RuntimeError(self.program, f'Error: {errorReason}')
        return self.nextPC()

    # Provide a name for the script
    def k_script(self, command):
        self.program.name = self.nextToken()
        return True

    # send {message} to parent/sender/{module}
    def k_send(self, command):
        command['message'] = self.nextValue()
        command['replyVar'] = None
        if self.nextIs('to'):
            self.skip('the')
            token = self.nextToken()
            if token in ('parent', 'sender'):
                command['module'] = token
            elif self.isSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECModule):
                    command['module'] = record['name']
                else:
                    return False
            else:
                return False
            if self.peek() == 'and':
                self.nextToken()  # consume 'and'
                token = self.nextToken()
                if token != 'assign':
                    return False
                token = self.nextToken()
                if token != 'reply':
                    return False
                token = self.nextToken()
                if token != 'to':
                    return False
                if not self.nextIsSymbol():
                    return False
                record = self.getSymbolRecord()
                command['replyVar'] = record['name']
            self.add(command)
            return True
        return False

    def r_send(self, command):
        message = self.textify(command['message'])
        senderName = command['module']
        if senderName == 'parent':
            module = self.program.parent.program
            # Intercept: if the caller is awaiting a direct reply
            if hasattr(module, 'replyVar') and module.replyVar is not None:
                module.message = message
                record = module.getVariable(module.replyVar)
                module.putSymbolValue(record, ECValue(type=str, content=message))
                module.replyVar = None
                return self.nextPC()
        elif senderName == 'sender':
            module = self.program.sender
            # Intercept: if the caller is awaiting a direct reply
            if hasattr(module, 'replyVar') and module.replyVar is not None:
                module.message = message
                record = module.getVariable(module.replyVar)
                module.putSymbolValue(record, ECValue(type=str, content=message))
                module.replyVar = None
                return self.nextPC()
        else:
            record = self.getVariable(command['module'])
            object = self.getObject(record)
            value = object.getValue()
            # Handle both single Program instances and ECValue wrappers
            if isinstance(value, ECValue):
                module = value.getContent()
            else:
                module = value
        replyVar = command.get('replyVar')
        if replyVar:
            self.program.replyVar = replyVar
            # In direct-reply mode, run the target handler inline so this send blocks
            # until the child replies (which clears self.program.replyVar).
            module.sender = self.program # type: ignore[attr-defined]
            module.message = message # type: ignore[attr-defined]
            if not (hasattr(module, 'onMessagePC') and module.onMessagePC): # type: ignore[attr-defined]
                self.program.replyVar = None
                raise RuntimeError(self.program, f'Target "{senderName}" has no on message handler')
            module.flush(module.onMessagePC) # type: ignore[attr-defined]
            if self.program.replyVar is not None:
                self.program.replyVar = None
                raise RuntimeError(self.program, f'No reply received from module "{senderName}"')
            return self.nextPC()
        module.handleMessage(self.program, message) # type: ignore
        return self.nextPC()

    # Set a value
    # set {variable} [to {value}]
    # set entry {key} of {dictionary} [to {value}]
    # set item {index} of {list} [to {value}]
    # set {ssh} host {host} user {user} password {password}
    # set the items/elements in/of {variable} to {value}
    # set item/entry/property of {variable} to {value}
    # set breakpoint
    def k_set(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['target'] = record['name']
            if self.isObjectType(record, ECSSH):
                host = None
                user = None
                password = None
                while True:
                    token = self.peek()
                    if token == 'host':
                        self.nextToken()
                        host = self.nextValue()
                    elif token == 'user':
                        self.nextToken()
                        user = self.nextValue()
                    elif token == 'password':
                        self.nextToken()
                        password = self.nextValue()
                    else: break
                command['host'] = host
                command['user'] = user
                command['password'] = password
                command['type'] = 'ssh'
                self.add(command)
                return True
            elif self.isObjectType(record, (ECVariable, ECDictionary, ECList)):
                if self.peek() == 'to':
                    self.nextToken()
                    value = self.nextValue()
                    command['type'] = 'value'
                    command['value'] = value
                elif self.isObjectType(record, ECVariable):
                    command['type'] = 'boolean'
                else: return False
                self.add(command)
                return True
            return False

        token = self.getToken()
        if token == 'the':
            token = self.nextToken()
        
        command['type'] = token

        if token == 'elements':
            self.nextToken()
            if self.peek() in ('in', 'of'):
                self.nextToken()
            if self.nextIsSymbol():
                command['name'] = self.getToken()
                if self.peek() == 'to':
                    self.nextToken()
                command['elements'] = self.nextValue()
                self.add(command)
                return True

        elif token == 'encoding':
            if self.nextIs('to'):
                command['encoding'] = self.nextValue()
                self.add(command)
                return True

        elif token in ('entry', 'property'):
            command['key'] = self.nextValue()
            if command['key'] == None:
                FatalError(self.compiler, f'No valid key found after \'{token}\'')
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if token == 'entry':
                        self.checkObjectType(self.getObject(record), ECDictionary)
                    elif token == 'item':
                        self.checkObjectType(self.getObject(record), ECList)
                    command['target'] = record['name']
                    if self.peek() == 'to':
                        self.nextToken()
                        command['value'] = self.nextValue()
                        self.add(command)
                        return True
                    else: # Set True
                        command['value'] = ECValue(type=bool, content=True)
                        self.add(command)
                        return True

        elif token == 'item':
            command['index'] = self.nextValue()
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    command['target'] = self.getSymbolRecord()['name']
                    if self.nextIs('to'):
                        command['value'] = self.nextValue()
                        self.add(command)
                        return True
        
        elif token == 'path':
            command['path'] = self.nextValue()
            self.add(command)
            return True
        
        elif token == 'breakpoint':
            self.add(command)
            return True

        return False

    def r_set(self, command):
        cmdType = command['type']
        if cmdType == 'boolean':
            target = self.getVariable(command['target'])
            self.putSymbolValue(target, ECValue(type=bool, content=True))
            return self.nextPC()
        
        elif cmdType == 'value':
            value = self.evaluate(command['value'])
            target = self.getVariable(command['target'])
            self.putSymbolValue(target, value)
            return self.nextPC()

        elif cmdType == 'elements':
            record = self.getVariable(command['name'])
            elements = self.textify(command['elements'])
            object = self.getObject(record)
            self.checkObjectType(object, ECObject)
            object.setElements(elements)
            return self.nextPC()

        elif cmdType == 'entry':
            key = self.textify(command['key'])
            if 'name' in command:
                value = self.textify(self.getVariable(command['name']))
            elif 'value' in command:
                value = self.textify(command['value'])
            record = self.getVariable(command['target'])
            self.checkObjectType(self.getObject(record), ECDictionary)
            variable = self.getObject(record)
            variable.setEntry(key, value)
            return self.nextPC()

        elif cmdType == 'item':
            index = self.textify(command['index'])
            value = self.textify(command['value'])
            record = self.getVariable(command['target'])
            self.checkObjectType(self.getObject(record), ECList)
            variable = self.getObject(record)
            variable.setItem(index, value)
            return self.nextPC()

        elif cmdType == 'encoding':
            self.encoding = self.textify(command['encoding'])
            return self.nextPC()

        elif cmdType == 'path':
            path = self.textify(command['path'])
            os.chdir(path)
            return self.nextPC()

        elif cmdType == 'property':
            key = self.textify(command['key'])
            value = self.evaluate(command['value'])
            record = self.getVariable(command['target'])
            variable = self.getObject(record)
            variable.setProperty(key, value)
            content = variable.getContent()
            if content == None: content = {}
            elif not isinstance(content, dict): 
                raise RuntimeError(self.program, f'{record["name"]} is not a dictionary')
            if isinstance(value, dict): content[key] = value
            else: content[key] = self.textify(value)
            variable.setContent(ECValue(type='dict', content=content))
            return self.nextPC()
        
        elif cmdType == 'ssh':
            target = self.getVariable(command['target'])
            host = self.textify(command['host'])
            user = self.textify(command['user'])
            password = self.textify(command['password'])
            ssh = paramiko.SSHClient()
            target['ssh'] = ssh
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            try:
                ssh.connect(host, username=user, password=password, timeout=10)
                target['sftp'] = ssh.open_sftp()
            except:
                target['error'] = f'Unable to connect to {host} (timeout)'
            return self.nextPC()
        
        elif cmdType == 'breakpoint':
            self.program.breakpoint = True
            return self.nextPC()

    # Shuffle a JSON list
    def k_shuffle(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record['hasValue']:
                command['target'] = self.getToken()
                self.add(command)
                return True
            self.warning(f'Core.negate: Variable {record["name"]} does not hold a value')
        return False

    def r_shuffle(self, command):
        record = self.getVariable(command['target'])
        if not record['hasValue']:
            NoValueRuntimeError(self.program, record)
            return None
        value = self.getSymbolValue(record)
        if value == None:
            RuntimeError(self.program, f'{record["name"]} has not been initialised')
        content = value.getContent()
        if isinstance(content, list):
            random.shuffle(content)
            value.setContent(content)
            self.putSymbolValue(record, value)
            return self.nextPC()
        RuntimeError(self.program, f'{record["name"]} is not a list')

    # Split a string into a variable with several elements
    # split {variable} on {value}
    def k_split(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if isinstance(record['object'], ECObject):
                command['target'] = record['name']
                value = ECValue(type=str, content='\n')
                command['on'] = value
                if self.peek() in ['on', 'by']:
                    self.nextToken()
                    if self.peek() == 'tab':
                        value.setContent('\t')
                        self.nextToken()
                    else:
                        command['on'] = self.nextValue()
                self.add(command)
                return True
        else: self.noSymbolWarning()
        return False

    def r_split(self, command):
        target = self.getVariable(command['target'])
        value = self.getSymbolValue(target)
        content = value.getContent().split(self.textify(command['on']))
        elements = len(content)
        object = target['object']
        object.setElements(elements)
        
        for n in range(0, elements):
            val = ECValue(type=str, content=content[n])
            object.setIndex(n)
            object.setValue(val)
        object.setIndex(0)

        return self.nextPC()

    # Declare an SSH connection variable
    def k_ssh(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECSSH')

    def r_ssh(self, command):
        return self.nextPC()

    # Declare a stack variable
    def k_stack(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECStack')

    def r_stack(self, command):
        return self.nextPC()

    # Stop the current execution thread
    def k_stop(self, command):
        self.add(command)
        return True

    def r_stop(self, command):
        return 0

    # Issue a system call
    # system {command}
    def k_system(self, command):
        background = False
        token = self.nextToken()
        if token == 'background':
            self.nextToken()
            background = True
        value = self.getValue()
        if value != None:
            command['value'] = value
            command['background'] = background
            self.add(command)
            return True
        FatalError(self.compiler, 'I can\'t give this command')
        return False

    def r_system(self, command):
        value = self.textify(command['value'])
        if value != None:
            if command['background']:
                subprocess.Popen(["sh", "-c", value])
            else:
                os.system(value)
            return self.nextPC()

    # Arithmetic subtraction
    # take {value} from {variable}
    # take {value1} from {value2} giving {variable}
    def k_take(self, command):
        # Get the (first) value
        command['value1'] = self.nextValue()
        self.skip('from')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECObject)
            # If 'giving' comes next, this variable is the second value
            if self.peek() == 'giving':
                v2 = ECValue(type='symbol', name=record['name'])
                command['value2'] = v2
                self.nextToken()
                # Now get the target variable
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, ECVariable)
                    command['target'] = record['name']
                self.add(command)
                return True
            else:
                # Here the variable is the target
                command['target'] = record['name']
                self.add(command)
                return True
        else:
            # Here we have 2 values so 'giving' must come next
            command['value2'] = self.getValue()
            if self.nextToken() == 'giving':
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record, ECVariable)
                    command['target'] = record['name']
                self.add(command)
                return True
            raise FatalError(self.compiler, 'Cannot subtract values: target variable expected')
        return False

    def r_take(self, command):
        value1 = self.textify(command['value1'])
        value2 = self.textify(command['value2']) if 'value2' in command else None
        target = self.getVariable(command['target'])
        # Check that the target variable can hold a value
        self.checkObjectType(target, ECVariable)
        # If value2 exists, we are adding two values and storing the result in target
        if value2 != None:
            # take X from Y giving Z
            targetValue = ECValue(type=int, content=int(value2) - int(value1))
        else:
            # take X from Y
            targetValue = self.getSymbolValue(target)
            targetValue.setContent(int(targetValue.getContent()) - int(value1))
        self.putSymbolValue(target, targetValue)
        return self.nextPC()

    # Toggle a boolean value
    def k_toggle(self, command):
        if self.nextIsSymbol():
            target = self.getSymbolRecord()
            self.checkObjectType(target, ECVariable)
            command['target'] = target['name']
            self.add(command)
            return True
        return False

    def r_toggle(self, command):
        target = self.getVariable(command['target'])
        value = self.getSymbolValue(target)
        val = ECValue(type=bool, content=not value.getContent())
        self.putSymbolValue(target, val)
        self.add(command)
        return self.nextPC()

    # Trim whitespace from a variable
    def k_trim(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECVariable):
                command['name'] = record['name']
                self.add(command)
                return True
        return False

    def r_trim(self, command):
        record = self.getVariable(command['name'])
        value = record['value'][record['index']]
        if value.getType() == str:
            content = value.getContent()
            value.setContent(content.strip())
        return self.nextPC()

    # Truncate a file
    def k_truncate(self, command):
        if self.nextIsSymbol():
            fileRecord = self.getSymbolRecord()
            if fileRecord['keyword'] == 'file':
                command['file'] = fileRecord['name']
                self.add(command)
                return True
        return False

    def r_truncate(self, command):
        fileRecord = self.getVariable(command['file'])
        fileRecord['file'].truncate()
        return self.nextPC()

    # Unlock a variable
    def k_unlock(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['target'] = record['name']
            self.add(command)
            return True
        return False

    def r_unlock(self, command):
        target = self.getVariable(command['target'])
        target['locked'] = False
        return self.nextPC()

    # use plugin {class} from {source}
    # use graphics
    # use mqtt
    # use psutil
    def k_use(self, command):
        if self.peek() == 'plugin':
            # Import a plugin
            self.nextToken()
            clazz = self.nextToken()
            if self.nextIs('from'):
                source = self.nextToken()
                self.program.importPlugin(f'{source}:{clazz}')
                return True
            return False
        else:
            token = self.nextToken()
            if token == 'graphics':
                return self.program.useGraphics()
            if token == 'mqtt':
                return self.program.useMQTT()
            elif token == 'psutil':
                return self.program.usePSUtil()
            elif token == 'server':
                return self.program.useServer()
            elif token == 'email':
                return self.program.useEmail()
        return False
    
    # Unused
    def r_use(self, command):
        return self.nextPC()

    # Declare a general-purpose variable
    def k_variable(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECVariable')

    def r_variable(self, command):
        return self.nextPC()

    # Pause for a specified time
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
        multipliers['minutes'] = 60000
        command['multiplier'] = multipliers['second']
        token = self.peek()
        if token in multipliers:
            self.nextToken()
            command['multiplier'] = multipliers[token]
        self.add(command)
        return True

    def r_wait(self, command):
        value = self.textify(command['value']) * command['multiplier']
        next = self.nextPC()
        if getattr(self.program, 'debugging', False) and self.program.debugger is not None:
            # In debug mode, use Qt's event loop to resume safely on the UI thread
            from PySide6.QtCore import QTimer
            def resume():
                # Just enqueue - let the graphics timer's flush handle execution
                self.program.queueIntent(next)
            QTimer.singleShot(int(value), resume)
        else:
            # In normal mode, resume via the thread-safe intent queue
            threading.Timer(value/1000.0, lambda: (self.program.queueIntent(next))).start()
        return None

    # while <condition> <action>
    def k_while(self, command):
        code = self.nextCondition()
        if code == None:
            return None
        # token = self.getToken()
        command['condition'] = code
        test = self.getCodeSize()
        self.add(command)
        # Set up a goto for when the test fails
        fail = self.getCodeSize()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = 0
        cmd['debug'] = False
        self.add(cmd)
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
        self.add(cmd)
        # Fixup the 'goto' on completion
        self.getCommandAt(fail)['goto'] = self.getCodeSize()
        return True

    def r_while(self, command):
        test = self.program.condition.testCondition(command['condition'])
        if test:
            self.program.pc += 2
        else:
            self.program.pc += 1
        return self.program.pc

    # Write to a file
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
                    orPC = self.getCodeSize()
                    self.processOr(command, orPC)
                    return True
        return False

    def r_write(self, command):
        try:
            value = self.textify(command['value'])
            fileRecord = self.getVariable(command['file'])
            file = fileRecord['file']
            if file.mode in ['w', 'w+', 'a', 'a+']:
                file.write(f'{value}')
                if command['line']:
                    file.write('\n')
            return self.nextPC()
        except Exception as e:
            msg = f'Write error: {str(e)}'
            self.program.errorMessage = msg
            if command.get('or') != None:
                return command['or']
            RuntimeError(self.program, msg)

    # Try/or handle block
    # try ... or handle ... end
    def k_try(self, command):
        # Add the try command (handlerPC will be fixed up)
        tryPC = self.getCodeSize()
        command['handlerPC'] = 0
        self.add(command)
        # Compile the try body up to 'or'
        self.nextToken()
        while self.getToken() != 'or':
            self.compileOne()
            self.nextToken()
        # Expect 'handle' after 'or'
        if self.peek() != 'handle':
            FatalError(self.compiler, 'Expected "handle" after "or" in try block')
        self.nextToken()
        self.nextToken()
        # Add a gotoPC to skip the handler on success
        skipPC = self.getCodeSize()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'gotoPC'
        cmd['goto'] = 0
        cmd['debug'] = False
        self.add(cmd)
        # Fix up the try command's handlerPC
        self.getCommandAt(tryPC)['handlerPC'] = self.getCodeSize()
        # Compile the handler body up to 'end'
        while self.getToken() != 'end':
            self.compileOne()
            self.nextToken()
        # Add the endTry command
        endPC = self.getCodeSize()
        cmd = {}
        cmd['lino'] = command['lino']
        cmd['domain'] = 'core'
        cmd['keyword'] = 'endTry'
        cmd['debug'] = False
        self.add(cmd)
        # Fix up the skip goto
        self.getCommandAt(skipPC)['goto'] = endPC
        return True

    def r_try(self, command):
        # Save current onError and set up the try handler
        if not hasattr(self.program, 'onErrorStack'):
            self.program.onErrorStack = []
        self.program.onErrorStack.append(self.program.onError)
        self.program.onError = command['handlerPC']
        return self.nextPC()

    def r_endTry(self, command):
        # Restore onError from the stack
        if hasattr(self.program, 'onErrorStack') and len(self.program.onErrorStack) > 0:
            self.program.onError = self.program.onErrorStack.pop()
        else:
            self.program.onError = 0
        return self.nextPC()

    #############################################################################
    # Support functions

    def incdec(self, command, mode):
        record = self.getVariable(command['target'])
        self.checkObjectType(record['object'], ECVariable)
        value = self.getSymbolValue(record)
        content = value.getContent()
        if not isinstance(content, int):
            RuntimeError(self.program, f'Variable {record["name"]} does not hold an integer')
        if mode == '+': value.setContent(content + 1)
        else: value.setContent(content - 1)
        self.putSymbolValue(record, value)
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = ECValue()
        token = self.getToken()
        if self.isSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, (ECVariable, ECDictionary, ECList, ECStack, ECSSH, ECFile, ECModule)):
                value.setType('symbol')
                value.name = record['name']
                return value
            else: return None

        value.setType(token)

        if token == 'arg':
            self.nextToken()
            value.index = self.getValue()
            return value

        if token in ['cos', 'sin', 'tan']:
            value.angle = self.nextValue()
            if self.nextToken() == 'radius':
                value.radius = self.nextValue()
                return value
            return None

        if token in ['now', 'today', 'newline', 'tab', 'empty', 'cwd']:
            return value

        if token in ['stringify', 'prettify', 'json', 'lowercase', 'uppercase', 'hash', 'random', float, 'integer', 'encode', 'decode']:
            if self.peek() == 'of':
                self.nextToken()
            value.setContent(self.nextValue())
            return value

        if (token in ['datime', 'datetime']):
            value.setType('datime')
            value.timestamp = self.nextValue()
            if self.peek() == 'format':
                self.nextToken()
                value.format = self.nextValue()
            else:
                value.format = None
            return value

        if token == 'item':
            value.index = self.nextValue()
            if self.nextToken() == 'of':
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    self.checkObjectType(record['object'], ECList)
                    value.target = ECValue(type='symbol', name=record['name'])
                    return value
            return None

        if token == 'entry':
            value.key = self.nextValue() # type: ignore
            if self.nextToken() in ('in', 'of'):
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    object = record['object']
                    self.checkObjectType(object, ECDictionary)
                    value.target = object.name
                    return value
            return None

        if token == 'arg':
            value.setContent(self.nextValue())
            if self.getToken() == 'of':
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if record['keyword'] == 'variable':
                        value.target = record['name'] # type: ignore
                        return value
            return None

        if token == 'trim':
            self.nextToken()
            value.setContent(self.getValue())
            return value

        if self.getToken() == 'the':
            self.nextToken()

        token = self.getToken()
        value.setType(token)

        if token in ['argc', 'args', 'message', 'sender', 'uuid', 'weekday']:
            return value

        if token in ('items', 'elements'):
            if self.nextToken() in ('in', 'of'):
                if self.nextIsSymbol():
                    value.name = self.getToken() # type: ignore
                    return value
            return None

        if token == 'keys':
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    value.name = self.getToken() # type: ignore
                    return value
            return None

        if token == 'count':
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    object = record['object']
                    if isinstance(object, ECList):
                        value.setName(record['name'])
                        return value
            return None

        if token == 'index':
            if self.nextIs('of'):
                if self.nextIsSymbol():
                    value.variable = self.getSymbolRecord()['name'] # type: ignore
                    if self.peek() == 'in':
                        value.value = None # type: ignore
                        value.setType('indexOf')
                        self.nextToken()
                        if self.nextIsSymbol():
                            value.target = self.getSymbolRecord()['name'] # type: ignore
                            return value
                    else:
                        value.name = self.getToken() # type: ignore
                        return value
                else:
                    value.value = self.getValue() # type: ignore
                    if self.nextIs('in'):
                        value.variable = None # type: ignore
                        value.setType('indexOf')
                        if self.nextIsSymbol():
                            value.target = self.getSymbolRecord()['name'] # type: ignore
                            return value
            return None

        if token == 'value':
            if self.nextIs('of'):
                v = self.nextValue()
                if v !=None:
                    value.setValue(type='valueOf', content=v)
                    return value
            return None

        if token == 'length':
            value.setType('lengthOf')
            if self.nextIs('of'):
                value.setContent(self.nextValue())
                return value
            return None

        if token == 'field':
            value.setType('field')
            value.index = self.nextValue() # type: ignore
            if self.nextToken() == 'of':
                value.setContent(self.nextValue())
                if self.peek() == 'delimited':
                    self.nextToken()
                    self.skip('by')
                    value.delimiter = self.nextValue() # type: ignore
                    return value
            return None

        if token in ['left', 'right']:
            value.count = self.nextValue() # type: ignore
            if self.nextToken() == 'of':
                value.setContent(self.nextValue())
                return value
            return None

        # from {n} of {value}
        # from {n} to {m} of {value}
        if token == 'from':
            value.start = self.nextValue() # type: ignore
            if self.peek() == 'to':
                self.nextToken()
                value.to = self.nextValue() # type: ignore
            else:
                value.to = None # type: ignore
            if self.nextToken() == 'of':
                value.setContent(self.nextValue())
                return value

        # position of [the] [last] {needle} in {haystack}
        if token == 'position':
            self.skip('of')
            self.skip('the')
            if self.peek() == 'last':
                value.last = True # type: ignore
                self.nextToken()
            value.needle = self.nextValue() # type: ignore
            self.skip('in')
            value.haystack = self.nextValue() # type: ignore
            return value

        if token == 'timestamp':
            value.format = None # type: ignore
            if self.peek() == 'of':
                self.nextToken()
                value.timestamp = self.nextValue() # type: ignore
                if self.peek() == 'format':
                    self.nextToken()
                    value.format = self.nextValue() # type: ignore
            return value

        if token == 'entries':
            token = self.nextToken()
            if token in ['in', 'of']:
                value.target = self.nextValue() # type: ignore
                self.skip('of')
                if self.peek() == 'type':
                    self.nextToken()
                    value.filter = self.nextValue() # type: ignore
                return value
            return None

        if token == 'files':
            token = self.nextToken()
            if token in ['in', 'of']:
                value.target = self.nextValue() # type: ignore
                self.skip('of')
                if self.peek() == 'type':
                    self.nextToken()
                    value.filter = self.nextValue() # type: ignore
                return value
            return None

        if token == 'error':
            token = self.peek()
            if token == 'code':
                self.nextToken()
                value.item = 'errorCode' # type: ignore
                return value
            elif token == 'reason':
                self.nextToken()
                value.item = 'errorReason' # type: ignore
                return value
            elif token == 'message':
                self.nextToken()
                value.item = 'errorMessage' # type: ignore
                return value
            elif token in ['in', 'of']:
                self.nextToken()
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if isinstance(record['object'], ECSSH):
                        value.item = 'sshError' # type: ignore
                        value.name = record['name'] # type: ignore
                        return value
            # Unqualified 'the error' returns errorMessage (same as JS)
            value.item = 'errorMessage' # type: ignore
            return value

        if token == 'type':
            if self.nextIs('of'):
                value.value = self.nextValue() # type: ignore
                return value
            return None

        if token == 'modification':
            if self.nextIs('time'):
                if self.nextIs('of'):
                    value.fileName = self.nextValue() # type: ignore
                    return value
            return None

        if token == 'system':
            value.setContent(self.nextValue())
            return value

        if token == 'ticker':
            return value

        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        if self.peek() == 'modulo':
            self.nextToken()
            mv = ECValue(type='modulo', content=value)
            mv.modval = self.nextValue() # type: ignore
            return mv

        return value

    #############################################################################
	# Get the value of an unknown item 
    def getUnknownValue(self, value):
        if self.isObjectType(value, (ECVariable, ECDictionary, ECList)):
            return value.getContent()  # type: ignore
        return None # Unable to get value

    #############################################################################
    # Value handlers

    def v_argc(self, v):
        argv = self.program.argv if hasattr(self.program, 'argv') and self.program.argv else []
        return ECValue(type=int, content=len(argv))

    def v_args(self, v):
        return ECValue(type=str, content=json.dumps(self.program.argv))

    def v_arg(self, v):
        index = self.textify(v.index)
        if not hasattr(self.program, 'argv') or self.program.argv is None:
            RuntimeError(self.program, 'No command-line arguments were provided')
            return ECValue(type=str, content='')
        if index >= len(self.program.argv):
            RuntimeError(self.program, f'Argument index {index} out of range (only {len(self.program.argv)} args provided)')
            return ECValue(type=str, content='')
        return ECValue(type=str, content=self.program.argv[index])

    def v_bool(self, v):
        value = ECValue(type=bool, content=v.getContent())
    
    def v_boolean(self, v):
        return self.v_bool(v)

    def v_cos(self, v):
        angle = self.textify(v.angle)
        radius = self.textify(v.radius)
        return ECValue(type=int, content=round(math.cos(angle * 0.01745329) * radius))

    def v_count(self, v):
        variable = self.getObject(self.getVariable(v.getName()))
        return ECValue(type=int, content=variable.getItemCount())

    def v_datime(self, v):
        ts = self.textify(v.timestamp)
        fmt = v.format
        if fmt == None:
            fmt = '%b %d %Y %H:%M:%S'
        else:
            fmt = self.textify(fmt)
        return ECValue(type=str, content=datetime.fromtimestamp(ts/1000).strftime(fmt))

    def v_decode(self, v):
        content = self.textify(v.getContent())
        value = ECValue(type=str)
        if self.encoding == 'utf-8':
            value.setContent(content.decode('utf-8'))
        elif self.encoding == 'base64':
            base64_bytes = content.encode('ascii')
            message_bytes = base64.b64decode(base64_bytes)
            value.setContent(message_bytes.decode('ascii'))
        elif self.encoding == 'hex':
            hex_bytes = content.encode('utf-8')
            message_bytes = binascii.unhexlify(hex_bytes)
            value.setContent(message_bytes.decode('utf-8'))
        else:
            value = v
        return value

    def v_elements(self, v):
        var = self.getVariable(v.name)
        object = var['object']
        self.checkObjectType(object, ECVariable)
        return ECValue(type=int, content=object.getElements())

    def v_empty(self, v):
        return ECValue(type=str, content='')

    def v_encode(self, v):
        content = self.textify(v.getContent())
        value = ECValue(type=str)
        if self.encoding == 'utf-8':
            value.setContent(content.encode('utf-8'))
        elif self.encoding == 'base64':
            data_bytes = content.encode('ascii')
            base64_bytes = base64.b64encode(data_bytes)
            value.setContent(base64_bytes.decode('ascii'))
        elif self.encoding == 'hex':
            data_bytes = content.encode('utf-8')
            hex_bytes = binascii.hexlify(data_bytes)
            value.setContent(hex_bytes.decode('utf-8'))
        else:
            value = v
        return value

    def v_entry(self, v):
        record = self.getVariable(v.target)
        dictionary = self.getObject(record)
        return dictionary.getEntry(self.textify(v.key))

    def v_error(self, v):
        global errorCode, errorReason
        value = ECValue()
        item = v.item
        if item == 'errorCode':
            value.setValue(type=int, content=errorCode)
        elif item == 'errorReason':
            value.setValue(type=str, content=errorReason)
        elif item == 'errorMessage':
            value.setValue(type=str, content=getattr(self.program, 'errorMessage', ''))
        elif item == 'sshError':
            record = self.getVariable(v.name)
            value.setValue(type=str, content=record['error'] if 'error' in record else '')
        return value

    def v_entries(self, v):
        path = self.textify(v.target)
        filter_ext = self.textify(v.filter) if v.filter else None
        result = []
        for name in sorted(os.listdir(path)):
            full = os.path.join(path, name)
            if name.startswith('.'):
                continue
            if os.path.isdir(full):
                result.append({"name": name, "type": "dir"})
            elif os.path.isfile(full):
                if filter_ext:
                    ext = os.path.splitext(name)[1].lstrip('.').lower()
                    exts = {e.strip().lstrip('.') for e in filter_ext.split(',')}
                    if ext not in exts:
                        continue
                result.append({"name": name, "type": "file"})
        return ECValue(type=str, content=json.dumps(result))

    def v_files(self, v):
        path = self.textify(v.target)
        filter_ext = self.textify(v.filter) if v.filter else None
        entries = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
        if filter_ext:
            exts = {e.strip().lstrip('.') for e in filter_ext.split(',')}
            entries = [f for f in entries if os.path.splitext(f)[1].lstrip('.').lower() in exts]
        entries.sort()
        return ECValue(type=str, content=json.dumps(entries))

    def v_float(self, v):
        val = self.textify(v.getContent())
        value = ECValue(type=float)
        try:
            value.setContent(float(val))
        except:
            RuntimeWarning(self.program, f'Value cannot be parsed as floating-point')
            value.setContent(0.0)
        return value

    def v_field(self, v):
        index = int(self.textify(v.index))
        content = self.textify(v.getContent())
        delimiter = self.textify(v.delimiter)
        fields = content.split(delimiter)
        if index >= 0 and index < len(fields):
            return ECValue(type=str, content=fields[index])
        return ECValue(type=str, content='')

    def v_from(self, v):
        content = self.textify(v.getContent())
        start = self.textify(v.start)
        to = self.textify(v.to)
        if start is not None and type(start) != int:
            RuntimeError(self.program, 'Invalid "from" value')
        if to is not None and type(to) != int:
            RuntimeError(self.program, 'Invalid "to" value')
        return ECValue(type=str, content=content[start:] if to == None else content[start:to])

    def v_hash(self, v):
        hashval = self.textify(v.getContent())
        return ECValue(type=str, content=hashlib.sha256(hashval.encode('utf-8')).hexdigest())

    def v_index(self, v):
        record = self.getVariable(v.name)
        object = self.getObject(record)
        return ECValue(type=int, content=object.getIndex())

    def v_indexOf(self, v):
        value = v.value
        if value == None:
            var = self.getObject(self.getVariable(v.variable))
            value = var.getContent()
        else:
            value = self.textify(value)
        target = self.getObject(self.getVariable(v.target))
        if hasattr(target, 'getIndexOf'):
            index = target.getIndexOf(value)
        else:
            data = target.getContent()
            if not isinstance(data, str): data = self.textify(data)
            try: index = data.index(value)
            except: index = -1
        return ECValue(type=int, content=index)
    
    def v_int(self, v):
        content = self.textify(v.getContent())
        if content in ('', None):
            return ECValue(type=int, content=0)
        return ECValue(type=int, content=int(content))

    def v_integer(self, v):
        return self.v_int(v)

    def v_item(self, v):
        index = self.textify(v.index)
        targetName = v.target
        target = self.getVariable(targetName.getName())
        variable = self.getObject(target)
        self.checkObjectType(variable, ECList)
        if index >= variable.getItemCount():
            RuntimeError(self.program, f'Index out of range in {targetName}')
        targetValue = variable.getItem(index)
        return targetValue
    
    def v_items(self, v):
        record = self.getVariable(v.name)
        object = self.getObject(record)
        self.checkObjectType(object, ECList)
        return object.getItemCount()

    def v_json(self, v):
        item = self.textify(v.getContent())
        value = ECValue()
        try:
            v = json.loads(item)
            if type(v) == list: value.setType('list')
            elif type(v) == dict: value.setType('dict')
            else: value.setType(str)  
            value.setContent(v)
        except:
            value = None
        return value

    def v_keys(self, v):
        dictionary = self.getObject(self.getVariable(v.name))
        return ECValue(type='list', content=list(dictionary.keys())) # type: ignore

    def v_left(self, v):
        content = self.textify(v.getContent())
        count = self.textify(v.count)
        return ECValue(type=str, content=content[0:count])

    def v_lengthOf(self, v):
        content = self.textify(v.getContent())
        if type(content) == str:
            return ECValue(type=int, content=len(content))
        RuntimeError(self.program, 'Value is not a string')

    def v_lowercase(self, v):
        content = self.textify(v.getContent())
        return ECValue(type=str, content=content.lower())

    def v_message(self, v):
        return ECValue(type=str, content=self.program.message)

    def v_modification(self, v):
        fileName = self.textify(v.fileName)
        ts = int(os.stat(self.resolveLocalPath(fileName)).st_mtime)
        return ECValue(type=int, content=ts)

    def v_modulo(self, v):
        val = self.textify(v.getContent())
        modval = self.textify(v.modval)
        return ECValue(type=int, content=val % modval)

    def v_newline(self, v):
        return ECValue(type=str, content='\n')

    def v_cwd(self, v):
        return ECValue(type=str, content=os.getcwd())

    def v_now(self, v):
        return ECValue(type=int, content=int(time.time() * 1000))

    def v_position(self, v):
        needle = self.textify(v.needle)
        haystack = self.textify(v.haystack)
        last = v.last
        return ECValue(type=int, content=haystack.rfind(needle) if last else haystack.find(needle))

    def v_prettify(self, v):
        item = self.textify(v.getContent())
        if isinstance(item, str): item = json.loads(item)
        return ECValue(type=str, content=json.dumps(item, indent=4))

    def v_property(self, v):
        propertyName = v.name
        propertyValue = self.textify(propertyName)
        targetName = v.target
        target = self.getVariable(targetName.getContent())
        variable = self.getObject(target)
        return variable.getProperty(propertyValue)

    def v_random(self, v):
        limit = self.textify(v.getContent())
        return ECValue(type=int, content=random.randrange(0, limit))

    def v_right(self, v):
        content = self.textify(v.getContent())
        count = self.textify(v.count)
        return ECValue(type=str, content=content[-count:])

    def v_sender(self, v):
        return ECValue(type=str, content=self.program.sender.name)

    def v_sin(self, v):
        angle = self.textify(v.angle)
        radius = self.textify(v.radius)
        return ECValue(type=int, content=round(math.sin(angle * 0.01745329) * radius))
    
    def v_str(self, v):
        content = self.textify(v.getContent())
        return ECValue(type=str, content=str(content))

    def v_stringify(self, v):
        item = self.textify(v.getContent())
        item = json.loads(item)
        return ECValue(type=str, content=json.dumps(item))

    # This is used by the expression evaluator to get the value of a symbol
    def v_symbol(self, v):
        record = self.program.getSymbolRecord(v.name)
        if self.isObjectType(record, (ECVariable, ECDictionary, ECList)):
            return self.getSymbolValue(record)
        elif self.isObjectType(record, ECSSH):
            return ECValue(type=bool, content=True if 'ssh' in record and record['ssh'] != None else False)
        else:
            return None

    def v_system(self, v):
        command = self.textify(v.getContent())
        result = os.popen(command).read()
        return ECValue(type=str, content=result)

    def v_tab(self, v):
        return ECValue(type=str, content='\t')

    def v_tan(self, v):
        angle = self.textify(v.angle)
        radius = self.textify(v.radius)
        return ECValue(type=int, content=round(math.tan(angle * 0.01745329) * radius))

    def v_ticker(self, v):
        return ECValue(type=int, content=self.program.ticker)

    def v_timestamp(self, v):
        value = ECValue(type=int)
        fmt = v.format
        if fmt == None:
            value.setContent(int(time.time()))
        else:
            fmt = self.textify(fmt)
            dt = self.textify(v.timestamp)
            spec = datetime.strptime(dt, fmt)
            t = datetime.now().replace(hour=spec.hour, minute=spec.minute, second=spec.second, microsecond=0)
            value.setContent(int(t.timestamp()))
        return value

    def v_today(self, v):
        return ECValue(type=int, content=int(datetime.combine(datetime.now().date(),datetime.min.time()).timestamp()) * 1000)

    def v_trim(self, v):
        content = v.getContent()
        content = self.textify(content)
        return ECValue(type=str, content=content.strip())

    def v_type(self, v):
        value = ECValue(type=str)
        val = self.textify(v.value)
        if val is None:
            value.setContent('none')
        elif type(val) is str:
            value.setContent(str)
        elif type(val) is int:
            value.setContent('numeric')
        elif type(val) is bool:
            value.setContent(bool)
        elif type(val) is list:
            value.setContent('list')
        elif type(val) is dict:
            value.setContent('dict')
        return value

    def v_uppercase(self, v):
        content = self.textify(v.getContent())
        return ECValue(type=str, content=content.upper())
    
    def v_uuid(self, v):
        return ECValue(type=str, content=str(uuid.uuid4()))

    def v_valueOf(self, v):
        v = self.textify(v.getContent())
        return ECValue(type=int, content=int(v) if v != '' else 0)
    
    def v_variable(self, v):
        name = v.getContent()
        record = self.program.getSymbolRecord(name)
        variable = record['object']
        self.checkObjectType(variable, ECVariable)
        value = variable.getValue()
        return value

    def v_weekday(self, v):
        return ECValue(type=int, content=datetime.today().weekday())

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = ECValue()
        condition.negate = False # type: ignore

        token = self.getToken()

        if token == 'not':
            # Check if this is 'not at end of <file>'
            if self.peek() == 'at':
                self.nextToken()
                condition.negate = True # type: ignore
                token = 'at'
            else:
                condition.type = 'not' # type: ignore
                condition.value = self.nextValue() # type: ignore
                return condition

        if token == 'at':
            # at end of <file>
            if self.nextIs('end'):
                if self.nextIs('of'):
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if record['keyword'] == 'file':
                            condition.type = 'atEndOf' # type: ignore
                            condition.target = record['name'] # type: ignore
                            return condition
            return None

        elif token == 'error':
            self.nextToken()
            self.skip('in')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if record['keyword'] == 'ssh':
                    condition.type = 'sshError' # type: ignore
                    condition.target = record['name'] # type: ignore
                    return condition
            return None

        elif token == 'file':
            path = self.nextValue()
            condition.path = path # type: ignore
            condition.type = 'exists' # type: ignore
            self.skip('on')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if record['keyword'] == 'ssh':
                    condition.type = 'sshExists' # type: ignore
                    condition.target = record['name'] # type: ignore
                    token = self.nextToken()
            else: token = self.getToken()
            if token == 'exists':
                return condition
            elif token == 'does':
                if self.nextIs('not'):
                    if self.nextIs('exist'):
                        condition.negate = not condition.negate # type: ignore
                        return condition
            return None
        
        elif token == 'debugging':
            condition.type = 'debugging' # type: ignore
            return condition

        value = self.getValue()
        if value == None:
            return None

        condition.value1 = value # type: ignore
        token = self.peek()
        condition.type = token # type: ignore

        if token == 'has':
            self.nextToken()
            token = self.nextToken()
            negate = False
            if token == 'no':
                negate = True
                token = self.nextToken()
            if token in ('entry', 'property'):
                value = self.nextValue()
                if token == 'entry':
                    condition.type = 'hasEntry' # type: ignore
                    condition.entry = value # type: ignore
                elif token == 'property:':
                    condition.type = 'hasProperty' # type: ignore
                    condition.property = value # type: ignore
                if negate:
                    condition.negate = not condition.negate # type: ignore
                return condition
            return None

        if token == 'does':
            self.nextToken()
            if self.nextIs('not'):
                token = self.nextToken()
                if token == 'have':
                    token = self.nextToken()
                    if token in ('entry', 'property:'):
                        value = self.nextValue()
                        if token == 'entry':
                            condition.type = 'hasEntry' # type: ignore
                            condition.entry = value # type: ignore
                        elif token == 'property':
                            condition.type = 'hasProperty' # type: ignore
                            condition.property = value # type: ignore
                        condition.negate = not condition.negate # type: ignore
                        return condition
                elif token == 'include':
                    value = self.nextValue()
                    condition.type = 'includes' # type: ignore
                    condition.value2 = value # type: ignore
                    condition.negate = not condition.negate # type: ignore
                    return condition
            return None

        if token in ['starts', 'ends']:
            self.nextToken()
            if self.nextToken() == 'with':
                condition.value2 = self.nextValue() # type: ignore
                return condition

        if token == 'includes':
            self.nextToken()
            condition.value2 = self.nextValue() # type: ignore
            return condition

        if token == 'is':
            token = self.nextToken()
            if self.peek() == 'not':
                self.nextToken()
                condition.negate = True # type: ignore
            token = self.nextToken()
            condition.type = token # type: ignore
            if token in ['numeric', 'string', 'bool', 'boolean', 'none', 'list', 'object', 'even', 'odd', 'empty']:
                return condition
            if token in ['greater', 'less']:
                if self.nextToken() == 'than':
                    condition.value2 = self.nextValue() # type: ignore
                    return condition
            condition.type = 'is' # type: ignore
            condition.value2 = self.getValue() # type: ignore
            return condition
 
        if condition.value1: # type: ignore
            # It's a boolean if
            condition.type = bool # type: ignore
            return condition

        self.warning(f'Core.compileCondition: I can\'t get a conditional:')
        return None

    def isNegate(self):
        token = self.getToken()
        if token == 'not':
            self.nextToken()
            return True
        return False

    #############################################################################
    # Condition handlers

    def c_bool(self, condition):
        value = self.textify(condition.value1)
        if type(value) == bool:
            return not value if condition.negate else value
        elif type(value) == int:
            return True if condition.negate else False
        elif type(value) == str:
            if value.lower() == 'true':
                return False if condition.negate else True
            elif value.lower() == 'false':
                return True if condition.negate else False
            else:
                return True if condition.negate else False
        return False
    
    def c_boolean(self, condition):
        return self.c_bool(condition)

    def c_atEndOf(self, condition):
        record = self.getVariable(condition.target)
        f = record.get('file')
        if f is None:
            return True
        ch = f.read(1)
        if ch == '':
            result = True
        else:
            f.seek(f.tell() - 1)
            result = False
        return not result if condition.negate else result

    def c_debugging(self, condition):
        return self.program.debugging

    def c_empty(self, condition):
        if condition.value1.getType() == 'symbol':
            record = self.getVariable(condition.value1.name)
            variable = self.getObject(record)
            if isinstance(variable, (ECVariable, ECDictionary, ECList, ECQueue)):
                comparison = variable.isEmpty()
                return not comparison if condition.negate else comparison
        value = self.textify(condition.value1)
        if value == None:
            comparison = True
        elif isinstance(value, str):
            comparison = len(value) == 0
        else:
            domainName = condition.value1.domain
            domain = self.program.domainIndex[domainName] # type: ignore
            handler = domain.valueHandler('empty') # type: ignore
            if handler: comparison = self.textify(handler(condition.value1))
        return not comparison if condition.negate else comparison

    def c_ends(self, condition):
        value1 = self.textify(condition.value1)
        value2 = self.textify(condition.value2)
        return value1.endswith(value2)

    def c_even(self, condition):
        return self.textify(condition.value1) % 2 == 0

    def c_exists(self, condition):
        path = self.textify(condition.path)
        comparison = os.path.exists(self.resolveLocalPath(path))
        return not comparison if condition.negate else comparison

    def c_greater(self, condition):
        comparison = self.program.compare(condition.value1, condition.value2)
        if comparison == None:
            raise RuntimeError(self.program, f'Cannot compare {self.textify(condition.value1)} and {self.textify(condition.value2)}')
        return comparison <= 0 if condition.negate else comparison > 0

    def c_hasEntry(self, condition):
        dictionary = self.getObject(self.getVariable(condition.value1.content))
        entry = self.textify(condition.entry)
        hasEntry = dictionary.hasEntry(entry) # type: ignore
        return not hasEntry if condition.negate else hasEntry

    def c_hasProperty(self, condition):
        record = self.getVariable(condition.value1)
        variable = self.getObject(record)
        prop = self.textify(condition.property)
        hasProp = variable.hasProperty(prop)
        return not hasProp if condition.negate else hasProp

    def c_includes(self, condition):
        value1 = self.textify(condition.value1)
        value2 = self.textify(condition.value2)
        includes = value2 in value1
        return not includes if condition.negate else includes

    def c_is(self, condition):
        comparison = self.program.compare(condition.value1, condition.value2)
        if comparison == None: comparison = 1
        return comparison != 0 if condition.negate else comparison == 0

    def c_less(self, condition):
        comparison = self.program.compare(condition.value1, condition.value2)
        if comparison == None:
            raise RuntimeError(self.program, f'Cannot compare {self.textify(condition.value1)} and {self.textify(condition.value2)}')
        return comparison >= 0 if condition.negate else comparison < 0

    def c_list(self, condition):
        comparison = type(self.textify(condition.value1)) is list
        return not comparison if condition.negate else comparison

    def c_numeric(self, condition):
        comparison = type(self.textify(condition.value1)) is int
        return not comparison if condition.negate else comparison

    def c_none(self, condition):
        comparison = self.textify(condition.value1) is None
        return not comparison if condition.negate else comparison

    def c_not(self, condition):
        return not self.textify(condition.value)

    def c_object(self, condition):
        comparison = type(self.textify(condition.value1)) is dict
        return not comparison if condition.negate else comparison

    def c_odd(self, condition):
        return self.textify(condition.value1) % 2 == 1
    
    def c_sshError(self, condition):
        target = self.getVariable(condition.target)
        errormsg = target['error'] if 'error' in target else None
        condition.errormsg = errormsg
        test = errormsg != None
        return not test if condition.negate else test

    def c_sshExists(self, condition):
        path = self.textify(condition.path)
        ssh = self.getVariable(condition.target)
        sftp = ssh['sftp']
        try:
            with sftp.open(path, 'r') as remote_file: remote_file.read().decode()
            comparison = True
        except:
            comparison = False
        return not comparison if condition.negate else comparison

    def c_starts(self, condition):
        value1 = self.textify(condition.value1)
        value2 = self.textify(condition.value2)
        return value1.startswith(value2)

    def c_string(self, condition):
        comparison = type(self.textify(condition.value1)) is str
        return not comparison if condition.negate else comparison

    def c_and(self, condition):
        return self.testCondition(condition.left) and self.testCondition(condition.right)

    def c_or(self, condition):
        return self.testCondition(condition.left) or self.testCondition(condition.right)

import re
from functools import partial
from easycoder import (
    Handler,
    RuntimeError,
    Keyboard,
    TextReceiver
)
from easycoder.ec_classes import ECValue, ECVariable, ECList, ECDictionary
from easycoder.ec_gclasses import (
    ECWidget,
    ECLayout,
    ECPanel,
    ECMultiline,
    ECLineInput,
    ECGElement
)
from rbrwidgets import (
    RBRMainWindow,
    MainWindow,
    RBRWidget,
    RBRRoom,
    RBRBanner,
    RBRProfiles,
    RBRPopout,
    RBRButton,
    TextButton,
    Room,
    Menu,
    ModeDialog
)

class RBR_UI(Handler):

    def __init__(self, compiler):
        Handler.__init__(self, compiler)

    def getName(self):
        return 'rbr_ui'

    def clearWidget(self, widget):
        layout = widget.layout()
        if layout is not None:
            while layout.count():
                item = layout.takeAt(0)
                child_widget = item.widget()
                if child_widget is not None:
                    child_widget.setParent(None)
                    child_widget.deleteLater()
                else:
                    # If it's a layout, clear it recursively
                    child_layout = item.layout()
                    if child_layout is not None:
                        self.clearWidget(child_layout)
    
    def hasAttributes(self, command, attributes):
        for attr in attributes:
            if not attr in command: return False
        return True

    #############################################################################
    # Keyword handlers

    # add {room} to {rbrwin}
    # add {widget} to {layout}
    def k_add(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, RBRRoom):
                command['room'] = record['name']
                self.skip('to')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    keyword = record['keyword']
                    if self.isObjectType(record, RBRMainWindow):
                        command['window'] = record['name']
                        self.add(command)
                        return True
                    
            elif self.isObjectType(record, RBRWidget):
                command['widget'] = record['name']
                self.skip('to')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECLayout):
                        command['layout'] = record['name']
                        self.add(command)
                        return True

        return False
        
    def r_add(self, command):
        if 'room' in command:
            record = self.getVariable(command['room'])
            room = self.getInnerObject(record)
            record = self.getVariable(command['window'])
            window = self.getInnerObject(record)
            window.getElement('rooms').addWidget(room)
        elif 'widget' in command and 'layout' in command:
            record = self.getVariable(command['widget'])
            widget = self.getInnerObject(record)
            record = self.getVariable(command['layout'])
            layout = self.getInnerObject(record)
            layout.addWidget(widget)
        return self.nextPC()

    # attach {layout} [to] other view of {rbrwin}
    # attach {widget} [to] win}/{widget}
    def k_attach(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECLayout):
                command['item'] = record['name']
                self.skip('to')
                self.skip('other')
                self.skip('view')
                command['other'] = True
                self.skip('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, RBRMainWindow):
                        command['rbrwin'] = record['name']
                        self.add(command)
                        return True
            elif self.isObjectType(record, ECWidget):
                command['item'] = record['name']
                self.skip('to')
                self.skip('element')
                command['value'] = self.nextValue()
                self.skip('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, (RBRMainWindow, RBRRoom, RBRBanner, RBRProfiles)):
                        command['target'] = record['name']
                        self.add(command)
                        return True
        return False
    
    def r_attach(self, command):
        if 'other' in command:
            window = self.getVariable(command['rbrwin'])['window']
            item = self.getVariable(command['item'])
            widget= window.getOtherPanel()
            item['widget'] = widget
            return self.nextPC()
        else:
            item = self.getVariable(command['item'])
            value = self.textify(command['value'])
            target = self.getVariable(command['target'])
            if self.isObjectType(target, RBRMainWindow):
                # Attach to a main window
                window = self.getInnerObject(target)
                if self.isObjectType(item, RBRButton):
                    self.putSymbolValue(item, window.getElement(value))
                else:
                    item['object'].setValue(window.getElement(value))
            elif self.isObjectType(target, RBRRoom):
                # Attach to a room
                room = self.getInnerObject(target)
                if value in ['mode', 'tools']:
                    object = room.modeButton if value == 'mode' else room.toolsButton
                    item['object'].setValue(object)
            elif self.isObjectType(target, RBRProfiles):
                # Attach to the profiles bar
                profiles = self.getInnerObject(target) 
                element = profiles.getElement(value)
                item['object'].setValue(element)
            elif self.isObjectType(target, RBRBanner):
                banner = self.getInnerObject(target) 
                element = banner.getElement(value)
                item['object'].setValue(element)
            else:
                raise 
        return self.nextPC()

    def k_banner(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'RBRBanner')

    def r_banner(self, command):
        return self.nextPC()

    def k_button(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'RBRButton')

    def r_button(self, command):
        return self.nextPC()

    # clear {rbrwin}
    def k_clear(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if record['keyword']== 'rbrwin':
                command['name'] = record['name']
                self.add(command)
            return True
        return False
    
    def r_clear(self, command):
        record = self.getVariable(command['name'])
        window = self.getInnerObject(record)
        self.clearWidget(window.content)
        window.initContent()
        return self.nextPC()

    # create {rbrwin} at {left} {top} size {width} {height}
    # create {room} {name} {mode} {height}
    # create {button} text {text}
    # create keyboard with layout {layout} and receiver {field} [and receiver {field]...]}] in {window}
    def k_create(self, command):
        token = self.nextToken()
        if self.isSymbol():
            record = self.getSymbolRecord()
            object = self.getObject(record)
            command['varname'] = record['name']
            if isinstance(object, RBRMainWindow):
                x = None
                y = None
                w = self.compileConstant(600)
                h = self.compileConstant(1024)
                while True:
                    token = self.peek()
                    if token in ['title', 'at', 'size']:
                        self.nextToken()
                        if token == 'title': command['title'] = self.nextValue()
                        elif token == 'at':
                            x = self.nextValue()
                            y = self.nextValue()
                        elif token == 'size':
                            w = self.nextValue()
                            h = self.nextValue()
                        else: return False
                    else: break
                command['x'] = x
                command['y'] = y
                command['w'] = w
                command['h'] = h
                self.add(command)
                return True

            elif isinstance(object, RBRRoom):
                while True:
                    token = self.peek()
                    if token in ['spec', 'height', 'index']:
                        self.nextToken()
                        if token == 'spec':
                            command['spec'] = self.nextValue()
                        elif token == 'height':
                            command['height'] = self.nextValue()
                        elif token == 'index':
                            command['index'] = self.nextValue()
                    else: break
                self.add(command)
                return True
            
            elif isinstance(object, RBRButton):
                if self.nextIs('text'):
                    command['type'] = 'text'
                    command['text'] = self.nextValue()
                    self.add(command)
                    return True

        elif token == 'keyboard':
            if self.peek() == 'type':
                self.nextToken()
                command['type'] = self.nextToken()

            else: command['type'] = 'qwerty'
            self.skip('with')
            if self.nextIs('layout'):
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECLayout):
                        command['layout'] = record['name']
                        command['receivers'] = []
                        while self.peek() == 'and':
                            self.nextToken()
                            if self.nextIs('receiver'):
                                if self.nextIsSymbol():
                                    record = self.getSymbolRecord()
                                    if self.isObjectType(record, (RBRWidget, ECLineInput, ECMultiline)):
                                        command['receivers'].append(record['name'])
                            else: return False
                        self.skip('in')
                        if self.nextIsSymbol():
                            record = self.getSymbolRecord()
                            if self.isObjectType(record, RBRMainWindow):
                                command['window'] = record['name']
                                self.add(command)
                                return True
        return False

    def r_create(self, command):
        if 'receivers' in command:
            layout = self.getInnerObject(self.getVariable(command['layout']))
            receiverNames = command['receivers']
            receivers = []
            for name in receiverNames:
                receiver = self.getInnerObject(self.getVariable(name))
                receivers.append(TextReceiver(receiver))
            window = self.getInnerObject(self.getVariable(command['window']))
            Keyboard(self.program, command['type'], receiverLayout=layout, receivers=receivers, parent=window)
            return self.nextPC()

        record = self.getVariable(command['varname'])
        object = self.getObject(record)
        if isinstance(object, RBRMainWindow):
            title = self.textify(command['title'])
            w = self.textify(command['w'])
            h = self.textify(command['h'])
            x = command['x']
            y = command['y']
            if title == '':
                x = 0
                y = 0
            else:
                if x == None: x = (self.program.screenWidth - w) / 2
                else: x = self.textify(x)
                if y == None: y = (self.program.screenHeight - h) / 2
                else: y = self.textify(y)

            window = MainWindow(self.program, title, x, y, w, h)
            self.getObject(record).setValue(window)
            return self.nextPC()
        
        elif isinstance(object, RBRRoom):
            spec = self.textify(command['spec'])
            height = self.textify(command['height'])
            index = self.textify(command['index'])
            room = Room(self.program, spec, height, index)
            self.getObject(record).setRoom(room)
            return self.nextPC()
    
        elif isinstance(object, RBRButton):
            text = self.textify(command['text'])
            button = TextButton(self.program, text=text)
            self.getObject(record).setValue(button)
            return self.nextPC()

        return 0

    # get {variable} from {dialog} [with {value}]
    def k_get(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECVariable):
                command['target'] = record['name']
                self.skip('from')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    keyword = record['keyword']
                    if keyword == 'modeDialog':
                        command['dialog'] = record['name']
                        if self.peek() == 'with':
                            self.nextToken()
                            if self.nextIsSymbol():
                                record = self.getSymbolRecord()
                                if self.isObjectType(record, ECDictionary):
                                    command['with'] = record['name']
                            else: return False
                        self.add(command)
                        return True
        return False
    
    def r_get(self, command):
        target = self.getVariable(command['target'])
        dialog = self.getVariable(command['dialog'])
        roomSpec = self.getVariable(command['with']) if 'with' in command else None
        keyword = dialog['keyword']
        value = ModeDialog(self.program, roomSpec).showDialog() if keyword == 'modeDialog' else ''
        v = ECValue(type=str, content=value)
        self.putSymbolValue(target, v)
        return self.nextPC()

    # hide {rbrwin}/{widget}
    def k_hide(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['name'] = record['name']
            if self.isObjectType(record, (RBRMainWindow, RBRWidget)):
                self.add(command)
                return True
        return False
        
    def r_hide(self, command):
        if 'name' in command:
            record = self.getVariable(command['name'])
            object = record['object']
            self.checkObjectType(object, RBRWidget)
            object.getValue().hide()
        return self.nextPC()

    # lower time/temp {variable} {count} hours/minutes/tenths
    def k_lower(self, command):
        token = self.nextToken()
        if token in ['time', 'temp']:
            command['type'] = token
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECVariable):
                    command['variable'] = record['name']
                    command['count'] = self.nextValue()
                    unit = self.nextToken()
                    if unit in ['hours', 'hour', 'minutes', 'minute', 'tenths']:
                        command['unit'] = unit
                        self.add(command)
                        return True
        return False
        
    def r_lower(self, command):
        var = self.getVariable(command['variable'])
        count = self.textify(command['count'])
        unit = command['unit']
        v = self.getSymbolValue(var)
        content = v.content
        if command['type'] == 'time':
            content = content.split(':')
            value = int(content[0]) * 60 + int(content[1])
            if unit in ['hours', 'hour']:
                value -= count * 60
            elif unit in ['minutes', 'minute']:
                value -= count
            if value >= 1440:
                value -= 1440
            elif value < 0:
                value += 1440
            value = f'{value // 60}:{value % 60:02d}'
        elif command['type'] == 'temp':
            value = float(content) * 10.0
            if unit == 'tenths':
                value -= count
            value = str(value / 10.0)
        v.content = value
        self.putSymbolValue(var, v)
        return self.nextPC()

    def k_modeDialog(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECGElement')

    def r_modeDialog(self, command):
        return self.nextPC()
    
    # This is compiled in the core graphics handler, so only a runtime handler is needed here.
    def r_on(self, command):
        def run(item, record):
            object = self.getObject(record)
            values = object.getValues()
            for i, v in enumerate(values):
                if isinstance(v, ECValue): v = v.getContent()
                if v == item:
                    object.setIndex(i)
                    self.run(command['goto'])
                    return

        if command['type'] == 'click':
            record = self.getVariable(command['name'])
            object = self.getObject(record)
            widget = self.getInnerObject(object)
            if self.isObjectType(record, RBRButton):
                goto = command['goto']
                handler = partial(self.callback, widget, record, goto)
                widget.clicked.connect(handler)
        return self.nextPC()

    def k_popout(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'RBRPopout')

    def r_popout(self, command):
        return self.nextPC()

    def k_profiles(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'RBRProfiles')

    def r_profiles(self, command):
        return self.nextPC()

    # raise time/temp {variable} {count} hours/minutes/tenths
    def k_raise(self, command):
        token = self.nextToken()
        if token in ['time', 'temp']:
            command['type'] = token
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECVariable):
                    command['variable'] = record['name']
                    command['count'] = self.nextValue()
                    unit = self.nextToken()
                    if unit in ['hours', 'hour', 'minutes', 'minute', 'tenths']:
                        command['unit'] = unit
                        self.add(command)
                        return True
        return False
        
    def r_raise(self, command):
        var = self.getVariable(command['variable'])
        count = self.textify(command['count'])
        unit = command['unit']
        v = self.getSymbolValue(var)
        content = v.content
        if command['type'] == 'time':
            content = content.split(':')
            value = int(content[0]) * 60 + int(content[1])
            if unit in ['hours', 'hour']:
                value += count * 60
            elif unit in ['minutes', 'minute']:
                value += count
            if value >= 1440:
                value -= 1440
            elif value < 0:
                value += 1440
            value = f'{value // 60}:{value % 60:02d}'
        elif command['type'] == 'temp':
            value = float(content) * 10.0
            if unit == 'tenths':
                value += count
            value = str(value / 10.0)
        v.content = value
        self.putSymbolValue(var, v)
        return self.nextPC()

    def k_rbrwin(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'RBRMainWindow')

    def r_rbrwin(self, command):
        return self.nextPC()

    def k_room(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'RBRRoom')

    def r_room(self, command):
        return self.nextPC()

   # select {choice} from menu {title} [with] {choices}
    def k_select(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECVariable):
                command['choice'] = record['name']
                if self.nextIs('from'):
                    if self.nextIs('menu'):
                        command['title'] = self.nextValue()
                        self.skip('with')
                        if self.nextIsSymbol():
                            record = self.getSymbolRecord()
                            if self.isObjectType(record, ECList):
                                command['choices'] = record['name']
                                self.add(command)
                                return True
        return False
    
    def r_select(self, command):
        target = self.getVariable(command['choice'])
        title = self.textify(command['title'])
        choices = self.getObject(self.getVariable(command['choices']))
        choice = Menu(self.program, 50, self.program.rbrwin, title, choices).show()
        v = ECValue(type=str, content=choice)
        self.putSymbolValue(target, v)
        return self.nextPC()

    # set attribute {attr} [of] {rbrwin}/{room} [to] {value}
    # set [the] width/height of {widget} to {value}
    # set second view of {window} to {widget}
    def k_set(self, command):
        self.skip('the')
        token = self.nextToken()
        if token == 'attribute':
            command['attribute'] = self.nextValue()
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(self.getObject(record), (RBRMainWindow, RBRWidget, ECLineInput, ECMultiline)):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token in ['width', 'height']:
            command['what'] = token
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (RBRWidget, ECLineInput, ECMultiline)):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'second':
            self.skip('view')
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(self.getObject(record), RBRMainWindow):
                    command['window'] = record['name']
                    self.skip('to')
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECPanel):
                            command['widget'] = record['name']
                            self.add(command)
                            return True
        return False
    
    def r_set(self, command):
        if 'what' in command:
            what = command['what']
            if what == 'height':
                widget = self.getInnerObject(self.getVariable(command['name']))
                widget.setFixedHeight(self.textify(command['value']))  # type: ignore
            elif what == 'width':
                widget = self.getInnerObject(self.getVariable(command['name']))
                widget.setFixedWidth(self.textify(command['value']))  # type: ignore
        elif 'attribute' in command:
            attribute = self.textify(command['attribute'])
            record = self.getVariable(command['name'])
            value = self.textify(command['value'])
            object = self.getObject(record)
            if self.isObjectType(object, RBRMainWindow):
                window = self.getInnerObject(record)
                profiles = window.getElement('profiles')
                if attribute == 'system name':
                    profiles.handleRequest({'setSystemName': value})
                elif attribute == 'profile':
                    profiles.handleRequest({'setProfile': value})
                elif attribute == 'hourglass':
                    profiles.handleRequest({'setHourglass': value})
                elif attribute == 'other':
                    layout = self.getVariable(command['layout'])['widget']
                    window.setOtherPanel(layout)
            elif self.isObjectType(record, RBRRoom):
                room = record['value'][record['index']]
                if attribute == 'name':
                    room.setName(value)
                elif attribute == 'temperature':
                    room.setTemperature(value)
            elif self.isObjectType(record, (RBRWidget, ECLineInput, ECMultiline)):
                if attribute =='color':
                    widget = record['widget']
                    style = widget.styleSheet()
                    style = re.sub(r'color:\s*[^;]+;', '', style)
                    style += f'color: {value};\n'
                    widget.setStyleSheet(style)
        elif self.hasAttributes(command, ['widget', 'window']):
            record = self.getVariable(command['window'])
            window = self.getInnerObject(record)
            record = self.getVariable(command['widget'])
            window.setSecondPanel(self.getInnerObject(record))
        else: return 0
        return self.nextPC()

    # show {rbrwin}/{element}
    # show main/second view of {rbrwin}
    def k_show(self, command):
        token = self.nextToken()
        if self.isSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, (RBRMainWindow, RBRWidget)):
                command['name'] = record['name']
                self.add(command)
                return True
        elif token in ['main', 'second']:
            self.skip('view')
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, RBRMainWindow):
                    command[token] = record['name']
                    self.add(command)
                    return True
        return False
        
    def r_show(self, command):
        if 'main' in command: key = 'main'
        elif 'second' in command: key = 'second'
        else: key = None
        if key:
            window = self.getInnerObject(self.getVariable(command[key]))
            window.showMainPanel() if key == 'main' else window.showSecondPanel()
        elif 'name' in command:
            record = self.getVariable(command['name'])
            object = record['object']
            self.checkObjectType(object, (RBRMainWindow, RBRWidget))    
            item = object.getValue()
            if isinstance(object, RBRMainWindow):
                self.program.rbrwin = item
            item.show()
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = ECValue()
        value.domain = self.getName()
        token = self.getToken()
        value.name = token
        if self.isSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECGElement):
                value.setType('symbol')
                return value

            return None
        
        if token == 'the': token = self.nextToken()
        value.type = token

        if token == 'attribute':
            value.attr = self.nextValue()
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (RBRRoom, RBRButton)):
                    value.name = record['name']
                    return value

        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_symbol(self, value):
        v = ECValue(type=str)
        record = self.getVariable(value.name)
        if self.isObjectType(record, RBRRoom):
            object = self.getObject(record)
            name = object.getName()
            mode = object.getMode()
            temp = object.getTemperature()
            v.content = f'{name} {mode} {temp}'
        elif self.isObjectType(record, RBRWidget):
            v.content = record['widget'].text()
        else: v = None
        return v
    
    def v_attribute(self, value):
        record = self.getVariable(value.name)
        attr = self.textify(value.attr)
        v = ECValue()
        if attr == 'index':
            v.type = int
            v.content = self.program.roomIndex
        else:
            if self.isObjectType(record, RBRRoom):
                object = self.getObject(record)
                room = self.getInnerObject(object)
                v.type = str
                if attr == 'name':
                    content = room.getName()
                elif attr == 'temperature':
                    content = room.getTemperature()
                elif attr == 'mode':
                    content = room.getMode()
                else:
                    RuntimeError(self.program, f'Room has no attribute "{attr}"')
                v.content = content
            else:
                RuntimeError(self.program, f'Element type "{record["keyword"]}" does not have attributes')
        return v

    #############################################################################
	# Get the value of an unknown item (domain-specific)
    def getUnknownValue(self, value):
        return None # Unable to get value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = ECValue()
        condition.negate = False

        token = self.getToken()
        condition.type = token

        if token == 'time':
            condition.time1 = self.nextValue()
            self.skip('is')
            token = self.nextToken()
            if token in ['before', 'after', 'equals']:  
                condition.operator = token
                condition.time2 = self.nextValue()
                return condition

        return None

    #############################################################################
    # Condition handlers

    def c_time(self, condition):
        time1 = self.textify(condition.time1)
        time2 = self.textify(condition.time2)
        operator = condition.operator
        comparison = False
        v = time1.split(':')
        t1 = int(v[0]) * 60 + int(v[1])
        v = time2.split(':')
        t2 = int(v[0]) * 60 + int(v[1])
        if operator == 'before':
            comparison = t1 < t2
        elif operator == 'after':
            comparison = t1 > t2
        elif operator == 'equals':
            comparison = t1 == t2
        return not comparison if condition.negate else comparison

import sys
from .ec_handler import Handler
from .ec_classes import (
    FatalError,
    RuntimeError,
    ECValue
)
from .ec_gclasses import (
    ECWidget,
    ECCoreWidget,
    ECLayout,
    ECGroup,
    ECPanel,
    ECLabel,
    ECPushButton,
    ECCheckBox,
    ECLineInput,
    ECMultiline,
    ECMDPanel,
    ECListBox,
    ECComboBox,
    ECWindow,
    ECDialog,
    ECMessageBox,
)
from .ec_border import Border
from .debugger.ec_debug import Debugger
from PySide6.QtCore import Qt, QTimer, Signal, QRect
from PySide6.QtGui import QPixmap, QPainter
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDateEdit,
    QDateTimeEdit,
    QDial,
    QDoubleSpinBox,
    QFontComboBox,
    QLabel,
    QLCDNumber,
    QLineEdit,
    QPlainTextEdit,
    QTextEdit,
    QListWidget,
    QMainWindow,
    QProgressBar,
    QPushButton,
    QRadioButton,
    QSlider,
    QSpinBox,
    QTimeEdit,
    QLayout,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QStackedLayout,
    QGroupBox,
    QWidget,
    QSpacerItem,
    QSizePolicy,
    QDialog,
    QMessageBox,
    QDialogButtonBox,
    QGraphicsDropShadowEffect
)
from easycoder.ec_program import flush

#############################################################################
# EC Label widget class
class ECLabelWidget(QLabel):
    def __init__(self, text=None):
        super().__init__(text)
        self.setStyleSheet("""
            background-color: transparent;
            border: none;
        """)

#############################################################################
# EC Pushbutton widget class
class ECPushButtonWidget(QPushButton):
    def __init__(self, text=None):
        super().__init__(text)
#        self.clicked.connect(self.handleClick)
    
    def getContent(self):
        return self.text()

#    def setOnClick(self, cb):
#        self.clicked.connect(cb)
    
#    def handleClick(self):
#        pass

#############################################################################
# EC Checkbox widget class
class ECCheckBoxWidget(QCheckBox):
    def __init__(self, text=None):
        super().__init__(text)
        self.setStyleSheet("""
            QCheckBox::indicator {
                border: 1px solid black;
                border-radius: 3px;
                background: white;
                width: 16px;
                height: 16px;
            }
            QCheckBox::indicator:checked {
                background: #0078d7;
            }
            QCheckBox {
                border: none;
                background: transparent;
            }
        """)

#############################################################################
# EC line edit widget class
class ECLineEditWidget(QLineEdit):
    clicked = Signal()

    def __init__(self):
        super().__init__()
        self.multiline = False
        self.container = None
    
    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

#############################################################################
# EC plain text edit widget class
class ECPlainTextEditWidget(QPlainTextEdit):
    clicked = Signal()

    def __init__(self):
        super().__init__()
        self.multiline = True
        self.container = None

    
    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

#############################################################################
# EC MDPanel widget class
class ECMDPanelWidget(QTextEdit):
    clicked = Signal()
    
    # Font size configuration - adjust this value to experiment with different sizes
    FONT_SIZE = 12  # Default is typically 9-10, try 12, 14, 16, or 18

    def __init__(self):
        super().__init__()
        self.multiline = True
        self.container = None
        self.setReadOnly(True)  # Make it read-only for preview
        
        # Set the font size
        font = self.font()
        font.setPointSize(self.FONT_SIZE)
        self.setFont(font)

    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

#############################################################################
# EC Listbox widget class
class ECListBoxWidget(QListWidget):
    def __init__(self, text=None):
        super().__init__(text)
    
    def text(self):
        return self.currentItem().text()

#############################################################################
# EC ComboBox widget class
class ECComboBoxWidget(QComboBox):
    def __init__(self, text=None):
        super().__init__(text)
    
    def text(self):
        return self.currentText()

#############################################################################
# EC dialog class
class ECDialogWindow(QDialog):
    clicked = Signal()

    def __init__(self, window):
        super().__init__(window)
        self.multiline = True
        self.container = None
    
    def setContainer(self, container):
        self.container = container

    def mousePressEvent(self, event):
        self.clicked.emit()
        super().mousePressEvent(event)
        if self.container != None: self.container.setClickSource(self)

###############################################################################
class Graphics(Handler):

    def __init__(self, compiler):
        super().__init__(compiler)
        self.blocked = False
        self.runOnTick = 0
        self.vkb = False
        self.flushRunning = False
        self.flushSkipCount = 0
        self.tickBusySkipCount = 0

    def getName(self):
        return 'graphics'
    
    def isCoreWidget(self, object):
        if isinstance(object, dict): object = object['object']
        return isinstance(object, ECCoreWidget)
    
    # Set a graphic element as the value of a record
    def setGraphicElement(self, record, element):
        object = self.getObject(record)
        object.setValue(element)

    def dialogTypes(self):
        return ['confirm', 'lineedit', 'multiline', 'generic']
    
    #############################################################################
    # Keyword handlers

    # (1) add {value} to {widget}
    # (2) add {widget} to {layout}
    # (3) add stretch {widget} to {layout}
    # (4) add stretch to {layout}
    # (5) add spacer [size] {size} to {layout}
    # (6) add {widget} at {col} {row} in {grid layout}
    def k_add(self, command):

        # Add to a layout, group, list or combo box
        def addToLayout():
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                object = self.getObject(record)
                self.checkObjectType(record, (ECLayout, ECGroup, ECListBox, ECComboBox))
                command['target'] = record['name']
                self.add(command)
                return True
            return False
        
        token = self.peek()
        if token == 'stretch':
            self.nextToken()
            # It's either (3) or (4)
            if self.nextIs('to'):
                # (4)
                command['stretch'] = False
                command['widget'] = 'stretch'
                return addToLayout()
            if self.isSymbol():
                # (3)
                record = self.getSymbolRecord()
                command['widget'] = record['name']
                command['stretch'] = True
                if self.nextIs('to'):
                    return addToLayout()
            return False
        
        elif token == 'spacer':
            self.nextToken()
            self.skip('size')
            command['widget'] = 'spacer'
            command['size'] = self.nextValue()
            self.skip('to')
            return addToLayout()

        # Here it's either (1), (2) or (6)
        elif self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWidget):
                # It's either (2), (6) or (1)
                command['widget'] = record['name']
                if self.peek() == 'to':
                    # (2)
                    record = self.getSymbolRecord()
                    domainName = record['domain']
                    if domainName != self.getName():
                        domain = self.program.domainIndex[domainName]
                        handler = domain.keywordHandler('add')
                        return handler(command)
                    self.nextToken()
                    return addToLayout()
                elif self.peek() == 'at':
                    # (6)
                    self.nextToken()
                    command['row'] = self.nextValue()
                    command['col'] = self.nextValue()
                    self.skip('in')
                    return addToLayout()
            else:
                # It's (1) with a non-widget variable
                command['value'] = self.getValue()
                self.skip('to')
                return addToLayout()

        # (1) with a value
        value = self.getValue()
        if value == None: return False
        command['value'] = value
        self.skip('to')
        return addToLayout()
    
    def r_add(self, command):
        if 'value' in command:
            record = self.getVariable(command['target'])
            object = self.getObject(record)
            value = self.textify(command['value'])
            if isinstance(object, ECListBox):
                self.getInnerObject(record).addItem(value)  # type: ignore
            elif isinstance(object, ECComboBox):
                if isinstance(value, list): record['widget'].addItems(value)
                else: self.getInnerObject(record).addItem(value)  # type: ignore
        elif 'row' in command and 'col' in command:
            layout = self.getVariable(command['layout'])['widget']
            record = self.getVariable(command['widget'])
            widget = self.getInnerObject(record)
            row = self.textify(command['row'])
            col = self.textify(command['col'])
            if self.isObjectType(record, ECLayout):
                layout.addLayout(widget, row, col)
            else:
                layout.addWidget(widget, row, col)
        else:
            layoutRecord = self.getVariable(command['target'])
            widget = command['widget']
            if widget == 'stretch':
                self.getInnerObject(layoutRecord).addStretch()  # type: ignore
            elif widget == 'spacer':
                self.getInnerObject(layoutRecord).addSpacing(self.textify(command['size']))  # type: ignore
            else:
                widgetRecord = self.getVariable(widget)
                self.checkObjectType(widgetRecord, ECCoreWidget)
                self.checkObjectType(layoutRecord, ECLayout)
                widget = self.getInnerObject(widgetRecord)
                layout = self.getInnerObject(layoutRecord)
                stretch = 'stretch' in command
                if self.isObjectType(widgetRecord, ECLayout):
                    if self.isObjectType(layoutRecord, ECGroup):
                        if self.isObjectType(widgetRecord, ECLayout):
                            layout.setLayout(widget) # type: ignore
                        else:
                            RuntimeError(self.program, 'Can only add a layout to a group')
                    else:
                        if stretch: layout.addLayout(widget, stretch=1) # type: ignore
                        else:
                            layout.addLayout(widget) # type: ignore
                else:
                    if stretch: layout.addWidget(widget, stretch=1) # type: ignore
                    else:
                        layout.addWidget(widget) # type: ignore
        return self.nextPC()

    # adjust {window}
    def k_adjust(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWindow):
                command['window'] = record['name']
                self.add(command)
                return True
        return False
    
    def r_adjust(self, command):
        object = self.getVariable(command['window'])['object']
        self.checkObjectType(object, ECWindow)
        window = self.getInnerObject(object)
        window.adjustSize()
        return self.nextPC()

    # Center one window on another
    # center {window2} on {window1}
    def k_center(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWindow):
                command['window2'] = record['name']
                self.skip('on')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECWindow):
                        command['window1'] = record['name']
                        self.add(command)
                        return True
        return False
    
    def k_centre(self,command):
        return self.k_center(command)
    
    def r_center(self, command):
        object = self.getVariable(command['window1'])['object']
        self.checkObjectType(object, ECWindow)
        window1 = self.getInnerObject(object)
        object = self.getVariable(command['window2'])['object']
        self.checkObjectType(object, ECWindow)
        window2 = self.getInnerObject(object)
        geo1 = window1.geometry() # type: ignore
        geo2 = window2.geometry() # type: ignore
        geo2.moveCenter(geo1.center())
        window2.setGeometry(geo2) # type: ignore
        return self.nextPC()

    # Declare a checkbox variable
    def k_checkbox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECCheckBox')

    def r_checkbox(self, command):
        return self.nextPC()

    # clear {window/widget}
    def k_clear(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            object = self.getObject(record)
            if object.isCoreClass():
                if object.isClearable():
                    command['name'] = record['name']
                    self.add(command)
                    return True
                raise FatalError(self.compiler, f'The object {record["name"]} is not clearable')
        return False
    
    def r_clear(self, command):

        def clearLayout(layout: QLayout) -> None:
            """Recursively clear all items from a layout."""
            if layout is None:
                return
            while layout.count() > 0:
                item = layout.takeAt(0)
                if item is None:
                    continue
                widget = item.widget()
                if widget is not None:
                    widget.deleteLater()
                elif item.layout() is not None:
                    clearLayout(item.layout())
                    item.layout().deleteLater()

        def clearWidget(widget: QWidget) -> None:
            """Clear all contents from a widget."""
            if widget is None:
                return
            if isinstance(widget, (QListWidget, QComboBox)):
                if isinstance(widget, QListWidget):
                    for i in range(widget.count()):
                        item_widget = widget.itemWidget(widget.item(i))
                        if item_widget:
                            item_widget.deleteLater()
                widget.clear()
                return
            layout = widget.layout()
            if layout is not None:
                clearLayout(layout)
                layout.deleteLater()
            child_widgets = widget.findChildren(QWidget, "", Qt.FindChildOption.FindDirectChildrenOnly)
            for child in child_widgets:
                child.deleteLater()

        element = self.getInnerObject(self.getVariable(command['name']))
        if isinstance(element, QLayout):
            clearLayout(element)  # type: ignore
        else:
            clearWidget(element)  # type: ignore
        return self.nextPC()

    # close {window}
    def k_close(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECWindow):
                command['name'] = record['name']
                self.add(command)
                return True
        return False
    
    def r_close(self, command):
        record = self.getVariable(command['name'])
        window = self.getInnerObject(record)
        self.checkObjectType(window, QMainWindow)
        window.close()  # type: ignore
        return self.nextPC()

    # Declare a combobox variable
    def k_combobox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECComboBox')

    def r_combobox(self, command):
        return self.nextPC()

    # Create a window
    def k_createWindow(self, command):
        title = None
        x = None
        y = None
        w = self.compileConstant(640)
        h = self.compileConstant(480)
        while True:
            token = self.peek()
            if token in ['title', 'at', 'size', 'layout']:
                self.nextToken()
                if token == 'title': title = self.nextValue()
                elif token == 'at':
                    x = self.nextValue()
                    y = self.nextValue()
                elif token == 'size':
                    w = self.nextValue()
                    h = self.nextValue()
                elif token == 'layout':
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECLayout):
                            command['layout'] = record['name']
                else: return False
            else: break
        command['title'] = title
        command['x'] = x
        command['y'] = y
        command['w'] = w
        command['h'] = h
        self.add(command)
        return True

    # Create a widget
    def k_createLayout(self, command):
        self.skip('type')
        command['type'] = self.nextToken()
        self.add(command)
        return True

    def k_createGroupBox(self, command):
        if self.peek() == 'title':
            self.nextToken()
            title = self.nextValue()
        else: title = ''
        command['title'] = title
        self.add(command)
        return True

    def k_createLabel(self, command):
        text = self.compileConstant('')
        while True:
            token = self.peek()
            if token == 'text':
                self.nextToken()
                text = self.nextValue()
            elif token == 'size':
                self.nextToken()
                command['size'] = self.nextValue()
            elif token == 'width':
                self.nextToken()
                command['width'] = self.nextValue()
            elif token == 'expand':
                self.nextToken()
                command['expand'] = True
            elif token == 'align':
                self.nextToken()
                token = self.nextToken()
                if token in ['left', 'right', 'center', 'centre', 'justify']:
                    command['align'] = token
            else: break
        command['text'] = text
        self.add(command)
        return True

    def k_createPushbutton(self, command):
        while True:
            token = self.peek()
            if token == 'text':
                self.nextToken()
                command['text'] = self.nextValue()
            elif token == 'icon':
                self.nextToken()
                command['icon'] = self.nextValue()
            elif token == 'size':
                self.nextToken()
                command['size'] = self.nextValue()
            else: break
        self.add(command)
        return True

    def k_createCheckBox(self, command):
        if self.peek() == 'text':
            self.nextToken()
            text = self.nextValue()
        else: text = self.compileConstant('')
        command['text'] = text
        self.add(command)
        return True

    def k_createLineEdit(self, command):
        text = self.compileConstant('')
        size = self.compileConstant(40)
        while True:
            token = self.peek()
            if token == 'text':
                self.nextToken()
                text = self.nextValue()
            elif token == 'size':
                self.nextToken()
                size = self.nextValue()
            else: break;
        command['size'] = size
        command['text'] = text
        self.add(command)
        return True

    def k_createMultiLineEdit(self, command):
        while True:
            next = self.peek()
            if next == 'cols':
                self.nextToken()
                command['cols'] = self.nextValue()
            elif next == 'rows':
                self.nextToken()
                command['rows'] = self.nextValue()
            else: break;
        self.add(command)
        return True

    def k_createMDPanel(self, command):
        while True:
            next = self.peek()
            if next == 'cols':
                self.nextToken()
                command['cols'] = self.nextValue()
            elif next == 'rows':
                self.nextToken()
                command['rows'] = self.nextValue()
            else: break;
        self.add(command)
        return True

    def k_createListBox(self, command):
        self.add(command)
        return True

    def k_createComboBox(self, command):
        self.add(command)
        return True

    def k_createPanel(self, command):
        self.add(command)
        return True

    def k_createDialog(self, command):
        if self.peek() == 'on':
            self.nextToken()
            if self.nextIsSymbol():
                command['window'] = self.getSymbolRecord()['name']
        else: command['window'] = None
        while True:
            if self.peek() == 'type':
                self.nextToken()
                dialogType = self.nextToken()
                if dialogType in self.dialogTypes(): command['type'] = dialogType
                else: return False
            elif self.peek() == 'title':
                self.nextToken()
                command['title'] = self.nextValue()
            elif self.peek() == 'prompt':
                self.nextToken()
                command['prompt'] =  self.nextValue()
            elif self.peek() == 'value':
                self.nextToken()
                command['value'] =  self.nextValue()
            elif self.peek() == 'with':
                self.nextToken()
                command['layout'] =  self.nextToken()
            else: break
        if not 'title' in command: command['title'] = self.compileConstant('')
        if not 'value' in command: command['value'] = self.compileConstant('')
        if not 'prompt' in command: command['prompt'] = self.compileConstant('')
        self.add(command)
        return True

    def k_createMessageBox(self, command):
        if self.peek() == 'on':
            self.nextToken()
            if self.nextIsSymbol():
                command['window'] = self.getSymbolRecord()['name']
        else: command['window'] = None
        style = 'question'
        title = ''
        message = ''
        while True:
            if self.peek() == 'style':
                self.nextToken()
                style = self.nextToken()
            elif self.peek() == 'title':
                self.nextToken()
                title = self.nextValue()
            elif self.peek() == 'message':
                self.nextToken()
                message = self.nextValue()
            else: break
        command['style'] = style
        command['title'] = title
        command['message'] = message
        self.add(command)
        return True

    def k_create(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            command['name'] = record['name']
            keyword = record['keyword']
            if keyword == 'window': return self.k_createWindow(command)
            elif keyword == 'layout': return self.k_createLayout(command)
            elif keyword == 'group': return self.k_createGroupBox(command)
            elif keyword == 'label': return self.k_createLabel(command)
            elif keyword == 'pushbutton': return self.k_createPushbutton(command)
            elif keyword == 'checkbox': return self.k_createCheckBox(command)
            elif keyword == 'lineinput': return self.k_createLineEdit(command)
            elif keyword == 'multiline': return self.k_createMultiLineEdit(command)
            elif keyword == 'mdpanel': return self.k_createMDPanel(command)
            elif keyword == 'listbox': return self.k_createListBox(command)
            elif keyword == 'combobox': return self.k_createComboBox(command)
            elif keyword == 'panel': return self.k_createPanel(command)
            elif keyword == 'dialog': return self.k_createDialog(command)
            elif keyword == 'messagebox': return self.k_createMessageBox(command)
        return False
    
    def r_createWindow(self, command, record):
        window = QMainWindow()
        title = self.textify(command['title'])
        if title == None: title = 'EasyCoder Main Window'
        window.setWindowTitle(title)
        w = self.textify(command['w'])
        h = self.textify(command['h'])
        x = command['x']
        y = command['y']
        if hasattr(self.program, 'screenWidth'): screenWidth = self.program.screenWidth
        else: screenWidth = self.program.parent.program.screenWidth
        if hasattr(self.program, 'screenHeight'): screenHeight = self.program.screenHeight
        else: screenHeight = self.program.parent.program.screenHeight
        if x == None: x = (screenWidth - w) / 2
        else: x = self.textify(x)
        if y == None: y = (screenHeight - h) / 2
        else: y = self.textify(x)
        window.setGeometry(x, y, w, h)
        self.setGraphicElement(record, window)
        return self.nextPC()
    
    def r_createLayout(self, command, record):
        layoutType = command['type']
        if layoutType == 'QHBoxLayout': layout = QHBoxLayout()
        elif layoutType == 'QGridLayout': layout = QGridLayout()
        elif layoutType == 'QStackedLayout': layout = QStackedLayout()
        else: layout = QVBoxLayout()
        layout.setContentsMargins(5,0,5,0)
        self.setGraphicElement(record, layout)
        return self.nextPC()
    
    def r_createGroupBox(self, command, record):
        group = QGroupBox(self.textify(command['title']))
        group.setAlignment(Qt.AlignmentFlag.AlignLeft)
        self.setGraphicElement(record, group)
        return self.nextPC()
    
    def r_createLabel(self, command, record):
        label = ECLabelWidget(str(self.textify(command['text'])))
        if 'size' in command:
            fm = label.fontMetrics()
            c = label.contentsMargins()
            w = fm.horizontalAdvance('m') * self.textify(command['size']) +c.left()+c.right()
            label.setMaximumWidth(w)
        if 'width' in command:
            label.setFixedWidth(self.textify(command['width']))
        if 'align' in command:
            alignment = command['align']
            if alignment == 'left': label.setAlignment(Qt.AlignmentFlag.AlignLeft)
            elif alignment == 'right': label.setAlignment(Qt.AlignmentFlag.AlignRight)
            elif alignment in ['center', 'centre']: label.setAlignment(Qt.AlignmentFlag.AlignHCenter)
            elif alignment == 'justify': label.setAlignment(Qt.AlignmentFlag.AlignJustify)
        if 'expand' in command:
            label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)
        self.setGraphicElement(record, label)
        return self.nextPC()
    
    def r_createPushbutton(self, command, record):
        if 'size' in command:
            size = self.textify(command['size'])
        else: size = None
        if 'icon' in command:
            iconPath = self.textify(command['icon'])
            pixmap = QPixmap(iconPath)
            if pixmap.isNull():
                RuntimeError(self.program, f'Icon not found: {iconPath}')
            icon = pixmap.scaledToHeight(size if size != None else 24, Qt.TransformationMode.SmoothTransformation)
            pushbutton = ECPushButtonWidget()
            pushbutton.setIcon(icon) # type: ignore
            pushbutton.setIconSize(icon.size()) # type: ignore
        elif 'text' in command:
            text = self.textify(command['text'])
            pushbutton = ECPushButtonWidget(text)
            pushbutton.setAccessibleName(text)
            if size != None:
                fm = pushbutton.fontMetrics()
                c = pushbutton.contentsMargins()
                w = fm.horizontalAdvance('m') * self.textify(command['size']) + c.left()+c.right()
                pushbutton.setMaximumWidth(w)
        self.putSymbolValue(record, pushbutton)
        self.setGraphicElement(record, pushbutton)
        return self.nextPC()
    
    def r_createCheckBox(self, command, record):
        checkbox = ECCheckBoxWidget(self.textify(command['text']))
        checkbox.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Preferred)
        self.setGraphicElement(record, checkbox)
        return self.nextPC()
    
    def r_createLineEdit(self, command, record):
        lineinput = ECLineEditWidget()
        text = self.textify(command['text'])
        lineinput.setText(str(text))
        fm = lineinput.fontMetrics()
        m = lineinput.textMargins()
        c = lineinput.contentsMargins()
        w = fm.horizontalAdvance('x') * self.textify(command['size']) +m.left()+m.right()+c.left()+c.right()
        lineinput.setMaximumWidth(w)
        self.setGraphicElement(record, lineinput)
        return self.nextPC()
    
    def r_createMultiLineEdit(self, command, record):
        textinput = ECPlainTextEditWidget()
        if 'cols' in command and 'rows' in command:
            fontMetrics = textinput.fontMetrics()
            charWidth = fontMetrics.horizontalAdvance('x')
            charHeight = fontMetrics.height()
            textinput.setFixedWidth(charWidth * self.textify(command['cols']))
            textinput.setFixedHeight(charHeight * self.textify(command['rows']))
        else:
            textinput.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, textinput)
        return self.nextPC()
    
    def r_createMDPanel(self, command, record):
        preview = ECMDPanelWidget()
        if 'cols' in command and 'rows' in command:
            fontMetrics = preview.fontMetrics()
            charWidth = fontMetrics.horizontalAdvance('x')
            charHeight = fontMetrics.height()
            preview.setFixedWidth(charWidth * self.textify(command['cols']))
            preview.setFixedHeight(charHeight * self.textify(command['rows']))
        else:
            preview.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setGraphicElement(record, preview)
        return self.nextPC()
    
    def r_createListWidget(self, command, record):
        listwidget = ECListBoxWidget()
        self.setGraphicElement(record, listwidget)
        return self.nextPC()
    
    def r_createComboBox(self, command, record):
        combobox = ECComboBoxWidget()
        self.setGraphicElement(record, combobox)
        return self.nextPC()
    
    def r_createPanel(self, command, record):
        self.setGraphicElement(record, QWidget())
        return self.nextPC()
    
    def r_createDialog(self, command, record):

        # This is probably not needed anymore
        class ECDialogX(QDialog):
            def __init__(self, parent, record):
                super().__init__(parent)
                self.record = record
            
            def showEvent(self, event):
                super().showEvent(event)
                QTimer.singleShot(100, self.afterShown)
            
            def afterShown(self):
                if 'action' in self.record: self.record['action']()

        win = command['window']
        if win != None:
            win = self.getInnerObject(self.getVariable(win))
        dialog = ECDialogWindow(win)
        dialogType = command['type'].lower()
        dialog.dialogType = dialogType  # type: ignore
        mainLayout = QVBoxLayout(dialog)
        if dialogType == 'generic':
            dialog.setFixedWidth(500)
            dialog.setFixedHeight(500)
            dialog.setWindowFlags(Qt.WindowType.FramelessWindowHint)
            dialog.setModal(True)
            dialog.setStyleSheet('background-color: white;border:1px solid black;')

            border = Border()
            border.tickClicked.connect(dialog.accept)
            border.closeClicked.connect(dialog.reject)
            mainLayout.addWidget(border)
            if 'layout' in command:
                layout = self.getVariable(command['layout'])['widget']
                mainLayout.addLayout(layout)
            dialog.setLayout(mainLayout)
        else:
            dialog.setWindowTitle(self.textify(command['title']))
            prompt = self.textify(command['prompt'])
            if dialogType == 'confirm':
                mainLayout.addWidget(ECLabelWidget(prompt))
            elif dialogType == 'lineedit':
                mainLayout.addWidget(ECLabelWidget(prompt))
                dialog.lineEdit = self.ECLineEdit(dialog)  # type: ignore
                dialog.value = self.textify(command['value'])  # type: ignore
                dialog.lineEdit.setText(dialog.value)  # type: ignore
                mainLayout.addWidget(dialog.lineEdit)  # type: ignore
            elif dialogType == 'multiline':
                mainLayout.addWidget(ECLabelWidget(prompt))
                dialog.textEdit = self.ECPlainTextEdit(dialog)  # type: ignore
                dialog.textEdit.setText(dialog.value)  # type: ignore
                mainLayout.addWidget(dialog.textEdit)  # type: ignore
            buttonBox = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
            buttonBox.accepted.connect(dialog.accept)
            buttonBox.rejected.connect(dialog.reject)
            mainLayout.addWidget(buttonBox, alignment=Qt.AlignmentFlag.AlignHCenter)
            
        self.setGraphicElement(record, dialog)
        return self.nextPC()
    
    # Creates a message box but doesn't run it
    def r_createMessageBox(self, command, record):
        record['window'] = command['window']
        record['style'] = command['style']
        record['title'] = self.textify(command['title'])
        record['message'] = self.textify(command['message'])
        return self.nextPC()

    def r_create(self, command):
        record = self.getVariable(command['name'])
        keyword = record['keyword']
        if keyword == 'window': return self.r_createWindow(command, record)
        elif keyword == 'layout': return self.r_createLayout(command, record)
        elif keyword == 'group': return self.r_createGroupBox(command, record)
        elif keyword == 'label': return self.r_createLabel(command, record)
        elif keyword == 'pushbutton': return self.r_createPushbutton(command, record)
        elif keyword == 'checkbox': return self.r_createCheckBox(command, record)
        elif keyword == 'lineinput': return self.r_createLineEdit(command, record)
        elif keyword == 'multiline': return self.r_createMultiLineEdit(command, record)
        elif keyword == 'mdpanel': return self.r_createMDPanel(command, record)
        elif keyword == 'listbox': return self.r_createListWidget(command, record)
        elif keyword == 'combobox': return self.r_createComboBox(command, record)
        elif keyword == 'panel': return self.r_createPanel(command, record)
        elif keyword == 'dialog': return self.r_createDialog(command, record)
        elif keyword == 'messagebox': return self.r_createMessageBox(command, record)
        return None

    # Declare a dialog variable
    def k_dialog(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECDialog')

    def r_dialog(self, command):
        return self.nextPC()

    # Disable a widget
    def k_disable(self, command):
        if self.nextIsSymbol():
            command['name'] = self.getSymbolRecord()['name']
            self.add(command)
            return True
        return False
    
    def r_disable(self, command):
        self.getInnerObject(self.getVariable(command['name'])).setEnabled(False)  # type: ignore
        return self.nextPC()

    # Enable a widget
    def k_enable(self, command):
        if self.nextIsSymbol():
            command['name'] = self.getSymbolRecord()['name']
            self.add(command)
            return True
        return False
    
    def r_enable(self, command):
        self.getInnerObject(self.getVariable(command['name'])).setEnabled(True)  # type: ignore
        return self.nextPC()

    # Create a group box
    def k_group(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECGroup')

    def r_group(self, command):
        return self.nextPC()

    # hide {widget}
    def k_hide(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECCoreWidget):
                command['domain'] = record['domain']
                command['widget'] = record['name']
                self.add(command)
                return True
        return False
        
    def r_hide(self, command):
        record = self.getVariable(command['widget'])
        self.getInnerObject(record).hide()  # type: ignore
        return self.nextPC()

    # Initialize the graphics environment
    def k_init(self, command):
        if self.nextIs('graphics'):
            self.add(command)
            return True
        return False
    
    def r_init(self, command):
        print('Initializing graphics...')
        # Check if QApplication already exists (created by debugger)
        from PySide6.QtWidgets import QApplication
        self.app = QApplication.instance()
        if self.app is None:
            self.app = QApplication(sys.argv)
        screen = QApplication.screens()[0].size().toTuple()
        self.program.screenWidth = screen[0]  # type: ignore
        self.program.screenHeight = screen[1]  # type: ignore
        print(f'Screen: {self.program.screenWidth}x{self.program.screenHeight}')
        
        def on_last_window_closed():
            self.program.kill()
        def init():
            try:
                self.program.flush(self.nextPC())
            except Exception as e:
                pass
        def flush():
            if self.flushRunning:
                self.flushSkipCount += 1
                if self.flushSkipCount % 100 == 0:
                    print(f'Graphics flush skipped {self.flushSkipCount} times (flush still running)')
                return
            self.flushRunning = True
            try:
                if not self.blocked:
                    if self.runOnTick != 0:
                        if not self.program.running:
                            print('Call on tick handler...')
                            self.program.run(self.runOnTick)
                        else:
                            self.tickBusySkipCount += 1
                            if self.tickBusySkipCount % 100 == 0:
                                print(f'Graphics tick skipped {self.tickBusySkipCount} times (program busy)')
                    self.program.flushCB()
            finally:
                self.flushRunning = False
        timer = QTimer()
        timer.timeout.connect(flush)
        # Adjust this for optimal performace.
        # Too small and it may hang; too large and it may feel unresponsive
        # The value needed will also depend on CPU performace
        timer.start(250) # 0.25 sec interval
        QTimer.singleShot(500, init)
        self.program.startGraphics()
        
        # If debugger already exists (debugging mode), don't create another one
        # and don't call exec() as the debugger's event loop is already running
        if self.program.debugging and self.program.debugger is None:
            print('Starting debugger...')
            self.program.debugger = Debugger(self.program)
            self.program.debugger.enableBreakpoints()
        
        self.app.lastWindowClosed.connect(on_last_window_closed)  # type: ignore
        
        # Only call exec() if debugger is not running (i.e., not in debug mode)
        # When debugger exists, it manages the event loop
        if self.program.debugger is None:
            self.app.exec()
        else:
            # In debug mode, return control to debugger
            return self.nextPC()

    # Declare a label variable
    def k_label(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLabel')
    def r_label(self, command):
        return self.nextPC()

    # Declare a layout variable
    def k_layout(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLayout')

    def r_layout(self, command):
        return self.nextPC()

    # Declare a line input variable
    def k_lineinput(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECLineInput')

    def r_lineinput(self, command):
        return self.nextPC()

    # Declare a listbox input variable
    def k_listbox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECListBox')

    def r_listbox(self, command):
        return self.nextPC()

    # Declare a messagebox variable
    def k_messagebox(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECMessageBox')

    def r_messagebox(self, command):
        return self.nextPC()

    # Declare a multiline input variable
    def k_multiline(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECMultiline')
    def r_multiline(self, command):
        return self.nextPC()

    # markdown preview {variable}
    def k_mdpanel(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECMDPanel')

    def r_mdpanel(self, command):
        return self.nextPC()

    # on click/tap {pushbutton}/{lineinput}/{multiline}
    # on select {combobox}/{listbox}
    # on tick
    def k_on(self, command):
        def setupOn():
            command['goto'] = self.getCodeSize() + 2
            self.add(command)
            self.nextToken()
            # Step over the click handler
            pcNext = self.getCodeSize()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.add(cmd)
            # This is the click handler
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.add(cmd)
            # Fixup the goto
            self.getCommandAt(pcNext)['goto'] = self.getCodeSize()

        token = self.nextToken()
        command['type'] = token
        if token in ['click', 'tap']:
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if isinstance(self.getObject(record), ECWidget):
                    command['domain'] = record['domain']
                    command['name'] = record['name']
                    setupOn()
                    return True
        elif token == 'select':
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if isinstance(self.getObject(record), ECCoreWidget):
                    command['name'] = record['name']
                    setupOn()
                    return True
        elif token == 'tick':
            command['tick'] = True
            command['runOnTick'] = self.getCodeSize() + 2
            self.add(command)
            self.nextToken()
            # Step over the on tick action
            pcNext = self.getCodeSize()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'gotoPC'
            cmd['goto'] = 0
            cmd['debug'] = False
            self.add(cmd)
            # This is the on tick handler
            self.compileOne()
            cmd = {}
            cmd['domain'] = 'core'
            cmd['lino'] = command['lino']
            cmd['keyword'] = 'stop'
            cmd['debug'] = False
            self.add(cmd)
            # Fixup the goto
            self.getCommandAt(pcNext)['goto'] = self.getCodeSize()
            return True
        return False
    
    def r_on(self, command):
        if command['type'] == 'tick':
            self.runOnTick = command['runOnTick']
        else:
            record = self.getVariable(command['name'])
            object = self.getObject(record)
            goto = command['goto']
            
            # Connect the current element to a handler
            current_index = object.getIndex()
            widget = self.getInnerObject(object)
            
            # Create a closure to capture the current index
            def make_handler(index):
                def handler():
                    print(f'Event triggered for {record["name"]}, index: {index}')
                    object.setIndex(index)
                    self.run(goto)
                    flush()
                return handler
            
            # Connect based on widget type
            if self.isObjectType(record, ECPushButton):
                widget.clicked.connect(make_handler(current_index))
            elif self.isObjectType(record, ECComboBox):
                widget.currentIndexChanged.connect(make_handler(current_index))
            elif self.isObjectType(record, ECListBox):
                widget.itemClicked.connect(make_handler(current_index))
        return self.nextPC()

    # Declare a simple panel variable
    def k_panel(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECPanel')

    def r_panel(self, command):
        return self.nextPC()

    # Declare a pushbutton variable
    def k_pushbutton(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECPushButton')

    def r_pushbutton(self, command):
        return self.nextPC()

    # remove [the] [current/selected] [item] [from/in] {combobox}/{listbox}
    # Graphics-reserved syntax: optional article pattern is plugin-safe (core-only command)
    def k_remove(self, command):
        command['variant'] = None
        self.skipArticles()  # Optional 'the', 'a', 'an' — syntactic sugar
        self.skip(['current', 'selected'])
        self.skip('item')
        self.skip(['from', 'in'])
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECComboBox):
                command['variant'] = 'current'
                command['name'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECListBox):
                command['variant'] = 'current'
                command['name'] = record['name']
                self.add(command)
                return True
        return False
        
    def r_remove(self, command):
        variant = command['variant']
        record = self.getVariable(command['name'])
        if variant == 'current':
            if self.isObjectType(record, ECComboBox):
                widget = self.getInnerObject(record)
                widget.removeItem(widget.currentIndex())  # type: ignore
            if self.isObjectType(record, ECListBox):
                widget = self.getInnerObject(record)
                selectedItem = widget.currentItem()  # type: ignore
                if selectedItem:
                    row = widget.row(selectedItem)  # type: ignore
                    widget.takeItem(row)  # type: ignore
        return self.nextPC()

    # select index {n} [of] {combobox]}
    # select {name} [in] {combobox}
    def k_select(self, command):
        if self.nextIs('index'):
            command['index'] = self.nextValue()
            self.skip('of')
        else:
            command['name'] = self.getValue()
            self.skip('in')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECComboBox):
                command['widget'] = record['name']
                self.add(command)
                return True
        return False
    
    def r_select(self, command):
        widget = self.getInnerObject(self.getVariable(command['widget']))
        if 'index' in command:
            index = self.textify(command['index'])
        else:
            name = self.textify(command['name'])
            index = widget.findText(name, Qt.MatchFlag.MatchFixedString)  # type: ignore
        if index >= 0:
            widget.setCurrentIndex(index)  # type: ignore
        return self.nextPC()

    # set [the] width/height [of] {widget} [to] {value}
    # set [the] layout of {window}/{widget} to {layout}
    # set [the] spacing of {layout} to {value}
    # set [the] text [of] {label}/{button}/{lineinput}/{multiline} [to] {text}
    # set [the] color [of] {label}/{button}/{lineinput}/{multiline} [to] {color}
    # set [the] state [of] {checkbox} [to] {state}
    # set [the] style of {widget} to {style}
    # set {listbox} to {list}
    # set blocked true/false
    def k_set(self, command):
        self.skipArticles()  # Optional 'the', 'a', 'an' — syntactic sugar for readability
        token = self.nextToken()
        command['what'] = token
        if token in ['width', 'height']:
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECCoreWidget):
                    command['domain'] = record['domain']
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'size':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWindow):
                    command['name'] = record['name']
                    self.skip('to')
                    command['width'] = self.nextValue()
                    command['height'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'layout':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECWindow, ECGroup, ECPanel)):
                    command['name'] = record['name']
                    self.skip('to')
                    if self.nextIsSymbol():
                        record = self.getSymbolRecord()
                        if self.isObjectType(record, ECLayout):
                            command['layout'] = record['name']
                            self.add(command)
                            return True
        elif token == 'spacing':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECLayout):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'text':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECLabel, ECPushButton, ECLineInput, ECMultiline, ECMDPanel)):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'state':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECCheckBox):
                    command['name'] = record['name']
                    self.skip('to')
                    if self.peek() == 'checked':
                        command['value'] = self.compileConstant(True)
                        self.nextToken()
                    elif self.peek() == 'unchecked':
                        command['value'] = self.compileConstant(False)
                        self.nextToken()
                    else: command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'style':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWidget):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'alignment':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECWidget):
                    command['name'] = record['name']
                    self.skip('to')
                    flags = []
                    while self.peek() in ['left', 'hcenter', 'right', 'top', 'vcenter', 'bottom', 'center']:
                        flags.append(self.nextToken())
                    command['value'] = flags
                    self.add(command)
                    return True
        elif token == 'style':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECLabel):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'color':
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, ECLabel):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'background':
            self.skip('color')
            self.skip('of')
            if self.nextIsSymbol():
                record = self.getSymbolRecord()
                if self.isObjectType(record, (ECLabel, ECPushButton, ECLineInput, ECMultiline)):
                    command['name'] = record['name']
                    self.skip('to')
                    command['value'] = self.nextValue()
                    self.add(command)
                    return True
        elif token == 'blocked':
            self.blocked = True if self.nextToken() == 'true' else False
            return True
        elif self.isSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECListBox):
                command['what'] = 'listbox'
                command['name'] = record['name']
                self.skip('to')
                command['value'] = self.nextValue()
                self.add(command)
                return True
        return False
    
    def r_set(self, command):
        what = command['what']
        if what == 'height':
            widget = self.getInnerObject(self.getVariable(command['name']))
            widget.setFixedHeight(self.textify(command['value']))  # type: ignore
        elif what == 'width':
            widget = self.getInnerObject(self.getVariable(command['name']))
            widget.setFixedWidth(self.textify(command['value']))  # type: ignore
        elif what == 'size':
            window = self.getInnerObject(self.getVariable(command['name']))
            window.resize(self.textify(command['width']), self.textify(command['height']))  # type: ignore
        elif what == 'layout':
            target = self.getVariable(command['name'])
            object = target['object']
            layoutObject = self.getVariable(command['layout'])['object']
            self.checkObjectType(layoutObject, ECLayout)
            layout = self.getInnerObject(layoutObject)
            if isinstance(object, ECWindow):
                window = self.getInnerObject(object)
                container = QWidget()
                container.setLayout(layout) # type: ignore
                self.getInnerObject(object).setCentralWidget(container) # type: ignore
            elif isinstance(object, (ECLayout, ECGroup, ECPanel)):
                self.getInnerObject(object).setLayout(layout)  # type: ignore
        elif what == 'spacing':
            layout = self.getInnerObject(self.getVariable(command['name']))
            layout.setSpacing(self.textify(command['value']))  # type: ignore
        elif what == 'text':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            text = self.textify(command['value'])
            if self.isObjectType(record, (ECLabel, ECPushButton)):
                widget.setText(str(text))  # type: ignore
            elif self.isObjectType(record, ECMultiline):
                widget.setPlainText(str(text))  # type: ignore
            elif self.isObjectType(record, ECMDPanel):
                widget.setMarkdown(str(text))  # type: ignore
            if self.isObjectType(record, ECPushButton):
                widget.setAccessibleName(str(text))  # type: ignore
        elif what == 'state':
            record = self.getVariable(command['name'])
            if self.isObjectType(record, ECCheckBox):
                state = self.textify(command['value'])
                state = False if state == None else True
                self.getInnerObject(record).setChecked(state)  # type: ignore
        elif what == 'alignment':
            widget = self.getVariable(command['name'])['widget']
            flags = command['value']
            alignment = 0
            for flag in flags:
                if flag == 'left': alignment |= Qt.AlignmentFlag.AlignLeft
                elif flag == 'hcenter': alignment |= Qt.AlignmentFlag.AlignHCenter
                elif flag == 'right': alignment |= Qt.AlignmentFlag.AlignRight
                elif flag == 'top': alignment |= Qt.AlignmentFlag.AlignTop
                elif flag == 'vcenter': alignment |= Qt.AlignmentFlag.AlignVCenter
                elif flag == 'bottom': alignment |= Qt.AlignmentFlag.AlignBottom
                elif flag == 'center': alignment |= Qt.AlignmentFlag.AlignCenter
            widget.setAlignment(alignment)
        elif what == 'style':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            styles = self.textify(command['value'])
            widget.setStyleSheet(styles)  # type: ignore
        elif what == 'color':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            color = self.textify(command['value'])
            widget.setStyleSheet(f"color: {color};")  # type: ignore
        elif what == 'background-color':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            bg_color = self.textify(command['value'])
            widget.setStyleSheet(f"background-color: {bg_color};")  # type: ignore
        elif what == 'listbox':
            record = self.getVariable(command['name'])
            widget = self.getInnerObject(record)
            value = self.textify(command['value'])
            widget.clear()  # type: ignore
            widget.addItems(value)  # type: ignore
        return self.nextPC()

    # show {window}
    # show {dialog}
    # show {widget}
    # show {messagebox} giving {result}}
    def k_show(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECCoreWidget):
                command['domain'] = record['domain']
                command['name'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECWindow):
                command['window'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECDialog):
                command['dialog'] = record['name']
                self.add(command)
                return True
            elif self.isObjectType(record, ECMessageBox):
                command['messagebox'] = record['name']
                self.skip('giving')
                if self.nextIsSymbol():
                    command['result'] = self.getSymbolRecord()['name']
                    self.add(command)
                    return True
        return False
        
    def r_show(self, command):
        if 'messagebox' in command:
            record = self.getVariable(command['messagebox'])
            windowRecord = self.getVariable(record['window'])
            window = self.getInnerObject(windowRecord)
            style = record['style']
            title = record['title']
            message = record['message']
            target = self.getVariable(command['result'])
            if style == 'question':
                choice = QMessageBox.question(window, title, message)
                result = 'Yes' if choice == QMessageBox.StandardButton.Yes else 'No'
            elif style == 'yesnocancel':
                choice = QMessageBox.question(
                    window, 
                    title, 
                    message,
                    QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No | QMessageBox.StandardButton.Cancel
                )
                if choice == QMessageBox.StandardButton.Yes: 
                    result = 'Yes'
                elif choice == QMessageBox.StandardButton.No:
                    result = 'No'
                else:
                    result = 'Cancel'
            elif style == 'warning':
                choice = QMessageBox.warning(window, title, message)
                if choice == QMessageBox.StandardButton.Ok: result = 'OK'
                else: result = ''
            else: result = 'Cancel'
            v = ECValue(domain='graphics', type=str, content=result)
            self.putSymbolValue(target, v)
        elif 'window' in command:
            window = self.getInnerObject(self.getVariable(command['window'])['object'])
            window.show() # type: ignore
        elif 'dialog' in command:
            record = self.getVariable(command['dialog'])
            object = self.getObject(record)
            dialog = self.getInnerObject(record)
            if dialog.dialogType == 'generic':
                object.result =  dialog.exec()
            elif dialog.dialogType == 'confirm':
                object.result = True if dialog.exec() == QDialog.DialogCode.Accepted else False
            elif dialog.dialogType == 'lineedit':
                if dialog.exec() == QDialog.DialogCode.Accepted:
                    object.result = dialog.lineEdit.text()  # type: ignore
                else: object.result = dialog.value  # type: ignore
            elif dialog.dialogType == 'multiline':
                if dialog.exec() == QDialog.DialogCode.Accepted:
                    object.result = dialog.textEdit.toPlainText()  # type: ignore
                else: object.result = dialog.value  # type: ignore
        elif 'name' in command:
            record = self.getVariable(command['name'])
            self.getInnerObject(record).show()  # type: ignore
        return self.nextPC()

    # Declare a window variable
    def k_window(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECWindow')

    def r_window(self, command):
        return self.nextPC()
    
    #############################################################################
    # Compile a value in this domain
    def compileValue(self):
        value = ECValue(domain=self.getName())
        token = self.getToken()
        if self.isSymbol():
            value.setName(token)
            record = self.getSymbolRecord()
            object = self.getObject(record)
            if isinstance(object, ECCoreWidget) and object.hasRuntimeValue():
                value.setType('object')
                return value
            else: return None
        else:
            if self.tokenIs('the'): token = self.nextToken()
            value.setType(token)
            if token in ['count', 'current', 'selected']:
                value.setType(token)
                if token == 'count':
                    self.skip('of')
                elif token in ['current', 'selected']:
                    token = self.nextToken()
                    value.option = token
                    if token == 'item': self.skip('in')
                    elif token == 'index': self.skip('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECListBox) or self.isObjectType(record, ECComboBox): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token == 'count':
                self.skip('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECListBox) or self.isObjectType(record, ECComboBox): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token == 'text':
                self.skip('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if (
                        self.isObjectType(record, (ECLabel, ECPushButton, ECMultiline, ECLineInput))
                    ): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token == 'index':
                self.skip('of')
                value.element = self.getValue()
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, (ECListBox, ECComboBox)): # type: ignore
                        value.setContent(ECValue(domain=self.getName(), type='object', name=record['name']))
                        return value
            elif token in ['width', 'height']:
                self.skip('of')
                if self.nextIsSymbol():
                    record = self.getSymbolRecord()
                    if self.isObjectType(record, ECWindow): # type: ignore
                        value.target = record['name']
                        return value
        return None

    #############################################################################
    # Modify a value or leave it unchanged.
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    # This is used by the expression evaluator to get the value of a symbol
    def v_symbol(self, record):
        record = self.getVariable(record['name'])
        keyword = record['keyword']
        if self.isObjectType(record, ECPushButton):
            pushbutton = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=pushbutton.accessibleName())
            return v
        elif self.isObjectType(record, ECLineInput):
            lineinput = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=lineinput.displayText())
            return v
        elif self.isObjectType(record, ECMultiline):
            multiline = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=multiline.toPlainText())
            return v
        elif self.isObjectType(record, ECComboBox):
            combobox = self.getInnerObject(record)
            v = ECValue(domain=self.getName(), type=str, content=combobox.currentText())
            return v
        elif self.isObjectType(record, ECListBox):
            listbox = self.getInnerObject(record)
            content = listbox.currentItem().text()  # type: ignore
            v = ECValue(domain=self.getName(), type=str, content=content)
            return v
        elif self.isObjectType(record, ECCheckBox):
            checkbox = self.getInnerObject(record)
            content = checkbox.isChecked()  # type: ignore
            v = ECValue(domain=self.getName(), type=bool, content=content)
            return v
        elif self.isObjectType(record, ECDialog):
            content = record['result']
            v = ECValue(domain=self.getName(), type=str, content=content)
            return v
        return None

    def v_count(self, v):
        content = v.getContent()
        if isinstance(content, ECValue) and content.getType() == 'object':
            record = self.getVariable(content.getName())
            object = self.getObject(record)
            if isinstance(object, (ECListBox, ECComboBox)):
                widget = self.getInnerObject(object)
                value = widget.count()  # type: ignore
                return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
            else: raise RuntimeError(self.program, f"Object is not a listbox or combobox")

    def v_current(self, v):
        content = v.getContent()
        if isinstance(content, ECValue) and content.getType() == 'object':
            record = self.getVariable(content.getName())
            object = self.getObject(record)
            option = v.option
            if isinstance(object, (ECListBox)):
                if option == 'item':
                    content = object.getText()  # type: ignore
                elif option == 'index':
                    content = object.getIndex()  # type: ignore
                return ECValue(domain=self.getName(), type=int, content=content)
            elif isinstance(object, (ECComboBox)):
                content = str(object.currentText())  # type: ignore
                return ECValue(domain=self.getName(), type=int, content=content)
            else: raise RuntimeError(self.program, f"Object is not a listbox or combobox")
    
    def v_element(self, v):
        return v.getContent()
    
    def v_empty(self, v):
        if v.type == 'object':
            record = self.getVariable(v.getName())
            object = self.getObject(record)
            value = object.isEmpty()
            return ECValue(domain=self.getName(), type=bool, content=value)  # type: ignore
        return None
    
    def v_height(self, v):
        targetName = v.target
        record = self.getVariable(targetName)
        object = self.getObject(record)
        if isinstance(object, ECWindow):
            widget = self.getInnerObject(object)
            value = widget.height()  # type: ignore
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
        return None

    def v_selected(self, v): return self.v_current(v)

    def v_text(self, v):
        content = v.getContent()
        if isinstance(content, ECValue) and content.getType() == 'object':
            record = self.getVariable(content.getName())
            object = self.getObject(record)
            value = object.getText()
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
    
    def v_width(self, v):
        targetName = v.target
        record = self.getVariable(targetName)
        object = self.getObject(record)
        if isinstance(object, ECWindow):
            widget = self.getInnerObject(object)
            value = widget.width()  # type: ignore
            return ECValue(domain=self.getName(), type=int, content=value)  # type: ignore
        return None

    #############################################################################
	# Get the value of an unknown item
    def getUnknownValue(self, value):
        if self.isObjectType(value, (ECLabelWidget, ECPushButtonWidget, ECLineEditWidget, ECListBoxWidget, ECComboBoxWidget)):
            return value.text()  # type: ignore
        if self.isObjectType(value, (ECPlainTextEditWidget, ECMDPanelWidget)):
            return value.toPlainText()  # type: ignore
        if self.isObjectType(value, (ECCheckBoxWidget)):
            return value.isChecked()  # type: ignore
        if self.isObjectType(value, (ECDialogWindow)): 
            return value.result()  # type: ignore
        return None # Unable to get value

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        condition = ECValue()
        condition.negate = False # type: ignore
        return None

    #############################################################################
    # Condition handlers

    #############################################################################
    # Force the application to exit
    def force_exit(self):
        QApplication.quit()  # Gracefully close the application
        sys.exit(0)          # Force a complete system exit
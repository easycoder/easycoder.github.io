from .ec_handler import Handler
from .ec_border import Border
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QLineEdit,
    QPlainTextEdit,
    QWidget,
    QStackedWidget,
    QSpacerItem,
    QSizePolicy,
    QGraphicsDropShadowEffect
)
from PySide6.QtGui import QFont, QIcon, QPixmap, QPainter
from PySide6.QtCore import Qt, QTimer, Signal, QRect

class Keyboard(Handler):
    iconClicked = Signal()
    
    def __init__(self, program, keyboardType, receiverLayout, receivers, caller = None, parent=None):
        super().__init__(program.compiler)

        self.program = program
        self.receivers = receivers

        dialog = QDialog(caller)
        self.dialog = dialog
        
#        dialog.setWindowTitle('')
        dialog.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        dialog.setModal(True)
        dialog.setFixedWidth(500)
        dialog.setStyleSheet('background-color: white;border:1px solid black;')

        # Add drop shadow
        shadow = QGraphicsDropShadowEffect(dialog)
        shadow.setBlurRadius(40)
        shadow.setOffset(0, 4)
        shadow.setColor(Qt.GlobalColor.black)
        dialog.setGraphicsEffect(shadow)

        # Add the keyboard
        layout = QVBoxLayout(dialog)

        border = Border()
        border.tickClicked.connect(self.dialog.accept)
        border.closeClicked.connect(self.reject)
        layout.addWidget(border)
        layout.addLayout(receiverLayout)
        self.vk = VirtualKeyboard(keyboardType, 42, receivers[0], dialog.accept)
        layout.addWidget(self.vk)

        restore = []
        index = 0
        for receiver in receivers:
            receiver.field.setContainer(self)
            receiver.index = index
            restore.append(receiver.getContent())
            index += 1
        self.restore = restore
        
        # Position at bottom of parent window
        dialog.show()  # Ensure geometry is calculated
        if parent:
            parent_pos = parent.mapToGlobal(parent.rect().bottomLeft())
            x = parent_pos.x() + (parent.width - dialog.width()) / 2
            y = parent_pos.y() - dialog.height() - 40
            dialog.move(x, y)

        dialog.exec()

    def setClickSource(self, field):
        receivers = self.receivers
        for receiver in receivers:
            if receiver.field == field:
                self.vk.setReceiver(receiver)
                return

    def reject(self):
        receivers = self.receivers
        index = 0
        for receiver in receivers:
            receiver.setContent(self.restore[index])
            index += 1      
        self.dialog.reject()

class TextReceiver():
    def __init__(self, field):
        self.field = field

    def addCharacter(self, char):
        char = char.replace('&&', '&')
        if len(char) == 1:
            self.setContent(self.getContent() + char)
        else:
            raise ValueError("Only single characters are allowed.")

    def backspace(self):
        current_text = self.getContent()
        if current_text:
            self.setContent(current_text[:-1])

    def setContent(self, text):
        if isinstance(self.field, QLineEdit):
            self.field.setText(text)
        elif isinstance(self.field, QPlainTextEdit):
            self.field.setPlainText(text)

    def getContent(self):
        if isinstance(self.field, QLineEdit):
            return self.field.text()
        elif isinstance(self.field, QPlainTextEdit):
            return self.field.toPlainText()
        
class KeyboardButton(QPushButton):
    def __init__(self, width, height, onClick, text=None, icon=None):
        if text != None: text = text.replace('&','&&')
        super().__init__(text)
        self.setFixedSize(width, height)
        self.setFont(QFont("Arial", height // 2))  # Font size is half the button height
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: white;
                border: none;
                border-radius: {int(height * 0.2)}px;  /* Rounded corners */
            }}
            QPushButton:pressed {{
                background-color: #ddd;  /* Slightly darker background when pressed */
            }}
        """)

        if icon:
            self.setIcon(QIcon(icon))
            self.setIconSize(self.size())

        self.clicked.connect(lambda: self.animate_button(onClick, text))

    def animate_button(self, onClick, text):
        # Move the button 2 pixels down and right
        self.move(self.x() + 2, self.y() + 2)
        QTimer.singleShot(200, lambda: self.move(self.x() - 2, self.y() - 2))  # Move back after 200ms
        onClick(text)

class KeyboardRow(QHBoxLayout):
    def __init__(self, items):
        super().__init__()
        for item in items:
            if isinstance(item, QWidget):
                self.addWidget(item)
            elif isinstance(item, QSpacerItem):
                self.addSpacerItem(item)

class KeyboardView(QVBoxLayout):
    def __init__(self, rows):
        super().__init__()
        for row in rows:
            self.addLayout(row)

###############################################################################
# VirtualKeyboard Class
class VirtualKeyboard(QStackedWidget):
    def __init__(self, keyboardType, buttonHeight, receiver, onFinished):
        super().__init__()
        self.keyboardType = keyboardType
        self.buttonHeight = buttonHeight
        self.receiver = receiver
        self.onFinished = onFinished
        self.setStyleSheet('background-color: #ccc;border:none;')

        # Create the 4 keyboard layouts
        self.addKeyboardLayout0()
        self.addKeyboardLayout1()
        self.addKeyboardLayout2()
        self.addKeyboardLayout3()

    ###########################################################################
    # Add the first keyboard layout (lowercase letters)
    def addKeyboardLayout0(self):
        rowList = []

        # Row 1: Numbers
        # row1 = KeyboardRow([KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '1234567890'])
        # rowList.append(row1)

        # Row 2: qwertyuiop
        row2 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'qwertyuiop'],
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row2)

        # Row 3: asdfghjkl with horizontal stretches
        row3 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'asdfghjkl'],
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row3)

        # Row 4: Shift, ZXC..., Backspace
        row4 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickShift, None, 'img/up.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'zxcvbnm'],
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickBack, None, 'img/back.png'),
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row4)

        # Row 5: Numbers, Space, Enter
        row5 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickNumbers, None, 'img/numbers.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ","),
            KeyboardButton(self.buttonHeight * 5, self.buttonHeight, self.onClickSpace, None, 'keyboard/space.png'),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, "."),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickEnter, None, 'img/enter.png'),
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row5)

        # Add the rows to the KeyboardView
        keyboardView = KeyboardView(rowList)
        container = QWidget()
        container.setLayout(keyboardView)
        self.addWidget(container)

    ###########################################################################
    # Add the second keyboard layout (uppercase letters)
    def addKeyboardLayout1(self):
        rowList = []

        # Row 1: Numbers
        # row1 = KeyboardRow([KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '1234567890'])
        # rowList.append(row1)

        # Row 2: Uppercase QWERTY
        row2 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'QWERTYUIOP'],
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row2)

        # Row 3: Uppercase ASDFGHJKL with horizontal stretches
        row3 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'ASDFGHJKL'],
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row3)

        # Row 4: Shift, Uppercase ZXC..., Backspace
        row4 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickShift, None, 'img/up.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in 'ZXCVBNM'],
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickBack, None, 'img/back.png'),
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row4)

        # Row 5: Numbers, Space, Enter
        row5 = KeyboardRow([
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickNumbers, None, 'img/numbers.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ","),
            KeyboardButton(self.buttonHeight * 5, self.buttonHeight, self.onClickSpace, None, 'img/space.png'),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, "."),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickEnter, None, 'img/enter.png'),
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row5)

        # Add the rows to the KeyboardView
        keyboardView = KeyboardView(rowList)
        container = QWidget()
        container.setLayout(keyboardView)
        self.addWidget(container)

    ###########################################################################
    # Add the third keyboard layout (numbers and symbols)
    def addKeyboardLayout2(self):
        rowList = []

        # Row 1: Numbers
        row1 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '1234567890'],
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row1)

        # Row 2: Symbols
        row2 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '@#£&_-()=%'],
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row2)

        # Row 3: Symbols with horizontal stretches
        row3 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickSymbols, None, 'img/symbols.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '"*\'/:!?+'],
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickBack, None, 'img/back.png'),
            QSpacerItem(20, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row3)

        # Row 4: Numbers, Space, Enter
        row4 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickLetters, None, 'img/letters.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ","),
            KeyboardButton(self.buttonHeight * 5.2, self.buttonHeight, self.onClickSpace, None, 'keyboard/space.png'),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, "."),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight * 1.5, self.buttonHeight, self.onClickEnter, None, 'img/enter.png'),
            QSpacerItem(10, 40, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row4)

        # Add the rows to the KeyboardView
        keyboardView = KeyboardView(rowList)
        container = QWidget()
        container.setLayout(keyboardView)
        self.addWidget(container)

    ###########################################################################
    # Add the fourth keyboard layout (additional symbols)
    def addKeyboardLayout3(self):
        rowList = []

        # Row 1: Extended symbols
        row1 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '$€¥¢©®µ~¿¡'],
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row1)

        # Row 2: Additional symbols
        row2 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '¼½¾[]{}<>^'],
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row2)

        # Row 3: Symbols with horizontal stretches
        row3 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickNumbers, None, 'img/numbers.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '`;÷\\∣|¬±'],
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickBack, None, 'img/back.png'),
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row3)

        # Row 4: Numbers, Space, Enter
        row4 = KeyboardRow([
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickLetters, None, 'img/letters.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, ","),
            KeyboardButton(self.buttonHeight * 3, self.buttonHeight, self.onClickSpace, None, 'img/space.png'),
            QSpacerItem(self.buttonHeight * 0.05, 0, QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Minimum),
            *[KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickChar, char) for char in '✕§¶°'],
            KeyboardButton(self.buttonHeight, self.buttonHeight, self.onClickEnter, None, 'img/enter.png'),
            QSpacerItem(0, 0, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
        ])
        rowList.append(row4)

        # Add the rows to the KeyboardView
        keyboardView = KeyboardView(rowList)
        container = QWidget()
        container.setLayout(keyboardView)
        self.addWidget(container)
    
    def setReceiver(self, receiver):
        self.receiver = receiver
    
    def getReceiver(self):
        return self.receiver

    # Callback functions
    def onClickChar(self,keycode):
        # print(f"Key pressed: {keycode}")
        self.receiver.addCharacter(keycode)

    def onClickShift(self,keycode):
        # print("Shift pressed")
        if self.currentIndex() == 0:
            self.setCurrentIndex(1)
        elif self.currentIndex() == 1:
            self.setCurrentIndex(0)

    def onClickLetters(self,keycode):
        # print("Letters pressed")
        self.setCurrentIndex(0)

    def onClickNumbers(self,keycode):
        # print("Numbers pressed")
        self.setCurrentIndex(2)

    def onClickSymbols(self,keycode):
        # print("Symbols pressed")
        self.setCurrentIndex(3)

    def onClickBack(self,keycode):
        # print("Backspace pressed")
        self.receiver.backspace()

    def onClickSpace(self,keycode):
        # print("Space pressed")
        self.receiver.addCharacter(' ')

    def onClickEnter(self,keycode):
        # print("Enter pressed")
        if self.receiver.field.multiline: self.receiver.addCharacter('\n')
        else: self.onFinished()
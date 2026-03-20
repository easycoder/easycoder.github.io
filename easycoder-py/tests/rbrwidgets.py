import sys, time, json
from collections import namedtuple
from datetime import datetime
from PySide6.QtGui import (
    QIcon,
    QPixmap,
    QFont,
    QPalette,
    QBrush,
    QPainter,
    QColor,
    QPen
)
from PySide6.QtWidgets import (
    QWidget,
    QApplication,
    QMainWindow,
    QLabel,
    QFrame,
    QHBoxLayout,
    QVBoxLayout,
    QStackedWidget,
    QDialog,
    QSizePolicy,
    QGridLayout,
    QGraphicsDropShadowEffect
)
from PySide6.QtCore import (
    Qt,
    QTimer,
    QSize,
    QDate,
    Signal
)
from easycoder.ec_graphics import (
    ECLabelWidget,
    ECPushButtonWidget,
    ECCheckBoxWidget,
    ECLineEditWidget,
    ECPlainTextEditWidget,
    ECListBoxWidget,
    ECComboBoxWidget
)
from easycoder.ec_classes import ECList
from easycoder.ec_gclasses import ECGElement, ECWidget

# Enum shortcuts to reduce verbosity
Align = Qt.AlignmentFlag
WindowType = Qt.WindowType
MouseButton = Qt.MouseButton
AspectRatioMode = Qt.AspectRatioMode
TransformationMode = Qt.TransformationMode

# QtGui enum shortcuts
RenderHint = QPainter.RenderHint
Weight = QFont.Weight
ColorRole = QPalette.ColorRole

# QtWidgets enum shortcuts
Policy = QSizePolicy.Policy
FrameShape = QFrame.Shape
FrameShadow = QFrame.Shadow
DialogCode = QDialog.DialogCode

###############################################################################
# Some style definitions
def defaultQFrameStyle():
    return '{' + f'''
        background-color: #ffc;
        border: 1px solid #888;
        border-radius: 5px;
        ''' + '}'

def defaultGrayFrameStyle():
    return '{' + f'''
        background-color: #ccc;
        border: 1px solid #888;
        border-radius: 5px;
        ''' + '}'

def borderlessQFrameStyle():
    return '{' + f'''
        background-color: #ccc;
        border: none;
        ''' + '}'

def invisibleQFrameStyle():
    return '{' + f'''
        background-color: #ffc;
        border: none;
        ''' + '}'

def defaultQLabelStyle(size):
    return '{' + f'''
        background-color: #ccc;
        border: 1px solid #888;
        border-radius: 5px;
        padding: 10px;
        font-size: {size}px;
        font-weight: bold;
        ''' + '}'

def borderlessQLabelStyle(size):
    return '{' + f'''
        background-color: #ccc;
        border: none;
        padding: 10px;
        font-size: {size}px;
        font-weight: bold;
        ''' + '}'

def defaultIconStyle():
    return '{' + f'''
        background-color: #ccc;
        border: 1px solid #888;
        border-radius: 5px;
        ''' + '}'

def borderlessIconStyle():
    return '{' + f'''
        background-color: #ccc;
        border: none;
        ''' + '}'

def defaultButtonStyle():
    return '''
        background-color: #ccc;
        border: 1px solid #888;
        border-radius: 5px;
        font-size: 20px;
        font-weight: bold;
        '''

###############################################################################
# Utility functions
def now():
    t = time.time()
    tz = time.timezone('GB') # Localize this!
    dt = datetime.fromtimestamp(t)
    return int(t) + tz.dst(dt).seconds

###############################################################################
# This is the package that handles the RBR user interface.
###############################################################################
# The RBR generic EC widget
class RBRWidget(ECWidget):
    def __init__(self):
        super().__init__()
        self.properties = {}

###############################################################################
# An RBR generic pushbutton
class RBRButton(RBRWidget):
    def __init__(self):
        super().__init__()
        self.properties = {}

###############################################################################
# An expanding label
class ExpandingLabel(ECLabelWidget):
    def __init__(self, text=''):
        super().__init__(text)
        self.setSizePolicy(Policy.Expanding, Policy.Expanding)
        self.setAlignment(Align.AlignCenter)

###############################################################################
# A generic icon
class GenericIcon(ExpandingLabel):
    def __init__(self, icon, size):
        super().__init__()
        self.setSizePolicy(Policy.Expanding, Policy.Expanding)
        self.setAlignment(Align.AlignCenter)
        pixmap = QPixmap(icon).scaled(size, size)
        self.setPixmap(pixmap)

###############################################################################
# A button just containing text
class TextButton(ECPushButtonWidget):
    def __init__(self, program, name='textbutton', height=50, text='', index=0):
        super().__init__()
        self.program = program
        self.name = name
        self.text = text
        self.index = index
        self.onClick = None
        self.fcb = None
        self.clicked.connect(lambda: self.animate_button())

        self.setFixedHeight(int(height))
        self.setStyleSheet(f"""
            QPushButton {{
                padding: 5px;
                background-color: #eee;
                border: 1px solid black;
                border-radius: 5px;
                font-size: {height * 0.35}px;
                font-weight: bold;
            }}
        """)

        self.setText(text)
    
    # Callback to EC script
    def setOnClick(self, onClick):
        self.onClick = onClick
    
    # Function callback
    def setFCB(self, fcb):
        self.fcb = fcb
    
    def moveBack(self):
        try: self.move(self.x() - 2, self.y() - 2)
        except: pass

    def animate_button(self):
        # Move the button 2 pixels down and right
        self.move(self.x() + 2, self.y() + 2)
        QTimer.singleShot(200, lambda: self.moveBack())  # Move back after 200ms
        if self.onClick != None: self.program.run(self.onClick)
        elif self.fcb != None: self.fcb(self.text)

    def getIndex(self):
        return self.index

###############################################################################
# A button containing an icon

class IconButton(ECPushButtonWidget):
    def __init__(self, program, height, icon, index=0):
        super().__init__()
        self.program = program
        self.index = index
        self.onClick = None
        self.fcb = None
        self.clicked.connect(lambda: self.animate_button(self.index))

        if height != None:
            self.setFixedSize(int(height), int(height))
            self.setStyleSheet(f"""
                QPushButton {{
                    background-color: none;
                    border:none;
                    border-radius: 5px;
                }}
            """)
            self.setIconSize(QSize(int(height * 0.8), int(height * 0.8)))

        self.setIcon(QIcon(icon))
    
    # Function callback
    def setFCB(self, fcb):
        self.fcb = fcb
    
    def setOnClick(self, onClick):
        self.onClick = onClick
    
    def moveBack(self):
        try: self.move(self.x() - 2, self.y() - 2)
        except: pass

    def animate_button(self, index):
        if index != None: self.program.roomIndex = index
        # Move the button 2 pixels down and right
        self.move(self.x() + 2, self.y() + 2)
        QTimer.singleShot(200, lambda: self.moveBack())
        if self.onClick != None: self.program.run(self.onClick)
        elif self.fcb != None: self.fcb(None)

    def getIndex(self):
        return self.index

###############################################################################
# The banner ECWidget
class RBRBanner(RBRWidget):
    def __init__(self):
        super().__init__()
        self.properties = {}

###############################################################################
# The banner at the top of the window
class Banner(ECLabelWidget):
    def __init__(self, program, width):
        super().__init__()
        self.setStyleSheet(f'''
            background: transparent;
            margin-bottom: 5px;
            padding: 0;
            color: black;
            font-family: Times;
            font-weight: bold;
        ''')
        height = width * 80 / 600
        self.setFixedSize(int(width), int(height))

        # The gradient label
        pixmap = QPixmap(f'img/gradient.png')
        self.setPixmap(pixmap)

        layout = QHBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)

        # The home buttom
        homeButton = IconButton(program, height * 3 // 4, f'img/RBRLogo.png')
        layout.addWidget(homeButton)

        # The title panel
        titlePanel = QWidget()
        titlePanel.setStyleSheet(f'''
        ''')
        titleLayout = QVBoxLayout(titlePanel)
        titleLayout.setSpacing(0)
        titleLayout.setContentsMargins(0, 0, 0, 0)
        title1 = ExpandingLabel('Room By Room')
        title1.setStyleSheet(f'''
            font-size: {height * 0.6}px;
            margin: 0;
        ''')
        title2 = ExpandingLabel('Intelligent heating when and where you need it')
        title2.setStyleSheet(f'''
            font-size: {height * 0.18}px;
            margin: 0;
        ''')
        titleLayout.addWidget(title1, 1)
        titleLayout.addWidget(title2, 1)

        layout.addWidget(titlePanel)

        #The Hamburger button
        self.hamburgerButton = IconButton(program, height * 3 // 4, f'img/hamburger.png')
        layout.addWidget(self.hamburgerButton)
    
    def getElement(self, name):
        if name == 'hamburger': return self.hamburgerButton
        return None

###############################################################################
# The Profiles bar EC object
class RBRProfiles(RBRWidget):
    def __init__(self):
        super().__init__()
        self.properties = {}

###############################################################################
# The Profiles bar
class Profiles(QWidget):

    class CalendarIcon(QWidget):
        def __init__(self, height):
            super().__init__()
            self.height = height
            self.setFixedSize(height, height)
            self.pixmap = QPixmap(f'img/calendar.png').scaled(height, height, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation)
            self.day = QDate.currentDate().day()

        def setDay(self, day):
            self.day = day
            self.update()

        def paintEvent(self, event):
            painter = QPainter(self)
            painter.setRenderHint(RenderHint.Antialiasing)
            # Draw the notepad image
            painter.drawPixmap(0, 0, self.pixmap)
            # Draw the day number
            font = QFont("Arial", self.height // 3, Weight.Bold)
            painter.setFont(font)
            painter.setPen(QColor("black"))
            # Fine-tune these values for perfect placement
            text = str(self.day)
            rect = self.rect().adjusted(0, self.height // 2, 0, 0)  # Move text down a bit
            painter.drawText(rect, Align.AlignHCenter | Align.AlignTop, text)

    class HourglassIcon(QWidget):
        def __init__(self, height):
            super().__init__()
            self.height = height
            self.setFixedSize(height, height)
            self.pixmap = QPixmap(f'img/hourglass.png').scaled(height, height, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation)

        def paintEvent(self, event):
            painter = QPainter(self)
            painter.setRenderHint(RenderHint.Antialiasing)
            painter.drawPixmap(0, 0, self.pixmap)

    def __init__(self, program, width):
        super().__init__()
        self.program = program

        self.setStyleSheet(f'''
            background: transparent;
            margin: 0;
            padding: 0;
            color: black;
            font-family: Times;
            font-weight: bold;
            text-align: center;
        ''')
        height = width * 60 / 600

        layout = QHBoxLayout(self)
        layout.setSpacing(0)
        layout.setContentsMargins(0, 0, 0, 0)

        systemName = ECLabelWidget('System')
        systemName.setAlignment(Align.AlignVCenter | Align.AlignLeft)
        systemName.setStyleSheet(f'''
            font-size: {height * 0.4}px;
            margin-left: 10px;
        ''')
        self.systemName = systemName
        layout.addWidget(systemName, 1)

        self.hourglassIcon = self.HourglassIcon(height // 2)
        layout.addWidget(self.hourglassIcon)

        calendarLayout = QVBoxLayout()
        layout.addLayout(calendarLayout)
        self.calendarIcon = self.CalendarIcon(height // 2)
        calendarLayout.addWidget(self.calendarIcon)
        calendarLayout.addSpacing(5)
        layout.addSpacing(5)

        profileButton = TextButton(program, '-', height=height * 0.7, text='Default profile')
        profileButton.setStyleSheet(f'''
            margin-right: 10px;
            background-color: #eee;
            font-size: {height // 3}px;
            border: 1px solid black;
            border-radius: 5px;
            margin-bottom: 5px;
            padding-left: 5px;
            padding-right: 5px;
        ''')
        layout.addWidget(profileButton)
        self.profileButton = profileButton
    
    # Handle a request to change something in the profiles bar
    def handleRequest(self, request):
        if 'setSystemName' in request:
            self.systemName.setText(request['setSystemName'].replace('%20', ' '))
        elif 'setProfile' in request:
            self.profileButton.setText(request['setProfile'])
        elif 'setHourglass' in request:
            self.hourglassIcon.setVisible(request['setHourglass'])
    
    # Get an element of the profiles bar
    def getElement(self, name):
        if name == 'systemName': return self.systemName
        elif name == 'profileButton': return self.profileButton
        return None

###############################################################################
# A button to show the current mode.

class ModeButton(QWidget):
    clicked = Signal()

    class ModeLabel(QWidget):
        def __init__(self, room):
            super().__init__()
            self.spec = room.spec
            self.mode = room.mode
            self.height = room.height
            self.setMinimumHeight(self.height)
            self.setMaximumHeight(self.height)
            self.setMinimumWidth(100)  # Adjust as needed

        def paintEvent(self, event):
            with QPainter(self) as painter:
                painter.setRenderHint(RenderHint.Antialiasing)
                w = self.width()
                height = self.height

                # First row font and rect
                font1 = QFont("Arial", height // 5, Weight.Bold)
                painter.setFont(font1)
                painter.setPen(QColor("black"))
                offset = 0.2 if self.mode == 'Off' else 0.4
                rect1 = self.rect().adjusted(0, 0, 0, -height * offset)
                painter.drawText(rect1, Align.AlignCenter, self.mode)

                # Second row font and rect (if present)
                if self.mode == 'Timed':
                    roomSpec = self.spec
                    advance = str(roomSpec['advance'])
                    
                    timestamp = time.time()
                    dt = datetime.fromtimestamp(timestamp)
                    hour = dt.hour
                    minute = dt.minute

                    text = ''
                    events = roomSpec['events']
                    for e, event in enumerate(events):

                        if advance != '-':
                            f = e + 1
                            if f >= len(events): f = 0
                            event = events[f]

                        untilTime = event['until']
                        untilTemp = event['temp']
                        finish = untilTime.split(':')
                        fh = int(finish[0])
                        if fh == 0: fh = 24
                        if hour < fh:
                            text = f'{untilTemp}°C->{untilTime}'
                            break
                        elif hour == fh:
                            fm = int(finish[1])
                            if minute < fm:
                                text = f'{untilTemp}°C->{untilTime}'
                                break
                    
                    if text == '':
                        event = events[0]
                        untilTime = event['until']
                        untilTemp = event['temp']
                        if roomSpec['linked'] == 'yes':  text = f'{untilTemp}°C->{untilTime}'
                        else: text = f'->{untilTime}'

                    font2 = QFont("Arial", height // 8)
                    painter.setFont(font2)
                    rect2 = self.rect().adjusted(0, height * 0.1, 0, 0)
                    painter.drawText(rect2, Align.AlignCenter, text)
                elif self.mode == 'Advance':
                    pass
                elif self.mode == 'Boost':
                    font2 = QFont("Arial", height // 7)
                    painter.setFont(font2)
                    rect2 = self.rect().adjusted(0, height * 0.1, 0, 0)
                    try:
                        boost = round((self.spec['boost'] - int(time.time())) / 60)
                        if boost == 1: boost = '1 min'
                        else: boost = f'{boost} mins'
                        painter.drawText(rect2, Align.AlignCenter, boost)
                    except:
                        pass
                elif self.mode == 'On':
                    font2 = QFont("Arial", height // 7)
                    painter.setFont(font2)
                    rect2 = self.rect().adjusted(0, height * 0.1, 0, 0)
                    painter.drawText(rect2, Align.AlignCenter, f'{self.spec["target"]}°C')

    ###########################################################################
    # Initialize the Mode button
    def __init__(self, room, program, height, widthFactor, image, index=0):
        super().__init__()

        self.setStyleSheet("""
            background-color: transparent;
            border: none;
        """)

        self.program = program
        self.index = index
        self.onClick = None
        self.clicked.connect(lambda: self.animate_button(self.index))

        self.setFixedSize(int(height * widthFactor), int(height))
        mainLayout = QHBoxLayout(self)
        mainLayout.setContentsMargins(0, 0, 0, 0)
        mainLayout.setSpacing(0)

        # icon on the left
        label = ExpandingLabel()
        label.setFixedSize(int(height), int(height))
        pixmap = QPixmap(image).scaled(int(height * 0.75), int(height * 0.75))
        label.setPixmap(pixmap)
        mainLayout.addWidget(label)

        # Mode Label on the right
        modeLabel = self.ModeLabel(room)
        mainLayout.addWidget(modeLabel, alignment=Align.AlignVCenter)

        mainLayout.addSpacing(15)
        self.setStatus('Good')
    
    def setStatus(self, status):
        self.status = status
        self.update()

    def paintEvent(self, event):
        super().paintEvent(event)
        painter = QPainter(self)
        painter.setRenderHint(RenderHint.Antialiasing)
        radius = 5
        x = 4 + radius
        y = self.height() - 5 - radius
        if self.status == 'Fail':
            fillColor = '#f00'
            borderColor = '#800'
        elif self.status == 'Suspect':
            fillColor = '#ff0'
            borderColor = '#880'
        else:
            fillColor = '#0f0'
            borderColor = '#080'
        painter.setBrush(QColor(fillColor))
        pen = QPen(QColor(borderColor))
        pen.setWidth(1)
        painter.setPen(pen)
        painter.drawEllipse(x - radius, y - radius, radius * 2, radius * 2)

    def mousePressEvent(self, event):
        if event.button() == MouseButton.LeftButton:
            self.clicked.emit()
        super().mousePressEvent(event)
    
    def setOnClick(self, onClick):
        self.onClick = onClick
    
    def moveBack(self):
        try: self.move(self.x() - 2, self.y() - 2)
        except: pass

    def animate_button(self, index):
        self.program.roomIndex = index
        # Move the button 2 pixels down and right
        self.move(self.x() + 2, self.y() + 2)
        QTimer.singleShot(200, lambda: self.moveBack())
        if self.onClick != None: self.program.run(self.onClick)

    def getIndex(self):
        return self.index
    
###############################################################################
# The RBR Room EC widget
class RBRRoom(RBRWidget):
    def __init__(self):
        super().__init__()

    # Set the content of the value at the current index
    def setContent(self, content):
        if self.values is None:
            self.index = 0
            self.elements = 1
            self.values = [None]
        self.values[self.index] = content # type: ignore

    # Set the room widget
    def setRoom(self, room):
        super().setValue(room)

    # Get the room widget
    def getRoom(self):
        return super().getValue()
    
    def getName(self):
        return self.getRoom().getName()
    
    def getMode(self):
        return self.getRoom().getMode()
    
    def getTemperature(self):
        return self.getRoom().getTemperature()

###############################################################################
# A row of room information
class Room(QFrame):
    def __init__(self, program, spec, height, index=0):
        super().__init__()
        self.program = program
        self.spec = json.loads(spec)
        self.height = height
        self.temperature = 0
        self.index = index
        # print(self.spec['name'])

        self.setStyleSheet("""
            background-color: #ffc;
            border: 1px solid gray;
            border-radius: 5px;
        """)

        self.setFixedHeight(height)  # Each row is 1/12 the height of the window

        roomsLayout = QHBoxLayout(self)
        roomsLayout.setSpacing(0)  # No spacing between elements
        roomsLayout.setContentsMargins(0, 0, 0, 0)

        modePanel = QWidget()
        modePanel.setStyleSheet('''
            background-color: #eee;
            border: 1px solid gray;
        ''')
        roomsLayout.addWidget(modePanel)
        modePanelLayout = QHBoxLayout(modePanel)
        modePanelLayout.setSpacing(0)
        modePanelLayout.setContentsMargins(5, 0, 0, 0)
        self.name = self.spec['name']
        self.mode = self.spec['mode']

        # Icon 1: Mode
        if not self.mode in ['timed', 'boost', 'advance', 'on', 'off']: self.mode = 'off'
        image = f'img/{self.mode}.png'
        self.mode = f'{self.mode[0].upper()}{self.mode[1:]}'
        if self.mode == 'Timed':
            advance = self.spec['advance']
            if not advance in ['', '-', 'C']:
                image = 'img/advance.png'
                self.mode = 'Advance'
        self.modeButton = ModeButton(self, self.program, height * 0.8, 2.7, image, index)

        # Room name label
        nameLabel = ECLabelWidget(self.name)
        nameLabel.setAlignment(Align.AlignVCenter | Align.AlignLeft)
        nameLabel.setStyleSheet('''
            background-color: transparent;
            border: none;
        ''')
        font = QFont()
        font.setPointSize(16)  # Adjust font size to fit at least 20 characters
        font.setBold(True)  # Make the font bold
        nameLabel.setFont(font)
        self.nameLabel = nameLabel

        # Button with white text and blue or red background
        temperatureButton = ECPushButtonWidget('----°C')
        color = 'red' if self.spec['relay'] == 'on' else 'blue'
        temperatureButton.setStyleSheet(f'''
                color: white; 
                background-color: {color}; border: none;
        ''')
        temperatureButton.setFixedSize(int(height * 1.2), int(height * 0.6))  # Adjust button size
        temperatureButton.setFont(font)  # Use the same font as the label
        self.temperatureButton = temperatureButton
        self.setTemperature()

        # Icon 2: Tools
        self.toolsButton = IconButton(self.program, height * 3 // 4, f'img/edit.png', index)

        # Add elements to the row layout
        modePanelLayout.addWidget(self.modeButton)
        roomsLayout.addWidget(nameLabel, 1)  # Expand the name label to use all spare space
        roomsLayout.addWidget(temperatureButton)
        roomsLayout.addWidget(self.toolsButton)
    
    def setName(self, name):
        self.nameLabel.setText(name)
    
    def setTemperature(self):
        value = self.spec['temperature']
        if value == '': value = '--.-'
        self.temperatureButton.setText(f'{value}°C')
    
    def getName(self):
        return self.name
    
    def getMode(self):
        return self.mode
    
    def getTemperature(self):
        return self.temperature

    def getIndex(self):
        return self.index

###############################################################################
# The popout panel ECWidget
class RBRPopout(RBRWidget):
    def __init__(self):
        super().__init__()
        self.properties = {}

###############################################################################
# A popout panel. This sits near the top of the screen
class Popout(QWidget):
    def __init__(self, program, width):
        super().__init__()
        self.layout = QVBoxLayout(self)
        self.hide()
        
    def clear(self, layout):
        while layout.count():
            item = layout.takeAt(0)
            widget = item.widget()
            if widget is not None:
                widget.setParent(None)
            # If it's a layout (nested), clear it recursively
            elif item.layout():
                self.clear(item.layout())
    
    def addLayout(self, layout):
        self.clear(self.layout)
        self.layout.addLayout(layout)

###############################################################################
# A popup menu
class Menu(QDialog):
    def __init__(self, program, height, parent=None, title="Select Action", actions=None):
        super().__init__(program.rbrwin)
        self.setWindowFlags(WindowType.FramelessWindowHint)

#        self.setWindowTitle(title)
        self.program = program
        self.setModal(True)
        self.setFixedWidth(300)
        layout = QVBoxLayout(self)
        self.result = None
        self.setStyleSheet('background: white;border: 1px solid black;')

        # Add drop shadow
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(40)
        shadow.setOffset(0, 4)
        shadow.setColor(Qt.black)
        self.setGraphicsEffect(shadow)

        # Add the title
        titleLabel = QLabel(title)
        titleLabel.setFixedHeight(height)
        titleLabel.setStyleSheet(f'''
            background-color: none;
            border: none;
            font-size: {height * 0.4}px;
            font-weight: bold;
        ''')
        titleLabel.setAlignment(Qt.AlignCenter)
        layout.addWidget(titleLabel)

        # Add action buttons
        self.program.checkObjectType(actions, ECList)
        if actions != None:
            for action in actions.getContent():
                if action == '': layout.addSpacing(20)
                else:
                    button = TextButton(program, '-', height=height, text=action)
                    button.setFCB(self.accept)
                    layout.addWidget(button)

        self.adjustSize()

    def accept(self, action):
        self.result = action
        # Create a timer and wait for it
        timer = QTimer()
        timer.setSingleShot(True)
        timer.start(300)
        while timer.isActive():
            QApplication.processEvents()
        super().accept()

    def show(self):
        # Show dialog and return result
        if self.exec() == DialogCode.Accepted:
            return self.result
        return None

###############################################################################
# A frame widget containing a number of widgets
class WidgetSet(QFrame):
    def __init__(self, widgets, horizontal=True, margins=(5, 5, 5, 5), spacing=5):
        super().__init__()

        # Set frame properties
        self.setFrameStyle(FrameShape.Box | FrameShadow.Plain)
        self.setLineWidth(1)
        
        # Main widget layout
        layout = QHBoxLayout(self) if horizontal else QVBoxLayout(self)
        layout.setContentsMargins(margins[0], margins[1], margins[2], margins[3])
        layout.setSpacing(spacing)

        # Add the widgets
        for widget in widgets: layout.addWidget(widget)

###############################################################################
# A generic Mode widget
class GenericMode(QWidget):
    def __init__(self):
        super().__init__()
        self.styles = {}
    
    def setStyles(self):
        # Set the styles of each widget type in the set.
        # Don't forget that a base style includes all subclasses,
        # so a separate definition must be provided for each subclass type.
        # For example, ECLabelWidget is a subclass of QFrame so it needs its own definition
        if not 'QFrame' in self.styles: self.styles['QFrame'] = defaultQFrameStyle()
        if not 'ECLabelWidget' in self.styles: self.styles['ECLabelWidget'] = defaultQLabelStyle(20)

        stylesheet = '\n'.join(f"{key} {value}" for key, value in self.styles.items())
        self.setStyleSheet(stylesheet)

    # The left-hand panel, with label and icon
    # This animates when clicked
    class GenericModeLeft(WidgetSet):
        clicked = Signal()

        def __init__(self, widgets, horizontal=True, margins=(5, 5, 5, 5), spacing=10, fcb=None):
            super().__init__(widgets, horizontal, margins, spacing)
            self.fcb = fcb
            self.clicked.connect(lambda: self.animate())
            self.setObjectName('GenericModeLeft')

        # Generate a signal when the widget is clicked
        def mousePressEvent(self, event):
            if event.button() == MouseButton.LeftButton:
                self.clicked.emit()
            super().mousePressEvent(event)
        
        def moveBack(self):
            try: self.move(self.x() - 2, self.y() - 2)
            except: pass

        def animate(self):
            # Move the widget 2 pixels down and right
            self.move(self.x() + 2, self.y() + 2)
            QTimer.singleShot(200, lambda: self.moveBack())  # Move back after 200ms
            if self.fcb != None: self.fcb()

    # A generic mode label
    class GenericModeLabel(ExpandingLabel):
        def __init__(self, text, height=50):
            super().__init__(text)
            if height != None: self.setFixedHeight(height)
            self.setObjectName('GenericModeLabel')

    # A bordered label
    class BorderedLabel(ExpandingLabel):
        def __init__(self, text):
            super().__init__(text)
            self.setObjectName('BorderedLabel')

    # A generic mode icon
    class GenericModeIcon(GenericIcon):
        def __init__(self, icon, size):
            super().__init__(icon, size)
            self.setObjectName('GenericModeIcon')

    # The right-hand panel
    class GenericModeRight(WidgetSet):
        def __init__(self, widgets, horizontal=True, margins=(0, 0, 0, 0), spacing=5):
            super().__init__(widgets, horizontal, margins, spacing)
            self.setObjectName('GenericModeRight')

    # Create a layout and add left and right widgets
    def setupMode(self, left, right):
        mainLayout = QHBoxLayout(self)
        mainLayout.setContentsMargins(0, 0, 0, 0)
        mainLayout.setSpacing(0)
        
        self.styles['QFrame#GenericModeLeft'] = defaultGrayFrameStyle()
        self.styles['ECLabelWidget#GenericModeLabel'] = borderlessQLabelStyle(20)
        self.styles['ECLabelWidget#BorderedLabel'] = defaultQLabelStyle(20)
        self.styles['ECLabelWidget#GenericModeIcon'] = borderlessIconStyle()
        self.styles['QFrame#GenericModeRight'] = invisibleQFrameStyle()

        content = WidgetSet((left, right), horizontal=True)
        content.setFixedSize(500, 150)
        mainLayout.addWidget(content)

        self.setStyles()

###############################################################################
# The Timed Mode widget
class TimedMode(GenericMode):

    # The advance button
    class AdvanceButton(TextButton):
        def __init__(self, program, text, fcb):
            super().__init__(program, name='advancebutton', height=70, text=text)
            self.setFixedHeight(136)
            self.setSizePolicy(Policy.Expanding, Policy.Expanding)
            self.setStyleSheet(defaultButtonStyle())
            self.setFCB(self.onFCB)
            self.fcb = fcb

        def onFCB(self, name):
            self.fcb()

    # The icon on the right panel
    class EditIcon(IconButton):
        def __init__(self, program, icon, fcb):
            super().__init__(program, height=None, icon=icon)
            self.setFixedHeight(136)
            self.setSizePolicy(Policy.Expanding, Policy.Expanding)
            self.setStyleSheet(defaultButtonStyle())
            self.setIconSize(QSize(50, 50))
            self.setFCB(self.onFCB)
            self.fcb = fcb

        def onFCB(self):
            self.fcb()

    # The main class for the widget
    def __init__(self, program, caller):
        super().__init__()
        self.caller = caller

        # Do the left-hand panel, with a label and an icon
        top = self.GenericModeLabel('Timed')
        top.setFixedHeight(40)
        bottom = self.GenericModeIcon(f'img/timed.png', 50)
        bottom.setFixedHeight(70)

        # Create the left panel
        left = self.GenericModeLeft((top, bottom), horizontal=False, fcb=caller.timedModeSelected)
        left.setFixedWidth(150)

        # Do the right-hand panel
        panel = QWidget()
        panel.setStyleSheet('background: transparent; border:none;')
        gridLayout = QGridLayout(panel)
        gridLayout.setSpacing(5)
        gridLayout.setContentsMargins(0,0,0,0)
        
        # Create the content
        roomSpec = program.getObject(caller.roomSpec)
        advance = roomSpec.getEntry('advance') if roomSpec.hasEntry('advance') else '-'
        text = '' if advance == '-' else 'Cancel\n'
        advanceButton = self.AdvanceButton(program, f'{text}Advance', self.advance)
        editButton = self.EditIcon(program, f'img/edit.png', self.edit)
        
        # Add buttons to grid
        gridLayout.addWidget(advanceButton, 0, 0)
        gridLayout.addWidget(editButton, 0, 1)

        right = self.GenericModeRight([panel], horizontal=False)

        self.setupMode(left, right)
    
    def advance(self, _):
        self.caller.advanceSelected()
    
    def edit(self, _):
        self.caller.editSelected()

###############################################################################
# The Boost Mode widget
class BoostMode(GenericMode):

    # A generic boost button
    class BoostButton(TextButton):
        def __init__(self, program, text, fcb):
            super().__init__(program, name=text, height=65, text=text)
            self.setSizePolicy(Policy.Expanding, Policy.Expanding)
            self.setStyleSheet(defaultButtonStyle())
            self.setFCB(self.onFCB)
            self.fcb = fcb

        def onFCB(self, name):
            self.fcb()

    # The main class for the widget
    def __init__(self, program, caller):
        super().__init__()
        self.caller = caller

        # Do the left-hand panel, with a label and an icon
        top = self.GenericModeLabel('Boost')
        top.setFixedHeight(40)
        bottom = self.GenericModeIcon(f'img/boost.png', 50)
        bottom.setFixedHeight(70)

        # Create the left panel
        left = self.GenericModeLeft((top, bottom), horizontal=False, fcb=caller.boostModeSelected)
        left.setFixedWidth(150)

        # Do the right-hand panel
        panel = QWidget()
        panel.setStyleSheet('background: transparent; border:none;')
        gridLayout = QGridLayout(panel)
        gridLayout.setSpacing(5)
        gridLayout.setContentsMargins(0,0,0,0)
        
        # Create 4 boost buttons in a 2x2 grid
        boostOff = self.BoostButton(program, "Off", self.boostOffCB)
        boost30 = self.BoostButton(program, "30 min", self.boost30CB)
        boost60 = self.BoostButton(program, "1 hour", self.boost60CB)
        boost120 = self.BoostButton(program, "2 hours", self.boost120CB)
        
        # Add buttons to grid
        gridLayout.addWidget(boostOff, 0, 0)
        gridLayout.addWidget(boost30, 0, 1)
        gridLayout.addWidget(boost60, 1, 0)
        gridLayout.addWidget(boost120, 1, 1)

        right = self.GenericModeRight([panel], horizontal=False)

        self.setupMode(left, right)

    def boostOffCB(self, _):
        self.caller.boostOffSelected()

    def boost30CB(self, _):
        self.caller.boost30Selected()

    def boost60CB(self, _):
        self.caller.boost60Selected()

    def boost120CB(self, _):
        self.caller.boost120Selected()

###############################################################################
# The On Mode widget
class OnMode(GenericMode):

    # The plus/minus buttons
    class PlusMinusButton(IconButton):
        def __init__(self, program, icon, fcb):
            super().__init__(program, height=None, icon=icon)
            self.setFixedHeight(136)
            self.setSizePolicy(Policy.Expanding, Policy.Expanding)
            self.setStyleSheet(defaultButtonStyle())
            self.setIconSize(QSize(50, 50))
            self.setFCB(fcb)

    # The 'setting' label
    class SettingLabel(ExpandingLabel):
        def __init__(self, text):
            super().__init__(text)
            self.setObjectName('SettingLabel')

    # The main class for the widget
    def __init__(self, program, caller):
        super().__init__()
        self.program = program
        self.caller = caller

        # Do the left-hand panel, with a label and an icon
        top = self.GenericModeLabel('On')
        top.setFixedHeight(40)
        bottom = self.GenericModeIcon(f'img/on.png', 50)
        bottom.setFixedHeight(70)

        # Create the left panel
        left = self.GenericModeLeft((top, bottom), horizontal=False, fcb=self.onModeSelected)
        left.setFixedWidth(150)

        # Do the right-hand panel
        panel = QWidget()
        panel.setStyleSheet('background: transparent; border:none;')
        gridLayout = QGridLayout(panel)
        gridLayout.setSpacing(0)
        gridLayout.setContentsMargins(0,0,0,0)
        
        # Create the buttons and text
        downButton = self.PlusMinusButton(program, f'img/blueminus.png', fcb=self.onDown)
        self.styles['ECLabelWidget#SettingLabel'] = borderlessQLabelStyle(20)
        roomSpec = program.getObject(caller.roomSpec)
        self.target = float(roomSpec.getEntry('target')) if roomSpec != None else 0.0
        self.settingLabel = self.SettingLabel(f'{self.target}°C')
        upButton = self.PlusMinusButton(program, f'img/redplus.png', fcb=self.onUp)
        
        # Add buttons to grid
        gridLayout.addWidget(downButton, 0, 0)
        gridLayout.addWidget(self.settingLabel, 0, 1)
        gridLayout.addWidget(upButton, 0, 2)

        right = self.GenericModeRight([panel], horizontal=False)

        self.setupMode(left, right)
    
    def showTarget(self):
        record = self.program.getVariable(self.caller.roomSpec)
        object = self.program.getObject(record)
        value = str(self.target)
        object.values[0]['target'] = value
        self.settingLabel.setText(f'{self.target}°C')
    
    def getSettinglabel(self):
        return self.settingLabel

    def onModeSelected(self):
        self.caller.onModeSelected()
    
    def onDown(self, _):
        self.target -= 0.5
        self.showTarget()
    
    def onUp(self, _):
        self.target += 0.5
        self.showTarget()

###############################################################################
# The Off Mode widget
class OffMode(GenericMode):

    # The off button
    class OffButton(TextButton):
        def __init__(self, program, text, fcb):
            super().__init__(program, name='offbutton', height=70, text=text)
            self.setFixedHeight(136)
            self.setSizePolicy(Policy.Expanding, Policy.Expanding)
            self.setStyleSheet(defaultButtonStyle())
            self.setFCB(self.onFCB)
            self.fcb = fcb

        def onFCB(self, name):
            self.fcb()

    # The main class for the widget
    def __init__(self, program, caller):
        super().__init__()
        self.caller = caller

        # Do the left-hand panel, with a label and an icon
        top = self.GenericModeLabel('Off')
        top.setFixedHeight(40)
        bottom = self.GenericModeIcon(f'img/off.png', 50)
        bottom.setFixedHeight(70)

        # Create the left panel
        left = self.GenericModeLeft((top, bottom), horizontal=False, fcb=caller.offModeSelected)
        left.setFixedWidth(150)

        # Do the right-hand panel
        # right = self.BorderedLabel('Permanently\nOff')
        # right.setStyleSheet(defaultButtonStyle())
        right = self.OffButton(program, 'Permanently\nOff', self.off)

        self.setupMode(left, right)
    
    def off(self, _):
        self.caller.offModeSelected()

###############################################################################
# The Operating Mode dialog
class ModeDialog(QDialog):
    def __init__(self, program, roomSpec):
        super().__init__(program.rbrwin)
        self.setStyleSheet('''
            background-color: white;
            border: 1px solid black;
        ''')
        self.roomSpec = roomSpec
        
#        self.setWindowTitle('Operating mode')
        self.setWindowFlags(WindowType.FramelessWindowHint)
        self.setModal(True)
        layout = QVBoxLayout(self)
        layout.setSpacing(10)

        # Add drop shadow
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(40)
        shadow.setOffset(0, 4)
        shadow.setColor(Qt.black)
        self.setGraphicsEffect(shadow)

        # Add modes
        modes = []
        mode = TimedMode(program, self)
        modes.append(mode)
        layout.addWidget(mode)
        mode = BoostMode(program, self)
        modes.append(mode)
        layout.addWidget(mode)
        mode = OnMode(program, self)
        modes.append(mode)
        layout.addWidget(mode)
        mode = OffMode(program, self)
        modes.append(mode)
        layout.addWidget(mode)

        # Add Cancel button
        cancelButton = TextButton(program, name='cancelbutton', height=40, text='Cancel')
        cancelButton.setFCB(self.closeDialog)
        layout.addWidget(cancelButton)

        self.adjustSize()
    
    def timedModeSelected(self):
        self.returnWith('timed')
    
    def boostModeSelected(self):
        self.returnWith('')
    
    def onModeSelected(self):
        self.returnWith('on')
    
    def offModeSelected(self):
        self.returnWith('off')
    
    def advanceSelected(self):
        self.returnWith('advance')
    
    def editSelected(self):
        self.returnWith('edit')
    
    def boostOffSelected(self):
        self.returnWith('boost 0')
    
    def boost30Selected(self):
        self.returnWith('boost 30')
    
    def boost60Selected(self):
        self.returnWith('boost 60')
    
    def boost120Selected(self):
        self.returnWith('boost 120')

    def returnWith(self, result):
        self.result = result
        # Create a timer and wait for it
        timer = QTimer()
        timer.setSingleShot(True)
        timer.start(300)  # 300ms delay
        while timer.isActive():
            QApplication.processEvents()
        self.accept()

    def showDialog(self):
        # Show dialog and return result
        if self.exec() == DialogCode.Accepted:
            return self.result
        return None
    
    def closeDialog(self, _):
        self.reject()
    
###############################################################################
# An RBR MainWindow EC object
class RBRMainWindow(ECGElement):
    def __init__(self):
        super().__init__()
    
    # This type of widget is clearable
    def isClearable(self):
         return True
    
###############################################################################
# The RBR Main Window
class MainWindow(QMainWindow):
    def __init__(self, program=None, title='', x=0, y=0, w=800, h=600):
        super().__init__()
        self.program = program
        self.setGeometry(x, y, w, h)
        self.width = w # type: ignore
        self.height = h # type: ignore
        self.currentIndex = 0

        if title == '': self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        else: self.setWindowTitle(title)

        # Set the background image
        palette = QPalette()
        background_pixmap = QPixmap(f'img/backdrop.png')
        palette.setBrush(ColorRole.Window, QBrush(background_pixmap))
        self.setPalette(palette)

        # Panel for the main components
        content = QWidget()
        content.setStyleSheet('''
            background-color: #fff;
            margin:0;
        ''')
        contentLayout = QVBoxLayout(content)
        contentLayout.setSpacing(0)
        self.contentLayout = contentLayout
        self.content = content

        self.initContent()

        # Main layout
        mainWidget = QWidget()
        mainLayout = QVBoxLayout(mainWidget)
        mainLayout.setContentsMargins(0, 0, 0, 0)
        mainLayout.addWidget(content)
        mainLayout.addStretch(1)

        self.setCentralWidget(mainWidget)

    # Initialize the content of the main window
    def initContent(self):
        # Add the main banner
        banner = Banner(self.program, self.width)
        self.contentLayout.addWidget(banner)
        self.banner = banner

        # Add the system name and Profiles button
        profiles = Profiles(self.program, self.width)
        self.contentLayout.addWidget(profiles)
        self.profiles = profiles

        # Add a pop-out panel for interactions
        popout = Popout(self.program, self.width)
        self.contentLayout.addWidget(popout)
        self.popout = popout

        # The main container, which has 2 views
        self.container = QStackedWidget()

        # Panel for rows
        self.mainPanel = QWidget()
        self.mainPanel.setStyleSheet('''
            background: transparent;
            border: none;
            margin: 5px;
            padding: 0;
        ''')

        # Panel for anything else that needs to be rendered
        self.secondPanel = QWidget()

        roomsLayout = QVBoxLayout(self.mainPanel)
        roomsLayout.setSpacing(0)
        roomsLayout.setContentsMargins(0, 0, 0, 0)
        self.contentLayout.addWidget(self.container)
        self.rooms = roomsLayout
        self.container.addWidget(self.mainPanel)
        self.container.addWidget(self.secondPanel)
        self.container.setCurrentIndex(self.currentIndex)
    
    def setAttribute(self, name, value):
        if name == 'currentIndex':
            self.currentIndex = int(value)
            self.container.setCurrentIndex(self.currentIndex)
    
    def getElement(self, name):
        if name == 'banner': return self.banner
        elif name == 'profiles': return self.profiles
        elif name == 'rooms': return self.rooms
        elif name == 'second': return self.secondPanel
        elif name == 'popout': return self.popout
        else: return None
    
    def setSecondPanel(self, widget):
        oldPanel = self.secondPanel
        self.container.removeWidget(oldPanel)
        oldPanel.deleteLater()
        # Add the new widget
        self.container.insertWidget(1, widget)
        self.secondPanel = widget

    def getSecondPanel(self):
        return self.secondPanel

    def showMainPanel(self):
        self.container.setCurrentIndex(0)
        self.currentIndex = 0

    def showSecondPanel(self):
        self.container.setCurrentIndex(1)
        self.currentIndex = 1

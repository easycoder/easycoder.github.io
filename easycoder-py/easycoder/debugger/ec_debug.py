import sys, os, json, html
from PySide6.QtWidgets import (
    QMainWindow,
    QWidget,
    QFrame,
    QHBoxLayout,
    QGridLayout,
    QVBoxLayout,
    QLabel,
    QSplitter,
    QMessageBox,
    QScrollArea,
    QScrollBar,
    QSizePolicy,
    QToolBar,
    QPushButton,
    QInputDialog,
    QTabWidget
)
from PySide6.QtGui import QTextCursor, QIcon
from PySide6.QtCore import Qt, QTimer
from typing import Any, Optional
from .ec_dbg_value_display import ValueDisplay
from .ec_dbg_watchlist import WatchListWidget

class Object():
    def __setattr__(self, name: str, value: Any) -> None:
        self.__dict__[name] = value
    
    def __getattr__(self, name: str) -> Any:
        return self.__dict__.get(name)

class Debugger(QMainWindow):
    # Help type-checkers know these attributes exist
    _flush_timer: Optional[QTimer]

    class ConsoleWriter:
        def __init__(self, debugger: 'Debugger'):
            self.debugger = debugger
            self._buf: list[str] = []

        def write(self, text: str):
            if not text:
                return
            
            # Echo all output to original stdout with proper line breaks
            try:
                if self.debugger._orig_stdout:
                    self.debugger._orig_stdout.write(text)
                    self.debugger._orig_stdout.flush()
            except Exception:
                pass
            
            # Check if this looks like an error message - if so, also write to original stderr
            if any(err_marker in text for err_marker in ['Error', 'Traceback', 'Exception']):
                try:
                    if self.debugger._orig_stderr:
                        self.debugger._orig_stderr.write(text)
                        self.debugger._orig_stderr.flush()
                except Exception:
                    pass
            
            # Buffer text and request a flush on the GUI timer
            self._buf.append(text)
            if self.debugger._flush_timer and not self.debugger._flush_timer.isActive():
                self.debugger._flush_timer.start()

        def flush(self):
            # Explicit flush request
            self.debugger._flush_console_buffer()

    ###########################################################################
    # The left-hand column of the main window
    class MainLeftColumn(QWidget):
        def __init__(self, parent=None):
            super().__init__(parent)
            self.debugger = parent
            layout = QVBoxLayout(self)

            # Header panel
            variable_panel = QFrame()
            variable_panel.setFrameShape(QFrame.Shape.StyledPanel)
            variable_panel.setStyleSheet("background-color: white;")
            variable_panel.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            watch_layout = QHBoxLayout(variable_panel)
            watch_layout.setContentsMargins(4, 4, 4, 4)
            watch_layout.setSpacing(4)

            title_label = QLabel("VARIABLES")
            title_label.setStyleSheet("font-weight: bold; letter-spacing: 1px;")
            watch_layout.addWidget(title_label)
            watch_layout.addStretch()

            add_btn = QPushButton("+")
            add_btn.setToolTip("Add variable to watch")
            add_btn.setFixedSize(24, 24)
            add_btn.clicked.connect(self.on_add_clicked)
            watch_layout.addWidget(add_btn)

            layout.addWidget(variable_panel)

            # Watch list widget
            self.watch_list = WatchListWidget(self.debugger)
            layout.addWidget(self.watch_list, 1)

        def on_add_clicked(self):
            try:
                program = self.debugger.program  # type: ignore[attr-defined]
                items = []
                if hasattr(program, 'symbols') and isinstance(program.symbols, dict) and program.symbols:
                    items = sorted([name for name in program.symbols.keys() if name and not name.endswith(':')])
                else:
                    for cmd in getattr(program, 'code', []):
                        try:
                            if cmd.get('type') == 'symbol' and 'name' in cmd:
                                items.append(cmd['name'])
                        except Exception:
                            pass
                    items = sorted(set(items))
                if not items:
                    QMessageBox.information(self, "Add Watch", "No variables found in this program.")
                    return

                # Use a custom chooser dialog with a visible list (already open)
                from PySide6.QtWidgets import QDialog, QVBoxLayout, QListWidget, QDialogButtonBox
                dlg = QDialog(self)
                dlg.setWindowTitle("Add Watch")
                v = QVBoxLayout(dlg)
                lst = QListWidget(dlg)
                lst.addItems(items)
                lst.setSelectionMode(QListWidget.SelectionMode.SingleSelection)
                if items:
                    lst.setCurrentRow(0)
                # Allow double-click to accept immediately
                def accept_double(item):
                    if item:
                        lst.setCurrentItem(item)
                    dlg.accept()
                lst.itemDoubleClicked.connect(accept_double)
                v.addWidget(lst)
                buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel, parent=dlg)
                v.addWidget(buttons)
                buttons.accepted.connect(dlg.accept)
                buttons.rejected.connect(dlg.reject)
                if dlg.exec() == QDialog.DialogCode.Accepted:
                    cur = lst.currentItem()
                    choice = cur.text() if cur else None
                    if choice:
                        self.watch_list.addVariable(choice)
                        try:
                            self.debugger.console.append(f"Watching: {choice}")  # type: ignore[attr-defined]
                        except Exception:
                            pass
            except Exception as exc:
                QMessageBox.warning(self, "Add Watch", f"Could not list variables: {exc}")

    ###########################################################################
    # A single script panel that displays one script's lines
    class ScriptPanel(QWidget):
        scroll: QScrollArea
        layout: QHBoxLayout  # type: ignore[assignment]
        
        def __init__(self, parent=None):
            super().__init__(parent)
            
            # Set white background
            self.setStyleSheet("background-color: white;")
            
            # Main layout
            panel_layout = QVBoxLayout(self)
            panel_layout.setContentsMargins(0, 0, 0, 0)
            panel_layout.setSpacing(0)

            # Create a scroll area - its content widget holds the lines
            self.scroll = QScrollArea()
            self.scroll.setStyleSheet("background-color: white;")
            self.scroll.setWidgetResizable(True)

            # Ensure this widget and the scroll area expand to fill available space
            self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            self.scroll.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

            self.content = QWidget()
            # let the content expand horizontally but have flexible height
            self.content.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)

            self.inner_layout = QVBoxLayout(self.content)
            # spacing and small top/bottom margins to separate lines
            self.inner_layout.setSpacing(0)
            self.inner_layout.setContentsMargins(0, 0, 0, 0)

            self.scroll.setWidget(self.content)

            # Add scroll area to the panel layout
            panel_layout.addWidget(self.scroll)
            
            # Store script lines for this panel
            self.scriptLines = []

        #######################################################################
        # Add a line to this script panel
        def addLine(self, spec):

            # is_command will be set later by enableBreakpoints() after compilation
            # Initialize to False for now
            spec.is_command = False

            class Label(QLabel):
                def __init__(self, text, fixed_width=None, align=Qt.AlignmentFlag.AlignLeft, on_click=None):
                    super().__init__()
                    self.setText(text)
                    self.setMargin(0)
                    self.setContentsMargins(0, 0, 0, 0)
                    self.setStyleSheet("padding:0px; margin:0px; font-family: mono")
                    fm = self.fontMetrics()
                    self.setFixedHeight(fm.height())
                    if fixed_width is not None:
                        self.setFixedWidth(fixed_width)
                    self.setAlignment(align | Qt.AlignmentFlag.AlignVCenter)
                    self._on_click = on_click

                def mousePressEvent(self, event):
                    if self._on_click:
                        try:
                            self._on_click()
                        except Exception:
                            pass
                    super().mousePressEvent(event)

            spec.label = self
            panel = QWidget()
            # ensure the panel itself has no margins
            try:
                panel.setContentsMargins(0, 0, 0, 0)
            except Exception:
                pass
            # tidy layout: remove spacing/margins so lines sit flush
            layout = QHBoxLayout(panel)
            layout.setSpacing(0)
            layout.setContentsMargins(0, 0, 0, 0)
            self.layout: QHBoxLayout = layout  # type: ignore
            # make panel take minimal vertical space
            panel.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            # compute width to fit a 4-digit line number using this widget's font
            fm_main = self.fontMetrics()
            width_4 = fm_main.horizontalAdvance('0000') + 8


            # create the red blob (always present). We'll toggle its opacity
            # by changing the stylesheet (rgba alpha 255/0). Do NOT store it
            # on the MainRightColumn instance — keep it per-line.

            class ClickableBlob(QLabel):
                def __init__(self, on_click=None):
                    super().__init__()
                    self._on_click = on_click
                def mousePressEvent(self, event):
                    if self._on_click:
                        try:
                            self._on_click()
                        except Exception:
                            pass
                    super().mousePressEvent(event)

            blob_size = 10
            blob = ClickableBlob(on_click=lambda: spec.onClick(spec.lino))
            blob.setFixedSize(blob_size, blob_size)

            def set_blob_visible(widget, visible):
                alpha = 255 if visible else 0
                widget.setStyleSheet(f"background-color: rgba(255,0,0,{alpha}); border-radius: {blob_size//2}px; margin:0px; padding:0px;")
                widget._blob_visible = visible
                # force repaint
                widget.update()

            # attach methods to this blob so callers can toggle it via spec.label
            blob.showBlob = lambda: set_blob_visible(blob, True)  # type: ignore[attr-defined]
            blob.hideBlob = lambda: set_blob_visible(blob, False)  # type: ignore[attr-defined]

            # initialize according to spec flag
            if spec.bp:
                blob.showBlob()  # type: ignore[attr-defined]
            else:
                blob.hideBlob()  # type: ignore[attr-defined]

            # expose the blob to the outside via spec['label'] so onClick can call showBlob/hideBlob
            spec.label = blob

            # create the line-number label; clicking it reports back to the caller
            lino_label = Label(str(spec.lino+1), fixed_width=width_4, align=Qt.AlignmentFlag.AlignRight,
                               on_click=lambda: spec.onClick(spec.lino))
            lino_label.setSizePolicy(QSizePolicy.Policy.Fixed, QSizePolicy.Policy.Fixed)
            # create the text label for the line itself
            text_label = Label(spec.line, fixed_width=None, align=Qt.AlignmentFlag.AlignLeft)
            text_label.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
            layout.addWidget(lino_label)
            layout.addSpacing(10)
            layout.addWidget(blob, 0, Qt.AlignmentFlag.AlignVCenter)
            layout.addSpacing(3)
            layout.addWidget(text_label)
            self.inner_layout.addWidget(panel)
            return panel
        
        def addStretch(self):
            self.inner_layout.addStretch()

    ###########################################################################
    # The right-hand column of the main window
    class MainRightColumn(QWidget):
        
        def __init__(self, parent=None):
            super().__init__(parent)
            
            # Set white background for the entire column
            self.setStyleSheet("background-color: white;")
            
            # Main layout for this column
            column_layout = QVBoxLayout(self)
            column_layout.setContentsMargins(0, 0, 0, 0)
            column_layout.setSpacing(0)
            
            # Create toolbar with icon buttons
            toolbar = QToolBar()
            toolbar.setMovable(False)
            
            # Get the icons directory path
            icons_dir = os.path.join(os.path.dirname(__file__), '../icons')
            
            # Get the parent debugger for callbacks
            debugger = parent
            
            # Run button
            run_btn = QPushButton()
            run_icon_path = os.path.join(icons_dir, 'run.png')
            run_btn.setIcon(QIcon(run_icon_path))
            run_btn.setToolTip("Run")
            run_btn.clicked.connect(lambda: debugger.doRun() if debugger else None)  # type: ignore[attr-defined]
            toolbar.addWidget(run_btn)
            
            # Step button
            step_btn = QPushButton()
            step_icon_path = os.path.join(icons_dir, 'step.png')
            step_btn.setIcon(QIcon(step_icon_path))
            step_btn.setToolTip("Step")
            step_btn.clicked.connect(lambda: debugger.doStep() if debugger else None)  # type: ignore[attr-defined]
            toolbar.addWidget(step_btn)
            
            # Stop button
            stop_btn = QPushButton()
            stop_icon_path = os.path.join(icons_dir, 'stop.png')
            stop_btn.setIcon(QIcon(stop_icon_path))
            stop_btn.setToolTip("Stop")
            stop_btn.clicked.connect(lambda: debugger.doStop() if debugger else None)  # type: ignore[attr-defined]
            toolbar.addWidget(stop_btn)
            
            # Exit button
            exit_btn = QPushButton()
            exit_icon_path = os.path.join(icons_dir, 'exit.png')
            exit_btn.setIcon(QIcon(exit_icon_path))
            exit_btn.setToolTip("Exit")
            exit_btn.clicked.connect(lambda: debugger.doClose() if debugger else None)  # type: ignore[attr-defined]
            toolbar.addWidget(exit_btn)
            
            column_layout.addWidget(toolbar)

            # Create a tab widget to hold multiple script panels
            self.tabWidget = QTabWidget()
            self.tabWidget.setTabsClosable(False)  # Don't allow closing tabs for now
            
            # Ensure tab widget expands
            self.tabWidget.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
            
            column_layout.addWidget(self.tabWidget)
            
            # Dictionary to map program -> script panel
            self.programPanels = {}

        #######################################################################
        # Add a new script tab
        def addScriptTab(self, program, filename):
            """Add a new tab for a script"""
            panel = Debugger.ScriptPanel(self)
            # Extract just the filename from the full path
            tab_label = os.path.basename(filename)
            self.tabWidget.addTab(panel, tab_label)
            self.programPanels[id(program)] = panel
            return panel
        
        #######################################################################
        # Get the current active script panel
        def getCurrentPanel(self):
            """Get the currently active script panel"""
            return self.tabWidget.currentWidget()
        
        #######################################################################
        # Get the panel for a specific program
        def getPanelForProgram(self, program):
            """Get the panel associated with a program"""
            return self.programPanels.get(id(program))

        #######################################################################
        # Legacy method - add a line to the current panel
        def addLine(self, spec):
            """Delegate to the current panel's addLine method"""
            panel = self.getCurrentPanel()
            if panel and isinstance(panel, Debugger.ScriptPanel):
                return panel.addLine(spec)
            return None
        
        #######################################################################
        # Add stretch to current panel
        def addStretch(self):
            """Delegate to the current panel's addStretch method"""
            panel = self.getCurrentPanel()
            if panel and isinstance(panel, Debugger.ScriptPanel):
                panel.addStretch()

    ###########################################################################
    # Main debugger class initializer
    def __init__(self, program, width=800, height=600, ratio=0.2):
        super().__init__()
        self.program = program
        self.pc = getattr(program, 'pc', 0) if program is not None else 0
        self.setWindowTitle("EasyCoder Debugger")
        self.setMinimumSize(width, height)
        # Disable the window close button
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowCloseButtonHint)
        self.stopped = True
        self.skip_next_breakpoint = False  # Flag to skip breakpoint check on resume
        self.saved_queue = []  # Save queue state when stopped to preserve forked threads
        self._highlighted: set[int] = set()
        self.step_from_line: int | None = None  # Track source line when stepping

        # try to load saved geometry from ~/.ecdebug.conf
        cfg_path = os.path.join(os.path.expanduser("~"), ".ecdebug.conf")
        initial_width = width
        # default console height (pixels) if not stored in cfg
        console_height = 150
        try:
            if os.path.exists(cfg_path):
                with open(cfg_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                x = int(cfg.get("x", 0))
                y = int(cfg.get("y", 0))
                w = int(cfg.get("width", width))
                h = int(cfg.get("height", height))
                ratio =float(cfg.get("ratio", ratio))
                # load console height if present
                console_height = int(cfg.get("console_height", console_height))
                # Apply loaded geometry
                self.setGeometry(x, y, w, h)
                initial_width = w
        except Exception:
            # ignore errors and continue with defaults
            initial_width = width

        # process handle for running scripts
        self._proc = None
        # in-process Program instance and writer
        self._program = None
        self._writer = None
        self._orig_stdout = None
        self._orig_stderr = None
        self._flush_timer = QTimer(self)
        self._flush_timer.setInterval(50)
        self._flush_timer.timeout.connect(self._flush_console_buffer)
        self._flush_timer.stop()

        # Periodic program flush (needed for wait/timers in debug mode)
        self._program_timer = QTimer(self)
        self._program_timer.setInterval(10)
        self._program_timer.timeout.connect(self._tick_program)
        self._program_timer.start()

        # Keep a ratio so proportions are preserved when window is resized
        self.ratio = ratio

        # Central horizontal splitter (left/right)
        self.hsplitter = QSplitter(Qt.Orientation.Horizontal, self)
        self.hsplitter.setHandleWidth(8)
        self.hsplitter.splitterMoved.connect(self.on_splitter_moved)

        # Left pane
        left = QFrame()
        left.setFrameShape(QFrame.Shape.StyledPanel)
        left_layout = QVBoxLayout(left)
        left_layout.setContentsMargins(8, 8, 8, 8)
        left_layout.setSpacing(0)
        self.leftColumn = self.MainLeftColumn(self)
        self.leftColumn.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        left_layout.addWidget(self.leftColumn, 1)

        # Right pane
        right = QFrame()
        right.setFrameShape(QFrame.Shape.StyledPanel)
        right_layout = QVBoxLayout(right)
        right_layout.setContentsMargins(8, 8, 8, 8)
        self.rightColumn = self.MainRightColumn(self)
        # Give the rightColumn a stretch factor so its scroll area fills the vertical space
        right_layout.addWidget(self.rightColumn, 1)

        # Add panes to horizontal splitter
        self.hsplitter.addWidget(left)
        self.hsplitter.addWidget(right)

        # Initial sizes (proportional) for horizontal splitter
        total = initial_width
        self.hsplitter.setSizes([int(self.ratio * total), int((1 - self.ratio) * total)])

        # Create a vertical splitter so we can add a resizable console panel at the bottom
        self.vsplitter = QSplitter(Qt.Orientation.Vertical, self)
        self.vsplitter.setHandleWidth(6)
        # top: the existing horizontal splitter
        self.vsplitter.addWidget(self.hsplitter)

        # bottom: console panel
        console_frame = QFrame()
        console_frame.setFrameShape(QFrame.Shape.StyledPanel)
        console_layout = QVBoxLayout(console_frame)
        console_layout.setContentsMargins(4, 4, 4, 4)
        # simple read-only text console for script output and messages
        from PySide6.QtWidgets import QTextEdit
        self.console = QTextEdit()
        self.console.setReadOnly(True)
        console_layout.addWidget(self.console)
        self.vsplitter.addWidget(console_frame)

        # Redirect stdout/stderr so all program output is captured in the console
        try:
            self._orig_stdout = sys.stdout
            self._orig_stderr = sys.stderr
            self._writer = self.ConsoleWriter(self)
            sys.stdout = self._writer  # type: ignore[assignment]
            sys.stderr = self._writer  # type: ignore[assignment]
        except Exception:
            # Best effort; if redirection fails, continue without it
            self._writer = None

        # Set initial vertical sizes: prefer saved console_height if available
        try:
            total_h = int(h) if 'h' in locals() else max(300, self.height())
            ch = max(50, min(total_h - 50, console_height))
            self.vsplitter.setSizes([int(total_h - ch), int(ch)])
        except Exception:
            pass

        # Use the vertical splitter as the central widget
        self.setCentralWidget(self.vsplitter)
        self.parse(program.script.lines, program, program.scriptName)
        self.show()

    def _flush_console_buffer(self):
        try:
            writer = self._writer
            if not writer:
                return
            if getattr(writer, '_buf', None):
                text = ''.join(writer._buf)
                writer._buf.clear()
                # Append to the console and scroll to bottom
                self.console.moveCursor(QTextCursor.MoveOperation.End)
                self.console.insertPlainText(text)
                self.console.moveCursor(QTextCursor.MoveOperation.End)
        except Exception:
            pass

    def on_splitter_moved(self, pos, index):
        # Update stored ratio when user drags the splitter
        left_width = self.hsplitter.widget(0).width()
        total = max(1, sum(w.width() for w in (self.hsplitter.widget(0), self.hsplitter.widget(1))))
        self.ratio = left_width / total

    def resizeEvent(self, event):
        # Preserve the proportional widths when the window is resized
        total_width = max(1, self.width())
        left_w = max(0, int(self.ratio * total_width))
        right_w = max(0, total_width - left_w)
        self.hsplitter.setSizes([left_w, right_w])
        super().resizeEvent(event)

    ###########################################################################
    # Parse a script into the right-hand column
    def parse(self, script, program=None, filename=None):
        """Parse a script and add it as a tab
        
        Args:
            script: List of script lines
            program: The Program instance this script belongs to
            filename: The filename to use as the tab label
        """
        self.scriptLines = []
        
        # Get or create the panel for this program
        panel = None
        if program:
            panel = self.rightColumn.getPanelForProgram(program)
            if not panel:
                # Create a new tab for this program
                if not filename:
                    filename = getattr(program, 'path', 'Untitled')
                panel = self.rightColumn.addScriptTab(program, filename)
        
        # If no program specified or panel creation failed, use current panel
        if not panel:
            panel = self.rightColumn.getCurrentPanel()
            if not panel:
                # Create a default tab
                panel = self.rightColumn.addScriptTab(None, filename or 'Untitled')
        
        # Clear existing lines from the panel
        if panel and isinstance(panel, Debugger.ScriptPanel):
            layout = panel.inner_layout
            while layout.count():
                item = layout.takeAt(0)
                widget = item.widget()
                if widget:
                    widget.deleteLater()

        # Parse and add new lines
        lino = 0
        for line in script:
            orig_line = line
            if len(line) > 0:
                line = line.replace("\t", "   ")
                color_line = self.coloriseLine(line, lino)
            else:
                # still need to call coloriseLine to keep token list in sync
                color_line = self.coloriseLine(line, lino)
            lineSpec = Object()
            lineSpec.lino = lino
            lineSpec.line = color_line
            lineSpec.orig_line = orig_line
            lineSpec.bp = False
            lineSpec.onClick = self.onClickLino
            lino += 1
            self.scriptLines.append(lineSpec)
            lineSpec.panel = self.rightColumn.addLine(lineSpec)
        self.rightColumn.addStretch()
    
    ###########################################################################
    # Colorise a line of script for HTML display
    def coloriseLine(self, line, lino=None):
        output = ''

        # Preserve leading spaces (render as &nbsp; except the first)
        if len(line) > 0 and line[0] == ' ':
            output += '<span>'
            n = 0
            while n < len(line) and line[n] == ' ': n += 1
            output += '&nbsp;' * (n - 1)
            output += '</span>'

        # Find the first unquoted ! (not inside backticks)
        comment_start = None
        in_backtick = False
        for idx, c in enumerate(line):
            if c == '`':
                in_backtick = not in_backtick
            elif c == '!' and not in_backtick:
                comment_start = idx
                break

        if comment_start is not None:
            code_part = line[:comment_start]
            comment_part = line[comment_start:]
        else:
            code_part = line
            comment_part = None

        # Tokenize code_part as before (respecting backticks)
        tokens = []
        i = 0
        L = len(code_part)
        while i < L:
            if code_part[i].isspace():
                i += 1
                continue
            if code_part[i] == '`':
                j = code_part.find('`', i + 1)
                if j == -1:
                    tokens.append(code_part[i:])
                    break
                else:
                    tokens.append(code_part[i:j+1])
                    i = j + 1
            else:
                j = i
                while j < L and not code_part[j].isspace():
                    j += 1
                tokens.append(code_part[i:j])
                i = j

        # Colour code tokens and generate a list of elements
        for token in tokens:
            if token == '':
                continue
            elif token[0].isupper():
                esc = html.escape(token)
                element = f'&nbsp;<span style="color: purple; font-weight: bold;">{esc}</span>'
            elif token[0].isdigit():
                esc = html.escape(token)
                element = f'&nbsp;<span style="color: green;">{esc}</span>'
            elif token[0] == '`':
                esc = html.escape(token)
                element = f'&nbsp;<span style="color: peru;">{esc}</span>'
            else:
                esc = html.escape(token)
                element = f'&nbsp;<span>{esc}</span>'
            output += element
        # Colour comment if present
        if comment_part is not None:
            esc = html.escape(comment_part)
            output += f'<span style="color: green;">&nbsp;{esc}</span>'

        return output
    
    ###########################################################################
    # Enable breakpoints to be set on any line that is classed as a command
    def enableBreakpoints(self):
        """
        Examine each line and set is_command flag based on compiled code.
        A line is a command if:
        - It's not empty or a comment
        - It's not a label (single word ending with colon)
        - It corresponds to a command in program.code with type != 'symbol'
        """
        # First, mark all lines as non-commands by default
        for lineSpec in self.scriptLines:
            lineSpec.is_command = False
        
        # Now iterate through compiled commands and mark those that are executable
        for command in self.program.code:
            if 'lino' not in command:
                continue
            
            lino = command['lino']
            if lino < 0 or lino >= len(self.scriptLines):
                continue
            
            # Check if this is a symbol declaration (variable/constant definition)
            if command.get('type') == 'symbol':
                continue
            
            # Check if this is a structural keyword that shouldn't have breakpoints
            if command.get('keyword') in ['begin', 'end']:
                continue
            
            # This is an executable command
            self.scriptLines[lino].is_command = True
    
    ###########################################################################
    # Here when the user clicks a line number
    def onClickLino(self, lino):
        # Check if this line is a command - if not, take no action
        lineSpec = self.scriptLines[lino]
        if not getattr(lineSpec, 'is_command', True):
            return
        
        # Show or hide the red blob next to this line
        lineSpec.bp = not lineSpec.bp
        if lineSpec.bp: lineSpec.label.showBlob()
        else: lineSpec.label.hideBlob()
        # Set or clear a breakpoint on this command
        for command in self.program.code:
            if 'lino' in command and command['lino'] == lino:
                command['bp'] = lineSpec.bp
                break
    
    ###########################################################################
    # Scroll to a given line number
    def scrollTo(self, lino):
        # Ensure the line number is valid
        if lino < 0 or lino >= len(self.scriptLines):
            return
        
        # Get the panel widget for this line
        lineSpec = self.scriptLines[lino]
        panel = lineSpec.panel
        
        if not panel:
            return
        
        # Get the current script panel
        script_panel = self.rightColumn.getCurrentPanel()
        if not script_panel or not isinstance(script_panel, Debugger.ScriptPanel):
            return
            
        # Get the scroll area from the script panel
        scroll_area = script_panel.scroll
        
        # Get the vertical position of the panel relative to the content widget
        panel_y = panel.y()
        panel_height = panel.height()
        
        # Get the viewport height (visible area)
        viewport_height = scroll_area.viewport().height()
        
        # Calculate the target scroll position to center the panel
        # We want the panel's center to align with the viewport's center
        target_scroll = panel_y + (panel_height // 2) - (viewport_height // 2)
        
        # Clamp to valid scroll range
        scrollbar = scroll_area.verticalScrollBar()
        target_scroll = max(scrollbar.minimum(), min(target_scroll, scrollbar.maximum()))
        
        # Smoothly scroll to the target position
        scrollbar.setValue(target_scroll)
        
        # Bring the window to the front
        self.raise_()
        self.activateWindow()
    
    ###########################################################################
    # Set the background color of one line of the script
    def setBackground(self, lino, color):
        # Set the background color of the given line and track highlighted lines
        if lino < 0 or lino >= len(self.scriptLines):
            return
        lineSpec = self.scriptLines[lino]
        panel = lineSpec.panel
        if not panel:
            return
        if color == 'none':
            panel.setStyleSheet("")
            self._highlighted.discard(lino)
        else:
            panel.setStyleSheet(f"background-color: {color};")
            self._highlighted.add(lino)

    def _clearHighlights(self):
        # Remove highlighting from all previously highlighted lines
        for lino in list(self._highlighted):
            self.setBackground(lino, 'none')
        self._highlighted.clear()
    
    ###########################################################################
    # Here before each instruction is run
    # Returns True if the program should halt and wait for user interaction
    def checkIfHalt(self, is_first_command=False):
        self.pc = self.program.pc
        command = self.program.code[self.pc]
        lino = command['lino'] if 'lino' in command else 0
        bp = command.get('bp', False)
        
        # Check if we should skip this breakpoint check (resuming from same location)
        if self.skip_next_breakpoint:
            self.skip_next_breakpoint = False
            return False
        
        # Labels should never halt execution - they're just markers
        # A label is a symbol whose name ends with ':'
        if command.get('type') == 'symbol' and command.get('name', '').endswith(':'):
            return False
        
        # Determine if we should halt
        should_halt = False
        
        # If we're in stopped (step) mode, halt after each command
        if self.stopped:
            # If stepping, only halt when we reach a different source line
            if self.step_from_line is not None:
                if lino != self.step_from_line:
                    should_halt = True
                    self.step_from_line = None
            else:
                should_halt = True
        # If there's a breakpoint on this line, halt
        elif bp:
            print(f"Hit breakpoint at line {lino + 1}")
            self.stopped = True
            should_halt = True
        
        # If halting, update the UI and save queue state
        if should_halt:
            self.scrollTo(lino)
            self._clearHighlights()
            self.setBackground(lino, 'Yellow')
            # Refresh variable values when halted
            self.refreshVariables()
            # Save the current queue state to preserve forked threads
            self._saveQueueState()
        
        return should_halt
    
    def refreshVariables(self):
        """Update all watched variable values"""
        try:
            if hasattr(self, 'leftColumn') and hasattr(self.leftColumn, 'watch_list'):
                self.leftColumn.watch_list.refreshVariables(self.program)
        except Exception as ex:
            print(f"Error refreshing variables: {ex}")
    
    def _saveQueueState(self):
        """Save the current global queue state (preserves forked threads)"""
        try:
            # Import the module to access the global queue
            from easycoder import ec_program
            # Save a copy of the queue
            self.saved_queue = list(ec_program.queue)
        except Exception as ex:
            print(f"Error saving queue state: {ex}")
    
    def _restoreQueueState(self):
        """Restore the saved queue state (resume all forked threads)"""
        try:
            # Import here to avoid circular dependency
            from easycoder import ec_program
            # Restore the queue from saved state
            if self.saved_queue:
                ec_program.queue.clear()
                ec_program.queue.extend(self.saved_queue)
        except Exception as ex:
            print(f"Error restoring queue state: {ex}")

    def _tick_program(self):
        """Periodic flush to keep debug-mode scripts progressing."""
        try:
            if self.program and self.program.running:
                from easycoder.ec_program import flush
                flush()
        except Exception as ex:
            print(f"Error during program tick: {ex}")
    
    def doRun(self):
        """Resume free-running execution from current PC"""
        command = self.program.code[self.pc]
        lino = command.get('lino', 0)
        print(f"Continuing execution at line {lino + 1}")
        
        # Clear the highlight on the current line
        self.setBackground(lino, 'none')
        
        # Switch to free-running mode
        self.stopped = False
        self.step_from_line = None
        
        # Skip the breakpoint check for the current instruction (the one we're resuming from)
        self.skip_next_breakpoint = True
        
        # Restore the saved queue state to resume all forked threads
        self._restoreQueueState()

        # Enqueue the current thread, then flush immediately
        self.program.run(self.pc)
        from easycoder.ec_program import flush
        flush()
    
    def doStep(self):
        """Execute one instruction and halt again"""
        command = self.program.code[self.pc]
        lino = command.get('lino', 0)
        
        # Clear the highlight on the current line
        self.setBackground(lino, 'none')
        
        # Stay in stopped mode (will halt after next instruction)
        self.stopped = True
        # Remember the line we're stepping from - don't halt until we reach a different line
        self.step_from_line = lino
        
        # Skip the breakpoint check for the current instruction (the one we're stepping from)
        self.skip_next_breakpoint = True
        
        # Restore the saved queue state to resume all forked threads
        self._restoreQueueState()

        # Enqueue the current thread, then flush a single cycle
        self.program.run(self.pc)
        from easycoder.ec_program import flush
        flush()
    
    def doStop(self):
        try:
            lino = self.program.code[self.pc].get('lino', 0) + 1
            print(f"Stopped by user at line {lino}")
        except Exception:
            print("Stopped by user")
        # Clear all previous highlights and mark the current line
        try:
            self._clearHighlights()
            current_lino = self.program.code[self.pc].get('lino', 0)
            self.setBackground(current_lino, 'LightYellow')
        except Exception:
            pass
        self.stopped = True
    
    def doClose(self):
        self.closeEvent(None)

    ###########################################################################
    # Override closeEvent to save window geometry
    def closeEvent(self, event):
        """Save window position and size to ~/.ecdebug.conf as JSON on exit."""
        cfg = {
            "x": self.x(),
            "y": self.y(),
            "width": self.width(),
            "height": self.height(),
            "ratio": self.ratio
        }
        # try to persist console height (bottom pane) if present
        try:
            ch = None
            if hasattr(self, 'vsplitter'):
                sizes = self.vsplitter.sizes()
                if len(sizes) >= 2:
                    ch = int(sizes[1])
            if ch is not None:
                cfg['console_height'] = ch
        except Exception:
            pass
        try:
            cfg_path = os.path.join(os.path.expanduser("~"), ".ecdebug.conf")
            with open(cfg_path, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
        except Exception as exc:
            # best-effort only; avoid blocking shutdown
            try:
                self.statusBar().showMessage(f"Could not save config: {exc}", 3000)
            except Exception:
                pass
        # Restore stdout/stderr and stop timers
        try:
            if self._orig_stdout is not None:
                sys.stdout = self._orig_stdout
            if self._orig_stderr is not None:
                sys.stderr = self._orig_stderr
            if self._flush_timer is not None:
                try:
                    self._flush_timer.stop()
                except Exception:
                    pass
        except Exception:
            pass
        super().close()
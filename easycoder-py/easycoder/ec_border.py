import os
from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPixmap, QPainter
from PySide6.QtCore import Qt, Signal, QRect

class Border(QWidget):
    tickClicked = Signal()
    closeClicked = Signal()

    def __init__(self):
        super().__init__()
        self._size = 40
        self.setFixedHeight(self._size)
        self._drag_active = False
        self._drag_start_pos = None
        self._tick: QPixmap = QPixmap()
        self._close_icon: QPixmap = QPixmap()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # Draw the tick icon
        self._tick = QPixmap(f'{os.path.dirname(os.path.abspath(__file__))}/icons/tick.png').scaled(
            self._size, self._size, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
        x = 0
        y = 0
        painter.drawPixmap(x, y, self._tick)
        # Draw the close icon
        self._close_icon = QPixmap(f'{os.path.dirname(os.path.abspath(__file__))}/icons/close.png').scaled(
            self._size, self._size, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
        x = self.width() - self._close_icon.width()
        y = 0
        painter.drawPixmap(x, y, self._close_icon)

    def mousePressEvent(self, event):
        # Tick icon
        x = 0
        y = 0
        tickRect = self._tick.rect().translated(x, y)
        # Close icon
        x = self.width() - self._close_icon.width()
        y = 0
        closeRect = self._close_icon.rect().translated(x, y)
        if tickRect.contains(event.pos()):
            self.tickClicked.emit()
        if closeRect.contains(event.pos()):
            self.closeClicked.emit()
        elif QRect(0, 0, self.width(), self.height()).contains(event.pos()):
            if hasattr(self.window().windowHandle(), 'startSystemMove'):
                self.window().windowHandle().startSystemMove()
            else:
                self._drag_active = True
                self._drag_start_pos = event.globalPosition().toPoint()
                self._dialog_start_pos = self.window().pos()
        else:
            super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if self._drag_active:
            delta = event.globalPosition().toPoint() - self._drag_start_pos
            self.window().move(self._dialog_start_pos + delta)
        else:
            super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        self._drag_active = False
        super().mouseReleaseEvent(event)

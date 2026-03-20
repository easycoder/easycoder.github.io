#!/usr/bin/env python3

"""Minimal PySide6 example: a window with a single push button."""

import sys
from PySide6.QtWidgets import QApplication, QMainWindow, QWidget, QPushButton, QVBoxLayout


class DebugMainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Debug Window")

        # Set up the layout and button
        layout = QVBoxLayout()
        button = QPushButton("Click Me")
        layout.addWidget(button)

        # Set the central widget
        central_widget = QWidget()
        central_widget.setLayout(layout)
        self.setCentralWidget(central_widget)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    w = DebugMainWindow()
    w.show()
    sys.exit(app.exec())

"""WatchListWidget showing variables on a single line with scrollable values."""

import bisect
import json

from PySide6.QtWidgets import (
    QWidget,
    QHBoxLayout,
    QVBoxLayout,
    QLabel,
    QPushButton,
    QSizePolicy,
    QScrollArea,
    QPlainTextEdit,
    QFrame,
    QSplitter,
)
from PySide6.QtCore import Qt
from easycoder.ec_classes import ECVariable, ECDictionary, ECList, ECValue
from .ec_dbg_value_display import ValueDisplay


class WatchListWidget(QWidget):
    def __init__(self, debugger):
        super().__init__(debugger)
        self.debugger = debugger
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

        self._rows: dict[str, dict] = {}
        self._variable_set: set[str] = set()
        self._order: list[str] = []
        self._placeholder: QLabel | None = None
        self._expanded_name: str | None = None

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(6)

        self.splitter = QSplitter(Qt.Orientation.Vertical, self)
        self.splitter.setHandleWidth(6)
        self.splitter.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

        list_container = QWidget(self)
        list_container.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        # Outer layout: scrollable labels (left) and fixed button column (right)
        outer = QHBoxLayout(list_container)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(2)

        # Left: scroll area for labels
        self.scroll = QScrollArea(self)
        self.scroll.setWidgetResizable(True)
        self.scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.scroll.setFrameShape(QScrollArea.Shape.NoFrame)

        self.content = QWidget()
        self.content_layout = QVBoxLayout(self.content)
        self.content_layout.setContentsMargins(4, 2, 4, 2)
        self.content_layout.setSpacing(4)
        self.content_layout.addStretch(1)  # keep items grouped at the top

        self.scroll.setWidget(self.content)
        outer.addWidget(self.scroll, 1)

        # Right: button column, top-aligned
        self.buttons_column = QVBoxLayout()
        self.buttons_column.setContentsMargins(0, 2, 4, 2)
        self.buttons_column.setSpacing(4)
        self.buttons_column.addStretch(1)
        outer.addLayout(self.buttons_column)

        self.splitter.addWidget(list_container)

        self._build_expanded_panel()

        main_layout.addWidget(self.splitter, 1)
        # Give the list more space by default
        try:
            self.splitter.setStretchFactor(0, 3)
            self.splitter.setStretchFactor(1, 2)
        except Exception:
            pass

        self._show_placeholder()

    def _build_expanded_panel(self):
        self.expanded_frame = QFrame(self)
        self.expanded_frame.setFrameShape(QFrame.Shape.StyledPanel)
        self.expanded_frame.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

        expanded_layout = QVBoxLayout(self.expanded_frame)
        expanded_layout.setContentsMargins(6, 6, 6, 6)
        expanded_layout.setSpacing(4)

        self.expanded_title = QLabel("Expanded view")
        self.expanded_title.setStyleSheet("font-weight: bold;")
        expanded_layout.addWidget(self.expanded_title)

        self.expanded_body = QPlainTextEdit(self.expanded_frame)
        self.expanded_body.setReadOnly(True)
        self.expanded_body.setLineWrapMode(QPlainTextEdit.LineWrapMode.WidgetWidth)
        self.expanded_body.setStyleSheet("font-family: monospace; background-color: #fafafa;")
        expanded_layout.addWidget(self.expanded_body)

        self.splitter.addWidget(self.expanded_frame)
        self._clear_expanded_panel()

    def _show_placeholder(self):
        if self._placeholder is not None:
            return
        self._placeholder = QLabel("No variables watched. Click + to add.")
        self._placeholder.setStyleSheet("color: #666; font-style: italic; padding: 4px 2px;")
        self.content_layout.insertWidget(self.content_layout.count() - 1, self._placeholder)

    def _hide_placeholder(self):
        if self._placeholder is None:
            return
        self.content_layout.removeWidget(self._placeholder)
        self._placeholder.deleteLater()
        self._placeholder = None

    def addVariable(self, name: str):
        if not name or name in self._variable_set:
            return
        if not hasattr(self.debugger, 'watched'):
            self.debugger.watched = []  # type: ignore[attr-defined]
        if name not in self.debugger.watched:  # type: ignore[attr-defined]
            bisect.insort(self.debugger.watched, name)  # type: ignore[attr-defined]

        self._hide_placeholder()

        # Row with label
        row_widget = QWidget(self)
        row_layout = QHBoxLayout(row_widget)
        row_layout.setContentsMargins(4, 0, 4, 0)
        row_layout.setSpacing(6)

        label = QLabel("")
        label.setWordWrap(False)
        row_layout.addWidget(label, 1)

        # Buttons live in a side container: remove (x) and expand (+)
        button_container = QWidget(self)
        button_row = QHBoxLayout(button_container)
        button_row.setContentsMargins(0, 0, 0, 0)
        button_row.setSpacing(4)

        remove_btn = QPushButton("x")
        remove_btn.setFixedWidth(22)
        expand_btn = QPushButton("+")
        expand_btn.setFixedWidth(22)
        button_row.addWidget(remove_btn)
        button_row.addWidget(expand_btn)

        def on_remove():
            try:
                if hasattr(self.debugger, 'watched') and name in self.debugger.watched:  # type: ignore[attr-defined]
                    self.debugger.watched.remove(name)  # type: ignore[attr-defined]
                if name in self._variable_set:
                    self._variable_set.remove(name)
                if name in self._order:
                    self._order.remove(name)
                self.content_layout.removeWidget(row_widget)
                row_widget.deleteLater()
                self.buttons_column.removeWidget(button_container)
                button_container.deleteLater()
                self._rows.pop(name, None)
                if self._expanded_name == name:
                    self._clear_expanded_panel()
                if not self._rows:
                    self._clear_expanded_panel()
                    self._show_placeholder()
            except Exception:
                pass

        remove_btn.clicked.connect(on_remove)
        expand_btn.clicked.connect(lambda: self._on_expand(name))

        insert_pos = bisect.bisect_left(self._order, name)
        self._order.insert(insert_pos, name)
        # Insert label row above stretch, keeping alphabetical order
        self.content_layout.insertWidget(insert_pos, row_widget)
        # Insert button above stretch on the right, same position
        self.buttons_column.insertWidget(insert_pos, button_container)

        # Align button height to row height
        row_widget.adjustSize()
        btn_h = row_widget.sizeHint().height()
        if btn_h > 0:
            button_container.setFixedHeight(btn_h)
            remove_btn.setFixedHeight(btn_h)
            expand_btn.setFixedHeight(btn_h)

        self._rows[name] = {
            'widget': row_widget,
            'label': label,
            'buttons': button_container,
            'remove_btn': remove_btn,
            'expand_btn': expand_btn,
            'summary': '',
            'detail': '',
        }
        self._variable_set.add(name)

        try:
            self._refresh_one(name, self.debugger.program)
        except Exception:
            pass

    def _refresh_one(self, name: str, program):
        row = self._rows.get(name)
        if not row:
            return
        detail_text = ''
        try:
            summary_text, detail_text = self._get_value_texts(program, name)
            row['summary'] = summary_text
            row['detail'] = detail_text
        except Exception as e:
            summary_text = f"<error: {e}>"
            row['summary'] = summary_text
            row['detail'] = ''
        row['label'].setText(f"{name} = {summary_text}")
        if self._expanded_name == name:
            self._apply_expanded_content(name, summary_text, detail_text)

    def refreshVariables(self, program):
        if not self._rows:
            self._show_placeholder()
            return
        for name in list(self._rows.keys()):
            self._refresh_one(name, program)

    def _get_value_texts(self, program, name: str):
        summary = ValueDisplay.render_text(program, name)
        if summary is None:
            summary = ''

        try:
            record = program.getVariable(name)
            obj = program.getObject(record)
        except Exception:
            return summary, ''

        detail = ''
        try:
            if isinstance(obj, ECVariable):
                detail = summary
            elif isinstance(obj, ECDictionary):
                raw = obj.getValue()
                if isinstance(raw, ECValue):
                    raw = raw.getContent()
                if isinstance(raw, dict):
                    detail = json.dumps(raw, indent=2)
            elif isinstance(obj, ECList):
                raw = obj.getValue()
                if isinstance(raw, ECValue):
                    raw = raw.getContent()
                if isinstance(raw, list):
                    detail = json.dumps(raw, indent=2)
        except Exception:
            pass
        return summary, detail

    def _on_expand(self, name: str):
        if name not in self._rows:
            return
        try:
            if hasattr(self.debugger, 'program'):
                self._refresh_one(name, self.debugger.program)
        except Exception:
            pass

        row = self._rows.get(name)
        if not row:
            return
        self._expanded_name = name
        self._apply_expanded_content(name, row.get('summary', ''), row.get('detail', ''))

    def _apply_expanded_content(self, name: str, summary: str, detail: str):
        body = detail if detail else summary
        if body is None:
            body = ''
        if not body:
            body = 'No content available for this variable.'
        self.expanded_title.setText(f"Expanded view: {name}")
        self.expanded_body.setPlainText(body)

    def _clear_expanded_panel(self):
        self._expanded_name = None
        self.expanded_title.setText("Expanded view")
        self.expanded_body.setPlainText("Select a watched variable and click + to view its contents.")

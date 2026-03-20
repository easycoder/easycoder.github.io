"""WatchListWidget for managing the variable watch list in the EasyCoder debugger"""

from PySide6.QtWidgets import (
    QWidget,
    QFrame,
    QHBoxLayout,
    QVBoxLayout,
    QGridLayout,
    QLabel,
    """WatchListWidget for managing the variable watch list in the EasyCoder debugger

    Simplified to show variables in single-line form: `Name = value`.
    """

    from PySide6.QtWidgets import (
        QWidget,
        QHBoxLayout,
        QVBoxLayout,
        QLabel,
        QPushButton,
        QSizePolicy,
    )
    from .ec_dbg_value_display import ValueDisplay


    class WatchListWidget(QWidget):
        """Simple watch list that renders each variable on a single line."""

        def __init__(self, debugger):
            super().__init__(debugger)
            self.debugger = debugger
            self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

            self._rows: dict[str, dict] = {}
            self._variable_set: set[str] = set()
            self._placeholder: QLabel | None = None

            self.layout = QVBoxLayout(self)
            self.layout.setContentsMargins(0, 0, 0, 0)
            self.layout.setSpacing(2)

            self._show_placeholder()

        # ------------------------------------------------------------------
        def _show_placeholder(self):
            if self._placeholder is not None:
                return
            self._placeholder = QLabel("No variables watched. Click + to add.")
            self._placeholder.setStyleSheet("color: #666; font-style: italic; padding: 4px 2px;")
            self.layout.addWidget(self._placeholder)

        def _hide_placeholder(self):
            if self._placeholder is None:
                return
            self.layout.removeWidget(self._placeholder)
            self._placeholder.deleteLater()
            self._placeholder = None

        # ------------------------------------------------------------------
        def addVariable(self, name: str):
            if not name or name in self._variable_set:
                return
            if not hasattr(self.debugger, 'watched'):
                self.debugger.watched = []  # type: ignore[attr-defined]
            if name not in self.debugger.watched:  # type: ignore[attr-defined]
                self.debugger.watched.append(name)  # type: ignore[attr-defined]

            # Ensure placeholder hidden
            self._hide_placeholder()

            # Build a simple row: [ QLabel("Name = value") | remove_btn ]
            row_widget = QWidget(self)
            row_layout = QHBoxLayout(row_widget)
            row_layout.setContentsMargins(4, 0, 4, 0)
            row_layout.setSpacing(6)

            label = QLabel("")
            label.setWordWrap(False)
            row_layout.addWidget(label, 1)

            remove_btn = QPushButton("–")
            remove_btn.setFixedSize(22, 22)

            def on_remove():
                try:
                    if hasattr(self.debugger, 'watched') and name in self.debugger.watched:  # type: ignore[attr-defined]
                        self.debugger.watched.remove(name)  # type: ignore[attr-defined]
                    if name in self._variable_set:
                        self._variable_set.remove(name)
                    self.layout.removeWidget(row_widget)
                    row_widget.deleteLater()
                    self._rows.pop(name, None)
                    if not self._rows:
                        """WatchListWidget for managing the variable watch list in the EasyCoder debugger

                        Simplified to show variables in single-line form: `Name = value`.
                        """

                        from PySide6.QtWidgets import (
                            QWidget,
                            QHBoxLayout,
                            QVBoxLayout,
                            QLabel,
                            QPushButton,
                            QSizePolicy,
                        )
                        from .ec_dbg_value_display import ValueDisplay


                        class WatchListWidget(QWidget):
                            """Simple watch list that renders each variable on a single line."""

                            def __init__(self, debugger):
                                super().__init__(debugger)
                                self.debugger = debugger
                                self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

                                self._rows: dict[str, dict] = {}
                                self._variable_set: set[str] = set()
                                self._placeholder: QLabel | None = None

                                self.layout = QVBoxLayout(self)
                                self.layout.setContentsMargins(0, 0, 0, 0)
                                self.layout.setSpacing(2)

                                self._show_placeholder()

                            # ------------------------------------------------------------------
                            def _show_placeholder(self):
                                if self._placeholder is not None:
                                    return
                                self._placeholder = QLabel("No variables watched. Click + to add.")
                                self._placeholder.setStyleSheet("color: #666; font-style: italic; padding: 4px 2px;")
                                self.layout.addWidget(self._placeholder)

                            def _hide_placeholder(self):
                                if self._placeholder is None:
                                    return
                                self.layout.removeWidget(self._placeholder)
                                self._placeholder.deleteLater()
                                self._placeholder = None

                            # ------------------------------------------------------------------
                            def addVariable(self, name: str):
                                if not name or name in self._variable_set:
                                    return
                                if not hasattr(self.debugger, 'watched'):
                                    self.debugger.watched = []  # type: ignore[attr-defined]
                                if name not in self.debugger.watched:  # type: ignore[attr-defined]
                                    self.debugger.watched.append(name)  # type: ignore[attr-defined]

                                # Ensure placeholder hidden
                                self._hide_placeholder()

                                # Build a simple row: [ QLabel("Name = value") | remove_btn ]
                                row_widget = QWidget(self)
                                row_layout = QHBoxLayout(row_widget)
                                row_layout.setContentsMargins(4, 0, 4, 0)
                                row_layout.setSpacing(6)

                                label = QLabel("")
                                label.setWordWrap(False)
                                row_layout.addWidget(label, 1)

                                remove_btn = QPushButton("–")
                                remove_btn.setFixedSize(22, 22)

                                def on_remove():
                                    try:
                                        if hasattr(self.debugger, 'watched') and name in self.debugger.watched:  # type: ignore[attr-defined]
                                            self.debugger.watched.remove(name)  # type: ignore[attr-defined]
                                        if name in self._variable_set:
                                            self._variable_set.remove(name)
                                        self.layout.removeWidget(row_widget)
                                        row_widget.deleteLater()
                                        self._rows.pop(name, None)
                                        if not self._rows:
                                            self._show_placeholder()
                                    except Exception:
                                        pass

                                remove_btn.clicked.connect(on_remove)
                                row_layout.addWidget(remove_btn, 0)

                                # Track row
                                self.layout.addWidget(row_widget)
                                self._rows[name] = {
                                    'widget': row_widget,
                                    'label': label,
                                }
                                self._variable_set.add(name)

                                # Initial refresh for the new row
                                try:
                                    self._refresh_one(name, self.debugger.program)
                                except Exception:
                                    pass

                            # ------------------------------------------------------------------
                            def _refresh_one(self, name: str, program):
                                row = self._rows.get(name)
                                if not row:
                                    return
                                try:
                                    # ValueDisplay reduced to textify given symbol name
                                    val_display = ValueDisplay()
                                    val_display.setValue(program, name)
                                    value_text = val_display.text()
                                except Exception as e:
                                    value_text = f"<error: {e}>"
                                row['label'].setText(f"{name} = {value_text}")

                            # ------------------------------------------------------------------
                            def refreshVariables(self, program):
                                if not self._rows:
                                    self._show_placeholder()
                                    return
                                for name in list(self._rows.keys()):
                                    self._refresh_one(name, program)

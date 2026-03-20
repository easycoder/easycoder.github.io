"""ValueDisplay widget for displaying variable values in the EasyCoder debugger"""

from PySide6.QtWidgets import (
    QWidget,
    QFrame,
    QVBoxLayout,
    QLabel,
    QScrollArea,
)
from PySide6.QtCore import Qt


class ValueDisplay(QWidget):
    """Widget to display a variable value with type-appropriate formatting"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        vlayout = QVBoxLayout(self)
        vlayout.setContentsMargins(0, 0, 0, 0)
        vlayout.setSpacing(2)
        
        # Main value label (always visible)
        self.value_label = QLabel()
        self.value_label.setStyleSheet("font-family: mono; padding: 1px 2px;")
        self.value_label.setWordWrap(False)
        vlayout.addWidget(self.value_label)
        
        # Expanded details inside a scroll area (initially hidden)
        self.details_scroll = QScrollArea()
        self.details_scroll.setFrameShape(QFrame.Shape.NoFrame)
        self.details_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.details_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.details_scroll.setWidgetResizable(True)
        self.details_content = QWidget()
        self.details_layout = QVBoxLayout(self.details_content)
        self.details_layout.setContentsMargins(10, 0, 0, 0)
        self.details_layout.setSpacing(1)
        self.details_scroll.setWidget(self.details_content)
        self.details_scroll.hide()
        vlayout.addWidget(self.details_scroll)
        
        self.is_expanded = False
        self.current_value = None
        self.max_detail_rows = 10
    
    def setValue(self, symbol_record, program):
        """Update display with current value from symbol record"""
        if not symbol_record:
            self.value_label.setText("<not found>")
            return
        
        # Check if variable has value capability
        symbol_object = program.getObject(symbol_record)
        if not symbol_object.hasRuntimeValue():
            self.value_label.setText(f"<{symbol_record.get('type', 'no-value')}>")
            return
        
        # Get the value array
        value_array = symbol_object.getValues()
        
        if not value_array or len(value_array) == 0:
            self.value_label.setText("<empty>")
            return
        
        # For arrays, show summary
        if len(value_array) > 1:
            index = symbol_record.get('index', 0)
            self.value_label.setText(f"[{len(value_array)} elements] @{index}")
            
            # If expanded, show individual elements
            if self.is_expanded:
                self._show_array_elements(value_array, index)
            else:
                self._hide_details()
        else:
            # Single value - show it directly
            val = program.textify(symbol_object)
            self._show_single_value(val)
    
    def _show_single_value(self, content):
        """Display a single value element"""
        if content is None or content == {}:
            self.value_label.setText("<none>")
            return
        
        if isinstance(content, bool):
            self.value_label.setText(str(content))
        elif isinstance(content, int):
            self.value_label.setText(str(content))
        elif isinstance(content, str):
            # Check if it's JSON
            if isinstance(content, str) and content.strip().startswith(('{', '[')):
                # Likely JSON - show truncated with expand option
                self._set_elided_text(str(content), multiplier=2.0)
                if self.is_expanded and len(content) > 50:
                    self._show_text_details(content)
            else:
                # Regular string
                text_s = str(content)
                self._set_elided_text(text_s, multiplier=2.0)
                if self.is_expanded:
                    self._show_text_details(text_s)
        else:
            self.value_label.setText(str(content))
    
    def _show_array_elements(self, value_array, current_index):
        """Show expanded array elements"""
        self.details_scroll.show()
        # Clear existing
        while self.details_layout.count():
            item = self.details_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        # Show all elements with internal vertical scrolling capped to N lines
        for i in range(len(value_array)):
            val = value_array[i]
            marker = '→ ' if i == current_index else '  '
            
            if val is None or val == {}:
                text = f"{marker}[{i}]: <none>"
            else:
                val_type = val.get('type', '?')
                content = val.get('content', '')
                if val_type == str:
                    # keep each element concise
                    s = str(content)
                    if len(s) > 120:
                        content = s[:120] + '...'
                text = f'{marker}[{i}]: {content}'
            
            lbl = QLabel(text)
            lbl.setStyleSheet("font-family: mono; font-size: 9pt;")
            self.details_layout.addWidget(lbl)
        # Cap scroll area height to max_detail_rows
        fm = self.fontMetrics()
        max_h = int(self.max_detail_rows * fm.height() * 1.2)
        self.details_scroll.setMaximumHeight(max_h)
    
    def _show_text_details(self, text):
        """Show full text in details area"""
        self.details_scroll.show()
        # Clear existing
        while self.details_layout.count():
            item = self.details_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        
        lbl = QLabel(text)
        lbl.setStyleSheet("font-family: mono; font-size: 9pt;")
        lbl.setWordWrap(True)
        self.details_layout.addWidget(lbl)
        # Cap to max_detail_rows
        fm = self.fontMetrics()
        max_h = int(self.max_detail_rows * fm.height() * 1.2)
        self.details_scroll.setMaximumHeight(max_h)
    
    def _hide_details(self):
        """Hide expanded details"""
        self.details_scroll.hide()
    
    def toggleExpand(self):
        """Toggle between expanded and compact view"""
        self.is_expanded = not self.is_expanded
        # Caller should call setValue again to refresh display

    def _approx_available_width(self) -> int:
        try:
            # Try to find nearest scroll area's viewport width
            w = self
            depth = 0
            while w and depth < 6:
                if isinstance(w, QScrollArea):
                    return max(200, w.viewport().width())
                w = w.parentWidget()
                depth += 1
            # Fallback to our own width or a safe default
            return max(240, self.width())
        except Exception:
            return 320

    def _set_elided_text(self, text: str, multiplier: float = 2.0):
        try:
            fm = self.value_label.fontMetrics()
            avail = int(self._approx_available_width() * multiplier)
            # Apply quotes for display
            quoted = f'"{text}"'
            elided = fm.elidedText(quoted, Qt.TextElideMode.ElideRight, max(80, avail))
            self.value_label.setText(elided)
        except Exception:
            # Fallback simple trim
            s = text
            if len(s) > 160:
                s = s[:160] + '...'
            self.value_label.setText(f'"{s}"')

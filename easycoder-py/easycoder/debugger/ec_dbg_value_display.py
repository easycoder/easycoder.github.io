"""ValueDisplay widget for displaying variable values in the EasyCoder debugger"""

from PySide6.QtWidgets import QLabel


class ValueDisplay(QLabel):
    """Widget to display a variable value with type-appropriate formatting"""
    
    def __init__(self, parent=None):
        super().__init__(parent)

    @staticmethod
    def render_text(program, symbol_name):
        record = program.getVariable(symbol_name)
        value = program.textify(record)
        return None if value is None else str(value)

    def setValue(self, program, symbol_name):
        try:
            rendered = self.render_text(program, symbol_name)
        except Exception as exc:
            rendered = f"<error: {exc}>"
        self.setText(rendered if rendered is not None else "")


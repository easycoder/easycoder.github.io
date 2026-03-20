from .ec_classes import ECValue, ECObject

###############################################################################
# A generic graphic element
class ECGElement(ECObject):
    def __init__(self):
        super().__init__()
    
    # By default, classes that inherit from here do not belong to this package
    def isCoreClass(self):
        return False

###############################################################################
# A generic widget (other packages should inherit from this)
class ECWidget(ECGElement):
    def __init__(self):
        super().__init__()

###############################################################################
# A core widget (only classes in this package should inherit from this)
class ECCoreWidget(ECWidget):
    def __init__(self):
        super().__init__()
    
    # This is a core class
    def isCoreClass(self):
        return True

###############################################################################
# A simple panel widget
class ECPanel(ECCoreWidget):
    def __init__(self):
        super().__init__()
    
    # This type of widget is clearable
    def isClearable(self):
         return True

###############################################################################
# A widget with a text value
class ECTextWidget(ECCoreWidget):
    def __init__(self):
        super().__init__()
    
    # This type of widget has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # Get the text of the widget
    def getText(self):
        return self.getContent() # type: ignore

    # Check if the object is empty
    def isEmpty(self):
        return self.getText() == ""

###############################################################################
# A layout variable
class ECLayout(ECCoreWidget):
    def __init__(self):
        super().__init__()

###############################################################################
# A group variable
class ECGroup(ECCoreWidget):
    def __init__(self):
        super().__init__()

###############################################################################
# A label variable
class ECLabel(ECTextWidget):
    def __init__(self):
        super().__init__()
    
    # This is a core class
    def isCoreClass(self):
        return True
    
    def getContent(self):
        return self.getValue().text() # type: ignore
    
    # Get the text of the widget
    def textify(self):
        return self.getContent()

###############################################################################
# A pushbutton variable
class ECPushButton(ECTextWidget):
    def __init__(self):
        super().__init__()
    
    # This is a core class
    def isCoreClass(self):
        return True
    
    # Get the index for the variable
    def getIndex(self):
        return super().getIndex()

    # Set the text of the widget
    def setText(self, text):
        v = self.getValue()
        if v is None: return
        v.getContent().setText(str(text)) # type: ignore
    
    # Set the icon for the widget
    def setIcon(self, icon):
        v = self.getValue()
        if v is None: return
        v.getContent().setIcon(icon) # type: ignore
    
    # Set the icon size for the widget
    def setIconSize(self, size):
        v = self.getValue()
        if v is None: return
        v.getContent().setIconSize(size) # type: ignore
    
    # Set the stylesheet for the widget
    def setStyleSheet(self, style):
        v = self.getValue()
        if v is None: return
        v.getContent().setStyleSheet(style) # type: ignore
    
    # Set the fixed width for the widget
    def setFixedWidth(self, width):
        v = self.getValue()
        if v is None: return
        v.getContent().setFixedWidth(width) # type: ignore 
    
    # Set the fixed height for the widget
    def setFixedHeight(self, height):
        v = self.getValue()
        if v is None: return
        v.getContent().setFixedHeight(height) # type: ignore

###############################################################################
# A checkbox variable
class ECCheckBox(ECCoreWidget):
    def __init__(self):
        super().__init__()
    
    # This object has a runtime value
    def hasRuntimeValue(self):
        return True

    # Get the content of the value at the current index
    def getContent(self):
        v = self.getValue()
        if v is None: return None
        return v.isChecked() # type: ignore

###############################################################################
# A line input widget
class ECLineInput(ECTextWidget):
    def __init__(self):
        super().__init__()
    
    # This object has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # Set the text of the widget
    def setText(self, text):
        v = self.getValue()
        if v is None: return
        v.getContent().setText(str(text)) # type: ignore

    # Get the content of the value at the current index
    def getContent(self):
        value = self.getValue()
        if value is None: return None
        return value.text()
    
    # Get the text of the widget
    def textify(self):
        return self.getContent()
    
###############################################################################
# A multiline widget
class ECMultiline(ECTextWidget):
    def __init__(self):
        super().__init__()
    
    # This object has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # Set the text of the widget
    def setText(self, text):
        v = self.getValue()
        if v is None: return
        v.getContent().setText(str(text)) # type: ignore
    
    # Get the text of the widget
    def getText(self):
        return self.getValue().getContent().toPlainText() # type: ignore

    # Get the content of the value at the current index
    def getContent(self):
        value = self.getValue()
        if value is None: return None
        return value.toPlainText()
    
    # Get the text of the widget
    def textify(self):
        return self.getContent()

###############################################################################
# A markdown preview widget
class ECMDPanel(ECTextWidget):
    def __init__(self):
        super().__init__()
    
    # This object has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # Set the markdown text of the widget
    def setText(self, text):
        v = self.getValue()
        if v is None: return
        v.getContent().setMarkdown(str(text)) # type: ignore
    
    # Get the markdown text of the widget
    def getText(self):
        return self.getValue().getContent().toMarkdown() # type: ignore

    # Get the content of the widget
    def getContent(self):
        value = self.getValue()
        if value is None: return None
        return value.toMarkdown()
    
    # Get the text of the widget
    def textify(self):
        return self.getContent()

###############################################################################
# A listbox variable
class ECListBox(ECCoreWidget):
    def __init__(self):
        super().__init__()
    
    # This type of widget has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # This type of widget is mutable.
    def isMutable(self):
        return True
    
    # This type of widget is clearable
    def isClearable(self):
         return True
    
    # Get the selected item in the list box
    def getContent(self):
        widget = self.getValue() # type: ignore
        content = widget.selectedItems()[0].text() if widget.selectedItems() else None # type: ignore
        return content
    
    # Get the text of the widget
    def getText(self):
        return self.getContent() # type: ignore
    
    # Get the count of items in the list box
    def getCount(self):
        v = self.getContent().count() # type: ignore
        return v
    
    # Get the index of the selected item
    def getIndex(self):
        widget = self.getValue() # type: ignore
        index = widget.currentRow() # type: ignore
        return index

###############################################################################
# A combo box variable
class ECComboBox(ECCoreWidget):
    def __init__(self):
        super().__init__()
    
    # This type of widget has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # This type of widget is mutable.
    def isMutable(self):
        return True
    
    # This type of widget is clearable
    def isClearable(self):
         return True
    
    # Get the count of items in the combo box
    def getCount(self):
        v = self.getContent().count() # type: ignore
        return v
    
    # Get the text of the widget
    def getText(self):
        return self.getValue().getContent().text() # type: ignore


###############################################################################
# A window variable
class ECWindow(ECGElement):
    def __init__(self):
        super().__init__()
    
    # This is a core class
    def isCoreClass(self):
        return True

###############################################################################
# A dialog variable
class ECDialog(ECGElement):
    def __init__(self):
        super().__init__()
    
    # This is a core class
    def isCoreClass(self):
        return True
    
    # This type of widget has a runtime value
    def hasRuntimeValue(self):
        return True

    def getReturnValue(self):
        dialog = self.getValue().getContent() # type: ignore
        return dialog.result

###############################################################################
# A message box variable
class ECMessageBox(ECGElement):
    def __init__(self):
        super().__init__()

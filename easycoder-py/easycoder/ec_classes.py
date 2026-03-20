import sys, paramiko, json
from typing import Optional, Any, Union

###############################################################################
# Type normalization: support both Python types and string type names
def normalize_type(t: Union[type, str, None]) -> Optional[str]:
	"""Convert a type to its string representation. Supports both Python types and string names."""
	if t is None:
		return None
	if isinstance(t, str):
		return t
	# Map Python types to string names
	type_map = {
		str: 'str',
		int: 'int',
		float: 'float',
		bool: 'bool',
		dict: 'dict',
		list: 'list',
		object: 'object',
	}
	return type_map.get(t, str(t) if t else None)

def types_equal(t1: Union[type, str, None], t2: Union[type, str, None]) -> bool:
	"""Compare two types, normalizing both to strings first."""
	return normalize_type(t1) == normalize_type(t2)

def type_in(t: Union[type, str, None], types: tuple) -> bool:
	"""Check if a type is in a tuple of types, normalizing both."""
	normalized = normalize_type(t)
	for typ in types:
		if normalize_type(typ) == normalized:
			return True
	return False

class FatalError(BaseException):
	def __init__(self, compiler, message):
		compiler.showWarnings()
		lino = compiler.tokens[compiler.index].lino
		script = compiler.script.lines[lino].strip()
		print(f'Compile error in {compiler.program.name} at line {lino + 1} ({script}):\n-> {message}')
		sys.exit()

class NoValueError(FatalError):
	def __init__(self, compiler, record):
		super().__init__(compiler, f'Variable {record["name"]} does not hold a value')

class RuntimeAssertionError:
	def __init__(self, program, msg=None):
		code = program.code[program.pc]
		lino = code['lino']
		message = f'Assertion Error in {program.name} at line {lino + 1}'
		if msg != None:
			message += f': {msg}'
		print(message)
		sys.exit()

class RuntimeError(BaseException):
	def __init__(self, program, message):
		if program == None:
			sys.exit(f'Runtime Error: {message}')
		else:
			code = program.code[program.pc]
			lino = code['lino']
			script = program.script.lines[lino].strip()
			print(f'Runtime Error in {program.name} at line {lino + 1} ({script}):\n-> {message}')
			sys.exit()

class NoValueRuntimeError(RuntimeError):
	def __init__(self, program, record):
		super().__init__(program, 'Variable {record["name"]} does not hold a value')

class RuntimeWarning:
	def __init__(self, program, message):
		if program == None:
			print(f'Runtime Warning: {message}')
		else:
			code = program.code[program.pc]
			lino = code['lino']
			script = program.script.lines[lino].strip()
			print(f'Runtime Warning in {program.name} at line {lino + 1} ({script}): {message}')

class Script:
	def __init__(self, source):
		self.lines = source.splitlines()
		self.tokens = []

class Token:
	def __init__(self, lino, token):
		self.lino = lino
		self.token = token

###############################################################################
# This is the set of generic EasyCoder objects (values and variables)

###############################################################################
# A multipurpose value object. Holds a single value, with domain and type information
class ECValue():
    def __init__(self, domain = 'core', type = None, content: Any = None, name = None):
        if type == None: type = str
        object.__setattr__(self, 'domain', domain)
        object.__setattr__(self, 'type', type)
        object.__setattr__(self, 'content', content)
        object.__setattr__(self, 'name', name)
        object.__setattr__(self, 'properties', {})
        object.__setattr__(self, 'locked', False)
        object.__setattr__(self, '_attrs', {})  # Store dynamic attributes
    
    def __setattr__(self, name: str, value: Any) -> None:
        """Allow setting any attribute dynamically."""
        if name in ('domain', 'type', 'content', 'name', 'properties', 'locked', '_attrs'):
            object.__setattr__(self, name, value)
        else:
            # Store dynamic attributes in _attrs dict
            self._attrs[name] = value
    
    def __getattr__(self, name: str) -> Any:
        """Retrieve dynamic attributes or return None if not found."""
        if name == '_attrs':
            return object.__getattribute__(self, '_attrs')
        return self._attrs.get(name)
    
    def setDomain(self, domain):
        self.domain = domain
    
    def getDomain(self):
        return self.domain
    
    def setType(self, type):
        self.type = normalize_type(type)
    
    def getType(self):
        return normalize_type(self.type)
    
    def setContent(self, content):
        self.content = content
    
    def getContent(self):
        return self.content 
    
    def setValue(self, type=None, content=None):
        self.type = type
        self.content = content

    def setProperty(self, key, value):
        self.properties[key] = value

    def getProperty(self, key):
        return self.properties.get(key, None)
    
    def setName(self, name):
        self.name = name
    
    def getName(self):
        return self.name
    
    def lock(self):
        self.locked = True
    
    def isLocked(self):
        return self.locked

###############################################################################
# The base class for all EasyCoder variable types
class ECObject():
    def __init__(self):
        self.locked: bool = False
        self.elements: int = 0
        self.index: Optional[int] = None
        self.values: Optional[list] = None
        self.name: Optional[str] = None
        self.properties = {}

    # Set the index for the variable
    def setIndex(self, index: int) -> None:
        self.index = index
    
    # Get the index for the variable
    def getIndex(self):
        return self.index
    
    # Lock the variable
    def setLocked(self):
        self.locked = True
    
    # Check if the variable is locked
    def isLocked(self):
        return self.locked

    # Set the value at the current index
    def setValue(self, value):
        if self.values is None:
            self.index = 0
            self.elements = 1
            self.values = [None]
        if isinstance(value, ECValue): value.setName(self.name)
        self.values[self.index] = value # type: ignore

    # Get the value at the current index
    def getValue(self):
        if self.values is None: return None
        return self.values[self.index] # type: ignore
    
    # Get all the values
    def getValues(self):
        return self.values

    # Set the number of elements in the variable
    def setElements(self, elements):
        if self.elements == 0:
            self.values = [None] * elements
            self.elements = elements
            self.index = 0
        if elements == self.elements:
            pass
        elif elements > self.elements:
            self.values.extend([None] * (elements - self.elements)) # pyright: ignore[reportOptionalMemberAccess]
        else:
            del self.values[elements:] # pyright: ignore[reportOptionalSubscript]
            self.index = 0
        self.elements = elements
    
    # Get the number of elements in the variable
    def getElements(self):
        return self.elements
    
    # Check if the object has a runtime value. Default is False
    def hasRuntimeValue(self):
        return False
    
    # Check if the object is mutable. Default is False
    def isMutable(self):
        return False
    
    # Check if the object is clearable
    def isClearable(self):
         return False

    # Get the content of the value at the current index
    def getContent(self):
        if not self.hasRuntimeValue(): return None
        v = self.getValue()
        if v is None: return None
        return v
    
    # Get the type of the value at the current index
    def getType(self):
        if not self.hasRuntimeValue(): return None
        v = self.getValue()
        if v is None: return None
        return v.getType()

    # Check if the object is empty. Default is True
    def isEmpty(self):
        return True
    
    # Set the name of the object
    def setName(self, name):
        self.name = name
    
    # Get the name of the object
    def getName(self):
        return self.name
    
    # Set a specific property on the object
    def setProperty(self, name, value):
        self.properties[name] = value
    
    # Check if the object has a specific property
    def hasProperty(self, name):
        return name in self.properties
    
    # Get a specific property
    def getProperty(self, name):
        return self.properties[name]

###############################################################################
# A generic variable object that can hold a mutable value
class ECValueHolder(ECObject):
    def __init__(self):
        super().__init__()

    # Set the content of the value at the current index
    def setContent(self, content):
        if self.values is None:
            self.index = 0
            self.elements = 1
            self.values = [None]
        self.values[self.index] = content # type: ignore

    # Set the value to a given ECValue
    def setValue(self, value):
        if self.values is None:
            self.index = 0
            self.elements = 1
            self.values = [None]
        if self.index >= self.elements: raise RuntimeError(None, 'Index out of range') # type: ignore
        self.values[self.index] = value # type: ignore
    
    # Report if the object is clearable
    def isClearable(self):
         return True
    
    # This object has a runtime value
    def hasRuntimeValue(self):
        return True
    
    # This object is mutable.
    def isMutable(self):
        return True

    # Reset the object to empty state
    def reset(self):
        self.setValue(ECValue(content=None))
    
    def textify(self):
        v = self.getValue()
        if v is None:
            return ""
        elif isinstance(v, str):
            return json.dumps(v)
        elif isinstance(v, ECValue):
            return v.getContent()
        return v

###############################################################################
# A string, int or boolean variable
class ECVariable(ECValueHolder):
    def __init__(self):
        super().__init__()

    # Reset the object to an empty string
    def reset(self):
        self.setValue(ECValue(type=str, content=''))

    # Set the value to a given ECValue
    def setValue(self, value):
        val_type = value.getType()
        if type_in(val_type, ('dict', 'list')):
             value.setContent(json.dumps(value.getContent()))
        elif not type_in(val_type, (str, int, float, bool, None)):
            raise RuntimeError(None, 'ECVariable can only hold str, int, float, or bool values') # type: ignore
        super().setValue(value)
    
    # Check if the variable is empty
    def isEmpty(self):
        content = self.getContent()
        if content is None:
            return True
        return content.getContent() in ('', None)   

###############################################################################
# A dictionary variable
class ECDictionary(ECValueHolder):
    def __init__(self):
        super().__init__()
        self.reset()

    # Reset the object to empty state
    def reset(self):
        self.setValue(ECValue(content={}))

    # Set the value to an ECValue
    def setValue(self, value):
        varType = value.getType()
        if type_in(varType, (str, 'dict')):
            content = value.getContent()
            if types_equal(varType, str):
                try:
                    if content in ('', {}, None): content = {}
                    elif content[0] in ('{', '['): content = json.loads(content) # type: ignore
                except:
                    return f'Invalid JSON for {self.name}: {content[:40]}' # type: ignore
        elif varType == None:
             content = {}
        else:
            return f'{self.name} can only hold dict values or None'
        super().setValue(content)
        return None
    
    def getValue(self):
        return super().getValue()
    
    # Set an entry in the dictionary
    def setEntry(self, key, value):
        content = self.getValue()
        if content is None:
            return
        if isinstance(value, str):
             try:
                 value = json.loads(value)
             except Exception:
                 pass
        content[key] = value # type: ignore
    
    # Test if an entry exists in the dictionary
    def hasEntry(self, key):
        content = self.getValue()
        if content is None:
            return False
        return key in content
    
    # Get an entry from the dictionary
    def getEntry(self, key):
        content = self.getValue()
        if content is None:
            return None
        if key in content:
             return content[key]
        else:
             raise RuntimeError(None, f"Key '{key}' not found in {self.name}") # type: ignore

    # Delete an entry from the dictionary
    def deleteEntry(self, key):
        content = self.getValue()
        if content is None:
            return
        if key in content:
            del content[key]
    
    # Get the keys of the dictionary
    def keys(self):
        content = self.getValue()
        if content is None:
            return []
        return list(content.keys()) 
    
    # Check if the dictionary is empty
    def isEmpty(self):
        return len(self.keys()) == 0

###############################################################################
# A list variable
class ECList(ECValueHolder):
    def __init__(self):
        super().__init__()
        self.reset()

    # Reset the object to empty state
    def reset(self):
        self.setValue(ECValue(content=[]))

    # Set the value to an ECValue
    def setValue(self, value):
        content = value.getContent()
        if content in ('', None): content = []
        else:
            try:
                content = json.loads(content) # type: ignore
            except:
                pass
        super().setValue(content)
    
    def getValue(self):
        return super().getValue()
    
    # Append an item to the list
    def append(self, item):
        content = self.getContent()
        if content is None:
            return
        if isinstance(item, str):
             try:
                 item = json.loads(item)
             except Exception:
                  pass
        content.append(item) # type: ignore
        self.setContent(content)
    
    # Set an item in the list
    def setItem(self, index, value):
        content = self.getValue()
        if content is None:
            return
        if isinstance(value, str):
             try:
                 value = json.loads(value)
             except Exception:
                 pass
        content[index] = value # type: ignore
    
    # Return the number of items in the list
    def getItemCount(self):
        content = self.getContent()
        if content is None:
            return 0
        return len(content)
    
    # Get an item from the list
    def getItem(self, index):
        content = self.getContent()
        if content is None:
            return None
        return content[index]
    
    # Check if the list is empty
    def isEmpty(self):
        return self.getItemCount() == 0
    
    # Delete an item from the list
    def deleteItem(self, index):
        content = self.getValue()
        if content is None:
            return
        if index < 0 or index >= len(content):
            return
        del content[index]
        self.setContent(content)

###############################################################################
# A queue variable
class ECQueue(ECList):
    def __init__(self):
        super().__init__()

    # push an ECValue onto the stack
    def push(self, value: Any) -> None:
        self.append(value)
    
    # Pop the first ECValue from the queue
    def pop(self):
        content = self.getContent()
        return content.pop(0) # type: ignore

###############################################################################
# A stack variable
class ECStack(ECList):
    def __init__(self):
        super().__init__()

    # push an ECValue onto the stack
    def push(self, value: Any) -> None:
        self.append(value)
    
    # Pop the most recent ECValue from the stack
    def pop(self):
        content = self.getContent()
        return content.pop() # type: ignore

###############################################################################
# A file variable
class ECFile(ECObject):
    def __init__(self):
        super().__init__()

###############################################################################
# A module variable
class ECModule(ECObject):
    def __init__(self):
        super().__init__()
    
    # Set the value of the module variable to its program
    def setValue(self, program):
        super().setValue(program) # type: ignore

###############################################################################
# An SSH variable
class ECSSH(ECObject):
    def __init__(self):
        super().__init__()

    # Set up the SSH connection
    def setup(self, host=None, user=None, password=None):
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            ssh.connect(host, username=user, password=password, timeout=10) # type: ignore
            self.setValue(ssh)
            self.sftp = ssh.open_sftp()
            return True
        except:
            return False
    
    # Get the SFTP client
    def getSFTP(self):
        return self.sftp

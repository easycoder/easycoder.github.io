'''EasyCoder for Python'''

import importlib
import math

__version__ = "260403.1"

from .ec_classes import *
from .ec_compiler import *
from .ec_condition import *
from .ec_core import *
from .ec_email import *
from .ec_handler import *
from .ec_mqtt import *
from .ec_program import *
from .ec_server import *
from .ec_psutil import *
from .ec_timestamp import *
from .ec_value import *

_LAZY_MODULES = (
	'ec_border',
	'ec_gclasses',
	'ec_graphics',
	'ec_keyboard',
)


def __getattr__(name):
	if name in _LAZY_MODULES:
		module = importlib.import_module(f'.{name}', __name__)
		globals()[name] = module
		return module

	for module_name in _LAZY_MODULES:
		module = importlib.import_module(f'.{module_name}', __name__)
		if hasattr(module, name):
			value = getattr(module, name)
			globals()[name] = value
			return value

	raise AttributeError(f'module {__name__!r} has no attribute {name!r}')

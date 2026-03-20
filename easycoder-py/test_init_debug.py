#!/usr/bin/env python3
from easycoder import Program

script = """script Test
use graphics
init graphics
exit
"""

import tempfile
with tempfile.NamedTemporaryFile(mode='w', suffix='.ecs', delete=False) as f:
    f.write(script)
    fname = f.name

try:
    p = Program(fname)
    print("Domains after loading:", [d.getName() for d in p.domains])
    p.start()
except Exception as e:
    print(f"Error: {e}")
finally:
    import os
    os.unlink(fname)

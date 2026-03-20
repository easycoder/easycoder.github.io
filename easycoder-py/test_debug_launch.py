#!/usr/bin/env python3

import os
import sys
from easycoder import Program

# Test with a simple script
test_script = """
script TestDebug
    print `Debug launch test`
    exit
"""

# Create temporary test script
test_file = '/tmp/test_debug.ecs'
with open(test_file, 'w') as f:
    f.write(test_script)

print("Testing debug mode launch...")
try:
    program = Program(f'debug {test_file}')
    print(f"Debugging enabled: {program.debugging}")
    print(f"Script: {program.scriptName}")
    
    # Check that debugger is created
    program.start()
    
    if program.debugger:
        print("SUCCESS: Debugger was created!")
    else:
        print("FAILED: Debugger was not created")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

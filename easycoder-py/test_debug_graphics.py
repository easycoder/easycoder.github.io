#!/usr/bin/env python3

import os
import sys
from easycoder import Program

# Test with a graphics script
test_script = """
script TestDebugGraphics
    use graphics
    
    window MainWindow
    create MainWindow title `Debug Graphics Test` size 400 300
    
    show MainWindow
    exit
"""

# Create temporary test script
test_file = '/tmp/test_debug_graphics.ecs'
with open(test_file, 'w') as f:
    f.write(test_script)

print("Testing debug mode with graphics...")
try:
    program = Program(f'debug {test_file}')
    print(f"Debugging enabled: {program.debugging}")
    print(f"Script: {program.scriptName}")
    
    # Note: This will hang waiting for user interaction with the GUI
    # In a real test, we'd close the windows automatically
    program.start()
    
    if program.debugger:
        print("SUCCESS: Debugger was created for graphics!")
    else:
        print("FAILED: Debugger was not created for graphics")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

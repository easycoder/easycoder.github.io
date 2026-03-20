#!/bin/python3

import os
from easycoder import Program

os.chdir('/home/graham/temp/Flash')
Program('flash-device.ecs').start()

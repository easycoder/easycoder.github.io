#!/bin/python3

import os
from easycoder import Program

os.chdir('/home/graham/dev/doclets')
Program('docletServer.ecs').start()

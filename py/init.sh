#!/bin/sh

cd /home/pi
rm -f map log.txt
python3 rbr.py >> log.txt 2>&1 &

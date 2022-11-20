#!/bin/sh

# This script runs every minute as a cron task
cd /home/pi
# Make sure we have the MAC address
if ! [ -s mac ]
then
   cat "/sys/class/net/$(cat network)/address" >mac
fi
# Look for a running instance of rbr.ecs
p=$(ps -eaf | grep "[r]br.ecs")
# Get the second item; the process number
n=$(echo $p | awk '{print $2}')
# If it's not empty, kill the process
if [ "$n" ]
then
   kill $n
fi
# Start a new instance
python3 ec.py rbr.ecs

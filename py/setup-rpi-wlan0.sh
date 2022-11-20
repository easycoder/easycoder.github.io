#!/bin/sh

crontab crondata.txt

runuser -l pi -c "echo $password >mypass"
runuser -l pi -c "echo wlan0 >network"
runuser -l pi -c "echo $ipaddr >ip"

#echo $(cat mypass) | sudo reboot


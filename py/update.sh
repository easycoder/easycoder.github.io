#!/bin/sh

crontab crondata-empty.txt
rm *.*
wget https://rbrheating.com/resources/rbr.tgz
tar zxf rbr.tgz
rm -f rbr.tgz
echo $(cat mypass) | sudo -S apt update
echo $(cat mypass) | sudo apt -y full-upgrade
crontab crondata.txt
echo $(cat mypass) | sudo reboot

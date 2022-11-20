import time
from PyP100 import PyP100

p100 = PyP100.P100("192.168.0.227", "tapo@rbrheating.com", "rbr-heat1ng") #Creates a P100 plug object

p100.handshake() #Creates the cookies required for further methods
p100.login() #Sends credentials to the plug and creates AES Key and IV for further methods

p100.turnOn() #Turns the connected plug on
time.sleep(5)
p100.turnOff() #Turns the connected plug off
#p100.toggleState() #Toggles the state of the connected plug

#p100.turnOnWithDelay(10) #Turns the connected plug on after 10 seconds
#p100.turnOffWithDelay(10) #Turns the connected plug off after 10 seconds

print(p100.getDeviceName()) #Returns the name of the connected plug set in the app
print(p100.getDeviceInfo()) #Returns dict with all the device info of the connected plug

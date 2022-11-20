#!/usr/bin/env python3

import bottle, time, os
from bottle import Bottle, run, request

app = Bottle()

###############################################################################
# This is the RBR controller

# Endpoint: Get <server-ip>/reset
# Called to reset the log file
@app.get('/reset')
def reset():
    os.system('rm log.txt')
    return

# Endpoint: Get <server-ip>/?hum=hhh&temp=ttt&id=id
# Called when temperature changes
@app.get('/')
def index():
    try:
        source = request.get("REMOTE_ADDR")
        hum = request.query.hum
        temp = request.query.temp
        if hum and temp:
            ts = round(time.time())
            temp = round(float(temp), 1)
#            print(f'hum={hum}, temp={temp}, source={source}, ts={ts}')
            dir = f'/home/pi/sensors'
            if not os.path.exists(f'{dir}'):
                os.makedirs(f'{dir}')
            file = open(f'{dir}/{source}.txt', 'w')
            message = '{"temperature": "' + str(temp) + '", "timestamp": "' + str(ts) + '"}'
            file.write(message)
            file.close()
#            print(f'Written {message} to {source}.txt')
        return
    except:
        print('Error')
        return

# Initialization

if __name__ == '__main__':
    file = open('/home/pi/ip', 'r')
    ip = file.read().strip()
    file.close()
    if ip != '':
        print(f'rbr.py: IP address = {ip}')
        app.run(host=f'{ip}', port=5555, debug=False)
    else:
        print('rbr.py: No IP address found')


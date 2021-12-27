
#!/usr/bin/env python3

import bottle, subprocess, os, json, requests, time
from bottle import Bottle, run, get, post, request, response, static_file
from requests import post
from time import time

app = Bottle()

###############################################################################
# This is the RBR controller

# Endpoint: GET <server-ip>/relay?address=<address>&state=<state>
# Turn a relay on or off
@app.get('/relay')
def relay():
    address = request.query.address
    state = request.query.state
    global root
    requests.post(f'http://{root}.{address}/relay/0?turn={state}')
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
            print(f'hum={hum}, temp={temp}, source={source}')
            dir = f'/home/pi/sensors/{source}'
            if not os.path.exists(f'{dir}'):
                os.makedirs(f'{dir}')
            file = open(f'{dir}/value.txt', 'w')
            file.write(f'{time()} {temp}\n')
            file.close()
        return
    except:
        return

# Initialization

root = '0.0.0'

if __name__ == '__main__':
    file = open('/home/pi/ip', 'r')
    ip = file.read()
    file.close()
    p = ip.rfind('.')
    root = ip[0: p]

    app.run(host=f'{ip}', port=5555, debug=True)

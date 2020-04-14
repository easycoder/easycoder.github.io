import bottle
import subprocess
import os
from bottle import Bottle, run, get, post, request, response, static_file

def HOST():
    return 'http://localhost:8080'

# start up the browser (version for Linux/Chromium)
cmd = f'chromium-browser {HOST()}/flist/Codex'
#subprocess.call(cmd, shell=True)

app = Bottle()

# Endpoint: GET localhost:8080/_list
# Lists all files in the server root directory
@app.get('/_list')
def listRoot():
	return listFiles('')

# Endpoint: GET localhost:8080/_list/name
# Lists all files in a specified directory
@app.get('/_list/<name:path>')
def listFiles(name):
	ff = ''
	for file in os.listdir(f'resources{"/" if name else ""}{name}'):
		path = os.path.join(f'{name if name else ""}', file)
		if os.path.isdir(f'resources/{path}'):
			type = 'dir'
		else:
			extension = os.path.splitext(file)[1]
			if extension == '.jpg' or extension == '.png' or extension == '.gif':
				type = 'img'
			else:
				type = 'file'
		ff += f'{"," if ff else ""}{{"name":"{file}","type":"{type}"}}'
	print(ff)
	return f'[{ff}]'

# Endpoint: GET localhost:8080/_load/name
# Load a file
@app.get('/_load/<name:path>')
def loadFile(name):
	f = open(f'resources/{name.replace(chr(0x7e), "/")}', 'r')
	response = f.read()
	f.close()
	return response

# Endpoint: POST localhost:8080/_save/name
# Save a file
@app.post('/_save/<name:path>')
def saveFile(name):
	f = open(f'resources/{name.replace(chr(0x7e), "/")}', 'w+')
	content = request.body.read().decode("utf-8")
	f.write(content)
	f.close()
	return response

# Endpoint: POST localhost:8080/_delete/connametent
# Delete a file
@app.post('/_delete/<name:path>')
def deleteFile(name):
	os.remove(f'resources/{name.replace(chr(0x7e), "/")}')
	return ''

###############################################################################
# Generic endpoints

# Endpoint: GET localhost:8080/<path>
# Gets a file
@app.get('/<filename:path>')
def getFile(filename):
	print(f'Get (generic) {filename}')
	response = bottle.static_file(filename, root='.')
	response.set_header("Cache-Control", "public, max-age=0")
	return response

# Endpoint: GET localhost:8080>
# Gets the default home page
@app.get('/')
def index():
  return getFile('index.html')

if __name__ == '__main__':
  app.run()

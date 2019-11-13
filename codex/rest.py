import bottle
import subprocess
import os
import json
from bottle import Bottle, run, get, post, request, response, static_file


def HOST():
    return 'http://localhost:8080'


# start up the browser (version for Linux/Chromium)
cmd = f'chromium-browser {HOST()}/flist/File%20Manager'
#subprocess.call(cmd, shell=True)

app = Bottle()

# Endpoint: GET localhost:8080/listfiles
# Lists all files in the server root directory
@app.get('/listfiles')
def listRoot():
	return listFiles('.')

# Endpoint: GET localhost:8080/listfiles/name
# Lists all files in a specified directory
@app.get('/listfiles/<name:path>')
def listFiles(name):
	print(f'List files in {name}')
	dd = []
	ff = []
	for file in os.listdir(f'/{name}'):
			path = os.path.join(f'/{name if name else ""}', file)
			if os.path.isdir(path):
					#print(f'{path}: dir')
					dd.append(file)
			else:
					#print(f'{path}: file')
					ff.append(file)
	dd.sort()
	ff.sort()
	d = json.dumps(dd)
	f = json.dumps(ff)
	return '{"dirs":' + d + ',"files":' + f + '}'

# Endpoint: GET localhost:8080/readfile/content
# Read a file
@app.get('/readfile/<name:path>')
def readFile(name):
	f = open(f'/{name}', 'r')
	file = f.read().replace('\t', '%09').replace('\n', '%0a')
	f.close()
	return file

###############################################################################
# Generic endpoints

# Endpoint: GET localhost:8080/<path>
# Gets a file
@app.get('/<filename:path>')
def getFile(filename):
	print(f'Get {filename}')
	response = bottle.static_file(filename, root='.')
	response.set_header("Cache-Control", "public, max-age=0")
	return response

# Endpoint: GET localhost:8080>
# Gets the default home page
@app.get('/')
def index():
  return 'Hello'`
#  return getFile('index.html')

if __name__ == '__main__':
  app.run()

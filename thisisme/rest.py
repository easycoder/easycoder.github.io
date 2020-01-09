import bottle, subprocess, os, json
from bottle import Bottle, run, get, post, request, response, static_file

app = Bottle()

###############################################################################
# Endpoints for EasyCoder script editing

# Endpoint: GET localhost:17000/list
# Lists all files in the given directory
@app.get('/list/<path:path>')
def listScripts(path):
    print(f'List files in {path}')
    dd = []
    ff = []
    for file in os.listdir(path):
        if os.path.isdir(os.path.join(path, file)):
            dd.append(file)
        else:
            ff.append(file)
    d = json.dumps(dd)
    f = json.dumps(ff)
    return '{"dirs":' + d + ',"files":' + f + '}'

# Endpoint: GET localhost:17000/get/<path>
# Gets a named script from the given directory
@app.get('/get/<path:path>')
def getScript(path):
    print(f'Get {path}')
    response = bottle.static_file(path, root='.')
    if response.status[0:3] == 200:
        response.set_header("Cache-Control", "public, max-age=0")
        return response
    else:
        return response.status[4:]

# Endpoint: POST localhost:17000/saveScript/<path>
# Writes the POST body to a named file in the given directory
@app.post('/save/<path:path>')
def saveScript(path):
    print(f'Save {path}')
    f = open(path, 'w+')
    f.write(request.body.read().decode('utf-8'))
    f.close()
    return

# Endpoint: POST localhost:17000/delete/<path>
# Deletes a named script in the given directory
@app.post('/delete/<path:path>')
def deleteScript(path):
    print(f'Delete {path}')
    os.remove(path)
    return

###############################################################################
# Generic endpoints

# Endpoint: GET localhost:17000/<path>
# Gets a file
@app.get('/<path:path>')
def getFile(path):
    print(f'Get {path}')
    response = bottle.static_file(path, root='.')
    if response.status[0:3] in ['200', '304']:
        response.set_header("Cache-Control", "public, max-age=0")
    return response

# Endpoint: GET localhost:17000
# Gets the default home page
@app.get('/')
def index():
    return getFile('index.html')

if __name__ == '__main__':
    app.run(host='localhost', port=17000, debug=True)

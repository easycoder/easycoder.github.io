import bottle, subprocess, os, json
from bottle import Bottle, run, get, post, request, response, static_file

app = Bottle()

###############################################################################
# Endpoints for EasyCoder script editing

# Endpoint: GET localhost:<port>/list
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
    dd.sort()
    ff.sort()
    d = json.dumps(dd)
    f = json.dumps(ff)
    return '{"dirs":' + d + ',"files":' + f + '}'

# Endpoint: POST localhost:<port>/saveScript/<path>
# Writes the POST body to a named file in the given directory
@app.post('/save/<path:path>')
def saveScript(path):
    print(f'Save {path}')
    f = open(path, 'w+')
    f.write(request.body.read().decode('utf-8'))
    f.close()
    return

# Endpoint: POST localhost:<port>/makedirs/<path>
# Creates (nested) directories in the given directory
@app.post('/makedirs/<path:path>')
def makedirs(path):
    try:
        os.makedirs(path, 0o777, True)
    except Exception as err:
        print(err)
    return

# Endpoint: POST localhost:<port>/delete/<path>
# Deletes a named script in the given directory
@app.post('/delete/<path:path>')
def deleteScript(path):
    print(f'Delete {path}')
    os.remove(path)
    return

###############################################################################
# Generic endpoints

# Endpoint: GET localhost:<port>/<path>
# Gets a file
@app.get('/<path:path>')
def getFile(path):
    print(f'getFile {path}')
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
    app.run(host='localhost', port=17001, debug=True)

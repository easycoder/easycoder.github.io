from bottle import Bottle, request as bottle_request, response as bottle_response, run, static_file
import threading
from easycoder import Handler, ECObject, ECValue, RuntimeError

###############################################################################
# An HTTP server object
class ECServer(ECObject):
    def __init__(self):
        super().__init__()
        self.app = None
        self.port = None
        self.program = None
        self.onRequestPC = None
        self.current_request = None
        self.response_event = threading.Event()
        self.response_value = None
        self.response_status = 200
        self.response_content_type = None

    def setup(self, program, port):
        self.program = program
        self.port = port
        self.app = Bottle()

        # Serve binary files (images, fonts, etc.) directly via Bottle
        import os
        binary_exts = ('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf')

        @self.app.route('/', method=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
        @self.app.route('/<path:path>', method=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
        def handle(path=''):
            # print(f'Request: {bottle_request.method} /{path}')
            if bottle_request.method == 'GET' and any(path.lower().endswith(ext) for ext in binary_exts):
                print(f'Static file request: {path} from {os.getcwd()}')
                return static_file(path, root=os.getcwd())
            # Handle CORS preflight
            if bottle_request.method == 'OPTIONS':
                bottle_response.headers['Access-Control-Allow-Origin'] = '*'
                bottle_response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                bottle_response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
                return ''

            self.current_request = {
                'method': bottle_request.method,
                'path': '/' + path,
                'body': (bottle_request.body.seek(0) or bottle_request.body.read()).decode('utf-8'),
                'query': dict(bottle_request.query),
            }
            self.response_event.clear()
            self.response_value = None
            self.response_status = 200
            self.response_content_type = None

            if self.onRequestPC is not None:
                self.program.queueIntent(self.onRequestPC)
            else:
                bottle_response.status = 503
                return 'Server handler not ready'

            # Block until EasyCoder replies
            timed_out = not self.response_event.wait(timeout=30)
            if timed_out:
                bottle_response.status = 504
                return 'EasyCoder handler timed out'

            bottle_response.headers['Access-Control-Allow-Origin'] = '*'
            bottle_response.status = self.response_status
            if self.response_content_type:
                bottle_response.content_type = self.response_content_type
            return self.response_value or ''

        t = threading.Thread(
            target=run,
            kwargs={'app': self.app, 'host': '0.0.0.0', 'port': self.port, 'quiet': True},
            daemon=True,
        )
        t.start()
        print(f'Server started on port {self.port}')

    def getMethod(self):
        return self.current_request['method'] if self.current_request else ''

    def getPath(self):
        return self.current_request['path'] if self.current_request else ''

    def getBody(self):
        return self.current_request['body'] if self.current_request else ''

    def setResponse(self, value, status=200, content_type=None):
        self.response_value = value
        self.response_status = status
        self.response_content_type = content_type
        self.response_event.set()

###############################################################################
###############################################################################
# The server compiler and runtime handlers
class Server(Handler):

    def getName(self):
        return 'server'

    #############################################################################
    # Keyword handlers

    # server MyServer — declare a server variable
    def k_server(self, command):
        self.compiler.addValueType()
        return self.compileVariable(command, 'ECServer')

    def r_server(self, command):
        return self.nextPC()

    # start MyServer on port 12345
    def k_start(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECServer)
            command['server'] = record['name']
            self.skip('on')
            self.skip('port')
            command['port'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_start(self, command):
        record = self.getVariable(command['server'])
        server = self.getObject(record)
        port = int(self.textify(command['port']))
        server.setup(self.program, port)
        return self.nextPC()

    # on MyServer request begin...end
    def k_on(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECServer) and self.peek() == 'request':
                self.nextToken()  # advance to 'request'
                self.nextToken()  # advance past 'request' to handler body
                command['server'] = record['name']
                command['goto'] = 0
                self.add(command)
                # gotoPC to skip over the handler body
                cmd = {}
                cmd['domain'] = 'core'
                cmd['lino'] = command['lino']
                cmd['keyword'] = 'gotoPC'
                cmd['goto'] = 0
                cmd['debug'] = False
                self.add(cmd)
                # Compile handler body (begin...end block or single command)
                self.compileOne()
                # Add stop
                cmd2 = {}
                cmd2['domain'] = 'core'
                cmd2['lino'] = command['lino']
                cmd2['keyword'] = 'stop'
                cmd2['debug'] = False
                self.add(cmd2)
                # Fixup: the 'on' command jumps past the handler
                command['goto'] = self.getCodeSize()
                return True
        return False

    def r_on(self, command):
        record = self.getVariable(command['server'])
        server = self.getObject(record)
        server.onRequestPC = self.nextPC() + 1
        return command['goto']

    # get Content from MyServer — read the request body
    def k_get(self, command):
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            varname = record['name']
            if self.nextIs('from'):
                if self.nextIsSymbol():
                    record2 = self.getSymbolRecord()
                    if self.isObjectType(record2, ECServer):
                        command['target'] = varname
                        command['server'] = record2['name']
                        self.add(command)
                        return True
        return False

    def r_get(self, command):
        record = self.getVariable(command['server'])
        server = self.getObject(record)
        target = self.getVariable(command['target'])
        self.putSymbolValue(target, server.getBody())
        return self.nextPC()

    # return Content to MyServer [with status 200]
    def k_return(self, command):
        command['value'] = self.nextValue()
        self.skip('to')
        if self.nextIsSymbol():
            record = self.getSymbolRecord()
            self.checkObjectType(record, ECServer)
            command['server'] = record['name']
            command['status'] = 200
            command['type'] = None
            while self.peek() == 'with':
                self.nextToken()
                if self.peek() == 'status':
                    self.nextToken()
                    command['status'] = self.nextValue()
                elif self.peek() == 'type':
                    self.nextToken()
                    command['type'] = self.nextValue()
            self.add(command)
            return True
        return False

    def r_return(self, command):
        record = self.getVariable(command['server'])
        server = self.getObject(record)
        value = self.textify(command['value'])
        status = int(self.textify(command['status'])) if isinstance(command['status'], ECValue) else command['status']
        content_type = self.textify(command['type']) if isinstance(command['type'], ECValue) else command['type']
        server.setResponse(value, status, content_type)
        return self.nextPC()

    #############################################################################
    # Compile a value in this domain
    # Handles: MyServer request, MyServer path, MyServer body
    def compileValue(self):
        token = self.getToken()
        if token == 'the':
            token = self.nextToken()
        if self.isSymbol():
            record = self.getSymbolRecord()
            if self.isObjectType(record, ECServer):
                prop = self.peek()
                if prop in ('request', 'path', 'body'):
                    self.nextToken()
                    return ECValue(domain=self.getName(), type=prop, content=record['name'])
        return None

    #############################################################################
    # Modify a value or leave it unchanged
    def modifyValue(self, value):
        return value

    #############################################################################
    # Value handlers

    def v_request(self, v):
        record = self.getVariable(v.getContent())
        server = self.getObject(record)
        return server.getMethod()

    def v_path(self, v):
        record = self.getVariable(v.getContent())
        server = self.getObject(record)
        return server.getPath()

    def v_body(self, v):
        record = self.getVariable(v.getContent())
        server = self.getObject(record)
        return server.getBody()

    #############################################################################
    # Compile a condition
    def compileCondition(self):
        return None

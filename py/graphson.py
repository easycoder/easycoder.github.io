import tkinter as tk
import json

elements = {}
zlist = []

def createScreen():
    global dx, dy, running
    running = True
    screen = tk.Tk()
    # screen.attributes('-fullscreen', True)

    screen.overrideredirect(True)
    w = 600
    h = 800
    # x = int((screen.winfo_screenwidth() / 2) - (w / 2))
    dx = int(screen.winfo_screenwidth() - w)
    dy = int((screen.winfo_screenheight() / 2) - (h / 2))
    geometry = str(w) + 'x' + str(h) + '+' + str(dx) + '+' + str(dy) 
    screen.geometry(geometry)

    screen.bind('<Button-1>', onClick)
    return screen

def setOnClick(id, cb):
    global elements
    if id in elements:
        elements[id]['cb'] = cb
    else:
        RuntimeError(f'Element \'{id}\' does not exist')
    return

def onClick(event):
    global dx, dy, zlist
    x = event.x_root
    y = event.y_root
    # print('Clicked at : '+ str(x) +","+ str(y))
    for i in range(1, len(zlist) + 1):
        element = zlist[-i]
        id = list(element)[0]
        values = element[id]
        x1 = dx + values['left']
        x2 = x1 + values['width']
        y1 = dy + values['top']
        y2 = y1 + values['height']
        if x >= x1 and x < x2 and y >= y1 and y < y2:
            if id in elements:
               pc = elements[id]['cb']()
            else:
                RuntimeError(f'Element \'{id}\' does not exist')
            return pc
    return

def closeScreen(screen):
    global running
    running = False

def renderScreen(screen):
    screen.after(1000, lambda: afterCB(screen))
    screen.mainloop()
    return

def afterCB(screen):
    global running
    if not running:
        screen.destroy()
    else:
        screen.after(1000, lambda: afterCB(screen))

# Render a graphic specification expressed as JSON text
def renderSpec(screen, text, offset):
    global canvas, elements, zlist

    def renderCanvas(values):
        global canvas
        left = values['left'] if 'left' in values else 0
        top = values['top'] if 'top' in values else 0
        width = values['width'] if 'width' in values else 600
        height = values['height'] if 'height' in values else 800
        fill = values['fill'] if 'fill' in values else 'white'
        canvas = tk.Canvas(master=screen, width=width, height=height, bg=fill)
        canvas.place(x=left, y=top)
        if '#' in values:
            children = values['#']
            if type(children) == list:
                for item in children:
                    if item in values:
                        child = values[item]
                        result = renderWidget(child, {'dx': left, 'dy': top})
                        if result != None:
                            return result
                    else:
                        return f'Element \'{item}\' does not exist'
            else:
                child = values[children]
                return renderWidget(child, offset)

    def renderRect(values, offset):
        global canvas
        left = values['left'] if 'left' in values else 10
        top = values['top'] if 'top' in values else 10
        left = offset['dx'] + left
        top = offset['dy'] + top
        width = values['width'] if 'width' in values else 100
        height = values['height'] if 'height' in values else 100
        right = left + width
        bottom = top + height
        fill = values['fill'] if 'fill' in values else None
        outline = values['outline'] if 'outline' in values else None
        rectId = canvas.create_rectangle(left, top, right, bottom, fill=fill, outline=outline)
        if 'id' in values:
            id = values['id']
            spec = {
                "id": rectId,
                "left": left,
                "top": top,
                "width": width,
                "height": height
            }
            elements[id] = spec
            zlist.append({id: spec})
        if '#' in values:
            children = values['#']
            if type(children) == list:
                for item in children:
                    if item in values:
                        child = values[item]
                        result = renderWidget(child, {'dx': left, 'dy': top})
                        if result != None:
                            return result
                    else:
                        return f'Unable to render \'{item}\''
            else:
                child = values[children]
                result = renderWidget(child, offset)
                if result != None:
                    return result
        return None
   
    def renderLabel(values, offset):
        global canvas
        left = values['left'] if 'left' in values else 10
        top = values['top'] if 'top' in values else 10
        left = offset['dx'] + left
        top = offset['dy'] + top
        width = values['width'] if 'width' in values else 100
        height = values['height'] if 'height' in values else 100
        right = left + width
        bottom = top + height
        fill = values['fill'] if 'fill' in values else None
        outline = values['outline'] if 'outline' in values else None
        color = values['color'] if 'color' in values else None
        text = values['text'] if 'text' in values else ''
        rectId = canvas.create_rectangle(left, top, right, bottom, fill=fill, outline=outline)
        if 'id' in values:
            id = values['id']
            spec = {
                "id": rectId,
                "left": left,
                "top": top,
                "width": width,
                "height": height
            }
            elements[id] = spec
            zlist.append({id: spec})
        canvas.create_text(left + width/2, top + height/2 + 5, fill=color, font="Times 22  bold", text=text, anchor='center')
        return None

    # Create a canvas or render a widget
    def renderWidget(widget, offset):
        widgetType = widget['type']
        if widgetType == 'canvas':
            return renderCanvas(widget)
        elif widgetType == 'rect':
            return renderRect(widget, offset)
        elif widgetType == 'label':
            return renderLabel(widget, offset)
    
    # Render a block - an array of widgets
    def renderBlock(block, offset):
        for name in block.keys():
            result = renderWidget(block[name], offset)
            if result != None:
                return result

    # Render a complete specification
    def renderSpec(spec, offset):
        if type(spec) == dict:
                return renderBlock(item, offset)
        elif type(spec) == list:
            for item in spec:
                result = renderBlock(item, offset)
                if result != None:
                    return result

    # Render a specification supplied as JSON text
    return renderSpec(json.loads(text), offset)

def getElement(name):
    global elements
    if name in elements:
        return elements[name]
    else:
        RuntimeError(f'Element \'{name}\' does not exist')
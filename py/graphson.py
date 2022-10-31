import tkinter as tk
from PIL import Image, ImageTk
import json

elements = {}
zlist = []
images = {}

def createScreen(values):
    global screen, canvas, screenLeft, screenTop, running
    running = True
    screen = tk.Tk()
    # screen.attributes('-fullscreen', True)

    screen.overrideredirect(True)
    screenLeft = values['left']['content'] if 'left' in values else 0
    screenTop = values['top']['content'] if 'top' in values else 0
    width = values['width']['content'] if 'width' in values else 600
    height = values['height']['content'] if 'height' in values else 800

    # screenLeft = int(screen.winfo_screenwidth() - width)
    # screenTop = int((screen.winfo_screenheight() / 2) - (height / 2))
    geometry = str(width) + 'x' + str(height) + '+' + str(screenLeft) + '+' + str(screenTop) 
    screen.geometry(geometry)

    # Handle a click in the screen
    def onClick(event):
        global screenLeft, screenTop, zlist
        x = event.x_root
        y = event.y_root
        # print('Clicked at : '+ str(x) +","+ str(y))
        for i in range(1, len(zlist) + 1):
            element = zlist[-i]
            id = list(element)[0]
            values = element[id]
            x1 = screenLeft + values['left']
            x2 = x1 + values['width']
            y1 = screenTop + values['top']
            y2 = y1 + values['height']
            if x >= x1 and x < x2 and y >= y1 and y < y2:
                if id in elements:
                    element = elements[id]
                    if 'cb' in element:
                        element['cb']()
                        break
                else:
                    RuntimeError(f'Element \'{id}\' does not exist')

    screen.bind('<Button-1>', onClick)

    fill = values['fill']['content'] if 'fill' in values else 'white'
    canvas = tk.Canvas(master=screen, width=width, height=height, bg=fill)
    canvas.place(x=0, y=0)

# Set up a click handler in an element
def setOnClick(id, cb):
    global elements
    if id in elements:
        elements[id]['cb'] = cb
    else:
        RuntimeError(f'Element \'{id}\' does not exist')
    return

# Signal that the screen should close
def closeScreen():
    global running
    running = False

# Show the screen and check every second if it's still running
def showScreen():
    global screen
    def afterCB(screen):
        global running
        if not running:
            screen.destroy()
        else:
            screen.after(1000, lambda: afterCB(screen))
    screen.after(1000, lambda: afterCB(screen))
    screen.mainloop()
    return

# Render a graphic specification
def render(spec, parent):
    global canvas, elements

    def getValue(vars, item):
        if item in vars:
            if type(item) == int:
                return item
            return vars[item]
        return item

    def renderIntoRectangle(widgetType, values, offset, vars):
        global canvas, zlist
        left = getValue(vars, values['left']) if 'left' in values else 10
        top = getValue(vars, values['top']) if 'top' in values else 10
        left = offset['dx'] + left
        top = offset['dy'] + top
        width = getValue(vars, values['width']) if 'width' in values else 100
        height = getValue(vars, values['height']) if 'height' in values else 100
        right = left + width
        bottom = top + height
        fill = values['fill'] if 'fill' in values else None
        outline = values['outline'] if 'outline' in values else None
        if outline != None:
            outlineWidth = getValue(vars, values['outlineWidth']) if 'outlineWidth' in values else 1
        else:
            outlineWidth = 0
        if widgetType == 'rect':
            widgetId = canvas.create_rectangle(left, top, right, bottom, fill=fill, outline=outline, width=outlineWidth)
        elif widgetType == 'ellipse':
            widgetId = canvas.create_oval(left, top, right, bottom, fill=fill, outline=outline, width=outlineWidth)
        else:
            return f'Unknown widget type \'{widgetType}\''
        if 'id' in values:
            id = getValue(vars, values['id'])
            widgetSpec = {
                "id": widgetId,
                "left": left,
                "top": top,
                "width": width,
                "height": height
            }
            elements[id] = widgetSpec
            zlist.append({id: widgetSpec})
        if '#' in values:
            children = values['#']
            if type(children) == list:
                for item in children:
                    if item in values:
                        child = values[item]
                        result = renderWidget(child, {'dx': left, 'dy': top}, vars)
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
   
    def renderText(values, offset, vars):
        global canvas
        left = getValue(vars, values['left']) if 'left' in values else 10
        top = getValue(vars, values['top']) if 'top' in values else 10
        left = offset['dx'] + left
        top = offset['dy'] + top
        width = getValue(vars, values['width']) if 'width' in values else 100
        height = getValue(vars, values['height']) if 'height' in values else 100
        right = left + width
        bottom = top + height
        shape = getValue(vars, values['shape']) if 'shape' in values else 'rectangle'
        fill = getValue(vars, values['fill']) if 'fill' in values else None
        outline = getValue(vars, values['outline']) if 'outline' in values else None
        outlineWidth = getValue(vars, values['outlineWidth']) if 'outlineWidth' in values else 0 if outline == None else 1
        color = getValue(vars, values['color']) if 'color' in values else None
        text = getValue(vars, values['text']) if 'text' in values else ''
        fontFace = getValue(vars, values['fontFace']) if 'fontFace' in values else 'Helvetica'
        fontWeight = getValue(vars, values['fontWeight']) if 'fontWeight' in values else 'normal'
        fontSize = round(height*2/5) if shape == 'ellipse' else round(height*3/5)
        fontTop = top + height/2
        if 'fontSize' in values:
            fontSize = getValue(vars, values['fontSize'])
            fontTop = top + round(fontSize * 5 / 4)
        adjust = round(fontSize/5) if shape == 'ellipse' else 0
        align = getValue(vars, values['align']) if 'align' in values else 'center'
        if align == 'left':
            xoff = round(fontSize/5)
            anchor = 'w'
        elif align == 'right':
            xoff = width - round(fontSize/5)
            anchor = 'e'
        else:
            xoff = width/2
            anchor = 'center'
        if xoff < 3:
            xoff = 3
        if shape == 'ellipse':
            containerId = canvas.create_oval(left, top, right, bottom, fill=fill, outline=outline, width=outlineWidth)
        else:
            containerId = canvas.create_rectangle(left, top, right, bottom, fill=fill, outline=outline, width=outlineWidth)
        if 'id' in values:
            id = getValue(vars, values['id'])
            widgetSpec = {
                "id": containerId,
                "left": left,
                "top": top,
                "width": width,
                "height": height
            }
            elements[id] = widgetSpec
            zlist.append({id: widgetSpec})
        canvas.create_text(left + xoff, fontTop + adjust, fill=color, font=f'"{fontFace}" {fontSize} {fontWeight}', text=text, anchor=anchor)
        return None
   
    def renderImage(values, offset, vars):
        global canvas, images
        left = getValue(vars, values['left']) if 'left' in values else 10
        top = getValue(vars, values['top']) if 'top' in values else 10
        left = offset['dx'] + left
        top = offset['dy'] + top
        width = getValue(vars, values['width']) if 'width' in values else 100
        height = getValue(vars, values['height']) if 'height' in values else 100
        right = left + width
        bottom = top + height
        src = getValue(vars, values['src']) if 'src' in values else None
        containerId = canvas.create_rectangle(left, top, right, bottom, width=0)
        if 'id' in values:
            id = values['id']
            widgetSpec = {
                "id": containerId,
                "left": left,
                "top": top,
                "width": width,
                "height": height
            }
            elements[id] = widgetSpec
            zlist.append({id: widgetSpec})
            if src == None:
                return f'No image source given for \'{id}\''
        img = (Image.open(src))
        resized_image= img.resize((width, height), Image.ANTIALIAS)
        new_image= ImageTk.PhotoImage(resized_image)
        imageid = canvas.create_image(left, top, anchor='nw', image=new_image)
        images[containerId] = {'id': imageid, "image": new_image}
        return None

    # Create a canvas or render a widget
    def renderWidget(widget, offset, vars):
        widgetType = widget['type']
        if widgetType in ['rect', 'ellipse']:
            return renderIntoRectangle(widgetType,widget, offset, vars)
        elif widgetType == 'text':
            return renderText(widget, offset, vars)
        elif widgetType == 'image':
            return renderImage(widget, offset, vars)

    # Render a complete specification
    def renderSpec(spec, offset, vars):
        widgets = spec['#']
        # If a list, iterate it
        if type(widgets) is list:
            for widget in widgets:
                result = renderWidget(spec[widget], offset, vars)
                if result != None:
                    return result
        # Otherwise, process the single widget
        else:
            return renderWidget(spec[widgets], offset, vars)

    # Main entry point
    offset = {'dx': 0, 'dy': 0}
    if parent != screen:
        RuntimeError('Can\'t yet render into parent widget')

    # If it'a string, process it
    if type(spec) is str:
        return renderSpec(json.loads(spec), offset, {})

    # If it's a 'dict', extract the spec and the vars
    if type(spec) is dict:
        vars = spec['vars']
        spec = json.loads(spec['spec'])
        return renderSpec(spec, offset, vars)

# Get the widget whose name is given
def getElement(name):
    global elements
    if name in elements:
        return elements[name]
    else:
        RuntimeError(f'Element \'{name}\' does not exist')
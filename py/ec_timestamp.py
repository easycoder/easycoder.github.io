import pytz, time
from datetime import datetime

def getTimestamp(t):
    tz = pytz.timezone('Europe/London') # Localize this!
    dt = datetime.fromtimestamp(t)
    return int(t) + tz.dst(dt).seconds

# Usage: print(getTimestamp(time.time()))

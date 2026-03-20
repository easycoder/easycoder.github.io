import pytz, time
from datetime import datetime

def getTimestamp(t):
    tz = pytz.timezone('GB') # Localize this!
    dt = datetime.fromtimestamp(t)
    # print(f'{dt} + {tz.dst(dt).seconds}')
    dst = tz.dst(dt)
    return int(t) + (dst.seconds if dst else 0)

# Usage: print(getTimestamp(time.time()))

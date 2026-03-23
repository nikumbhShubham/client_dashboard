import re
from datetime import datetime

data = "/Date(1772620773860+0530)/"

# extract milliseconds
timestamp = int(re.search(r'\d+', data).group())

# convert to datetime
dt = datetime.fromtimestamp(timestamp / 1000)

print(dt)
print("Date:", dt.date())
print("Time:", dt.time())
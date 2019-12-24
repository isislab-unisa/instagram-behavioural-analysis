from instagram_behavioural_analysis import Analyzer
import json

# Load locations info
locations = {}
with open('locations.json', 'r') as json_file:
    locations = json.load(json_file)

a = Analyzer()
# Filter stories made during a specific time interval
start = 0
end = 2524654800
for location in locations:
    a.filterByDate('categorized/' + location['filename'], start, end)

# Analyze stories
for location in locations:
    a.analyze('categorized/' + location['filename'])

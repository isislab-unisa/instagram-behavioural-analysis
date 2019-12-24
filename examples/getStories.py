from instagram_behavioural_analysis import Scraper
import json

# Load locations info
locations = {}
with open('locations.json', 'r') as json_file:
    locations = json.load(json_file)

# Login to instagram
s = Scraper()
user_name = 'YOUR_USERNAME'
password = 'YOUR_PASSWORD'
s.login(user_name, password)

# Find stories in each location
for location in locations:
    s.findStories(location['id'], 'stories/' + location['filename'])

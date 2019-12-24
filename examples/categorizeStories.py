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

app_id = 'pQLb6JI8ra2YT0wLfKfV'
app_code = 'ZkzMIOB19NYT7I3WurOmzQ'
s.setHereApp(app_id, app_code)

# Categorize stories
for location in locations:
    s.categorize('stories/' + location['filename'],
                 'categorized/' + location['filename'])

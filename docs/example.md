---
layout: default
title: Example
---

Create a directory where putting files containing infos about the stories
```bash
mkdir stories categorized
```

Import the necessary modules and get the locations to analyze
```python
from instagram_behavioural_analysis import Analyzer, Scraper
import json

# Load locations info
locations = {}
with open('locations.json', 'r') as json_file:
    locations = json.load(json_file)
```

Login to Instagram
```python
# Login to Instagram
s = Scraper()
user_name = 'YOUR_USERNAME'
password = 'YOUR_PASSWORD'
s.login(user_name, password)
```

Retrieve stories made in each location
```python
# Find stories in each location
for location in locations:
    s.findStories(location['id'], 'stories/' + location['filename'])
```

Set csv header for each file
```bash
for file in stories/*.csv; do           
sed -i '1s/^/userid|timestamp|location_id|location_name\n/' $file;
done
```

Categorize each location with Here
```python
app_id = 'APP_ID'
app_code = 'APP_CODE'
s.setHereApp(app_id, app_code)

# Categorize stories
for location in locations:
    s.categorize('stories/' + location['filename'], 'categorized/' + location['filename'])
```

Set csv header for each file
```bash
for file in categorized/*.csv; do
sed -i '1s/^/userid|timestamp|location_id|location_name|category\n/' $file;
done
```

Filter stories by time
```python
# Filter stories made during a specific time interval
start = 0
end = 2524654800
for location in locations:
    a.filterByDate('categorized/' + location['filename'], start, end)
```

Set time params
```python
for location in locations:
    a.setDayNHour('categorized/' + location['filename'])
```

Analyze the stories
```python
a = Analyzer()
# Analyze stories
for location in locations:
    a.analyze('categorized/' + location['filename'])
```
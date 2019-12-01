import csv
import json
import logging
import logging.handlers as handlers
import requests
from instagram_private_api import Client


class Scraper:
    """Class for extracting data from Instagram"""

    def __init__(self):
        """

        :param api: API client
        :param app_id: here app id
        :param app_code: here app code
        :param stories_found: list of stories found
        :param users_found: list of users found
        :param location_categories: dict that maps a location to its category
        """
        self.api = None
        self.app_id = None
        self.app_code = None
        self.stories_found = []
        self.users_found = []
        self.locations_categories = {}
        self.setLogging()

    def login(self, username: str, password: str):
        """Logs to Instagram

        :param username: Instagram login name
        :param password: Instagram login password
        """
        self.api = Client(username, password)

    def setHereApp(self, app_id: str, app_code: str):
        """Sets Here app id and code

        :param app_id: here app id
        :param app_code: here app code 
        """
        self.app_id = app_id
        self.app_code = app_code

    def findStories(self, source_id: int, filename: str):
        """Searches stories made in a location and saves them in a file

        :param source_id: instagram source location id
        :param filename: file where to save stories
        """
        try:
            results = self.api.location_stories(source_id)
            items = results['story']['items']
            for item in items:
                item_id = item['id']
                if item_id in self.stories_found:
                    continue
                self.stories_found.append(item_id)
                userid = item['user']['pk']
                timestamp = item['expiring_at'] - 86400
                with open(filename, 'a') as file:
                    writer = csv.writer(file, delimiter='|',
                                        quoting=csv.QUOTE_MINIMAL)
                    for story_location in item['story_locations']:
                        location = story_location['location']
                        location_id = location['pk']
                        location_name = location['name']
                        writer.writerow(
                            [userid, timestamp, location_id, location_name])
        except Exception as e:
            self.logger.error(e)

    def categorize(self, source_file: str, target_file: str):
        """Searches locations' categories

        :param source_file: file with locations to find categories
        :param target_file: file where to write locations along their categories
        """
        with open(source_file, 'r') as inp, open(target_file, 'a') as out:
            reader = csv.reader(inp, delimiter='|')
            writer = csv.writer(out, delimiter='|')
            for row in reader:
                userid = row[0]
                timestamp = row[1]
                location_id = row[2]
                location_name = row[3]
                try:
                    if (location_id not in self.locations_categories):
                        info = self.api.location_info(location_id)
                        lat = info['location']['lat']
                        lng = info['location']['lng']

                        category = ''
                        endpoint = 'https://places.cit.api.here.com/places/v1/autosuggest?at=' + \
                            str(lat) + ',' + str(lng) + '&q=' + location_name + \
                            '&app_id=' + self.app_id + '&app_code=' + self.app_code
                        r = requests.get(endpoint)
                        json = r.json()
                        results = json["results"]
                        if (len(results) > 0):
                            category = results[0]['category']
                        self.locations_categories[location_id] = category
                        writer.writerow(
                            [userid, timestamp, location_id, location_name, self.locations_categories[location_id]])
                except Exception as e:
                    self.logger.error(e)
                    continue

    def setLogging(self):
        """Sets logger handler and formatters
        """
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        errorLogHandler = handlers.RotatingFileHandler(
            'error.log', maxBytes=5000, backupCount=0)
        errorLogHandler.setLevel(logging.ERROR)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        errorLogHandler.setFormatter(formatter)
        self.logger.addHandler(errorLogHandler)

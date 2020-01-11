import pandas as pd
import json
from datetime import datetime
import pytz


class Analyzer:
    """Class for analyzing Instagram data
    """

    def __init__(self):
        """
        :param ids_dict: dict that maps a user Instagram id to a new id
        :param new_id: new id to exchange with Instagram user id
        """

        self.ids_dict = {}
        self.new_id = 1

    def getDay(self, date: datetime):
        """Returns a timestamp's day of the week

        :param timestamp: a timestamp
        :return: timestamp's day of the week
        """
        return {
            0: 'Monday',
            1: 'Tuesday',
            2: 'Wednesday',
            3: 'Thursday',
            4: 'Friday',
            5: 'Saturday',
            6: 'Sunday'
        }[date.weekday()]

    def setId(self, old_id: int):
        """Maps an Instagram user id to a new one

        :param old_id: old Instagram user id
        """
        if (old_id not in self.ids_dict):
            self.ids_dict[old_id] = self.new_id
            self.new_id += 1
        return self.ids_dict[old_id]

    def filterByDate(self, datafile: str, start: int, end: int):
        """"Filter stories made in a certain period

        :param datafile: stories file
        :param start: start of the period
        :param end: end of the period
        """
        data = pd.read_csv(datafile, delimiter='|')
        filtered = data[data['timestamp'].apply(
            lambda t:t >= start and t <= end)]
        filtered.to_csv(datafile, sep='|', index=False)

    def filterByLocation(self, datafile: str, uninteresting_locations: list):
        """Filter stories not made in certain locations 

        :param datafile: stories file
        :param uninteresting_locations: list of uninteresting locations
        """
        data = pd.read_csv(datafile, delimiter='|')
        filtered = data[data['location_name'].apply(
            lambda l:l not in uninteresting_locations)]
        filtered.to_csv(datafile, sep='|', index=False)

    def setDayNHour(self, datafile: str, zone='Greenwich'):
        """Set day and hour

        :param datafile: stories file
        """
        tz_GMT = pytz.timezone(zone)
        data = pd.read_csv(datafile, delimiter='|')
        data = data[data['timestamp'].notnull()].copy()
        data['day'] = data['timestamp'].apply(
            lambda t: self.getDay(datetime.fromtimestamp(t, tz_GMT)))
        data['hour'] = data['timestamp'].apply(
            lambda t: datetime.fromtimestamp(t, tz_GMT).hour)
        data.to_csv(datafile, sep='|', index=False)

    def anonymize(self, datafile: str):
        """Exchange old users' ids with new ones

        :param datafile: stories file
        """
        data = pd.read_csv(datafile, delimiter='|')
        data = data[data['userid'].notnull()].copy()
        data['userid'] = data['userid'].apply(self.setId)
        data.to_csv(datafile, sep='|', index=False)

    def analyze(self, datafile: str):
        """Count categories occurrences for each day of the week

        :param datafile: stories file
        """
        data = pd.read_csv(datafile, delimiter='|')
        categories_dict = {}

        for day in data.day.unique():
            categories_dict[day] = {}
            for hour in data.hour.unique():
                categories_dict[day][hour.item()] = dict(
                    data[(data['day'] == day) & (data['hour'] == hour)].drop_duplicates().category.value_counts())

        for hour in categories_dict.values():
            for value in hour.values():
                for v in value.keys():
                    value[v] = value[v].item()

        with open(datafile.replace('csv', 'json'), 'w') as json_file:
            json.dump(categories_dict, json_file, indent=4)

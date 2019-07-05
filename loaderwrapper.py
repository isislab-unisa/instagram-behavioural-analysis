from instaloader import Instaloader, Profile
import os
import csv
from datetime import datetime


class LoaderWrapper:
    def __init__(self):
        self.loader = Instaloader()

    def login(self, login_name: str):
        """Logs in Instagram given a username"""
        try:
            self.loader.load_session_from_file(login_name)
        except FileNotFoundError:
            self.loader.context.log(
                "Session file does not exist yet - Logging in.")
            if not self.loader.context.is_logged_in:
                self.loader.interactive_login(login_name)
                self.loader.save_session_to_file()

    def getUserInfo(self, target_id: int):
        """Saves infos about a user given his/her id"""
        if not os.path.exists(str(target_id)):
            os.makedirs(str(target_id))
        os.chdir(str(target_id))

        self.getUserStats(target_id)
        self.getUserPosts(target_id)
        self.getUserStories(target_id)
        self.getUserHighlights(target_id)
        self.getUserTagged(target_id)

    def getUserStats(self, target_id: int):
        """Saves infos about a user given his/her id such as username,
        #followers, #followees and biography at a specific time"""
        profile = Profile.from_id(self.loader.context, target_id)

        with open('stats.csv', 'w') as csvfile:
            spamwriter = csv.writer(csvfile, delimiter='|',
                                    quoting=csv.QUOTE_MINIMAL)

            spamwriter.writerow([datetime.today(), profile.username,
                                 profile.followers, profile.followees, profile.biography])

    def getUserPosts(self, target_id: int):
        """Downloads a user's posts given his/her id"""
        profile = Profile.from_id(self.loader.context, target_id)

        for post in profile.get_posts():
            self.loader.download_post(post, ':posts')

    def getUserStories(self, target_id: int):
        """Downloads a user's stories given his/her id"""
        for story in self.loader.get_stories([target_id]):
            for item in story.get_items():
                self.loader.download_storyitem(item, ':stories')

    def getUserHighlights(self, target_id: int):
        """Downloads a user's highlights given his/her id"""
        profile = Profile.from_id(self.loader.context, target_id)

        for highlight in self.loader.get_highlights(profile):
            for item in highlight.get_items():
                self.loader.download_storyitem(item, ':hightlights')

    def getUserTagged(self, target_id: int):
        """Downloads all posts where a profile is tagged"""
        profile = Profile.from_id(self.loader.context, target_id)

        for post in profile.get_tagged_posts():
            self.loader.download_post(post, ':tagged')

    def getUserFoollowers(self, target_id: int):
        """Writes in a file all user's followers given his/her id"""
        profile = Profile.from_id(self.loader.context, target_id)

        with open('followers.csv', 'w') as csvfile:
            spamwriter = csv.writer(csvfile, delimiter='|',
                                    quoting=csv.QUOTE_MINIMAL)

            spamwriter.writerow([follower.userid, follower.username])

    def getUserFoollowees(self, target_id: int):
        """Writes in a file all user's followees given his/her id"""
        profile = Profile.from_id(self.loader.context, target_id)

        with open('followees.csv', 'w') as csvfile:
            spamwriter = csv.writer(csvfile, delimiter='|',
                                    quoting=csv.QUOTE_MINIMAL)

            for followee in profile.get_followees():
                spamwriter.writerow([followee.userid, followee.username])

    def getPostsByHashtag(self, hashtag: str):
        """Downloads media related to a given hashtag"""
        for post in self.loader.get_hashtag_posts(hashtag):
            try:
                self.loader.download_post(post, '#' + hashtag)
            except Exception:
                continue

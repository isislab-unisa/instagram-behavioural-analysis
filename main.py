from loaderwrapper import LoaderWrapper

wrapper = LoaderWrapper()

login_name = input('Insert username: ')
wrapper.login(login_name)

wrapper.getUserInfo(19769622)
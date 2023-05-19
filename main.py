import requests
from bs4 import BeautifulSoup
import time
from datadog import initialize, api
import os
import configparser

config = configparser.ConfigParser(interpolation=None)
configFile = os.path.join(os.path.dirname(__file__), 'config.ini')

if os.path.isfile(configFile):
    config.read(configFile)
    apiKey = config['datadog']['apikey']
    appKey = config['datadog']['appKey']
    weatherApiKey = config['openweathermap']['apiKey']
else:
    print('Config File Not Found')


class Inverter(object):
    def __init__(self, type, id, status):
        self.type = type
        self.id = id
        self.lifetimePower = None
        self.currentGeneration = None
        self.status = status


def getKWHfromHTML(response):
    # navigating deviceinfo html
    soup = BeautifulSoup(response.text, 'html.parser')
    temp = soup.find_all('td')
    for tag in temp:
        if not tag.b:
            continue
        elif tag.b.string == 'Total Lifetime Energy:':
            split_text = tag.text.split()
            kWh = float(split_text[3])
            Wh = kWh * 1000

            return Wh


def getDeviceStatus(response):
    # navigating deviceinfo html
    soup = BeautifulSoup(response.text, 'html.parser')
    status = soup.span['class'][0]
    # print(status)
    return status


def getDeviceList():
    global devices
    devices = {}
    r = requests.get('http://192.168.0.189/cgi-bin/dl_cgi?Command=DeviceList')
    soup = BeautifulSoup(r.text, 'html.parser')
    listOfh2 = soup.find_all('h2')

    for line in listOfh2:
        status = line.span['class'][0]
        if status == 'working':
            status = 0
        else:
            status = 2
        splitLine = line.span.text.split(' ')
        type, id = splitLine[0], splitLine[1]
        # pass on Supervisor for now
        if type != 'Inverter':
            continue
            type = 'Supervisor'
        try:
            devices[id]
        except KeyError:
            print('Adding Inverter to Dictionary')
            devices[id] = Inverter(type, id, status)


def getDeviceInfo():
    for id, device in devices.items():
        url = 'http://192.168.0.189/cgi-bin/dlDevices.plx?Command=DeviceDetails&SerialNumber={}'.format(id)
        if device.type == "Inverter":
            r = requests.get(url)
            kWh = getKWHfromHTML(r)
            if device.lifetimePower:
                # get the difference between the two
                currentGeneration = kWh - device.lifetimePower
                device.currentGeneration = currentGeneration
                # update the difference, then update the lifetime
                device.lifetimePower = kWh
            else:
                # no seeded values, updating
                device.lifetimePower = kWh

            status = getDeviceStatus(r)

            # For DataDog
            # 0 - Ok, 1 - Warning, 2 - Critical, 3 - Unkown
            if status == 'working':
                status = 0
            else:
                status = 2

            device.status = status


def send_to_dd(type, id, lifetimeGeneration, currentGeneration, status):
    if currentGeneration is None:
        currentGeneration = 0

    options = {
        'api_key': apiKey,
        'app_key': appKey
    }

    initialize(**options)

    check = 'solar.status'
    status = status
    tags = ['{}:{}'.format(type, id)]

    api.Metric.send([{
        'metric': 'solar.current.generation',
        'points': currentGeneration,
        'tags': '{}:{}'.format(type, id)
    }])

    api.ServiceCheck.check(check=check, status=status, tags=tags)


# maybe should implement to cut down on calls?
def get_weather():
    url = 'https://api.openweathermap.org/data/2.5/weather?zip=63110,us&appid={}'.format(weatherApiKey)
    payload = {'units': 'imperial'}
    try:
        r = requests.get(url, params=payload)
        r.raise_for_status()
        sunrise = r.json()['sys']['sunrise']
        sunset = r.json()['sys']['sunset']

        return sunrise, sunset
    except requests.exceptions.RequestException as e:
        print('something went wrong')


def startup():
    print('Starting... seeding current initial power value')
    getDeviceList()
    getDeviceInfo()
    print('startup done!')
    time.sleep(300)


def main():
    while True:
        '''
        getDeviceInfo()

        for k, v in devices.items():
            print(v.id, v.status, v.lifetimePower, v.currentGeneration)
            send_to_dd(v.id, v.lifetimePower, v.currentGeneration, v.status)
            # print(k, vars(v))
        time.sleep(300)
        '''
        getDeviceInfo()

        for k, v in devices.items():
            print(v.type.lower(), v.id, v.status, v.lifetimePower, v.currentGeneration)
            send_to_dd(v.type, v.id, v.lifetimePower, v.currentGeneration, v.status)
            # print(k, vars(v))

        now = time.time()
        sunrise, sunset = get_weather()
        if sunrise is None or sunset is None:
            print('No data about sunrise or sunset, continue on')
            time.sleep(300)
        elif now > sunset:
            print('after sunset, sleeping 1 hour at a time')
            time.sleep(3600)
        # if betwen sunrise and sunset
        elif sunrise < now < sunset:
            print('let make some powah')
            time.sleep(300)
        elif now < sunrise:
            print('new day!')
            timeToSunrise = sunrise - now
            print("Time to Sunrise in seconds: {}".format(timeToSunrise))
            time.sleep(timeToSunrise)


if __name__ == '__main__':
    startup()
    main()

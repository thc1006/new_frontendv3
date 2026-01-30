import pandas as pd
import requests
import json
import time

# Define the URL of the API endpoint
url = "http://140.113.144.121:2980/Influx/viavi-cell"

# Load the base JSON data
data = [
    {
        "fields": {
            "DRB.UEThpDl": 0.09827999770641327,
            "DRB.UEThpUl": 0.09827999770641327,
            "RRU.PrbUsedDl": 273.0,
            "RRU.PrbUsedUl": 273.0,
            "RRU.PrbAvailDl": 273.0,
            "RRU.PrbAvailUl": 273.0,
            "RRU.PrbTotUl": 100.0,
            "RRU.PrbTotDl": 100.0,
            "RRC.ConnMean": 15.0,
            "RRC.ConnMax": 15.0,
            "PEE.AvgPower": 358.6261291503906,
            "PEE.Energy": 0.027494670000210834,
            "Viavi.PEE.EnergyEfficiency": 274.04583740234375,
            "Viavi.Radio.power": 24.0,
            "timestamp": 1729151339  # This will be updated with the current timestamp
        },
        "measurement": "viavi-cell",
        "tags": {
            "Ue-Id": "S5/N78/C1"
        }
    }
]



# Define the headers
headers = {
    'accept': '*/*',
    'Content-Type': 'application/json'
}


tags = ["S1/N78/C1", "S2/N78/C1", "S3/N78/C1", "S4/N78/C1", "S5/N78/C1"]
ru_power = [24, 24, 0, 24, 24]

for cellId in range(5):
    # Update the timestamp with the current time (in seconds since epoch)
    current_timestamp = int(time.time())
    data[0]["fields"]["Viavi.Radio.power"] = float(ru_power[cellId])
    data[0]["fields"]["timestamp"] = current_timestamp
    data[0]["tags"]["Ue-Id"] = tags[cellId]
	# Convert the updated data to JSON format
    json_data = json.dumps(data)


    # Send the POST request with the updated data
    response = requests.post(url, headers=headers, data=json_data)

    print(f"Response status code: {response.status_code}")
    print(f"Response content: {response.text}")
import pandas as pd
import requests
import json
import time

# Load the CSV file with 100 rows and 2 columns (x, y)
csv_file_path = "locations.csv"  # Update with your actual CSV file path
df = pd.read_csv(csv_file_path)

# Define the URL of the API endpoint
url = "http://140.113.144.121:2980/Influx/wisdon-ue"

# Load the base JSON data
data = [
    {
        "fields": {
            "DRB.UEThpDl": 0.9491422259441492,
            "DRB.UEThpUl": 0,
            "RRU.PrbUsedDl": 136,
            "RRU.PrbUsedUl": 0,
            "Wisdon.UE.Geo.x": 0.0,
            "Wisdon.UE.Geo.y": 0.0,
            "Wisdon.UE.ServiceType": 1,
            "Wisdon.UE.n1.Pci": 3,
            "Wisdon.UE.n1.RsSinr": -4.132998635484599,
            "Wisdon.UE.n1.Rsrp": -72.52,
            "Wisdon.UE.n1.Rsrq": 20.867001364515403,
            "Wisdon.UE.n2.Pci": 2,
            "Wisdon.UE.n2.RsSinr": -23,
            "Wisdon.UE.n2.Rsrp": -133.19,
            "Wisdon.UE.n2.Rsrq": 0,
            "Wisdon.UE.n3.Pci": 1,
            "Wisdon.UE.n3.RsSinr": -23,
            "Wisdon.UE.n3.Rsrp": -137.29,
            "Wisdon.UE.n3.Rsrq": 0,
            "Wisdon.UE.serving.Pci": 3,
            "Wisdon.UE.serving.RsSinr": -4.141988284208132,
            "Wisdon.UE.serving.Rsrp": -72.52,
            "Wisdon.UE.serving.Rsrq": 20.858011715791868,
            "timestamp": 1729151339  # This will be updated with the current timestamp
        },
        "measurement": "22",
        "tags": {
            "Ue-Id": "2"
        }
    }
]

# Define the headers
headers = {
    'accept': '*/*',
    'Content-Type': 'application/json'
}

# Iterate through each row in the CSV
for index, row in df.iterrows():
    # Extract x and y values from the current row
    new_geo_x = row['x']
    new_geo_y = row['y']

    # Update the JSON data with the new x and y values
    data[0]["fields"]["Wisdon.UE.Geo.x"] = new_geo_x
    data[0]["fields"]["Wisdon.UE.Geo.y"] = new_geo_y

    # Update the timestamp with the current time (in seconds since epoch)
    current_timestamp = int(time.time())
    data[0]["fields"]["timestamp"] = current_timestamp

    # Convert the updated data to JSON format
    json_data = json.dumps(data)

    # Send the POST request with the updated data
    response = requests.post(url, headers=headers, data=json_data)

    # Print the response status and content
    print(f"Sent update {index + 1}: x={new_geo_x}, y={new_geo_y}, timestamp={current_timestamp}")
    print(f"Response status code: {response.status_code}")
    print(f"Response content: {response.text}")

    # Pause for 1 second before sending the next request
    time.sleep(1)

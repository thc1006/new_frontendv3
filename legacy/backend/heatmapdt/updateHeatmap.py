import csv
import json
import sys

# Ensure correct number of command-line arguments
if len(sys.argv) != 6:
    print("Usage: python3 updateHeatmap.py <ru5> <ru6> <ru9> <ru11> <ru12>")
    sys.exit(1)

# Get the adjustment values from command-line arguments
ru5 = float(sys.argv[1])
ru6 = float(sys.argv[2])
ru9 = float(sys.argv[3])
ru11 = float(sys.argv[4])
ru12 = float(sys.argv[5])

# File paths
csv_file = 'base.csv'  # Replace with your CSV file path
json_file = '21.json'  # Replace with your desired JSON output file path

data = []

# Open the CSV file and read its contents
with open(csv_file, 'r') as file:
    csv_reader = csv.DictReader(file)
    
    # Convert each row into a dictionary and adjust the RU values
    for row in csv_reader:
        row_dict = {
            "areaId": int(row["areaId"]),
            "ms_x": float(row["ms_x"]),
            "ms_y": float(row["ms_y"]),
            "RU5": float(row["RU5"]) - ru5,
            "RU6": float(row["RU6"]) - ru6,
            "RU9": float(row["RU9"]) - ru9,
            "RU11": float(row["RU11"]) - ru11,
            "RU12": float(row["RU12"]) - ru12
        }
        data.append(row_dict)

# Write the adjusted data to a JSON file
with open(json_file, 'w') as json_output:
    json.dump(data, json_output, indent=4)

print(f"Data has been written to {json_file}")

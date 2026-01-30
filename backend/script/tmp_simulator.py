import sys
import random
# if len(sys.argv) < 6:
#     print("len(sys.argv) = ", len(sys.argv), "\nCMD Usage: python tmp_simulator.py RU_manufacturer RU_number RU_x RU_y PID")
#     sys.exit(1)

parameters = sys.argv[1:]
RU_manufacturer = parameters[0]
RU_number = parameters[1]
RU_x = parameters[2]
RU_y = parameters[3]
PID = parameters[4]

# random generate RUs' coordinate
# RU_coordinate = {}
# for i in range(0, int(RU_number)):
#     RU_x = random.randint(1, int(img_width))
#     RU_y = random.randint(1, int(img_height))
#     RU_coordinate[i] = {"RU_x" : RU_x, "RU_y": RU_y}


data = {}
data['RU_manufacturer'] = RU_manufacturer
data['RU_number'] = RU_number
data['RU_x'] = RU_x
data['RU_y'] = RU_y
data['PID'] = PID

print(data)
from enum import Enum

# (e.g. 'IDLE', 'WAITING', 'FAILURE', 'SUCCESS')
# This enum represents the possible states of a rsrp or throughput evaluation.
class HeatmapState(Enum):
    IDLE = "idle"
    WAITING = "waiting"
    FAILURE = "failure"
    SUCCESS = "success"
    DISCARDED = "discarded"
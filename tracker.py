from pydantic import BaseModel, Field
from datetime import date


# class Tracker(BaseModel):
#     id: int
#     title: str
#     desc: str
#     open_date: date
#     freezer: str
#     protocol: str


class TrackerRequest(BaseModel):
    title: str
    desc: str
    open_date: date
    freezer: str
    protocol: str

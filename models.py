from beanie import Document
from datetime import date
from pydantic import EmailStr


class Reagent(Document):
    title: str
    desc: str
    open_date: date
    freezer: str
    protocol: str
    owner: str | None = None

    class Settings:
        name = "reagents"


class User(Document):
    email: EmailStr
    password: str
    active: bool = True

    class Settings:
        name = "users"

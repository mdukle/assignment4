from fastapi import APIRouter, HTTPException, Depends
from models import Reagent
from tracker import TrackerRequest
from auth.authenticate import authenticate as get_current_user

tracker_router = APIRouter()


@tracker_router.get("/")
async def get_all_reagents(user=Depends(get_current_user)):
    return await Reagent.find(Reagent.owner == user.email).to_list()


@tracker_router.post("/", status_code=201)
async def create_new_reagent(reagent: TrackerRequest, user=Depends(get_current_user)):
    new_reagent = Reagent(**reagent.model_dump(), owner=user.email)
    await new_reagent.insert()
    return new_reagent


@tracker_router.get("/{id}")
async def get_reagent_by_id(id: str, user=Depends(get_current_user)):
    reagent = await Reagent.get(id)
    if not reagent or reagent.owner != user.email:
        raise HTTPException(status_code=404)
    return reagent


@tracker_router.put("/{id}")
async def edit_reagent(id: str, reagent: TrackerRequest, user=Depends(get_current_user)):
    existing = await Reagent.get(id)
    if not existing or existing.owner != user.email:
        raise HTTPException(status_code=404)

    existing.title = reagent.title
    existing.desc = reagent.desc
    existing.open_date = reagent.open_date
    existing.freezer = reagent.freezer
    existing.protocol = reagent.protocol

    await existing.save()
    return existing


@tracker_router.delete("/{id}")
async def delete_reagent(id: str, user=Depends(get_current_user)):
    reagent = await Reagent.get(id)
    if not reagent or reagent.owner != user.email:
        raise HTTPException(status_code=404)

    await reagent.delete()
    return {"msg": "Deleted"}
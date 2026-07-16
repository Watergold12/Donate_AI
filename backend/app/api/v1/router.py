"""Aggregate API v1 router — all sub-routers registered here."""
from fastapi import APIRouter
from app.api.v1 import admin, analytics, auth, detection, donations, donors, matching, matching_engine, ngos, notifications, pickups

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(donors.router)
api_router.include_router(donations.router)
api_router.include_router(ngos.router)
api_router.include_router(detection.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
api_router.include_router(matching.router)
api_router.include_router(matching_engine.router)
api_router.include_router(pickups.router)
api_router.include_router(admin.router)

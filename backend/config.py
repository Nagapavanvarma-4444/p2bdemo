"""
Configuration module for PLAN 2 BUILD backend.
Loads environment variables and provides config classes.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))


class Config:
    """Base configuration class."""

    # Flask
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # MongoDB (5 second timeout to fail fast if unavailable)
    _mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/plan2build')
    if 'serverSelectionTimeoutMS' not in _mongo_uri:
        sep = '&' if '?' in _mongo_uri else '?'
        _mongo_uri += f'{sep}serverSelectionTimeoutMS=5000'
    MONGO_URI = _mongo_uri

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    )

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')

    # Razorpay
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')

    # Twilio (SMS)
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', 'placeholder')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', 'placeholder')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', 'placeholder')

    # Clerk (OTP Service)
    CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY', 'placeholder')

    # Mail
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', '')

    # Frontend URL (for CORS and email links)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')

    # Upload limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

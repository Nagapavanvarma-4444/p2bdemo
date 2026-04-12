"""
Configuration module for PLAN 2 BUILD backend.
Loads environment variables and provides config classes.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

"""
DEPLOYMENT NOTE:
When deploying to a production server (like Render, AWS, or Heroku), ensure you set
the following Environment Variables in your hosting dashboard:
1. FLASK_SECRET_KEY & JWT_SECRET_KEY (Generate strong random keys)
2. MONGO_URI (Your production MongoDB Atlas string)
3. FRONTEND_URL (The actual URL of your deployed site, e.g., https://your-site.com)
"""

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

    # Frontend URL (for CORS and email links)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')

    # Upload limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

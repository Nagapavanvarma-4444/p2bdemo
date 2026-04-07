"""
General utility functions for PLAN 2 BUILD.
"""

import re
from bson import ObjectId
from datetime import datetime


def validate_email(email):
    """Validate email format using regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Validate password strength.
    Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 digit.
    """
    if len(password) < 8:
        return False, 'Password must be at least 8 characters'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one digit'
    return True, 'Password is valid'


def serialize_doc(doc):
    """
    Convert a MongoDB document to JSON-serializable format.
    Converts ObjectId to string and datetime to ISO format.
    """
    if doc is None:
        return None
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, list):
            serialized[key] = [
                serialize_doc(item) if isinstance(item, dict)
                else str(item) if isinstance(item, ObjectId)
                else item.isoformat() if isinstance(item, datetime)
                else item
                for item in value
            ]
        elif isinstance(value, dict):
            serialized[key] = serialize_doc(value)
        else:
            serialized[key] = value
    
    # Rename _id to id for frontend convenience
    if '_id' in serialized:
        serialized['id'] = serialized.pop('_id')
    
    return serialized


def paginate_query(query_params):
    """
    Extract pagination parameters from request query string.
    
    Returns:
        tuple: (page, per_page, skip)
    """
    page = int(query_params.get('page', 1))
    per_page = int(query_params.get('per_page', 12))
    per_page = min(per_page, 50)  # Max 50 per page
    skip = (page - 1) * per_page
    return page, per_page, skip


def generate_token():
    """Generate a random token for email verification or password reset."""
    import secrets
    return secrets.token_urlsafe(32)


def generate_otp():
    """Generate a 6-digit numeric OTP string."""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

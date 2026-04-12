"""
User model for PLAN 2 BUILD.
Handles Customer, Engineer, and Admin user schemas.
"""

from datetime import datetime


def create_user_document(data, role='customer'):
    """
    Create a user document for MongoDB insertion.
    
    Args:
        data: Dictionary with user registration data
        role: 'customer', 'engineer', or 'admin'
    
    Returns:
        dict: MongoDB-ready user document
    """
    user = {
        'name': data.get('name', ''),
        'email': data.get('email', '').lower().strip(),
        'password_hash': data.get('password_hash', ''),
        'role': role,
        'phone': data.get('phone', ''),
        'location': data.get('location', ''),
        'avatar': data.get('avatar', ''),
        'is_verified': True,          # Registration is direct
        'is_active': True,            # Account active status
        'verification_token': '',     # Email verification token
        'reset_token': '',            # Password reset token
        'reset_token_expiry': None,   # Reset token expiration
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    # Add engineer-specific fields
    if role == 'engineer':
        user.update({
            'category': data.get('category', ''),  # Civil, Electrical, Architect, etc.
            'bio': '',
            'experience_years': 0,
            'education': [],          # [{degree, institution, year}]
            'skills': [],             # [skill1, skill2, ...]
            'certifications': [],     # [{name, file_url, verified}]
            'portfolio': [],          # [{title, image_url, description}]
            'pricing': {
                'hourly_rate': 0,
                'project_min': 0,
                'project_max': 0
            },
            'subscription': {
                'plan': 'none',       # none, basic, professional, premium
                'status': 'inactive', # active, inactive, expired
                'start_date': None,
                'end_date': None,
                'razorpay_subscription_id': '',
                'auto_renew': False
            },
            'is_approved': False,     # Admin approval status
            'is_featured': False,     # Featured engineer flag
            'avg_rating': 0.0,
            'total_reviews': 0,
            'badges': [],             # ['verified', 'top_rated', 'premium']
            'completed_projects': 0,
            'profile_completion': 0   # Percentage 0-100
        })

    return user


def calculate_profile_completion(engineer):
    """
    Calculate profile completion percentage for an engineer.
    
    Args:
        engineer: Engineer user document
    
    Returns:
        int: Completion percentage (0-100)
    """
    fields_to_check = [
        ('name', 10),
        ('bio', 15),
        ('category', 10),
        ('experience_years', 10),
        ('education', 10),
        ('skills', 10),
        ('certifications', 15),
        ('portfolio', 10),
        ('avatar', 5),
        ('phone', 5)
    ]
    
    total = 0
    for field, weight in fields_to_check:
        value = engineer.get(field)
        if value:
            if isinstance(value, list) and len(value) > 0:
                total += weight
            elif isinstance(value, str) and len(value) > 0:
                total += weight
            elif isinstance(value, (int, float)) and value > 0:
                total += weight
    
    return min(total, 100)


# Engineer categories
ENGINEER_CATEGORIES = [
    'Civil Engineer',
    'Electrical Engineer',
    'Architect',
    'Interior Designer',
    'Exterior Designer',
    'Contractor'
]

# Allowed file types for certifications
ALLOWED_CERT_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

# Allowed file types for portfolio images
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

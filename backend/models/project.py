"""
Project model for PLAN 2 BUILD.
Handles customer building project posts.
"""

from datetime import datetime


def create_project_document(data, customer_id):
    """
    Create a project document for MongoDB insertion.
    
    Args:
        data: Dictionary with project details
        customer_id: ObjectId of the customer posting the project
    
    Returns:
        dict: MongoDB-ready project document
    """
    return {
        'customer_id': customer_id,
        'title': data.get('title', ''),
        'description': data.get('description', ''),
        'category': data.get('category', ''),         # Service category needed
        'budget_min': float(data.get('budget_min', 0)),
        'budget_max': float(data.get('budget_max', 0)),
        'location': data.get('location', ''),
        'timeline': data.get('timeline', ''),          # Expected completion timeline
        'plan_files': data.get('plan_files', []),       # [{filename, file_url}]
        'status': 'open',                               # open, in_progress, completed, cancelled
        'proposals_count': 0,
        'hired_engineer_id': None,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }


# Project status options
PROJECT_STATUSES = ['open', 'in_progress', 'completed', 'cancelled']

# Service categories (matches engineer categories)
SERVICE_CATEGORIES = [
    'Civil Engineering',
    'Electrical Engineering',
    'Architecture',
    'Interior Design',
    'Exterior Design',
    'General Contracting',
    'Full Construction'
]

"""
Review model for PLAN 2 BUILD.
Handles customer ratings and reviews of engineers.
"""

from datetime import datetime


def create_review_document(data, customer_id, engineer_id):
    """
    Create a review document for MongoDB insertion.
    
    Args:
        data: Dictionary with review details
        customer_id: ObjectId of the reviewing customer
        engineer_id: ObjectId of the reviewed engineer
    
    Returns:
        dict: MongoDB-ready review document
    """
    return {
        'customer_id': customer_id,
        'engineer_id': engineer_id,
        'project_id': data.get('project_id'),
        'rating': int(data.get('rating', 5)),       # 1-5 stars
        'comment': data.get('comment', ''),
        'created_at': datetime.utcnow()
    }

"""
Bookmark model for PLAN 2 BUILD.
Handles customer bookmarking of engineers.
"""

from datetime import datetime


def create_bookmark_document(customer_id, engineer_id):
    """
    Create a bookmark document for MongoDB insertion.
    
    Args:
        customer_id: ObjectId of the customer
        engineer_id: ObjectId of the bookmarked engineer
    
    Returns:
        dict: MongoDB-ready bookmark document
    """
    return {
        'customer_id': customer_id,
        'engineer_id': engineer_id,
        'created_at': datetime.utcnow()
    }

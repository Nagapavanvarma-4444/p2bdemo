"""
Notification model for PLAN 2 BUILD.
Handles in-app notifications for all user types.
"""

from datetime import datetime


def create_notification_document(user_id, notif_type, message, link=''):
    """
    Create a notification document for MongoDB insertion.
    
    Args:
        user_id: ObjectId of the recipient user
        notif_type: Notification type (proposal, message, review, subscription, admin)
        message: Notification text
        link: Optional link for the notification action
    
    Returns:
        dict: MongoDB-ready notification document
    """
    return {
        'user_id': user_id,
        'type': notif_type,
        'message': message,
        'link': link,
        'read': False,
        'created_at': datetime.utcnow()
    }


# Notification types
NOTIFICATION_TYPES = [
    'proposal_received',
    'proposal_accepted',
    'proposal_rejected',
    'new_message',
    'new_review',
    'subscription_activated',
    'subscription_expiring',
    'profile_approved',
    'profile_rejected',
    'project_update',
    'system'
]

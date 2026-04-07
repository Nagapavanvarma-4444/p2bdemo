"""
Message model for PLAN 2 BUILD.
Handles real-time chat messages between users.
"""

from datetime import datetime


def create_message_document(sender_id, receiver_id, content, conversation_id=None):
    """
    Create a message document for MongoDB insertion.
    
    Args:
        sender_id: ObjectId of the message sender
        receiver_id: ObjectId of the message receiver
        content: Message text content
        conversation_id: Optional conversation thread ID
    
    Returns:
        dict: MongoDB-ready message document
    """
    return {
        'sender_id': sender_id,
        'receiver_id': receiver_id,
        'conversation_id': conversation_id,  # Sorted pair of user IDs
        'content': content,
        'read': False,
        'created_at': datetime.utcnow()
    }


def generate_conversation_id(user_id_1, user_id_2):
    """
    Generate a consistent conversation ID from two user IDs.
    Always produces the same ID regardless of parameter order.
    
    Args:
        user_id_1: First user's ID string
        user_id_2: Second user's ID string
    
    Returns:
        str: Conversation ID string
    """
    ids = sorted([str(user_id_1), str(user_id_2)])
    return f"{ids[0]}_{ids[1]}"

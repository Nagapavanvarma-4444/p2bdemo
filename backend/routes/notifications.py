"""
Notification routes for PLAN 2 BUILD.
Handles in-app notification management.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from middleware.auth_middleware import token_required
from utils.helpers import serialize_doc, paginate_query

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user_id):
    """Get notifications for the current user."""
    from app import mongo
    
    page, per_page, skip = paginate_query(request.args)
    
    query = {'user_id': ObjectId(current_user_id)}
    total = mongo.db.notifications.count_documents(query)
    notifications = mongo.db.notifications.find(query).sort('created_at', -1).skip(skip).limit(per_page)
    
    notif_list = [serialize_doc(n) for n in notifications]
    unread_count = mongo.db.notifications.count_documents({**query, 'read': False})
    
    return jsonify({
        'notifications': notif_list,
        'total': total,
        'unread_count': unread_count,
        'page': page,
        'per_page': per_page
    }), 200


@notifications_bp.route('/<notif_id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user_id, notif_id):
    """Mark a notification as read."""
    from app import mongo
    
    try:
        mongo.db.notifications.update_one(
            {'_id': ObjectId(notif_id), 'user_id': ObjectId(current_user_id)},
            {'$set': {'read': True}}
        )
    except:
        return jsonify({'error': 'Invalid notification ID'}), 400
    
    return jsonify({'message': 'Notification marked as read'}), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_read(current_user_id):
    """Mark all notifications as read."""
    from app import mongo
    
    mongo.db.notifications.update_many(
        {'user_id': ObjectId(current_user_id), 'read': False},
        {'$set': {'read': True}}
    )
    
    return jsonify({'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user_id):
    """Get unread notification count."""
    from app import mongo
    
    count = mongo.db.notifications.count_documents({
        'user_id': ObjectId(current_user_id),
        'read': False
    })
    
    return jsonify({'unread_count': count}), 200

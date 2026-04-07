"""
Message routes for PLAN 2 BUILD.
Handles chat message storage and retrieval (REST API side).
Real-time delivery is handled by Socket.IO in app.py.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from middleware.auth_middleware import token_required
from models.message import create_message_document, generate_conversation_id
from utils.helpers import serialize_doc, paginate_query

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/<user_id>', methods=['GET'])
@token_required
def get_messages(current_user_id, user_id):
    """Get chat messages between current user and another user."""
    from app import mongo
    
    conversation_id = generate_conversation_id(current_user_id, user_id)
    
    page, per_page, skip = paginate_query(request.args)
    
    total = mongo.db.messages.count_documents({'conversation_id': conversation_id})
    messages = mongo.db.messages.find(
        {'conversation_id': conversation_id}
    ).sort('created_at', -1).skip(skip).limit(per_page)
    
    messages_list = [serialize_doc(msg) for msg in messages]
    messages_list.reverse()  # Oldest first for display
    
    # Mark messages as read
    mongo.db.messages.update_many(
        {
            'conversation_id': conversation_id,
            'receiver_id': ObjectId(current_user_id),
            'read': False
        },
        {'$set': {'read': True}}
    )
    
    return jsonify({
        'messages': messages_list,
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200


@messages_bp.route('', methods=['POST'])
@token_required
def send_message(current_user_id):
    """Send a message to another user (fallback REST endpoint)."""
    from app import mongo
    
    data = request.get_json()
    receiver_id = data.get('receiver_id')
    content = data.get('content', '').strip()
    
    if not receiver_id or not content:
        return jsonify({'error': 'receiver_id and content are required'}), 400
    
    # Verify receiver exists
    receiver = mongo.db.users.find_one({'_id': ObjectId(receiver_id)})
    if not receiver:
        return jsonify({'error': 'Recipient not found'}), 404
    
    conversation_id = generate_conversation_id(current_user_id, receiver_id)
    
    message_doc = create_message_document(
        ObjectId(current_user_id),
        ObjectId(receiver_id),
        content,
        conversation_id
    )
    
    result = mongo.db.messages.insert_one(message_doc)
    message_doc['_id'] = result.inserted_id
    
    return jsonify({
        'message': 'Message sent',
        'data': serialize_doc(message_doc)
    }), 201


@messages_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user_id):
    """Get all conversations for the current user with latest message."""
    from app import mongo
    
    # Find all messages involving current user
    pipeline = [
        {
            '$match': {
                '$or': [
                    {'sender_id': ObjectId(current_user_id)},
                    {'receiver_id': ObjectId(current_user_id)}
                ]
            }
        },
        {
            '$sort': {'created_at': -1}
        },
        {
            '$group': {
                '_id': '$conversation_id',
                'last_message': {'$first': '$content'},
                'last_message_time': {'$first': '$created_at'},
                'sender_id': {'$first': '$sender_id'},
                'receiver_id': {'$first': '$receiver_id'},
                'unread_count': {
                    '$sum': {
                        '$cond': [
                            {'$and': [
                                {'$eq': ['$receiver_id', ObjectId(current_user_id)]},
                                {'$eq': ['$read', False]}
                            ]},
                            1, 0
                        ]
                    }
                }
            }
        },
        {
            '$sort': {'last_message_time': -1}
        }
    ]
    
    conversations = list(mongo.db.messages.aggregate(pipeline))
    
    result = []
    for conv in conversations:
        # Determine the other user
        other_user_id = conv['receiver_id'] if str(conv['sender_id']) == current_user_id else conv['sender_id']
        other_user = mongo.db.users.find_one(
            {'_id': other_user_id},
            {'name': 1, 'avatar': 1, 'role': 1, 'category': 1}
        )
        
        result.append({
            'conversation_id': conv['_id'],
            'other_user': serialize_doc(other_user) if other_user else None,
            'last_message': conv['last_message'],
            'last_message_time': conv['last_message_time'].isoformat(),
            'unread_count': conv['unread_count']
        })
    
    return jsonify({'conversations': result}), 200


@messages_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user_id):
    """Get total unread message count."""
    from app import mongo
    
    count = mongo.db.messages.count_documents({
        'receiver_id': ObjectId(current_user_id),
        'read': False
    })
    
    return jsonify({'unread_count': count}), 200

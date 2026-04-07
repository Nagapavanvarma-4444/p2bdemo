"""
Bookmark routes for PLAN 2 BUILD.
Handles bookmarking/unbookmarking engineers.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId

from middleware.auth_middleware import token_required, role_required
from models.bookmark import create_bookmark_document
from utils.helpers import serialize_doc, paginate_query

bookmarks_bp = Blueprint('bookmarks', __name__)


@bookmarks_bp.route('', methods=['POST'])
@token_required
@role_required('customer')
def toggle_bookmark(current_user_id):
    """Bookmark or unbookmark an engineer."""
    from app import mongo
    
    data = request.get_json()
    engineer_id = data.get('engineer_id')
    
    if not engineer_id:
        return jsonify({'error': 'engineer_id is required'}), 400
    
    # Check if already bookmarked
    existing = mongo.db.bookmarks.find_one({
        'customer_id': ObjectId(current_user_id),
        'engineer_id': ObjectId(engineer_id)
    })
    
    if existing:
        # Remove bookmark
        mongo.db.bookmarks.delete_one({'_id': existing['_id']})
        return jsonify({'message': 'Bookmark removed', 'bookmarked': False}), 200
    else:
        # Add bookmark
        bookmark_doc = create_bookmark_document(ObjectId(current_user_id), ObjectId(engineer_id))
        mongo.db.bookmarks.insert_one(bookmark_doc)
        return jsonify({'message': 'Engineer bookmarked', 'bookmarked': True}), 201


@bookmarks_bp.route('', methods=['GET'])
@token_required
@role_required('customer')
def get_bookmarks(current_user_id):
    """Get all bookmarked engineers for the current customer."""
    from app import mongo
    
    page, per_page, skip = paginate_query(request.args)
    
    query = {'customer_id': ObjectId(current_user_id)}
    total = mongo.db.bookmarks.count_documents(query)
    bookmarks = mongo.db.bookmarks.find(query).sort('created_at', -1).skip(skip).limit(per_page)
    
    engineers_list = []
    for bookmark in bookmarks:
        engineer = mongo.db.users.find_one(
            {'_id': bookmark['engineer_id']},
            {'password_hash': 0, 'verification_token': 0, 'reset_token': 0}
        )
        if engineer:
            eng_data = serialize_doc(engineer)
            eng_data['bookmarked_at'] = bookmark['created_at'].isoformat()
            engineers_list.append(eng_data)
    
    return jsonify({
        'bookmarks': engineers_list,
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200


@bookmarks_bp.route('/check/<engineer_id>', methods=['GET'])
@token_required
def check_bookmark(current_user_id, engineer_id):
    """Check if an engineer is bookmarked."""
    from app import mongo
    
    existing = mongo.db.bookmarks.find_one({
        'customer_id': ObjectId(current_user_id),
        'engineer_id': ObjectId(engineer_id)
    })
    
    return jsonify({'bookmarked': existing is not None}), 200

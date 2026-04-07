"""
Review routes for PLAN 2 BUILD.
Handles customer ratings and reviews of engineers.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from middleware.auth_middleware import token_required, role_required
from models.review import create_review_document
from models.notification import create_notification_document
from utils.helpers import serialize_doc, paginate_query

reviews_bp = Blueprint('reviews', __name__)


@reviews_bp.route('', methods=['POST'])
@token_required
@role_required('customer')
def create_review(current_user_id):
    """Submit a review for an engineer."""
    from app import mongo
    
    data = request.get_json()
    engineer_id = data.get('engineer_id')
    rating = data.get('rating')
    
    if not engineer_id or not rating:
        return jsonify({'error': 'engineer_id and rating are required'}), 400
    
    if not (1 <= int(rating) <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    # Verify engineer exists
    engineer = mongo.db.users.find_one({'_id': ObjectId(engineer_id), 'role': 'engineer'})
    if not engineer:
        return jsonify({'error': 'Engineer not found'}), 404
    
    # Check if customer already reviewed this engineer
    existing = mongo.db.reviews.find_one({
        'customer_id': ObjectId(current_user_id),
        'engineer_id': ObjectId(engineer_id)
    })
    if existing:
        return jsonify({'error': 'You have already reviewed this engineer'}), 409
    
    # Create review
    review_doc = create_review_document(data, ObjectId(current_user_id), ObjectId(engineer_id))
    result = mongo.db.reviews.insert_one(review_doc)
    
    # Recalculate average rating
    pipeline = [
        {'$match': {'engineer_id': ObjectId(engineer_id)}},
        {'$group': {'_id': None, 'avg': {'$avg': '$rating'}, 'count': {'$sum': 1}}}
    ]
    stats = list(mongo.db.reviews.aggregate(pipeline))
    if stats:
        avg_rating = round(stats[0]['avg'], 1)
        total_reviews = stats[0]['count']
        
        # Update engineer stats
        update_data = {
            'avg_rating': avg_rating,
            'total_reviews': total_reviews
        }
        
        # Award badges based on rating
        badges = engineer.get('badges', [])
        if avg_rating >= 4.5 and total_reviews >= 5 and 'top_rated' not in badges:
            badges.append('top_rated')
            update_data['badges'] = badges
        
        mongo.db.users.update_one(
            {'_id': ObjectId(engineer_id)},
            {'$set': update_data}
        )
    
    # Notify engineer
    customer = mongo.db.users.find_one({'_id': ObjectId(current_user_id)}, {'name': 1})
    notification = create_notification_document(
        ObjectId(engineer_id),
        'new_review',
        f'{customer["name"]} left a {rating}-star review',
        f'/engineer/{engineer_id}'
    )
    mongo.db.notifications.insert_one(notification)
    
    review_doc['_id'] = result.inserted_id
    
    return jsonify({
        'message': 'Review submitted successfully',
        'review': serialize_doc(review_doc)
    }), 201


@reviews_bp.route('/engineer/<engineer_id>', methods=['GET'])
def get_engineer_reviews(engineer_id):
    """Get all reviews for an engineer."""
    from app import mongo
    
    page, per_page, skip = paginate_query(request.args)
    
    try:
        query = {'engineer_id': ObjectId(engineer_id)}
    except:
        return jsonify({'error': 'Invalid engineer ID'}), 400
    
    total = mongo.db.reviews.count_documents(query)
    reviews = mongo.db.reviews.find(query).sort('created_at', -1).skip(skip).limit(per_page)
    
    reviews_list = []
    for review in reviews:
        review_data = serialize_doc(review)
        reviewer = mongo.db.users.find_one({'_id': review['customer_id']}, {'name': 1, 'avatar': 1})
        if reviewer:
            review_data['reviewer_name'] = reviewer['name']
            review_data['reviewer_avatar'] = reviewer.get('avatar', '')
        reviews_list.append(review_data)
    
    return jsonify({
        'reviews': reviews_list,
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200

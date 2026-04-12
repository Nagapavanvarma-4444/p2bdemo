"""
Engineer routes for PLAN 2 BUILD.
Handles engineer profile CRUD, listing, and search.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from middleware.auth_middleware import token_required, role_required
from models.user import calculate_profile_completion, ENGINEER_CATEGORIES
from utils.helpers import serialize_doc, paginate_query

engineers_bp = Blueprint('engineers', __name__)


@engineers_bp.route('', methods=['GET'])
def list_engineers():
    """
    List engineers with filtering, search, and pagination.
    Query params: category, location, rating, experience, search, plan, page, per_page, sort
    """
    from app import mongo
    
    # Build filter query
    query = {
        'role': 'engineer',
        'is_approved': True,
        'is_active': True
        # 'subscription.status': 'active' - Removed for demo mode
    }
    
    # Category filter
    category = request.args.get('category')
    if category and category in ENGINEER_CATEGORIES:
        query['category'] = category
    
    # Location filter (case-insensitive partial match)
    location = request.args.get('location')
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}
    
    # Minimum rating filter
    min_rating = request.args.get('rating')
    if min_rating:
        query['avg_rating'] = {'$gte': float(min_rating)}
    
    # Minimum experience filter
    min_experience = request.args.get('experience')
    if min_experience:
        query['experience_years'] = {'$gte': int(min_experience)}
    
    # Subscription tier filter
    plan = request.args.get('plan')
    if plan in ['basic', 'professional', 'premium']:
        query['subscription.plan'] = plan
    
    # Keyword search (name, bio, skills)
    search = request.args.get('search')
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'bio': {'$regex': search, '$options': 'i'}},
            {'skills': {'$regex': search, '$options': 'i'}}
        ]
    
    # Sorting
    sort_by = request.args.get('sort', 'rating')
    sort_options = {
        'rating': [('avg_rating', -1)],
        'experience': [('experience_years', -1)],
        'newest': [('created_at', -1)],
        'name': [('name', 1)]
    }
    sort = sort_options.get(sort_by, [('avg_rating', -1)])
    
    # Featured engineers come first
    sort.insert(0, ('is_featured', -1))
    
    # Pagination
    page, per_page, skip = paginate_query(request.args)
    
    # Execute query
    total = mongo.db.users.count_documents(query)
    engineers = mongo.db.users.find(
        query,
        {'password_hash': 0, 'verification_token': 0, 'reset_token': 0}  # Exclude sensitive fields
    ).sort(sort).skip(skip).limit(per_page)
    
    engineers_list = [serialize_doc(eng) for eng in engineers]
    
    return jsonify({
        'engineers': engineers_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    }), 200


@engineers_bp.route('/<engineer_id>', methods=['GET'])
def get_engineer(engineer_id):
    """Get a single engineer's public profile."""
    from app import mongo
    
    try:
        engineer = mongo.db.users.find_one(
            {'_id': ObjectId(engineer_id), 'role': 'engineer'},
            {'password_hash': 0, 'verification_token': 0, 'reset_token': 0}
        )
    except:
        return jsonify({'error': 'Invalid engineer ID'}), 400
    
    if not engineer:
        return jsonify({'error': 'Engineer not found'}), 404
    
    # Get reviews for this engineer
    reviews = list(mongo.db.reviews.find({'engineer_id': ObjectId(engineer_id)}).sort('created_at', -1).limit(10))
    reviews_list = []
    for review in reviews:
        # Get reviewer name
        reviewer = mongo.db.users.find_one({'_id': review['customer_id']}, {'name': 1, 'avatar': 1})
        review_data = serialize_doc(review)
        review_data['reviewer_name'] = reviewer['name'] if reviewer else 'Anonymous'
        review_data['reviewer_avatar'] = reviewer.get('avatar', '') if reviewer else ''
        reviews_list.append(review_data)
    
    engineer_data = serialize_doc(engineer)
    engineer_data['reviews'] = reviews_list
    
    return jsonify({'engineer': engineer_data}), 200


@engineers_bp.route('/profile', methods=['PUT'])
@token_required
@role_required('engineer')
def update_profile(current_user_id):
    """Update engineer profile information."""
    from app import mongo
    
    data = request.get_json()
    
    # Fields that can be updated
    allowed_fields = [
        'name', 'phone', 'location', 'bio', 'experience_years',
        'education', 'skills', 'pricing', 'category'
    ]
    
    update_data = {}
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
    
    if not update_data:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_data['updated_at'] = datetime.utcnow()
    
    # Update in database
    mongo.db.users.update_one(
        {'_id': ObjectId(current_user_id)},
        {'$set': update_data}
    )
    
    # Recalculate profile completion
    updated_user = mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    completion = calculate_profile_completion(updated_user)
    mongo.db.users.update_one(
        {'_id': ObjectId(current_user_id)},
        {'$set': {'profile_completion': completion}}
    )
    
    return jsonify({
        'message': 'Profile updated successfully',
        'profile_completion': completion
    }), 200


@engineers_bp.route('/avatar', methods=['POST'])
@token_required
def upload_avatar(current_user_id):
    """Avatar upload disabled in deep cleanup mode."""
    return jsonify({'error': 'Feature disabled in demo mode.'}), 501


@engineers_bp.route('/portfolio', methods=['POST'])
@token_required
@role_required('engineer')
def add_portfolio_item(current_user_id):
    """Portfolio item upload disabled in deep cleanup mode."""
    return jsonify({'error': 'Feature disabled in demo mode.'}), 501


@engineers_bp.route('/certifications', methods=['POST'])
@token_required
@role_required('engineer')
def add_certification(current_user_id):
    """Certification upload disabled in deep cleanup mode."""
    return jsonify({'error': 'Feature disabled in demo mode.'}), 501


@engineers_bp.route('/featured', methods=['GET'])
def get_featured_engineers():
    """Get featured engineers for homepage showcase."""
    from app import mongo
    
    featured = mongo.db.users.find(
        {
            'role': 'engineer',
            'is_approved': True,
            'is_active': True,
            'is_featured': True
            # 'subscription.status': 'active' - Removed for demo mode
        },
        {'password_hash': 0, 'verification_token': 0, 'reset_token': 0}
    ).sort('avg_rating', -1).limit(6)
    
    engineers_list = [serialize_doc(eng) for eng in featured]
    
    return jsonify({'engineers': engineers_list}), 200

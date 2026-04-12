"""
Admin routes for PLAN 2 BUILD.
Handles administrative functions: user management, approvals, analytics.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timedelta

from middleware.auth_middleware import token_required, role_required
from models.notification import create_notification_document
from utils.helpers import serialize_doc, paginate_query

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@role_required('admin')
def get_dashboard_stats(current_user_id):
    """Get platform analytics for admin dashboard."""
    from app import mongo
    
    # Total counts
    total_users = mongo.db.users.count_documents({})
    total_customers = mongo.db.users.count_documents({'role': 'customer'})
    total_engineers = mongo.db.users.count_documents({'role': 'engineer'})
    total_projects = mongo.db.projects.count_documents({})
    total_proposals = mongo.db.proposals.count_documents({})
    
    # Pending approvals
    pending_approvals = mongo.db.users.count_documents({
        'role': 'engineer',
        'is_approved': False
    })
    
    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_customers': total_customers,
            'total_engineers': total_engineers,
            'total_projects': total_projects,
            'total_proposals': total_proposals,
            'pending_approvals': pending_approvals,
            'active_subscriptions': 0,
            'total_revenue': 0,
            'recent_signups': total_users, # Placeholder
            'subscription_breakdown': {'basic': 0, 'professional': 0, 'premium': 0}
        }
    }), 200


@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required('admin')
def get_users(current_user_id):
    """Get all users with filters."""
    from app import mongo
    
    page, per_page, skip = paginate_query(request.args)
    
    query = {}
    
    # Role filter
    role = request.args.get('role')
    if role:
        query['role'] = role
    
    # Approval filter
    approved = request.args.get('approved')
    if approved is not None:
        query['is_approved'] = approved.lower() == 'true'
    
    # Search
    search = request.args.get('search')
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}}
        ]
    
    total = mongo.db.users.count_documents(query)
    users = mongo.db.users.find(
        query,
        {'password_hash': 0}
    ).sort('created_at', -1).skip(skip).limit(per_page)
    
    users_list = [serialize_doc(u) for u in users]
    
    return jsonify({
        'users': users_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    }), 200


@admin_bp.route('/engineers/<engineer_id>/approve', methods=['PUT'])
@token_required
@role_required('admin')
def approve_engineer(current_user_id, engineer_id):
    """Approve or reject an engineer registration."""
    from app import mongo
    
    data = request.get_json()
    approved = data.get('approved', True)
    rejection_reason = data.get('reason', '') # User call it reason or rejection_reason, I'll use reason as per common patterns or just check both.
    
    try:
        engineer = mongo.db.users.find_one({'_id': ObjectId(engineer_id), 'role': 'engineer'})
    except:
        return jsonify({'error': 'Invalid engineer ID'}), 400
    
    if not engineer:
        return jsonify({'error': 'Engineer not found'}), 404
    
    update_data = {
        'is_approved': approved,
        'is_verified': approved,
        'updated_at': datetime.utcnow()
    }
    
    if approved:
        # Add verified badge if not already there
        mongo.db.users.update_one(
            {'_id': ObjectId(engineer_id)},
            {
                '$set': update_data,
                '$addToSet': {'badges': 'verified'}
            }
        )
        msg = "Congratulations! Your profile has been verified by the admin. You now have the verified badge."
    else:
        # Remove verified badge if it exists
        update_data['rejection_reason'] = rejection_reason
        mongo.db.users.update_one(
            {'_id': ObjectId(engineer_id)},
            {
                '$set': update_data,
                '$pull': {'badges': 'verified'}
            }
        )
        msg = f"Your profile verification was rejected. Reason: {rejection_reason}" if rejection_reason else "Your profile verification was rejected by the admin."
    
    # Notify engineer
    status = 'approved' if approved else 'rejected'
    notification = create_notification_document(
        ObjectId(engineer_id),
        f'profile_{status}',
        msg,
        '/engineer-dashboard',
        f"Profile {status.title()}"
    )
    mongo.db.notifications.insert_one(notification)
    
    return jsonify({'message': f'Engineer {status} successfully'}), 200


@admin_bp.route('/engineers/<engineer_id>', methods=['GET'])
@token_required
@role_required('admin')
def get_engineer_details(current_user_id, engineer_id):
    """Get full details of an engineer for review."""
    from app import mongo
    
    try:
        engineer = mongo.db.users.find_one({'_id': ObjectId(engineer_id), 'role': 'engineer'})
    except:
        return jsonify({'error': 'Invalid engineer ID'}), 400
    
    if not engineer:
        return jsonify({'error': 'Engineer not found'}), 404
    
    return jsonify({'engineer': serialize_doc(engineer)}), 200


@admin_bp.route('/engineers/<engineer_id>/verify-badge', methods=['PUT'])
@token_required
@role_required('admin')
def toggle_verification_badge(current_user_id, engineer_id):
    """Toggle the verification badge (is_verified) for an engineer."""
    from app import mongo
    
    data = request.get_json()
    verified = data.get('verified', True)
    
    try:
        mongo.db.users.update_one(
            {'_id': ObjectId(engineer_id)},
            {'$set': {'is_verified': verified, 'updated_at': datetime.utcnow()}}
        )
        
        # Notify engineer
        if verified:
            notification = create_notification_document(
                ObjectId(engineer_id),
                'badge_awarded',
                'Congratulations! You have been awarded the Verified Badge.',
                '/engineer-dashboard'
            )
            mongo.db.notifications.insert_one(notification)
            
    except:
        return jsonify({'error': 'Update failed'}), 400
    
    return jsonify({'message': f'Engineer {"verified" if verified else "unverified"}'}), 200


@admin_bp.route('/engineers/<engineer_id>/verify-cert', methods=['PUT'])
@token_required
@role_required('admin')
def verify_certification(current_user_id, engineer_id):
    """Verify an engineer's certification."""
    from app import mongo
    
    data = request.get_json()
    cert_index = data.get('cert_index', 0)
    verified = data.get('verified', True)
    
    try:
        mongo.db.users.update_one(
            {'_id': ObjectId(engineer_id)},
            {'$set': {f'certifications.{cert_index}.verified': verified}}
        )
    except:
        return jsonify({'error': 'Update failed'}), 400
    
    return jsonify({'message': f'Certification {"verified" if verified else "rejected"}'}), 200


@admin_bp.route('/engineers/<engineer_id>/feature', methods=['PUT'])
@token_required
@role_required('admin')
def toggle_featured(current_user_id, engineer_id):
    """Toggle featured status of an engineer."""
    from app import mongo
    
    try:
        engineer = mongo.db.users.find_one({'_id': ObjectId(engineer_id)})
    except:
        return jsonify({'error': 'Invalid engineer ID'}), 400
    
    if not engineer:
        return jsonify({'error': 'Engineer not found'}), 404
    
    new_status = not engineer.get('is_featured', False)
    mongo.db.users.update_one(
        {'_id': ObjectId(engineer_id)},
        {'$set': {'is_featured': new_status}}
    )
    
    return jsonify({'message': f'Featured status: {new_status}', 'is_featured': new_status}), 200


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_user(current_user_id, user_id):
    """Deactivate a user account (soft delete)."""
    from app import mongo
    
    if current_user_id == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    try:
        mongo.db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}}
        )
    except:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    return jsonify({'message': 'User account deactivated'}), 200


@admin_bp.route('/categories', methods=['GET'])
@token_required
@role_required('admin')
def get_categories(current_user_id):
    """Get engineer categories with counts."""
    from app import mongo
    
    pipeline = [
        {'$match': {'role': 'engineer'}},
        {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    
    categories = list(mongo.db.users.aggregate(pipeline))
    
    return jsonify({
        'categories': [{'name': c['_id'], 'count': c['count']} for c in categories if c['_id']]
    }), 200


@admin_bp.route('/settings', methods=['GET'])
@token_required
@role_required('admin')
def get_settings(current_user_id):
    """Get system settings (maintenance mode, etc)."""
    from app import mongo
    settings = list(mongo.db.system_settings.find({}))
    return jsonify({'settings': {s['key']: s['value'] for s in settings}}), 200


@admin_bp.route('/settings', methods=['PUT'])
@token_required
@role_required('admin')
def update_settings(current_user_id):
    """Update system settings."""
    from app import mongo
    data = request.get_json()
    
    if 'maintenance_mode' in data:
        mongo.db.system_settings.update_one(
            {'key': 'maintenance_mode'},
            {'$set': {'value': data['maintenance_mode'], 'updated_at': datetime.utcnow()}},
            upsert=True
        )
    
    return jsonify({'message': 'Settings updated successfully'}), 200

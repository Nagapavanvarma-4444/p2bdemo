"""
Authentication routes for PLAN 2 BUILD.
Handles registration, login, email verification, password reset.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity
from bson import ObjectId
import bcrypt
from datetime import datetime, timedelta

from models.user import create_user_document, ENGINEER_CATEGORIES
from utils.helpers import validate_email, validate_password, serialize_doc, generate_token, generate_otp
from middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (customer or engineer)."""
    from app import mongo
    
    # Check if request is multipart (FormData) or JSON
    if request.mimetype == 'multipart/form-data':
        data = request.form.to_dict()
        files = request.files.getlist('certificates')
    else:
        data = request.get_json()
        files = []
    
    # Validate required fields
    required = ['name', 'email', 'password', 'role']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    is_valid, msg = validate_password(data['password'])
    if not is_valid:
        return jsonify({'error': msg}), 400
    
    # Validate role
    if data['role'] not in ['customer', 'engineer']:
        return jsonify({'error': 'Role must be customer or engineer'}), 400
    
    # Validate engineer category
    if data['role'] == 'engineer':
        if not data.get('category'):
            return jsonify({'error': 'Category is required for engineers'}), 400
        if data.get('category') not in ENGINEER_CATEGORIES:
            return jsonify({'error': f'Invalid category. Must be one of: {", ".join(ENGINEER_CATEGORIES)}'}), 400
    
    # Check if email already exists
    existing_user = mongo.db.users.find_one({'email': data['email'].lower().strip()})
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Hash password
    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    data['password_hash'] = password_hash
    
    # Certificate uploads disabled for deep cleanup (demo mode)
    certifications = []

    # Create user document
    user_doc = create_user_document(data, role=data['role'])
    user_doc['is_verified'] = False # Engineers start unverified (awaiting admin verification badge)
    user_doc['is_approved'] = False # Engineers start unapproved (awaiting admin approval)
    
    if data['role'] == 'customer':
        user_doc['is_verified'] = True
        user_doc['is_approved'] = True
    else:
        user_doc['certifications'] = certifications
    
    # Insert into database
    result = mongo.db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create JWT token
    access_token = create_access_token(
        identity=user_id,
        additional_claims={'role': data['role'], 'name': data['name']}
    )
    
    # Serialize user for response
    user_doc['_id'] = result.inserted_id
    user_data = serialize_doc(user_doc)
    user_data.pop('password_hash', None)
    
    return jsonify({
        'message': 'Registration successful!',
        'token': access_token,
        'user': user_data
    }), 201




@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password."""
    from app import mongo
    
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user
    user = mongo.db.users.find_one({'email': data['email'].lower().strip()})
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # MAINTENANCE MODE CHECK: Prevent non-admins from logging in
    try:
        settings = mongo.db.system_settings.find_one({'key': 'maintenance_mode'})
        if settings and settings.get('value') is True and user.get('role') != 'admin':
            return jsonify({
                'error': 'Under Construction',
                'message': 'PLAN 2 BUILD is currently undergoing scheduled maintenance to bring you new features and a better experience. We\'ll be back online shortly. Only administrators can access the system at this time.'
            }), 503
    except:
        pass # Allow login if settings check fails

    # Verify password
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Check if account is active
    if not user.get('is_active', True):
        return jsonify({'error': 'Account has been deactivated. Contact support.'}), 403
    
    # Create JWT token
    access_token = create_access_token(
        identity=str(user['_id']),
        additional_claims={'role': user['role'], 'name': user['name']}
    )
    
    # Serialize user for response (exclude sensitive fields)
    user_data = serialize_doc(user)
    user_data.pop('password_hash', None)
    user_data.pop('verification_token', None)
    user_data.pop('reset_token', None)
    
    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user_data
    }), 200


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify user email with token."""
    from app import mongo
    
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Verification token is required'}), 400
    
    # Find user with this token
    user = mongo.db.users.find_one({'verification_token': token})
    if not user:
        return jsonify({'error': 'Invalid or expired verification token'}), 400
    
    # Update user verification status
    mongo.db.users.update_one(
        {'_id': user['_id']},
        {'$set': {'is_verified': True, 'verification_token': '', 'updated_at': datetime.utcnow()}}
    )
    
    return jsonify({'message': 'Email verified successfully'}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Simulate password reset email for demo."""
    from app import mongo
    
    data = request.get_json()
    email = data.get('email', '').lower().strip()
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    user = mongo.db.users.find_one({'email': email})
    if not user:
        # Don't reveal if email exists (security)
        return jsonify({'message': 'If the email exists, a reset link will be sent'}), 200
    
    # Generate reset token
    reset_token = generate_token()
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    mongo.db.users.update_one(
        {'_id': user['_id']},
        {'$set': {'reset_token': reset_token, 'reset_token_expiry': expiry}}
    )
    
    # Email sending disabled for deep cleanup (demo mode)
    print(f"[DEMO] Password reset link for {email}: {reset_token}")
    
    return jsonify({'message': 'If the email exists, a reset link will be sent'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token."""
    from app import mongo
    
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400
    
    # Validate new password
    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': msg}), 400
    
    # Find user with valid token
    user = mongo.db.users.find_one({
        'reset_token': token,
        'reset_token_expiry': {'$gt': datetime.utcnow()}
    })
    
    if not user:
        return jsonify({'error': 'Invalid or expired reset token'}), 400
    
    # Hash new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update password and clear token
    mongo.db.users.update_one(
        {'_id': user['_id']},
        {'$set': {
            'password_hash': password_hash,
            'reset_token': '',
            'reset_token_expiry': None,
            'updated_at': datetime.utcnow()
        }}
    )
    
    return jsonify({'message': 'Password reset successful'}), 200


@auth_bp.route('/users/<user_id>', methods=['GET'])
@token_required
def get_user_info(current_user_id, user_id):
    """Get public information of any user."""
    from app import mongo
    
    user = mongo.db.users.find_one(
        {'_id': ObjectId(user_id)},
        {'name': 1, 'avatar': 1, 'role': 1, 'category': 1}
    )
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    return jsonify({'user': serialize_doc(user)}), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user's profile."""
    from app import mongo
    from flask_jwt_extended import verify_jwt_in_request
    
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
    except:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = serialize_doc(user)
    user_data.pop('password_hash', None)
    user_data.pop('verification_token', None)
    user_data.pop('reset_token', None)
    
    return jsonify({'user': user_data}), 200


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update user profile information."""
    from app import mongo
    
    data = request.get_json()
    user = mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Fields that everyone can update
    allowed_fields = ['name', 'phone', 'location']
    
    # Fields that only engineers can update
    if user.get('role') == 'engineer':
        allowed_fields.extend(['bio', 'experience_years', 'skills', 'pricing', 'category'])
    
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
    
    # Recalculate profile completion if engineer
    if user.get('role') == 'engineer':
        from models.user import calculate_profile_completion
        updated_user = mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
        completion = calculate_profile_completion(updated_user)
        mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'profile_completion': completion}}
        )
    
    updated_user = mongo.db.users.find_one({'_id': ObjectId(current_user_id)})
    user_data = serialize_doc(updated_user)
    user_data.pop('password_hash', None)
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user_data
    }), 200


@auth_bp.route('/avatar', methods=['POST'])
@token_required
def upload_avatar(current_user_id):
    """Avatar upload disabled in deep cleanup mode."""
    return jsonify({'error': 'Avatar upload is currently disabled. Please use default profile icons.'}), 501

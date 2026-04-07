"""
Authentication middleware for PLAN 2 BUILD.
JWT verification and role-based access control.
"""

from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from bson import ObjectId


def token_required(f):
    """
    Decorator to require a valid JWT token for the route.
    Injects 'current_user_id' into the function arguments.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            return f(current_user_id=current_user_id, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Invalid or expired token', 'message': str(e)}), 401
    return decorated


def role_required(*roles):
    """
    Decorator to require specific roles for the route.
    Must be used AFTER @token_required.
    
    Usage:
        @token_required
        @role_required('admin', 'engineer')
        def my_route(current_user_id):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                claims = get_jwt()
                user_role = claims.get('role', '')
                if user_role not in roles:
                    return jsonify({
                        'error': 'Access denied',
                        'message': f'This action requires one of these roles: {", ".join(roles)}'
                    }), 403
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': 'Authorization error', 'message': str(e)}), 403
        return decorated
    return decorator


def engineer_required(f):
    """Shortcut decorator requiring engineer role."""
    @wraps(f)
    @role_required('engineer')
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Shortcut decorator requiring admin role."""
    @wraps(f)
    @role_required('admin')
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated


def customer_required(f):
    """Shortcut decorator requiring customer role."""
    @wraps(f)
    @role_required('customer')
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated

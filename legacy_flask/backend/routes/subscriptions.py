"""
Subscription routes for PLAN 2 BUILD (Demo Mode).
------------------------------------------------
This module has been simplified for demo purposes.
Razorpay integration has been removed.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

subscriptions_bp = Blueprint('subscriptions', __name__)

# Hardcoded plans for demo/display purposes
DEMO_PLANS = [
    {
        'id': 'basic',
        'name': 'Basic',
        'price': 999,
        'features': ['Profile visibility', '10 proposals/month', 'Basic badge']
    },
    {
        'id': 'professional',
        'name': 'Professional',
        'price': 2499,
        'features': ['Enhanced visibility', 'Unlimited proposals', 'Verified badge']
    },
    {
        'id': 'premium',
        'name': 'Premium',
        'price': 4999,
        'features': ['Top search placement', 'Feature on homepage', 'Dedicated support']
    }
]

@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all available subscription plans for demo display."""
    return jsonify({'plans': DEMO_PLANS}), 200

@subscriptions_bp.route('/status', methods=['GET'])
def get_subscription_status():
    """Returns a dummy 'Active' status for demo purposes."""
    # In a real app, we'd check the DB. For demo, everyone looks like a Pro.
    now = datetime.utcnow()
    expires = now + timedelta(days=365)
    
    return jsonify({
        'subscription': {
            'plan': 'professional',
            'status': 'active',
            'is_active': True,
            'start_date': now.isoformat(),
            'expires_at': expires.isoformat(),
            'message': 'Demo Subscription Active'
        }
    }), 200

@subscriptions_bp.route('/create-order', methods=['POST'])
def create_order():
    """Mock order creation for demo."""
    return jsonify({
        'order_id': 'demo_order_123',
        'amount': 2499,
        'currency': 'INR',
        'message': 'Demo order created successfully'
    }), 200

@subscriptions_bp.route('/verify', methods=['POST'])
def verify_payment():
    """Mock payment verification for demo."""
    return jsonify({
        'message': 'Payment verified successfully (Demo Mode)',
        'subscription': {
            'plan': 'professional',
            'status': 'active'
        }
    }), 200

"""
Subscription routes for PLAN 2 BUILD.
Handles plan info, Razorpay payment integration, and subscription management.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timedelta
import hmac
import hashlib

from middleware.auth_middleware import token_required, role_required
from models.subscription import SUBSCRIPTION_PLANS, create_payment_record
from models.notification import create_notification_document
from utils.helpers import serialize_doc

subscriptions_bp = Blueprint('subscriptions', __name__)


@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get all available subscription plans."""
    plans = []
    for key, plan in SUBSCRIPTION_PLANS.items():
        plans.append({
            'id': key,
            **plan
        })
    return jsonify({'plans': plans}), 200


@subscriptions_bp.route('/create-order', methods=['POST'])
@token_required
@role_required('engineer')
def create_order(current_user_id):
    """Create a Razorpay order for subscription payment."""
    from app import razorpay_client
    
    data = request.get_json()
    plan_key = data.get('plan')
    
    if plan_key not in SUBSCRIPTION_PLANS:
        return jsonify({'error': 'Invalid subscription plan'}), 400
    
    plan = SUBSCRIPTION_PLANS[plan_key]
    
    try:
        # Create Razorpay order
        order_data = {
            'amount': plan['price'] * 100,  # Amount in paise
            'currency': 'INR',
            'receipt': f'sub_{current_user_id}_{plan_key}',
            'notes': {
                'engineer_id': current_user_id,
                'plan': plan_key
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        return jsonify({
            'order_id': order['id'],
            'amount': plan['price'],
            'currency': 'INR',
            'plan': plan_key,
            'plan_name': plan['name']
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Could not create order: {str(e)}'}), 500


@subscriptions_bp.route('/verify', methods=['POST'])
@token_required
@role_required('engineer')
def verify_payment(current_user_id):
    """Verify Razorpay payment and activate subscription."""
    from app import mongo, razorpay_client
    from config import Config
    
    data = request.get_json()
    
    required = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'plan']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    plan_key = data['plan']
    if plan_key not in SUBSCRIPTION_PLANS:
        return jsonify({'error': 'Invalid plan'}), 400
    
    # Verify payment signature
    try:
        message = f"{data['razorpay_order_id']}|{data['razorpay_payment_id']}"
        generated_signature = hmac.new(
            Config.RAZORPAY_KEY_SECRET.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != data['razorpay_signature']:
            return jsonify({'error': 'Payment verification failed'}), 400
    except Exception as e:
        return jsonify({'error': f'Signature verification error: {str(e)}'}), 400
    
    # Activate subscription
    plan = SUBSCRIPTION_PLANS[plan_key]
    now = datetime.utcnow()
    end_date = now + timedelta(days=plan['duration_days'])
    
    mongo.db.users.update_one(
        {'_id': ObjectId(current_user_id)},
        {'$set': {
            'subscription.plan': plan_key,
            'subscription.status': 'active',
            'subscription.start_date': now,
            'subscription.end_date': end_date,
            'subscription.razorpay_subscription_id': data['razorpay_payment_id'],
            'subscription.auto_renew': data.get('auto_renew', False),
            'updated_at': now
        }}
    )
    
    # Add badge based on plan
    badges_update = []
    if plan_key == 'premium':
        badges_update = ['verified', 'premium']
    elif plan_key == 'professional':
        badges_update = ['verified']
    
    if badges_update:
        mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$addToSet': {'badges': {'$each': badges_update}}}
        )
    
    # Save payment record
    payment_record = create_payment_record(data, ObjectId(current_user_id), plan_key)
    mongo.db.payments.insert_one(payment_record)
    
    # If premium, mark as featured
    if plan_key == 'premium':
        mongo.db.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': {'is_featured': True}}
        )
    
    # Send notification
    notification = create_notification_document(
        ObjectId(current_user_id),
        'subscription_activated',
        f'Your {plan["name"]} subscription is now active!',
        '/engineer-dashboard'
    )
    mongo.db.notifications.insert_one(notification)
    
    return jsonify({
        'message': f'{plan["name"]} subscription activated successfully!',
        'subscription': {
            'plan': plan_key,
            'status': 'active',
            'start_date': now.isoformat(),
            'end_date': end_date.isoformat()
        }
    }), 200


@subscriptions_bp.route('/status', methods=['GET'])
@token_required
@role_required('engineer')
def get_subscription_status(current_user_id):
    """Get current subscription status for the engineer."""
    from app import mongo
    
    user = mongo.db.users.find_one(
        {'_id': ObjectId(current_user_id)},
        {'subscription': 1}
    )
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    subscription = user.get('subscription', {})
    
    # Check if subscription has expired
    if subscription.get('status') == 'active' and subscription.get('end_date'):
        if subscription['end_date'] < datetime.utcnow():
            mongo.db.users.update_one(
                {'_id': ObjectId(current_user_id)},
                {'$set': {'subscription.status': 'expired'}}
            )
            subscription['status'] = 'expired'
    
    return jsonify({'subscription': serialize_doc(subscription) if subscription else {}}), 200

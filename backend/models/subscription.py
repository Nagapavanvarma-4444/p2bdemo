"""
Subscription model for PLAN 2 BUILD.
Defines subscription plans and payment records.
"""

from datetime import datetime


# Subscription plan definitions
SUBSCRIPTION_PLANS = {
    'basic': {
        'name': 'Basic',
        'price': 999,              # INR per month
        'duration_days': 30,
        'features': [
            'Profile visibility in search',
            'Receive up to 10 proposals/month',
            'Basic badge',
            'Email support'
        ],
        'max_proposals': 10,
        'featured': False,
        'priority_support': False
    },
    'professional': {
        'name': 'Professional',
        'price': 2499,             # INR per month
        'duration_days': 30,
        'features': [
            'Enhanced profile visibility',
            'Unlimited proposals',
            'Professional badge',
            'Priority in search results',
            'Chat support',
            'Portfolio showcase'
        ],
        'max_proposals': -1,       # Unlimited
        'featured': False,
        'priority_support': True
    },
    'premium': {
        'name': 'Premium',
        'price': 4999,             # INR per month
        'duration_days': 30,
        'features': [
            'Top search placement',
            'Unlimited proposals',
            'Premium verified badge',
            'Featured on homepage',
            'Priority support',
            'Analytics dashboard',
            'Dedicated account manager',
            'Custom profile branding'
        ],
        'max_proposals': -1,       # Unlimited
        'featured': True,
        'priority_support': True
    }
}


def create_payment_record(data, engineer_id, plan_key):
    """
    Create a payment record document for MongoDB insertion.
    
    Args:
        data: Dictionary with Razorpay payment details
        engineer_id: ObjectId of the subscribing engineer
        plan_key: Subscription plan key (basic/professional/premium)
    
    Returns:
        dict: MongoDB-ready payment document
    """
    return {
        'engineer_id': engineer_id,
        'plan': plan_key,
        'amount': SUBSCRIPTION_PLANS[plan_key]['price'],
        'currency': 'INR',
        'razorpay_order_id': data.get('razorpay_order_id', ''),
        'razorpay_payment_id': data.get('razorpay_payment_id', ''),
        'razorpay_signature': data.get('razorpay_signature', ''),
        'status': 'completed',       # pending, completed, failed, refunded
        'created_at': datetime.utcnow()
    }

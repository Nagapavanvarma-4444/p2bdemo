"""
SMS service for PLAN 2 BUILD.
Handles sending OTP codes via Twilio.
"""

import os
from twilio.rest import Client

def send_otp_sms(to_phone, otp):
    """
    Send 6-digit OTP code to user's phone via SMS.
    
    Args:
        to_phone: Recipient phone number (E.164 format)
        otp: 6-digit OTP code
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_phone = os.getenv('TWILIO_PHONE_NUMBER')
        
        if not all([account_sid, auth_token, from_phone]) or 'placeholder' in [account_sid, auth_token, from_phone]:
            print(f"\n[DEBUG] Twilio not configured. Simulated SMS to {to_phone}:")
            print(f"[DEBUG] OTP: {otp}\n")
            return True
        
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"Your PLAN 2 BUILD verification code is: {otp}. It expires in 10 minutes.",
            from_=from_phone,
            to=to_phone
        )
        return True
    except Exception as e:
        print(f"SMS sending error: {e}")
        print(f"[DEBUG] Fallback OTP for {to_phone}: {otp}")
        return False

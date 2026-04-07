"""
Email service for PLAN 2 BUILD.
Handles sending verification and notification emails.
"""

from flask_mail import Message
from datetime import datetime
from config import Config


def send_verification_email(mail, to_email, token, base_url):
    """
    Send email verification link to user.
    
    Args:
        mail: Flask-Mail instance
        to_email: Recipient email address
        token: Verification token
        base_url: Frontend base URL
    """
    try:
        verification_link = f"{base_url}/verify-email.html?token={token}"
        msg = Message(
            subject='PLAN 2 BUILD - Verify Your Email',
            recipients=[to_email],
            html=f'''
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0a1628, #1e3a5f); padding: 30px; border-radius: 12px; text-align: center;">
                    <h1 style="color: #d4a843; margin: 0; font-size: 28px;">PLAN 2 BUILD</h1>
                    <p style="color: #ffffff; margin-top: 10px; font-size: 14px;">Professional Construction Marketplace</p>
                </div>
                <div style="padding: 30px; background: #ffffff; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #0a1628;">Verify Your Email Address</h2>
                    <p style="color: #555; line-height: 1.6;">
                        Thank you for registering with PLAN 2 BUILD. Please click the button below to verify your email address.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="background: linear-gradient(135deg, #d4a843, #b8922f); color: #0a1628; 
                                  padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px; display: inline-block;">
                            Verify Email
                        </a>
                    </div>
                    <p style="color: #999; font-size: 12px;">
                        If you didn't create an account, please ignore this email.
                    </p>
                </div>
            </div>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email sending error: {e}")
        return False


def send_password_reset_email(mail, to_email, token, base_url):
    """
    Send password reset link to user.
    
    Args:
        mail: Flask-Mail instance
        to_email: Recipient email address
        token: Reset token
        base_url: Frontend base URL
    """
    try:
        reset_link = f"{base_url}/reset-password.html?token={token}"
        msg = Message(
            subject='PLAN 2 BUILD - Reset Your Password',
            recipients=[to_email],
            html=f'''
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0a1628, #1e3a5f); padding: 30px; border-radius: 12px; text-align: center;">
                    <h1 style="color: #d4a843; margin: 0; font-size: 28px;">PLAN 2 BUILD</h1>
                </div>
                <div style="padding: 30px; background: #ffffff; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #0a1628;">Reset Your Password</h2>
                    <p style="color: #555; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background: linear-gradient(135deg, #d4a843, #b8922f); color: #0a1628; 
                                  padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #999; font-size: 12px;">
                        If you didn't request this, please ignore this email. This link expires in 1 hour.
                    </p>
                </div>
            </div>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email sending error: {e}")
        return False


def send_notification_email(mail, to_email, subject, message):
    """
    Send a generic notification email.
    
    Args:
        mail: Flask-Mail instance
        to_email: Recipient email address
        subject: Email subject
        message: Email body text
    """
    try:
        msg = Message(
            subject=f'PLAN 2 BUILD - {subject}',
            recipients=[to_email],
            html=f'''
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0a1628, #1e3a5f); padding: 30px; border-radius: 12px; text-align: center;">
                    <h1 style="color: #d4a843; margin: 0; font-size: 28px;">PLAN 2 BUILD</h1>
                </div>
                <div style="padding: 30px; background: #ffffff; border-radius: 0 0 12px 12px;">
                    <h2 style="color: #0a1628;">{subject}</h2>
                    <p style="color: #555; line-height: 1.6;">{message}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{Config.FRONTEND_URL}" 
                           style="background: linear-gradient(135deg, #d4a843, #b8922f); color: #0a1628; 
                                  padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                                  font-weight: 600; font-size: 16px; display: inline-block;">
                            Go to PLAN 2 BUILD
                        </a>
                    </div>
                </div>
            </div>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email sending error: {e}")
        return False


def send_otp_email(mail, to_email, otp):
    """
    Send 6-digit OTP code to user for email verification.
    
    Args:
        mail: Flask-Mail instance
        to_email: Recipient email address
        otp: 6-digit OTP code
    """
    try:
        msg = Message(
            subject='PLAN 2 BUILD - Your Verification Code',
            recipients=[to_email],
            html=f'''
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0a1628, #1e3a5f); padding: 30px; border-radius: 12px; text-align: center;">
                    <h1 style="color: #d4a843; margin: 0; font-size: 28px;">PLAN 2 BUILD</h1>
                </div>
                <div style="padding: 30px; background: #ffffff; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #eee; border-top: none;">
                    <h2 style="color: #0a1628; margin-bottom: 20px;">Verification Code</h2>
                    <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
                        Use the 6-digit code below to verify your email address and complete your registration.
                    </p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; display: inline-block; margin-bottom: 30px; border: 1px dashed #d4a843;">
                        <span style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #0a1628;">{otp}</span>
                    </div>
                    <p style="color: #999; font-size: 13px;">
                        This code will expire in 10 minutes. <br>
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    &copy; {datetime.utcnow().year} PLAN 2 BUILD. All rights reserved.
                </div>
            </div>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email sending error: {e}")
        return False

"""
PLAN 2 BUILD - Main Flask Application
======================================
Professional marketplace connecting customers with engineers
and construction professionals.

Entry point for the Flask backend with Socket.IO real-time messaging.
Serves both API routes and frontend static files.
"""

import eventlet
eventlet.monkey_patch()

import os
import sys
from datetime import datetime
from flask import Flask, send_from_directory, jsonify, request, url_for
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_socketio import disconnect as sio_disconnect
from flask_cors import CORS
try:
    from bson import ObjectId
except ImportError:
    from bson.objectid import ObjectId

from config import Config

# ===========================
# App Initialization
# ===========================
app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.config.from_object(Config)

# Extensions
CORS(app, resources={r"/api/*": {
    "origins": [Config.FRONTEND_URL, "http://localhost:5000", "http://localhost:3000", "*"],
    "allow_headers": ["Authorization", "Content-Type"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})
mongo = PyMongo(app)
jwt = JWTManager(app)

# JWT locations to support token in FormData if header is blocked
app.config["JWT_TOKEN_LOCATION"] = ["headers", "query_string", "json"]
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')


# ===========================
# Register Blueprints (API Routes)
# ===========================
from routes.auth import auth_bp
from routes.engineers import engineers_bp
from routes.projects import projects_bp
from routes.proposals import proposals_bp
from routes.messages import messages_bp
from routes.reviews import reviews_bp
from routes.subscriptions import subscriptions_bp
from routes.bookmarks import bookmarks_bp
from routes.notifications import notifications_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(engineers_bp, url_prefix='/api/engineers')
app.register_blueprint(projects_bp, url_prefix='/api/projects')
app.register_blueprint(proposals_bp, url_prefix='/api/proposals')
app.register_blueprint(messages_bp, url_prefix='/api/messages')
app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
app.register_blueprint(bookmarks_bp, url_prefix='/api/bookmarks')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(admin_bp, url_prefix='/api/admin')


# ===========================
# Frontend Static File Serving
# ===========================
@app.route('/')
def serve_index():
    """Serve the landing page."""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_frontend(path):
    """Serve frontend files (HTML, CSS, JS, images)."""
    file_path = os.path.join(app.static_folder, path)
    if os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    # If no file extension, try adding .html
    if '.' not in path:
        html_path = os.path.join(app.static_folder, f'{path}.html')
        if os.path.isfile(html_path):
            return send_from_directory(app.static_folder, f'{path}.html')
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/health')
@app.route('/healthz')
@app.route('/health')
def health_check_api():
    """API health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'PLAN 2 BUILD API',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@app.before_request
def check_maintenance_mode():
    """Check if maintenance mode is enabled and block access if necessary."""
    # Exclude admin routes, auth routes, and static assets
    if request.path.startswith('/api/admin') or \
       request.path.startswith('/api/auth') or \
       request.path.startswith('/js/') or \
       request.path.startswith('/css/') or \
       request.path.startswith('/img/') or \
       request.path == '/login.html' or \
       request.path == '/admin.html' or \
       request.path == '/admin' or \
       request.path == '/maintenance.html':
        return None

    try:
        settings = mongo.db.system_settings.find_one({'key': 'maintenance_mode'})
        if settings and settings.get('value') is True:
            # If it's an API call, return JSON
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Maintenance', 'message': 'Site is currently undergoing maintenance. Please try again later.'}), 503
            # If it's a page request, redirect to maintenance page
            if request.path.endswith('.html') or request.path == '/':
                return send_from_directory(app.static_folder, 'maintenance.html')
    except:
        pass # Database might be down, allow request but it will fail later
    return None


@app.route('/api/uploads/<path:filename>')
def serve_uploads(filename):
    """Serve uploaded files from the local uploads directory."""
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    return send_from_directory(uploads_dir, filename)


# ===========================


# Error handlers
# ===========================
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired', 'message': 'Please log in again'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token', 'message': str(error)}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Missing token', 'message': 'Authentication required'}), 401


# ===========================
# Socket.IO Event Handlers (Real-Time Chat)
# ===========================
# Track online users: {user_id: sid}
online_users = {}


@socketio.on('connect')
def handle_connect():
    """Handle new socket connection."""
    print(f"Client connected: {request.sid if hasattr(request, 'sid') else 'unknown'}")


@socketio.on('disconnect')
def handle_disconnect():
    """Handle socket disconnection."""
    # Remove from online users
    user_id = None
    for uid, sid in list(online_users.items()):
        if sid == request.sid:
            user_id = uid
            del online_users[uid]
            break
    if user_id:
        emit('user_offline', {'user_id': user_id}, broadcast=True)


@socketio.on('register_user')
def handle_register(data):
    """Register a user as online when they connect."""
    user_id = data.get('user_id')
    if user_id:
        online_users[user_id] = request.sid
        # Join personal room for direct messages
        join_room(f'user_{user_id}')
        emit('user_online', {'user_id': user_id}, broadcast=True)


@socketio.on('send_message')
def handle_message(data):
    """Handle real-time message sending."""
    from models.message import create_message_document, generate_conversation_id
    
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    content = data.get('content', '').strip()
    
    if not sender_id or not receiver_id or not content:
        return
    
    # Generate conversation ID
    conversation_id = generate_conversation_id(sender_id, receiver_id)
    
    # Save message to database
    message_doc = create_message_document(
        ObjectId(sender_id),
        ObjectId(receiver_id),
        content,
        conversation_id
    )
    result = mongo.db.messages.insert_one(message_doc)
    
    # Prepare message data for sending
    message_data = {
        'id': str(result.inserted_id),
        'sender_id': sender_id,
        'receiver_id': receiver_id,
        'content': content,
        'conversation_id': conversation_id,
        'created_at': datetime.utcnow().isoformat(),
        'read': False
    }
    
    # Send to receiver's room
    emit('new_message', message_data, room=f'user_{receiver_id}')
    
    # Also send back to sender for confirmation
    emit('message_sent', message_data, room=f'user_{sender_id}')
    
    # Create notification for receiver
    from models.notification import create_notification_document
    sender = mongo.db.users.find_one({'_id': ObjectId(sender_id)}, {'name': 1})
    sender_name = sender['name'] if sender else 'Someone'
    
    notification = create_notification_document(
        ObjectId(receiver_id),
        'new_message',
        f'New message from {sender_name}',
        f'/messages?user={sender_id}'
    )
    mongo.db.notifications.insert_one(notification)
    
    # Send real-time notification
    emit('new_notification', {
        'type': 'new_message',
        'message': f'New message from {sender_name}',
        'sender_id': sender_id
    }, room=f'user_{receiver_id}')


@socketio.on('typing')
def handle_typing(data):
    """Broadcast typing indicator."""
    receiver_id = data.get('receiver_id')
    sender_id = data.get('sender_id')
    if receiver_id:
        emit('user_typing', {'user_id': sender_id}, room=f'user_{receiver_id}')


@socketio.on('stop_typing')
def handle_stop_typing(data):
    """Broadcast stop typing indicator."""
    receiver_id = data.get('receiver_id')
    sender_id = data.get('sender_id')
    if receiver_id:
        emit('user_stop_typing', {'user_id': sender_id}, room=f'user_{receiver_id}')


@socketio.on('mark_read')
def handle_mark_read(data):
    """Mark messages as read in real-time."""
    conversation_id = data.get('conversation_id')
    reader_id = data.get('reader_id')
    
    if conversation_id and reader_id:
        mongo.db.messages.update_many(
            {
                'conversation_id': conversation_id,
                'receiver_id': ObjectId(reader_id),
                'read': False
            },
            {'$set': {'read': True}}
        )


# ===========================
# Database Indexes (run once)
# ===========================
def create_indexes():
    """Create MongoDB indexes for performance."""
    try:
        # Users indexes
        mongo.db.users.create_index('email', unique=True)
        mongo.db.users.create_index([('role', 1), ('is_approved', 1)])
        mongo.db.users.create_index([('category', 1)])
        mongo.db.users.create_index([('location', 1)])
        mongo.db.users.create_index([('avg_rating', -1)])
        
        # Projects indexes
        mongo.db.projects.create_index([('customer_id', 1)])
        mongo.db.projects.create_index([('status', 1), ('category', 1)])
        mongo.db.projects.create_index([('created_at', -1)])
        
        # Proposals indexes
        mongo.db.proposals.create_index([('engineer_id', 1)])
        mongo.db.proposals.create_index([('project_id', 1)])
        
        # Messages indexes
        mongo.db.messages.create_index([('conversation_id', 1), ('created_at', -1)])
        mongo.db.messages.create_index([('receiver_id', 1), ('read', 1)])
        
        # Reviews indexes
        mongo.db.reviews.create_index([('engineer_id', 1)])
        
        # Notifications indexes
        mongo.db.notifications.create_index([('user_id', 1), ('read', 1)])
        
        # Bookmarks indexes
        mongo.db.bookmarks.create_index([('customer_id', 1), ('engineer_id', 1)], unique=True)
        
        # Payments indexes
        mongo.db.payments.create_index([('engineer_id', 1)])
        
        print("[OK] Database indexes created successfully")
    except Exception as e:
        print(f"Warning: Could not create indexes: {e}")


# ===========================
# Seed Admin User
# ===========================
def seed_admin():
    """Create default admin user if none exists."""
    import bcrypt
    
    admin = mongo.db.users.find_one({'role': 'admin'})
    if not admin:
        password_hash = bcrypt.hashpw('Admin@123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        mongo.db.users.insert_one({
            'name': 'Admin',
            'email': 'admin@plan2build.com',
            'password_hash': password_hash,
            'role': 'admin',
            'phone': '',
            'location': '',
            'avatar': '',
            'is_verified': True,
            'is_active': True,
            'verification_token': '',
            'reset_token': '',
            'reset_token_expiry': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        print("[OK] Default admin user created (admin@plan2build.com / Admin@123)")


# ===========================
# Application Entry Point
# ===========================
if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Ensure local upload directories exist
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'avatars')
    os.makedirs(uploads_dir, exist_ok=True)

    # Ensure maintenance mode setting exists
    with app.app_context():
        try:
            if not mongo.db.system_settings.find_one({'key': 'maintenance_mode'}):
                mongo.db.system_settings.insert_one({'key': 'maintenance_mode', 'value': False, 'updated_at': datetime.utcnow()})
        except:
            pass

    # Try DB init but don't block server startup
    with app.app_context():
        try:
            # Quick connectivity check
            mongo.db.command('ping')
            create_indexes()
            seed_admin()
            print("[OK] MongoDB connected and initialized")
        except Exception as e:
            print(f"[WARNING] MongoDB not available ({e}). Server will start but API calls needing DB will fail.")
            print("   Set MONGO_URI in .env to a valid MongoDB connection string.")

    print(f"""
============================================
  PLAN 2 BUILD - Backend Service
  Status:   ACTIVE (Demo Mode)
--------------------------------------------
  Local:    http://localhost:{port}
  Network:  Accessible via your server IP
  Frontend: Auto-detected (window.origin)
============================================
    """)

    # Production mode: Use the PORT provided by the environment, or default to 5000
    host = '0.0.0.0'
    socketio.run(app, host=host, port=port, debug=debug, allow_unsafe_werkzeug=True)


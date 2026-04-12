"""
Project routes for PLAN 2 BUILD.
Handles customer project posting and management.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from middleware.auth_middleware import token_required, role_required
from models.project import create_project_document, SERVICE_CATEGORIES
from utils.helpers import serialize_doc, paginate_query

projects_bp = Blueprint('projects', __name__)


@projects_bp.route('', methods=['POST'])
@token_required
@role_required('customer')
def create_project(current_user_id):
    """Create a new building project post."""
    from app import mongo
    
    data = request.get_json()
    
    # Validate required fields
    required = ['title', 'description', 'category', 'location']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    project_doc = create_project_document(data, ObjectId(current_user_id))
    result = mongo.db.projects.insert_one(project_doc)
    
    project_doc['_id'] = result.inserted_id
    
    return jsonify({
        'message': 'Project posted successfully',
        'project': serialize_doc(project_doc)
    }), 201


@projects_bp.route('', methods=['GET'])
def list_projects():
    """
    List open projects with filters.
    Query params: category, location, budget_min, budget_max, search, page, per_page
    """
    from app import mongo
    
    query = {'status': 'open'}
    
    # Category filter
    category = request.args.get('category')
    if category:
        query['category'] = category
    
    # Location filter
    location = request.args.get('location')
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}
    
    # Budget range filter
    budget_min = request.args.get('budget_min')
    if budget_min:
        query['budget_max'] = {'$gte': float(budget_min)}
    
    budget_max = request.args.get('budget_max')
    if budget_max:
        query['budget_min'] = {'$lte': float(budget_max)}
    
    # Search
    search = request.args.get('search')
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    # Pagination
    page, per_page, skip = paginate_query(request.args)
    
    total = mongo.db.projects.count_documents(query)
    projects = mongo.db.projects.find(query).sort('created_at', -1).skip(skip).limit(per_page)
    
    projects_list = []
    for project in projects:
        project_data = serialize_doc(project)
        # Get customer name
        customer = mongo.db.users.find_one({'_id': project['customer_id']}, {'name': 1, 'avatar': 1, 'location': 1})
        if customer:
            project_data['customer_name'] = customer['name']
            project_data['customer_avatar'] = customer.get('avatar', '')
        projects_list.append(project_data)
    
    return jsonify({
        'projects': projects_list,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    }), 200


@projects_bp.route('/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get a single project with details."""
    from app import mongo
    
    try:
        project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    except:
        return jsonify({'error': 'Invalid project ID'}), 400
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    project_data = serialize_doc(project)
    
    # Get customer info
    customer = mongo.db.users.find_one({'_id': project['customer_id']}, {'name': 1, 'avatar': 1, 'location': 1})
    if customer:
        project_data['customer_name'] = customer['name']
        project_data['customer_avatar'] = customer.get('avatar', '')
    
    # Get proposals count
    project_data['proposals_count'] = mongo.db.proposals.count_documents({'project_id': ObjectId(project_id)})
    
    return jsonify({'project': project_data}), 200


@projects_bp.route('/<project_id>', methods=['PUT'])
@token_required
@role_required('customer')
def update_project(current_user_id, project_id):
    """Update a project (only by the owner)."""
    from app import mongo
    
    try:
        project = mongo.db.projects.find_one({
            '_id': ObjectId(project_id),
            'customer_id': ObjectId(current_user_id)
        })
    except:
        return jsonify({'error': 'Invalid project ID'}), 400
    
    if not project:
        return jsonify({'error': 'Project not found or access denied'}), 404
    
    data = request.get_json()
    allowed_fields = ['title', 'description', 'category', 'budget_min', 'budget_max', 
                      'location', 'timeline', 'status']
    
    update_data = {}
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
    
    update_data['updated_at'] = datetime.utcnow()
    
    mongo.db.projects.update_one(
        {'_id': ObjectId(project_id)},
        {'$set': update_data}
    )
    
    return jsonify({'message': 'Project updated successfully'}), 200


@projects_bp.route('/<project_id>/upload', methods=['POST'])
@token_required
@role_required('customer')
def upload_project_file(current_user_id, project_id):
    """Project file upload disabled in deep cleanup mode."""
    return jsonify({'error': 'Feature disabled in demo mode.'}), 501


@projects_bp.route('/my', methods=['GET'])
@token_required
@role_required('customer')
def get_my_projects(current_user_id):
    """Get projects posted by the current customer."""
    from app import mongo
    
    page, per_page, skip = paginate_query(request.args)
    
    query = {'customer_id': ObjectId(current_user_id)}
    total = mongo.db.projects.count_documents(query)
    projects = mongo.db.projects.find(query).sort('created_at', -1).skip(skip).limit(per_page)
    
    projects_list = []
    for project in projects:
        project_data = serialize_doc(project)
        project_data['proposals_count'] = mongo.db.proposals.count_documents({'project_id': project['_id']})
        projects_list.append(project_data)
    
    return jsonify({
        'projects': projects_list,
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200

"""
Proposal routes for PLAN 2 BUILD.
Handles engineer proposals to customer projects.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime

from middleware.auth_middleware import token_required, role_required
from models.proposal import create_proposal_document
from models.notification import create_notification_document
from utils.helpers import serialize_doc, paginate_query

proposals_bp = Blueprint('proposals', __name__)


@proposals_bp.route('', methods=['POST'])
@token_required
@role_required('engineer')
def send_proposal(current_user_id):
    """Send a proposal to a customer project."""
    from app import mongo
    
    data = request.get_json()
    
    if not data.get('project_id'):
        return jsonify({'error': 'project_id is required'}), 400
    
    project_id = data['project_id']
    
    # Verify project exists and is open
    try:
        project = mongo.db.projects.find_one({'_id': ObjectId(project_id), 'status': 'open'})
    except:
        return jsonify({'error': 'Invalid project ID'}), 400
    
    if not project:
        return jsonify({'error': 'Project not found or not accepting proposals'}), 404
    
    # Check if engineer already sent a proposal
    existing = mongo.db.proposals.find_one({
        'engineer_id': ObjectId(current_user_id),
        'project_id': ObjectId(project_id)
    })
    if existing:
        return jsonify({'error': 'You have already submitted a proposal for this project'}), 409
    
    # Create proposal
    proposal_doc = create_proposal_document(data, ObjectId(current_user_id), ObjectId(project_id))
    result = mongo.db.proposals.insert_one(proposal_doc)
    
    # Update proposals count on project
    mongo.db.projects.update_one(
        {'_id': ObjectId(project_id)},
        {'$inc': {'proposals_count': 1}}
    )
    
    # Send notification to customer
    notification = create_notification_document(
        project['customer_id'],
        'proposal_received',
        f'{engineer["name"]} sent a proposal for your project "{project["title"]}"',
        f'/project/{project_id}'
    )
    mongo.db.notifications.insert_one(notification)
    
    proposal_doc['_id'] = result.inserted_id
    
    return jsonify({
        'message': 'Proposal sent successfully',
        'proposal': serialize_doc(proposal_doc)
    }), 201


@proposals_bp.route('/project/<project_id>', methods=['GET'])
@token_required
def get_project_proposals(current_user_id, project_id):
    """Get all proposals for a project (customer only sees if they own it)."""
    from app import mongo
    
    try:
        project = mongo.db.projects.find_one({'_id': ObjectId(project_id)})
    except:
        return jsonify({'error': 'Invalid project ID'}), 400
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Only project owner can see proposals
    if str(project['customer_id']) != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    proposals = mongo.db.proposals.find({'project_id': ObjectId(project_id)}).sort('created_at', -1)
    
    proposals_list = []
    for prop in proposals:
        prop_data = serialize_doc(prop)
        # Get engineer info
        engineer = mongo.db.users.find_one(
            {'_id': prop['engineer_id']},
            {'name': 1, 'avatar': 1, 'category': 1, 'avg_rating': 1, 'experience_years': 1, 'location': 1}
        )
        if engineer:
            prop_data['engineer'] = serialize_doc(engineer)
        proposals_list.append(prop_data)
    
    return jsonify({'proposals': proposals_list}), 200


@proposals_bp.route('/<proposal_id>/status', methods=['PUT'])
@token_required
@role_required('customer')
def update_proposal_status(current_user_id, proposal_id):
    """Accept or reject a proposal."""
    from app import mongo
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['accepted', 'rejected']:
        return jsonify({'error': 'Status must be accepted or rejected'}), 400
    
    # Find proposal
    try:
        proposal = mongo.db.proposals.find_one({'_id': ObjectId(proposal_id)})
    except:
        return jsonify({'error': 'Invalid proposal ID'}), 400
    
    if not proposal:
        return jsonify({'error': 'Proposal not found'}), 404
    
    # Verify project ownership
    project = mongo.db.projects.find_one({
        '_id': proposal['project_id'],
        'customer_id': ObjectId(current_user_id)
    })
    if not project:
        return jsonify({'error': 'Access denied'}), 403
    
    # Update proposal status
    mongo.db.proposals.update_one(
        {'_id': ObjectId(proposal_id)},
        {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
    )
    
    # If accepted, update project status and reject other proposals
    if new_status == 'accepted':
        mongo.db.projects.update_one(
            {'_id': proposal['project_id']},
            {'$set': {
                'status': 'in_progress',
                'hired_engineer_id': proposal['engineer_id'],
                'updated_at': datetime.utcnow()
            }}
        )
        # Reject other proposals
        mongo.db.proposals.update_many(
            {
                'project_id': proposal['project_id'],
                '_id': {'$ne': ObjectId(proposal_id)},
                'status': 'pending'
            },
            {'$set': {'status': 'rejected', 'updated_at': datetime.utcnow()}}
        )
    
    # Notify engineer
    notification = create_notification_document(
        proposal['engineer_id'],
        f'proposal_{new_status}',
        f'Your proposal for "{project["title"]}" has been {new_status}',
        f'/project/{str(proposal["project_id"])}',
        related_user_id=ObjectId(current_user_id) # The customer
    )
    mongo.db.notifications.insert_one(notification)
    
    return jsonify({'message': f'Proposal {new_status}'}), 200


@proposals_bp.route('/my', methods=['GET'])
@token_required
@role_required('engineer')
def get_my_proposals(current_user_id):
    """Get proposals sent by the current engineer."""
    from app import mongo
    
    page, per_page, skip = paginate_query(request.args)
    
    query = {'engineer_id': ObjectId(current_user_id)}
    
    # Status filter
    status = request.args.get('status')
    if status:
        query['status'] = status
    
    total = mongo.db.proposals.count_documents(query)
    proposals = mongo.db.proposals.find(query).sort('created_at', -1).skip(skip).limit(per_page)
    
    proposals_list = []
    for prop in proposals:
        prop_data = serialize_doc(prop)
        # Get project info
        project = mongo.db.projects.find_one(
            {'_id': prop['project_id']}, 
            {'title': 1, 'category': 1, 'location': 1, 'budget_min': 1, 'budget_max': 1, 'customer_id': 1}
        )
        if project:
            prop_data['project'] = serialize_doc(project)
        proposals_list.append(prop_data)
    
    return jsonify({
        'proposals': proposals_list,
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200

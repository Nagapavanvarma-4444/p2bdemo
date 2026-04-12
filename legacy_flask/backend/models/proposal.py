"""
Proposal model for PLAN 2 BUILD.
Handles engineer proposals sent to customer projects.
"""

from datetime import datetime


def create_proposal_document(data, engineer_id, project_id):
    """
    Create a proposal document for MongoDB insertion.
    
    Args:
        data: Dictionary with proposal details
        engineer_id: ObjectId of the engineer
        project_id: ObjectId of the project
    
    Returns:
        dict: MongoDB-ready proposal document
    """
    return {
        'engineer_id': engineer_id,
        'project_id': project_id,
        'message': data.get('message', ''),
        'proposed_price': float(data.get('proposed_price', 0)),
        'proposed_timeline': data.get('proposed_timeline', ''),
        'attachments': data.get('attachments', []),     # Optional supporting files
        'status': 'pending',                             # pending, accepted, rejected, withdrawn
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }


# Proposal status options
PROPOSAL_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn']

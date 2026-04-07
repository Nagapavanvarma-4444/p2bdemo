"""
Seed script for PLAN 2 BUILD.
Populates MongoDB with sample engineers and projects.
"""

import os
import sys
from datetime import datetime, timedelta
from flask_pymongo import PyMongo
from flask import Flask
from bson import ObjectId
import bcrypt
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/plan2build')
mongo = PyMongo(app)

def seed_data():
    with app.app_context():
        # Clear existing data (optional, but good for clean seed)
        print("Clearing existing data...")
        # mongo.db.users.delete_many({'role': {'$ne': 'admin'}}) # Keep admin if exists
        # Actually, let's just add new ones if they don't exist by email
        
        # 1. Sample Engineers
        engineers = [
            {
                'name': 'Er. Rajesh Kumar',
                'email': 'rajesh@example.com',
                'role': 'engineer',
                'category': 'Civil Engineer',
                'location': 'Mumbai, Maharashtra',
                'experience_years': 10,
                'bio': 'Senior Civil Engineer with 10 years of experience in structural design and construction management.',
                'skills': ['Structural Analysis', 'Project Management', 'AutoCAD'],
                'avg_rating': 4.8,
                'total_reviews': 15,
                'is_approved': True,
                'subscription': {'plan': 'premium', 'status': 'active'},
                'is_featured': True
            },
            {
                'name': 'Ar. Priya Sharma',
                'email': 'priya@example.com',
                'role': 'engineer',
                'category': 'Architect',
                'location': 'Pune, Maharashtra',
                'experience_years': 8,
                'bio': 'Passionate architect specializing in modern residential designs and sustainable architecture.',
                'skills': ['BIM', 'SketchUp', 'Interior Design'],
                'avg_rating': 4.9,
                'total_reviews': 22,
                'is_approved': True,
                'subscription': {'plan': 'professional', 'status': 'active'},
                'is_featured': True
            },
            {
                'name': 'Er. Amit Patel',
                'email': 'amit@example.com',
                'role': 'engineer',
                'category': 'Electrical Engineer',
                'location': 'Ahmedabad, Gujarat',
                'experience_years': 6,
                'bio': 'Electrical systems expert for large scale commercial and industrial projects.',
                'skills': ['Power Systems', 'Safety Audits', 'Lighting Design'],
                'avg_rating': 4.6,
                'total_reviews': 8,
                'is_approved': True,
                'subscription': {'plan': 'basic', 'status': 'active'},
                'is_featured': False
            },
            {
                'name': 'Ms. Anjali Deshmukh',
                'email': 'anjali@example.com',
                'role': 'engineer',
                'category': 'Interior Designer',
                'location': 'Bangalore, Karnataka',
                'experience_years': 5,
                'bio': 'Creative interior designer transforming spaces with functional and aesthetic solutions.',
                'skills': ['Vastu Shastra', '3D Rendering', 'Space Planning'],
                'avg_rating': 4.7,
                'total_reviews': 12,
                'is_approved': True,
                'subscription': {'plan': 'premium', 'status': 'active'},
                'is_featured': False
            }
        ]

        default_pwd = bcrypt.hashpw('Password@123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        for eng in engineers:
            if not mongo.db.users.find_one({'email': eng['email']}):
                eng_doc = {
                    'name': eng['name'],
                    'email': eng['email'],
                    'password_hash': default_pwd,
                    'role': eng['role'],
                    'category': eng['category'],
                    'location': eng['location'],
                    'experience_years': eng['experience_years'],
                    'bio': eng['bio'],
                    'skills': eng['skills'],
                    'avg_rating': eng['avg_rating'],
                    'total_reviews': eng['total_reviews'],
                    'is_approved': eng['is_approved'],
                    'is_active': True,
                    'is_verified': True,
                    'is_featured': eng['is_featured'],
                    'subscription': {
                        'plan': eng['subscription']['plan'],
                        'status': eng['subscription']['status'],
                        'start_date': datetime.utcnow(),
                        'end_date': datetime.utcnow() + timedelta(days=30)
                    },
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow(),
                    'pricing': {'hourly_rate': 1000, 'project_min': 5000, 'project_max': 50000},
                    'education': [{'degree': 'B.Tech', 'institution': 'Local University', 'year': '2015'}],
                    'certifications': [],
                    'portfolio': [],
                    'badges': ['verified'],
                    'completed_projects': eng['total_reviews'] + 2,
                    'profile_completion': 90
                }
                mongo.db.users.insert_one(eng_doc)
                print(f"Added engineer: {eng['name']}")

        # 2. Sample Customers & Projects
        customers = [
            {
                'name': 'Suresh Mehta',
                'email': 'suresh@example.com',
                'role': 'customer'
            }
        ]

        for cust in customers:
            user = mongo.db.users.find_one({'email': cust['email']})
            if not user:
                cust_doc = {
                    'name': cust['name'],
                    'email': cust['email'],
                    'password_hash': default_pwd,
                    'role': cust['role'],
                    'is_active': True,
                    'is_verified': True,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                result = mongo.db.users.insert_one(cust_doc)
                cust_id = result.inserted_id
                print(f"Added customer: {cust['name']}")
            else:
                cust_id = user['_id']

            # Add projects for this customer
            projects = [
                {
                    'title': 'New Residential Villa Construction',
                    'description': 'Looking for a civil engineer and architect for a 3BHK villa construction in Pune. Area is approx 2500 sq ft.',
                    'category': 'Civil Engineer',
                    'location': 'Pune, Maharashtra',
                    'budget_min': 4000000,
                    'budget_max': 6000000,
                    'status': 'open'
                },
                {
                    'title': 'Interior Renovation for Office',
                    'description': 'Modern interior design and execution for a 1200 sq ft office space.',
                    'category': 'Interior Designer',
                    'location': 'Mumbai, Maharashtra',
                    'budget_min': 500000,
                    'budget_max': 1000000,
                    'status': 'open'
                }
            ]

            for proj in projects:
                if not mongo.db.projects.find_one({'title': proj['title'], 'customer_id': cust_id}):
                    proj_doc = {
                        'customer_id': cust_id,
                        'title': proj['title'],
                        'description': proj['description'],
                        'category': proj['category'],
                        'location': proj['location'],
                        'budget_min': proj['budget_min'],
                        'budget_max': proj['budget_max'],
                        'status': proj['status'],
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow(),
                        'proposals_count': 0,
                        'plan_files': []
                    }
                    mongo.db.projects.insert_one(proj_doc)
                    print(f"Added project: {proj['title']}")

        print("[OK] Seeding completed successfully")

if __name__ == '__main__':
    seed_data()

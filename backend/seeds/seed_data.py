
import os
import pymongo
from bson import ObjectId
from datetime import datetime
import random

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/plan2build"
client = pymongo.MongoClient(MONGO_URI)
db = client['plan2build']

# Sample Project Images (Unsplash placeholders)
PROJECT_IMAGES = [
    "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=800&auto=format&fit=crop", # Construction site
    "https://images.unsplash.com/photo-1503387762-592dee58c460?q=80&w=800&auto=format&fit=crop", # Modern house
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop", # Commercial building
    "https://images.unsplash.com/photo-1618221195710-dd6b41faeaa6?q=80&w=800&auto=format&fit=crop", # Interior design
    "https://images.unsplash.com/photo-1600585154340-be6199f7a096?q=80&w=800&auto=format&fit=crop", # Luxury kitchen
    "https://images.unsplash.com/photo-1590374585152-ca0e8194c0d6?q=80&w=800&auto=format&fit=crop"  # Electrical work
]

PROJECT_TITLES = [
    "Modern Residential Complex",
    "Eco-Friendly Urban Office",
    "Luxury Interior Renovation",
    "High-Voltage Substation Design",
    "Sustainable Bridge Infrastructure",
    "Smart Home Automation System"
]

SAMPLE_REVIEWS = [
    "Incredible attention to detail. The project was finished ahead of schedule!",
    "Highly professional and knowledgeable. Would definitely recommend for any complex build.",
    "Brought our dream home to life. The design is both functional and beautiful.",
    "Efficient and reliable. Great communicator and very transparent with costs.",
    "A true expert in the field. Handled all legal and structural aspects seamlessly.",
    "Creative layout and very precise structural work. A pleasure to work with."
]

CUSTOMER_NAMES = ["Amit Sharma", "Priya Patel", "Rahul Varma", "Sneha Rao"]

def seed_data():
    print("Starting database seeding...")

    # 1. Create or Get Customers
    customers = []
    for name in CUSTOMER_NAMES:
        email = f"{name.lower().replace(' ', '.')}@example.com"
        customer = db.users.find_one({'email': email})
        if not customer:
            res = db.users.insert_one({
                'name': name,
                'email': email,
                'role': 'customer',
                'is_verified': True,
                'is_active': True,
                'created_at': datetime.utcnow()
            })
            customers.append(res.inserted_id)
            print(f"Created Customer: {name}")
        else:
            customers.append(customer['_id'])

    # 2. Update Engineers and Add Portfolio/Reviews
    engineers = list(db.users.find({'role': 'engineer'}))
    if not engineers:
        print("No engineers found in the database. Please register an engineer first.")
        return

    for eng in engineers:
        eng_id = eng['_id']
        print(f"Propagating data for Engineer: {eng['name']}")

        # Ensure engineer is visible in listings
        db.users.update_one(
            {'_id': eng_id},
            {'$set': {
                'is_approved': True,
                'is_active': True,
                'subscription': {
                    'plan': 'professional',
                    'status': 'active',
                    'start_date': datetime.utcnow(),
                    'end_date': datetime(2030, 1, 1)
                },
                'is_featured': random.choice([True, False]),
                'bio': eng.get('bio') or "Dedicated professional with extensive experience in the engineering and construction sector. Committed to delivering high-quality, sustainable, and innovative solutions for all project needs.",
                'experience_years': eng.get('experience_years') or random.randint(3, 15),
                'skills': eng.get('skills') or ["Project Management", "Structural Design", "AutoCAD", "Site Inspection", "Blueprint Reading"]
            }}
        )

        # Add Portfolio items if empty
        if not eng.get('portfolio'):
            portfolio = []
            for i in range(3):
                portfolio.append({
                    'title': random.choice(PROJECT_TITLES) + f" {i+1}",
                    'description': "This project involved comprehensive planning and execution focusing on efficiency and modern aesthetics.",
                    'image_url': random.choice(PROJECT_IMAGES),
                    'created_at': datetime.utcnow().isoformat()
                })
            db.users.update_one({'_id': eng_id}, {'$set': {'portfolio': portfolio}})
            print(f"  - Added 3 portfolio items")

        # Add Reviews if few or none
        current_reviews_count = db.reviews.count_documents({'engineer_id': eng_id})
        if current_reviews_count < 2:
            review_ids = []
            for _ in range(3):
                cust_id = random.choice(customers)
                rating = random.randint(4, 5)
                comment = random.choice(SAMPLE_REVIEWS)
                review_doc = {
                    'customer_id': cust_id,
                    'engineer_id': eng_id,
                    'rating': rating,
                    'comment': comment,
                    'created_at': datetime.utcnow()
                }
                res = db.reviews.insert_one(review_doc)
                review_ids.append(res.inserted_id)
            
            # Recalculate avg rating
            pipeline = [
                {'$match': {'engineer_id': eng_id}},
                {'$group': {'_id': None, 'avg': {'$avg': '$rating'}, 'count': {'$sum': 1}}}
            ]
            stats = list(db.reviews.aggregate(pipeline))
            if stats:
                db.users.update_one(
                    {'_id': eng_id},
                    {'$set': {
                        'avg_rating': round(stats[0]['avg'], 1),
                        'total_reviews': stats[0]['count']
                    }}
                )
            print(f"  - Added 3 reviews and updated rating")

    print("\nSeeding completed successfully!")

if __name__ == "__main__":
    seed_data()

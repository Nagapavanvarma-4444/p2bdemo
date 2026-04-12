# 🏗️ PLAN 2 BUILD
### The ultimate construction marketplace connecting visionary customers with elite engineers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.8+](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask: 2.0+](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![MongoDB: Cloud/Local](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/)
[![Security: JWT/Role-Based](https://img.shields.io/badge/Security-JWT_Auth-orange.svg)](#security)

---

## 🚀 Overview
**PLAN 2 BUILD** is a professional marketplace ecosystem designed to streamline the connection between property owners and vetted construction professionals. From initial concept to building approval, the platform manages projects, communications, and administrative vetting in one high-performance interface.

### 🛠️ For Customers
- **Project Posting**: Submit detailed construction requirements and get professional bids.
- **Find Engineers**: Browse a curated list of vetted and certified professionals.
- **Direct Messaging**: Communicate in real-time via persistent socket-based chat.

### 📐 For Engineers
- **Professional Portfolios**: Showcase deep biographies, skills, and past projects.
- **Vetting & Certification**: Upload professional certificates for administrative review.
- **Verified Badging**: Earn official verified status with a profile badge to stand out in the marketplace.
- **Dynamic Dashboard**: Real-time verification status monitoring and professional alerts.

### 🛡️ Administrative Suite (Central Command)
- **Maintenance Control**: Toggle global site status with a professional "Under Construction" overlay.
- **Expert Document Vetting**: Detailed review system for engineer certifications with specialized UI overlays.
- **Advanced Verification Flow**: Approve or reject new registrations with mandatory feedback for engineers.
- **User Management**: Monitor reliable professionals and award verified badges with a centralized audit interface.

---

## 🛠️ Technical Stack
The platform is built on a high-availability, modern stack:

| Layer | Technology |
| :--- | :--- |
| **Backend** | Python / Flask |
| **Database** | MongoDB (PyMongo) |
| **Authentication** | JWT (JSON Web Tokens) with Role-Based Access Control |
| **Frontend** | Vanilla JavaScript (ES6+), Semantic HTML5, CSS3 Variables |
| **Real-time** | Socket.IO (WebSockets) |
| **Mailing** | Flask-Mail (Gmail SMTP/SMTP2GO) |

---

## 🔐 Security Architecture
Security is at the heart of PLAN 2 BUILD. We implemented a **multi-layer protection strategy**:

1.  **JWT Verification**: Every API call is verified against signed JSON Web Tokens.
2.  **Role-Based Access (RBAC)**: Backend middleware decorators (`@role_required`) enforce strict permissions for Admins, Engineers, and Customers.
3.  **Instant Content Blocking**: Administrative pages use a blocking script at the top of the `<body>` to redirect unauthorized users before the DOM even renders.
4.  **Maintenance Isolation**: A global `before_request` hook blocks all public access during downtime, permitting only authenticated Administrators to bypass the maintenance wall.

---

## 🚦 Getting Started

### Prerequisites
- Python 3.8+
- MongoDB instance (local or Atlas)

### ⚙️ Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/[username]/PLAN2BUILD.git
    cd "PLAN 2 BUILD"
    ```
2.  **Setup Virtual Environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```
4.  **Configuration**:
    Create a `.env` file in the root directory (refer to `.env.example`):
    ```env
    MONGO_URI=mongodb+srv://...
    JWT_SECRET_KEY=your_secret_here
    MAIL_USERNAME=your_email
    MAIL_PASSWORD=your_app_password
    ```
5.  **Run Server**:
    ```bash
    python backend/app.py
    ```

---

## 👨‍💼 Administrator Access
Default admin credentials (for testing purposes):
- **URL**: `/login.html`
- **Email**: `admin@plan2build.com`
- **Password**: `Admin@123`

---

## 📈 Future Roadmap
- [ ] Integration with Razorpay for project milestone payments.
- [ ] AI-assisted project estimation tools.
- [ ] Mobile App (React Native) for real-time site updates.

---
**Developed with ❤️ by the PLAN 2 BUILD Team.**
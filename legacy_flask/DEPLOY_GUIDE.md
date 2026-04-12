# 🚀 PLAN 2 BUILD - Deployment Guide

This guide will help you move your project from your local computer to a live URL.

## Step 1: Set up a Cloud Database (MongoDB Atlas)
Since your local MongoDB won't be accessible from the internet, you need a cloud database.

1.  **Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2.  **Create Cluster**: Choose the **FREE Shared Tier**.
3.  **Database Access**: Create a database user (e.g., `admin`) and a secure password.
4.  **Network Access**: IMPORTANT: Go to "Network Access" and click **Add IP Address** -> **Allow Access from Anywhere**.
5.  **Get Connection String**:
    - Click **Connect** -> **Connect your application**.
    - Copy the URI (it looks like `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/...`).
    - Save this! You will need it for the next step.

## Step 2: Choose Your Hosting (Render is BEST for this project)
Because this project uses **Real-time Chat (WebSockets)**, I highly recommend using **Render.com**.

### Option A: Render.com (Recommended)
1.  **Push to GitHub**: Upload your project to a GitHub repository.
2.  **Create Web Service**:
    - Log in to [Render](https://dashboard.render.com/).
    - Click **New** + **Web Service**.
    - Connect your GitHub repo.
3.  **Settings**:
    - **Runtime**: Python 3.x
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `python backend/app.py`
4.  **Environment Variables**: Click the "Env" tab and add:
    - `MONGO_URI`: (Paste your MongoDB Atlas string here)
    - `JWT_SECRET_KEY`: (Any long random string)
    - `FLASK_SECRET_KEY`: (Any long random string)
    - `FLASK_PORT`: `10000` (Render's default)

### Option B: Vercel (Frontend Only / No Chat)
If you must use Vercel, note that the **Chat feature will not work** because Vercel doesn't support persistent WebSockets.
1.  Connect your GitHub repo to Vercel.
2.  Vercel will detect `vercel.json` and deploy automatically.
3.  Set your Environment Variables in the Vercel Dashboard.

## Step 3: Run the Seed Script (One Time)
Once your site is live, you might want to populate it with the demo data again.
- You can run `python backend/seed_db.py` locally, but change the `.env` to point to your **Cloud MongoDB Atlas URI** first. This will upload the demo data to the cloud.

---
**You're all set!** Your project is now ready to be professional, live, and shared with the world.

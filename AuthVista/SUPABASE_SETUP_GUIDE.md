# 🎯 Supabase Database Setup Guide

## Your Project Information
- **Project ID**: `fvfywcpvkqrwsfkdjnki`
- **Password**: `ghp263476`
- **Dashboard**: https://supabase.com/dashboard/project/fvfywcpvkqrwsfkdjnki

---

## 📋 Step-by-Step Instructions

### STEP 1: Check Project Status

1. Open the dashboard link above (or it should be open already)
2. Look at the top of the page for the project status badge

---

### STEP 2: Resume Project (if needed)

#### If you see **"PAUSED"** status:
1. Click the **"Resume project"** or **"Restore"** button
2. Wait 2-3 minutes for the database to start
3. Status will change to **"Active"** when ready
4. ✅ **Then come back here and tell me "resumed"**

#### If you see **"ACTIVE"** status:
1. ✅ Perfect! Your database is already running
2. **Tell me "active"** and I'll configure the connection

#### If you see **"Project not found"** or **"Access denied"**:
1. The project might be deleted or credentials are wrong
2. **Tell me "notfound"** and I'll set up Railway.app instead (5 minutes)

---

### STEP 3: Get Connection String (After project is Active)

Once your project status shows **"Active"**:

1. In the Supabase dashboard, click **"Settings"** (gear icon in left sidebar)
2. Click **"Database"**
3. Scroll down to **"Connection string"**
4. Click **"URI"** tab
5. Copy the entire connection string (it will look like):
   ```
   postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **Paste it here in the chat** and I'll update your `.env` file

---

### STEP 4: Enable PostGIS Extension (Required!)

After the connection is working:

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"** button
3. Paste this SQL command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   ```
4. Click **"Run"** (or press Ctrl+Enter)
5. You should see: ✅ **"Success. No rows returned"**

---

### STEP 5: Initialize Database Tables

1. In the same SQL Editor, click **"New query"** again
2. Open this file on your computer:
   ```
   c:\Users\prajy\OneDrive\Desktop\Tadoba-link software\AuthVista\backend\init_supabase.sql
   ```
3. Copy ALL the contents (Ctrl+A, Ctrl+C)
4. Paste into the Supabase SQL Editor
5. Click **"Run"**
6. You should see: ✅ **"Database initialized successfully!"**

---

## 🚀 After Setup Complete

Once all steps are done, I'll:
1. ✅ Update your `backend/.env` with the correct connection string
2. ✅ Start the backend server
3. ✅ Start the inference worker
4. ✅ Frontend is already running at http://localhost:5173
5. 🎥 **You can test the webcam surveillance!**

---

## ⏭️ Alternative: Railway.app (If Supabase fails)

If Supabase doesn't work, I can set up Railway.app instead:
- Takes 5-10 minutes
- Free $5/month credit (enough for testing)
- PostgreSQL + PostGIS included
- More reliable than Supabase free tier

**Just tell me "use railway" if you want this option instead!**

---

## 📞 What to tell me:

| What you see | What to type |
|--------------|--------------|
| Project shows "Paused" and you clicked Resume | `"resumed"` (after 2-3 min wait) |
| Project shows "Active" already | `"active"` |
| Project not found / Access denied | `"notfound"` |
| I want to use Railway.app instead | `"use railway"` |
| Need help / confused | Just ask! |

---

**I'm waiting for your response! What do you see in the Supabase dashboard?** 🎯

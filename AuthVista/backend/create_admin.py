"""
Create initial admin user for production deployment
Run after database migrations: python create_admin.py
"""
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import SessionLocal, init_db
from models import User, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    """Create admin user if doesn't exist"""
    print("🚀 Creating admin user...")
    
    # Initialize database
    try:
        init_db()
        print("✅ Database initialized")
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
    
    db = SessionLocal()
    
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@tadoba.com").first()
        if admin:
            print("❌ Admin user already exists!")
            print("📧 Email: admin@tadoba.com")
            print("💡 Use existing credentials to login")
            return
        
        # Create admin user
        print("👤 Creating admin user...")
        admin = User(
            email="admin@tadoba.com",
            username="admin",
            full_name="System Administrator",
            hashed_password=pwd_context.hash("admin123"),  # CHANGE THIS!
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("\n" + "="*60)
        print("✅ ADMIN USER CREATED SUCCESSFULLY!")
        print("="*60)
        print("📧 Email:    admin@tadoba.com")
        print("🔑 Password: admin123")
        print("="*60)
        print("⚠️  SECURITY WARNING:")
        print("    CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!")
        print("="*60 + "\n")
        
        # Also create a ranger user for testing
        ranger = db.query(User).filter(User.email == "ranger@tadoba.com").first()
        if not ranger:
            print("👤 Creating ranger test user...")
            ranger = User(
                email="ranger@tadoba.com",
                username="ranger",
                full_name="Forest Ranger",
                hashed_password=pwd_context.hash("ranger123"),
                role=UserRole.RANGER,
                is_active=True
            )
            db.add(ranger)
            db.commit()
            print("✅ Ranger user created")
            print("📧 Email:    ranger@tadoba.com")
            print("🔑 Password: ranger123\n")
        
        # Create a viewer user for testing
        viewer = db.query(User).filter(User.email == "viewer@tadoba.com").first()
        if not viewer:
            print("👤 Creating viewer test user...")
            viewer = User(
                email="viewer@tadoba.com",
                username="viewer",
                full_name="Public Viewer",
                hashed_password=pwd_context.hash("viewer123"),
                role=UserRole.VIEWER,
                is_active=True
            )
            db.add(viewer)
            db.commit()
            print("✅ Viewer user created")
            print("📧 Email:    viewer@tadoba.com")
            print("🔑 Password: viewer123\n")
        
        print("✅ All test users created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

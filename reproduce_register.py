import sys
import os
import asyncio
from datetime import datetime

# Add current directory to path
sys.path.append(os.getcwd())

from app.database import Base, engine, SessionLocal
from app.models import User
from app.routers.users import register, UserCreate
from fastapi import HTTPException

# Create tables
Base.metadata.create_all(bind=engine)

async def test_register():
    print("Starting registration test...")
    db = SessionLocal()
    try:
        # Clean up existing test user
        existing = db.query(User).filter(User.username == "testuser999").first()
        if existing:
            print("Cleaning up existing user...")
            db.delete(existing)
            db.commit()

        user_data = UserCreate(username="testuser999", password="password123")
        
        print("Calling register function...")
        new_user = await register(user_data, db)
        
        print(f"Success! Created user: {new_user.username}")
        print(f"ID: {new_user.id}")
        print(f"Created At: {new_user.created_at}")
        print(f"Last Login: {new_user.last_login}")
        
    except HTTPException as he:
        print(f"HTTP Exception: {he.detail}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_register())

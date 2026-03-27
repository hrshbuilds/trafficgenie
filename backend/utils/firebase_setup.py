import os
import json
import firebase_admin
from firebase_admin import credentials

def initialize_firebase():
    """Reads Firebase credentials from environment variable and initializes the app."""
    # Option 1: Load from path stored in .env
    # cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
    # if cred_path and os.path.exists(cred_path):
    #     cred = credentials.Certificate(cred_path)
    #     if not firebase_admin._apps:
    #         firebase_admin.initialize_app(cred)
    #     return True

    # Option 2: Load from direct JSON content in .env (more secure for CI/CD)
    cred_json = os.getenv('FIREBASE_CREDENTIALS_JSON')
    if cred_json:
        try:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            return True
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            return False
            
    # Fallback to local file if path provided
    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json')
    if os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            return True
        except Exception as e:
            print(f"Warning: Firebase initialization failed: {e}")
            return False
            
    return False

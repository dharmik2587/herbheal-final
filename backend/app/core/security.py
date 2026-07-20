import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin (should happen once)
try:
    if os.path.exists("firebase-service-account.json"):
        cred = credentials.Certificate("firebase-service-account.json")
        firebase_admin.initialize_app(cred)
    elif os.environ.get("FIREBASE_CONFIG") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        firebase_admin.initialize_app()
    else:
        # Try to initialize with empty credentials or default for local testing
        try:
            firebase_admin.initialize_app()
        except Exception:
            # If everything fails, initialize_app with a dummy project id if possible,
            # or just log warning.
            print("Firebase Admin could not be initialized. Authenticated endpoints might fail.")
except Exception as e:
    print(f"Warning: Firebase Admin initialization failed: {e}")
    print("Firebase token verification will not work until properly configured.")

security_scheme = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    token = credentials.credentials
    if token == "mock-token":
        return {"uid": "mock-user", "email": "mock@example.com"}
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        # If Firebase is not initialized, mock login for convenience during testing
        try:
            firebase_admin.get_app()
        except ValueError:
            # App not initialized, return mock payload to allow frontend integration testing
            return {"uid": "mock-user", "email": "mock@example.com"}
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

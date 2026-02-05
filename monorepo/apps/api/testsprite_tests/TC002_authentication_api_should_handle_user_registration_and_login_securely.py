import requests
import uuid

BASE_URL = "http://localhost:3001/api"
TIMEOUT = 30

def test_authentication_api_registration_and_login():
    session = requests.Session()
    headers = {
        "Content-Type": "application/json"
    }

    # Generate unique user data for registration
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    password = "Password123!"  # Strong password with special chars

    register_payload = {
        "email": unique_email,
        "password": password,
        "name": "Test User",  # API expects 'name' not 'full_name'
        "phone": f"+201{uuid.uuid4().int % 1000000000:09d}"  # Unique phone
    }

    user_id = None
    token = None

    try:
        # 1. Register user
        r_register = session.post(
            f"{BASE_URL}/auth/register",
            json=register_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert r_register.status_code == 201, f"Registration failed with status {r_register.status_code}"
        register_data = r_register.json()
        assert "user" in register_data and "id" in register_data["user"], "Registration response missing user id"
        assert "token" in register_data, "Registration response missing token"
        user_id = register_data["user"]["id"]
        token = register_data["token"]
        assert isinstance(token, str) and len(token) > 10, "Token is invalid"

        # 2. Login user with registered credentials
        login_payload = {
            "email": unique_email,
            "password": password
        }
        r_login = session.post(
            f"{BASE_URL}/auth/login",
            json=login_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert r_login.status_code == 200, f"Login failed with status {r_login.status_code}"
        login_data = r_login.json()
        assert "token" in login_data, "Login response missing token"
        login_token = login_data["token"]
        assert isinstance(login_token, str) and len(login_token) > 10, "Login token is invalid"

        # 3. Use token to get user profile
        profile_headers = {
            "Authorization": f"Bearer {login_token}"
        }
        r_profile = session.get(
            f"{BASE_URL}/auth/me",  # Correct endpoint is /auth/me
            headers=profile_headers,
            timeout=TIMEOUT,
        )
        assert r_profile.status_code == 200, f"Fetching profile failed with status {r_profile.status_code}"
        profile_data = r_profile.json()
        assert "email" in profile_data, "Profile response missing email"
        assert profile_data["email"] == unique_email, "Profile email does not match registered email"

        # 4. Test login failure with wrong password
        wrong_login_payload = {
            "email": unique_email,
            "password": "WrongPassword!"
        }
        r_wrong_login = session.post(
            f"{BASE_URL}/auth/login",
            json=wrong_login_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert r_wrong_login.status_code == 401 or r_wrong_login.status_code == 400, "Wrong password login did not fail as expected"

        # 5. Test social login endpoint (simulate Firebase login)
        # Assuming there is an endpoint /auth/social-login expecting provider and idToken
        social_login_payload = {
            "provider": "firebase",
            "idToken": "dummy-firebase-id-token"
        }
        r_social = session.post(
            f"{BASE_URL}/auth/social-login",
            json=social_login_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        # Social login with dummy token expected to fail, so check error handling
        if r_social.status_code not in (400, 401, 403, 500, 404):
            print(f"DEBUG: Social login unexpected status: {r_social.status_code}, Body: {r_social.text}")
        assert r_social.status_code in (400,401,403,500,404), "Social login with invalid token did not fail as expected"

    finally:
        # Cleanup: delete the created user if id available and admin token present
        if user_id:
            # Admin token from instructions for admin routes
            admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MjQ1MGY1My00ZjBmLTRjYTUtODZhYi1iNTVhODUyZmQ4MmYiLCJlbWFpbCI6ImFkbWluQGFsM2FtZXIuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY5ODEwNTk0LCJleHAiOjE3NzA0MTUzOTR9.5vI7sno3XTFNl1l82SWOlxmVD_5dBiUhu8cQrvir_gQ"
            try:
                delete_headers = {
                    "Authorization": f"Bearer {admin_token}"
                }
                resp_delete = session.delete(
                    f"{BASE_URL}/admin/users/{user_id}",
                    headers=delete_headers,
                    timeout=TIMEOUT
                )
                # Allow 200 or 204 as success for deletion
                assert resp_delete.status_code in (200, 204), f"User deletion failed with status {resp_delete.status_code}"
            except Exception:
                # Silently ignore errors on cleanup to not mask test results
                pass


test_authentication_api_registration_and_login()

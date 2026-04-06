import unittest
from unittest.mock import MagicMock

# Mocking the Supabase response structure
class MockResponse:
    def __init__(self, data):
        self.data = data

def resolve_user_id(supabase, user_id):
    try:
        user_res = supabase.table("users").select("id").eq("auth_user_id", user_id).single().execute()
        return user_res.data["id"] if user_res.data else user_id
    except Exception:
        return user_id

class TestUserIDResolution(unittest.TestCase):
    def test_resolution_success(self):
        supabase = MagicMock()
        # Case 1: Match found
        supabase.table().select().eq().single().execute.return_value = MockResponse({"id": "internal-uuid-123"})
        res = resolve_user_id(supabase, "auth-uuid-123")
        self.assertEqual(res, "internal-uuid-123")

    def test_resolution_no_match(self):
        supabase = MagicMock()
        # Case 2: No match found (returns original)
        supabase.table().select().eq().single().execute.return_value = MockResponse(None)
        res = resolve_user_id(supabase, "auth-uuid-456")
        self.assertEqual(res, "auth-uuid-456")

    def test_resolution_error(self):
        supabase = MagicMock()
        # Case 3: Exception (returns original)
        supabase.table().select().eq().single().execute.side_effect = Exception("DB Error")
        res = resolve_user_id(supabase, "auth-uuid-789")
        self.assertEqual(res, "auth-uuid-789")

if __name__ == "__main__":
    unittest.main()

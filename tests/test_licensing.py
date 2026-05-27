import unittest
from unittest.mock import patch, MagicMock, AsyncMock
from membrane import licensing

class TestLicensing(unittest.IsolatedAsyncioTestCase):
    def test_global_state_wrapper(self):
        licensing.license_state["validated"] = False
        self.assertFalse(licensing.global_state.license_active)
        licensing.global_state.license_active = True
        self.assertTrue(licensing.license_state["validated"])
        self.assertTrue(licensing.global_state.license_active)

    async def test_validate_polar_license_test_key(self):
        # Key 'test_license_key' should bypass Polar.sh check
        res = await licensing.validate_polar_license("test_license_key")
        self.assertTrue(res)

    @patch('aiohttp.ClientSession')
    async def test_validate_polar_license_active(self, mock_client_session):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"status": "active"})
        
        # Mock the async context manager context of session.post
        mock_post_cm = MagicMock()
        mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_post_cm.__aexit__ = AsyncMock(return_value=None)
        
        mock_session = MagicMock()
        mock_session.post = MagicMock(return_value=mock_post_cm)
        mock_session.close = AsyncMock()
        
        # When ClientSession() context manager is entered, return the mock session
        mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)
        
        res = await licensing.validate_polar_license("active_key")
        self.assertTrue(res)

    @patch('aiohttp.ClientSession')
    async def test_validate_polar_license_invalid(self, mock_client_session):
        mock_response = MagicMock()
        mock_response.status = 400
        mock_response.text = AsyncMock(return_value="validation_failed invalid key")
        
        mock_post_cm = MagicMock()
        mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_post_cm.__aexit__ = AsyncMock(return_value=None)
        
        mock_session = MagicMock()
        mock_session.post = MagicMock(return_value=mock_post_cm)
        mock_session.close = AsyncMock()
        
        mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)
        
        res = await licensing.validate_polar_license("invalid_key")
        self.assertFalse(res)

if __name__ == "__main__":
    unittest.main()

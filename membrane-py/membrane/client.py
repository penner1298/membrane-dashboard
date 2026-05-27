import os
from openai import OpenAI
from .swarm import Swarm

class MembraneClient:
    def __init__(self, base_url=None, api_key=None):
        self.base_url = base_url or os.environ.get("MEMBRANE_BASE_URL", "https://membrane-api.com/v1")
        self.api_key = api_key or os.environ.get("MEMBRANE_API_KEY", "local")
        self.client = OpenAI(base_url=self.base_url, api_key=self.api_key)
        self.swarm = Swarm(self)

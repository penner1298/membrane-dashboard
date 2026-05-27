import requests

class Swarm:
    def __init__(self, membrane_client):
        self.membrane = membrane_client

    def plan(self, payload):
        """
        Call /v1/swarm/plan to forecast cost, latency, and risk before running the swarm.
        """
        url = f"{self.membrane.base_url.rstrip('/')}/swarm/plan"
        headers = {
            "Authorization": f"Bearer {self.membrane.api_key}",
            "Content-Type": "application/json"
        }
        res = requests.post(url, json=payload, headers=headers)
        res.raise_for_status()
        return res.json()

    def map(self, payload):
        """
        Call /v1/swarm/map to run a parallel map-reduce job on documents/logs with strong isolation.
        """
        url = f"{self.membrane.base_url.rstrip('/')}/swarm/map"
        headers = {
            "Authorization": f"Bearer {self.membrane.api_key}",
            "Content-Type": "application/json"
        }
        res = requests.post(url, json=payload, headers=headers)
        res.raise_for_status()
        return res.json()

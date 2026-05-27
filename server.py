import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

from membrane.app import app, sanitize_exception_message
from membrane.routers.swarm import generate_swarm_plan

# Exposed for backwards-compatibility with test mocking
db_pool = None

if __name__ == "__main__":
    # Get port configuration (defaults to 8000)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("membrane.app:app", host="0.0.0.0", port=port, reload=True)
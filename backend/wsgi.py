# Import the Flask application object from your app.py file
from app import app

# This file is used by the Gunicorn server to run the application.
# The 'app' variable is the entry point.
if __name__ == "__main__":
    app.run()

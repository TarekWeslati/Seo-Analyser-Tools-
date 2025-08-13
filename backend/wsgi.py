# wsgi.py
# This file serves as the entry point for Gunicorn.
from backend.app import app

if __name__ == "__main__":
    app.run()

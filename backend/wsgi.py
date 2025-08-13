# wsgi.py
# This file serves as the entry point for Gunicorn.
# It imports the 'app' object from the 'app.py' file.

from app import app as application

if __name__ == "__main__":
    application.run()

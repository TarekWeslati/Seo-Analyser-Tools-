# This file serves as the entry point for the Gunicorn WSGI server.
# It imports the Flask application instance from backend.app.

from backend.app import app

# This block ensures the Flask app runs directly when the script is executed,
# which is useful for local development but Gunicorn handles it in production.
if __name__ == '__main__':
    app.run()

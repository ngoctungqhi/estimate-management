### `config.py`

# filepath: config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///estimate.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGIN = os.environ.get('CORS_ORIGIN', '*')
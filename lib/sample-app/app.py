"""
Sample Python Flask application for CI/CD pipeline demo.
"""
from flask import Flask, jsonify
import os

app = Flask(__name__)


@app.route('/')
def home():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'CI/CD Pipeline Application',
        'environment': os.getenv('ENVIRONMENT', 'unknown')
    })


@app.route('/health')
def health():
    """Health check endpoint for ALB."""
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)

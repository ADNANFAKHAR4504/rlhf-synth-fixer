#!/usr/bin/env python3
"""
Simple Flask web application for demonstration purposes.
This application provides health check endpoints and demonstrates environment variable usage.
"""

import os
import json
from datetime import datetime
from flask import Flask, jsonify, request
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Welcome to the WebApp!',
        'environment': os.getenv('ENVIRONMENT', 'unknown'),
        'region': os.getenv('AWS_DEFAULT_REGION', 'unknown')
    })

@app.route('/health')
def health():
    """Health check endpoint for ALB health checks"""
    return jsonify({
        'status': 'healthy',
        'timestamp': str(datetime.utcnow()),
        'environment': os.getenv('ENVIRONMENT', 'unknown')
    }), 200

@app.route('/config')
def config():
    """Configuration endpoint to show environment variables (excluding secrets)"""
    config_data = {
        'environment': os.getenv('ENVIRONMENT', 'unknown'),
        'region': os.getenv('AWS_DEFAULT_REGION', 'unknown'),
        'debug': os.getenv('DEBUG', 'false').lower() == 'true'
    }
    
    # Show that we have access to secrets without exposing them
    has_api_key = bool(os.getenv('API_KEY'))
    has_db_password = bool(os.getenv('DB_PASSWORD'))
    
    config_data['secrets_configured'] = {
        'api_key': has_api_key,
        'db_password': has_db_password
    }
    
    return jsonify(config_data)

@app.route('/metrics')
def metrics():
    """Simple metrics endpoint for monitoring"""
    return jsonify({
        'requests_processed': getattr(metrics, 'requests', 0),
        'status': 'running',
        'environment': os.getenv('ENVIRONMENT', 'unknown')
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    debug = os.getenv('DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Starting WebApp on port {port}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'unknown')}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
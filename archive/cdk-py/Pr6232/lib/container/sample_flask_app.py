"""
Sample Flask application for demonstration purposes.
This would typically be containerized and deployed to ECR.
"""
from flask import Flask, jsonify, request
import os
import json
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

app = Flask(__name__)

# Configure X-Ray
xray_recorder.configure(service='flask-api')
XRayMiddleware(app, xray_recorder)


def get_db_connection_info():
    """Retrieve database connection information from environment variables."""
    return {
        'host': os.environ.get('DB_HOST'),
        'port': os.environ.get('DB_PORT'),
        'database': os.environ.get('DB_NAME'),
        'username': os.environ.get('DB_USERNAME'),
    }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for ALB target group."""
    return jsonify({
        'status': 'healthy',
        'service': 'flask-api',
        'version': '1.0.0'
    }), 200


@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products from the catalog."""
    # In production, this would query the Aurora PostgreSQL database
    sample_products = [
        {
            'id': 1,
            'name': 'Sample Product 1',
            'price': 29.99,
            'category': 'Electronics'
        },
        {
            'id': 2,
            'name': 'Sample Product 2',
            'price': 49.99,
            'category': 'Books'
        }
    ]

    return jsonify({
        'products': sample_products,
        'count': len(sample_products)
    }), 200


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific product by ID."""
    # In production, this would query the database
    sample_product = {
        'id': product_id,
        'name': f'Product {product_id}',
        'price': 39.99,
        'category': 'General'
    }

    return jsonify(sample_product), 200


@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product."""
    data = request.get_json()

    # Validate input
    if not data or 'name' not in data or 'price' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # In production, this would insert into the database
    new_product = {
        'id': 123,
        'name': data['name'],
        'price': data['price'],
        'category': data.get('category', 'General')
    }

    return jsonify(new_product), 201


@app.route('/api/info', methods=['GET'])
def get_info():
    """Get service information and configuration."""
    db_info = get_db_connection_info()

    return jsonify({
        'service': 'flask-api',
        'version': '1.0.0',
        'region': os.environ.get('AWS_REGION'),
        'database': {
            'host': db_info['host'],
            'port': db_info['port'],
            'database': db_info['database']
        }
    }), 200


if __name__ == '__main__':
    # Run Flask application
    app.run(host='0.0.0.0', port=5000, debug=False)

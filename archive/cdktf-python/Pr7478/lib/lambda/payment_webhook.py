"""
Payment Webhook Handler Lambda Function

This Lambda function processes payment webhooks from Stripe and stores
transaction data in RDS PostgreSQL database.

FIX 3: This is the source file that gets packaged into payment_webhook.zip
"""

import json
import os
import boto3
import logging
from datetime import datetime

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')


def get_db_credentials():
    """Retrieve database credentials from Secrets Manager"""
    secret_arn = os.environ.get('DB_SECRET_ARN')

    if not secret_arn:
        raise ValueError("DB_SECRET_ARN environment variable not set")

    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(response['SecretString'])
        return secret['username'], secret['password']
    except Exception as e:
        logger.error(f"Failed to retrieve database credentials: {str(e)}")
        raise


def connect_to_database():
    """
    Connect to RDS PostgreSQL database

    Note: In production, you would use psycopg2 library.
    For this infrastructure code, we're simulating the connection.
    """
    db_host = os.environ.get('DB_HOST')
    db_name = os.environ.get('DB_NAME')
    username, password = get_db_credentials()

    logger.info(f"Connecting to database: {db_name} at {db_host}")

    # In real implementation:
    # import psycopg2
    # conn = psycopg2.connect(
    #     host=db_host,
    #     database=db_name,
    #     user=username,
    #     password=password
    # )
    # return conn

    return {
        'host': db_host,
        'database': db_name,
        'connected': True
    }


def validate_webhook_payload(event):
    """Validate incoming webhook payload"""
    body = event.get('body')

    if not body:
        raise ValueError("Empty request body")

    # Parse JSON body
    try:
        payload = json.loads(body) if isinstance(body, str) else body
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON payload")

    # Validate required fields
    required_fields = ['transaction_id', 'amount', 'currency', 'status']
    missing_fields = [f for f in required_fields if f not in payload]

    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    return payload


def store_transaction(db_conn, transaction_data):
    """Store transaction data in database"""
    logger.info(f"Storing transaction: {transaction_data.get('transaction_id')}")

    # In real implementation, execute INSERT query
    # cursor = db_conn.cursor()
    # cursor.execute(
    #     "INSERT INTO transactions (transaction_id, amount, currency, status, created_at) "
    #     "VALUES (%s, %s, %s, %s, %s)",
    #     (
    #         transaction_data['transaction_id'],
    #         transaction_data['amount'],
    #         transaction_data['currency'],
    #         transaction_data['status'],
    #         datetime.utcnow()
    #     )
    # )
    # db_conn.commit()

    return {
        'stored': True,
        'transaction_id': transaction_data.get('transaction_id'),
        'timestamp': datetime.utcnow().isoformat()
    }


def handler(event, context):
    """
    Main Lambda handler for payment webhooks

    Args:
        event: API Gateway event with webhook payload
        context: Lambda context object

    Returns:
        dict: Response with status code and body
    """
    logger.info(f"Received webhook event: {json.dumps(event)}")

    try:
        # Validate webhook payload
        transaction_data = validate_webhook_payload(event)

        # Connect to database
        db_conn = connect_to_database()

        # Store transaction
        result = store_transaction(db_conn, transaction_data)

        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Payment webhook processed successfully',
                'transaction_id': result['transaction_id'],
                'timestamp': result['timestamp']
            })
        }

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Bad Request',
                'message': str(e)
            })
        }

    except Exception as e:
        logger.error(f"Internal error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'Failed to process payment webhook'
            })
        }

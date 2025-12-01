"""Lambda function for payment webhook processing."""

import json
import os
import boto3
from botocore.exceptions import ClientError

# X-Ray SDK for tracing
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
    XRAY_AVAILABLE = True
except ImportError:
    XRAY_AVAILABLE = False
    print("Warning: X-Ray SDK not available, tracing disabled")


# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')


def get_database_credentials():
    """Retrieve database credentials from Secrets Manager."""
    secret_arn = os.environ['DB_SECRET_ARN']
    
    try:
        response = secretsmanager.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except ClientError as e:
        print(f"Error retrieving secret: {e}")
        raise


def store_session_data(session_id, payment_data):
    """Store payment session data in DynamoDB."""
    table_name = os.environ['DYNAMODB_TABLE']
    table = dynamodb.Table(table_name)
    
    try:
        response = table.put_item(
            Item={
                'session_id': session_id,
                'payment_data': json.dumps(payment_data),
                'region': os.environ['REGION'],
                'environment': os.environ['ENVIRONMENT']
            }
        )
        return response
    except ClientError as e:
        print(f"Error storing session data: {e}")
        raise


def handler(event, context):
    """
    Lambda handler for payment webhook processing.

    This function processes incoming payment webhooks, stores session data
    in DynamoDB, and can interact with the Aurora database if needed.
    """
    # Add X-Ray annotations if available and segment is active
    if XRAY_AVAILABLE:
        try:
            # Check if there's an active segment before adding annotations
            segment = xray_recorder.current_segment()
            if segment and not getattr(segment, 'is_facade', False):
                xray_recorder.put_annotation('environment', os.environ.get('ENVIRONMENT', 'unknown'))
                xray_recorder.put_annotation('region', os.environ.get('REGION', 'unknown'))
        except Exception as e:
            # Silently ignore X-Ray errors (FacadeSegmentMutationException during testing)
            print(f"X-Ray annotation skipped: {e}")

    print(f"Processing webhook in region: {os.environ['REGION']}")
    print(f"Environment: {os.environ['ENVIRONMENT']}")

    try:
        # Parse incoming webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        # Extract session ID and payment data
        session_id = body.get('session_id', 'unknown')
        payment_data = body.get('payment_data', {})
        
        print(f"Processing session: {session_id}")
        
        # Store session data in DynamoDB global table
        store_session_data(session_id, payment_data)
        
        # In production, you would also:
        # 1. Get database credentials
        # 2. Connect to Aurora database
        # 3. Process payment transaction
        # 4. Update payment status
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment webhook processed successfully',
                'session_id': session_id,
                'region': os.environ['REGION']
            })
        }
    
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing payment webhook',
                'error': str(e)
            })
        }

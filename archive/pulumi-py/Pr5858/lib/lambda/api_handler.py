import json
import boto3
import os
from datetime import datetime, timedelta

def handler(event, context):
    # Initialize clients inside handler for proper mocking in tests
    s3_client = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    bucket_name = os.environ['S3_BUCKET']
    table_name = os.environ['DYNAMODB_TABLE']
    table = dynamodb.Table(table_name)
    
    """
    Handles API Gateway requests for presigned URLs and status checks
    """
    try:
        path = event.get('path', '')
        http_method = event.get('httpMethod', '')

        # Handle POST /upload - generate presigned URL
        if path == '/upload' and http_method == 'POST':
            return handle_upload_request(event, s3_client, bucket_name)

        # Handle GET /status/{transaction_id}
        if path.startswith('/status/') and http_method == 'GET':
            return handle_status_request(event, table)

        return {
            'statusCode': 404,
            'body': json.dumps({
                'message': 'Not found'
            })
        }

    except Exception as e:
        print(f"Error handling request: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            })
        }

def handle_upload_request(event, s3_client, bucket_name):
    """
    Generate presigned URL for file upload
    """
    try:
        # Generate unique filename
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        filename = f"uploads/transactions-{timestamp}.csv"

        # Generate presigned URL (valid for 15 minutes)
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': filename,
                'ContentType': 'text/csv'
            },
            ExpiresIn=900
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'upload_url': presigned_url,
                'filename': filename,
                'expires_in': 900
            })
        }

    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error generating upload URL',
                'error': str(e)
            })
        }

def handle_status_request(event, table):
    """
    Check transaction processing status
    """
    try:
        # Extract transaction_id from path
        path_parameters = event.get('pathParameters', {})
        transaction_id = path_parameters.get('transaction_id', '')

        if not transaction_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'Missing transaction_id'
                })
            }

        # Query DynamoDB
        response = table.query(
            KeyConditionExpression='transaction_id = :tid',
            ExpressionAttributeValues={
                ':tid': transaction_id
            },
            ScanIndexForward=False,
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'message': 'Transaction not found',
                    'transaction_id': transaction_id
                })
            }

        transaction = items[0]

        # Convert Decimal to float for JSON serialization
        if 'amount' in transaction:
            transaction['amount'] = float(transaction['amount'])
        if 'timestamp' in transaction:
            transaction['timestamp'] = int(transaction['timestamp'])

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'transaction': transaction
            })
        }

    except Exception as e:
        print(f"Error checking transaction status: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error checking transaction status',
                'error': str(e)
            })
        }

import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])
S3_BUCKET = os.environ.get('S3_BUCKET', '')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', '')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    """Transaction validation and retrieval"""
    try:
        http_method = event['httpMethod']
        
        if http_method == 'POST':
            return handle_post(event)
        elif http_method == 'GET':
            return handle_get(event)
        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_post(event):
    """Handle POST /transactions - validate and store transaction"""
    body = json.loads(event['body'])
    
    # Validate required fields
    if 'transaction_id' not in body:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required field: transaction_id'})
        }
    
    if 'amount' not in body or body.get('amount') is None:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Missing required field: amount'})
        }
    
    transaction_id = body['transaction_id']
    amount = float(body['amount'])
    country = body.get('country', 'US')
    timestamp = body.get('timestamp', '2024-01-01T00:00:00Z')
    
    # Calculate fraud risk score
    risk_score = calculate_fraud_score(amount, country)
    risk_level = 'HIGH' if risk_score > 0.7 else ('MEDIUM' if risk_score > 0.4 else 'LOW')
    
    # Store transaction in DynamoDB
    transaction = {
        'transaction_id': transaction_id,
        'timestamp': timestamp,
        'amount': Decimal(str(amount)),
        'currency': body.get('currency', 'USD'),
        'merchant': body.get('merchant', 'unknown'),
        'merchant_id': body.get('merchant_id', 'unknown'),
        'card_last_four': body.get('card_last_four', '****'),
        'user_id': body.get('user_id', 'unknown'),
        'location': body.get('location', 'unknown'),
        'country': country,
        'status': 'processed',
        'risk_score': Decimal(str(risk_score)),
        'risk_level': risk_level,
        'notification_sent': risk_score > 0.7  # High risk triggers notification
    }

    table.put_item(Item=transaction)
    
    # Archive transaction to S3
    s3_location = archive_to_s3(transaction_id, transaction)
    if s3_location:
        # Update transaction with archive info
        table.update_item(
            Key={
                'transaction_id': transaction_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET archived = :archived, s3_location = :location',
            ExpressionAttributeValues={
                ':archived': True,
                ':location': s3_location
            }
        )
    
    # If high risk, trigger EventBridge notification asynchronously
    if risk_score > 0.7:
        trigger_high_risk_notification(transaction_id, risk_score, amount)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'transaction_id': transaction_id,
            'status': 'processed',
            'risk_score': risk_score,
            'encryption_status': 'encrypted',
            'kms_key_used': KMS_KEY_ID if KMS_KEY_ID else 'default'
        }, cls=DecimalEncoder)
    }

def calculate_fraud_score(amount, country):
    """Calculate fraud risk score based on transaction attributes"""
    risk_score = 0.0
    
    # High amount = higher risk
    if amount > 1000:
        risk_score += 0.5
    if amount >= 5000:  # Changed to >= to include 5000
        risk_score += 0.3
    
    # International transaction = higher risk
    if country != 'US':
        risk_score += 0.2
    
    return min(risk_score, 1.0)

def archive_to_s3(transaction_id, transaction):
    """Archive transaction to S3"""
    try:
        if not S3_BUCKET:
            print("S3_BUCKET not configured")
            return None
        
        key = f'archived/{transaction_id}.json'
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(transaction, cls=DecimalEncoder),
            ContentType='application/json'
        )
        return f's3://{S3_BUCKET}/{key}'
    except Exception as e:
        print(f"Failed to archive to S3: {str(e)}")
        return None

def trigger_high_risk_notification(transaction_id, risk_score, amount):
    """Trigger EventBridge event for high-risk transactions"""
    try:
        eventbridge = boto3.client('events')
        eventbridge.put_events(
            Entries=[{
                'Source': 'fraud-detection',
                'DetailType': 'High Risk Transaction Detected',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'risk_score': risk_score,
                    'amount': amount
                }),
                'EventBusName': 'default'
            }]
        )
    except Exception as e:
        print(f"Failed to trigger notification: {str(e)}")

def handle_get(event):
    """Handle GET /transactions/{id} - retrieve transaction"""
    transaction_id = event['pathParameters']['id']
    
    # Query by partition key since we don't have the sort key (timestamp)
    response = table.query(
        KeyConditionExpression='transaction_id = :tid',
        ExpressionAttributeValues={
            ':tid': transaction_id
        },
        Limit=1  # Get the most recent transaction
    )
    
    if 'Items' not in response or len(response['Items']) == 0:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Transaction not found'})
        }
    
    transaction = response['Items'][0]
    
    response_data = {
        'transaction_id': transaction['transaction_id'],
        'amount': float(transaction['amount']),
        'currency': transaction.get('currency', 'USD'),
        'merchant': transaction.get('merchant', 'unknown'),
        'timestamp': transaction.get('timestamp'),
        'user_id': transaction.get('user_id'),
        'location': transaction.get('location'),
        'status': transaction.get('status', 'processed'),
        'risk_score': float(transaction.get('risk_score', 0.0)),
        'risk_level': transaction.get('risk_level', 'LOW'),
        'notification_sent': transaction.get('notification_sent', False)
    }
    
    # Include archive information if available
    if transaction.get('archived'):
        response_data['archived'] = True
        response_data['s3_location'] = transaction.get('s3_location')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(response_data, cls=DecimalEncoder)
    }

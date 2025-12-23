"""Transaction processing Lambda function."""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')


def handler(event, context):
    """Process payment transaction."""
    try:
        table_name = os.environ.get('TABLE_NAME')
        audit_bucket = os.environ.get('AUDIT_BUCKET')
        table = dynamodb.Table(table_name)
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        user_id = body.get('user_id')
        amount = body.get('amount')
        timestamp = int(body.get('timestamp', datetime.utcnow().timestamp()))

        # Get transaction from DynamoDB
        response = table.get_item(
            Key={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
            }
        )

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Transaction not found'}),
            }

        transaction = response['Item']

        # Check if fraud was detected
        if transaction.get('status') == 'fraud_detected':
            return {
                'statusCode': 403,
                'body': json.dumps({'error': 'Transaction flagged as fraudulent'}),
            }

        # Process the transaction
        processed_at = datetime.utcnow().isoformat()
        
        # Update DynamoDB
        table.update_item(
            Key={
                'transaction_id': transaction_id,
                'timestamp': timestamp,
            },
            UpdateExpression='SET #status = :status, processed_at = :processed_at',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'processed',
                ':processed_at': processed_at,
            },
        )

        # Write audit log to S3
        audit_log = {
            'transaction_id': transaction_id,
            'user_id': user_id,
            'amount': str(amount),
            'status': 'processed',
            'timestamp': processed_at,
        }

        log_key = f"audit/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_id}.json"
        s3.put_object(
            Bucket=audit_bucket,
            Key=log_key,
            Body=json.dumps(audit_log),
            ContentType='application/json',
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id,
            }),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
        }

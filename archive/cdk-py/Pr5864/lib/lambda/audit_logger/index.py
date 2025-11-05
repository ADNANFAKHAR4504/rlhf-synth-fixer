import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

table_name = os.environ['DYNAMODB_TABLE']
audit_bucket = os.environ['AUDIT_BUCKET']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Audit logger Lambda function
    Logs all payment activities to S3 for compliance
    Can also be used to retrieve system status
    """
    try:
        # Check if this is a status request
        http_method = event.get('httpMethod', '')

        if http_method == 'GET':
            # Return system status
            # Query recent transactions
            response = table.scan(Limit=10)

            transaction_count = response.get('Count', 0)

            status = {
                'status': 'operational',
                'timestamp': datetime.utcnow().isoformat(),
                'recent_transactions': transaction_count,
                'services': {
                    'validator': 'operational',
                    'processor': 'operational',
                    'audit_logger': 'operational'
                }
            }

            return {
                'statusCode': 200,
                'body': json.dumps(status)
            }

        # POST request - log audit event
        body = json.loads(event.get('body', '{}'))

        # Create audit log entry
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': body.get('event_type', 'unknown'),
            'transaction_id': body.get('transaction_id'),
            'details': body.get('details', {}),
            'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp'),
            'user_agent': event.get('requestContext', {}).get('identity', {}).get('userAgent')
        }

        # Write to S3
        s3_key = f"audit-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{datetime.utcnow().timestamp()}.json"

        s3.put_object(
            Bucket=audit_bucket,
            Key=s3_key,
            Body=json.dumps(audit_entry),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )

        # Also log to DynamoDB if transaction_id provided
        if body.get('transaction_id'):
            timestamp = int(datetime.utcnow().timestamp() * 1000)
            table.put_item(
                Item={
                    'transaction_id': body['transaction_id'],
                    'timestamp': timestamp,
                    'status': 'audited',
                    'audit_log_s3_key': s3_key,
                    'event_type': audit_entry['event_type']
                }
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Audit log created successfully',
                's3_key': s3_key
            })
        }

    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error during audit logging'
            })
        }

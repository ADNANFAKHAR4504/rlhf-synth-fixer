import json
import os
import boto3
import time
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get environment variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
S3_AUDIT_BUCKET = os.environ.get('S3_AUDIT_BUCKET')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX')

# Get DynamoDB table (lazy initialization)
table = None
if DYNAMODB_TABLE_NAME:
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)


def lambda_handler(event, context):
    """
    Main Lambda handler for fraud detection webhook processing
    """
    try:
        # Determine event source
        if 'source' in event and event['source'] == 'eventbridge-batch-processing':
            return handle_batch_processing(event, context)
        else:
            return handle_webhook(event, context)

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        raise


def handle_webhook(event, context):
    """
    Handle incoming webhook POST requests from API Gateway
    """
    try:
        # Parse webhook payload
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        # Extract fraud detection data
        transaction_id = body.get('transaction_id', 'unknown')
        pattern_data = body.get('pattern_data', {})
        risk_score = body.get('risk_score', 0)

        # Generate pattern ID
        pattern_id = f"pattern-{transaction_id}"
        timestamp = int(time.time())

        # Store pattern in DynamoDB
        table.put_item(
            Item={
                'pattern_id': pattern_id,
                'timestamp': timestamp,
                'transaction_id': transaction_id,
                'risk_score': Decimal(str(risk_score)),
                'pattern_data': json.dumps(pattern_data),
                'processed_at': datetime.utcnow().isoformat(),
                'environment': ENVIRONMENT_SUFFIX
            }
        )

        # Store audit trail in S3
        audit_key = f"audit/{datetime.utcnow().strftime('%Y/%m/%d')}/{pattern_id}-{timestamp}.json"
        s3.put_object(
            Bucket=S3_AUDIT_BUCKET,
            Key=audit_key,
            Body=json.dumps({
                'pattern_id': pattern_id,
                'timestamp': timestamp,
                'transaction_id': transaction_id,
                'risk_score': risk_score,
                'pattern_data': pattern_data,
                'event': event
            }, default=str),
            ContentType='application/json'
        )

        # Determine action based on risk score
        action = 'approve' if risk_score < 50 else 'review' if risk_score < 80 else 'block'

        print(f"Processed fraud detection event - Pattern: {pattern_id}, Risk: {risk_score}, Action: {action}")

        # Return response for API Gateway
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'pattern_id': pattern_id,
                'timestamp': timestamp,
                'action': action,
                'risk_score': risk_score,
                'message': 'Fraud detection event processed successfully'
            })
        }

    except Exception as e:
        print(f"Error handling webhook: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }


def handle_batch_processing(event, context):
    """
    Handle EventBridge scheduled batch processing
    """
    try:
        print(f"Starting batch fraud pattern analysis - Environment: {ENVIRONMENT_SUFFIX}")

        # Query recent patterns (last 5 minutes)
        current_time = int(time.time())
        five_minutes_ago = current_time - 300

        # Scan DynamoDB for recent high-risk patterns
        response = table.scan(
            FilterExpression='#ts > :time_threshold AND risk_score > :risk_threshold',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':time_threshold': five_minutes_ago,
                ':risk_threshold': Decimal('70')
            }
        )

        high_risk_patterns = response.get('Items', [])

        print(f"Found {len(high_risk_patterns)} high-risk patterns in batch analysis")

        # Store batch analysis results in S3
        batch_key = f"batch-analysis/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}-analysis.json"
        s3.put_object(
            Bucket=S3_AUDIT_BUCKET,
            Key=batch_key,
            Body=json.dumps({
                'analysis_time': datetime.utcnow().isoformat(),
                'patterns_analyzed': len(high_risk_patterns),
                'high_risk_count': len(high_risk_patterns),
                'patterns': high_risk_patterns
            }, default=str),
            ContentType='application/json'
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Batch processing completed',
                'patterns_analyzed': len(high_risk_patterns)
            })
        }

    except Exception as e:
        print(f"Error in batch processing: {str(e)}")
        raise

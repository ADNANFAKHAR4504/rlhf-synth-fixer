"""validation.py - Transaction Validation Handler"""

import json
import os
from datetime import datetime
from decimal import Decimal
import boto3

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
OUTPUT_QUEUE_URL = os.environ['OUTPUT_QUEUE_URL']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """
    Validation Lambda handler

    Processes transactions:
    1. Applies business rules
    2. Performs fraud checks
    3. Updates DynamoDB status
    4. Sends to enrichment queue
    5. Publishes metrics
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Extract transaction ID
        if 'Records' in event:
            # SQS event source
            record = event['Records'][0]
            message_body = json.loads(record['body'])
            transaction_id = message_body['transactionId']
        else:
            # Direct invocation
            transaction_id = event['transactionId']

        # Retrieve transaction from DynamoDB
        response = table.get_item(Key={'transactionId': transaction_id})

        if 'Item' not in response:
            raise ValueError(f"Transaction {transaction_id} not found")

        item = response['Item']

        # Parse raw data
        raw_data = json.loads(item['rawData'])

        # Apply business rules
        validation_result = apply_business_rules(raw_data)

        # Perform fraud check
        fraud_result = check_fraud(raw_data)

        # Determine final status
        if validation_result['valid'] and not fraud_result['is_fraud']:
            status = 'VALIDATED'
        else:
            status = 'VALIDATION_FAILED'
            reasons = []
            if not validation_result['valid']:
                reasons.extend(validation_result['reasons'])
            if fraud_result['is_fraud']:
                reasons.append(f"Fraud detected: {fraud_result['reason']}")

            # Update item with failure reasons
            item['validationFailureReasons'] = reasons

        # Update DynamoDB
        timestamp = datetime.utcnow().isoformat()
        table.update_item(
            Key={'transactionId': transaction_id},
            UpdateExpression='SET #status = :status, #timestamp = :timestamp, stage = :stage, validationScore = :score',
            ExpressionAttributeNames={
                '#status': 'status',
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues={
                ':status': status,
                ':timestamp': timestamp,
                ':stage': 'validation',
                ':score': Decimal(str(validation_result.get('score', 0)))
            }
        )
        print(f"Updated transaction {transaction_id} status to {status}")

        # If validated, send to enrichment queue
        if status == 'VALIDATED':
            message_body = {
                'transactionId': transaction_id,
                'status': 'READY_FOR_ENRICHMENT',
                'timestamp': timestamp,
                'validationScore': validation_result.get('score', 0)
            }

            sqs.send_message(
                QueueUrl=OUTPUT_QUEUE_URL,
                MessageBody=json.dumps(message_body)
            )
            print(f"Sent transaction {transaction_id} to enrichment queue")

            # Publish success metric
            publish_metric('ProcessingRate', 1, 'Count')
        else:
            # Publish error metric for failed validation
            publish_metric('ErrorCount', 1, 'Count')

            # Send failure notification
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Transaction Validation Failed',
                Message=json.dumps({
                    'stage': 'validation',
                    'transactionId': transaction_id,
                    'reasons': item.get('validationFailureReasons', []),
                    'timestamp': timestamp
                })
            )

        return {
            'statusCode': 200,
            'transactionId': transaction_id,
            'status': status,
            'timestamp': timestamp
        }

    except Exception as e:
        print(f"Error in validation: {str(e)}")

        # Publish error metric
        publish_metric('ErrorCount', 1, 'Count')

        # Send failure notification
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject='Transaction Validation Error',
                Message=json.dumps({
                    'stage': 'validation',
                    'transactionId': event.get('transactionId', 'unknown'),
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sns_error:
            print(f"Failed to send SNS notification: {str(sns_error)}")

        raise


def apply_business_rules(data):
    """Apply business validation rules"""
    reasons = []
    score = 100

    # Rule 1: Amount limits
    amount = float(data.get('amount', 0))
    if amount > 10000:
        reasons.append("Amount exceeds limit of 10000")
        score -= 50

    # Rule 2: Currency validation
    valid_currencies = ['USD', 'EUR', 'GBP', 'JPY']
    currency = data.get('currency', '')
    if currency not in valid_currencies:
        reasons.append(f"Invalid currency: {currency}")
        score -= 30

    # Rule 3: Merchant validation
    merchant_id = data.get('merchantId', '')
    if not merchant_id or len(merchant_id) < 5:
        reasons.append("Invalid merchant ID")
        score -= 20

    # Rule 4: Customer validation
    customer_id = data.get('customerId', '')
    if not customer_id or len(customer_id) < 5:
        reasons.append("Invalid customer ID")
        score -= 20

    return {
        'valid': len(reasons) == 0,
        'reasons': reasons,
        'score': max(0, score)
    }


def check_fraud(data):
    """Perform fraud detection checks"""
    # Simple fraud detection logic
    amount = float(data.get('amount', 0))

    # Flag high-value transactions
    if amount > 5000:
        return {
            'is_fraud': True,
            'reason': 'High-value transaction requires manual review',
            'risk_score': 75
        }

    # Flag suspicious patterns (example: multiple small transactions)
    # In production, this would use ML models or rule engines

    return {
        'is_fraud': False,
        'reason': None,
        'risk_score': 10
    }


def publish_metric(metric_name, value, unit):
    """Publish custom CloudWatch metric"""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'TransactionPipeline/{ENVIRONMENT_SUFFIX}',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Failed to publish metric: {str(e)}")

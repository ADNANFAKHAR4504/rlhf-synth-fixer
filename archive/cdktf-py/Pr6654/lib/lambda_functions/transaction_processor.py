import json
import os
import time
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
ssm = boto3.client('ssm')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment = os.environ['ENVIRONMENT']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Process incoming transaction and store in DynamoDB.
    Detect fraud patterns and publish alerts to SNS.
    """
    try:
        # Parse request body
        body = json.loads(event['body'])

        transaction_id = body['transaction_id']
        user_id = body['user_id']
        amount = Decimal(str(body['amount']))
        timestamp = int(time.time())

        # Get fraud threshold from Parameter Store
        threshold_param = ssm.get_parameter(
            Name=f'/fraud-detection/{environment}/fraud_threshold'
        )
        fraud_threshold = float(threshold_param['Parameter']['Value'])

        # Simple fraud detection logic
        is_suspicious = amount > Decimal('10000') or amount < Decimal('0')
        fraud_score = 0.9 if is_suspicious else 0.1

        # Store transaction in DynamoDB
        item = {
            'transaction_id': transaction_id,
            'timestamp': timestamp,
            'user_id': user_id,
            'amount': amount,
            'merchant': body.get('merchant', 'Unknown'),
            'location': body.get('location', 'Unknown'),
            'fraud_score': Decimal(str(fraud_score)),
            'is_suspicious': is_suspicious
        }

        table.put_item(Item=item)

        # Publish alert if fraud detected
        if fraud_score > fraud_threshold:
            message = {
                'transaction_id': transaction_id,
                'user_id': user_id,
                'amount': str(amount),
                'fraud_score': fraud_score,
                'timestamp': timestamp
            }

            sns.publish(
                TopicArn=sns_topic_arn,
                Message=json.dumps(message),
                Subject='Fraud Alert - Suspicious Transaction Detected'
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id,
                'fraud_score': fraud_score
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

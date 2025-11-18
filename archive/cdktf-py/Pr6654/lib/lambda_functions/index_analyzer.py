import json
import os
import time
from datetime import datetime, timedelta
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

table_name = os.environ['DYNAMODB_TABLE']
sns_topic_arn = os.environ['SNS_TOPIC_ARN']
environment = os.environ['ENVIRONMENT']

table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Analyze transaction patterns to detect fraud.
    Runs every 5 minutes via EventBridge.
    """
    try:
        # Get transactions from last 5 minutes
        current_time = int(time.time())
        five_minutes_ago = current_time - 300

        # Scan for recent suspicious transactions
        response = table.scan(
            FilterExpression='#ts > :start_time AND is_suspicious = :suspicious',
            ExpressionAttributeNames={
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues={
                ':start_time': five_minutes_ago,
                ':suspicious': True
            }
        )

        suspicious_transactions = response.get('Items', [])

        if len(suspicious_transactions) > 5:
            # Multiple suspicious transactions detected
            user_ids = [t['user_id'] for t in suspicious_transactions]

            message = {
                'alert_type': 'pattern_analysis',
                'suspicious_count': len(suspicious_transactions),
                'affected_users': list(set(user_ids)),
                'timestamp': current_time,
                'time_window': '5 minutes'
            }

            sns.publish(
                TopicArn=sns_topic_arn,
                Message=json.dumps(message),
                Subject='Fraud Alert - Multiple Suspicious Transactions Detected'
            )

            print(f"Alert sent: {len(suspicious_transactions)} suspicious transactions detected")
        else:
            print(f"Pattern analysis complete: {len(suspicious_transactions)} suspicious transactions found")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Pattern analysis complete',
                'suspicious_count': len(suspicious_transactions)
            })
        }

    except Exception as e:
        print(f"Error analyzing patterns: {str(e)}")
        raise

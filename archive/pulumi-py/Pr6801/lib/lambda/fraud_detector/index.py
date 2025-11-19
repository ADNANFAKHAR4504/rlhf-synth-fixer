import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

# X-Ray instrumentation (FIX #12)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

TRANSACTION_TABLE = os.environ['TRANSACTION_TABLE']
FRAUD_TOPIC_ARN = os.environ['FRAUD_TOPIC_ARN']

transaction_table = dynamodb.Table(TRANSACTION_TABLE)


def handler(event, context):
    """
    Processes transactions from SQS and performs fraud detection.
    Enhanced with improved fraud detection logic using GSI. (FIX #13)
    """
    try:
        for record in event['Records']:
            message = json.loads(record['body'])

            transaction_id = message['transaction_id']
            merchant_id = message['merchant_id']
            amount = Decimal(str(message['amount']))
            timestamp = int(datetime.utcnow().timestamp())

            # Simple fraud detection logic
            is_fraud = False
            fraud_score = 0
            fraud_reasons = []

            # Check for high amount transactions
            if amount > Decimal('5000'):
                fraud_score += 30
                fraud_reasons.append('High transaction amount')

            # Check for very high amount transactions
            if amount > Decimal('10000'):
                fraud_score += 30
                fraud_reasons.append('Very high transaction amount')

            # Check for rapid transactions from same merchant (FIX #13)
            # Use GSI to query by merchant_id
            with xray_recorder.capture('query_merchant_transactions'):
                one_hour_ago = timestamp - 3600
                response = transaction_table.query(
                    IndexName='MerchantIndex',
                    KeyConditionExpression='merchant_id = :mid AND #ts > :time',
                    ExpressionAttributeNames={
                        '#ts': 'timestamp'
                    },
                    ExpressionAttributeValues={
                        ':mid': merchant_id,
                        ':time': one_hour_ago
                    },
                    Limit=20
                )

            # Check if there are too many transactions in the last hour
            recent_transaction_count = response.get('Count', 0)
            if recent_transaction_count > 10:
                fraud_score += 40
                fraud_reasons.append(f'High frequency: {recent_transaction_count} transactions in last hour')

            # Calculate total amount in last hour
            total_amount = sum(Decimal(str(item.get('amount', 0))) for item in response.get('Items', []))
            if total_amount > Decimal('20000'):
                fraud_score += 20
                fraud_reasons.append(f'High volume: ${total_amount} in last hour')

            # Determine if fraud
            if fraud_score >= 50:
                is_fraud = True

            # Store transaction in DynamoDB with X-Ray subsegment
            with xray_recorder.capture('store_transaction'):
                transaction_table.put_item(
                    Item={
                        'transaction_id': transaction_id,
                        'timestamp': timestamp,
                        'merchant_id': merchant_id,
                        'amount': amount,
                        'is_fraud': is_fraud,
                        'fraud_score': fraud_score,
                        'fraud_reasons': fraud_reasons if is_fraud else [],
                        'status': 'fraud_detected' if is_fraud else 'processed',
                        'processed_at': datetime.utcnow().isoformat()
                    }
                )

            # Send fraud alert if detected
            if is_fraud:
                with xray_recorder.capture('send_fraud_alert'):
                    sns.publish(
                        TopicArn=FRAUD_TOPIC_ARN,
                        Subject=f'Fraud Alert - Transaction {transaction_id}',
                        Message=json.dumps({
                            'transaction_id': transaction_id,
                            'merchant_id': merchant_id,
                            'amount': str(amount),
                            'fraud_score': fraud_score,
                            'fraud_reasons': fraud_reasons,
                            'timestamp': timestamp,
                            'detected_at': datetime.utcnow().isoformat()
                        }, indent=2)
                    )
                print(f"FRAUD DETECTED: Transaction {transaction_id}, Score: {fraud_score}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Transactions processed successfully'})
        }

    except Exception as e:
        print(f"Error in fraud detection: {str(e)}")
        xray_recorder.current_subsegment().put_annotation('error', str(e))
        raise
import json
import boto3
import os
from decimal import Decimal

def handler(event, context):
    # Initialize clients inside handler for proper mocking in tests
    sns_client = boto3.client('sns')
    topic_arn = os.environ['SNS_TOPIC_ARN']
    """
    Detects anomalies in transaction stream from DynamoDB
    """
    try:
        anomalies = []

        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                # Get new image
                new_image = record['dynamodb'].get('NewImage', {})

                if not new_image:
                    continue

                # Extract transaction data
                transaction_id = new_image.get('transaction_id', {}).get('S', '')
                amount = float(new_image.get('amount', {}).get('N', 0))

                # Simple anomaly detection rules
                is_anomaly = False
                reason = []

                # Rule 1: High transaction amount
                if amount > 10000:
                    is_anomaly = True
                    reason.append(f"High transaction amount: ${amount}")

                # Rule 2: Very low transaction amount (potential card testing)
                if amount < 1:
                    is_anomaly = True
                    reason.append(f"Suspicious low amount: ${amount}")

                if is_anomaly:
                    anomalies.append({
                        'transaction_id': transaction_id,
                        'amount': amount,
                        'reasons': reason
                    })

        # Send alerts for detected anomalies
        if anomalies:
            message = {
                'alert_type': 'Transaction Anomaly',
                'count': len(anomalies),
                'anomalies': anomalies
            }

            sns_client.publish(
                TopicArn=topic_arn,
                Subject='Transaction Anomaly Detected',
                Message=json.dumps(message, indent=2)
            )

            print(f"Sent alert for {len(anomalies)} anomalies")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Stream processed successfully',
                'anomalies_detected': len(anomalies)
            })
        }

    except Exception as e:
        print(f"Error processing stream: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing stream',
                'error': str(e)
            })
        }

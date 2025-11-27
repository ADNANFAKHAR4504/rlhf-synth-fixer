import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Processes successfully matched alerts from AlertMatcher via Lambda destinations.
    Updates alert status to 'notified' and records notification timestamp.
    """
    print(f'Processing successful alert matches: {json.dumps(event)}')

    try:
        # Extract matched alerts from event payload
        # Lambda destinations wrap the response in responsePayload
        response_payload = event.get('responsePayload', event)
        matched_alerts = response_payload.get('alerts', [])

        processed_count = 0
        for alert in matched_alerts:
            user_id = alert.get('userId', 'unknown')
            alert_id = alert.get('alertId', 'unknown')
            symbol = alert.get('symbol', 'UNKNOWN')
            current_price = alert.get('currentPrice', 0)

            try:
                # Update alert status to 'notified'
                table.update_item(
                    Key={
                        'userId': user_id,
                        'alertId': alert_id
                    },
                    UpdateExpression='SET #status = :status, notifiedAt = :timestamp, lastPrice = :price',
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues={
                        ':status': 'notified',
                        ':timestamp': datetime.utcnow().isoformat(),
                        ':price': str(current_price)
                    }
                )

                processed_count += 1
                print(f'Updated alert {alert_id} for user {user_id}: {symbol} @ ${current_price}')

                # For complete implementation, trigger SNS notification to user

            except Exception as e:
                print(f'Error updating alert {alert_id}: {str(e)}')
                continue

        return {
            'statusCode': 200,
            'processedCount': processed_count,
            'totalAlerts': len(matched_alerts),
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f'Error processing alerts: {str(e)}')
        raise

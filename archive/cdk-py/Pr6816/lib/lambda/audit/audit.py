"""Audit logger Lambda function"""
import json
import os
from datetime import datetime


def handler(event, context):
    """Log DynamoDB stream events for audit trail"""
    try:
        for record in event.get('Records', []):
            event_name = record.get('eventName')

            if event_name in ['INSERT', 'MODIFY', 'REMOVE']:
                # Extract data from stream record
                keys = record.get('dynamodb', {}).get('Keys', {})
                new_image = record.get('dynamodb', {}).get('NewImage', {})
                old_image = record.get('dynamodb', {}).get('OldImage', {})

                # Create audit log entry
                audit_entry = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'eventName': event_name,
                    'webhookId': keys.get('webhookId', {}).get('S'),
                    'recordTimestamp': keys.get('timestamp', {}).get('S'),
                    'changes': {
                        'old': deserialize_dynamodb_item(old_image),
                        'new': deserialize_dynamodb_item(new_image),
                    }
                }

                # Log to CloudWatch Logs for audit trail
                # CloudWatch Logs Insights can be used to query these logs
                print(json.dumps(audit_entry))

                # In production, consider:
                # 1. Writing to separate audit table
                # 2. Sending to S3 for long-term retention
                # 3. Triggering compliance notifications
                # 4. Integrating with SIEM systems

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Audit logging complete'})
        }

    except Exception as e:
        print(f"Error in audit logging: {str(e)}")
        raise  # Raise exception to trigger retry


def deserialize_dynamodb_item(item):
    """Convert DynamoDB item format to plain dict"""
    if not item:
        return {}

    result = {}
    for key, value in item.items():
        if 'S' in value:
            result[key] = value['S']
        elif 'N' in value:
            result[key] = value['N']
        elif 'BOOL' in value:
            result[key] = value['BOOL']
        elif 'NULL' in value:
            result[key] = None
        else:
            result[key] = value

    return result

"""
Audit Logger Lambda Handler

Logs audit events with retention policy.
"""

import json
import os
import time


def handler(event, context):
    """
    Log audit events.
    
    Args:
        event: SQS or EventBridge event
        context: Lambda context
        
    Returns:
        Audit result
    """
    try:
        retention_days = int(os.environ.get('AUDIT_RETENTION_DAYS', '90'))
        
        if 'Records' in event:
            for record in event['Records']:
                body = json.loads(record['body'])
                print(json.dumps({
                    'audit_event': 'failed_validation',
                    'data': body,
                    'retention_days': retention_days,
                    'timestamp': int(time.time())
                }))
        else:
            detail = event.get('detail', {})
            print(json.dumps({
                'audit_event': 'general',
                'data': detail,
                'retention_days': retention_days,
                'timestamp': int(time.time())
            }))
        
        return {
            'statusCode': 200,
            'message': 'Audit logged'
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise


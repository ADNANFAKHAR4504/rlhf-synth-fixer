"""
Upload handler Lambda function for financial market data pipeline.

This function handles POST /upload requests to initiate CSV file uploads.
"""

import json
import uuid
from datetime import datetime


def handler(event, context):
    """
    Handle upload initiation requests.
    
    Args:
        event: API Gateway proxy event
        context: Lambda context
    
    Returns:
        API Gateway proxy response
    """
    try:
        print(json.dumps({
            'message': 'Upload handler invoked',
            'event': event,
            'timestamp': datetime.utcnow().isoformat()
        }))
        
        body = json.loads(event.get('body', '{}'))
        filename = body.get('filename')
        
        if not filename:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.aws_request_id
                },
                'body': json.dumps({
                    'error': 'Missing filename parameter',
                    'correlationId': context.aws_request_id
                })
            }
        
        job_id = str(uuid.uuid4())
        
        print(json.dumps({
            'message': 'Upload job created',
            'jobId': job_id,
            'filename': filename,
            'timestamp': datetime.utcnow().isoformat()
        }))
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.aws_request_id
            },
            'body': json.dumps({
                'jobId': job_id,
                'filename': filename,
                'status': 'initiated',
                'timestamp': datetime.utcnow().isoformat(),
                'correlationId': context.aws_request_id
            })
        }
    
    except Exception as e:
        print(json.dumps({
            'message': 'Upload handler error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.aws_request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'correlationId': context.aws_request_id
            })
        }





"""
Status handler Lambda function for financial market data pipeline.

This function handles GET /status/{jobId} requests to check job status.
"""

import json
import os
from datetime import datetime

import boto3

dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Handle job status requests.
    
    Args:
        event: API Gateway proxy event
        context: Lambda context
    
    Returns:
        API Gateway proxy response
    """
    try:
        print(json.dumps({
            'message': 'Status handler invoked',
            'event': event,
            'timestamp': datetime.utcnow().isoformat()
        }))
        
        job_id = event.get('pathParameters', {}).get('jobId')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.aws_request_id
                },
                'body': json.dumps({
                    'error': 'Missing jobId parameter',
                    'correlationId': context.aws_request_id
                })
            }
        
        print(json.dumps({
            'message': 'Status check',
            'jobId': job_id,
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
                'status': 'processing',
                'timestamp': datetime.utcnow().isoformat(),
                'correlationId': context.aws_request_id
            })
        }
    
    except Exception as e:
        print(json.dumps({
            'message': 'Status handler error',
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





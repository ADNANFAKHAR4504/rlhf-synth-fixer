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
        job_id = event.get('pathParameters', {}).get('jobId')
        
        if not job_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.request_id
                },
                'body': json.dumps({
                    'error': 'Missing jobId parameter',
                    'correlationId': context.request_id
                })
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'jobId': job_id,
                'status': 'processing',
                'timestamp': datetime.utcnow().isoformat(),
                'correlationId': context.request_id
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'correlationId': context.request_id
            })
        }





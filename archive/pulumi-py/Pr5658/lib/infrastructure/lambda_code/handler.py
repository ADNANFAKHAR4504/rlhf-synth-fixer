"""
Lambda handler for the CI/CD pipeline.

This handler processes requests and logs to S3 and CloudWatch.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
cloudwatch_client = boto3.client('cloudwatch')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler.
    
    Args:
        event: API Gateway event or direct invocation
        context: Lambda context
    
    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        http_method = event.get('httpMethod', '')
        
        if http_method == 'POST':
            return handle_post(event, context)
        elif http_method == 'GET':
            return handle_get(event, context)
        elif not http_method:
            return handle_direct_invocation(event, context)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


def handle_post(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle POST requests."""
    try:
        body = json.loads(event.get('body', '{}'))
        
        if not body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Request body is required'})
            }
        
        request_id = context.aws_request_id
        timestamp = datetime.utcnow().isoformat()
        
        log_entry = {
            'requestId': request_id,
            'timestamp': timestamp,
            'method': 'POST',
            'body': body,
            'environment': os.getenv('ENVIRONMENT', 'dev')
        }
        
        log_bucket = os.getenv('LOG_BUCKET')
        if log_bucket:
            try:
                log_key = f"lambda-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"
                s3_client.put_object(
                    Bucket=log_bucket,
                    Key=log_key,
                    Body=json.dumps(log_entry),
                    ContentType='application/json'
                )
                logger.info(f"Logged to S3: {log_bucket}/{log_key}")
            except Exception as e:
                logger.error(f"Failed to log to S3: {str(e)}")
        
        try:
            cloudwatch_client.put_metric_data(
                Namespace='CICDPipeline/Lambda',
                MetricData=[
                    {
                        'MetricName': 'RequestsProcessed',
                        'Value': 1,
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
        except Exception as e:
            logger.error(f"Failed to send CloudWatch metric: {str(e)}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Request processed successfully',
                'requestId': request_id,
                'timestamp': timestamp
            })
        }
    
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }


def handle_get(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle GET requests."""
    request_id = context.aws_request_id
    timestamp = datetime.utcnow().isoformat()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Lambda function is healthy',
            'requestId': request_id,
            'timestamp': timestamp,
            'environment': os.getenv('ENVIRONMENT', 'dev')
        })
    }


def handle_direct_invocation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle direct Lambda invocations."""
    request_id = context.aws_request_id
    timestamp = datetime.utcnow().isoformat()
    
    logger.info(f"Direct invocation with event: {json.dumps(event)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Direct invocation processed',
            'requestId': request_id,
            'timestamp': timestamp,
            'event': event
        })
    }


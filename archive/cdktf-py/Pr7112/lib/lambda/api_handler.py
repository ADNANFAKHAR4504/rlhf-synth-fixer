import json
import boto3
import os


def handler(event, context):
    """
    Healthcare API handler for patient records
    AWS_REGION is automatically available - no need to set in environment
    """
    # FIX #2: AWS_REGION is automatically available to Lambda
    region = os.environ.get('AWS_REGION')
    stage = os.environ.get('STAGE', 'unknown')

    dynamodb = boto3.resource('dynamodb', region_name=region)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': f'Healthcare DR API - {stage.capitalize()} Region',
            'region': region,
            'stage': stage,
            'status': 'operational',
            'timestamp': context.request_id
        })
    }


def health_check(event, context):
    """Health check endpoint for Route53"""
    return {
        'statusCode': 200,
        'body': json.dumps({'status': 'healthy'})
    }

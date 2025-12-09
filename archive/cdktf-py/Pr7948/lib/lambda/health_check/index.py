"""Health check Lambda function"""

import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']

def handler(event, context):
    """Health check endpoint"""

    try:
        # Check DynamoDB connectivity
        table = dynamodb.Table(table_name)
        response = table.table_status

        health_status = {
            'status': 'healthy',
            'region': os.environ['REGION'],
            'timestamp': datetime.utcnow().isoformat(),
            'services': {
                'dynamodb': 'connected',
                'lambda': 'running'
            }
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(health_status)
        }

    except Exception as e:
        print(f"Health check failed: {str(e)}")
        return {
            'statusCode': 503,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e),
                'region': os.environ.get('REGION', 'unknown')
            })
        }

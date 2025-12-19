import json
import os

def handler(event, context):
    """
    Data processor Lambda function handler
    """
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Data processing completed',
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        })
    }

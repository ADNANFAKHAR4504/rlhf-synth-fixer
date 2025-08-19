import json
import os

def lambda_handler(event, context):
    """
    Lambda function to retrieve user information
    """
    user_id = event.get('pathParameters', {}).get('id', 'unknown')
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Retrieved user {user_id}',
            'function_name': os.environ.get('FUNCTION_NAME', 'GetUser')
        })
    }
import json
import os

def lambda_handler(event, context):
    """
    Lambda function to create a new user
    """
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'User created successfully',
            'function_name': os.environ.get('FUNCTION_NAME', 'CreateUser')
        })
    }
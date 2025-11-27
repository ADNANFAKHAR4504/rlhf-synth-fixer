import json
import os

def lambda_handler(event, context):
    """Token authorizer for API Gateway"""
    try:
        # Extract token from Authorization header
        auth_token = event.get('authorizationToken', '')
        
        # Strip "Bearer " prefix if present
        if auth_token.startswith('Bearer '):
            token = auth_token[7:]  # Remove "Bearer " prefix
        else:
            token = auth_token
        
        # Validate token against expected value
        expected_token = os.environ.get('EXPECTED_TOKEN', 'valid-token')
        if not token or token != expected_token:
            raise Exception('Unauthorized')
        
        # Return IAM policy document allowing API Gateway invoke
        return {
            'principalId': 'user',
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': event['methodArn']
                    }
                ]
            }
        }
    except Exception as e:
        raise Exception('Unauthorized')

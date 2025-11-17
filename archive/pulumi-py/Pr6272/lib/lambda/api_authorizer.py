"""
Custom authorizer Lambda function for API Gateway.
Provides authentication and authorization during migration transition.
"""

import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')


def lambda_handler(event, context):
    """
    Custom authorizer for API Gateway.

    Validates authorization tokens and returns IAM policy.
    """

    # Extract token from authorization header
    token = event.get('authorizationToken', '')
    method_arn = event.get('methodArn', '')

    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

    try:
        # Validate token
        if validate_token(token, environment_suffix):
            # Token is valid - allow access
            policy = generate_policy('user', 'Allow', method_arn)
            return policy
        else:
            # Token is invalid - deny access
            policy = generate_policy('user', 'Deny', method_arn)
            return policy

    except Exception as e:
        print(f"Authorization error: {str(e)}")
        # Deny access on error
        return generate_policy('user', 'Deny', method_arn)


def validate_token(token, environment_suffix):
    """
    Validate the authorization token.

    In a real implementation, this would:
    - Verify JWT signature
    - Check token expiration
    - Validate against user database
    - Check permissions

    For this migration, we validate against a parameter store value.
    """

    if not token or not token.startswith('Bearer '):
        return False

    # Extract the actual token
    actual_token = token.replace('Bearer ', '')

    try:
        # Get valid token from Parameter Store
        param_name = f"/migration/{environment_suffix}/api/auth-token"
        response = ssm.get_parameter(
            Name=param_name,
            WithDecryption=True
        )
        valid_token = response['Parameter']['Value']

        # Compare tokens
        return actual_token == valid_token

    except ssm.exceptions.ParameterNotFound:
        print(f"Parameter {param_name} not found")
        return False
    except Exception as e:
        print(f"Error validating token: {str(e)}")
        return False


def generate_policy(principal_id, effect, resource):
    """
    Generate IAM policy document for API Gateway.

    Args:
        principal_id: User/principal identifier
        effect: 'Allow' or 'Deny'
        resource: API Gateway method ARN
    """

    auth_response = {
        'principalId': principal_id
    }

    if effect and resource:
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        }
        auth_response['policyDocument'] = policy_document

    # Optional: Add context to pass to backend
    auth_response['context'] = {
        'authTime': datetime.utcnow().isoformat(),
        'environment': os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    }

    return auth_response

"""Lambda function for API Gateway custom authorization during migration."""

import json
import boto3
import os
from typing import Dict, Any
import hmac
import hashlib
import base64

ssm = boto3.client('ssm')


def get_parameter(parameter_name: str) -> str:
    """Retrieve configuration from Parameter Store."""
    try:
        response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        raise Exception(f"Error retrieving parameter {parameter_name}: {str(e)}")


def verify_token(token: str, secret: str) -> bool:
    """Verify the authentication token using HMAC."""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return False

        payload, signature = parts
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected_signature)
    except Exception:
        return False


def generate_policy(principal_id: str, effect: str, resource: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate IAM policy for API Gateway."""
    policy = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        }
    }

    if context:
        policy['context'] = context

    return policy


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Custom authorizer for API Gateway.

    Expected event structure from API Gateway:
    {
        "type": "TOKEN",
        "authorizationToken": "Bearer <token>",
        "methodArn": "arn:aws:execute-api:region:account:api-id/stage/method/resource"
    }
    """

    try:
        environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        auth_token = event.get('authorizationToken', '')
        method_arn = event.get('methodArn', '')

        if not auth_token:
            raise Exception('Unauthorized')

        if not auth_token.startswith('Bearer '):
            raise Exception('Invalid authorization header format')

        token = auth_token[7:]

        secret_param_name = f"/migration/{environment_suffix}/api/secret"
        api_secret = get_parameter(secret_param_name)

        if verify_token(token, api_secret):
            token_parts = token.split('.')[0]
            decoded_payload = base64.b64decode(token_parts + '==').decode('utf-8')
            payload_data = json.loads(decoded_payload)

            principal_id = payload_data.get('sub', 'user')
            user_role = payload_data.get('role', 'unknown')

            context = {
                'userId': principal_id,
                'userRole': user_role,
                'environment': environment_suffix
            }

            print(f"Authorization successful for user: {principal_id}")

            return generate_policy(principal_id, 'Allow', method_arn, context)
        else:
            raise Exception('Unauthorized - Invalid token')

    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        raise Exception('Unauthorized')

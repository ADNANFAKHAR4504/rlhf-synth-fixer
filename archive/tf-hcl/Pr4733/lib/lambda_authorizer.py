# lambda_authorizer.py

import json
import jwt
import boto3
import os
import time
from typing import Dict, Any, Optional
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch boto3 for X-Ray tracing
patch_all()

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager', region_name=os.environ['REGION'])

# Cache for secrets
secret_cache = {}
CACHE_TTL = 300  # 5 minutes

@xray_recorder.capture('get_secret')
def get_secret() -> Dict[str, str]:
    """Retrieve and cache secrets from AWS Secrets Manager"""
    secret_name = os.environ['SECRET_NAME']
    
    # Check cache
    if secret_name in secret_cache:
        cached_secret = secret_cache[secret_name]
        if cached_secret['expiry'] > time.time():
            return cached_secret['value']
    
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret_value = json.loads(response['SecretString'])
        
        # Cache the secret
        secret_cache[secret_name] = {
            'value': secret_value,
            'expiry': time.time() + CACHE_TTL
        }
        
        return secret_value
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        raise Exception('Unauthorized')

@xray_recorder.capture('validate_token')
def validate_token(token: str) -> Dict[str, Any]:
    """Validate JWT token and extract claims"""
    secrets = get_secret()
    jwt_secret = secrets['jwt_secret']
    
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode and verify JWT
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=['HS256'],
            options={"verify_exp": True}
        )
        
        # Additional validation
        required_claims = ['user_id', 'permissions', 'exp']
        for claim in required_claims:
            if claim not in payload:
                raise Exception(f'Missing required claim: {claim}')
        
        # Check if user has transaction permissions
        if 'transactions' not in payload.get('permissions', []):
            raise Exception('Insufficient permissions')
        
        return payload
    
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')
    except Exception as e:
        print(f"Token validation error: {e}")
        raise Exception('Unauthorized')

@xray_recorder.capture('generate_policy')
def generate_policy(principal_id: str, effect: str, resource: str, context: Optional[Dict] = None) -> Dict:
    """Generate IAM policy for API Gateway"""
    auth_response = {
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
        auth_response['context'] = context
    
    return auth_response

@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict:
    """Main Lambda handler for custom authorization"""
    print(f"Authorization event: {json.dumps(event)}")
    
    try:
        # Extract token from event
        token = event.get('authorizationToken', '')
        
        if not token:
            raise Exception('No authorization token provided')
        
        # Validate token
        token_payload = validate_token(token)
        
        # Generate Allow policy
        policy = generate_policy(
            principal_id=token_payload['user_id'],
            effect='Allow',
            resource=event['methodArn'],
            context={
                'userId': token_payload['user_id'],
                'permissions': json.dumps(token_payload['permissions']),
                'tokenExpiry': str(token_payload['exp'])
            }
        )
        
        print(f"Authorization successful for user: {token_payload['user_id']}")
        return policy
    
    except Exception as e:
        print(f"Authorization failed: {e}")
        # Return explicit Deny for failed authorization
        return generate_policy(
            principal_id='unauthorized',
            effect='Deny',
            resource=event['methodArn']
        )
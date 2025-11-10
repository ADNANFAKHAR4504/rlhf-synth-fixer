"""
Custom Authorizer Lambda for API Gateway
Validates webhook signatures for different payment providers
"""
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """
    Custom authorizer for API Gateway webhook endpoints
    Validates Authorization header and generates IAM policy
    """
    try:
        logger.info(f"Authorizer event: {json.dumps(event)}")

        # Get the authorization token
        token = event.get('authorizationToken', '')
        method_arn = event['methodArn']

        # Simple validation - in production, validate provider-specific signatures
        if not token or token == 'invalid':
            logger.warning("Authorization failed - invalid or missing token")
            raise Exception('Unauthorized')

        # Extract account ID and API info from method ARN
        # Format: arn:aws:execute-api:region:account-id:api-id/stage/method/resource
        arn_parts = method_arn.split(':')
        api_gateway_arn_parts = arn_parts[5].split('/')
        aws_account_id = arn_parts[4]

        # Build the policy
        policy = {
            'principalId': 'webhook-user',
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': method_arn
                    }
                ]
            },
            'context': {
                'provider': 'webhook',
                'validated': 'true'
            }
        }

        logger.info("Authorization successful")
        return policy

    except Exception as e:
        logger.error(f"Authorization error: {str(e)}")
        raise Exception('Unauthorized')

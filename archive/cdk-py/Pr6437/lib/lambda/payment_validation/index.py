import json
import os

def handler(event, context):
    """
    Payment validation Lambda function.
    Validates payment requests before processing.
    """
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    dr_role = os.environ.get('DR_ROLE', 'primary')

    body = json.loads(event['body'])

    # Payment validation logic
    if 'payment_id' not in body:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'payment_id is required'})
        }

    # Validate payment
    is_valid = len(body['payment_id']) > 0

    return {
        'statusCode': 200,
        'body': json.dumps({
            'valid': is_valid,
            'region': dr_role,
            'environment': environment_suffix
        })
    }

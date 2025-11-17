import json
import os


def handler(event, context):
    """
    Trading platform Lambda function handler
    Processes trading requests and interacts with RDS database
    """
    # Environment variables
    db_endpoint = os.environ.get('DB_ENDPOINT', '')
    db_name = os.environ.get('DB_NAME', 'trading')
    region = os.environ.get('REGION', 'us-east-1')
    environment = os.environ.get('ENVIRONMENT', 'dev')

    # Log the event
    print(f"Processing request in {environment} environment")
    print(f"Database endpoint: {db_endpoint}")
    print(f"Event: {json.dumps(event)}")

    # Parse request body
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body'
            })
        }

    # Trading logic placeholder
    action = body.get('action', 'unknown')

    response_data = {
        'message': f'Trading request processed successfully',
        'action': action,
        'environment': environment,
        'region': region,
        'timestamp': context.request_id if context else 'local'
    }

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_data)
    }

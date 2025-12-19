import json
import os

def handler(event, context):
    """
    Payment processing Lambda function
    Handles payment transactions from SQS and ALB
    """
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    queue_url = os.environ.get('QUEUE_URL', '')
    db_endpoint = os.environ.get('DB_ENDPOINT', '')

    # Health check endpoint
    if 'path' in event and event.get('path') == '/health':
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'environment': environment
            })
        }

    # Process payment from ALB
    if 'requestContext' in event and 'elb' in event['requestContext']:
        try:
            body = json.loads(event.get('body', '{}'))
            transaction_id = body.get('transaction_id', 'unknown')
            amount = body.get('amount', 0)

            # Process payment logic here
            result = {
                'transaction_id': transaction_id,
                'amount': amount,
                'status': 'processed',
                'environment': environment,
                'db_endpoint': db_endpoint
            }

            return {
                'statusCode': 200,
                'body': json.dumps(result),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e),
                    'environment': environment
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }

    # Process message from SQS
    if 'Records' in event:
        for record in event['Records']:
            if 'body' in record:
                message = json.loads(record['body'])
                # Process SQS message
                print(f"Processing message in {environment}: {message}")

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processed'})
    }

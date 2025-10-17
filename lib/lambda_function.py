import json

def lambda_handler(event, context):
    """
    Payment processor Lambda function
    """
    print(f"Received event: {json.dumps(event)}")
    
    # Parse request body
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'https://app.example.com'
                },
                'body': json.dumps({'error': 'Invalid JSON'})
            }
    
    # Process payment
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://app.example.com'
        },
        'body': json.dumps({
            'message': 'Payment processed successfully',
            'transactionId': '12345-67890',
            'status': 'completed',
            'amount': body.get('amount', 0),
            'currency': body.get('currency', 'USD')
        })
    }

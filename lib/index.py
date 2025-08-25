import json

def handler(event, context):
    """
    Simple Lambda function for security infrastructure testing
    """
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Security function executed successfully',
            'event': event
        })
    }
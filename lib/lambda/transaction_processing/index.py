import json
import os
import boto3

def handler(event, context):
    """
    Transaction processing Lambda function.
    Processes payment transactions and stores session data.
    """
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    dr_role = os.environ.get('DR_ROLE', 'primary')

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(f'SessionTable-{environment_suffix}')

    body = json.loads(event['body'])

    # Process transaction
    transaction_id = body.get('transaction_id')

    # Store session data
    table.put_item(
        Item={
            'sessionId': transaction_id,
            'status': 'processing',
            'region': dr_role
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'transaction_id': transaction_id,
            'status': 'processed',
            'region': dr_role
        })
    }

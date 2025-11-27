import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME', '')

def handler(event, context):
    """Process payment transactions"""
    try:
        # Extract transaction details
        transaction_id = event.get('transaction_id', 'unknown')
        amount = event.get('amount', 0)
        currency = event.get('currency', 'USD')

        # Process transaction
        # AWS_REGION is automatically available in Lambda context
        region = os.environ.get('AWS_REGION', 'unknown')
        table = dynamodb.Table(table_name)
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': amount,
                'currency': currency,
                'status': 'processed',
                'region': region
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Transaction failed',
                'error': str(e)
            })
        }

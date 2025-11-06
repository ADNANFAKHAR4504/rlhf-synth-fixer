import json
import os
import boto3
import psycopg2
from datetime import datetime

def handler(event, context):
    """
    Payment processor Lambda function.
    Processes payment transactions and stores results in RDS and DynamoDB.
    """
    try:
        # Get environment variables
        environment = os.environ['ENVIRONMENT']
        rds_endpoint = os.environ['RDS_ENDPOINT']
        dynamodb_table = os.environ['DYNAMODB_TABLE']
        
        # Initialize AWS clients
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(dynamodb_table)
        
        # Process the payment (simplified example)
        payment_data = json.loads(event['body']) if 'body' in event else event
        
        transaction_id = payment_data.get('transaction_id')
        amount = payment_data.get('amount')
        user_id = payment_data.get('user_id')
        
        # Store in DynamoDB
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'amount': str(amount),
                'status': 'processed',
                'environment': environment
            }
        )
        
        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'environment': environment
            })
        }
        
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Payment processing failed',
                'message': str(e)
            })
        }
"""
Queue Consumer Lambda function.

This function consumes messages from the SQS queue and writes transaction
records to the DynamoDB table.
"""
import json
import os
import boto3
from typing import Dict, Any
from decimal import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for SQS messages.

    Args:
        event: SQS event containing transaction messages
        context: Lambda context object

    Returns:
        Response indicating processing status
    """
    successful = 0
    failed = 0

    for record in event['Records']:
        try:
            # Parse message body
            body = json.loads(record['body'])

            # Convert float to Decimal for DynamoDB
            if 'amount' in body:
                body['amount'] = Decimal(str(body['amount']))

            # Write to DynamoDB
            table.put_item(Item=body)

            successful += 1
            print(f"Successfully processed transaction: {body['transaction_id']}")

        except Exception as e:
            failed += 1
            print(f"Error processing message: {str(e)}")
            print(f"Message body: {record['body']}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'successful': successful,
            'failed': failed
        })
    }

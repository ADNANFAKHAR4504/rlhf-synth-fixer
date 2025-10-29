"""
Results handler Lambda function for financial market data pipeline.

This function handles GET /results/{symbol} requests to retrieve processed data.
"""

import json
import os
from datetime import datetime
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event, context):
    """
    Handle results retrieval requests.
    
    Args:
        event: API Gateway proxy event
        context: Lambda context
    
    Returns:
        API Gateway proxy response
    """
    try:
        print(json.dumps({
            'message': 'Results handler invoked',
            'event': event,
            'timestamp': datetime.now().isoformat()
        }))
        
        symbol = event.get('pathParameters', {}).get('symbol')
        
        if not symbol:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.aws_request_id
                },
                'body': json.dumps({
                    'error': 'Missing symbol parameter',
                    'correlationId': context.aws_request_id
                })
            }
        
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        table = dynamodb.Table(table_name)
        
        print(json.dumps({
            'message': 'Querying DynamoDB',
            'symbol': symbol,
            'table_name': table_name,
            'timestamp': datetime.now().isoformat()
        }))
        
        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': symbol
            },
            Limit=100,
            ScanIndexForward=False
        )
        
        print(json.dumps({
            'message': 'Query complete',
            'symbol': symbol,
            'count': response.get('Count', 0),
            'timestamp': datetime.now().isoformat()
        }))
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.aws_request_id
            },
            'body': json.dumps({
                'symbol': symbol,
                'results': response.get('Items', []),
                'count': response.get('Count', 0),
                'correlationId': context.aws_request_id
            }, cls=DecimalEncoder)
        }
    
    except Exception as e:
        print(json.dumps({
            'message': 'Results handler error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.aws_request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'correlationId': context.aws_request_id
            })
        }





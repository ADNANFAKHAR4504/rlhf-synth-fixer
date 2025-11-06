import json
import os
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Optional X-Ray tracing
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    patch_all()
except ImportError:
    # X-Ray SDK not available, continue without tracing
    pass

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float/int for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)


@xray_recorder.capture('query_by_id')
def query_by_id(transaction_id):
    """Query transaction by ID"""
    try:
        response = table.query(
            KeyConditionExpression=Key('transaction_id').eq(transaction_id)
        )

        items = response.get('Items', [])

        if not items:
            return None

        # Return the first (and should be only) item
        return items[0]

    except Exception as e:
        print(f"Error querying by ID: {str(e)}")
        raise


@xray_recorder.capture('query_by_provider_and_time')
def query_by_provider_and_time(provider, start_timestamp, end_timestamp):
    """Query transactions by provider and timestamp range using GSI"""
    try:
        # Use ProviderTimestampIndex GSI
        key_condition = Key('provider').eq(provider)

        if start_timestamp and end_timestamp:
            key_condition = key_condition & Key('timestamp').between(
                int(start_timestamp),
                int(end_timestamp)
            )
        elif start_timestamp:
            key_condition = key_condition & Key('timestamp').gte(int(start_timestamp))
        elif end_timestamp:
            key_condition = key_condition & Key('timestamp').lte(int(end_timestamp))

        response = table.query(
            IndexName='ProviderTimestampIndex',
            KeyConditionExpression=key_condition,
            ScanIndexForward=False,  # Sort descending (newest first)
            Limit=100  # Limit results for performance
        )

        return response.get('Items', [])

    except Exception as e:
        print(f"Error querying by provider and time: {str(e)}")
        raise


@xray_recorder.capture('query_by_customer')
def query_by_customer(customer_id, start_timestamp=None, end_timestamp=None):
    """Query transactions by customer ID using GSI"""
    try:
        # Use CustomerIndex GSI
        key_condition = Key('customer_id').eq(customer_id)

        if start_timestamp and end_timestamp:
            key_condition = key_condition & Key('timestamp').between(
                int(start_timestamp),
                int(end_timestamp)
            )
        elif start_timestamp:
            key_condition = key_condition & Key('timestamp').gte(int(start_timestamp))
        elif end_timestamp:
            key_condition = key_condition & Key('timestamp').lte(int(end_timestamp))

        response = table.query(
            IndexName='CustomerIndex',
            KeyConditionExpression=key_condition,
            ScanIndexForward=False,  # Sort descending (newest first)
            Limit=100
        )

        return response.get('Items', [])

    except Exception as e:
        print(f"Error querying by customer: {str(e)}")
        raise


def lambda_handler(event, context):
    """
    Transaction query Lambda handler

    Handles GET requests to query transactions by ID or provider/timestamp range
    """
    try:
        # Add X-Ray annotations
        xray_recorder.put_annotation('environment', ENVIRONMENT)

        # Parse request
        http_method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {}) or {}

        print(f"Query request: method={http_method}, path={path_parameters}, query={query_parameters}")

        # Query by transaction ID
        if path_parameters and 'id' in path_parameters:
            transaction_id = path_parameters['id']
            xray_recorder.put_annotation('query_type', 'by_id')
            xray_recorder.put_annotation('transaction_id', transaction_id)

            print(f"Querying by ID: {transaction_id}")
            result = query_by_id(transaction_id)

            if not result:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Transaction not found',
                        'transaction_id': transaction_id
                    })
                }

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result, cls=DecimalEncoder)
            }

        # Query by provider and time range
        elif 'provider' in query_parameters:
            provider = query_parameters['provider']
            start = query_parameters.get('start')
            end = query_parameters.get('end')

            xray_recorder.put_annotation('query_type', 'by_provider')
            xray_recorder.put_annotation('provider', provider)

            print(f"Querying by provider: {provider}, start={start}, end={end}")
            results = query_by_provider_and_time(provider, start, end)

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'count': len(results),
                    'transactions': results
                }, cls=DecimalEncoder)
            }

        # Query by customer ID
        elif 'customer_id' in query_parameters:
            customer_id = query_parameters['customer_id']
            start = query_parameters.get('start')
            end = query_parameters.get('end')

            xray_recorder.put_annotation('query_type', 'by_customer')
            xray_recorder.put_annotation('customer_id', customer_id)

            print(f"Querying by customer: {customer_id}")
            results = query_by_customer(customer_id, start, end)

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'count': len(results),
                    'transactions': results
                }, cls=DecimalEncoder)
            }

        else:
            # Invalid query parameters
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid query parameters',
                    'message': 'Provide either transaction ID in path or provider/customer_id in query string'
                })
            }

    except Exception as e:
        print(f"ERROR: Query failed: {str(e)}")
        xray_recorder.put_annotation('query_status', 'error')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

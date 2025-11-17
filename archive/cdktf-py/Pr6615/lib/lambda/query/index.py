"""Data query Lambda function for IoT sensor data."""

import json
import boto3
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')

PROCESSED_TABLE_NAME = os.environ['PROCESSED_TABLE_NAME']
RAW_TABLE_NAME = os.environ['RAW_TABLE_NAME']


@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    """
    Data query Lambda function that retrieves processed data
    from DynamoDB based on query parameters.
    """
    try:
        # Parse query parameters
        params = event.get('queryStringParameters', {})
        device_id = params.get('device_id')
        event_date = params.get('event_date')
        table_name = params.get('table', 'processed')

        if not device_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'device_id is required'})
            }

        # Select the appropriate table
        if table_name == 'raw':
            table = dynamodb.Table(RAW_TABLE_NAME)
            key_condition = 'device_id = :device_id'
            expression_values = {':device_id': device_id}
        else:
            table = dynamodb.Table(PROCESSED_TABLE_NAME)
            if event_date:
                key_condition = 'device_id = :device_id AND event_date = :event_date'
                expression_values = {
                    ':device_id': device_id,
                    ':event_date': event_date
                }
            else:
                key_condition = 'device_id = :device_id'
                expression_values = {':device_id': device_id}

        # Query DynamoDB
        response = table.query(
            KeyConditionExpression=key_condition,
            ExpressionAttributeValues=expression_values,
            Limit=100
        )

        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'body': json.dumps({
                'count': len(items),
                'items': items
            }, default=str)
        }

    except Exception as e:
        print(f"Error querying data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

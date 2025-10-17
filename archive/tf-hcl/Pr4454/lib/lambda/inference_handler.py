import json
import logging
import boto3
import os
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

kinesis_client = boto3.client('kinesis')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Inference request handler Lambda function.
    Receives inference requests and puts them into Kinesis stream.
    """
    try:
        logger.info(f"Event: {json.dumps(event)}")
        
        # Extract request body
        body = json.loads(event.get('body', '{}'))
        
        # Get configuration from environment
        stream_name = os.environ.get('KINESIS_STREAM_NAME')
        
        # Put record into Kinesis
        response = kinesis_client.put_record(
            StreamName=stream_name,
            Data=json.dumps(body),
            PartitionKey=str(datetime.now().timestamp())
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Inference request accepted',
                'requestId': response['SequenceNumber']
            })
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


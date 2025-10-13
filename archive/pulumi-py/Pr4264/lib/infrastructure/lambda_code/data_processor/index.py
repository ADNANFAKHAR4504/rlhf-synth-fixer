"""
Data Processor Lambda function.

This function processes data from various sources.
"""

import json
import os
import boto3
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process data from various sources.
    
    Args:
        event: Event data
        context: Lambda context
        
    Returns:
        Processing result
    """
    try:
        # Get environment variables
        table_name = os.getenv('DYNAMODB_TABLE_NAME')
        s3_bucket = os.getenv('S3_BUCKET_NAME')
        
        # Initialize AWS clients
        dynamodb = boto3.client('dynamodb')
        s3 = boto3.client('s3')
        
        # Process the data
        processed_data = {
            'id': context.aws_request_id,
            'processed_at': context.aws_request_id,
            'status': 'processed',
            'data': event.get('data', {})
        }
        
        # Store in DynamoDB
        try:
            dynamodb.put_item(
                TableName=table_name,
                Item={
                    'id': {'S': processed_data['id']},
                    'created_at': {'S': processed_data['processed_at']},
                    'status': {'S': processed_data['status']},
                    'data': {'S': json.dumps(processed_data['data'])}
                }
            )
        except Exception as e:
            print(f"Failed to store in DynamoDB: {e}")
            raise
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'processed_data': processed_data
            })
        }
        
    except Exception as e:
        print(f"Error in data processor: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Data processing failed',
                'message': str(e)
            })
        }

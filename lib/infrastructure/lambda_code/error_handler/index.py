"""
Error Handler Lambda function.

This function handles errors and logs them to the audit table.
"""

import json
import os
import boto3
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle errors and log them.
    
    Args:
        event: Error event data
        context: Lambda context
        
    Returns:
        Error handling result
    """
    try:
        # Get environment variables
        audit_table_name = os.getenv('DYNAMODB_AUDIT_TABLE_NAME')
        
        # Initialize AWS client
        dynamodb = boto3.client('dynamodb')
        
        # Log error to audit table
        dynamodb.put_item(
            TableName=audit_table_name,
            Item={
                'timestamp': {'S': context.aws_request_id},
                'event_type': {'S': 'error'},
                'error_message': {'S': str(event.get('error', 'Unknown error'))},
                'request_id': {'S': context.aws_request_id}
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Error logged successfully'
            })
        }
        
    except Exception as e:
        print(f"Error in error handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to log error',
                'message': str(e)
            })
        }

"""
AWS Lambda function to process S3 events.
This function is triggered when objects are created in the S3 bucket.
"""

import json
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function to process S3 events.
    
    Args:
        event: S3 event data containing bucket and object information
        context: Lambda runtime context
        
    Returns:
        Dict containing status and processed record count
    """
    try:
        # Log the complete event for debugging
        logger.info(f"Received S3 event: {json.dumps(event, indent=2)}")
        
        # Process each record in the event
        processed_records = 0
        
        for record in event.get('Records', []):
            # Extract S3 event information
            event_name = record.get('eventName', 'Unknown')
            bucket_name = record.get('s3', {}).get('bucket', {}).get('name', 'Unknown')
            object_key = record.get('s3', {}).get('object', {}).get('key', 'Unknown')
            object_size = record.get('s3', {}).get('object', {}).get('size', 0)
            
            # Log detailed information about the S3 event
            logger.info(f"Processing S3 event:")
            logger.info(f"  Event Name: {event_name}")
            logger.info(f"  Bucket Name: {bucket_name}")
            logger.info(f"  Object Key: {object_key}")
            logger.info(f"  Object Size: {object_size} bytes")
            
            # Here you would typically add your business logic
            # For example: process the file, transform data, send notifications, etc.
            
            processed_records += 1
        
        logger.info(f"Successfully processed {processed_records} S3 records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} S3 records',
                'processedRecords': processed_records
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        logger.error(f"Event data: {json.dumps(event, indent=2)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process S3 event',
                'message': str(e)
            })
        }
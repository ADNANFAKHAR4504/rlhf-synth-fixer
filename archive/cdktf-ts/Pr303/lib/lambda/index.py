import json
import os
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
sns_client = boto3.client('sns')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda function to process S3 ObjectCreated events.
    
    This function:
    1. Processes S3 event notifications
    2. Logs event details to CloudWatch
    3. Publishes success notifications to SNS topic
    4. Handles errors gracefully (failures will be sent to DLQ)
    
    Args:
        event: S3 event notification
        context: Lambda runtime context
        
    Returns:
        Dictionary with processing status
    """
    try:
        logger.info(f"Received S3 event: {json.dumps(event, indent=2)}")
        
        # Get SNS topic ARN from environment variables
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if not sns_topic_arn:
            raise ValueError("SNS_TOPIC_ARN environment variable not set")
        
        # Process each S3 record in the event
        processed_objects = []
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                # Extract S3 object information
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                event_name = record['eventName']
                
                logger.info(f"Processing {event_name} for object: s3://{bucket_name}/{object_key}")
                
                # Simulate image processing (in real scenario, this would contain actual processing logic)
                processing_result = {
                    'bucket': bucket_name,
                    'key': object_key,
                    'event': event_name,
                    'timestamp': record['eventTime'],
                    'status': 'processed_successfully'
                }
                processed_objects.append(processing_result)
                
                # Publish success notification to SNS
                message = {
                    'message': 'Image processing completed successfully',
                    'details': processing_result
                }
                
                response = sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Message=json.dumps(message, indent=2),
                    Subject=f'Image Processing Complete: {object_key}'
                )
                
                logger.info(f"Published SNS notification. MessageId: {response['MessageId']}")
        
        # Return success response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed S3 event',
                'processed_objects': processed_objects,
                'total_processed': len(processed_objects)
            }, indent=2)
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        # Re-raise the exception so Lambda will send the event to DLQ
        raise e
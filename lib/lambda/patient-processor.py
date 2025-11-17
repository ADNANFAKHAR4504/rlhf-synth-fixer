import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process patient data records from S3 bucket.

    This function is triggered when new objects are created in the S3 bucket.
    It performs secure processing of patient records with comprehensive logging
    for HIPAA compliance and audit requirements.
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")

        # Extract S3 event details
        for record in event.get('Records', []):
            if record.get('eventName', '').startswith('ObjectCreated'):
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']

                logger.info(f"Processing new patient record: {object_key} from bucket: {bucket_name}")

                # Get object metadata
                try:
                    response = s3_client.head_object(
                        Bucket=bucket_name,
                        Key=object_key
                    )

                    # Verify encryption
                    encryption = response.get('ServerSideEncryption', 'None')
                    logger.info(f"Object encryption: {encryption}")

                    if encryption == 'None':
                        logger.error(f"SECURITY VIOLATION: Unencrypted object detected: {object_key}")
                        raise ValueError("Unencrypted patient data detected")

                    # Get object content
                    obj_response = s3_client.get_object(
                        Bucket=bucket_name,
                        Key=object_key
                    )

                    content = obj_response['Body'].read().decode('utf-8')
                    logger.info(f"Successfully retrieved patient record: {object_key}")

                    # Process patient data
                    # In production, this would include:
                    # - Data validation and sanitization
                    # - PHI de-identification if required
                    # - Database operations (using encrypted DATABASE_PASSWORD)
                    # - Compliance checks and audit logging

                    logger.info(f"Patient record processed successfully: {object_key}")

                except Exception as e:
                    logger.error(f"Error processing object {object_key}: {str(e)}")
                    raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Patient records processed successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        logger.error(f"Lambda execution failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing patient records',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }

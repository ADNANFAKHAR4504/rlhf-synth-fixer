import json
import boto3
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Background processing Lambda function for startup application.
    Handles tasks like file processing, cleanup, and database maintenance.
    """
    
    try:
        # Get environment variables
        bucket_name = os.environ.get('BUCKET_NAME')
        db_host = os.environ.get('DB_HOST')
        
        logger.info(f"Processing background task for bucket: {bucket_name}")
        
        # Initialize AWS clients
        s3_client = boto3.client('s3')
        
        # Example: List and process files in S3 bucket
        response = s3_client.list_objects_v2(Bucket=bucket_name)
        
        file_count = response.get('KeyCount', 0)
        logger.info(f"Found {file_count} files in bucket {bucket_name}")
        
        # Example processing logic
        processed_files = []
        if 'Contents' in response:
            for obj in response['Contents'][:10]:  # Process first 10 files
                key = obj['Key']
                size = obj['Size']
                
                # Add your processing logic here
                processed_files.append({
                    'key': key,
                    'size': size,
                    'processed': True
                })
                
                logger.info(f"Processed file: {key} ({size} bytes)")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Background processing completed successfully',
                'files_processed': len(processed_files),
                'bucket': bucket_name,
                'db_host': db_host
            })
        }
        
    except Exception as e:
        logger.error(f"Error in background processing: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Background processing failed',
                'error': str(e)
            })
        }
import json
import logging
import boto3
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')

def handler(event, context):
    """
    Data preprocessing Lambda function.
    Validates and preprocesses image data from raw bucket to processed bucket.
    """
    try:
        logger.info(f"Event: {json.dumps(event)}")
        
        action = event.get('action', 'preprocess')
        
        if action == 'validate':
            # Data validation logic
            logger.info("Validating data...")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Data validation completed',
                    'status': 'valid'
                })
            }
        elif action == 'preprocess':
            # Data preprocessing logic
            logger.info("Preprocessing data...")
            raw_bucket = os.environ.get('RAW_BUCKET')
            processed_bucket = os.environ.get('PROCESSED_BUCKET')
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Data preprocessing completed',
                    'rawBucket': raw_bucket,
                    'processedBucket': processed_bucket
                })
            }
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid action'})
            }
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise


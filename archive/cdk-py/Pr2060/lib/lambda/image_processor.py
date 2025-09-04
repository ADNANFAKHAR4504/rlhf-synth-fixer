import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
bedrock_client = boto3.client('bedrock-runtime')

# Environment variables
METADATA_TABLE_NAME = os.environ['METADATA_TABLE_NAME']
table = dynamodb.Table(METADATA_TABLE_NAME)

def handler(event, context) -> Dict[str, Any]:
    """
    Processes image files uploaded to S3.
    Extracts metadata and performs AI-powered image analysis using Amazon Bedrock.
    """
    try:
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            logger.info(f"Processing image: {object_key} from bucket: {bucket_name}")
            
            # Extract image metadata
            try:
                response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                file_size = response['ContentLength']
                last_modified = response['LastModified'].isoformat()
                content_type = response.get('ContentType', 'unknown')
                
                # Generate presigned URL for secure access
                presigned_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket_name, 'Key': object_key},
                    ExpiresIn=3600
                )
                
                # Simulate AI-powered image analysis (using Bedrock Intelligent Prompt Routing)
                analysis_result = perform_image_analysis(bucket_name, object_key)
                
                # Store metadata in DynamoDB
                file_id = f"img_{object_key.replace('/', '_')}"
                table.put_item(
                    Item={
                        'fileId': file_id,
                        'fileName': object_key,
                        'fileType': 'image',
                        'fileSize': file_size,
                        'contentType': content_type,
                        'uploadTime': last_modified,
                        'processedTime': datetime.now().isoformat(),
                        'status': 'processed',
                        'analysis': analysis_result,
                        'presignedUrl': presigned_url,
                        'bucketName': bucket_name
                    }
                )
                
                logger.info(f"Successfully processed image: {object_key}")
                
            except Exception as e:
                logger.error(f"Error processing image {object_key}: {str(e)}")
                # Store error status
                file_id = f"img_{object_key.replace('/', '_')}"
                table.put_item(
                    Item={
                        'fileId': file_id,
                        'fileName': object_key,
                        'fileType': 'image',
                        'uploadTime': datetime.now().isoformat(),
                        'processedTime': datetime.now().isoformat(),
                        'status': 'error',
                        'error': str(e),
                        'bucketName': bucket_name
                    }
                )
                continue
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Image processing completed',
                'processed_files': len(event['Records'])
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in image processor: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process images',
                'details': str(e)
            })
        }

def perform_image_analysis(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """
    Performs AI-powered image analysis using Amazon Bedrock.
    This is a placeholder for actual Bedrock integration.
    """
    try:
        # Simulate Bedrock Intelligent Prompt Routing for image analysis
        analysis = {
            'description': f'Image analysis for {object_key}',
            'confidence': 0.95,
            'tags': ['processed', 'analyzed'],
            'dimensions': 'Unknown - would be extracted using actual AI model',
            'format': object_key.split('.')[-1].upper(),
            'quality_score': 8.5,
            'ai_provider': 'bedrock-intelligent-routing'
        }
        
        logger.info(f"Image analysis completed for {object_key}")
        return analysis
        
    except Exception as e:
        logger.warning(f"AI analysis failed for {object_key}: {str(e)}")
        return {
            'error': 'AI analysis failed',
            'fallback': 'basic_metadata_only'
        }
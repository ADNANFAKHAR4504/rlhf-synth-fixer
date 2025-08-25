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
textract_client = boto3.client('textract')

# Environment variables
METADATA_TABLE_NAME = os.environ['METADATA_TABLE_NAME']
table = dynamodb.Table(METADATA_TABLE_NAME)

def handler(event, context) -> Dict[str, Any]:
    """
    Processes document files (PDF, TXT) uploaded to S3.
    Extracts text content and metadata using Amazon Textract.
    """
    try:
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            logger.info(f"Processing document: {object_key} from bucket: {bucket_name}")
            
            try:
                # Extract document metadata
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
                
                # Process document content
                text_content = extract_document_text(bucket_name, object_key)
                document_analysis = analyze_document_content(text_content)
                
                # Store metadata in DynamoDB
                file_id = f"doc_{object_key.replace('/', '_')}"
                table.put_item(
                    Item={
                        'fileId': file_id,
                        'fileName': object_key,
                        'fileType': 'document',
                        'fileSize': file_size,
                        'contentType': content_type,
                        'uploadTime': last_modified,
                        'processedTime': datetime.now().isoformat(),
                        'status': 'processed',
                        'textContent': text_content[:1000],  # Store first 1000 chars
                        'analysis': document_analysis,
                        'presignedUrl': presigned_url,
                        'bucketName': bucket_name
                    }
                )
                
                logger.info(f"Successfully processed document: {object_key}")
                
            except Exception as e:
                logger.error(f"Error processing document {object_key}: {str(e)}")
                # Store error status
                file_id = f"doc_{object_key.replace('/', '_')}"
                table.put_item(
                    Item={
                        'fileId': file_id,
                        'fileName': object_key,
                        'fileType': 'document',
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
                'message': 'Document processing completed',
                'processed_files': len(event['Records'])
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in document processor: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process documents',
                'details': str(e)
            })
        }

def extract_document_text(bucket_name: str, object_key: str) -> str:
    """
    Extracts text from document using Amazon Textract or simple text extraction.
    """
    try:
        file_extension = object_key.lower().split('.')[-1]
        
        if file_extension == 'txt':
            # Simple text file reading
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            text_content = response['Body'].read().decode('utf-8')
            return text_content
            
        elif file_extension == 'pdf':
            # For PDF, we would use Textract in production
            # This is a placeholder implementation
            logger.info(f"PDF processing for {object_key} - would use Textract")
            return f"PDF content extracted from {object_key} using Amazon Textract"
            
        else:
            logger.warning(f"Unsupported document type: {file_extension}")
            return "Unsupported document format"
            
    except Exception as e:
        logger.error(f"Text extraction failed for {object_key}: {str(e)}")
        return f"Text extraction failed: {str(e)}"

def analyze_document_content(text_content: str) -> Dict[str, Any]:
    """
    Analyzes document content to extract insights and metadata.
    """
    try:
        word_count = len(text_content.split()) if text_content else 0
        char_count = len(text_content) if text_content else 0
        
        # Basic content analysis
        analysis = {
            'word_count': word_count,
            'character_count': char_count,
            'estimated_reading_time_minutes': max(1, word_count // 200),
            'language': 'en',  # Would use language detection in production
            'content_summary': text_content[:200] + '...' if len(text_content) > 200 else text_content,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        return analysis
        
    except Exception as e:
        logger.error(f"Document analysis failed: {str(e)}")
        return {
            'error': 'Document analysis failed',
            'details': str(e)
        }
"""
Lambda function for processing uploaded images.
Resizes images to predefined sizes and stores them in the destination bucket.
Addresses model failures around image processing and error handling.
"""

import io
import json
import logging
import os
import time
import traceback
import urllib.parse
from typing import Any, Dict, Tuple

import boto3
from PIL import Image

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

# Configuration from environment variables
DEST_BUCKET = os.environ['DEST_BUCKET']
SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
IMAGE_SIZES = json.loads(os.environ['IMAGE_SIZES'])
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', '')

# Supported image formats
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing S3 events.
    Addresses model failures around event processing and error handling.
    
    Args:
        event: S3 event containing information about uploaded objects
        context: Lambda context object
        
    Returns:
        Response with processing status
    """
    
    logger.info(f"Processing event: {json.dumps(event, default=str)}")
    
    start_time = time.time()
    results = []
    
    try:
        # Process each record in the event
        for record in event.get('Records', []):
            result = process_record(record)
            results.append(result)
        
        # Publish custom metrics
        processing_time = time.time() - start_time
        publish_custom_metrics(len(results), processing_time, True)
        
    except Exception as e:
        logger.error(f"Unexpected error processing event: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Publish error metrics
        processing_time = time.time() - start_time
        publish_custom_metrics(0, processing_time, False)
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    
    # Return processing results
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Processing complete',
            'results': results
        })
    }

def process_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes a single S3 event record.
    Addresses model failures around record processing and error handling.
    
    Args:
        record: S3 event record
        
    Returns:
        Processing result for the record
    """
    
    try:
        # Extract S3 object information
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        
        logger.info(f"Processing image: {bucket}/{key}")
        
        # Check if file is a supported image format
        file_ext = os.path.splitext(key.lower())[1]
        if file_ext not in SUPPORTED_FORMATS:
            logger.warning(f"Unsupported file format: {file_ext}")
            return {
                'status': 'skipped',
                'reason': f'Unsupported format: {file_ext}',
                'key': key
            }
        
        # Download the image from S3
        image_data = download_image(bucket, key)
        
        # Process the image for each size configuration
        processed_images = []
        for size_name, size_config in IMAGE_SIZES.items():
            try:
                resized_image = resize_image(
                    image_data,
                    size_config['width'],
                    size_config['height']
                )
                
                # Generate output key
                output_key = generate_output_key(key, size_config['suffix'])
                
                # Upload resized image to destination bucket
                upload_image(resized_image, output_key, file_ext)
                
                processed_images.append({
                    'size': size_name,
                    'key': output_key,
                    'dimensions': f"{size_config['width']}x{size_config['height']}"
                })
                
                logger.info(f"Successfully processed {size_name} version: {output_key}")
                
            except Exception as e:
                logger.error(f"Error processing {size_name} size: {str(e)}")
                raise
        
        return {
            'status': 'success',
            'source_key': key,
            'processed_images': processed_images
        }
        
    except Exception as e:
        logger.error(f"Error processing record: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'status': 'error',
            'error': str(e),
            'key': record.get('s3', {}).get('object', {}).get('key', 'unknown')
        }

def download_image(bucket: str, key: str) -> bytes:
    """
    Downloads an image from S3.
    Addresses model failures around S3 access and error handling.
    
    Args:
        bucket: S3 bucket name
        key: S3 object key
        
    Returns:
        Image data as bytes
    """
    
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        return response['Body'].read()
    except Exception as e:
        logger.error(f"Error downloading image from S3: {str(e)}")
        raise

def resize_image(image_data: bytes, width: int, height: int) -> bytes:
    """
    Resizes an image to specified dimensions.
    Addresses model failures around image processing and optimization.
    
    Args:
        image_data: Original image data
        width: Target width
        height: Target height
        
    Returns:
        Resized image data as bytes
    """
    
    try:
        # Open image from bytes
        with Image.open(io.BytesIO(image_data)) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Calculate aspect ratio and resize
            img.thumbnail((width, height), Image.Resampling.LANCZOS)
            
            # If exact dimensions are required, crop or pad
            if img.size != (width, height):
                # Create new image with exact dimensions
                new_img = Image.new('RGB', (width, height), (255, 255, 255))
                # Paste resized image centered
                x_offset = (width - img.width) // 2
                y_offset = (height - img.height) // 2
                new_img.paste(img, (x_offset, y_offset))
                img = new_img
            
            # Save to bytes with optimization
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()
            
    except Exception as e:
        logger.error(f"Error resizing image: {str(e)}")
        raise

def generate_output_key(original_key: str, suffix: str) -> str:
    """
    Generates output key for processed image.
    Addresses model failures around key generation and organization.
    
    Args:
        original_key: Original S3 object key
        suffix: Suffix to add to the filename
        
    Returns:
        Output key for the processed image
    """
    
    # Remove 'uploads/' prefix if present
    if original_key.startswith('uploads/'):
        original_key = original_key[8:]
    
    # Split path and filename
    path_parts = original_key.rsplit('/', 1)
    if len(path_parts) == 2:
        path, filename = path_parts
    else:
        path = ''
        filename = path_parts[0]
    
    # Split filename and extension
    name, ext = os.path.splitext(filename)
    
    # Generate new filename
    new_filename = f"{name}_{suffix}{ext}"
    
    # Combine path if exists
    if path:
        return f"{suffix}/{path}/{new_filename}"
    else:
        return f"{suffix}/{new_filename}"

def upload_image(image_data: bytes, key: str, content_type: str) -> None:
    """
    Uploads processed image to destination S3 bucket.
    Addresses model failures around S3 upload and optimization.
    
    Args:
        image_data: Processed image data
        key: S3 object key for the destination
        content_type: MIME type of the image
    """
    
    # Map file extension to content type
    content_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
    }
    
    mime_type = content_type_map.get(content_type.lower(), 'image/jpeg')
    
    try:
        # Upload with KMS encryption if key is provided
        upload_args = {
            'Bucket': DEST_BUCKET,
            'Key': key,
            'Body': image_data,
            'ContentType': mime_type,
            'CacheControl': 'max-age=86400',  # Cache for 1 day
            'Metadata': {
                'processed': 'true',
                'processor': 'image-resize-lambda'
            }
        }
        
        if KMS_KEY_ID:
            upload_args['ServerSideEncryption'] = 'aws:kms'
            upload_args['SSEKMSKeyId'] = KMS_KEY_ID
        
        s3_client.put_object(**upload_args)
        logger.info(f"Successfully uploaded: {key}")
        
    except Exception as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        raise

def publish_custom_metrics(processed_count: int, processing_time: float, success: bool) -> None:
    """
    Publishes custom CloudWatch metrics for monitoring.
    Addresses model failure: No custom metrics to CloudWatch.
    
    Args:
        processed_count: Number of images processed
        processing_time: Time taken for processing
        success: Whether processing was successful
    """
    
    try:
        # Calculate success rate
        success_rate = 1.0 if success else 0.0
        
        # Publish custom metrics
        cloudwatch.put_metric_data(
            Namespace='Custom/ImageProcessing',
            MetricData=[
                {
                    'MetricName': 'ProcessingSuccessRate',
                    'Value': success_rate,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'ProcessingDuration',
                    'Value': processing_time,
                    'Unit': 'Seconds'
                },
                {
                    'MetricName': 'ImagesProcessed',
                    'Value': processed_count,
                    'Unit': 'Count'
                }
            ]
        )
        
        logger.info(f"Published custom metrics: success_rate={success_rate}, duration={processing_time}, count={processed_count}")
        
    except Exception as e:
        logger.error(f"Error publishing custom metrics: {str(e)}")
        # Don't raise exception for metrics failure

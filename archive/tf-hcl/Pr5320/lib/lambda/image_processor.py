import json
import boto3
import os
import uuid
from datetime import datetime
from PIL import Image
from io import BytesIO
import logging

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Image processing configurations
THUMBNAIL_SIZE = (150, 150)
PREVIEW_SIZE = (800, 600)

def handler(event, context):
    """
    Main Lambda handler for image processing
    """
    try:
        # Parse S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            # Extract metadata
            image_id = str(uuid.uuid4())
            user_id = extract_user_id(key)
            original_filename = os.path.basename(key)
            upload_timestamp = int(datetime.now().timestamp())
            
            logger.info(f"Processing image: {key}")
            
            # Download image from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            image_data = response['Body'].read()
            original_size = len(image_data)
            
            # Open image with Pillow
            image = Image.open(BytesIO(image_data))
            
            # Generate thumbnail
            thumbnail = create_resized_image(image, THUMBNAIL_SIZE, "thumbnail")
            thumbnail_key = f"processed/thumbnails/{image_id}_thumb.jpg"
            thumbnail_size = upload_image_to_s3(thumbnail, thumbnail_key, {"Type": "thumbnail"})
            
            # Generate preview
            preview = create_resized_image(image, PREVIEW_SIZE, "preview")
            preview_key = f"processed/previews/{image_id}_preview.jpg"
            preview_size = upload_image_to_s3(preview, preview_key, {"Type": "preview"})
            
            # Store metadata in DynamoDB
            table = dynamodb.Table(TABLE_NAME)
            processing_timestamp = int(datetime.now().timestamp())
            
            metadata_item = {
                'image_id': image_id,
                'user_id': user_id,
                'original_filename': original_filename,
                'original_key': key,
                'upload_timestamp': upload_timestamp,
                'processing_timestamp': processing_timestamp,
                'original_size': original_size,
                'thumbnail_key': thumbnail_key,
                'thumbnail_size': thumbnail_size,
                'preview_key': preview_key,
                'preview_size': preview_size,
                'processing_status': 'completed',
                'image_format': image.format,
                'image_dimensions': f"{image.width}x{image.height}"
            }
            
            table.put_item(Item=metadata_item)
            
            logger.info(f"Successfully processed image: {image_id}")
            
            # Return success metrics
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Image processed successfully',
                    'image_id': image_id,
                    'processing_time_ms': (processing_timestamp - upload_timestamp) * 1000
                })
            }
            
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        
        # Try to update DynamoDB with error status
        try:
            table = dynamodb.Table(TABLE_NAME)
            table.put_item(Item={
                'image_id': image_id if 'image_id' in locals() else str(uuid.uuid4()),
                'user_id': user_id if 'user_id' in locals() else 'unknown',
                'original_filename': original_filename if 'original_filename' in locals() else 'unknown',
                'processing_status': 'failed',
                'error_message': str(e),
                'upload_timestamp': upload_timestamp if 'upload_timestamp' in locals() else int(datetime.now().timestamp())
            })
        except:
            pass
        
        raise e

def extract_user_id(key):
    """
    Extract user ID from S3 key path
    Assumes format: uploads/{user_id}/{filename}
    """
    parts = key.split('/')
    if len(parts) >= 3:
        return parts[1]
    return 'unknown'

def create_resized_image(image, size, image_type):
    """
    Create a resized version of the image
    """
    # Convert RGBA to RGB if necessary
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
        image = background
    
    # Create copy and resize
    img_copy = image.copy()
    img_copy.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output = BytesIO()
    img_copy.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)
    
    return output

def upload_image_to_s3(image_data, key, tags):
    """
    Upload processed image to S3
    """
    image_bytes = image_data.read()
    
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType='image/jpeg',
        Tagging='&'.join([f"{k}={v}" for k, v in tags.items()])
    )
    
    return len(image_bytes)
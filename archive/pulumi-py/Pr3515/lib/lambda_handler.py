"""
lambda_handler.py

Lambda function handler for image processing and optimization.
"""

import json
import os
import boto3
import time
from datetime import datetime
from PIL import Image
import io
import uuid
from decimal import Decimal

s3_client = boto3.client('s3', region_name='us-west-1')
dynamodb = boto3.resource('dynamodb', region_name='us-west-1')
cloudwatch = boto3.client('cloudwatch', region_name='us-west-1')

WEBP_BUCKET = os.environ['WEBP_BUCKET']
JPEG_BUCKET = os.environ['JPEG_BUCKET']
PNG_BUCKET = os.environ['PNG_BUCKET']
METADATA_TABLE = os.environ['METADATA_TABLE']

def process_image(event, context):
    """
    Process uploaded images and generate optimized versions.

    Args:
        event: S3 event notification
        context: Lambda context

    Returns:
        Response with processing status
    """
    start_time = time.time()

    try:
        # Parse S3 event
        record = event['Records'][0]
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']
        object_size = record['s3']['object']['size']

        print(f"Processing image: {object_key} from bucket: {bucket_name}")

        # Download image from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        image_data = response['Body'].read()

        # Open image with PIL
        img = Image.open(io.BytesIO(image_data))

        # Generate unique ID for this image
        image_id = str(uuid.uuid4())
        base_name = os.path.splitext(os.path.basename(object_key))[0]

        # Process and upload different formats
        formats_info = {}

        # WebP format
        webp_key = f"{base_name}_{image_id}.webp"
        webp_buffer = io.BytesIO()
        img.save(webp_buffer, format='WEBP', quality=85, method=6)
        webp_buffer.seek(0)
        s3_client.put_object(
            Bucket=WEBP_BUCKET,
            Key=webp_key,
            Body=webp_buffer.getvalue(),
            ContentType='image/webp'
        )
        formats_info['webp'] = {
            'bucket': WEBP_BUCKET,
            'key': webp_key,
            'size': len(webp_buffer.getvalue())
        }

        # JPEG format
        jpeg_key = f"{base_name}_{image_id}.jpg"
        jpeg_buffer = io.BytesIO()
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        img.save(jpeg_buffer, format='JPEG', quality=85, optimize=True)
        jpeg_buffer.seek(0)
        s3_client.put_object(
            Bucket=JPEG_BUCKET,
            Key=jpeg_key,
            Body=jpeg_buffer.getvalue(),
            ContentType='image/jpeg'
        )
        formats_info['jpeg'] = {
            'bucket': JPEG_BUCKET,
            'key': jpeg_key,
            'size': len(jpeg_buffer.getvalue())
        }

        # PNG format
        png_key = f"{base_name}_{image_id}.png"
        png_buffer = io.BytesIO()
        img.save(png_buffer, format='PNG', optimize=True)
        png_buffer.seek(0)
        s3_client.put_object(
            Bucket=PNG_BUCKET,
            Key=png_key,
            Body=png_buffer.getvalue(),
            ContentType='image/png'
        )
        formats_info['png'] = {
            'bucket': PNG_BUCKET,
            'key': png_key,
            'size': len(png_buffer.getvalue())
        }

        # Store metadata in DynamoDB
        table = dynamodb.Table(METADATA_TABLE)
        table.put_item(
            Item={
                'image_id': image_id,
                'original_filename': object_key,
                'upload_timestamp': Decimal(str(datetime.now().timestamp())),
                'original_size': object_size,
                'formats': formats_info,
                'conversion_status': 'completed',
                'processing_time': Decimal(str(time.time() - start_time))
            }
        )

        # Send metrics to CloudWatch
        processing_time = time.time() - start_time
        cloudwatch.put_metric_data(
            Namespace='ImageOptimization',
            MetricData=[
                {
                    'MetricName': 'ProcessingTime',
                    'Value': processing_time,
                    'Unit': 'Seconds'
                },
                {
                    'MetricName': 'ProcessedImages',
                    'Value': 1,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'TotalBytesProcessed',
                    'Value': object_size,
                    'Unit': 'Bytes'
                }
            ]
        )

        print(f"Successfully processed image {image_id} in {processing_time:.2f} seconds")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'image_id': image_id,
                'formats': formats_info,
                'processing_time': processing_time
            })
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")

        # Send error metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='ImageOptimization',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        # Store error in DynamoDB
        if 'image_id' in locals():
            table = dynamodb.Table(METADATA_TABLE)
            table.put_item(
                Item={
                    'image_id': image_id,
                    'original_filename': object_key,
                    'upload_timestamp': Decimal(str(datetime.now().timestamp())),
                    'conversion_status': 'failed',
                    'error_message': str(e)
                }
            )

        raise e

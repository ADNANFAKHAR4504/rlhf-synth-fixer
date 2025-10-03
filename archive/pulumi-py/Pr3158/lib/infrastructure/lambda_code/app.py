"""
app.py

Sample Lambda function with X-Ray integration and Parameter Store usage.
Addresses model failures: X-Ray tracing minimal, Parameter Store inconsistent.
"""

import json
import logging
import os
import time
import traceback

import boto3
from aws_xray_sdk.core import patch_all, xray_recorder

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray tracing to boto3 calls
patch_all()

# Initialize clients
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')


@xray_recorder.capture('handler')
def handler(event, context):
    """
    Main Lambda function handler with comprehensive X-Ray tracing.
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Start a subsegment for getting configuration
        with xray_recorder.begin_subsegment('get_configuration'):
            # Get configuration from environment variables
            bucket_name = os.environ.get('S3_BUCKET_NAME')
            environment = os.environ.get('ENVIRONMENT')
            param_prefix = os.environ.get('PARAMETER_PREFIX')

            # Get secure parameters from Parameter Store
            try:
                response = ssm_client.get_parameters_by_path(
                    Path=param_prefix,
                    WithDecryption=True
                )
                parameters = {p['Name'].split('/')[-1]: p['Value'] for p in response.get('Parameters', [])}
                logger.info(f"Retrieved {len(parameters)} parameters from Parameter Store")
            except Exception as e:
                logger.error(f"Error retrieving parameters: {str(e)}")
                parameters = {}

        # Process the request with X-Ray tracing
        with xray_recorder.begin_subsegment('process_request'):
            # Simulate processing
            time.sleep(0.5)

            # Log to S3 with X-Ray tracing
            timestamp = int(time.time())
            log_content = {
                'timestamp': timestamp,
                'event': event,
                'environment': environment,
                'parameters': parameters
            }

            log_to_s3(bucket_name, timestamp, log_content)

        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': context.aws_request_id
            },
            'body': json.dumps({
                'message': 'Success!',
                'environment': environment,
                'timestamp': timestamp
            })
        }

    except Exception as e:
        # Log the exception with X-Ray
        with xray_recorder.begin_subsegment('error_handling'):
            logger.error(f"Error processing request: {str(e)}")
            logger.error(traceback.format_exc())

        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': context.aws_request_id
            },
            'body': json.dumps({
                'message': 'Internal server error',
                'error': str(e)
            })
        }


@xray_recorder.capture('log_to_s3')
def log_to_s3(bucket_name, timestamp, data):
    """
    Log data to S3 with X-Ray tracing.
    """
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=f"logs/{timestamp}.json",
            Body=json.dumps(data),
            ContentType='application/json',
            ServerSideEncryption='AES256'
        )
        logger.info(f"Successfully logged to S3: {bucket_name}/logs/{timestamp}.json")
    except Exception as e:
        logger.error(f"Error logging to S3: {str(e)}")
        raise


@xray_recorder.capture('get_parameters')
def get_parameters(param_prefix):
    """
    Get parameters from Parameter Store with X-Ray tracing.
    """
    try:
        response = ssm_client.get_parameters_by_path(
            Path=param_prefix,
            WithDecryption=True
        )
        return {p['Name'].split('/')[-1]: p['Value'] for p in response.get('Parameters', [])}
    except Exception as e:
        logger.error(f"Error getting parameters: {str(e)}")
        return {}


@xray_recorder.capture('health_check')
def health_check():
    """
    Health check function with X-Ray tracing.
    """
    return {
        'status': 'healthy',
        'timestamp': int(time.time()),
        'environment': os.environ.get('ENVIRONMENT', 'unknown')
    }

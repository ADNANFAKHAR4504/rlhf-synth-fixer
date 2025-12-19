import json
import os
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients (will use VPC endpoints)
s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for secure data processing in zero-trust environment.
    All AWS service calls use VPC endpoints for network isolation.
    """
    try:
        logger.info(f"Processing event in environment: {os.environ.get('ENVIRONMENT')}")

        bucket_name = os.environ.get('BUCKET_NAME')

        # Example: Process data with encryption enforcement
        # This is a placeholder - implement actual data processing logic

        result = {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Data processed successfully",
                "environment": os.environ.get('ENVIRONMENT'),
                "encrypted": True
            })
        }

        logger.info("Data processing completed successfully")
        return result

    except Exception as e:
        logger.error(f"Error processing data: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": "Error processing data",
                "error": str(e)
            })
        }


def get_secret(secret_name: str) -> Dict[str, Any]:
    """
    Retrieve secret from Secrets Manager using VPC endpoint.
    """
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Error retrieving secret: {str(e)}")
        raise


def process_encrypted_data(bucket: str, key: str) -> bytes:
    """
    Process data from S3 with automatic KMS decryption.
    """
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        return response['Body'].read()
    except Exception as e:
        logger.error(f"Error reading encrypted data: {str(e)}")
        raise


def store_encrypted_data(bucket: str, key: str, data: bytes) -> None:
    """
    Store data to S3 with KMS encryption enforcement.
    """
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ServerSideEncryption='aws:kms'
        )
        logger.info(f"Data stored with encryption: {key}")
    except Exception as e:
        logger.error(f"Error storing encrypted data: {str(e)}")
        raise

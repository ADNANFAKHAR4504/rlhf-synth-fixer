"""
Data Processing Lambda Function

This Lambda function processes sensitive data from S3 buckets
using credentials from Secrets Manager. All operations use
encrypted channels through VPC endpoints.
"""

import json
import boto3
import os
from typing import Dict, Any

# Initialize AWS clients
s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')


def get_credentials() -> Dict[str, str]:
    """
    Retrieve API credentials from Secrets Manager.

    Returns:
        Dictionary containing username and password
    """
    secret_arn = os.environ['SECRET_ARN']

    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except Exception as e:
        print(f"Error retrieving credentials: {str(e)}")
        raise


def process_s3_data(bucket_name: str) -> Dict[str, Any]:
    """
    Process data from S3 bucket with encryption validation.

    Args:
        bucket_name: Name of the S3 bucket to process

    Returns:
        Dictionary with processing results
    """
    try:
        # List objects in bucket
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            MaxKeys=100
        )

        objects = response.get('Contents', [])
        processed_count = 0

        # Process each object
        for obj in objects:
            key = obj['Key']

            # Get object metadata to verify encryption
            metadata = s3_client.head_object(
                Bucket=bucket_name,
                Key=key
            )

            # Verify server-side encryption
            encryption = metadata.get('ServerSideEncryption')
            if encryption != 'aws:kms':
                print(f"Warning: Object {key} not encrypted with KMS")
                continue

            processed_count += 1
            print(f"Processed encrypted object: {key}")

        return {
            'total_objects': len(objects),
            'processed_count': processed_count,
            'status': 'success'
        }

    except Exception as e:
        print(f"Error processing S3 data: {str(e)}")
        raise


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function for data processing.

    Args:
        event: Lambda event data
        context: Lambda context object

    Returns:
        API Gateway response format
    """
    try:
        # Retrieve credentials
        credentials = get_credentials()
        print(f"Credentials loaded for user: {credentials.get('username')}")

        # Get bucket name from environment
        bucket_name = os.environ['BUCKET_NAME']

        # Process data
        result = process_s3_data(bucket_name)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Data processing completed successfully',
                'result': result,
                'credentials_validated': True
            })
        }

    except Exception as e:
        print(f"Error in handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

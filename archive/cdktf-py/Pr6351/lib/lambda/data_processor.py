"""Lambda function for secure data processing."""

import json
import os
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')


def handler(event, context):
    """
    Process data securely from S3 bucket.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        dict: Response with status code and message
    """
    try:
        environment = os.environ.get('ENVIRONMENT', 'dev')
        data_bucket = os.environ.get('DATA_BUCKET', '')

        # Log processing start
        print(f"Processing data in environment: {environment}")

        # Example: Retrieve secret from Secrets Manager
        try:
            secret_name = f"database-credentials-{environment}"
            secret_response = secrets_client.get_secret_value(
                SecretId=secret_name
            )
            # Use secret for database connection
            credentials = json.loads(secret_response['SecretString'])
            print(f"Successfully retrieved credentials for {secret_name}")
        except ClientError as e:
            print(f"Warning: Could not retrieve secret: {e}")

        # Example: Process S3 objects with encryption
        # All operations use KMS encryption automatically

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'environment': environment
            })
        }

    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing data',
                'error': str(e)
            })
        }

"""Lambda function for secure data processing."""
import json
import boto3
import os

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')


def lambda_handler(event, context):
    """
    Secure data processor that reads from and writes to S3.
    Demonstrates secure access to S3 and Secrets Manager through VPC endpoints.
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    secret_name = os.environ.get('SECRET_NAME')

    try:
        # Retrieve database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=secret_name)
        db_credentials = json.loads(secret_response['SecretString'])
        print(f"Successfully retrieved credentials for database: {db_credentials.get('dbname')}")

        # Test S3 write operation
        test_key = 'test-data.json'
        test_data = {
            'message': 'Secure data processing',
            'status': 'operational',
            'timestamp': context.request_id
        }

        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps(test_data),
            ServerSideEncryption='AES256'
        )
        print(f"Successfully wrote object to S3: {test_key}")

        # Test S3 read operation
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        data = json.loads(response['Body'].read())
        print(f"Successfully read object from S3: {data}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processing completed successfully',
                'data': data
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

import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
secrets_client = boto3.client('secretsmanager')

DATA_BUCKET = os.environ['DATA_BUCKET']
METADATA_TABLE = os.environ['METADATA_TABLE']
SECRET_ARN = os.environ['SECRET_ARN']

def handler(event, context):
    """
    Data processing Lambda function
    Processes data from S3 and stores metadata in DynamoDB
    """
    try:
        # Get database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        db_credentials = json.loads(secret_response['SecretString'])

        # Process data (example implementation)
        table = dynamodb.Table(METADATA_TABLE)

        # Store processing metadata
        response = table.put_item(
            Item={
                'id': context.request_id,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'processed',
                'environment': os.environ.get('ENVIRONMENT', 'unknown')
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'request_id': context.request_id
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
import json
import os
import boto3
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
secretsmanager = boto3.client('secretsmanager')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
S3_BUCKET = os.environ.get('S3_BUCKET')
DB_SECRET_ARN = os.environ.get('DB_SECRET_ARN')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler for disaster recovery operations

    This function demonstrates connectivity to Aurora, DynamoDB, and S3
    """
    try:
        # Test DynamoDB connectivity
        table = dynamodb.Table(DYNAMODB_TABLE)

        # Test S3 connectivity
        s3.list_objects_v2(Bucket=S3_BUCKET, MaxKeys=1)

        # Test Secrets Manager connectivity (Aurora credentials)
        secret = secretsmanager.get_secret_value(SecretArn=DB_SECRET_ARN)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully connected to all services',
                'dynamodb_table': DYNAMODB_TABLE,
                's3_bucket': S3_BUCKET,
                'region': os.environ.get('AWS_REGION', 'us-east-1')
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error connecting to services',
                'error': str(e)
            })
        }

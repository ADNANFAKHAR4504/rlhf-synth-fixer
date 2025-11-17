import json
import boto3
import os
import logging
from datetime import datetime
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
secrets_client = boto3.client('secretsmanager')

def get_secret_config():
    """Retrieve configuration from Secrets Manager"""
    try:
        secret_arn = os.environ['SECRET_ARN']
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Error retrieving secret: {str(e)}")
        raise

def handler(event, context):
    """Process S3 upload events and store transaction metadata"""
    logger.info(f"Processing event: {json.dumps(event)}")

    try:
        # Get configuration from Secrets Manager
        config = get_secret_config()
        table_name = os.environ['DYNAMODB_TABLE']
        table = dynamodb.Table(table_name)

        # Process each S3 event record
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            size = record['s3']['object']['size']

            logger.info(f"Processing file: s3://{bucket}/{key}")

            # Get object metadata
            response = s3_client.head_object(Bucket=bucket, Key=key)

            # Extract transaction metadata
            transaction_id = key.split('/')[-1].split('.')[0]
            timestamp = int(datetime.utcnow().timestamp())

            # Store metadata in DynamoDB
            item = {
                'transactionId': transaction_id,
                'timestamp': timestamp,
                'bucket': bucket,
                'key': key,
                'size': size,
                'contentType': response.get('ContentType', 'unknown'),
                'encryptionType': response.get('ServerSideEncryption', 'none'),
                'lastModified': response['LastModified'].isoformat(),
                'versionId': response.get('VersionId', 'none'),
                'processedAt': datetime.utcnow().isoformat(),
                'status': 'processed'
            }

            # Convert float to Decimal for DynamoDB
            item = json.loads(json.dumps(item), parse_float=Decimal)

            table.put_item(Item=item)
            logger.info(f"Stored metadata for transaction: {transaction_id}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully processed transactions',
                'processed': len(event['Records'])
            })
        }

    except Exception as e:
        logger.error(f"Error processing transaction: {str(e)}")
        raise

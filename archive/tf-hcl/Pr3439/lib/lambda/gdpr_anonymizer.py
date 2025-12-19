# lambda/gdpr_anonymizer.py

import hashlib
import json
import logging
from datetime import datetime, timedelta

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

def get_table_name():
    """Retrieve DynamoDB table name from SSM"""
    try:
        response = ssm.get_parameter(
            Name='/travel-platform-api/config',
            WithDecryption=True
        )
        config = json.loads(response['Parameter']['Value'])
        return config['database_name']
    except ClientError as e:
        logger.error(f"Error retrieving SSM parameter: {e}")
        raise

def anonymize_user_data(item):
    """Anonymize user data for GDPR compliance"""
    # Hash the user_id to maintain consistency but remove PII
    if 'user_id' in item:
        original_id = item['user_id']
        item['user_id'] = hashlib.sha256(original_id.encode()).hexdigest()[:16]
        item['anonymized'] = True
        item['anonymized_date'] = datetime.utcnow().isoformat()
        logger.info(f"Anonymized user data for record: {item['search_id']}")
    return item

def handler(event, context):
    """
    Lambda handler for GDPR data anonymization
    Runs daily to anonymize data older than 30 days
    """
    logger.info("Starting GDPR anonymization process")
    
    try:
        table_name = get_table_name()
        table = dynamodb.Table(table_name)
        
        # Calculate timestamp for 30 days ago
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        cutoff_timestamp = int(thirty_days_ago.timestamp())
        
        # Scan for items that need anonymization
        response = table.scan(
            FilterExpression='#ts < :cutoff AND #anon = :false',
            ExpressionAttributeNames={
                '#ts': 'timestamp',
                '#anon': 'anonymized'
            },
            ExpressionAttributeValues={
                ':cutoff': cutoff_timestamp,
                ':false': False
            }
        )
        
        items_to_anonymize = response.get('Items', [])
        anonymized_count = 0
        
        # Process items in batches
        with table.batch_writer() as batch:
            for item in items_to_anonymize:
                anonymized_item = anonymize_user_data(item.copy())
                batch.put_item(Item=anonymized_item)
                anonymized_count += 1
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression='#ts < :cutoff AND #anon = :false',
                ExpressionAttributeNames={
                    '#ts': 'timestamp',
                    '#anon': 'anonymized'
                },
                ExpressionAttributeValues={
                    ':cutoff': cutoff_timestamp,
                    ':false': False
                },
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            
            items_to_anonymize = response.get('Items', [])
            with table.batch_writer() as batch:
                for item in items_to_anonymize:
                    anonymized_item = anonymize_user_data(item.copy())
                    batch.put_item(Item=anonymized_item)
                    anonymized_count += 1
        
        logger.info(f"Successfully anonymized {anonymized_count} records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'GDPR anonymization completed',
                'records_anonymized': anonymized_count,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error during anonymization: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Anonymization process failed',
                'message': str(e)
            })
        }

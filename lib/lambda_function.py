import json
import logging
import os
import boto3
from datetime import datetime
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')

def lambda_handler(event, context):
    """
    Data processor Lambda function
    Reads from raw data bucket, processes, and stores in processed bucket
    """
    
    # Get environment variables
    raw_bucket = os.environ.get('RAW_BUCKET')
    processed_bucket = os.environ.get('PROCESSED_BUCKET')
    audit_bucket = os.environ.get('AUDIT_BUCKET')
    metadata_table = os.environ.get('METADATA_TABLE')
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    logger.info(f"Starting processing job {job_id}")
    
    try:
        # Record job start in metadata table
        dynamodb_client.put_item(
            TableName=metadata_table,
            Item={
                'job_id': {'S': job_id},
                'status': {'S': 'PROCESSING'},
                'start_time': {'S': timestamp},
                'function_name': {'S': context.function_name},
                'request_id': {'S': context.aws_request_id}
            }
        )
        
        # Process data (simplified for example)
        if 'Records' in event:
            # S3 event trigger
            for record in event['Records']:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                
                logger.info(f"Processing object {key} from bucket {bucket}")
                
                # Get object from raw bucket
                response = s3_client.get_object(Bucket=bucket, Key=key)
                data = response['Body'].read()
                
                # Perform validation and transformation
                processed_data = validate_and_transform(data)
                
                # Store processed data
                processed_key = f"processed/{job_id}/{key}"
                s3_client.put_object(
                    Bucket=processed_bucket,
                    Key=processed_key,
                    Body=processed_data,
                    ServerSideEncryption='aws:kms'
                )
                
                logger.info(f"Stored processed data to {processed_bucket}/{processed_key}")
        
        # Update job status
        dynamodb_client.update_item(
            TableName=metadata_table,
            Key={'job_id': {'S': job_id}},
            UpdateExpression='SET #status = :status, end_time = :end_time',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': {'S': 'COMPLETED'},
                ':end_time': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        # Create audit log entry
        audit_entry = {
            'job_id': job_id,
            'timestamp': timestamp,
            'event': 'DATA_PROCESSING_COMPLETED',
            'details': {
                'function_name': context.function_name,
                'request_id': context.aws_request_id,
                'status': 'SUCCESS'
            }
        }
        
        s3_client.put_object(
            Bucket=audit_bucket,
            Key=f"audit-logs/{job_id}.json",
            Body=json.dumps(audit_entry),
            ServerSideEncryption='aws:kms'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'COMPLETED'
            })
        }
        
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        
        # Update job status to failed
        dynamodb_client.update_item(
            TableName=metadata_table,
            Key={'job_id': {'S': job_id}},
            UpdateExpression='SET #status = :status, error = :error, end_time = :end_time',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': {'S': 'FAILED'},
                ':error': {'S': str(e)},
                ':end_time': {'S': datetime.utcnow().isoformat()}
            }
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'job_id': job_id,
                'status': 'FAILED',
                'error': str(e)
            })
        }


def validator_handler(event, context):
    """
    Data validator Lambda function
    Validates processed data and creates audit records
    """
    
    # Get environment variables
    processed_bucket = os.environ.get('PROCESSED_BUCKET')
    audit_bucket = os.environ.get('AUDIT_BUCKET')
    audit_table = os.environ.get('AUDIT_TABLE')
    
    # Generate audit ID
    audit_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    logger.info(f"Starting validation audit {audit_id}")
    
    try:
        validation_results = []
        
        # Validate data (simplified for example)
        if 'Records' in event:
            for record in event['Records']:
                bucket = record['s3']['bucket']['name']
                key = record['s3']['object']['key']
                
                logger.info(f"Validating object {key} from bucket {bucket}")
                
                # Get object metadata
                response = s3_client.head_object(Bucket=bucket, Key=key)
                
                # Perform compliance checks
                checks = {
                    'encryption': response.get('ServerSideEncryption') == 'aws:kms',
                    'size_limit': response.get('ContentLength', 0) < 10485760,  # 10MB limit
                    'content_type': response.get('ContentType') in ['application/json', 'text/plain']
                }
                
                validation_results.append({
                    'object': key,
                    'checks': checks,
                    'passed': all(checks.values())
                })
        
        # Record audit in DynamoDB
        dynamodb_client.put_item(
            TableName=audit_table,
            Item={
                'audit_id': {'S': audit_id},
                'timestamp': {'S': timestamp},
                'audit_type': {'S': 'DATA_VALIDATION'},
                'performed_by': {'S': context.function_name},
                'request_id': {'S': context.aws_request_id},
                'results': {'S': json.dumps(validation_results)}
            }
        )
        
        # Store detailed audit log
        audit_log = {
            'audit_id': audit_id,
            'timestamp': timestamp,
            'event': 'DATA_VALIDATION',
            'function': context.function_name,
            'validation_results': validation_results
        }
        
        s3_client.put_object(
            Bucket=audit_bucket,
            Key=f"validation-logs/{audit_id}.json",
            Body=json.dumps(audit_log),
            ServerSideEncryption='aws:kms'
        )
        
        logger.info(f"Validation audit {audit_id} completed")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'audit_id': audit_id,
                'status': 'COMPLETED',
                'results': validation_results
            })
        }
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'audit_id': audit_id,
                'status': 'FAILED',
                'error': str(e)
            })
        }


def validate_and_transform(data):
    """
    Helper function to validate and transform data
    """
    try:
        # Convert bytes to string if needed
        if isinstance(data, bytes):
            data = data.decode('utf-8')
        
        # Parse JSON if applicable
        try:
            json_data = json.loads(data)
            
            # Add processing metadata
            json_data['processed_at'] = datetime.utcnow().isoformat()
            json_data['processing_version'] = '1.0'
            
            # Return transformed data
            return json.dumps(json_data).encode('utf-8')
        except json.JSONDecodeError:
            # If not JSON, just add metadata as header
            metadata = f"# Processed at: {datetime.utcnow().isoformat()}\n"
            return (metadata + data).encode('utf-8')
            
    except Exception as e:
        logger.error(f"Transformation error: {str(e)}")
        raise
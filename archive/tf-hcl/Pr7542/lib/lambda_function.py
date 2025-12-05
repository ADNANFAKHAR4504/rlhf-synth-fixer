"""
Lambda Function for S3 Event-Driven ETL Orchestration
======================================================
This function triggers Step Functions state machine execution when new data
arrives in the S3 raw/ prefix. It extracts metadata from S3 events and passes
structured input to the ETL pipeline for processing.

Cost optimization: Minimal Lambda invocations with 256MB memory allocation
Error handling: Comprehensive exception handling with CloudWatch logging
"""

import json
import os
import boto3
import logging
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
stepfunctions = boto3.client('stepfunctions')

# Environment variables
STEP_FUNCTION_ARN = os.environ['STEP_FUNCTION_ARN']
DATA_BUCKET = os.environ['DATA_BUCKET']


def lambda_handler(event, context):
    """
    Main handler for S3 event processing
    
    Args:
        event: S3 event notification containing bucket and object information
        context: Lambda runtime context
    
    Returns:
        dict: Response with processing status and execution details
    """
    
    logger.info(f"Received event: {json.dumps(event)}")
    
    responses = []
    
    try:
        # Process each S3 record in the event
        for record in event.get('Records', []):
            # Extract S3 object details
            s3_info = record.get('s3', {})
            bucket_name = s3_info.get('bucket', {}).get('name')
            object_key = s3_info.get('object', {}).get('key')
            object_size = s3_info.get('object', {}).get('size', 0)
            event_time = record.get('eventTime', '')
            
            # Validate required fields
            if not bucket_name or not object_key:
                logger.error("Missing bucket name or object key in S3 event")
                continue
            
            # Skip if not our configured bucket
            if bucket_name != DATA_BUCKET:
                logger.warning(f"Event from unexpected bucket: {bucket_name}")
                continue
            
            # Skip directory markers
            if object_key.endswith('/'):
                logger.info(f"Skipping directory marker: {object_key}")
                continue
            
            # Construct Step Functions input
            execution_name = f"etl-{object_key.replace('/', '-').replace('.', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Truncate execution name if too long (max 80 chars)
            if len(execution_name) > 80:
                execution_name = execution_name[:80]
            
            step_function_input = {
                "input_path": f"s3://{bucket_name}/{object_key}",
                "bucket": bucket_name,
                "key": object_key,
                "size_bytes": object_size,
                "event_time": event_time,
                "execution_name": execution_name,
                "timestamp": datetime.now().isoformat(),
                "processing_type": determine_processing_type(object_key)
            }
            
            logger.info(f"Starting Step Functions execution: {execution_name}")
            logger.info(f"Input: {json.dumps(step_function_input)}")
            
            try:
                # Start Step Functions execution
                response = stepfunctions.start_execution(
                    stateMachineArn=STEP_FUNCTION_ARN,
                    name=execution_name,
                    input=json.dumps(step_function_input)
                )
                
                logger.info(f"Successfully started execution: {response['executionArn']}")
                
                responses.append({
                    "status": "success",
                    "execution_arn": response['executionArn'],
                    "object_key": object_key,
                    "start_date": response['startDate'].isoformat() if isinstance(response['startDate'], datetime) else str(response['startDate'])
                })
                
            except ClientError as e:
                error_code = e.response['Error']['Code']
                error_message = e.response['Error']['Message']
                
                if error_code == 'ExecutionAlreadyExists':
                    logger.warning(f"Execution already exists: {execution_name}")
                    responses.append({
                        "status": "skipped",
                        "reason": "execution_already_exists",
                        "object_key": object_key
                    })
                elif error_code == 'InvalidName':
                    logger.error(f"Invalid execution name: {execution_name}")
                    responses.append({
                        "status": "error",
                        "error": "invalid_execution_name",
                        "object_key": object_key
                    })
                else:
                    logger.error(f"Failed to start execution: {error_code} - {error_message}")
                    responses.append({
                        "status": "error",
                        "error": error_code,
                        "message": error_message,
                        "object_key": object_key
                    })
                    # Re-raise for CloudWatch alerting
                    raise
            
            except Exception as e:
                logger.error(f"Unexpected error starting execution: {str(e)}")
                responses.append({
                    "status": "error",
                    "error": "unexpected_error",
                    "message": str(e),
                    "object_key": object_key
                })
                # Re-raise for CloudWatch alerting
                raise
    
    except Exception as e:
        logger.error(f"Fatal error processing S3 event: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "processing_failed",
                "message": str(e)
            })
        }
    
    # Return summary of processing results
    successful = sum(1 for r in responses if r.get('status') == 'success')
    failed = sum(1 for r in responses if r.get('status') == 'error')
    skipped = sum(1 for r in responses if r.get('status') == 'skipped')
    
    logger.info(f"Processing complete - Success: {successful}, Failed: {failed}, Skipped: {skipped}")
    
    return {
        "statusCode": 200 if failed == 0 else 207,  # 207 Multi-Status if partial success
        "body": json.dumps({
            "summary": {
                "total": len(responses),
                "successful": successful,
                "failed": failed,
                "skipped": skipped
            },
            "details": responses
        })
    }


def determine_processing_type(object_key):
    """
    Determine the type of processing based on file extension
    
    Args:
        object_key: S3 object key
    
    Returns:
        str: Processing type (json, csv, parquet, unknown)
    """
    
    if object_key.endswith('.json'):
        return 'json'
    elif object_key.endswith('.csv'):
        return 'csv'
    elif object_key.endswith('.parquet'):
        return 'parquet'
    else:
        return 'unknown'
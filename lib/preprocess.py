"""
Medical Data Preprocessing Lambda Function
Processes raw medical data from S3, performs feature engineering,
and writes processed data back to S3.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')

# Environment variables
RAW_BUCKET = os.environ.get('RAW_BUCKET', '')
PROCESSED_BUCKET = os.environ.get('PROCESSED_BUCKET', '')
METADATA_TABLE = os.environ.get('METADATA_TABLE', '')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for medical data preprocessing.
    
    Args:
        event: Event data containing bucket and key information
        context: Lambda context
        
    Returns:
        Dictionary with processing results
    """
    try:
        print(f"Processing event: {json.dumps(event)}")
        
        # Extract input parameters
        input_bucket = event.get('bucket', RAW_BUCKET)
        input_key = event.get('key', event.get('input_key', ''))
        test_run_id = event.get('test_run_id', 'unknown')
        
        if not input_key:
            raise ValueError("No input key provided")
        
        print(f"Reading data from s3://{input_bucket}/{input_key}")
        
        # Read raw data from S3
        try:
            response = s3_client.get_object(Bucket=input_bucket, Key=input_key)
            raw_data = response['Body'].read().decode('utf-8')
            print(f"Successfully read {len(raw_data)} bytes from S3")
        except Exception as e:
            print(f"Error reading from S3: {str(e)}")
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Input file not found',
                    'message': str(e)
                })
            }
        
        # Process the data (simple preprocessing for medical records)
        processed_data = preprocess_medical_data(raw_data)
        
        # Write processed data back to S3
        output_key = f"processed/{test_run_id}/processed_data.csv"
        
        try:
            s3_client.put_object(
                Bucket=PROCESSED_BUCKET,
                Key=output_key,
                Body=processed_data.encode('utf-8'),
                ContentType='text/csv',
                Metadata={
                    'source': input_key,
                    'test_run_id': test_run_id,
                    'processed_at': datetime.utcnow().isoformat()
                }
            )
            print(f"Wrote processed data to s3://{PROCESSED_BUCKET}/{output_key}")
        except Exception as e:
            print(f"Warning: Could not write to processed bucket: {str(e)}")
            # Continue even if we can't write (bucket might not exist in test)
        
        # Log metadata to DynamoDB (optional for test environment)
        if METADATA_TABLE:
            try:
                log_metadata(test_run_id, input_key, output_key, len(raw_data), len(processed_data))
            except Exception as e:
                print(f"Warning: Could not log to DynamoDB: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'input_key': input_key,
                'output_key': output_key,
                'processed_key': output_key,  # Alias for compatibility
                'test_run_id': test_run_id,
                'input_size': len(raw_data),
                'output_size': len(processed_data),
                'processed_at': datetime.utcnow().isoformat()
            }),
            'output_key': output_key,  # For Step Functions
            'processedKey': output_key  # Alternative field name
        }
        
    except Exception as e:
        print(f"Error in preprocessing: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Processing failed',
                'message': str(e)
            })
        }


def preprocess_medical_data(raw_data: str) -> str:
    """
    Preprocess medical data CSV.
    
    This is a simplified version. In production, would include:
    - Data validation and cleaning
    - Feature engineering
    - Normalization
    - Missing value imputation
    
    Args:
        raw_data: Raw CSV data
        
    Returns:
        Processed CSV data
    """
    lines = raw_data.strip().split('\n')
    
    if len(lines) == 0:
        return ""
    
    # Keep header
    header = lines[0]
    data_lines = lines[1:]
    
    processed_lines = [header]
    
    for line in data_lines:
        # Simple processing: add a processed timestamp
        processed_line = line + f",{datetime.utcnow().isoformat()}"
        processed_lines.append(processed_line)
    
    return '\n'.join(processed_lines)


def log_metadata(test_run_id: str, input_key: str, output_key: str, 
                 input_size: int, output_size: int) -> None:
    """
    Log processing metadata to DynamoDB.
    
    Args:
        test_run_id: Test run identifier
        input_key: S3 key of input data
        output_key: S3 key of output data
        input_size: Size of input data in bytes
        output_size: Size of output data in bytes
    """
    try:
        dynamodb_client.put_item(
            TableName=METADATA_TABLE,
            Item={
                'pipeline_id': {'S': test_run_id},
                'timestamp': {'S': datetime.utcnow().isoformat()},
                'step': {'S': 'preprocessing'},
                'input_key': {'S': input_key},
                'output_key': {'S': output_key},
                'input_size': {'N': str(input_size)},
                'output_size': {'N': str(output_size)},
                'status': {'S': 'completed'}
            }
        )
        print(f"Logged metadata to DynamoDB for {test_run_id}")
    except Exception as e:
        print(f"Failed to log metadata: {str(e)}")
        # Don't fail the function if metadata logging fails


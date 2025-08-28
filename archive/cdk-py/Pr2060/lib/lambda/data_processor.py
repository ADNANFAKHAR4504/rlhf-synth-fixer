import json
import boto3
import os
import logging
import csv
import io
from datetime import datetime
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
METADATA_TABLE_NAME = os.environ['METADATA_TABLE_NAME']
table = dynamodb.Table(METADATA_TABLE_NAME)

def handler(event, context) -> Dict[str, Any]:
    """
    Processes data files (CSV, JSON) uploaded to S3.
    Analyzes data structure and performs statistical analysis.
    """
    try:
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            logger.info(f"Processing data file: {object_key} from bucket: {bucket_name}")
            
            try:
                # Extract file metadata
                response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                file_size = response['ContentLength']
                last_modified = response['LastModified'].isoformat()
                content_type = response.get('ContentType', 'unknown')
                
                # Generate presigned URL for secure access
                presigned_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket_name, 'Key': object_key},
                    ExpiresIn=3600
                )
                
                # Process data content
                data_analysis = process_data_file(bucket_name, object_key)
                
                # Store metadata in DynamoDB
                file_id = f"data_{object_key.replace('/', '_')}"
                table.put_item(
                    Item={
                        'fileId': file_id,
                        'fileName': object_key,
                        'fileType': 'data',
                        'fileSize': file_size,
                        'contentType': content_type,
                        'uploadTime': last_modified,
                        'processedTime': datetime.now().isoformat(),
                        'status': 'processed',
                        'analysis': data_analysis,
                        'presignedUrl': presigned_url,
                        'bucketName': bucket_name
                    }
                )
                
                logger.info(f"Successfully processed data file: {object_key}")
                
            except Exception as e:
                logger.error(f"Error processing data file {object_key}: {str(e)}")
                # Store error status
                file_id = f"data_{object_key.replace('/', '_')}"
                table.put_item(
                    Item={
                        'fileId': file_id,
                        'fileName': object_key,
                        'fileType': 'data',
                        'uploadTime': datetime.now().isoformat(),
                        'processedTime': datetime.now().isoformat(),
                        'status': 'error',
                        'error': str(e),
                        'bucketName': bucket_name
                    }
                )
                continue
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processing completed',
                'processed_files': len(event['Records'])
            })
        }
        
    except Exception as e:
        logger.error(f"Critical error in data processor: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process data files',
                'details': str(e)
            })
        }

def process_data_file(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """
    Processes CSV or JSON data files and performs analysis.
    """
    try:
        file_extension = object_key.lower().split('.')[-1]
        
        # Get file content
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        file_content = response['Body'].read().decode('utf-8')
        
        if file_extension == 'csv':
            return process_csv_data(file_content, object_key)
        elif file_extension == 'json':
            return process_json_data(file_content, object_key)
        else:
            logger.warning(f"Unsupported data file type: {file_extension}")
            return {
                'error': f'Unsupported file type: {file_extension}',
                'supported_types': ['csv', 'json']
            }
            
    except Exception as e:
        logger.error(f"Data processing failed for {object_key}: {str(e)}")
        return {
            'error': 'Data processing failed',
            'details': str(e)
        }

def process_csv_data(csv_content: str, object_key: str) -> Dict[str, Any]:
    """
    Analyzes CSV data structure and content.
    """
    try:
        # Parse CSV content
        csv_reader = csv.reader(io.StringIO(csv_content))
        rows = list(csv_reader)
        
        if not rows:
            return {'error': 'Empty CSV file'}
        
        headers = rows[0] if rows else []
        data_rows = rows[1:] if len(rows) > 1 else []
        
        # Basic statistical analysis
        analysis = {
            'file_type': 'csv',
            'total_rows': len(data_rows),
            'total_columns': len(headers),
            'headers': headers,
            'sample_rows': data_rows[:5],  # First 5 rows as sample
            'file_structure': {
                'has_headers': True,
                'delimiter': ',',
                'encoding': 'utf-8'
            },
            'data_quality': {
                'empty_cells_count': count_empty_cells(data_rows),
                'data_types': infer_column_types(data_rows, headers)
            },
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"CSV analysis completed for {object_key}: {len(data_rows)} rows, {len(headers)} columns")
        return analysis
        
    except Exception as e:
        logger.error(f"CSV processing failed for {object_key}: {str(e)}")
        return {
            'error': 'CSV processing failed',
            'details': str(e)
        }

def process_json_data(json_content: str, object_key: str) -> Dict[str, Any]:
    """
    Analyzes JSON data structure and content.
    """
    try:
        # Parse JSON content
        data = json.loads(json_content)
        
        # Analyze JSON structure
        analysis = {
            'file_type': 'json',
            'data_type': type(data).__name__,
            'structure_analysis': analyze_json_structure(data),
            'sample_content': get_json_sample(data),
            'validation': {
                'is_valid_json': True,
                'structure_type': 'object' if isinstance(data, dict) else 'array' if isinstance(data, list) else 'primitive'
            },
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"JSON analysis completed for {object_key}")
        return analysis
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format in {object_key}: {str(e)}")
        return {
            'error': 'Invalid JSON format',
            'details': str(e),
            'validation': {
                'is_valid_json': False
            }
        }
    except Exception as e:
        logger.error(f"JSON processing failed for {object_key}: {str(e)}")
        return {
            'error': 'JSON processing failed',
            'details': str(e)
        }

def count_empty_cells(data_rows: List[List[str]]) -> int:
    """Counts empty cells in CSV data."""
    empty_count = 0
    for row in data_rows:
        for cell in row:
            if not cell or cell.strip() == '':
                empty_count += 1
    return empty_count

def infer_column_types(data_rows: List[List[str]], headers: List[str]) -> Dict[str, str]:
    """Infers data types for CSV columns."""
    column_types = {}
    
    if not data_rows or not headers:
        return column_types
    
    for col_idx, header in enumerate(headers):
        sample_values = []
        for row in data_rows[:10]:  # Sample first 10 rows
            if col_idx < len(row) and row[col_idx].strip():
                sample_values.append(row[col_idx].strip())
        
        if sample_values:
            # Simple type inference
            if all(val.isdigit() for val in sample_values):
                column_types[header] = 'integer'
            elif all(is_float(val) for val in sample_values):
                column_types[header] = 'float'
            else:
                column_types[header] = 'string'
        else:
            column_types[header] = 'unknown'
    
    return column_types

def is_float(value: str) -> bool:
    """Checks if a string represents a float."""
    try:
        float(value)
        return True
    except ValueError:
        return False

def analyze_json_structure(data: Any, max_depth: int = 3, current_depth: int = 0) -> Dict[str, Any]:
    """Recursively analyzes JSON structure."""
    if current_depth >= max_depth:
        return {'max_depth_reached': True}
    
    if isinstance(data, dict):
        return {
            'type': 'object',
            'keys_count': len(data),
            'keys': list(data.keys())[:10],  # First 10 keys
            'nested_structure': {k: analyze_json_structure(v, max_depth, current_depth + 1) 
                               for k, v in list(data.items())[:5]}  # First 5 nested items
        }
    elif isinstance(data, list):
        return {
            'type': 'array',
            'length': len(data),
            'element_types': list(set(type(item).__name__ for item in data[:10])),  # Types of first 10 items
            'sample_structure': analyze_json_structure(data[0], max_depth, current_depth + 1) if data else None
        }
    else:
        return {
            'type': type(data).__name__,
            'value': str(data)[:100] if len(str(data)) > 100 else str(data)
        }

def get_json_sample(data: Any) -> Any:
    """Returns a sample of JSON data for preview."""
    if isinstance(data, dict):
        # Return first 3 key-value pairs
        return {k: v for k, v in list(data.items())[:3]}
    elif isinstance(data, list):
        # Return first 3 items
        return data[:3]
    else:
        return data
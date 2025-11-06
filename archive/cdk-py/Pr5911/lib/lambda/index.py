"""
PII Scanner Lambda Function

This Lambda function scans S3 objects for Personally Identifiable Information (PII)
using regex patterns. It detects common PII patterns including:
- Social Security Numbers (SSN)
- Credit Card Numbers
- Email Addresses
- Phone Numbers
- IP Addresses

The function runs in a VPC with private subnets and uses VPC endpoints
to access S3 and KMS services without traversing the public internet.
"""

import json
import os
import re
import boto3
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
s3_client = boto3.client('s3')

# PII Detection Patterns
PII_PATTERNS = {
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
    'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'phone': r'\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',
    'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
}


def scan_content_for_pii(content: str) -> Dict[str, List[str]]:
    """
    Scan content for PII using regex patterns.

    Args:
        content (str): The content to scan for PII

    Returns:
        Dict[str, List[str]]: Dictionary mapping PII type to list of matches
    """
    findings = {}

    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, content)
        if matches:
            # Remove duplicates and keep first 10 matches
            unique_matches = list(set(matches))[:10]
            findings[pii_type] = unique_matches

    return findings


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function for PII scanning.

    This function can be triggered via:
    1. API Gateway POST request with {"objectKey": "path/to/file.txt"}
    2. S3 event notification (future enhancement)

    Args:
        event (Dict[str, Any]): Lambda event object
        context (Any): Lambda context object

    Returns:
        Dict[str, Any]: Response with scan results
    """
    try:
        print(f"Received event: {json.dumps(event)}")

        # Get bucket name from environment variable
        bucket_name = os.environ.get('BUCKET_NAME')
        if not bucket_name:
            raise ValueError("BUCKET_NAME environment variable not set")

        # Extract object key from API Gateway request or S3 event
        object_key = None

        # Check if event is from API Gateway
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            object_key = body.get('objectKey')
        # Check if event is from S3
        elif 'Records' in event and len(event['Records']) > 0:
            record = event['Records'][0]
            if 's3' in record:
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']

        if not object_key:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing objectKey in request body',
                    'message': 'Please provide objectKey in the request body'
                })
            }

        print(f"Scanning object: s3://{bucket_name}/{object_key}")

        # Get object from S3
        try:
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            content = response['Body'].read().decode('utf-8')
        except s3_client.exceptions.NoSuchKey:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': 'Object not found',
                    'bucket': bucket_name,
                    'key': object_key
                })
            }
        except Exception as e:
            print(f"Error reading S3 object: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'Failed to read S3 object',
                    'message': str(e)
                })
            }

        # Scan content for PII
        pii_findings = scan_content_for_pii(content)

        # Prepare scan results
        scan_result = {
            'bucket': bucket_name,
            'key': object_key,
            'scanned_at': datetime.utcnow().isoformat(),
            'pii_found': len(pii_findings) > 0,
            'pii_types': list(pii_findings.keys()),
            'findings': pii_findings,
            'total_matches': sum(len(matches) for matches in pii_findings.values()),
        }

        # Store scan results back to S3
        result_key = f"scan-results/{object_key}.json"
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=result_key,
                Body=json.dumps(scan_result, indent=2),
                ContentType='application/json',
            )
            scan_result['result_location'] = f"s3://{bucket_name}/{result_key}"
        except Exception as e:
            print(f"Warning: Failed to store scan results: {str(e)}")

        # Log findings
        if pii_findings:
            print(f"PII detected - Types: {list(pii_findings.keys())}")
            for pii_type, matches in pii_findings.items():
                print(f"  {pii_type}: {len(matches)} match(es)")
        else:
            print("No PII detected")

        # Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'message': 'PII scan completed',
                'scan_result': scan_result
            })
        }

    except Exception as e:
        print(f"Error in PII scanner: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

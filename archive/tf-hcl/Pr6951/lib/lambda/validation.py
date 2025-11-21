"""
Validation Lambda Function
Validates data consistency between source and target regions
"""
import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any, List

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

SOURCE_BUCKET = os.environ.get('SOURCE_BUCKET')
TARGET_BUCKET = os.environ.get('TARGET_BUCKET')
METADATA_TABLE = os.environ.get('METADATA_TABLE')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for validation Lambda function

    Args:
        event: Lambda event
        context: Lambda context object

    Returns:
        Validation results with consistency check
    """
    try:
        print(f"Starting validation at {datetime.utcnow().isoformat()}")

        validation_results = {
            'documents_validated': 0,
            'inconsistencies': [],
            'validation_passed': True,
            'timestamp': datetime.utcnow().isoformat()
        }

        # Get sample of documents to validate
        document_keys = get_sample_documents()

        for key in document_keys:
            result = validate_document(key)
            validation_results['documents_validated'] += 1

            if not result['consistent']:
                validation_results['inconsistencies'].append(result)
                validation_results['validation_passed'] = False

        # Publish validation metrics
        publish_validation_metrics(validation_results)

        print(f"Validation complete: {json.dumps(validation_results)}")

        return {
            'statusCode': 200,
            'body': json.dumps(validation_results)
        }

    except Exception as e:
        error_msg = f"Validation error: {str(e)}"
        print(error_msg)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }


def get_sample_documents() -> List[str]:
    """
    Get sample of document keys for validation

    Returns:
        List of document keys
    """
    try:
        response = s3_client.list_objects_v2(
            Bucket=SOURCE_BUCKET,
            MaxKeys=100
        )

        if 'Contents' in response:
            return [obj['Key'] for obj in response['Contents'][:10]]

        return []

    except Exception as e:
        print(f"Error getting sample documents: {str(e)}")
        return []


def validate_document(key: str) -> Dict[str, Any]:
    """
    Validate document consistency between source and target

    Args:
        key: Document key

    Returns:
        Validation result
    """
    try:
        # Get source object metadata
        source_response = s3_client.head_object(
            Bucket=SOURCE_BUCKET,
            Key=key
        )

        # Get target object metadata
        try:
            target_response = s3_client.head_object(
                Bucket=TARGET_BUCKET,
                Key=key
            )
        except s3_client.exceptions.NoSuchKey:
            return {
                'key': key,
                'consistent': False,
                'reason': 'Document not replicated to target'
            }

        # Compare metadata
        source_etag = source_response.get('ETag', '')
        target_etag = target_response.get('ETag', '')

        consistent = (source_etag == target_etag)

        return {
            'key': key,
            'consistent': consistent,
            'reason': 'Match' if consistent else 'ETag mismatch'
        }

    except Exception as e:
        return {
            'key': key,
            'consistent': False,
            'reason': f"Validation error: {str(e)}"
        }


def publish_validation_metrics(results: Dict[str, Any]) -> None:
    """
    Publish validation metrics to CloudWatch

    Args:
        results: Validation results
    """
    try:
        metric_data = [
            {
                'MetricName': 'DocumentsValidated',
                'Value': results['documents_validated'],
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'InconsistenciesFound',
                'Value': len(results['inconsistencies']),
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'ValidationPassed',
                'Value': 1 if results['validation_passed'] else 0,
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }
        ]

        cloudwatch.put_metric_data(
            Namespace='DocumentProcessingMigration',
            MetricData=metric_data
        )

    except Exception as e:
        print(f"Failed to publish validation metrics: {str(e)}")

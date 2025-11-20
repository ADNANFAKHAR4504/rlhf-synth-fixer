"""
Data Synchronization Lambda Function
Handles cross-region data synchronization for document processing migration
"""
import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

SOURCE_BUCKET = os.environ.get('SOURCE_BUCKET')
TARGET_BUCKET = os.environ.get('TARGET_BUCKET')
METADATA_TABLE = os.environ.get('METADATA_TABLE')
SOURCE_REGION = os.environ.get('SOURCE_REGION', 'us-east-1')
TARGET_REGION = os.environ.get('TARGET_REGION', 'eu-west-1')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for data synchronization Lambda function

    Args:
        event: Lambda event containing S3 or DynamoDB stream records
        context: Lambda context object

    Returns:
        Response with sync status and metrics
    """
    try:
        print(f"Starting data synchronization at {datetime.utcnow().isoformat()}")
        print(f"Event: {json.dumps(event)}")

        sync_results = {
            'documents_synced': 0,
            'metadata_synced': 0,
            'errors': [],
            'timestamp': datetime.utcnow().isoformat()
        }

        # Handle S3 events
        if 'Records' in event and event['Records']:
            for record in event['Records']:
                if 's3' in record:
                    result = sync_document(record['s3'])
                    if result['success']:
                        sync_results['documents_synced'] += 1
                    else:
                        sync_results['errors'].append(result['error'])

                elif 'dynamodb' in record:
                    result = sync_metadata(record['dynamodb'])
                    if result['success']:
                        sync_results['metadata_synced'] += 1
                    else:
                        sync_results['errors'].append(result['error'])

        # Publish metrics to CloudWatch
        publish_sync_metrics(sync_results)

        print(f"Synchronization complete: {json.dumps(sync_results)}")

        return {
            'statusCode': 200,
            'body': json.dumps(sync_results)
        }

    except Exception as e:
        error_msg = f"Error in data synchronization: {str(e)}"
        print(error_msg)

        # Publish error metric
        cloudwatch.put_metric_data(
            Namespace='DocumentProcessingMigration',
            MetricData=[
                {
                    'MetricName': 'SyncErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }


def sync_document(s3_event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Synchronize a document between source and target S3 buckets

    Args:
        s3_event: S3 event data

    Returns:
        Result with success status and details
    """
    try:
        bucket = s3_event['bucket']['name']
        key = s3_event['object']['key']

        print(f"Syncing document: {key} from {bucket}")

        # Copy object from source to target
        copy_source = {'Bucket': bucket, 'Key': key}

        s3_client.copy_object(
            CopySource=copy_source,
            Bucket=TARGET_BUCKET,
            Key=key,
            ServerSideEncryption='AES256'
        )

        # Update metadata table
        update_document_metadata(key, 'synced')

        return {'success': True, 'key': key}

    except Exception as e:
        return {'success': False, 'error': f"Document sync failed for {key}: {str(e)}"}


def sync_metadata(dynamodb_event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Synchronize metadata between regions (handled by DynamoDB global tables)

    Args:
        dynamodb_event: DynamoDB stream event

    Returns:
        Result with success status
    """
    try:
        # DynamoDB global tables handle replication automatically
        # This function validates and logs the sync
        event_name = dynamodb_event.get('eventName', 'UNKNOWN')
        keys = dynamodb_event.get('Keys', {})

        print(f"Metadata sync event: {event_name} for keys: {keys}")

        return {'success': True, 'event': event_name}

    except Exception as e:
        return {'success': False, 'error': f"Metadata sync validation failed: {str(e)}"}


def update_document_metadata(document_key: str, status: str) -> None:
    """
    Update document metadata in DynamoDB table

    Args:
        document_key: S3 object key
        status: Document sync status
    """
    try:
        table = dynamodb.Table(METADATA_TABLE)

        table.put_item(
            Item={
                'DocumentId': document_key,
                'Timestamp': int(datetime.utcnow().timestamp()),
                'Status': status,
                'SourceRegion': SOURCE_REGION,
                'TargetRegion': TARGET_REGION,
                'LastSyncTime': datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        print(f"Failed to update metadata for {document_key}: {str(e)}")


def publish_sync_metrics(sync_results: Dict[str, Any]) -> None:
    """
    Publish synchronization metrics to CloudWatch

    Args:
        sync_results: Results from sync operation
    """
    try:
        metric_data = [
            {
                'MetricName': 'DocumentsSynced',
                'Value': sync_results['documents_synced'],
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'MetadataSynced',
                'Value': sync_results['metadata_synced'],
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            },
            {
                'MetricName': 'SyncErrors',
                'Value': len(sync_results['errors']),
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }
        ]

        cloudwatch.put_metric_data(
            Namespace='DocumentProcessingMigration',
            MetricData=metric_data
        )

    except Exception as e:
        print(f"Failed to publish metrics: {str(e)}")

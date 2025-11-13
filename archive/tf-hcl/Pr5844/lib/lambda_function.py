import json
import boto3
import os
import logging
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
rds_primary = boto3.client('rds')
s3 = boto3.client('s3')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Handler for primary region Lambda that copies snapshots to DR region
    """
    destination_region = os.environ['DESTINATION_REGION']
    destination_kms_key = os.environ['DESTINATION_KMS_KEY']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    s3_bucket = os.environ['S3_BUCKET_NAME']
    rds_instance_id = os.environ['RDS_INSTANCE_ID']
    
    try:
        # Check if this is an EventBridge event or direct invocation
        if 'detail-type' in event and event['detail-type'] == 'RDS DB Snapshot Event':
            # Extract snapshot ID from EventBridge event
            snapshot_id = event['detail'].get('SourceArn', '').split(':')[-1]
            if not snapshot_id:
                logger.error("Could not extract snapshot ID from event")
                return {
                    'statusCode': 400,
                    'body': json.dumps('Invalid event format')
                }
        else:
            # Get the latest automated snapshot for the RDS instance
            snapshot_id = get_latest_snapshot(rds_instance_id)
            if not snapshot_id:
                logger.warning(f"No snapshots found for instance {rds_instance_id}")
                return {
                    'statusCode': 200,
                    'body': json.dumps('No snapshots to copy')
                }
        
        # Verify snapshot exists and is available
        try:
            response = rds_primary.describe_db_snapshots(
                DBSnapshotIdentifier=snapshot_id
            )
            snapshot = response['DBSnapshots'][0]
            
            if snapshot['Status'] != 'available':
                logger.info(f"Snapshot {snapshot_id} is not available yet. Status: {snapshot['Status']}")
                return {
                    'statusCode': 200,
                    'body': json.dumps('Snapshot not ready for copying')
                }
        except ClientError as e:
            logger.error(f"Error describing snapshot {snapshot_id}: {e}")
            send_alert(sns_topic_arn, f"Failed to describe snapshot {snapshot_id}", str(e))
            raise
        
        # Initialize DR region RDS client
        rds_dr = boto3.client('rds', region_name=destination_region)
        
        # Generate target snapshot identifier
        target_snapshot_id = f"{snapshot_id}-dr-copy"
        
        # Check if snapshot already exists in DR region
        try:
            rds_dr.describe_db_snapshots(DBSnapshotIdentifier=target_snapshot_id)
            logger.info(f"Snapshot {target_snapshot_id} already exists in {destination_region}")
            return {
                'statusCode': 200,
                'body': json.dumps('Snapshot already copied')
            }
        except ClientError as e:
            if e.response['Error']['Code'] != 'DBSnapshotNotFound':
                logger.error(f"Error checking for existing snapshot: {e}")
                raise
        
        # Copy snapshot to DR region
        logger.info(f"Copying snapshot {snapshot_id} to {destination_region}")
        try:
            copy_response = rds_dr.copy_db_snapshot(
                SourceDBSnapshotIdentifier=f"arn:aws:rds:{rds_primary.meta.region_name}:{get_account_id()}:snapshot:{snapshot_id}",
                TargetDBSnapshotIdentifier=target_snapshot_id,
                KmsKeyId=destination_kms_key,
                CopyTags=True
            )
            
            logger.info(f"Snapshot copy initiated: {copy_response['DBSnapshot']['DBSnapshotArn']}")
            
            # Store metadata in S3
            metadata = {
                'source_snapshot_id': snapshot_id,
                'target_snapshot_id': target_snapshot_id,
                'source_region': rds_primary.meta.region_name,
                'destination_region': destination_region,
                'copy_initiated_at': datetime.now(timezone.utc).isoformat(),
                'rds_instance_id': rds_instance_id,
                'snapshot_size_gb': snapshot.get('AllocatedStorage', 0)
            }
            
            s3.put_object(
                Bucket=s3_bucket,
                Key=f"snapshot-copies/{target_snapshot_id}/metadata.json",
                Body=json.dumps(metadata),
                ContentType='application/json'
            )
            
            # Send success notification
            send_alert(
                sns_topic_arn,
                f"Snapshot Copy Initiated: {snapshot_id}",
                f"Successfully initiated copy of snapshot {snapshot_id} to {destination_region}"
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Snapshot copy initiated successfully',
                    'source_snapshot': snapshot_id,
                    'target_snapshot': target_snapshot_id,
                    'destination_region': destination_region
                })
            }
            
        except ClientError as e:
            logger.error(f"Failed to copy snapshot: {e}")
            send_alert(
                sns_topic_arn,
                f"Snapshot Copy Failed: {snapshot_id}",
                f"Failed to copy snapshot {snapshot_id} to {destination_region}: {str(e)}"
            )
            raise
            
    except Exception as e:
        logger.error(f"Unexpected error in snapshot copy Lambda: {e}")
        send_alert(
            sns_topic_arn,
            "Critical Error in Snapshot Copy Lambda",
            f"Unexpected error occurred: {str(e)}"
        )
        raise

def validate_snapshot_handler(event, context):
    """
    Handler for DR region Lambda that validates snapshot freshness
    """
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    s3_bucket = os.environ['S3_BUCKET_NAME']
    source_region = os.environ['SOURCE_REGION']
    
    try:
        # Get list of all snapshots in DR region
        rds_dr = boto3.client('rds')
        
        paginator = rds_dr.get_paginator('describe_db_snapshots')
        page_iterator = paginator.paginate(
            SnapshotType='manual',
            PaginationConfig={'MaxItems': 100}
        )
        
        latest_snapshot = None
        latest_timestamp = None
        
        for page in page_iterator:
            for snapshot in page.get('DBSnapshots', []):
                # Check if this is a DR copy (contains '-dr-copy' in the identifier)
                if '-dr-copy' in snapshot['DBSnapshotIdentifier']:
                    snapshot_time = snapshot.get('SnapshotCreateTime')
                    if snapshot_time and (not latest_timestamp or snapshot_time > latest_timestamp):
                        latest_snapshot = snapshot
                        latest_timestamp = snapshot_time
        
        if not latest_snapshot:
            logger.error("No DR snapshots found")
            send_alert(
                sns_topic_arn,
                "Critical: No DR Snapshots Found",
                f"No disaster recovery snapshots found in {rds_dr.meta.region_name}"
            )
            
            # Publish metric for monitoring
            cloudwatch.put_metric_data(
                Namespace='CustomDR',
                MetricData=[
                    {
                        'MetricName': 'SnapshotAge',
                        'Value': 999999,  # Large value to trigger alarm
                        'Unit': 'Seconds',
                        'Timestamp': datetime.now(timezone.utc)
                    }
                ]
            )
            
            return {
                'statusCode': 500,
                'body': json.dumps('No DR snapshots found')
            }
        
        # Calculate snapshot age
        current_time = datetime.now(timezone.utc)
        snapshot_age = (current_time - latest_timestamp.replace(tzinfo=timezone.utc)).total_seconds()
        
        logger.info(f"Latest DR snapshot: {latest_snapshot['DBSnapshotIdentifier']}, Age: {snapshot_age} seconds")
        
        # Publish metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='CustomDR',
            MetricData=[
                {
                    'MetricName': 'SnapshotAge',
                    'Value': snapshot_age,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.now(timezone.utc)
                },
                {
                    'MetricName': 'SnapshotCount',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
        
        # Alert if snapshot is too old (> 2 hours)
        if snapshot_age > 7200:
            logger.warning(f"DR snapshot is stale: {snapshot_age} seconds old")
            send_alert(
                sns_topic_arn,
                "Warning: DR Snapshot is Stale",
                f"Latest DR snapshot {latest_snapshot['DBSnapshotIdentifier']} is {snapshot_age/3600:.1f} hours old"
            )
        
        # Store validation metadata
        validation_metadata = {
            'latest_snapshot_id': latest_snapshot['DBSnapshotIdentifier'],
            'snapshot_age_seconds': snapshot_age,
            'snapshot_timestamp': latest_timestamp.isoformat(),
            'validation_timestamp': current_time.isoformat(),
            'snapshot_status': latest_snapshot['Status'],
            'snapshot_size_gb': latest_snapshot.get('AllocatedStorage', 0),
            'encryption_enabled': latest_snapshot.get('Encrypted', False)
        }
        
        s3.put_object(
            Bucket=s3_bucket,
            Key=f"validations/{current_time.strftime('%Y/%m/%d')}/validation-{current_time.strftime('%H%M%S')}.json",
            Body=json.dumps(validation_metadata),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Validation completed successfully',
                'latest_snapshot': latest_snapshot['DBSnapshotIdentifier'],
                'snapshot_age_hours': snapshot_age / 3600,
                'status': 'healthy' if snapshot_age < 7200 else 'warning'
            })
        }
        
    except Exception as e:
        logger.error(f"Error in snapshot validation: {e}")
        send_alert(
            sns_topic_arn,
            "Error in Snapshot Validation",
            f"Failed to validate DR snapshots: {str(e)}"
        )
        
        # Publish error metric
        cloudwatch.put_metric_data(
            Namespace='CustomDR',
            MetricData=[
                {
                    'MetricName': 'ValidationErrors',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
        
        raise

def get_latest_snapshot(instance_id):
    """
    Get the latest automated snapshot for an RDS instance
    """
    try:
        response = rds_primary.describe_db_snapshots(
            DBInstanceIdentifier=instance_id,
            SnapshotType='automated',
            MaxRecords=20
        )
        
        snapshots = response.get('DBSnapshots', [])
        if not snapshots:
            return None
        
        # Sort by creation time and get the latest
        snapshots.sort(key=lambda x: x['SnapshotCreateTime'], reverse=True)
        
        # Find the most recent available snapshot
        for snapshot in snapshots:
            if snapshot['Status'] == 'available':
                return snapshot['DBSnapshotIdentifier']
        
        return None
        
    except ClientError as e:
        logger.error(f"Error getting latest snapshot: {e}")
        raise

def get_account_id():
    """
    Get AWS account ID
    """
    try:
        sts = boto3.client('sts')
        return sts.get_caller_identity()['Account']
    except ClientError as e:
        logger.error(f"Error getting account ID: {e}")
        raise

def send_alert(topic_arn, subject, message):
    """
    Send alert via SNS
    """
    try:
        sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        logger.info(f"Alert sent: {subject}")
    except ClientError as e:
        logger.error(f"Failed to send alert: {e}")
        # Don't raise to avoid cascading failures
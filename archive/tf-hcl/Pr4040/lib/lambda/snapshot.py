import boto3
import os
from datetime import datetime, timedelta
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 clients
rds = boto3.client('rds')


def handler(event, context):
    """
    Lambda handler for creating daily RDS snapshots and cleaning up old ones
    """
    try:
        # Get environment variables
        db_instance_identifier = os.environ['DB_INSTANCE_IDENTIFIER']
        retention_days = int(os.environ.get('RETENTION_DAYS', 30))

        # Create snapshot
        snapshot_id = create_snapshot(db_instance_identifier)
        logger.info(f"Successfully created snapshot: {snapshot_id}")

        # Clean up old snapshots
        deleted_count = cleanup_old_snapshots(db_instance_identifier, retention_days)
        logger.info(f"Deleted {deleted_count} old snapshots")

        return {
            'statusCode': 200,
            'body': {
                'message': 'Snapshot management completed successfully',
                'snapshot_created': snapshot_id,
                'snapshots_deleted': deleted_count
            }
        }

    except Exception as e:
        logger.error(f"Error in snapshot management: {str(e)}")
        raise


def create_snapshot(db_instance_identifier):
    """
    Create a manual snapshot of the RDS instance
    """
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    snapshot_id = f"{db_instance_identifier}-manual-{timestamp}"

    try:
        # Create the snapshot
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_identifier
        )

        # Add tags to the snapshot
        snapshot_arn = response['DBSnapshot']['DBSnapshotArn']
        rds.add_tags_to_resource(
            ResourceName=snapshot_arn,
            Tags=[
                {
                    'Key': 'Type',
                    'Value': 'Manual'
                },
                {
                    'Key': 'CreatedBy',
                    'Value': 'Lambda-SnapshotManager'
                },
                {
                    'Key': 'CreatedDate',
                    'Value': datetime.now().strftime('%Y-%m-%d')
                },
                {
                    'Key': 'Compliance',
                    'Value': 'HIPAA'
                }
            ]
        )

        return snapshot_id

    except Exception as e:
        logger.error(f"Error creating snapshot: {str(e)}")
        raise


def cleanup_old_snapshots(db_instance_identifier, retention_days):
    """
    Delete manual snapshots older than retention_days
    """
    deleted_count = 0
    cutoff_date = datetime.now() - timedelta(days=retention_days)

    try:
        # Get all snapshots for the instance
        paginator = rds.get_paginator('describe_db_snapshots')

        for page in paginator.paginate(
            DBInstanceIdentifier=db_instance_identifier,
            SnapshotType='manual',
            IncludeShared=False,
            IncludePublic=False
        ):
            for snapshot in page['DBSnapshots']:
                snapshot_id = snapshot['DBSnapshotIdentifier']

                # Skip if snapshot doesn't match our naming pattern
                if not snapshot_id.startswith(f"{db_instance_identifier}-manual-"):
                    continue

                # Check if snapshot is older than retention period
                create_time = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
                if create_time < cutoff_date.replace(tzinfo=None):
                    try:
                        logger.info(f"Deleting old snapshot: {snapshot_id} (created: {create_time})")
                        rds.delete_db_snapshot(DBSnapshotIdentifier=snapshot_id)
                        deleted_count += 1
                    except Exception as e:
                        logger.error(f"Error deleting snapshot {snapshot_id}: {str(e)}")
                        continue

        return deleted_count

    except Exception as e:
        logger.error(f"Error listing/deleting snapshots: {str(e)}")
        raise


def get_db_instance_info(db_instance_identifier):
    """
    Get information about the RDS instance
    """
    try:
        response = rds.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )
        return response['DBInstances'][0]
    except Exception as e:
        logger.error(f"Error describing DB instance: {str(e)}")
        raise

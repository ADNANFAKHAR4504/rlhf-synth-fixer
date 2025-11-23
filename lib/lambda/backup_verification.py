import json
import os
import boto3
from datetime import datetime, timedelta
from typing import Dict, Any

rds = boto3.client('rds')
cloudwatch = boto3.client('cloudwatch')

CLUSTER_IDENTIFIER = os.environ['CLUSTER_IDENTIFIER']
ENVIRONMENT = os.environ['ENVIRONMENT']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Automated backup verification Lambda.
    Runs daily to verify Aurora snapshots exist and are recent.
    """
    try:
        # Get cluster snapshots
        response = rds.describe_db_cluster_snapshots(
            DBClusterIdentifier=CLUSTER_IDENTIFIER,
            SnapshotType='automated'
        )

        snapshots = response.get('DBClusterSnapshots', [])

        if not snapshots:
            print(f"ERROR: No automated snapshots found for {CLUSTER_IDENTIFIER}")
            send_metric('BackupVerificationFailure', 1)
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'No snapshots found',
                    'cluster': CLUSTER_IDENTIFIER
                })
            }

        # Sort by creation time
        snapshots.sort(key=lambda x: x['SnapshotCreateTime'], reverse=True)
        latest_snapshot = snapshots[0]

        # Check if snapshot is recent (within 25 hours)
        snapshot_create_time = latest_snapshot['SnapshotCreateTime']
        snapshot_age = datetime.now(snapshot_create_time.tzinfo) - snapshot_create_time

        if snapshot_age > timedelta(hours=25):
            print(f"WARNING: Latest snapshot is {snapshot_age.total_seconds() / 3600:.1f} hours old")
            send_metric('BackupVerificationWarning', 1)

        # Verify snapshot is available
        snapshot_status = latest_snapshot['Status']

        if snapshot_status != 'available':
            print(f"ERROR: Latest snapshot status is {snapshot_status}")
            send_metric('BackupVerificationFailure', 1)
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': f'Snapshot not available: {snapshot_status}',
                    'snapshotId': latest_snapshot['DBClusterSnapshotIdentifier']
                })
            }

        # Success
        print(f"SUCCESS: Backup verification passed for {CLUSTER_IDENTIFIER}")
        print(f"Latest snapshot: {latest_snapshot['DBClusterSnapshotIdentifier']}")
        print(f"Snapshot age: {snapshot_age.total_seconds() / 3600:.1f} hours")

        send_metric('BackupVerificationSuccess', 1)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'success',
                'cluster': CLUSTER_IDENTIFIER,
                'latestSnapshot': latest_snapshot['DBClusterSnapshotIdentifier'],
                'snapshotAge': f"{snapshot_age.total_seconds() / 3600:.1f} hours",
                'snapshotStatus': snapshot_status
            })
        }

    except Exception as e:
        print(f"ERROR: Backup verification failed: {str(e)}")
        send_metric('BackupVerificationFailure', 1)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'cluster': CLUSTER_IDENTIFIER
            })
        }


def send_metric(metric_name: str, value: float):
    """
    Send custom metric to CloudWatch.
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='PaymentSystem',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT
                        },
                        {
                            'Name': 'Cluster',
                            'Value': CLUSTER_IDENTIFIER
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        print(f"Failed to send metric: {str(e)}")

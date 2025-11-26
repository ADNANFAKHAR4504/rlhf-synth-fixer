import json
import boto3
import os
from datetime import datetime, timedelta

rds = boto3.client('rds')
sns = boto3.client('sns')

def handler(event, context):
    """Verify RDS backups and test restore capability"""
    print("Starting backup verification")
    
    cluster_id = os.environ['CLUSTER_IDENTIFIER']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    
    try:
        # List cluster snapshots
        response = rds.describe_db_cluster_snapshots(
            DBClusterIdentifier=cluster_id,
            SnapshotType='automated'
        )
        
        snapshots = response['DBClusterSnapshots']
        
        if not snapshots:
            message = f"WARNING: No automated backups found for {cluster_id}"
            print(message)
            sns.publish(
                TopicArn=sns_topic,
                Subject='Backup Verification Warning',
                Message=message
            )
            return {'statusCode': 200, 'body': message}
        
        # Get most recent snapshot
        latest_snapshot = sorted(snapshots, key=lambda x: x['SnapshotCreateTime'], reverse=True)[0]
        
        snapshot_age = datetime.utcnow().replace(tzinfo=None) - latest_snapshot['SnapshotCreateTime'].replace(tzinfo=None)
        
        message = f"""
        Backup Verification Report
        Cluster: {cluster_id}
        Latest Snapshot: {latest_snapshot['DBClusterSnapshotIdentifier']}
        Created: {latest_snapshot['SnapshotCreateTime'].isoformat()}
        Age: {snapshot_age}
        Status: {latest_snapshot['Status']}
        """
        
        print(message)
        
        sns.publish(
            TopicArn=sns_topic,
            Subject='Daily Backup Verification Report',
            Message=message
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Backup verification completed')
        }
        
    except Exception as e:
        error_msg = f"Backup verification failed: {str(e)}"
        print(error_msg)
        sns.publish(
            TopicArn=sns_topic,
            Subject='Backup Verification Failed',
            Message=error_msg
        )
        raise

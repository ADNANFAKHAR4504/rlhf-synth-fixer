import json
import boto3
import os
import time
from datetime import datetime

rds_client = boto3.client('rds', region_name=os.environ['REGION'])
sns_client = boto3.client('sns', region_name=os.environ['REGION'])

PRIMARY_DB = os.environ['PRIMARY_DB_IDENTIFIER']
REPLICA_DB = os.environ['REPLICA_DB_IDENTIFIER']
SNS_TOPIC = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    """
    Failover Lambda function that promotes read replica to standalone instance
    when primary database fails.
    """
    start_time = datetime.utcnow()

    try:
        # Notify start of failover
        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject="FAILOVER INITIATED: Starting Database Failover",
            Message=f"Failover process started at {start_time.isoformat()}\n"
                   f"Primary: {PRIMARY_DB}\nReplica: {REPLICA_DB}"
        )

        # Verify replica is in good state
        replica_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=REPLICA_DB
        )

        replica_status = replica_response['DBInstances'][0]['DBInstanceStatus']

        if replica_status != 'available':
            raise Exception(f"Replica is not available for promotion. Status: {replica_status}")

        # Take snapshot of primary (if possible)
        try:
            snapshot_id = f"{PRIMARY_DB}-failover-{int(time.time())}"
            rds_client.create_db_snapshot(
                DBSnapshotIdentifier=snapshot_id,
                DBInstanceIdentifier=PRIMARY_DB
            )
            print(f"Created snapshot: {snapshot_id}")
        except Exception as e:
            print(f"Could not create primary snapshot: {str(e)}")

        # Promote read replica
        print(f"Promoting replica {REPLICA_DB} to standalone instance")
        promote_response = rds_client.promote_read_replica(
            DBInstanceIdentifier=REPLICA_DB,
            BackupRetentionPeriod=7
        )

        # Wait for promotion to complete (with timeout)
        max_wait_time = 300  # 5 minutes
        elapsed_time = 0
        poll_interval = 15

        while elapsed_time < max_wait_time:
            time.sleep(poll_interval)
            elapsed_time += poll_interval

            status_response = rds_client.describe_db_instances(
                DBInstanceIdentifier=REPLICA_DB
            )
            current_status = status_response['DBInstances'][0]['DBInstanceStatus']

            print(f"Promotion status: {current_status} (elapsed: {elapsed_time}s)")

            if current_status == 'available':
                end_time = datetime.utcnow()
                duration = (end_time - start_time).total_seconds()

                success_message = (
                    f"FAILOVER COMPLETED SUCCESSFULLY\n"
                    f"Duration: {duration} seconds\n"
                    f"New Primary: {REPLICA_DB}\n"
                    f"Endpoint: {status_response['DBInstances'][0]['Endpoint']['Address']}\n"
                    f"Started: {start_time.isoformat()}\n"
                    f"Completed: {end_time.isoformat()}"
                )

                sns_client.publish(
                    TopicArn=SNS_TOPIC,
                    Subject="FAILOVER SUCCESS: Database Failover Completed",
                    Message=success_message
                )

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'status': 'success',
                        'new_primary': REPLICA_DB,
                        'duration_seconds': duration,
                        'endpoint': status_response['DBInstances'][0]['Endpoint']['Address']
                    })
                }

        # Timeout occurred
        raise Exception(f"Failover timed out after {max_wait_time} seconds")

    except Exception as e:
        error_message = (
            f"FAILOVER FAILED\n"
            f"Error: {str(e)}\n"
            f"Primary: {PRIMARY_DB}\n"
            f"Replica: {REPLICA_DB}\n"
            f"Time: {datetime.utcnow().isoformat()}"
        )

        print(error_message)

        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject="FAILOVER FAILED: Database Failover Error",
            Message=error_message
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'failed',
                'error': str(e)
            })
        }

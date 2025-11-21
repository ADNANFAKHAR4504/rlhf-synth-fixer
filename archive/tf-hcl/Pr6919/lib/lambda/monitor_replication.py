import boto3
import os
import json
from datetime import datetime, timedelta

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
rds = boto3.client('rds')

# Environment variables
DR_DB_IDENTIFIER = os.environ['DR_DB_IDENTIFIER']
REPLICATION_LAG_THRESHOLD = int(os.environ.get('REPLICATION_LAG_THRESHOLD', '60'))

def lambda_handler(event, context):
    """
    Monitor RDS replication lag and trigger promotion if threshold exceeded.

    This function checks the ReplicaLag metric from CloudWatch and determines
    if the DR replica needs to be promoted to a standalone instance.
    """

    try:
        print(f"Checking replication lag for {DR_DB_IDENTIFIER}")

        # Get replication lag metric from CloudWatch
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)

        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ReplicaLag',
            Dimensions=[
                {
                    'Name': 'DBInstanceIdentifier',
                    'Value': DR_DB_IDENTIFIER
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=['Average']
        )

        if not response['Datapoints']:
            print("No replication lag data available")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No data available',
                    'status': 'no_data'
                })
            }

        # Get the most recent datapoint
        datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'], reverse=True)
        latest_lag = datapoints[0]['Average']

        print(f"Current replication lag: {latest_lag} seconds")

        # Check if lag exceeds threshold
        if latest_lag > REPLICATION_LAG_THRESHOLD:
            print(f"WARNING: Replication lag ({latest_lag}s) exceeds threshold ({REPLICATION_LAG_THRESHOLD}s)")

            # Get DB instance details
            db_response = rds.describe_db_instances(DBInstanceIdentifier=DR_DB_IDENTIFIER)
            db_instance = db_response['DBInstances'][0]

            # Check if instance is a read replica
            if 'ReadReplicaSourceDBInstanceIdentifier' in db_instance:
                print(f"Initiating failover: Promoting {DR_DB_IDENTIFIER} to standalone instance")

                # Promote read replica
                promote_response = rds.promote_read_replica(
                    DBInstanceIdentifier=DR_DB_IDENTIFIER,
                    BackupRetentionPeriod=7,
                    PreferredBackupWindow='03:00-04:00'
                )

                print(f"Promotion initiated: {promote_response['DBInstance']['DBInstanceStatus']}")

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Failover initiated',
                        'status': 'promoting',
                        'replication_lag': latest_lag,
                        'db_instance': DR_DB_IDENTIFIER
                    })
                }
            else:
                print(f"Instance {DR_DB_IDENTIFIER} is not a read replica")
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Instance is not a replica',
                        'status': 'standalone',
                        'replication_lag': latest_lag
                    })
                }
        else:
            print(f"Replication lag ({latest_lag}s) is within acceptable limits")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Replication healthy',
                    'status': 'healthy',
                    'replication_lag': latest_lag
                })
            }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error monitoring replication',
                'error': str(e)
            })
        }

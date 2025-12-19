import json
import boto3
import os
from datetime import datetime, timedelta

# Initialize clients
cloudwatch = boto3.client('cloudwatch')
rds = boto3.client('rds')

REPLICATION_LAG_THRESHOLD = int(os.environ.get('REPLICATION_LAG_THRESHOLD', 60))
DR_REPLICA_ID = os.environ['DR_REPLICA_ID']
DR_REGION = os.environ['DR_REGION']

def get_replication_lag(db_instance_id, region):
    """Get replication lag from CloudWatch metrics"""
    cw_client = boto3.client('cloudwatch', region_name=region)

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)

    try:
        response = cw_client.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ReplicaLag',
            Dimensions=[
                {
                    'Name': 'DBInstanceIdentifier',
                    'Value': db_instance_id
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=60,
            Statistics=['Average']
        )

        if response['Datapoints']:
            # Get most recent datapoint
            latest = sorted(response['Datapoints'], key=lambda x: x['Timestamp'])[-1]
            return latest['Average']

        return None

    except Exception as e:
        print(f"Error getting replication lag: {str(e)}")
        return None

def promote_replica(db_instance_id, region):
    """Promote read replica to standalone instance"""
    rds_client = boto3.client('rds', region_name=region)

    try:
        print(f"Promoting replica {db_instance_id} in {region}")

        response = rds_client.promote_read_replica(
            DBInstanceIdentifier=db_instance_id
        )

        print(f"Promotion initiated: {json.dumps(response, default=str)}")
        return True

    except Exception as e:
        print(f"Error promoting replica: {str(e)}")
        return False

def lambda_handler(event, context):
    """Monitor replication lag and trigger failover if needed"""

    print(f"Checking replication lag for {DR_REPLICA_ID} in {DR_REGION}")

    # Get current replication lag
    lag = get_replication_lag(DR_REPLICA_ID, DR_REGION)

    if lag is None:
        print("Unable to retrieve replication lag")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'no_data',
                'message': 'Unable to retrieve replication lag'
            })
        }

    print(f"Current replication lag: {lag} seconds (threshold: {REPLICATION_LAG_THRESHOLD})")

    # Check if lag exceeds threshold
    if lag > REPLICATION_LAG_THRESHOLD:
        print(f"Replication lag ({lag}s) exceeds threshold ({REPLICATION_LAG_THRESHOLD}s)")

        # Promote replica
        success = promote_replica(DR_REPLICA_ID, DR_REGION)

        if success:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'failover_initiated',
                    'lag': lag,
                    'threshold': REPLICATION_LAG_THRESHOLD,
                    'message': f'Replica promotion initiated for {DR_REPLICA_ID}'
                })
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'status': 'failover_failed',
                    'lag': lag,
                    'message': 'Failed to promote replica'
                })
            }
    else:
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'lag': lag,
                'threshold': REPLICATION_LAG_THRESHOLD,
                'message': 'Replication lag within acceptable range'
            })
        }

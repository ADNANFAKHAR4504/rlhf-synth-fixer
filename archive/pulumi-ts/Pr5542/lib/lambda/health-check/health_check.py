import json
import boto3
import os
from datetime import datetime

rds_client = boto3.client('rds', region_name=os.environ['REGION'])
sns_client = boto3.client('sns', region_name=os.environ['REGION'])
cloudwatch = boto3.client('cloudwatch', region_name=os.environ['REGION'])

PRIMARY_DB = os.environ['PRIMARY_DB_IDENTIFIER']
REPLICA_DB = os.environ['REPLICA_DB_IDENTIFIER']
SNS_TOPIC = os.environ['SNS_TOPIC_ARN']

def handler(event, context):
    """
    Health check Lambda function that monitors RDS primary database health
    and triggers failover if necessary.
    """
    try:
        # Check primary database status
        primary_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=PRIMARY_DB
        )

        primary_status = primary_response['DBInstances'][0]['DBInstanceStatus']
        primary_available = primary_status == 'available'

        # Check replica status
        replica_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=REPLICA_DB
        )

        replica_status = replica_response['DBInstances'][0]['DBInstanceStatus']
        replica_lag = get_replication_lag(REPLICA_DB)

        # Publish custom metrics
        cloudwatch.put_metric_data(
            Namespace='CustomRDS/DR',
            MetricData=[
                {
                    'MetricName': 'PrimaryHealthy',
                    'Value': 1.0 if primary_available else 0.0,
                    'Unit': 'None',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'ReplicaLag',
                    'Value': replica_lag,
                    'Unit': 'Seconds',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        # Alert if primary is unhealthy
        if not primary_available:
            message = f"PRIMARY DATABASE UNHEALTHY: {PRIMARY_DB} status is {primary_status}"
            sns_client.publish(
                TopicArn=SNS_TOPIC,
                Subject="CRITICAL: Primary Database Health Check Failed",
                Message=message
            )

            # Trigger failover if replica is healthy
            if replica_status == 'available' and replica_lag < 60:
                trigger_failover()

        # Alert if replication lag is too high
        if replica_lag > 60:
            message = f"HIGH REPLICATION LAG: {REPLICA_DB} lag is {replica_lag} seconds"
            sns_client.publish(
                TopicArn=SNS_TOPIC,
                Subject="WARNING: High Replication Lag Detected",
                Message=message
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'primary_status': primary_status,
                'replica_status': replica_status,
                'replica_lag': replica_lag,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        error_message = f"Health check error: {str(e)}"
        print(error_message)
        sns_client.publish(
            TopicArn=SNS_TOPIC,
            Subject="ERROR: Health Check Lambda Failed",
            Message=error_message
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_replication_lag(replica_id):
    """Get current replication lag in seconds"""
    try:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='ReplicaLag',
            Dimensions=[
                {'Name': 'DBInstanceIdentifier', 'Value': replica_id}
            ],
            StartTime=datetime.utcnow(),
            EndTime=datetime.utcnow(),
            Period=60,
            Statistics=['Average']
        )

        if response['Datapoints']:
            return response['Datapoints'][0]['Average']
        return 0
    except:
        return 0

def trigger_failover():
    """Invoke failover lambda"""
    lambda_client = boto3.client('lambda', region_name=os.environ['REGION'])

    # Get failover lambda name from environment or construct it
    failover_lambda = f"dr-failover-{os.environ.get('ENVIRONMENT_SUFFIX', 'dev')}"

    try:
        lambda_client.invoke(
            FunctionName=failover_lambda,
            InvocationType='Event'
        )
        print(f"Triggered failover lambda: {failover_lambda}")
    except Exception as e:
        print(f"Failed to trigger failover: {str(e)}")

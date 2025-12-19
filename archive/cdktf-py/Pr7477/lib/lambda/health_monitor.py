"""Lambda function to monitor Aurora cluster health and replication lag."""

import os
import json
import boto3
from datetime import datetime, timedelta

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')
rds = boto3.client('rds')


def lambda_handler(event, context):
    """
    Monitor Aurora cluster health and replication lag.

    This function runs every minute to check:
    - Database connectivity
    - Replication lag (for global clusters)
    - General cluster health
    """
    cluster_endpoint = os.environ['CLUSTER_ENDPOINT']
    cluster_region = os.environ['CLUSTER_REGION']
    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

    print(f"Checking health for cluster in {cluster_region}")

    try:
        # Check replication lag
        replication_lag = get_replication_lag(global_cluster_id, cluster_region)

        if replication_lag is not None:
            print(f"Current replication lag: {replication_lag}ms")

            # Alert if replication lag exceeds 500ms
            if replication_lag > 500:
                message = f"High replication lag detected in {cluster_region}: {replication_lag}ms"
                print(f"ALERT: {message}")
                send_sns_notification(sns_topic_arn, message, "ReplicationLagHigh")

        # Check cluster status
        cluster_status = check_cluster_status(global_cluster_id, cluster_region)
        print(f"Cluster status: {cluster_status}")

        if cluster_status != "available":
            message = f"Cluster status is {cluster_status} in {cluster_region}"
            print(f"WARNING: {message}")
            send_sns_notification(sns_topic_arn, message, "ClusterStatusChange")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Health check completed',
                'replication_lag_ms': replication_lag,
                'cluster_status': cluster_status,
                'region': cluster_region,
            })
        }

    except Exception as e:
        error_message = f"Health check failed in {cluster_region}: {str(e)}"
        print(f"ERROR: {error_message}")
        send_sns_notification(sns_topic_arn, error_message, "HealthCheckError")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'region': cluster_region,
            })
        }


def get_replication_lag(global_cluster_id, region):
    """Get replication lag from CloudWatch metrics."""
    try:
        # Query CloudWatch for replication lag metric
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='AuroraGlobalDBReplicationLag',
            Dimensions=[
                {
                    'Name': 'GlobalCluster',
                    'Value': global_cluster_id
                }
            ],
            StartTime=datetime.utcnow() - timedelta(minutes=5),
            EndTime=datetime.utcnow(),
            Period=60,
            Statistics=['Average']
        )

        if response['Datapoints']:
            # Get the most recent datapoint
            latest = sorted(response['Datapoints'], key=lambda x: x['Timestamp'])[-1]
            return latest['Average']

        return None

    except Exception as e:
        print(f"Error getting replication lag: {str(e)}")
        return None


def check_cluster_status(global_cluster_id, region):
    """Check Aurora cluster status."""
    try:
        response = rds.describe_global_clusters(
            GlobalClusterIdentifier=global_cluster_id
        )

        if response['GlobalClusters']:
            global_cluster = response['GlobalClusters'][0]

            # Find the cluster in the current region
            for member in global_cluster['GlobalClusterMembers']:
                if member['DBClusterArn'].find(region) != -1:
                    return member.get('Status', 'unknown')

        return 'unknown'

    except Exception as e:
        print(f"Error checking cluster status: {str(e)}")
        return 'error'


def send_sns_notification(topic_arn, message, subject):
    """Send SNS notification."""
    try:
        sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        print(f"SNS notification sent: {subject}")
    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")
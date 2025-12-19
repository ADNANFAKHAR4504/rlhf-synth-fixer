"""Lambda function to trigger Aurora Global Database failover."""

import os
import json
import boto3
import time

# Initialize AWS clients
rds = boto3.client('rds')
sns = boto3.client('sns')


def lambda_handler(event, context):
    """
    Trigger failover for Aurora Global Database.

    This function is idempotent and can be safely retried.
    It promotes the secondary region to primary and sends notifications.
    """
    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    primary_region = os.environ['PRIMARY_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

    # Extract failover target from event or default to secondary
    target_region = event.get('target_region', secondary_region)

    print(f"Initiating failover for global cluster: {global_cluster_id}")
    print(f"Target region: {target_region}")

    try:
        # Check current status of global cluster
        global_cluster = describe_global_cluster(global_cluster_id)

        if not global_cluster:
            raise Exception(f"Global cluster {global_cluster_id} not found")

        print(f"Current global cluster status: {global_cluster.get('Status')}")

        # Check if failover is already in progress
        if global_cluster.get('Status') in ['failing-over', 'modifying']:
            message = f"Failover already in progress for {global_cluster_id}"
            print(message)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': message,
                    'status': 'in_progress'
                })
            }

        # Find the target cluster ARN
        target_cluster_arn = None
        for member in global_cluster.get('GlobalClusterMembers', []):
            if member['DBClusterArn'].find(target_region) != -1:
                target_cluster_arn = member['DBClusterArn']
                break

        if not target_cluster_arn:
            raise Exception(f"Target cluster not found in region {target_region}")

        print(f"Target cluster ARN: {target_cluster_arn}")

        # Send pre-failover notification
        send_sns_notification(
            sns_topic_arn,
            f"Starting failover for {global_cluster_id} to {target_region}",
            "FailoverStarted"
        )

        # Initiate failover
        print("Initiating failover...")
        response = rds.failover_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            TargetDbClusterIdentifier=target_cluster_arn
        )

        print(f"Failover initiated: {response}")

        # Wait for failover to complete (with timeout)
        wait_for_failover(global_cluster_id, timeout=60)

        # Send success notification
        send_sns_notification(
            sns_topic_arn,
            f"Failover completed successfully for {global_cluster_id} to {target_region}",
            "FailoverCompleted"
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'global_cluster_id': global_cluster_id,
                'target_region': target_region,
                'timestamp': time.time(),
            })
        }

    except Exception as e:
        error_message = f"Failover failed: {str(e)}"
        print(f"ERROR: {error_message}")

        # Send failure notification
        send_sns_notification(
            sns_topic_arn,
            error_message,
            "FailoverFailed"
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'global_cluster_id': global_cluster_id,
            })
        }


def describe_global_cluster(global_cluster_id):
    """Describe Aurora Global Cluster."""
    try:
        response = rds.describe_global_clusters(
            GlobalClusterIdentifier=global_cluster_id
        )

        if response['GlobalClusters']:
            return response['GlobalClusters'][0]

        return None

    except Exception as e:
        print(f"Error describing global cluster: {str(e)}")
        return None


def wait_for_failover(global_cluster_id, timeout=60):
    """Wait for failover to complete with timeout."""
    start_time = time.time()

    while time.time() - start_time < timeout:
        cluster = describe_global_cluster(global_cluster_id)

        if cluster and cluster.get('Status') == 'available':
            print("Failover completed")
            return True

        print(f"Waiting for failover... Current status: {cluster.get('Status')}")
        time.sleep(5)

    print(f"Failover did not complete within {timeout} seconds")
    return False


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
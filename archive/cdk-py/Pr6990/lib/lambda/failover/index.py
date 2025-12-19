"""
Automated failover Lambda function for PostgreSQL disaster recovery.
Promotes replica to primary and updates Route53 routing weights.
"""

import os
import json
import boto3
import logging
import time
from botocore.exceptions import ClientError

# Initialize AWS clients
rds_client = boto3.client('rds')
route53_client = boto3.client('route53')
sns_client = boto3.client('sns')

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
PRIMARY_INSTANCE_ID = os.environ['PRIMARY_INSTANCE_ID']
REPLICA_INSTANCE_ID = os.environ['REPLICA_INSTANCE_ID']
HOSTED_ZONE_ID = os.environ['HOSTED_ZONE_ID']
RECORD_NAME = os.environ['RECORD_NAME']
PRIMARY_ENDPOINT = os.environ['PRIMARY_ENDPOINT']
REPLICA_ENDPOINT = os.environ['REPLICA_ENDPOINT']
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')

# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF = 2  # seconds


def send_sns_notification(subject, message):
    """
    Send SNS notification about failover event.

    Args:
        subject (str): Notification subject
        message (str): Notification message
    """
    if not SNS_TOPIC_ARN:
        logger.warning("SNS_TOPIC_ARN not configured, skipping notification")
        return

    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        logger.info("SNS notification sent successfully")
    except ClientError as e:
        logger.error("Error sending SNS notification: %s", e)
        # Don't raise - notification failure shouldn't stop failover


def retry_with_backoff(func, *args, **kwargs):
    """
    Retry function with exponential backoff.

    Args:
        func: Function to retry
        *args: Positional arguments for function
        **kwargs: Keyword arguments for function

    Returns:
        Function result

    Raises:
        Last exception if all retries fail
    """
    for attempt in range(MAX_RETRIES):
        try:
            return func(*args, **kwargs)
        except ClientError as e:
            if attempt == MAX_RETRIES - 1:
                raise

            backoff = INITIAL_BACKOFF * (2 ** attempt)
            logger.warning(
                "Attempt %d failed: %s. Retrying in %d seconds...",
                attempt + 1, str(e), backoff
            )
            time.sleep(backoff)


def check_instance_status(instance_id):
    """
    Check the status of an RDS instance.

    Args:
        instance_id (str): RDS instance identifier

    Returns:
        dict: Instance status information
    """
    try:
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = response['DBInstances'][0]
        return {
            'status': instance['DBInstanceStatus'],
            'available': instance['DBInstanceStatus'] == 'available',
            'endpoint': instance.get('Endpoint', {}).get('Address', ''),
            'is_replica': 'ReadReplicaSourceDBInstanceIdentifier' in instance
        }
    except ClientError as e:
        logger.error("Error checking instance status: %s", e)
        raise


def promote_replica():
    """
    Promote the read replica to a standalone instance.
    Includes idempotency check to avoid promoting an already-promoted instance.

    Returns:
        dict: Promotion response or status if already promoted
    """
    try:
        # Idempotency check: verify instance is still a replica
        replica_status = check_instance_status(REPLICA_INSTANCE_ID)

        if not replica_status['is_replica']:
            logger.info("Instance %s is already promoted (not a replica)", REPLICA_INSTANCE_ID)
            return {
                'status': 'already_promoted',
                'message': 'Instance was already promoted in a previous execution'
            }

        logger.info("Promoting replica %s to primary", REPLICA_INSTANCE_ID)
        response = rds_client.promote_read_replica(
            DBInstanceIdentifier=REPLICA_INSTANCE_ID,
            BackupRetentionPeriod=7
        )
        logger.info("Replica promotion initiated successfully")
        return response
    except ClientError as e:
        # Check if error is because instance is already being promoted
        if 'InvalidDBInstanceState' in str(e):
            logger.warning("Instance may already be promoted or promotion in progress")
            return {
                'status': 'promotion_in_progress',
                'message': str(e)
            }
        logger.error("Error promoting replica: %s", e)
        raise


def update_route53_weights(primary_weight, replica_weight):
    """
    Update Route53 weighted routing policy.

    Args:
        primary_weight (int): Weight for primary record
        replica_weight (int): Weight for replica record

    Returns:
        dict: Route53 change response
    """
    try:
        logger.info("Updating Route53 weights: primary=%s, replica=%s", primary_weight, replica_weight)

        change_batch = {
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': RECORD_NAME,
                        'Type': 'CNAME',
                        'SetIdentifier': 'primary',
                        'Weight': primary_weight,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': PRIMARY_ENDPOINT}]
                    }
                },
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': RECORD_NAME,
                        'Type': 'CNAME',
                        'SetIdentifier': 'replica',
                        'Weight': replica_weight,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': REPLICA_ENDPOINT}]
                    }
                }
            ]
        }

        response = route53_client.change_resource_record_sets(
            HostedZoneId=HOSTED_ZONE_ID,
            ChangeBatch=change_batch
        )

        logger.info("Route53 weights updated successfully")
        return response

    except ClientError as e:
        logger.error("Error updating Route53 weights: %s", e)
        raise


def handler(event, context):
    """
    Lambda handler for automated failover.

    Args:
        event (dict): Lambda event object
        context: Lambda context object

    Returns:
        dict: Execution result
    """
    try:
        logger.info("Starting automated failover process")
        logger.info("Event: %s", json.dumps(event))

        # Check primary instance status with retry
        primary_status = retry_with_backoff(check_instance_status, PRIMARY_INSTANCE_ID)
        logger.info("Primary status: %s", primary_status)

        # Check replica instance status with retry
        replica_status = retry_with_backoff(check_instance_status, REPLICA_INSTANCE_ID)
        logger.info("Replica status: %s", replica_status)

        # Determine if failover is needed
        if not primary_status['available'] and replica_status['available']:
            logger.warning("Primary is unavailable, initiating failover")

            # Send notification about failover start
            send_sns_notification(
                "Database Failover Initiated",
                f"Automated failover initiated for {PRIMARY_INSTANCE_ID}.\n"
                f"Primary status: {primary_status['status']}\n"
                f"Replica status: {replica_status['status']}\n"
                f"Traffic will be redirected to replica."
            )

            # Promote replica to primary with retry
            promote_response = retry_with_backoff(promote_replica)

            # Update Route53 to direct traffic to replica with retry
            route53_response = retry_with_backoff(
                update_route53_weights,
                primary_weight=0,
                replica_weight=100
            )

            # Send notification about successful failover
            send_sns_notification(
                "Database Failover Completed Successfully",
                f"Automated failover completed successfully.\n"
                f"Replica {REPLICA_INSTANCE_ID} has been promoted.\n"
                f"Traffic is now directed to the promoted instance.\n"
                f"Previous primary: {PRIMARY_INSTANCE_ID} (status: {primary_status['status']})"
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Failover completed successfully',
                    'action': 'promoted_replica',
                    'primary_status': primary_status['status'],
                    'replica_status': replica_status['status']
                })
            }

        if primary_status['available']:
            logger.info("Primary is available, no failover needed")

            # Ensure routing is configured correctly with retry
            retry_with_backoff(
                update_route53_weights,
                primary_weight=100,
                replica_weight=0
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Primary is healthy, no action needed',
                    'action': 'none',
                    'primary_status': primary_status['status'],
                    'replica_status': replica_status['status']
                })
            }

        logger.error("Both instances are unavailable")

        # Send critical notification
        send_sns_notification(
            "CRITICAL: Both Database Instances Unavailable",
            f"Both primary and replica database instances are unavailable.\n"
            f"Primary ({PRIMARY_INSTANCE_ID}): {primary_status['status']}\n"
            f"Replica ({REPLICA_INSTANCE_ID}): {replica_status['status']}\n"
            f"Manual intervention required immediately."
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Both primary and replica are unavailable',
                'action': 'none',
                'primary_status': primary_status['status'],
                'replica_status': replica_status['status']
            })
        }

    except Exception as e:
        logger.error("Failover process failed: %s", str(e))

        # Send error notification
        send_sns_notification(
            "Database Failover Process Failed",
            f"Automated failover process encountered an error.\n"
            f"Error: {str(e)}\n"
            f"Manual intervention may be required."
        )

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failover process failed',
                'error': str(e)
            })
        }

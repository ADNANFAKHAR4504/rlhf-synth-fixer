"""
Automated failover Lambda function for PostgreSQL disaster recovery.
Promotes replica to primary and updates Route53 routing weights.
"""

import os
import json
import boto3
import logging
from botocore.exceptions import ClientError

# Initialize AWS clients
rds_client = boto3.client('rds')
route53_client = boto3.client('route53')

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
            'endpoint': instance.get('Endpoint', {}).get('Address', '')
        }
    except ClientError as e:
        logger.error("Error checking instance status: %s", e)
        raise


def promote_replica():
    """
    Promote the read replica to a standalone instance.

    Returns:
        dict: Promotion response
    """
    try:
        logger.info("Promoting replica %s to primary", REPLICA_INSTANCE_ID)
        response = rds_client.promote_read_replica(
            DBInstanceIdentifier=REPLICA_INSTANCE_ID,
            BackupRetentionPeriod=7
        )
        logger.info("Replica promotion initiated successfully")
        return response
    except ClientError as e:
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

        # Check primary instance status
        primary_status = check_instance_status(PRIMARY_INSTANCE_ID)
        logger.info("Primary status: %s", primary_status)

        # Check replica instance status
        replica_status = check_instance_status(REPLICA_INSTANCE_ID)
        logger.info("Replica status: %s", replica_status)

        # Determine if failover is needed
        if not primary_status['available'] and replica_status['available']:
            logger.warning("Primary is unavailable, initiating failover")

            # Promote replica to primary
            promote_response = promote_replica()

            # Update Route53 to direct traffic to replica
            route53_response = update_route53_weights(
                primary_weight=0,
                replica_weight=100
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

            # Ensure routing is configured correctly
            update_route53_weights(
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
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failover process failed',
                'error': str(e)
            })
        }

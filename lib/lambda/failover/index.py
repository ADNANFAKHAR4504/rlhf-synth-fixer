"""
Lambda function to automate database failover.
Promotes read replica to primary and updates Route53 routing weights.
"""
import os
import json
import boto3
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handles database failover process.

    Args:
        event: CloudWatch alarm or manual invocation event
        context: Lambda context

    Returns:
        Response with failover status
    """
    try:
        primary_db_instance = os.environ['PRIMARY_DB_INSTANCE']
        replica_db_instance = os.environ['REPLICA_DB_INSTANCE']
        replica_region = os.environ['REPLICA_REGION']
        hosted_zone_id = os.environ['HOSTED_ZONE_ID']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

        # Create region-specific clients
        rds_client = boto3.client('rds', region_name=replica_region)
        route53_client = boto3.client('route53')

        logger.info("Starting failover process for %s", primary_db_instance)

        # Step 1: Check current status of replica
        replica_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=replica_db_instance
        )

        replica_status = replica_response['DBInstances'][0]['DBInstanceStatus']
        logger.info("Replica status: %s", replica_status)

        if replica_status != 'available':
            error_msg = f"Replica not available for promotion. Status: {replica_status}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        # Step 2: Promote read replica to standalone instance
        logger.info("Promoting replica %s to standalone instance", replica_db_instance)

        promote_response = rds_client.promote_read_replica(
            DBInstanceIdentifier=replica_db_instance,
            BackupRetentionPeriod=7
        )

        logger.info("Promotion initiated: %s", promote_response['DBInstance']['DBInstanceIdentifier'])

        # Step 3: Wait for promotion to complete
        waiter = rds_client.get_waiter('db_instance_available')
        logger.info("Waiting for replica promotion to complete...")

        waiter.wait(
            DBInstanceIdentifier=replica_db_instance,
            WaiterConfig={
                'Delay': 30,
                'MaxAttempts': 40
            }
        )

        logger.info("Replica promotion completed")

        # Step 4: Get promoted instance endpoint
        promoted_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=replica_db_instance
        )

        promoted_endpoint = promoted_response['DBInstances'][0]['Endpoint']['Address']
        logger.info("Promoted instance endpoint: %s", promoted_endpoint)

        # Step 5: Update Route53 weighted routing
        logger.info("Updating Route53 weighted routing")

        record_sets_response = route53_client.list_resource_record_sets(
            HostedZoneId=hosted_zone_id
        )

        zone_name = None
        for record_set in record_sets_response['ResourceRecordSets']:
            if 'Weight' in record_set and 'primary' in record_set.get('SetIdentifier', ''):
                zone_name = record_set['Name']
                break

        if not zone_name:
            error_msg = "Could not find primary weighted record"
            logger.error(error_msg)
            raise ValueError(error_msg)

        change_batch = {
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': zone_name,
                        'Type': 'CNAME',
                        'SetIdentifier': f'primary-{environment_suffix}',
                        'Weight': 0,
                        'TTL': 60,
                        'ResourceRecords': [
                            {'Value': primary_db_instance}
                        ]
                    }
                },
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': zone_name,
                        'Type': 'CNAME',
                        'SetIdentifier': f'secondary-{environment_suffix}',
                        'Weight': 100,
                        'TTL': 60,
                        'ResourceRecords': [
                            {'Value': promoted_endpoint}
                        ]
                    }
                }
            ]
        }

        route53_response = route53_client.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch=change_batch
        )

        change_id = route53_response['ChangeInfo']['Id']
        logger.info("Route53 change initiated: %s", change_id)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'promoted_instance': replica_db_instance,
                'promoted_endpoint': promoted_endpoint,
                'route53_change_id': change_id
            })
        }

    except (ValueError, KeyError, boto3.exceptions.Boto3Error) as e:
        logger.error("Failover failed: %s", str(e), exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Failover failed',
                'error': str(e)
            })
        }

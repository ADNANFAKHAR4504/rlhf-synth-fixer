"""
Lambda function for AWS Config auto-remediation.
Handles both S3 versioning and encryption remediation.
"""

import json
import os
import logging
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients will be initialized lazily inside functions
# to avoid import-time connection errors in test environments


def lambda_handler(event, context):
    """
    Main Lambda handler for Config auto-remediation.

    Args:
        event: Lambda event containing Config rule evaluation details
        context: Lambda context

    Returns:
        dict: Response with status and message
    """
    logger.info("Received event: %s", json.dumps(event))

    try:
        # Extract Config rule details
        config_rule_name = event.get('configRuleName')
        resource_type = event.get('configRuleInvokingEvent', {}).get('configurationItem', {}).get('resourceType')
        resource_id = event.get('configRuleInvokingEvent', {}).get('configurationItem', {}).get('resourceId')

        if not resource_id:
            logger.error("No resource ID found in event")
            return {
                'statusCode': 400,
                'body': json.dumps('No resource ID found')
            }

        # Determine remediation action based on rule name
        if 'versioning' in config_rule_name.lower():
            result = remediate_s3_versioning(resource_id)
        elif 'encryption' in config_rule_name.lower():
            result = remediate_s3_encryption(resource_id)
        else:
            logger.warning(f"Unknown remediation type for rule: {config_rule_name}")
            return {
                'statusCode': 400,
                'body': json.dumps(f'Unknown remediation type: {config_rule_name}')
            }

        # Report back to Config
        report_to_config(event, result)

        return {
            'statusCode': 200,
            'body': json.dumps(f'Remediation completed for {resource_id}')
        }

    except Exception as e:
        logger.error("Error in remediation: %s", str(e), exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }


def remediate_s3_versioning(bucket_name):
    """
    Enable versioning on an S3 bucket.

    Args:
        bucket_name: Name of the S3 bucket

    Returns:
        dict: Result of the remediation
    """
    try:
        logger.info("Enabling versioning for bucket: %s", bucket_name)

        # Initialize S3 client
        s3_client = boto3.client('s3')

        s3_client.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={
                'Status': 'Enabled'
            }
        )

        logger.info("Successfully enabled versioning for %s", bucket_name)
        return {
            'compliance_type': 'COMPLIANT',
            'annotation': f'Versioning enabled for bucket {bucket_name}'
        }

    except ClientError as e:
        error_code = e.response['Error']['Code']
        logger.error("Failed to enable versioning: %s", error_code)

        if error_code == 'NoSuchBucket':
            return {
                'compliance_type': 'NOT_APPLICABLE',
                'annotation': f'Bucket {bucket_name} does not exist'
            }

        return {
            'compliance_type': 'NON_COMPLIANT',
            'annotation': f'Failed to enable versioning: {error_code}'
        }


def remediate_s3_encryption(bucket_name):
    """
    Enable default encryption on an S3 bucket.

    Args:
        bucket_name: Name of the S3 bucket

    Returns:
        dict: Result of the remediation
    """
    try:
        logger.info("Enabling encryption for bucket: %s", bucket_name)

        # Initialize S3 client
        s3_client = boto3.client('s3')

        # Get KMS key ID from environment variable
        kms_key_id = os.environ.get('KMS_KEY_ID')

        encryption_config = {
            'Rules': [
                {
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'aws:kms'
                    },
                    'BucketKeyEnabled': True
                }
            ]
        }

        # Add KMS key if available
        if kms_key_id:
            encryption_config['Rules'][0]['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID'] = kms_key_id

        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration=encryption_config
        )

        logger.info("Successfully enabled encryption for %s", bucket_name)
        return {
            'compliance_type': 'COMPLIANT',
            'annotation': f'Encryption enabled for bucket {bucket_name}'
        }

    except ClientError as e:
        error_code = e.response['Error']['Code']
        logger.error("Failed to enable encryption: %s", error_code)

        if error_code == 'NoSuchBucket':
            return {
                'compliance_type': 'NOT_APPLICABLE',
                'annotation': f'Bucket {bucket_name} does not exist'
            }

        return {
            'compliance_type': 'NON_COMPLIANT',
            'annotation': f'Failed to enable encryption: {error_code}'
        }


def report_to_config(event, result):
    """
    Report evaluation results back to AWS Config.

    Args:
        event: Original Lambda event from Config
        result: Remediation result
    """
    try:
        result_token = event.get('resultToken')
        if not result_token:
            logger.warning("No result token found, skipping Config reporting")
            return

        # Initialize Config client
        config_client = boto3.client('config')

        config_item = event.get('configRuleInvokingEvent', {}).get(
            'configurationItem', {}
        )
        evaluations = [{
            'ComplianceResourceType': config_item.get('resourceType'),
            'ComplianceResourceId': config_item.get('resourceId'),
            'ComplianceType': result['compliance_type'],
            'Annotation': result['annotation'],
            'OrderingTimestamp': config_item.get(
                'configurationItemCaptureTime'
            )
        }]

        config_client.put_evaluations(
            Evaluations=evaluations,
            ResultToken=result_token
        )

        logger.info("Successfully reported evaluation to Config")

    except Exception as e:
        logger.error("Failed to report to Config: %s", str(e), exc_info=True)

import json
import boto3
import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
s3_client = boto3.client('s3')
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
sns_client = boto3.client('sns')
config_client = boto3.client('config')

# Environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', '')
CONFIG_BUCKET = os.environ.get('CONFIG_BUCKET', '')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', '')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main handler for compliance remediation Lambda function.

    This function is triggered by EventBridge when AWS Config detects
    non-compliant resources and performs automated remediation.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        # Extract compliance details from event
        detail = event.get('detail', {})
        resource_type = detail.get('resourceType', '')
        resource_id = detail.get('resourceId', '')
        config_rule_name = detail.get('configRuleName', '')
        compliance_type = detail.get('newEvaluationResult', {}).get('complianceType', '')

        logger.info(f"Processing {compliance_type} resource: {resource_type}/{resource_id} for rule {config_rule_name}")

        if compliance_type != 'NON_COMPLIANT':
            logger.info("Resource is compliant, no action needed")
            return {'statusCode': 200, 'body': 'Resource is compliant'}

        # Route to appropriate remediation function
        remediation_result = None

        if 's3' in config_rule_name.lower():
            remediation_result = remediate_s3_bucket(resource_id, config_rule_name)
        elif 'ec2' in config_rule_name.lower() or 'ebs' in config_rule_name.lower():
            remediation_result = remediate_ec2_resource(resource_id, resource_type, config_rule_name)
        elif 'rds' in config_rule_name.lower():
            remediation_result = remediate_rds_instance(resource_id, config_rule_name)
        elif 'tag' in config_rule_name.lower():
            remediation_result = remediate_missing_tags(resource_id, resource_type)
        else:
            logger.warning(f"No remediation handler for rule: {config_rule_name}")
            send_notification(
                subject="Manual Remediation Required",
                message=f"Resource {resource_id} is non-compliant with {config_rule_name}. Manual remediation required."
            )
            return {'statusCode': 200, 'body': 'Manual remediation required'}

        # Send success notification
        if remediation_result:
            send_notification(
                subject="Compliance Remediation Successful",
                message=f"Successfully remediated {resource_type}/{resource_id} for rule {config_rule_name}. Details: {remediation_result}"
            )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Remediation completed', 'result': remediation_result})
        }

    except Exception as e:
        logger.error(f"Error during remediation: {str(e)}", exc_info=True)
        send_notification(
            subject="Compliance Remediation Failed",
            message=f"Failed to remediate resource. Error: {str(e)}"
        )
        raise


def remediate_s3_bucket(bucket_name: str, rule_name: str) -> str:
    """Remediate S3 bucket compliance issues."""
    logger.info(f"Remediating S3 bucket: {bucket_name}")

    actions_taken = []

    try:
        # Block public access
        if 'public' in rule_name.lower():
            s3_client.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            actions_taken.append("Enabled public access block")
            logger.info(f"Enabled public access block for {bucket_name}")

        # Enable encryption
        if 'encryption' in rule_name.lower():
            s3_client.put_bucket_encryption(
                Bucket=bucket_name,
                ServerSideEncryptionConfiguration={
                    'Rules': [{
                        'ApplyServerSideEncryptionByDefault': {
                            'SSEAlgorithm': 'aws:kms',
                            'KMSMasterKeyID': KMS_KEY_ID
                        },
                        'BucketKeyEnabled': True
                    }]
                }
            )
            actions_taken.append("Enabled KMS encryption")
            logger.info(f"Enabled encryption for {bucket_name}")

        # Enable versioning
        if 'versioning' in rule_name.lower():
            s3_client.put_bucket_versioning(
                Bucket=bucket_name,
                VersioningConfiguration={'Status': 'Enabled'}
            )
            actions_taken.append("Enabled versioning")
            logger.info(f"Enabled versioning for {bucket_name}")

        return f"S3 remediation completed: {', '.join(actions_taken)}"

    except Exception as e:
        logger.error(f"Error remediating S3 bucket {bucket_name}: {str(e)}")
        raise


def remediate_ec2_resource(resource_id: str, resource_type: str, rule_name: str) -> str:
    """Remediate EC2 instance or EBS volume compliance issues."""
    logger.info(f"Remediating EC2 resource: {resource_id}")

    actions_taken = []

    try:
        if resource_type == 'AWS::EC2::Instance':
            # Disable public IP on instance (requires stop/start)
            if 'public-ip' in rule_name.lower():
                # Tag for manual review instead of automatic modification
                ec2_client.create_tags(
                    Resources=[resource_id],
                    Tags=[
                        {'Key': 'ComplianceStatus', 'Value': 'RequiresReview'},
                        {'Key': 'ComplianceIssue', 'Value': 'PublicIP'}
                    ]
                )
                actions_taken.append("Tagged instance for manual review (public IP)")
                logger.info(f"Tagged instance {resource_id} for manual review")

        elif resource_type == 'AWS::EC2::Volume':
            # Note: Cannot encrypt existing volumes, must create snapshot and new encrypted volume
            ec2_client.create_tags(
                Resources=[resource_id],
                Tags=[
                    {'Key': 'ComplianceStatus', 'Value': 'RequiresReview'},
                    {'Key': 'ComplianceIssue', 'Value': 'UnencryptedVolume'}
                ]
            )
            actions_taken.append("Tagged volume for manual encryption")
            logger.info(f"Tagged volume {resource_id} for manual encryption")

        # Add required tags if missing
        if 'tag' in rule_name.lower():
            remediate_missing_tags(resource_id, resource_type)
            actions_taken.append("Added required tags")

        return f"EC2 remediation completed: {', '.join(actions_taken)}"

    except Exception as e:
        logger.error(f"Error remediating EC2 resource {resource_id}: {str(e)}")
        raise


def remediate_rds_instance(instance_id: str, rule_name: str) -> str:
    """Remediate RDS instance compliance issues."""
    logger.info(f"Remediating RDS instance: {instance_id}")

    actions_taken = []

    try:
        # Note: Cannot enable encryption on existing RDS instances
        # Tag for manual review
        if 'encryption' in rule_name.lower():
            rds_client.add_tags_to_resource(
                ResourceName=f"arn:aws:rds:{boto3.session.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:db:{instance_id}",
                Tags=[
                    {'Key': 'ComplianceStatus', 'Value': 'RequiresReview'},
                    {'Key': 'ComplianceIssue', 'Value': 'UnencryptedStorage'}
                ]
            )
            actions_taken.append("Tagged RDS instance for manual encryption")
            logger.info(f"Tagged RDS instance {instance_id} for manual review")

        return f"RDS remediation completed: {', '.join(actions_taken)}"

    except Exception as e:
        logger.error(f"Error remediating RDS instance {instance_id}: {str(e)}")
        raise


def remediate_missing_tags(resource_id: str, resource_type: str) -> str:
    """Add required tags to resources."""
    logger.info(f"Adding required tags to {resource_type}/{resource_id}")

    required_tags = [
        {'Key': 'Environment', 'Value': ENVIRONMENT_SUFFIX},
        {'Key': 'Owner', 'Value': 'ComplianceTeam'},
        {'Key': 'CostCenter', 'Value': 'Infrastructure'}
    ]

    try:
        if resource_type in ['AWS::EC2::Instance', 'AWS::EC2::Volume']:
            ec2_client.create_tags(Resources=[resource_id], Tags=required_tags)
        elif resource_type == 'AWS::RDS::DBInstance':
            session = boto3.session.Session()
            account_id = boto3.client('sts').get_caller_identity()['Account']
            resource_arn = f"arn:aws:rds:{session.region_name}:{account_id}:db:{resource_id}"
            rds_client.add_tags_to_resource(ResourceName=resource_arn, Tags=required_tags)
        elif resource_type == 'AWS::S3::Bucket':
            # S3 bucket tagging
            s3_client.put_bucket_tagging(
                Bucket=resource_id,
                Tagging={'TagSet': required_tags}
            )

        logger.info(f"Added required tags to {resource_id}")
        return "Added required tags successfully"

    except Exception as e:
        logger.error(f"Error adding tags to {resource_id}: {str(e)}")
        raise


def send_notification(subject: str, message: str) -> None:
    """Send SNS notification about remediation actions."""
    try:
        # Only send if SNS topic exists
        topic_arn = os.environ.get('SNS_TOPIC_ARN', '')
        if topic_arn:
            sns_client.publish(
                TopicArn=topic_arn,
                Subject=subject,
                Message=message
            )
            logger.info(f"Sent notification: {subject}")
    except Exception as e:
        logger.warning(f"Failed to send notification: {str(e)}")

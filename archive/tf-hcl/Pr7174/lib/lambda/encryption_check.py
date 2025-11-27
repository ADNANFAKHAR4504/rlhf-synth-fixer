import json
import boto3
import os
from datetime import datetime

config_client = boto3.client('config')
sns_client = boto3.client('sns')
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
s3_client = boto3.client('s3')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', '')
REGION = os.environ.get('AWS_REGION_NAME', 'us-east-1')


def lambda_handler(event, context):
    """
    Lambda handler for encryption compliance checks.
    Evaluates EC2 instances, RDS databases, and S3 buckets for encryption.
    """
    print(f"Encryption compliance check triggered: {json.dumps(event)}")

    # Handle both Config rule evaluation and scheduled events
    if 'configRuleId' in event:
        # Config rule evaluation
        invoking_event = json.loads(event['configRuleInvokingEvent'])
        configuration_item = invoking_event.get('configurationItem', {})
        resource_type = configuration_item.get('resourceType')
        resource_id = configuration_item.get('resourceId')

        compliance = evaluate_resource_encryption(resource_type, resource_id)

        # Put evaluation result
        evaluations = [{
            'ComplianceResourceType': resource_type,
            'ComplianceResourceId': resource_id,
            'ComplianceType': compliance['status'],
            'Annotation': compliance['message'],
            'OrderingTimestamp': datetime.utcnow()
        }]

        config_client.put_evaluations(
            Evaluations=evaluations,
            ResultToken=event['resultToken']
        )

        # Send SNS notification if non-compliant
        if compliance['status'] == 'NON_COMPLIANT':
            send_notification(resource_type, resource_id, compliance['message'])

    else:
        # Scheduled event - scan all resources
        print("Scheduled scan initiated")
        scan_all_resources()

    return {
        'statusCode': 200,
        'body': json.dumps('Encryption compliance check completed')
    }


def evaluate_resource_encryption(resource_type, resource_id):
    """
    Evaluate encryption compliance for a specific resource.
    """
    try:
        if resource_type == 'AWS::EC2::Instance':
            return check_ec2_encryption(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            return check_rds_encryption(resource_id)
        elif resource_type == 'AWS::S3::Bucket':
            return check_s3_encryption(resource_id)
        else:
            return {
                'status': 'NOT_APPLICABLE',
                'message': 'Resource type not supported for encryption check'
            }
    except Exception as e:
        print(f"Error evaluating resource {resource_id}: {str(e)}")
        return {
            'status': 'INSUFFICIENT_DATA',
            'message': f'Error evaluating resource: {str(e)}'
        }


def check_ec2_encryption(instance_id):
    """
    Check if EC2 instance volumes are encrypted.
    """
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])

        if not response['Reservations']:
            return {'status': 'NOT_APPLICABLE', 'message': 'Instance not found'}

        instance = response['Reservations'][0]['Instances'][0]

        # Check all attached volumes
        unencrypted_volumes = []
        for mapping in instance.get('BlockDeviceMappings', []):
            volume_id = mapping.get('Ebs', {}).get('VolumeId')
            if volume_id:
                volume_response = ec2_client.describe_volumes(VolumeIds=[volume_id])
                if volume_response['Volumes']:
                    volume = volume_response['Volumes'][0]
                    if not volume.get('Encrypted', False):
                        unencrypted_volumes.append(volume_id)

        if unencrypted_volumes:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'EC2 instance has unencrypted volumes: {", ".join(unencrypted_volumes)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'All EC2 instance volumes are encrypted'
        }
    except Exception as e:
        print(f"Error checking EC2 encryption: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_rds_encryption(db_instance_id):
    """
    Check if RDS instance is encrypted.
    """
    try:
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)

        if not response['DBInstances']:
            return {'status': 'NOT_APPLICABLE', 'message': 'DB instance not found'}

        db_instance = response['DBInstances'][0]

        if not db_instance.get('StorageEncrypted', False):
            return {
                'status': 'NON_COMPLIANT',
                'message': 'RDS instance storage is not encrypted'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'RDS instance storage is encrypted'
        }
    except Exception as e:
        print(f"Error checking RDS encryption: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_s3_encryption(bucket_name):
    """
    Check if S3 bucket has encryption enabled.
    """
    try:
        response = s3_client.get_bucket_encryption(Bucket=bucket_name)

        rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])

        if not rules:
            return {
                'status': 'NON_COMPLIANT',
                'message': 'S3 bucket does not have encryption configured'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'S3 bucket has encryption enabled'
        }
    except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
        return {
            'status': 'NON_COMPLIANT',
            'message': 'S3 bucket does not have encryption configured'
        }
    except Exception as e:
        print(f"Error checking S3 encryption: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def scan_all_resources():
    """
    Scan all resources in the region for encryption compliance.
    """
    print("Scanning all resources for encryption compliance")
    non_compliant_resources = []

    # Scan EC2 instances
    try:
        ec2_response = ec2_client.describe_instances()
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                compliance = check_ec2_encryption(instance_id)
                if compliance['status'] == 'NON_COMPLIANT':
                    non_compliant_resources.append(f"EC2: {instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning EC2 instances: {str(e)}")

    # Scan RDS instances
    try:
        rds_response = rds_client.describe_db_instances()
        for db_instance in rds_response['DBInstances']:
            db_instance_id = db_instance['DBInstanceIdentifier']
            compliance = check_rds_encryption(db_instance_id)
            if compliance['status'] == 'NON_COMPLIANT':
                non_compliant_resources.append(f"RDS: {db_instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning RDS instances: {str(e)}")

    # Send summary notification if there are non-compliant resources
    if non_compliant_resources:
        message = f"Encryption Compliance Scan Results ({REGION}):\n\n"
        message += f"Found {len(non_compliant_resources)} non-compliant resources:\n\n"
        message += "\n".join(non_compliant_resources)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Encryption Compliance Alert - {REGION}',
            Message=message
        )


def send_notification(resource_type, resource_id, message):
    """
    Send SNS notification for non-compliant resources.
    """
    try:
        sns_message = f"""
Encryption Compliance Alert

Environment: {ENVIRONMENT_SUFFIX}
Region: {REGION}
Resource Type: {resource_type}
Resource ID: {resource_id}
Status: NON_COMPLIANT

Details: {message}

Please review and remediate this compliance issue.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Encryption Compliance Alert: {resource_type}',
            Message=sns_message
        )
        print(f"Notification sent for {resource_type}: {resource_id}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")

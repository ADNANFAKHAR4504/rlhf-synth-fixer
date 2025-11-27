import json
import boto3
import os
from datetime import datetime, timedelta

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
    Lambda handler for backup compliance checks.
    Evaluates resources for backup policies.
    """
    print(f"Backup compliance check triggered: {json.dumps(event)}")

    # Handle both Config rule evaluation and scheduled events
    if 'configRuleId' in event:
        # Config rule evaluation
        invoking_event = json.loads(event['configRuleInvokingEvent'])
        configuration_item = invoking_event.get('configurationItem', {})
        resource_type = configuration_item.get('resourceType')
        resource_id = configuration_item.get('resourceId')

        compliance = evaluate_resource_backup(resource_type, resource_id)

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
        'body': json.dumps('Backup compliance check completed')
    }


def evaluate_resource_backup(resource_type, resource_id):
    """
    Evaluate backup compliance for a specific resource.
    """
    try:
        if resource_type == 'AWS::EC2::Instance':
            return check_ec2_backup(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            return check_rds_backup(resource_id)
        elif resource_type == 'AWS::S3::Bucket':
            return check_s3_backup(resource_id)
        else:
            return {
                'status': 'NOT_APPLICABLE',
                'message': 'Resource type not supported for backup check'
            }
    except Exception as e:
        print(f"Error evaluating resource {resource_id}: {str(e)}")
        return {
            'status': 'INSUFFICIENT_DATA',
            'message': f'Error evaluating resource: {str(e)}'
        }


def check_ec2_backup(instance_id):
    """
    Check if EC2 instance has recent snapshots (backup policy).
    """
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])

        if not response['Reservations']:
            return {'status': 'NOT_APPLICABLE', 'message': 'Instance not found'}

        instance = response['Reservations'][0]['Instances'][0]

        # Check for backup tag
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
        if 'Backup' not in tags or tags['Backup'].lower() != 'true':
            return {
                'status': 'NON_COMPLIANT',
                'message': 'EC2 instance does not have Backup tag set to true'
            }

        # Check for recent snapshots (last 7 days)
        volume_ids = [mapping.get('Ebs', {}).get('VolumeId')
                     for mapping in instance.get('BlockDeviceMappings', [])
                     if mapping.get('Ebs', {}).get('VolumeId')]

        if not volume_ids:
            return {
                'status': 'COMPLIANT',
                'message': 'EC2 instance has backup tag enabled (no volumes to check)'
            }

        # Check for snapshots
        cutoff_date = datetime.utcnow() - timedelta(days=7)

        for volume_id in volume_ids:
            snapshots = ec2_client.describe_snapshots(
                Filters=[
                    {'Name': 'volume-id', 'Values': [volume_id]},
                    {'Name': 'status', 'Values': ['completed']}
                ]
            )

            recent_snapshots = [
                s for s in snapshots['Snapshots']
                if s['StartTime'].replace(tzinfo=None) > cutoff_date
            ]

            if not recent_snapshots:
                return {
                    'status': 'NON_COMPLIANT',
                    'message': f'EC2 instance volume {volume_id} has no recent snapshots (last 7 days)'
                }

        return {
            'status': 'COMPLIANT',
            'message': 'EC2 instance has backup tag and recent snapshots'
        }
    except Exception as e:
        print(f"Error checking EC2 backup: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_rds_backup(db_instance_id):
    """
    Check if RDS instance has automated backups enabled.
    """
    try:
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)

        if not response['DBInstances']:
            return {'status': 'NOT_APPLICABLE', 'message': 'DB instance not found'}

        db_instance = response['DBInstances'][0]

        backup_retention = db_instance.get('BackupRetentionPeriod', 0)

        if backup_retention == 0:
            return {
                'status': 'NON_COMPLIANT',
                'message': 'RDS instance does not have automated backups enabled'
            }

        if backup_retention < 7:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'RDS instance backup retention period ({backup_retention} days) is less than 7 days'
            }

        return {
            'status': 'COMPLIANT',
            'message': f'RDS instance has automated backups enabled with {backup_retention} days retention'
        }
    except Exception as e:
        print(f"Error checking RDS backup: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_s3_backup(bucket_name):
    """
    Check if S3 bucket has versioning enabled (backup policy).
    """
    try:
        response = s3_client.get_bucket_versioning(Bucket=bucket_name)

        status = response.get('Status', 'Disabled')

        if status != 'Enabled':
            return {
                'status': 'NON_COMPLIANT',
                'message': 'S3 bucket does not have versioning enabled'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'S3 bucket has versioning enabled'
        }
    except Exception as e:
        print(f"Error checking S3 backup: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def scan_all_resources():
    """
    Scan all resources in the region for backup compliance.
    """
    print("Scanning all resources for backup compliance")
    non_compliant_resources = []

    # Scan EC2 instances
    try:
        ec2_response = ec2_client.describe_instances()
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                compliance = check_ec2_backup(instance_id)
                if compliance['status'] == 'NON_COMPLIANT':
                    non_compliant_resources.append(f"EC2: {instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning EC2 instances: {str(e)}")

    # Scan RDS instances
    try:
        rds_response = rds_client.describe_db_instances()
        for db_instance in rds_response['DBInstances']:
            db_instance_id = db_instance['DBInstanceIdentifier']
            compliance = check_rds_backup(db_instance_id)
            if compliance['status'] == 'NON_COMPLIANT':
                non_compliant_resources.append(f"RDS: {db_instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning RDS instances: {str(e)}")

    # Send summary notification if there are non-compliant resources
    if non_compliant_resources:
        message = f"Backup Compliance Scan Results ({REGION}):\n\n"
        message += f"Found {len(non_compliant_resources)} non-compliant resources:\n\n"
        message += "\n".join(non_compliant_resources)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Backup Compliance Alert - {REGION}',
            Message=message
        )


def send_notification(resource_type, resource_id, message):
    """
    Send SNS notification for non-compliant resources.
    """
    try:
        sns_message = f"""
Backup Compliance Alert

Environment: {ENVIRONMENT_SUFFIX}
Region: {REGION}
Resource Type: {resource_type}
Resource ID: {resource_id}
Status: NON_COMPLIANT

Details: {message}

Please review and configure backup policies.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Backup Compliance Alert: {resource_type}',
            Message=sns_message
        )
        print(f"Notification sent for {resource_type}: {resource_id}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")

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

# Required tags for compliance
REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']


def lambda_handler(event, context):
    """
    Lambda handler for tagging compliance checks.
    Evaluates resources for required tags.
    """
    print(f"Tagging compliance check triggered: {json.dumps(event)}")

    # Handle both Config rule evaluation and scheduled events
    if 'configRuleId' in event:
        # Config rule evaluation
        invoking_event = json.loads(event['configRuleInvokingEvent'])
        configuration_item = invoking_event.get('configurationItem', {})
        resource_type = configuration_item.get('resourceType')
        resource_id = configuration_item.get('resourceId')

        compliance = evaluate_resource_tags(resource_type, resource_id)

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
        'body': json.dumps('Tagging compliance check completed')
    }


def evaluate_resource_tags(resource_type, resource_id):
    """
    Evaluate tagging compliance for a specific resource.
    """
    try:
        if resource_type == 'AWS::EC2::Instance':
            return check_ec2_tags(resource_id)
        elif resource_type == 'AWS::RDS::DBInstance':
            return check_rds_tags(resource_id)
        elif resource_type == 'AWS::S3::Bucket':
            return check_s3_tags(resource_id)
        else:
            return {
                'status': 'NOT_APPLICABLE',
                'message': 'Resource type not supported for tagging check'
            }
    except Exception as e:
        print(f"Error evaluating resource {resource_id}: {str(e)}")
        return {
            'status': 'INSUFFICIENT_DATA',
            'message': f'Error evaluating resource: {str(e)}'
        }


def check_ec2_tags(instance_id):
    """
    Check if EC2 instance has required tags.
    """
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])

        if not response['Reservations']:
            return {'status': 'NOT_APPLICABLE', 'message': 'Instance not found'}

        instance = response['Reservations'][0]['Instances'][0]
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

        missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

        if missing_tags:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'EC2 instance missing required tags: {", ".join(missing_tags)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'EC2 instance has all required tags'
        }
    except Exception as e:
        print(f"Error checking EC2 tags: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_rds_tags(db_instance_id):
    """
    Check if RDS instance has required tags.
    """
    try:
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)

        if not response['DBInstances']:
            return {'status': 'NOT_APPLICABLE', 'message': 'DB instance not found'}

        db_instance = response['DBInstances'][0]
        db_arn = db_instance['DBInstanceArn']

        tags_response = rds_client.list_tags_for_resource(ResourceName=db_arn)
        tags = {tag['Key']: tag['Value'] for tag in tags_response.get('TagList', [])}

        missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

        if missing_tags:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'RDS instance missing required tags: {", ".join(missing_tags)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'RDS instance has all required tags'
        }
    except Exception as e:
        print(f"Error checking RDS tags: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def check_s3_tags(bucket_name):
    """
    Check if S3 bucket has required tags.
    """
    try:
        response = s3_client.get_bucket_tagging(Bucket=bucket_name)
        tags = {tag['Key']: tag['Value'] for tag in response.get('TagSet', [])}

        missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]

        if missing_tags:
            return {
                'status': 'NON_COMPLIANT',
                'message': f'S3 bucket missing required tags: {", ".join(missing_tags)}'
            }

        return {
            'status': 'COMPLIANT',
            'message': 'S3 bucket has all required tags'
        }
    except s3_client.exceptions.NoSuchTagSet:
        return {
            'status': 'NON_COMPLIANT',
            'message': f'S3 bucket has no tags. Required tags: {", ".join(REQUIRED_TAGS)}'
        }
    except Exception as e:
        print(f"Error checking S3 tags: {str(e)}")
        return {'status': 'INSUFFICIENT_DATA', 'message': str(e)}


def scan_all_resources():
    """
    Scan all resources in the region for tagging compliance.
    """
    print("Scanning all resources for tagging compliance")
    non_compliant_resources = []

    # Scan EC2 instances
    try:
        ec2_response = ec2_client.describe_instances()
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                compliance = check_ec2_tags(instance_id)
                if compliance['status'] == 'NON_COMPLIANT':
                    non_compliant_resources.append(f"EC2: {instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning EC2 instances: {str(e)}")

    # Scan RDS instances
    try:
        rds_response = rds_client.describe_db_instances()
        for db_instance in rds_response['DBInstances']:
            db_instance_id = db_instance['DBInstanceIdentifier']
            compliance = check_rds_tags(db_instance_id)
            if compliance['status'] == 'NON_COMPLIANT':
                non_compliant_resources.append(f"RDS: {db_instance_id} - {compliance['message']}")
    except Exception as e:
        print(f"Error scanning RDS instances: {str(e)}")

    # Send summary notification if there are non-compliant resources
    if non_compliant_resources:
        message = f"Tagging Compliance Scan Results ({REGION}):\n\n"
        message += f"Found {len(non_compliant_resources)} non-compliant resources:\n\n"
        message += "\n".join(non_compliant_resources)

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Tagging Compliance Alert - {REGION}',
            Message=message
        )


def send_notification(resource_type, resource_id, message):
    """
    Send SNS notification for non-compliant resources.
    """
    try:
        sns_message = f"""
Tagging Compliance Alert

Environment: {ENVIRONMENT_SUFFIX}
Region: {REGION}
Resource Type: {resource_type}
Resource ID: {resource_id}
Status: NON_COMPLIANT

Details: {message}

Required Tags: {', '.join(REQUIRED_TAGS)}

Please review and add the missing tags.
"""

        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Tagging Compliance Alert: {resource_type}',
            Message=sns_message
        )
        print(f"Notification sent for {resource_type}: {resource_id}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")

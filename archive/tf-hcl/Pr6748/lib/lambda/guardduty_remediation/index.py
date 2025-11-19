"""
GuardDuty Remediation Lambda
Automatically remediates high-severity GuardDuty findings
"""

import json
import os
import boto3
from typing import Dict, Any

ec2 = boto3.client('ec2')
s3 = boto3.client('s3')
sns = boto3.client('sns')

QUARANTINE_SG = os.environ.get('QUARANTINE_SECURITY_GROUP_ID')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for GuardDuty remediation
    
    Args:
        event: GuardDuty finding event from EventBridge
        context: Lambda context
        
    Returns:
        Response dictionary with status
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract finding details
        detail = event.get('detail', {})
        finding_type = detail.get('type', 'Unknown')
        severity = detail.get('severity', 0)
        resource = detail.get('resource', {})
        
        print(f"Processing finding: {finding_type}, Severity: {severity}")
        
        # Determine remediation action based on finding type
        if 'UnauthorizedAccess:EC2' in finding_type or 'Backdoor:EC2' in finding_type:
            handle_ec2_threat(resource, detail)
        elif 'S3' in finding_type:
            handle_s3_threat(resource, detail)
        else:
            print(f"No specific remediation for finding type: {finding_type}")
        
        # Send SNS notification
        send_notification(finding_type, severity, resource)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Remediation completed successfully',
                'findingType': finding_type
            })
        }
        
    except Exception as e:
        print(f"Error during remediation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def handle_ec2_threat(resource: Dict[str, Any], detail: Dict[str, Any]) -> None:
    """
    Remediate EC2-related threats by isolating the instance
    
    Args:
        resource: Resource details from GuardDuty
        detail: Full finding details
    """
    instance_details = resource.get('instanceDetails', {})
    instance_id = instance_details.get('instanceId')
    
    if not instance_id:
        print("No instance ID found in finding")
        return
    
    print(f"Isolating EC2 instance: {instance_id}")
    
    try:
        # Get current instance details
        response = ec2.describe_instances(InstanceIds=[instance_id])
        
        if not response['Reservations']:
            print(f"Instance {instance_id} not found")
            return
        
        instance = response['Reservations'][0]['Instances'][0]
        
        # Apply quarantine security group
        if QUARANTINE_SG:
            print(f"Applying quarantine security group: {QUARANTINE_SG}")
            ec2.modify_instance_attribute(
                InstanceId=instance_id,
                Groups=[QUARANTINE_SG]
            )
            print(f"Instance {instance_id} isolated successfully")
        else:
            print("QUARANTINE_SECURITY_GROUP_ID not configured")
            
    except Exception as e:
        print(f"Error isolating instance {instance_id}: {str(e)}")
        raise


def handle_s3_threat(resource: Dict[str, Any], detail: Dict[str, Any]) -> None:
    """
    Remediate S3-related threats by tagging affected objects
    
    Args:
        resource: Resource details from GuardDuty
        detail: Full finding details
    """
    s3_bucket_details = resource.get('s3BucketDetails', [])
    
    for bucket_detail in s3_bucket_details:
        bucket_name = bucket_detail.get('name')
        
        if not bucket_name:
            continue
        
        print(f"Quarantining S3 bucket objects: {bucket_name}")
        
        try:
            # Tag the bucket for review
            s3.put_bucket_tagging(
                Bucket=bucket_name,
                Tagging={
                    'TagSet': [
                        {
                            'Key': 'SecurityStatus',
                            'Value': 'UnderReview'
                        },
                        {
                            'Key': 'QuarantinedBy',
                            'Value': 'GuardDutyRemediation'
                        }
                    ]
                }
            )
            print(f"Bucket {bucket_name} tagged for review")
            
        except Exception as e:
            print(f"Error tagging bucket {bucket_name}: {str(e)}")


def send_notification(finding_type: str, severity: float, resource: Dict[str, Any]) -> None:
    """
    Send SNS notification about the remediation
    
    Args:
        finding_type: Type of GuardDuty finding
        severity: Severity score
        resource: Affected resource details
    """
    if not SNS_TOPIC_ARN:
        print("SNS_TOPIC_ARN not configured, skipping notification")
        return
    
    try:
        message = {
            'findingType': finding_type,
            'severity': severity,
            'resource': resource,
            'remediationAction': 'Automated isolation applied',
            'timestamp': context.get('timestamp') if 'context' in globals() else 'N/A'
        }
        
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'GuardDuty Automated Remediation: {finding_type}',
            Message=json.dumps(message, indent=2)
        )
        print("SNS notification sent successfully")
        
    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")

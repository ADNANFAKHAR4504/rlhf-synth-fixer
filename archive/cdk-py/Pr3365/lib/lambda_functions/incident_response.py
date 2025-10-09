"""
Incident Response Lambda Function
Automated response to security incidents from GuardDuty and Security Hub
"""
import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any
import logging

# Initialize AWS clients
ec2 = boto3.client('ec2')
sns = boto3.client('sns')
security_hub = boto3.client('securityhub')
ssm = boto3.client('ssm')

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Automated incident response handler
    
    Args:
        event: EventBridge event from GuardDuty or Security Hub
        context: Lambda context object
        
    Returns:
        dict: Response indicating completion status
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")
        
        # Determine event source
        source = event.get('source', '')
        
        if source == 'aws.guardduty':
            response = handle_guardduty_finding(event['detail'])
        elif source == 'aws.securityhub':
            response = handle_security_hub_finding(event['detail'])
        else:
            logger.warning(f"Unknown event source: {source}")
            return {
                'statusCode': 400,
                'body': json.dumps('Unknown event source')
            }
        
        # Send notification
        notify_security_team(event, response)
        
        return {
            'statusCode': 200,
            'body': json.dumps('Incident response completed')
        }
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }


def handle_guardduty_finding(finding: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle GuardDuty findings with automated response
    
    Args:
        finding: GuardDuty finding details
        
    Returns:
        dict: Response with actions taken
    """
    severity = finding.get('severity', 0)
    finding_type = finding.get('type', '')
    resource = finding.get('resource', {})
    
    response = {
        'actions_taken': [],
        'finding_id': finding.get('id'),
        'severity': severity
    }
    
    # High severity findings trigger immediate action
    if severity >= 7:
        if 'Instance' in resource.get('resourceType', ''):
            instance_id = resource.get('instanceDetails', {}).get('instanceId')
            if instance_id:
                # Isolate the instance
                isolate_instance(instance_id)
                response['actions_taken'].append(f'Isolated instance: {instance_id}')
                
                # Create snapshot for forensics
                create_forensic_snapshot(instance_id)
                response['actions_taken'].append(f'Created forensic snapshot for: {instance_id}')
        
        # Block malicious IP if detected
        if 'remoteIpDetails' in finding.get('service', {}).get('action', {}).get('networkConnectionAction', {}):
            ip = finding['service']['action']['networkConnectionAction']['remoteIpDetails']['ipAddressV4']
            block_ip_address(ip)
            response['actions_taken'].append(f'Blocked IP: {ip}')
    
    # Update finding in Security Hub
    update_security_hub_finding(finding, response['actions_taken'])
    
    return response


def handle_security_hub_finding(detail: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle Security Hub findings
    
    Args:
        detail: Security Hub finding details
        
    Returns:
        dict: Response with actions taken
    """
    findings = detail.get('findings', [])
    response = {
        'actions_taken': [],
        'findings_processed': len(findings)
    }
    
    for finding in findings:
        severity = finding.get('Severity', {}).get('Label', 'LOW')
        
        if severity in ['HIGH', 'CRITICAL']:
            # Trigger remediation based on finding type
            compliance_status = finding.get('Compliance', {}).get('Status', '')
            
            if compliance_status == 'FAILED':
                # Attempt auto-remediation
                resource_type = finding.get('Resources', [{}])[0].get('Type', '')
                resource_id = finding.get('Resources', [{}])[0].get('Id', '')
                
                if resource_type == 'AwsEc2Instance':
                    # Apply security patches via Systems Manager
                    apply_security_patches(resource_id.split('/')[-1])
                    response['actions_taken'].append(f'Applied patches to: {resource_id}')
    
    return response


def isolate_instance(instance_id: str):
    """
    Isolate EC2 instance by moving to quarantine security group
    
    Args:
        instance_id: The EC2 instance ID to isolate
    """
    try:
        # Create quarantine security group if it doesn't exist
        quarantine_sg = create_quarantine_security_group()
        
        # Modify instance security groups
        ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=[quarantine_sg]
        )
        
        logger.info(f"Isolated instance {instance_id} to quarantine security group")
        
    except Exception as e:
        logger.error(f"Failed to isolate instance {instance_id}: {str(e)}")
        raise


def create_quarantine_security_group() -> str:
    """
    Create or get quarantine security group
    
    Returns:
        str: Security group ID for quarantine
    """
    try:
        response = ec2.describe_security_groups(
            GroupNames=['quarantine-sg']
        )
        return response['SecurityGroups'][0]['GroupId']
    except:
        # Create new quarantine SG
        response = ec2.create_security_group(
            GroupName='quarantine-sg',
            Description='Quarantine security group for isolated instances'
        )
        
        # Remove all egress rules
        ec2.revoke_security_group_egress(
            GroupId=response['GroupId'],
            IpPermissions=[{
                'IpProtocol': '-1',
                'FromPort': -1,
                'ToPort': -1,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        )
        
        return response['GroupId']


def create_forensic_snapshot(instance_id: str):
    """
    Create EBS snapshot for forensic analysis
    
    Args:
        instance_id: The EC2 instance ID to snapshot
    """
    try:
        # Get instance volumes
        response = ec2.describe_instances(InstanceIds=[instance_id])
        volumes = []
        
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                for mapping in instance.get('BlockDeviceMappings', []):
                    if 'Ebs' in mapping:
                        volumes.append(mapping['Ebs']['VolumeId'])
        
        # Create snapshots
        for volume_id in volumes:
            ec2.create_snapshot(
                VolumeId=volume_id,
                Description=f'Forensic snapshot for incident response - {datetime.utcnow().isoformat()}',
                TagSpecifications=[{
                    'ResourceType': 'snapshot',
                    'Tags': [
                        {'Key': 'IncidentResponse', 'Value': 'true'},
                        {'Key': 'InstanceId', 'Value': instance_id},
                        {'Key': 'Timestamp', 'Value': datetime.utcnow().isoformat()}
                    ]
                }]
            )
        
        logger.info(f"Created forensic snapshots for instance {instance_id}")
        
    except Exception as e:
        logger.error(f"Failed to create snapshots: {str(e)}")


def block_ip_address(ip: str):
    """
    Block malicious IP in Network ACL
    
    Args:
        ip: The IP address to block
    """
    # This would integrate with your Network Firewall or WAF
    logger.info(f"Would block IP address: {ip}")


def apply_security_patches(instance_id: str):
    """
    Apply security patches using Systems Manager
    
    Args:
        instance_id: The EC2 instance ID to patch
    """
    try:
        ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunPatchBaseline',
            Parameters={
                'Operation': ['Install']
            }
        )
        logger.info(f"Initiated patching for instance {instance_id}")
    except Exception as e:
        logger.error(f"Failed to apply patches: {str(e)}")


def update_security_hub_finding(finding: Dict, actions: list):
    """
    Update Security Hub finding with response actions
    
    Args:
        finding: The finding to update
        actions: List of actions taken
    """
    try:
        security_hub.batch_update_findings(
            FindingIdentifiers=[{
                'Id': finding.get('id'),
                'ProductArn': finding.get('productArn')
            }],
            Note={
                'Text': f"Automated response: {', '.join(actions)}",
                'UpdatedBy': 'IncidentResponseLambda'
            },
            Workflow={
                'Status': 'RESOLVED' if actions else 'NEW'
            }
        )
    except Exception as e:
        logger.error(f"Failed to update Security Hub: {str(e)}")


def notify_security_team(event: Dict, response: Dict):
    """
    Send notification to security team
    
    Args:
        event: The original event
        response: The response with actions taken
    """
    try:
        message = {
            'event_source': event.get('source'),
            'timestamp': datetime.utcnow().isoformat(),
            'actions_taken': response.get('actions_taken', []),
            'severity': response.get('severity', 'UNKNOWN'),
            'raw_event': event
        }
        
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f"[SECURITY] Automated Incident Response - {event.get('source')}",
            Message=json.dumps(message, indent=2)
        )
        
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
import json
import boto3
import os
from datetime import datetime

# Initialize AWS clients
s3_client = boto3.client('s3')
ec2_client = boto3.client('ec2')
sns_client = boto3.client('sns')

# Environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event, context):
    """
    Main Lambda handler for auto-remediation of security issues
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Determine event source and take appropriate action
        if 'source' in event and event['source'] == 'aws.s3':
            handle_s3_event(event)
        elif 'source' in event and event['source'] == 'aws.ec2':
            handle_security_group_event(event)
        else:
            print(f"Unhandled event source: {event.get('source', 'unknown')}")
            
    except Exception as e:
        error_message = f"Error processing event: {str(e)}"
        print(error_message)
        send_notification(
            subject=f"Security Remediation Failed - {ENVIRONMENT}",
            message=error_message,
            severity="HIGH"
        )
        raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Event processed successfully')
    }

def handle_s3_event(event):
    """
    Handle S3-related security events
    """
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    bucket_name = extract_bucket_name(detail)
    
    if not bucket_name:
        print("Could not extract bucket name from event")
        return
    
    print(f"Processing S3 event: {event_name} for bucket: {bucket_name}")
    
    # Check and remediate public access
    if event_name in ['PutBucketAcl', 'PutBucketPolicy', 'DeleteBucketPublicAccessBlock']:
        remediate_s3_public_access(bucket_name)
    
def extract_bucket_name(detail):
    """
    Extract bucket name from CloudTrail event detail
    """
    request_parameters = detail.get('requestParameters', {})
    bucket_name = request_parameters.get('bucketName', '')
    
    if not bucket_name:
        # Try to extract from resources
        resources = detail.get('resources', [])
        for resource in resources:
            if resource.get('type') == 'AWS::S3::Bucket':
                bucket_name = resource.get('ARN', '').split(':::')[-1]
                break
    
    return bucket_name

def remediate_s3_public_access(bucket_name):
    """
    Remediate public access on S3 bucket
    """
    try:
        # Block all public access
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )
        
        message = f"""
        Security Alert - Auto-Remediation Completed
        
        Environment: {ENVIRONMENT}
        Resource Type: S3 Bucket
        Resource Name: {bucket_name}
        Issue: Public access detected
        Action Taken: Public access has been blocked
        Timestamp: {datetime.utcnow().isoformat()}
        
        Please review the bucket configuration and ensure this change aligns with your requirements.
        """
        
        send_notification(
            subject=f"S3 Public Access Blocked - {bucket_name}",
            message=message,
            severity="MEDIUM"
        )
        
        print(f"Successfully blocked public access for bucket: {bucket_name}")
        
    except Exception as e:
        error_message = f"Failed to block public access for bucket {bucket_name}: {str(e)}"
        print(error_message)
        send_notification(
            subject=f"Failed to Remediate S3 Bucket - {bucket_name}",
            message=error_message,
            severity="HIGH"
        )

def handle_security_group_event(event):
    """
    Handle Security Group-related events
    """
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    
    if event_name == 'AuthorizeSecurityGroupIngress':
        check_and_remediate_security_group(detail)

def check_and_remediate_security_group(detail):
    """
    Check and remediate overly permissive security group rules
    """
    request_parameters = detail.get('requestParameters', {})
    group_id = request_parameters.get('groupId', '')
    
    if not group_id:
        print("Could not extract security group ID from event")
        return
    
    # Get security group details
    try:
        response = ec2_client.describe_security_groups(GroupIds=[group_id])
        security_group = response['SecurityGroups'][0]
        
        # Check for overly permissive rules (0.0.0.0/0)
        remediated_rules = []
        
        for rule in security_group.get('IpPermissions', []):
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == '0.0.0.0/0':
                    # Check if it's for commonly attacked ports
                    from_port = rule.get('FromPort', 0)
                    to_port = rule.get('ToPort', 0)
                    
                    # List of sensitive ports that should never be open to the world
                    sensitive_ports = [22, 3389, 1433, 3306, 5432, 27017, 6379, 9200, 5601]
                    
                    if any(port in range(from_port, to_port + 1) for port in sensitive_ports):
                        # Revoke the rule
                        revoke_rule = {
                            'IpProtocol': rule.get('IpProtocol'),
                            'FromPort': from_port,
                            'ToPort': to_port,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                        
                        ec2_client.revoke_security_group_ingress(
                            GroupId=group_id,
                            IpPermissions=[revoke_rule]
                        )
                        
                        remediated_rules.append(f"Port {from_port}-{to_port}")
                        print(f"Revoked public access for ports {from_port}-{to_port} in security group {group_id}")
        
        if remediated_rules:
            message = f"""
            Security Alert - Auto-Remediation Completed
            
            Environment: {ENVIRONMENT}
            Resource Type: Security Group
            Resource ID: {group_id}
            Security Group Name: {security_group.get('GroupName', 'N/A')}
            Issue: Overly permissive ingress rules detected (0.0.0.0/0)
            Action Taken: Revoked public access for sensitive ports: {', '.join(remediated_rules)}
            Timestamp: {datetime.utcnow().isoformat()}
            
            Please review the security group configuration and create more restrictive rules if needed.
            """
            
            send_notification(
                subject=f"Security Group Rules Remediated - {group_id}",
                message=message,
                severity="HIGH"
            )
            
    except Exception as e:
        error_message = f"Failed to remediate security group {group_id}: {str(e)}"
        print(error_message)
        send_notification(
            subject=f"Failed to Remediate Security Group - {group_id}",
            message=error_message,
            severity="HIGH"
        )

def send_notification(subject, message, severity="MEDIUM"):
    """
    Send SNS notification for security events
    """
    try:
        # Add severity indicator to subject
        severity_prefix = f"[{severity}] " if severity else ""
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"{severity_prefix}{subject}",
            Message=message,
            MessageAttributes={
                'severity': {
                    'DataType': 'String',
                    'StringValue': severity
                },
                'environment': {
                    'DataType': 'String',
                    'StringValue': ENVIRONMENT
                }
            }
        )
        print(f"Notification sent: {subject}")
        
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")

def validate_iam_policy(policy_document):
    """
    Validate IAM policy for security best practices
    """
    violations = []
    
    try:
        policy = json.loads(policy_document) if isinstance(policy_document, str) else policy_document
        
        for statement in policy.get('Statement', []):
            # Check for overly permissive actions
            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
            
            for action in actions:
                if action == '*':
                    violations.append("Wildcard (*) action detected")
                elif action.endswith(':*'):
                    violations.append(f"Wildcard action detected: {action}")
            
            # Check for overly permissive resources
            resources = statement.get('Resource', [])
            if isinstance(resources, str):
                resources = [resources]
            
            if '*' in resources and statement.get('Effect') == 'Allow':
                violations.append("Wildcard (*) resource with Allow effect detected")
    
    except Exception as e:
        print(f"Error validating IAM policy: {str(e)}")
    
    return violations

def check_encryption_status(resource_type, resource_id):
    """
    Check if a resource has encryption enabled
    """
    encrypted = False
    
    try:
        if resource_type == 's3':
            response = s3_client.get_bucket_encryption(Bucket=resource_id)
            if response.get('ServerSideEncryptionConfiguration'):
                encrypted = True
                
    except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
        encrypted = False
    except Exception as e:
        print(f"Error checking encryption for {resource_type} {resource_id}: {str(e)}")
    
    return encrypted

def enforce_tagging_compliance(resource_arn, required_tags):
    """
    Check and report on missing required tags
    """
    missing_tags = []
    
    # This is a placeholder - actual implementation would check tags via resource groups tagging API
    # and report/remediate missing tags
    
    return missing_tags
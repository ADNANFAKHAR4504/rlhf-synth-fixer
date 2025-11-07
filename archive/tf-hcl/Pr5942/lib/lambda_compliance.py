import json
import base64
import gzip
import os
import boto3
from datetime import datetime

# Initialize AWS clients
sns = boto3.client('sns')
ec2 = boto3.client('ec2')
s3 = boto3.client('s3')
iam = boto3.client('iam')

# Environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event, context):
    """
    Process CloudWatch Logs events containing CloudTrail records
    and check for compliance violations.
    """
    print(f"Processing event in environment: {ENVIRONMENT}")
    
    # Decode the CloudWatch Logs data
    try:
        # CloudWatch Logs sends data as base64 encoded and gzipped
        log_data = json.loads(gzip.decompress(base64.b64decode(event['awslogs']['data'])))
        print(f"Processing {len(log_data['logEvents'])} log events")
    except Exception as e:
        print(f"Error decoding CloudWatch Logs data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps('Error processing logs')
        }
    
    # Process each log event
    violations = []
    for log_event in log_data['logEvents']:
        try:
            # Parse CloudTrail record from the log event
            cloudtrail_event = json.loads(log_event['message'])
            
            # Extract event details
            event_name = cloudtrail_event.get('eventName', '')
            event_time = cloudtrail_event.get('eventTime', '')
            user_identity = cloudtrail_event.get('userIdentity', {})
            request_parameters = cloudtrail_event.get('requestParameters', {})
            response_elements = cloudtrail_event.get('responseElements', {})
            source_ip = cloudtrail_event.get('sourceIPAddress', '')
            
            print(f"Checking event: {event_name} from {user_identity.get('principalId', 'unknown')}")
            
            # Check for compliance violations based on event type
            violation = check_compliance(
                event_name, 
                request_parameters, 
                response_elements,
                user_identity,
                source_ip,
                event_time
            )
            
            if violation:
                violations.append(violation)
                
        except Exception as e:
            print(f"Error processing log event: {str(e)}")
            continue
    
    # Send alerts for any violations found
    if violations:
        send_compliance_alert(violations)
        print(f"Found {len(violations)} compliance violations")
    else:
        print("No compliance violations found")
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Processed {len(log_data["logEvents"])} events, found {len(violations)} violations')
    }

def check_compliance(event_name, request_params, response_elements, user_identity, source_ip, event_time):
    """
    Check if the CloudTrail event violates any compliance rules.
    """
    violation = None
    
    # Security Group Rules - Check for overly permissive ingress
    if event_name in ['AuthorizeSecurityGroupIngress', 'AuthorizeSecurityGroupEgress']:
        violation = check_security_group_rules(event_name, request_params, user_identity, source_ip, event_time)
    
    # S3 Bucket Policies - Check for public access
    elif event_name in ['PutBucketPolicy', 'PutBucketAcl', 'PutBucketPublicAccessBlock']:
        violation = check_s3_public_access(event_name, request_params, user_identity, source_ip, event_time)
    
    # IAM Policy Changes - Check for overly permissive policies
    elif event_name in ['CreatePolicy', 'CreatePolicyVersion', 'PutUserPolicy', 'PutGroupPolicy', 'PutRolePolicy']:
        violation = check_iam_policies(event_name, request_params, user_identity, source_ip, event_time)
    
    # KMS Key Policy Changes
    elif event_name == 'PutKeyPolicy':
        violation = check_kms_policy(event_name, request_params, user_identity, source_ip, event_time)
    
    return violation

def check_security_group_rules(event_name, request_params, user_identity, source_ip, event_time):
    """
    Check security group rules for overly permissive access.
    """
    violation = None
    
    # Check for 0.0.0.0/0 in ingress rules
    if event_name == 'AuthorizeSecurityGroupIngress':
        ip_permissions = request_params.get('ipPermissions', [])
        for permission in ip_permissions:
            ip_ranges = permission.get('ipRanges', [])
            for ip_range in ip_ranges:
                cidr = ip_range.get('cidrIp', '')
                if cidr == '0.0.0.0/0':
                    from_port = permission.get('fromPort', 'N/A')
                    to_port = permission.get('toPort', 'N/A')
                    protocol = permission.get('ipProtocol', 'N/A')
                    
                    violation = {
                        'type': 'SECURITY_GROUP_PUBLIC_ACCESS',
                        'severity': 'HIGH',
                        'event_name': event_name,
                        'event_time': event_time,
                        'user': user_identity.get('principalId', 'unknown'),
                        'source_ip': source_ip,
                        'details': f"Security group rule allows public access (0.0.0.0/0) on ports {from_port}-{to_port} protocol {protocol}",
                        'resource': request_params.get('groupId', 'unknown'),
                        'recommendation': 'Review and restrict security group rules to specific IP ranges'
                    }
                    print(f"VIOLATION: {violation['details']}")
                    break
    
    return violation

def check_s3_public_access(event_name, request_params, user_identity, source_ip, event_time):
    """
    Check S3 bucket configurations for public access.
    """
    violation = None
    
    if event_name == 'PutBucketPolicy':
        # Check if policy grants public access
        policy_text = request_params.get('bucketPolicy', {})
        if isinstance(policy_text, str):
            try:
                policy = json.loads(policy_text)
            except:
                policy = {}
        else:
            policy = policy_text
            
        for statement in policy.get('Statement', []):
            principal = statement.get('Principal', '')
            effect = statement.get('Effect', '')
            
            # Check for public access indicators
            if (principal == '*' or principal == {'AWS': '*'}) and effect == 'Allow':
                violation = {
                    'type': 'S3_BUCKET_PUBLIC_ACCESS',
                    'severity': 'CRITICAL',
                    'event_name': event_name,
                    'event_time': event_time,
                    'user': user_identity.get('principalId', 'unknown'),
                    'source_ip': source_ip,
                    'details': f"S3 bucket policy allows public access",
                    'resource': request_params.get('bucketName', 'unknown'),
                    'recommendation': 'Remove public access from bucket policy or use S3 Block Public Access'
                }
                print(f"VIOLATION: {violation['details']}")
                break
    
    elif event_name == 'PutBucketPublicAccessBlock':
        # Check if public access block is being disabled
        config = request_params.get('PublicAccessBlockConfiguration', {})
        if not all([
            config.get('BlockPublicAcls', True),
            config.get('BlockPublicPolicy', True),
            config.get('IgnorePublicAcls', True),
            config.get('RestrictPublicBuckets', True)
        ]):
            violation = {
                'type': 'S3_PUBLIC_ACCESS_BLOCK_DISABLED',
                'severity': 'HIGH',
                'event_name': event_name,
                'event_time': event_time,
                'user': user_identity.get('principalId', 'unknown'),
                'source_ip': source_ip,
                'details': 'S3 Public Access Block settings are being weakened',
                'resource': request_params.get('bucketName', 'unknown'),
                'recommendation': 'Enable all S3 Block Public Access settings'
            }
            print(f"VIOLATION: {violation['details']}")
    
    return violation

def check_iam_policies(event_name, request_params, user_identity, source_ip, event_time):
    """
    Check IAM policies for overly permissive permissions.
    """
    violation = None
    
    # Extract policy document
    policy_document = request_params.get('policyDocument', '')
    if isinstance(policy_document, str):
        try:
            policy = json.loads(policy_document)
        except:
            policy = {}
    else:
        policy = policy_document
    
    # Check for dangerous permissions
    dangerous_actions = ['*', 'iam:*', 's3:*', 'ec2:*', 'kms:*']
    
    for statement in policy.get('Statement', []):
        actions = statement.get('Action', [])
        if isinstance(actions, str):
            actions = [actions]
        
        effect = statement.get('Effect', '')
        resource = statement.get('Resource', '')
        
        # Check for overly broad permissions
        for action in actions:
            if action in dangerous_actions and effect == 'Allow' and resource == '*':
                violation = {
                    'type': 'IAM_OVERLY_PERMISSIVE_POLICY',
                    'severity': 'CRITICAL',
                    'event_name': event_name,
                    'event_time': event_time,
                    'user': user_identity.get('principalId', 'unknown'),
                    'source_ip': source_ip,
                    'details': f"IAM policy grants excessive permissions: {action} on all resources",
                    'resource': request_params.get('policyName', 'unknown'),
                    'recommendation': 'Follow principle of least privilege and restrict permissions to specific resources'
                }
                print(f"VIOLATION: {violation['details']}")
                break
    
    return violation

def check_kms_policy(event_name, request_params, user_identity, source_ip, event_time):
    """
    Check KMS key policies for security issues.
    """
    violation = None
    
    policy_text = request_params.get('policy', '')
    if isinstance(policy_text, str):
        try:
            policy = json.loads(policy_text)
        except:
            policy = {}
    else:
        policy = policy_text
    
    # Check if key policy allows public access
    for statement in policy.get('Statement', []):
        principal = statement.get('Principal', '')
        effect = statement.get('Effect', '')
        
        if (principal == '*' or principal == {'AWS': '*'}) and effect == 'Allow':
            violation = {
                'type': 'KMS_KEY_PUBLIC_ACCESS',
                'severity': 'CRITICAL',
                'event_name': event_name,
                'event_time': event_time,
                'user': user_identity.get('principalId', 'unknown'),
                'source_ip': source_ip,
                'details': 'KMS key policy allows public access',
                'resource': request_params.get('keyId', 'unknown'),
                'recommendation': 'Restrict KMS key access to specific AWS principals'
            }
            print(f"VIOLATION: {violation['details']}")
            break
    
    return violation

def send_compliance_alert(violations):
    """
    Send compliance violation alerts to SNS topic.
    """
    # Format the alert message
    alert_message = {
        'environment': ENVIRONMENT,
        'timestamp': datetime.utcnow().isoformat(),
        'violation_count': len(violations),
        'violations': violations
    }
    
    # Create a summary for the subject
    violation_types = list(set([v['type'] for v in violations]))
    subject = f"[{ENVIRONMENT.upper()}] Compliance Alert: {len(violations)} violation(s) detected - {', '.join(violation_types[:3])}"
    
    if len(violation_types) > 3:
        subject += f" and {len(violation_types) - 3} more"
    
    try:
        # Publish to SNS
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],  # SNS subject limit
            Message=json.dumps(alert_message, indent=2)
        )
        print(f"Alert sent to SNS: {response['MessageId']}")
    except Exception as e:
        print(f"Error sending alert to SNS: {str(e)}")
        raise

def auto_remediate(violation):
    """
    Optionally auto-remediate certain violations.
    This is commented out by default for safety.
    """
    # Example auto-remediation for security groups
    # if violation['type'] == 'SECURITY_GROUP_PUBLIC_ACCESS':
    #     try:
    #         ec2.revoke_security_group_ingress(
    #             GroupId=violation['resource'],
    #             IpPermissions=[...]
    #         )
    #         print(f"Auto-remediated: Revoked public access from {violation['resource']}")
    #     except Exception as e:
    #         print(f"Failed to auto-remediate: {str(e)}")
    pass
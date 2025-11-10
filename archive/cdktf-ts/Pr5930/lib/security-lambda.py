import boto3
import json
import os
from datetime import datetime

def handler(event, context):
    """
    Security automation Lambda function that performs various security checks
    """
    
    # Initialize AWS clients
    iam = boto3.client('iam')
    securityhub = boto3.client('securityhub')
    sns = boto3.client('sns')
    config_client = boto3.client('config')
    
    # Get SNS topic ARN from environment or event
    sns_topic_arn = event.get('sns_topic_arn', os.environ.get('SNS_TOPIC_ARN'))
    
    findings = []
    
    # Check 1: Verify MFA is enabled for all IAM users
    try:
        users = iam.list_users()['Users']
        for user in users:
            mfa_devices = iam.list_mfa_devices(UserName=user['UserName'])
            
            if not mfa_devices['MFADevices']:
                finding = {
                    'severity': 'HIGH',
                    'title': f'MFA not enabled for user {user["UserName"]}',
                    'description': f'User {user["UserName"]} does not have MFA enabled. This is a security risk.',
                    'resource': f'arn:aws:iam::*:user/{user["UserName"]}',
                    'remediation': 'Enable MFA for this user immediately'
                }
                findings.append(finding)
                
                # Send SNS notification
                if sns_topic_arn:
                    sns.publish(
                        TopicArn=sns_topic_arn,
                        Subject='Security Alert: MFA Not Enabled',
                        Message=json.dumps(finding, indent=2)
                    )
    except Exception as e:
        print(f"Error checking MFA status: {str(e)}")
    
    # Check 2: Review IAM password policy
    try:
        password_policy = iam.get_account_password_policy()['PasswordPolicy']
        
        # Check if password policy meets security standards
        if password_policy.get('MinimumPasswordLength', 0) < 14:
            finding = {
                'severity': 'MEDIUM',
                'title': 'Weak password policy',
                'description': 'Password minimum length is less than 14 characters',
                'resource': 'Account Password Policy',
                'remediation': 'Update password policy to require at least 14 characters'
            }
            findings.append(finding)
    except Exception as e:
        if 'NoSuchEntity' in str(e):
            finding = {
                'severity': 'HIGH',
                'title': 'No password policy configured',
                'description': 'No IAM password policy is configured for this account',
                'resource': 'Account Password Policy',
                'remediation': 'Configure a strong password policy immediately'
            }
            findings.append(finding)
    
    # Check 3: Review root account usage
    try:
        # Get root account usage
        credential_report = iam.generate_credential_report()
        
        # Note: In production, you'd parse the credential report to check root usage
        # This is simplified for demonstration
        
    except Exception as e:
        print(f"Error checking root account usage: {str(e)}")
    
    # Check 4: Review Security Groups for overly permissive rules
    try:
        ec2 = boto3.client('ec2')
        security_groups = ec2.describe_security_groups()['SecurityGroups']
        
        for sg in security_groups:
            for rule in sg.get('IpPermissions', []):
                # Check for overly permissive rules (0.0.0.0/0)
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        if rule.get('FromPort') not in [80, 443]:  # HTTP/HTTPS are acceptable
                            finding = {
                                'severity': 'HIGH',
                                'title': f'Overly permissive security group rule in {sg["GroupId"]}',
                                'description': f'Security group {sg["GroupName"]} allows unrestricted access from 0.0.0.0/0 on port {rule.get("FromPort")}',
                                'resource': sg['GroupId'],
                                'remediation': 'Restrict the security group rule to specific IP ranges'
                            }
                            findings.append(finding)
    except Exception as e:
        print(f"Error checking security groups: {str(e)}")
    
    # Check 5: Review S3 bucket public access
    try:
        s3 = boto3.client('s3')
        buckets = s3.list_buckets()['Buckets']
        
        for bucket in buckets:
            bucket_name = bucket['Name']
            try:
                # Check bucket ACL
                acl = s3.get_bucket_acl(Bucket=bucket_name)
                for grant in acl['Grants']:
                    grantee = grant.get('Grantee', {})
                    if grantee.get('Type') == 'Group' and 'AllUsers' in grantee.get('URI', ''):
                        finding = {
                            'severity': 'HIGH',
                            'title': f'S3 bucket {bucket_name} has public access',
                            'description': f'S3 bucket {bucket_name} allows public access',
                            'resource': f'arn:aws:s3:::{bucket_name}',
                            'remediation': 'Remove public access from the S3 bucket'
                        }
                        findings.append(finding)
            except Exception as e:
                print(f"Error checking bucket {bucket_name}: {str(e)}")
    except Exception as e:
        print(f"Error checking S3 buckets: {str(e)}")
    
    # Send findings to Security Hub
    if findings and securityhub:
        try:
            # Format findings for Security Hub
            security_hub_findings = []
            for finding in findings:
                security_hub_findings.append({
                    'SchemaVersion': '2018-10-08',
                    'Id': f"{finding['resource']}/{datetime.now().isoformat()}",
                    'ProductArn': f'arn:aws:securityhub:{os.environ.get("AWS_REGION", "us-east-1")}:*:product/custom/security-automation',
                    'GeneratorId': 'security-automation-lambda',
                    'AwsAccountId': context.invoked_function_arn.split(':')[4],
                    'Types': ['Software and Configuration Checks'],
                    'CreatedAt': datetime.now().isoformat(),
                    'UpdatedAt': datetime.now().isoformat(),
                    'Severity': {
                        'Label': finding['severity']
                    },
                    'Title': finding['title'],
                    'Description': finding['description'],
                    'Resources': [
                        {
                            'Type': 'Other',
                            'Id': finding['resource']
                        }
                    ],
                    'Remediation': {
                        'Recommendation': {
                            'Text': finding['remediation']
                        }
                    }
                })
            
            # Batch import findings to Security Hub
            if security_hub_findings:
                response = securityhub.batch_import_findings(
                    Findings=security_hub_findings
                )
                print(f"Imported {response['SuccessCount']} findings to Security Hub")
        except Exception as e:
            print(f"Error sending findings to Security Hub: {str(e)}")
    
    # Summary notification
    if findings and sns_topic_arn:
        summary = f"Security Check Complete:\n"
        summary += f"Total findings: {len(findings)}\n"
        summary += f"High severity: {len([f for f in findings if f['severity'] == 'HIGH'])}\n"
        summary += f"Medium severity: {len([f for f in findings if f['severity'] == 'MEDIUM'])}\n"
        
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='Security Check Summary',
            Message=summary
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Security check completed',
            'findings_count': len(findings),
            'findings': findings
        })
    }
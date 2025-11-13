import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
ec2 = boto3.client('ec2')
s3 = boto3.client('s3')
sns = boto3.client('sns')
logs = boto3.client('logs')

# Environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
COMPLIANCE_REPORTS_BUCKET = os.environ.get('COMPLIANCE_REPORTS_BUCKET')

# Severity levels
SEVERITY_CRITICAL = 'CRITICAL'
SEVERITY_HIGH = 'HIGH'
SEVERITY_MEDIUM = 'MEDIUM'
SEVERITY_LOW = 'LOW'

def handler(event, context):
    """
    Main Lambda handler for compliance checking
    """
    print(f"Starting compliance check at {datetime.utcnow()}")
    
    findings = []
    
    # Check for unencrypted S3 buckets
    findings.extend(check_s3_encryption())
    
    # Check for unencrypted EBS volumes
    findings.extend(check_ebs_encryption())
    
    # Check for overly permissive security groups
    findings.extend(check_security_groups())
    
    # Check for missing VPC Flow Logs
    findings.extend(check_vpc_flow_logs())
    
    # Check CloudWatch log groups for KMS encryption
    findings.extend(check_cloudwatch_encryption())
    
    # Generate report
    report = generate_compliance_report(findings)
    
    # Publish to SNS
    if findings:
        publish_to_sns(report)
    
    # Store report in S3
    store_report_in_s3(report)
    
    print(f"Compliance check completed. Found {len(findings)} findings")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Compliance check completed',
            'findings_count': len(findings),
            'critical_count': len([f for f in findings if f['severity'] == SEVERITY_CRITICAL]),
            'high_count': len([f for f in findings if f['severity'] == SEVERITY_HIGH])
        })
    }

def check_s3_encryption() -> List[Dict[str, Any]]:
    """Check for unencrypted S3 buckets"""
    findings = []
    
    try:
        response = s3.list_buckets()
        
        for bucket in response.get('Buckets', []):
            bucket_name = bucket['Name']
            
            try:
                # Check encryption configuration
                encryption = s3.get_bucket_encryption(Bucket=bucket_name)
                
                # Check if default encryption is enabled
                rules = encryption.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
                if not rules:
                    findings.append({
                        'type': 'S3_BUCKET_UNENCRYPTED',
                        'severity': SEVERITY_HIGH,
                        'resource': bucket_name,
                        'message': f'S3 bucket {bucket_name} does not have default encryption enabled',
                        'recommendation': 'Enable default server-side encryption for the bucket'
                    })
                    
            except s3.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                findings.append({
                    'type': 'S3_BUCKET_UNENCRYPTED',
                    'severity': SEVERITY_HIGH,
                    'resource': bucket_name,
                    'message': f'S3 bucket {bucket_name} does not have encryption configured',
                    'recommendation': 'Configure server-side encryption for the bucket'
                })
            except Exception as e:
                print(f"Error checking bucket {bucket_name}: {str(e)}")
                
            # Check public access block
            try:
                public_access = s3.get_public_access_block(Bucket=bucket_name)
                config = public_access.get('PublicAccessBlockConfiguration', {})
                
                if not all([
                    config.get('BlockPublicAcls', False),
                    config.get('BlockPublicPolicy', False),
                    config.get('IgnorePublicAcls', False),
                    config.get('RestrictPublicBuckets', False)
                ]):
                    findings.append({
                        'type': 'S3_BUCKET_PUBLIC_ACCESS',
                        'severity': SEVERITY_CRITICAL,
                        'resource': bucket_name,
                        'message': f'S3 bucket {bucket_name} does not have all public access blocks enabled',
                        'recommendation': 'Enable all public access block settings'
                    })
            except s3.exceptions.NoSuchPublicAccessBlockConfiguration:
                findings.append({
                    'type': 'S3_BUCKET_PUBLIC_ACCESS',
                    'severity': SEVERITY_CRITICAL,
                    'resource': bucket_name,
                    'message': f'S3 bucket {bucket_name} has no public access block configuration',
                    'recommendation': 'Configure public access block settings'
                })
            except Exception as e:
                print(f"Error checking public access for bucket {bucket_name}: {str(e)}")
                
    except Exception as e:
        print(f"Error listing S3 buckets: {str(e)}")
        
    return findings

def check_ebs_encryption() -> List[Dict[str, Any]]:
    """Check for unencrypted EBS volumes"""
    findings = []
    
    try:
        response = ec2.describe_volumes()
        
        for volume in response.get('Volumes', []):
            volume_id = volume['VolumeId']
            
            if not volume.get('Encrypted', False):
                findings.append({
                    'type': 'EBS_VOLUME_UNENCRYPTED',
                    'severity': SEVERITY_HIGH,
                    'resource': volume_id,
                    'message': f'EBS volume {volume_id} is not encrypted',
                    'recommendation': 'Create an encrypted snapshot and restore to a new encrypted volume'
                })
                
    except Exception as e:
        print(f"Error checking EBS volumes: {str(e)}")
        
    return findings

def check_security_groups() -> List[Dict[str, Any]]:
    """Check for overly permissive security groups"""
    findings = []
    
    try:
        response = ec2.describe_security_groups()
        
        for sg in response.get('SecurityGroups', []):
            sg_id = sg['GroupId']
            sg_name = sg.get('GroupName', 'Unknown')
            
            # Check for overly permissive ingress rules
            for rule in sg.get('IpPermissions', []):
                # Check for 0.0.0.0/0 or ::/0
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        from_port = rule.get('FromPort', 'All')
                        to_port = rule.get('ToPort', 'All')
                        protocol = rule.get('IpProtocol', 'All')
                        
                        # Critical for sensitive ports
                        if from_port in [22, 3389, 3306, 5432, 1433, 27017, 6379]:
                            findings.append({
                                'type': 'SECURITY_GROUP_OVERLY_PERMISSIVE',
                                'severity': SEVERITY_CRITICAL,
                                'resource': f'{sg_id} ({sg_name})',
                                'message': f'Security group allows unrestricted access from 0.0.0.0/0 to port {from_port}',
                                'recommendation': 'Restrict access to specific IP addresses or CIDR blocks'
                            })
                        elif protocol == '-1':  # All traffic
                            findings.append({
                                'type': 'SECURITY_GROUP_OVERLY_PERMISSIVE',
                                'severity': SEVERITY_CRITICAL,
                                'resource': f'{sg_id} ({sg_name})',
                                'message': 'Security group allows all traffic from 0.0.0.0/0',
                                'recommendation': 'Restrict to specific ports and protocols'
                            })
                        else:
                            findings.append({
                                'type': 'SECURITY_GROUP_OVERLY_PERMISSIVE',
                                'severity': SEVERITY_MEDIUM,
                                'resource': f'{sg_id} ({sg_name})',
                                'message': f'Security group allows access from 0.0.0.0/0 to ports {from_port}-{to_port}',
                                'recommendation': 'Consider restricting access to specific IP ranges'
                            })
                            
    except Exception as e:
        print(f"Error checking security groups: {str(e)}")
        
    return findings

def check_vpc_flow_logs() -> List[Dict[str, Any]]:
    """Check for missing VPC Flow Logs"""
    findings = []
    
    try:
        # Get all VPCs
        vpcs_response = ec2.describe_vpcs()
        vpc_ids = [vpc['VpcId'] for vpc in vpcs_response.get('Vpcs', [])]
        
        # Get all flow logs
        flow_logs_response = ec2.describe_flow_logs()
        flow_log_vpc_ids = set()
        
        for flow_log in flow_logs_response.get('FlowLogs', []):
            resource_id = flow_log.get('ResourceId')
            if resource_id and resource_id.startswith('vpc-'):
                flow_log_vpc_ids.add(resource_id)
                
        # Check for VPCs without flow logs
        for vpc_id in vpc_ids:
            if vpc_id not in flow_log_vpc_ids:
                findings.append({
                    'type': 'VPC_MISSING_FLOW_LOGS',
                    'severity': SEVERITY_HIGH,
                    'resource': vpc_id,
                    'message': f'VPC {vpc_id} does not have Flow Logs enabled',
                    'recommendation': 'Enable VPC Flow Logs to capture network traffic metadata'
                })
                
    except Exception as e:
        print(f"Error checking VPC Flow Logs: {str(e)}")
        
    return findings

def check_cloudwatch_encryption() -> List[Dict[str, Any]]:
    """Check CloudWatch log groups for KMS encryption"""
    findings = []
    
    try:
        response = logs.describe_log_groups()
        
        for log_group in response.get('logGroups', []):
            log_group_name = log_group['logGroupName']
            
            if 'kmsKeyId' not in log_group:
                findings.append({
                    'type': 'CLOUDWATCH_LOGS_UNENCRYPTED',
                    'severity': SEVERITY_MEDIUM,
                    'resource': log_group_name,
                    'message': f'CloudWatch log group {log_group_name} is not encrypted with KMS',
                    'recommendation': 'Enable KMS encryption for the log group'
                })
                
            # Check retention policy
            if 'retentionInDays' not in log_group:
                findings.append({
                    'type': 'CLOUDWATCH_LOGS_NO_RETENTION',
                    'severity': SEVERITY_LOW,
                    'resource': log_group_name,
                    'message': f'CloudWatch log group {log_group_name} has no retention policy',
                    'recommendation': 'Set an appropriate retention policy to control costs and comply with data policies'
                })
                
    except Exception as e:
        print(f"Error checking CloudWatch log groups: {str(e)}")
        
    return findings

def generate_compliance_report(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a compliance report from findings"""
    
    timestamp = datetime.utcnow().isoformat()
    
    # Group findings by severity
    findings_by_severity = {
        SEVERITY_CRITICAL: [],
        SEVERITY_HIGH: [],
        SEVERITY_MEDIUM: [],
        SEVERITY_LOW: []
    }
    
    for finding in findings:
        severity = finding.get('severity', SEVERITY_LOW)
        findings_by_severity[severity].append(finding)
        
    report = {
        'timestamp': timestamp,
        'report_type': 'security_compliance',
        'summary': {
            'total_findings': len(findings),
            'critical': len(findings_by_severity[SEVERITY_CRITICAL]),
            'high': len(findings_by_severity[SEVERITY_HIGH]),
            'medium': len(findings_by_severity[SEVERITY_MEDIUM]),
            'low': len(findings_by_severity[SEVERITY_LOW])
        },
        'findings': findings,
        'findings_by_severity': findings_by_severity
    }
    
    return report

def publish_to_sns(report: Dict[str, Any]):
    """Publish compliance report summary to SNS"""
    
    if not SNS_TOPIC_ARN:
        print("SNS_TOPIC_ARN not configured, skipping notification")
        return
        
    try:
        summary = report['summary']
        
        # Create message
        subject = f"Security Compliance Report - {summary['total_findings']} findings"
        
        message = f"""
Security Compliance Report
Generated: {report['timestamp']}

Summary:
- Total Findings: {summary['total_findings']}
- Critical: {summary['critical']}
- High: {summary['high']}
- Medium: {summary['medium']}
- Low: {summary['low']}

Critical Findings:
"""
        
        # Add critical findings to message
        for finding in report['findings_by_severity'][SEVERITY_CRITICAL][:5]:
            message += f"\n- {finding['type']}: {finding['resource']}"
            message += f"\n  {finding['message']}\n"
            
        if summary['critical'] > 5:
            message += f"\n... and {summary['critical'] - 5} more critical findings\n"
            
        message += "\nFull report has been saved to S3."
        
        # Publish to SNS
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        
        print(f"Published to SNS: {response['MessageId']}")
        
    except Exception as e:
        print(f"Error publishing to SNS: {str(e)}")

def store_report_in_s3(report: Dict[str, Any]):
    """Store the full compliance report in S3"""
    
    if not COMPLIANCE_REPORTS_BUCKET:
        print("COMPLIANCE_REPORTS_BUCKET not configured, skipping S3 storage")
        return
        
    try:
        timestamp = datetime.utcnow()
        
        # Create S3 key with timestamp
        s3_key = f"compliance-reports/{timestamp.year}/{timestamp.month:02d}/{timestamp.day:02d}/report-{timestamp.strftime('%Y%m%d-%H%M%S')}.json"
        
        # Upload to S3
        response = s3.put_object(
            Bucket=COMPLIANCE_REPORTS_BUCKET,
            Key=s3_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )
        
        print(f"Stored report in S3: s3://{COMPLIANCE_REPORTS_BUCKET}/{s3_key}")
        
    except Exception as e:
        print(f"Error storing report in S3: {str(e)}")
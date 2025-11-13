# S3 Audit Reference

This document consolidates every asset currently in `lib/` for the S3 security audit effort. Each section embeds the complete file content with matching code fences so nothing is truncated.


## analyse.py
````python
#!/usr/bin/env python3
"""
AWS Resource Audit Script
Identifies unused and misconfigured resources in AWS environment.
"""

import json
import logging
import os
import sys
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from jinja2 import Template
import plotly.graph_objects as go
import plotly.io as pio


# Constants for S3 Security Audit
REGION = 'us-east-1'
AUDIT_AGE_DAYS = 60
LARGE_BUCKET_SIZE_GB = 100
HIGH_OBJECT_COUNT = 1_000_000

# Severity levels
CRITICAL = 'CRITICAL'
HIGH = 'HIGH'
MEDIUM = 'MEDIUM'
LOW = 'LOW'

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class Finding:
    """Represents a security finding for a bucket"""
    bucket_name: str
    bucket_arn: str
    issue_type: str
    severity: str
    compliance_frameworks: List[str]
    current_config: str
    required_config: str
    remediation_steps: str


class AWSResourceAuditor:
    """Audits AWS resources for optimization and security improvements."""
    
    def __init__(self, region_name: str = None):
        """
        Initialize AWS clients for resource auditing.
        
        Args:
            region_name: AWS region name (uses default if not specified)
        """
        self.region_name = region_name
        self.ec2_client = boto3.client('ec2', region_name=region_name)
        self.logs_client = boto3.client('logs', region_name=region_name)
        
    def find_unused_ebs_volumes(self) -> List[Dict[str, Any]]:
        """
        Find EBS volumes that are not attached to any EC2 instance.
        
        Returns:
            List of unused volumes with their details
        """
        unused_volumes = []
        
        try:
            # Describe all EBS volumes
            paginator = self.ec2_client.get_paginator('describe_volumes')
            
            for page in paginator.paginate():
                for volume in page['Volumes']:
                    # Check if volume is available (not attached)
                    if volume['State'] == 'available':
                        volume_info = {
                            'VolumeId': volume['VolumeId'],
                            'Size': volume['Size'],  # Size in GiB
                            'VolumeType': volume['VolumeType'],
                            'CreateTime': volume['CreateTime'].strftime('%Y-%m-%d %H:%M:%S'),
                            'AvailabilityZone': volume['AvailabilityZone'],
                            'Encrypted': volume.get('Encrypted', False),
                            'Tags': self._extract_tags(volume.get('Tags', []))
                        }
                        unused_volumes.append(volume_info)
                        
        except ClientError as e:
            print(f"Error retrieving EBS volumes: {e}")
            
        return unused_volumes
    
    def find_public_security_groups(self) -> List[Dict[str, Any]]:
        """
        Find security groups that allow unrestricted access from the internet.
        
        Returns:
            List of public security groups with their details
        """
        public_security_groups = []
        
        try:
            # Describe all security groups
            paginator = self.ec2_client.get_paginator('describe_security_groups')
            
            for page in paginator.paginate():
                for sg in page['SecurityGroups']:
                    public_rules = []
                    
                    # Check ingress rules for public access
                    for rule in sg.get('IpPermissions', []):
                        # Check for IPv4 public access
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                public_rules.append({
                                    'Protocol': rule.get('IpProtocol', 'All'),
                                    'FromPort': rule.get('FromPort', 'All'),
                                    'ToPort': rule.get('ToPort', 'All'),
                                    'Source': '0.0.0.0/0'
                                })
                        
                        # Check for IPv6 public access
                        for ipv6_range in rule.get('Ipv6Ranges', []):
                            if ipv6_range.get('CidrIpv6') == '::/0':
                                public_rules.append({
                                    'Protocol': rule.get('IpProtocol', 'All'),
                                    'FromPort': rule.get('FromPort', 'All'),
                                    'ToPort': rule.get('ToPort', 'All'),
                                    'Source': '::/0'
                                })
                    
                    # If security group has public rules, add it to the list
                    if public_rules:
                        sg_info = {
                            'GroupId': sg['GroupId'],
                            'GroupName': sg['GroupName'],
                            'Description': sg.get('Description', ''),
                            'VpcId': sg.get('VpcId', 'EC2-Classic'),
                            'PublicIngressRules': public_rules,
                            'Tags': self._extract_tags(sg.get('Tags', []))
                        }
                        public_security_groups.append(sg_info)
                        
        except ClientError as e:
            print(f"Error retrieving security groups: {e}")
            
        return public_security_groups
    
    def calculate_log_stream_metrics(self) -> Dict[str, Any]:
        """
        Calculate average CloudWatch log stream size across all log groups.
        
        Returns:
            Dictionary containing log stream metrics
        """
        total_size = 0
        total_streams = 0
        log_group_metrics = []
        
        try:
            # Describe all log groups
            log_groups_paginator = self.logs_client.get_paginator('describe_log_groups')
            
            for log_groups_page in log_groups_paginator.paginate():
                for log_group in log_groups_page['logGroups']:
                    group_size = 0
                    group_stream_count = 0
                    
                    # Get log streams for each log group
                    try:
                        streams_paginator = self.logs_client.get_paginator('describe_log_streams')
                        
                        for streams_page in streams_paginator.paginate(
                            logGroupName=log_group['logGroupName']
                        ):
                            for stream in streams_page['logStreams']:
                                # storedBytes represents the size of the log stream
                                stream_size = stream.get('storedBytes', 0)
                                group_size += stream_size
                                group_stream_count += 1
                                total_size += stream_size
                                total_streams += 1
                        
                        if group_stream_count > 0:
                            log_group_metrics.append({
                                'LogGroupName': log_group['logGroupName'],
                                'StreamCount': group_stream_count,
                                'TotalSize': group_size,
                                'AverageStreamSize': group_size / group_stream_count
                            })
                            
                    except ClientError as e:
                        print(f"Error retrieving streams for log group {log_group['logGroupName']}: {e}")
                        
        except ClientError as e:
            print(f"Error retrieving log groups: {e}")
        
        # Calculate overall average
        average_stream_size = total_size / total_streams if total_streams > 0 else 0
        
        return {
            'TotalLogStreams': total_streams,
            'TotalSize': total_size,
            'AverageStreamSize': average_stream_size,
            'LogGroupMetrics': log_group_metrics
        }
    
    def _extract_tags(self, tags: List[Dict]) -> Dict[str, str]:
        """
        Extract tags into a simple key-value dictionary.
        
        Args:
            tags: List of tag dictionaries from AWS
            
        Returns:
            Dictionary of tag key-value pairs
        """
        return {tag.get('Key', ''): tag.get('Value', '') for tag in tags}
    
    def audit_resources(self) -> Dict[str, Any]:
        """
        Perform complete audit of AWS resources.
        
        Returns:
            Dictionary containing all audit results
        """
        print("Starting AWS resource audit...")
        
        print("Finding unused EBS volumes...")
        unused_volumes = self.find_unused_ebs_volumes()
        
        print("Finding public security groups...")
        public_security_groups = self.find_public_security_groups()
        
        print("Calculating CloudWatch log stream metrics...")
        log_metrics = self.calculate_log_stream_metrics()
        
        # Compile results
        results = {
            'AuditTimestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Region': self.region_name or 'default',
            'UnusedEBSVolumes': {
                'Count': len(unused_volumes),
                'TotalSize': sum(vol['Size'] for vol in unused_volumes),
                'Volumes': unused_volumes
            },
            'PublicSecurityGroups': {
                'Count': len(public_security_groups),
                'SecurityGroups': public_security_groups
            },
            'CloudWatchLogMetrics': log_metrics
        }
        
        return results


class S3SecurityAuditor:
    """Main auditor class for S3 security analysis"""
    
    def __init__(self, region: str = REGION):
        self.region = region
        self.s3_client = boto3.client('s3', region_name=region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        self.findings: List[Finding] = []
        self.bucket_cache: Dict[str, Dict] = {}
        
    def run_audit(self) -> Tuple[List[Finding], Dict[str, Any]]:
        """Run the complete security audit"""
        logger.info(f"Starting S3 security audit in region {self.region}")
        
        # Get all buckets to audit
        buckets_to_audit = self._get_buckets_to_audit()
        logger.info(f"Found {len(buckets_to_audit)} buckets to audit")
        
        # Run all security checks
        for bucket in buckets_to_audit:
            bucket_name = bucket['Name']
            logger.info(f"Auditing bucket: {bucket_name}")
            
            # Cache bucket details for efficiency
            self._cache_bucket_details(bucket_name)
            
            # Run all checks
            self._check_public_access(bucket_name)
            self._check_encryption(bucket_name)
            self._check_versioning(bucket_name)
            self._check_logging(bucket_name)
            self._check_lifecycle_policies(bucket_name)
            self._check_replication(bucket_name)
            self._check_secure_transport(bucket_name)
            self._check_object_lock(bucket_name)
            self._check_mfa_delete(bucket_name)
            self._check_access_logging_destination(bucket_name)
            self._check_kms_encryption_for_vpc(bucket_name)
            self._check_glacier_transitions(bucket_name)
        
        # Generate compliance summary
        compliance_summary = self._generate_compliance_summary(buckets_to_audit)
        
        return self.findings, compliance_summary
    
    def _get_buckets_to_audit(self) -> List[Dict]:
        """Get list of buckets that meet audit criteria"""
        try:
            response = self.s3_client.list_buckets()
            all_buckets = response['Buckets']
        except Exception as e:
            logger.error(f"Failed to list buckets: {e}")
            return []
        
        buckets_to_audit = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=AUDIT_AGE_DAYS)
        
        for bucket in all_buckets:
            bucket_name = bucket['Name']
            
            # Skip buckets created less than 60 days ago
            if bucket['CreationDate'] > cutoff_date:
                logger.debug(f"Skipping new bucket: {bucket_name}")
                continue
            
            # Skip temp and test buckets
            if bucket_name.startswith('temp-') or bucket_name.startswith('test-'):
                logger.debug(f"Skipping temp/test bucket: {bucket_name}")
                continue
            
            # Check for ExcludeFromAudit tag
            try:
                tagging_response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
                tags = {tag['Key'].lower(): tag['Value'].lower() for tag in tagging_response.get('TagSet', [])}
                
                if tags.get('excludefromaudit', '').lower() == 'true':
                    logger.debug(f"Skipping excluded bucket: {bucket_name}")
                    continue
            except self.s3_client.exceptions.NoSuchTagSet:
                pass  # No tags, include in audit
            except Exception as e:
                logger.warning(f"Error checking tags for bucket {bucket_name}: {e}")
            
            buckets_to_audit.append(bucket)
        
        return buckets_to_audit
    
    def _cache_bucket_details(self, bucket_name: str):
        """Cache bucket details to avoid repeated API calls"""
        if bucket_name in self.bucket_cache:
            return
        
        cache = {'name': bucket_name}
        cache['arn'] = f"arn:aws:s3:::{bucket_name}"
        
        # Get tags
        try:
            tagging_response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
            cache['tags'] = {tag['Key']: tag['Value'] for tag in tagging_response.get('TagSet', [])}
        except:
            cache['tags'] = {}
        
        # Get bucket location
        try:
            location_response = self.s3_client.get_bucket_location(Bucket=bucket_name)
            cache['region'] = location_response.get('LocationConstraint', 'us-east-1')
        except:
            cache['region'] = 'us-east-1'
        
        self.bucket_cache[bucket_name] = cache
    
    def _check_public_access(self, bucket_name: str):
        """Check for public read/write access via ACL or policies"""
        try:
            # Check bucket ACL
            acl_response = self.s3_client.get_bucket_acl(Bucket=bucket_name)
            public_grants = []
            
            for grant in acl_response.get('Grants', []):
                grantee = grant.get('Grantee', {})
                if grantee.get('Type') == 'Group' and \
                   grantee.get('URI', '').endswith('AllUsers'):
                    public_grants.append(grant['Permission'])
            
            # Check bucket policy
            has_public_policy = False
            try:
                policy_response = self.s3_client.get_bucket_policy(Bucket=bucket_name)
                policy = json.loads(policy_response['Policy'])
                
                for statement in policy.get('Statement', []):
                    principal = statement.get('Principal', '')
                    if principal == '*' or (isinstance(principal, dict) and principal.get('AWS') == '*'):
                        has_public_policy = True
                        break
            except self.s3_client.exceptions.NoSuchBucketPolicy:
                pass
            
            if public_grants or has_public_policy:
                access_types = []
                if public_grants:
                    access_types.append(f"ACL grants: {', '.join(public_grants)}")
                if has_public_policy:
                    access_types.append("Policy allows Principal: '*'")
                
                self.findings.append(Finding(
                    bucket_name=bucket_name,
                    bucket_arn=self.bucket_cache[bucket_name]['arn'],
                    issue_type='PUBLIC_ACCESS',
                    severity=CRITICAL,
                    compliance_frameworks=['SOC2', 'GDPR'],
                    current_config=f"Bucket has public access: {'; '.join(access_types)}",
                    required_config="Bucket should not have public read or write access",
                    remediation_steps="1. Remove public ACL grants\n2. Update bucket policy to remove Principal: '*'\n3. Enable Block Public Access settings"
                ))
        except Exception as e:
            logger.error(f"Error checking public access for {bucket_name}: {e}")
    
    def _check_encryption(self, bucket_name: str):
        """Check for missing default encryption"""
        try:
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        except self.s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
            self.findings.append(Finding(
                bucket_name=bucket_name,
                bucket_arn=self.bucket_cache[bucket_name]['arn'],
                issue_type='NO_ENCRYPTION',
                severity=HIGH,
                compliance_frameworks=['SOC2', 'GDPR'],
                current_config="No default encryption configured",
                required_config="Default encryption should be enabled (SSE-S3, SSE-KMS, or SSE-C)",
                remediation_steps="1. Enable default encryption\n2. Use SSE-KMS for sensitive data\n3. Consider customer-managed KMS keys"
            ))
        except Exception as e:
            logger.error(f"Error checking encryption for {bucket_name}: {e}")
    
    def _check_versioning(self, bucket_name: str):
        """Check versioning for critical/confidential buckets"""
        tags = self.bucket_cache[bucket_name].get('tags', {})
        data_class = tags.get('DataClassification', '').lower()
        
        if data_class in ['critical', 'confidential']:
            try:
                versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                status = versioning_response.get('Status', 'Disabled')
                
                if status != 'Enabled':
                    self.findings.append(Finding(
                        bucket_name=bucket_name,
                        bucket_arn=self.bucket_cache[bucket_name]['arn'],
                        issue_type='NO_VERSIONING',
                        severity=HIGH,
                        compliance_frameworks=['SOC2', 'GDPR'],
                        current_config=f"Versioning is {status} for {data_class.capitalize()} data",
                        required_config="Versioning must be enabled for Critical/Confidential data",
                        remediation_steps="1. Enable bucket versioning\n2. Configure lifecycle rules for version management\n3. Consider MFA Delete for additional protection"
                    ))
            except Exception as e:
                logger.error(f"Error checking versioning for {bucket_name}: {e}")
    
    def _check_logging(self, bucket_name: str):
        """Check for missing server access logging"""
        try:
            logging_response = self.s3_client.get_bucket_logging(Bucket=bucket_name)
            
            if 'LoggingEnabled' not in logging_response:
                self.findings.append(Finding(
                    bucket_name=bucket_name,
                    bucket_arn=self.bucket_cache[bucket_name]['arn'],
                    issue_type='NO_LOGGING',
                    severity=MEDIUM,
                    compliance_frameworks=['SOC2', 'GDPR'],
                    current_config="Server access logging is disabled",
                    required_config="Server access logging should be enabled",
                    remediation_steps="1. Create a dedicated logging bucket\n2. Enable server access logging\n3. Configure log retention policies"
                ))
        except Exception as e:
            logger.error(f"Error checking logging for {bucket_name}: {e}")
    
    def _check_lifecycle_policies(self, bucket_name: str):
        """Check for lifecycle policies on large buckets"""
        try:
            # Get bucket size from CloudWatch
            metrics = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/S3',
                MetricName='BucketSizeBytes',
                Dimensions=[
                    {'Name': 'BucketName', 'Value': bucket_name},
                    {'Name': 'StorageType', 'Value': 'StandardStorage'}
                ],
                StartTime=datetime.now(timezone.utc) - timedelta(days=2),
                EndTime=datetime.now(timezone.utc),
                Period=86400,
                Statistics=['Average']
            )
            
            if metrics['Datapoints']:
                size_bytes = metrics['Datapoints'][0]['Average']
                size_gb = size_bytes / (1024 ** 3)
                
                if size_gb > LARGE_BUCKET_SIZE_GB:
                    # Check lifecycle configuration
                    try:
                        lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                    except self.s3_client.exceptions.NoSuchLifecycleConfiguration:
                        self.findings.append(Finding(
                            bucket_name=bucket_name,
                            bucket_arn=self.bucket_cache[bucket_name]['arn'],
                            issue_type='NO_LIFECYCLE',
                            severity=LOW,
                            compliance_frameworks=['SOC2', 'GDPR'],
                            current_config=f"Large bucket ({size_gb:.1f}GB) has no lifecycle policies",
                            required_config="Buckets >100GB should have lifecycle policies for cost optimization",
                            remediation_steps="1. Implement lifecycle rules for old objects\n2. Transition to Glacier for archival\n3. Delete obsolete data"
                        ))
        except Exception as e:
            logger.warning(f"Error checking lifecycle policies for {bucket_name}: {e}")
    
    def _check_replication(self, bucket_name: str):
        """Check replication for critical buckets"""
        tags = self.bucket_cache[bucket_name].get('tags', {})
        data_class = tags.get('DataClassification', '').lower()
        
        if data_class == 'critical':
            try:
                replication_response = self.s3_client.get_bucket_replication(Bucket=bucket_name)
            except self.s3_client.exceptions.ReplicationConfigurationNotFoundError:
                self.findings.append(Finding(
                    bucket_name=bucket_name,
                    bucket_arn=self.bucket_cache[bucket_name]['arn'],
                    issue_type='NO_REPLICATION',
                    severity=HIGH,
                    compliance_frameworks=['SOC2', 'GDPR'],
                    current_config="Critical bucket has no cross-region replication",
                    required_config="Critical buckets must have cross-region replication for DR",
                    remediation_steps="1. Enable versioning (required for replication)\n2. Create destination bucket in DR region\n3. Configure cross-region replication"
                ))
            except Exception as e:
                logger.error(f"Error checking replication for {bucket_name}: {e}")
    
    def _check_secure_transport(self, bucket_name: str):
        """Check if bucket policy enforces SSL/TLS"""
        try:
            policy_response = self.s3_client.get_bucket_policy(Bucket=bucket_name)
            policy = json.loads(policy_response['Policy'])
            
            has_secure_transport = False
            for statement in policy.get('Statement', []):
                conditions = statement.get('Condition', {})
                if 'Bool' in conditions and 'aws:SecureTransport' in conditions['Bool']:
                    has_secure_transport = True
                    break
            
            if not has_secure_transport:
                self.findings.append(Finding(
                    bucket_name=bucket_name,
                    bucket_arn=self.bucket_cache[bucket_name]['arn'],
                    issue_type='NO_SECURE_TRANSPORT',
                    severity=HIGH,
                    compliance_frameworks=['SOC2', 'GDPR'],
                    current_config="Bucket policy does not enforce SSL/TLS",
                    required_config="Bucket policy should deny requests without SSL/TLS",
                    remediation_steps="1. Update bucket policy to include aws:SecureTransport condition\n2. Deny all requests where aws:SecureTransport is false\n3. Test with HTTP requests to verify"
                ))
        except self.s3_client.exceptions.NoSuchBucketPolicy:
            self.findings.append(Finding(
                bucket_name=bucket_name,
                bucket_arn=self.bucket_cache[bucket_name]['arn'],
                issue_type='NO_SECURE_TRANSPORT',
                severity=HIGH,
                compliance_frameworks=['SOC2', 'GDPR'],
                current_config="No bucket policy to enforce SSL/TLS",
                required_config="Bucket policy should deny requests without SSL/TLS",
                remediation_steps="1. Create bucket policy with aws:SecureTransport condition\n2. Deny all requests where aws:SecureTransport is false\n3. Test with HTTP requests to verify"
            ))
        except Exception as e:
            logger.error(f"Error checking secure transport for {bucket_name}: {e}")
    
    def _check_object_lock(self, bucket_name: str):
        """Check object lock for compliance-required buckets"""
        tags = self.bucket_cache[bucket_name].get('tags', {})
        requires_compliance = tags.get('RequireCompliance', '').lower() == 'true'
        
        if requires_compliance:
            try:
                object_lock_response = self.s3_client.get_object_lock_configuration(Bucket=bucket_name)
                if object_lock_response.get('ObjectLockConfiguration', {}).get('ObjectLockEnabled') != 'Enabled':
                    raise Exception("Object lock not enabled")
            except:
                self.findings.append(Finding(
                    bucket_name=bucket_name,
                    bucket_arn=self.bucket_cache[bucket_name]['arn'],
                    issue_type='NO_OBJECT_LOCK',
                    severity=CRITICAL,
                    compliance_frameworks=['SOC2', 'GDPR'],
                    current_config="Compliance-required bucket has Object Lock disabled",
                    required_config="Object Lock must be enabled for compliance-required buckets",
                    remediation_steps="1. Object Lock must be enabled at bucket creation\n2. Create new bucket with Object Lock\n3. Migrate data to new bucket"
                ))
    
    def _check_mfa_delete(self, bucket_name: str):
        """Check MFA delete for versioned financial buckets"""
        tags = self.bucket_cache[bucket_name].get('tags', {})
        
        # Simple heuristic for financial records
        is_financial = any(keyword in bucket_name.lower() or keyword in str(tags).lower() 
                          for keyword in ['financial', 'finance', 'payment', 'billing', 'invoice'])
        
        if is_financial:
            try:
                versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                if versioning_response.get('Status') == 'Enabled' and \
                   versioning_response.get('MFADelete', 'Disabled') != 'Enabled':
                    self.findings.append(Finding(
                        bucket_name=bucket_name,
                        bucket_arn=self.bucket_cache[bucket_name]['arn'],
                        issue_type='NO_MFA_DELETE',
                        severity=HIGH,
                        compliance_frameworks=['SOC2', 'GDPR'],
                        current_config="Financial bucket lacks MFA Delete protection",
                        required_config="MFA Delete should be enabled for financial records",
                        remediation_steps="1. Enable MFA Delete on the bucket\n2. Configure MFA device for root account\n3. Update IAM policies to require MFA"
                    ))
            except Exception as e:
                logger.error(f"Error checking MFA delete for {bucket_name}: {e}")
    
    def _check_access_logging_destination(self, bucket_name: str):
        """Check if high-traffic buckets log to themselves"""
        try:
            # Get object count metric
            metrics = self.cloudwatch_client.get_metric_statistics(
                Namespace='AWS/S3',
                MetricName='NumberOfObjects',
                Dimensions=[
                    {'Name': 'BucketName', 'Value': bucket_name},
                    {'Name': 'StorageType', 'Value': 'AllStorageTypes'}
                ],
                StartTime=datetime.now(timezone.utc) - timedelta(days=2),
                EndTime=datetime.now(timezone.utc),
                Period=86400,
                Statistics=['Average']
            )
            
            if metrics['Datapoints'] and metrics['Datapoints'][0]['Average'] > HIGH_OBJECT_COUNT:
                # Check logging configuration
                logging_response = self.s3_client.get_bucket_logging(Bucket=bucket_name)
                logging_config = logging_response.get('LoggingEnabled', {})
                target_bucket = logging_config.get('TargetBucket', '')
                
                if target_bucket == bucket_name:
                    self.findings.append(Finding(
                        bucket_name=bucket_name,
                        bucket_arn=self.bucket_cache[bucket_name]['arn'],
                        issue_type='SELF_LOGGING',
                        severity=MEDIUM,
                        compliance_frameworks=['SOC2', 'GDPR'],
                        current_config="High-traffic bucket logs to itself",
                        required_config="Logs should be sent to a separate logging bucket",
                        remediation_steps="1. Create dedicated logging bucket\n2. Update logging configuration\n3. Set appropriate retention on log bucket"
                    ))
        except Exception as e:
            logger.warning(f"Error checking access logging destination for {bucket_name}: {e}")
    
    def _check_kms_encryption_for_vpc(self, bucket_name: str):
        """Check if VPC/sensitive buckets use KMS encryption"""
        tags = self.bucket_cache[bucket_name].get('tags', {})
        
        # Check if bucket is VPC-related or has sensitive data
        is_vpc_related = any(keyword in bucket_name.lower() or keyword in str(tags).lower() 
                           for keyword in ['vpc', 'private', 'internal', 'sensitive'])
        
        if is_vpc_related:
            try:
                encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption_response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
                
                uses_s3_only = False
                for rule in rules:
                    sse_config = rule.get('ApplyServerSideEncryptionByDefault', {})
                    if sse_config.get('SSEAlgorithm') == 'AES256':
                        uses_s3_only = True
                        break
                
                if uses_s3_only:
                    self.findings.append(Finding(
                        bucket_name=bucket_name,
                        bucket_arn=self.bucket_cache[bucket_name]['arn'],
                        issue_type='WEAK_ENCRYPTION',
                        severity=MEDIUM,
                        compliance_frameworks=['SOC2', 'GDPR'],
                        current_config="VPC/sensitive bucket uses SSE-S3 instead of SSE-KMS",
                        required_config="Should use customer-managed KMS keys for sensitive data",
                        remediation_steps="1. Create customer-managed KMS key\n2. Update bucket encryption to use SSE-KMS\n3. Re-encrypt existing objects"
                    ))
            except Exception as e:
                logger.warning(f"Error checking KMS encryption for bucket {bucket_name}: {e}")
    
    def _check_glacier_transitions(self, bucket_name: str):
        """Check if old objects are transitioning to cold storage"""
        try:
            # Check if bucket has old objects
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(Bucket=bucket_name, MaxKeys=100)
            
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
            has_old_objects = False
            
            for page in page_iterator:
                for obj in page.get('Contents', []):
                    if obj['LastModified'] < cutoff_date:
                        has_old_objects = True
                        break
                if has_old_objects:
                    break
            
            if has_old_objects:
                # Check lifecycle configuration
                try:
                    lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                    has_glacier_transition = False
                    
                    for rule in lifecycle_response.get('Rules', []):
                        transitions = rule.get('Transitions', [])
                        for transition in transitions:
                            if transition.get('StorageClass') in ['GLACIER', 'DEEP_ARCHIVE']:
                                has_glacier_transition = True
                                break
                    
                    if not has_glacier_transition:
                        self.findings.append(Finding(
                            bucket_name=bucket_name,
                            bucket_arn=self.bucket_cache[bucket_name]['arn'],
                            issue_type='NO_COLD_STORAGE',
                            severity=LOW,
                            compliance_frameworks=['SOC2', 'GDPR'],
                            current_config="Bucket has objects >90 days old not transitioning to cold storage",
                            required_config="Old objects should transition to Glacier/Deep Archive",
                            remediation_steps="1. Create lifecycle rule for objects >90 days\n2. Transition to Glacier or Deep Archive\n3. Consider Intelligent-Tiering"
                        ))
                except self.s3_client.exceptions.NoSuchLifecycleConfiguration:
                    self.findings.append(Finding(
                        bucket_name=bucket_name,
                        bucket_arn=self.bucket_cache[bucket_name]['arn'],
                        issue_type='NO_COLD_STORAGE',
                        severity=LOW,
                        compliance_frameworks=['SOC2', 'GDPR'],
                        current_config="Bucket has objects >90 days old with no lifecycle rules",
                        required_config="Old objects should transition to Glacier/Deep Archive",
                        remediation_steps="1. Create lifecycle rule for objects >90 days\n2. Transition to Glacier or Deep Archive\n3. Consider Intelligent-Tiering"
                    ))
        except Exception as e:
            logger.warning(f"Error checking glacier transitions for {bucket_name}: {e}")
    
    def _generate_compliance_summary(self, audited_buckets: List[Dict]) -> Dict[str, Any]:
        """Generate compliance summary statistics"""
        total_buckets = len(audited_buckets)
        
        # Get unique bucket names with findings
        non_compliant_buckets = set(finding.bucket_name for finding in self.findings)
        compliant_buckets = set(bucket['Name'] for bucket in audited_buckets) - non_compliant_buckets
        
        # Count by severity
        severity_counts = defaultdict(int)
        for finding in self.findings:
            severity_counts[finding.severity] += 1
        
        # Count by issue type
        issue_counts = defaultdict(int)
        for finding in self.findings:
            issue_counts[finding.issue_type] += 1
        
        # Framework-specific compliance (simplified - bucket is compliant if no findings)
        soc2_compliant = len(compliant_buckets)
        gdpr_compliant = len(compliant_buckets)
        
        return {
            'total_buckets_audited': total_buckets,
            'compliant_buckets': len(compliant_buckets),
            'non_compliant_buckets': len(non_compliant_buckets),
            'compliant_bucket_names': list(compliant_buckets),
            'non_compliant_bucket_names': list(non_compliant_buckets),
            'findings_by_severity': dict(severity_counts),
            'findings_by_issue_type': dict(issue_counts),
            'framework_compliance': {
                'SOC2': {
                    'compliant': soc2_compliant,
                    'non_compliant': total_buckets - soc2_compliant
                },
                'GDPR': {
                    'compliant': gdpr_compliant,
                    'non_compliant': total_buckets - gdpr_compliant
                }
            },
            'audit_timestamp': datetime.now(timezone.utc).isoformat(),
            'region': self.region
        }
    
    def print_findings(self):
        """Print findings to console grouped by severity"""
        if not self.findings:
            print("\n✅ No security issues found!")
            return
        
        # Group findings by severity
        findings_by_severity = defaultdict(list)
        for finding in self.findings:
            findings_by_severity[finding.severity].append(finding)
        
        # Print in order of severity
        for severity in [CRITICAL, HIGH, MEDIUM, LOW]:
            if severity in findings_by_severity:
                print(f"\n{'='*80}")
                print(f"{severity} SEVERITY FINDINGS ({len(findings_by_severity[severity])} issues)")
                print('='*80)
                
                for finding in findings_by_severity[severity]:
                    print(f"\nBucket: {finding.bucket_name}")
                    print(f"Issue: {finding.issue_type}")
                    print(f"Current: {finding.current_config}")
                    print(f"Required: {finding.required_config}")
                    print(f"Remediation:\n{finding.remediation_steps}")
                    print('-'*40)
    
    def save_json_report(self, filename: str = 's3_security_audit.json'):
        """Save detailed findings to JSON file"""
        findings_data = [asdict(finding) for finding in self.findings]
        _, summary = self.run_audit() if not hasattr(self, '_last_summary') else (None, self._last_summary)
        
        report = {
            'findings': findings_data,
            'compliance_summary': summary
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"JSON report saved to {filename}")
    
    def save_html_report(self, findings: List[Finding], summary: Dict[str, Any], 
                        filename: str = 's3_audit_report.html'):
        """Generate HTML report with charts"""
        # Create charts
        severity_chart = self._create_severity_chart(summary)
        compliance_chart = self._create_compliance_chart(summary)
        issue_type_chart = self._create_issue_type_chart(summary)
        
        # Render HTML template
        template = Template(HTML_TEMPLATE)
        html_content = template.render(
            findings=findings,
            summary=summary,
            severity_chart=severity_chart,
            compliance_chart=compliance_chart,
            issue_type_chart=issue_type_chart,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            region=self.region
        )
        
        with open(filename, 'w') as f:
            f.write(html_content)
        
        logger.info(f"HTML report saved to {filename}")
    
    def _create_severity_chart(self, summary: Dict[str, Any]) -> str:
        """Create severity distribution chart"""
        severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
        counts = [summary['findings_by_severity'].get(s, 0) for s in severities]
        colors = ['#d32f2f', '#f57c00', '#fbc02d', '#388e3c']
        
        fig = go.Figure(data=[go.Bar(
            x=severities,
            y=counts,
            marker_color=colors,
            text=counts,
            textposition='auto'
        )])
        
        fig.update_layout(
            title='Findings by Severity',
            xaxis_title='Severity Level',
            yaxis_title='Number of Findings',
            showlegend=False,
            height=400
        )
        
        return pio.to_html(fig, include_plotlyjs='cdn', div_id='severity-chart')
    
    def _create_compliance_chart(self, summary: Dict[str, Any]) -> str:
        """Create compliance status chart"""
        labels = ['Compliant', 'Non-Compliant']
        values = [summary['compliant_buckets'], summary['non_compliant_buckets']]
        colors = ['#4caf50', '#f44336']
        
        fig = go.Figure(data=[go.Pie(
            labels=labels,
            values=values,
            hole=0.4,
            marker=dict(colors=colors),
            textinfo='label+percent'
        )])
        
        fig.update_layout(
            title='Overall Compliance Status',
            height=400,
            annotations=[{
                'text': f"{summary['total_buckets_audited']}<br>Buckets",
                'showarrow': False,
                'font': {'size': 20}
            }]
        )
        
        return pio.to_html(fig, include_plotlyjs='cdn', div_id='compliance-chart')
    
    def _create_issue_type_chart(self, summary: Dict[str, Any]) -> str:
        """Create issue type distribution chart"""
        issue_types = list(summary['findings_by_issue_type'].keys())
        counts = list(summary['findings_by_issue_type'].values())
        
        fig = go.Figure(data=[go.Bar(
            x=counts,
            y=issue_types,
            orientation='h',
            marker_color='#1976d2',
            text=counts,
            textposition='auto'
        )])
        
        fig.update_layout(
            title='Findings by Issue Type',
            xaxis_title='Number of Findings',
            yaxis_title='Issue Type',
            height=max(400, len(issue_types) * 40),
            margin=dict(l=150)
        )
        
        return pio.to_html(fig, include_plotlyjs='cdn', div_id='issue-type-chart')


# HTML Template for S3 Security Audit Report
HTML_TEMPLATE = '''<!DOCTYPE html>
<html>
<head>
    <title>S3 Security Audit Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
            color: #333;
        }
        .summary-box {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .critical { color: #d32f2f; font-weight: bold; }
        .high { color: #f57c00; font-weight: bold; }
        .medium { color: #fbc02d; font-weight: bold; }
        .low { color: #388e3c; font-weight: bold; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #1976d2;
            color: white;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .chart-container {
            margin: 30px 0;
        }
        .finding-details {
            margin: 10px 0;
            padding: 10px;
            background-color: #fafafa;
            border-left: 4px solid #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>S3 Security and Compliance Audit Report</h1>
        <div class="summary-box">
            <h2>Executive Summary</h2>
            <p><strong>Audit Date:</strong> {{ timestamp }}</p>
            <p><strong>Region:</strong> {{ region }}</p>
            <p><strong>Total Buckets Audited:</strong> {{ summary.total_buckets_audited }}</p>
            <p><strong>Compliant Buckets:</strong> {{ summary.compliant_buckets }} {% if summary.total_buckets_audited > 0 %}({{ (summary.compliant_buckets / summary.total_buckets_audited * 100)|round(1) }}%){% endif %}</p>
            <p><strong>Non-Compliant Buckets:</strong> {{ summary.non_compliant_buckets }} {% if summary.total_buckets_audited > 0 %}({{ (summary.non_compliant_buckets / summary.total_buckets_audited * 100)|round(1) }}%){% endif %}</p>
        </div>

        <h2>Compliance Overview</h2>
        <div class="chart-container">
            {{ compliance_chart|safe }}
        </div>

        <h2>Findings by Severity</h2>
        <div class="chart-container">
            {{ severity_chart|safe }}
        </div>

        <h2>Findings by Issue Type</h2>
        <div class="chart-container">
            {{ issue_type_chart|safe }}
        </div>

        <h2>Detailed Findings</h2>
        <table>
            <thead>
                <tr>
                    <th>Bucket Name</th>
                    <th>Issue Type</th>
                    <th>Severity</th>
                    <th>Current Configuration</th>
                    <th>Required Configuration</th>
                </tr>
            </thead>
            <tbody>
                {% for finding in findings %}
                <tr>
                    <td>{{ finding.bucket_name }}</td>
                    <td>{{ finding.issue_type }}</td>
                    <td class="{{ finding.severity.lower() }}">{{ finding.severity }}</td>
                    <td>{{ finding.current_config }}</td>
                    <td>{{ finding.required_config }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>

        <h2>Framework Compliance</h2>
        <div class="summary-box">
            <h3>SOC2 Compliance</h3>
            <p><strong>Compliant:</strong> {{ summary.framework_compliance.SOC2.compliant }} buckets</p>
            <p><strong>Non-Compliant:</strong> {{ summary.framework_compliance.SOC2.non_compliant }} buckets</p>
            
            <h3>GDPR Compliance</h3>
            <p><strong>Compliant:</strong> {{ summary.framework_compliance.GDPR.compliant }} buckets</p>
            <p><strong>Non-Compliant:</strong> {{ summary.framework_compliance.GDPR.non_compliant }} buckets</p>
        </div>
    </div>
</body>
</html>'''

def run_s3_security_audit():
    """Run S3 security audit"""
    # Configure logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    try:
        auditor = S3SecurityAuditor()
        findings, summary = auditor.run_audit()
        
        # Cache summary for report generation
        auditor._last_summary = summary
        
        # Print findings to console
        auditor.print_findings()
        
        # Save JSON report
        auditor.save_json_report()
        
        # Save HTML report
        auditor.save_html_report(findings, summary)
        
        print(f"\n📊 Audit complete! Found {len(findings)} issues across {summary['total_buckets_audited']} buckets.")
        print(f"📄 Reports saved: s3_security_audit.json, s3_audit_report.html")
        
        # Exit with error code if critical findings
        if any(f.severity == CRITICAL for f in findings):
            return 1
        
    except Exception as e:
        logger.error(f"Fatal error during audit: {e}")
        return 2
    
    return 0


def main():
    """Main function to run audits based on command line arguments."""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 's3':
        # Run S3 security audit
        return run_s3_security_audit()
    else:
        # Run AWS resource audit (default)
        try:
            # Initialize auditor (uses default region from AWS config)
            auditor = AWSResourceAuditor()
            
            # Perform audit
            audit_results = auditor.audit_resources()
            
            # Output results in JSON format
            print("\nAudit Results:")
            print(json.dumps(audit_results, indent=2, default=str))
            
            # Optionally save to file
            with open('aws_audit_results.json', 'w') as f:
                json.dump(audit_results, f, indent=2, default=str)
            
            print("\nAudit complete. Results saved to aws_audit_results.json")
            
        except Exception as e:
            print(f"Error during audit: {e}")
            return 1
        
        return 0


if __name__ == "__main__":
    exit(main())
````


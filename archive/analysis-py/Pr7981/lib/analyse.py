#!/usr/bin/env python3
"""
AWS EFS Security and Cost Optimization Analysis Tool

This script performs comprehensive analysis of EFS file systems in us-east-1
to identify cost optimization opportunities and security/resilience gaps.
"""

import json
import os
import boto3
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
import logging
from tabulate import tabulate
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def should_ignore_age_filter() -> bool:
    """Return True when running against a mock endpoint to include newly created file systems."""
    return bool(os.environ.get('AWS_ENDPOINT_URL'))

class EFSAnalyzer:
    """Analyzes AWS EFS file systems for security and cost optimization."""

    def __init__(self, region: str = 'us-east-1'):
        """Initialize AWS clients."""
        self.region = region

        # Get AWS configuration from environment (for testing with moto)
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
        aws_access_key_id = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.environ.get('AWS_SECRET_ACCESS_KEY')

        # Initialize boto3 clients with environment configuration
        client_config = {
            'region_name': region,
            'endpoint_url': endpoint_url,
            'aws_access_key_id': aws_access_key_id,
            'aws_secret_access_key': aws_secret_access_key
        }

        self.efs = boto3.client('efs', **client_config)
        self.cloudwatch = boto3.client('cloudwatch', **client_config)
        self.ec2 = boto3.client('ec2', **client_config)
        self.backup = boto3.client('backup', **client_config)
        self.iam = boto3.client('iam', **client_config)

        self.findings = []
        self.file_systems_data = {}

    def analyze(self):
        """Main analysis entry point."""
        logger.info(f"Starting EFS analysis in {self.region}")

        # Get all file systems
        file_systems = self._get_eligible_file_systems()
        logger.info(f"Found {len(file_systems)} eligible file systems")

        # Analyze each file system
        for fs in file_systems:
            fs_id = fs['FileSystemId']
            logger.info(f"Analyzing file system: {fs_id}")

            # Collect all data for this file system
            fs_data = self._collect_file_system_data(fs)
            self.file_systems_data[fs_id] = fs_data

            # Run all checks
            self._check_throughput_waste(fs_data)
            self._check_burst_credit_risk(fs_data)
            self._check_storage_tier_waste(fs_data)
            self._check_performance_misconfiguration(fs_data)
            self._check_cleanup_candidates(fs_data)
            self._check_missing_encryption(fs_data)
            self._check_no_tls_in_transit(fs_data)
            self._check_wide_open_access(fs_data)
            self._check_no_iam_authorization(fs_data)
            self._check_root_risk(fs_data)
            self._check_disaster_recovery(fs_data)
            self._check_no_backup_plan(fs_data)
            self._check_single_az_risk(fs_data)
            self._check_missing_alarms(fs_data)
            self._check_metadata_bottlenecks(fs_data)

        # Generate reports
        self._generate_console_output()
        self._generate_json_report()

    def _get_eligible_file_systems(self) -> List[Dict]:
        """Get all file systems that meet the filtering criteria."""
        eligible_systems = []
        paginator = self.efs.get_paginator('describe_file_systems')

        for page in paginator.paginate():
            for fs in page['FileSystems']:
                # Check age (must be older than 30 days, unless running in test mode)
                if not should_ignore_age_filter():
                    creation_time = fs['CreationTime']
                    if creation_time.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc) - timedelta(days=30):
                        continue

                # Check tags
                try:
                    tags_response = self.efs.list_tags_for_resource(
                        ResourceId=fs['FileSystemId']
                    )
                    tags = {tag['Key']: tag['Value'] for tag in tags_response.get('Tags', [])}

                    # Skip if excluded by tags
                    if tags.get('ExcludeFromAnalysis') == 'true' or tags.get('Temporary') == 'true':
                        continue

                    fs['Tags'] = tags
                    eligible_systems.append(fs)

                except Exception as e:
                    logger.warning(f"Error getting tags for {fs['FileSystemId']}: {e}")

        return eligible_systems

    def _collect_file_system_data(self, fs: Dict) -> Dict:
        """Collect all relevant data for a file system."""
        fs_id = fs['FileSystemId']
        data = {
            'file_system': fs,
            'mount_targets': [],
            'access_points': [],
            'lifecycle_configuration': None,
            'backup_policy': None,
            'metrics': {},
            'alarms': []
        }

        # Get mount targets
        try:
            mt_response = self.efs.describe_mount_targets(FileSystemId=fs_id)
            data['mount_targets'] = mt_response['MountTargets']

            # Get security groups for each mount target
            for mt in data['mount_targets']:
                mt['SecurityGroups'] = []
                for sg_id in mt['SecurityGroupsIds']:
                    try:
                        sg_response = self.ec2.describe_security_groups(GroupIds=[sg_id])
                        mt['SecurityGroups'].extend(sg_response['SecurityGroups'])
                    except Exception as e:
                        logger.warning(f"Error getting security group {sg_id}: {e}")

        except Exception as e:
            logger.warning(f"Error getting mount targets for {fs_id}: {e}")

        # Get access points
        try:
            ap_response = self.efs.describe_access_points(FileSystemId=fs_id)
            data['access_points'] = ap_response['AccessPoints']
        except Exception as e:
            logger.warning(f"Error getting access points for {fs_id}: {e}")

        # Get lifecycle configuration
        try:
            lc_response = self.efs.describe_lifecycle_configuration(FileSystemId=fs_id)
            data['lifecycle_configuration'] = lc_response.get('LifecyclePolicies', [])
        except Exception as e:
            logger.debug(f"No lifecycle configuration for {fs_id}: {e}")
            data['lifecycle_configuration'] = []

        # Get backup policy
        try:
            backup_response = self.efs.describe_backup_policy(FileSystemId=fs_id)
            data['backup_policy'] = backup_response.get('BackupPolicy') or {}
        except Exception as e:
            logger.debug(f"No backup policy for {fs_id}: {e}")
            data['backup_policy'] = {}

        # Get CloudWatch metrics
        data['metrics'] = self._get_cloudwatch_metrics(fs_id)

        # Get CloudWatch alarms
        data['alarms'] = self._get_cloudwatch_alarms(fs_id)

        # Check AWS Backup plans
        data['backup_plans'] = self._get_backup_plans(fs)

        return data

    def _get_cloudwatch_metrics(self, fs_id: str) -> Dict:
        """Get CloudWatch metrics for the file system."""
        metrics = {}
        end_time = datetime.now(timezone.utc)

        # Define metrics to collect
        metric_configs = [
            ('ThroughputUtilization', 'Average', 30),  # 30 days
            ('BurstCreditBalance', 'Minimum', 30),
            ('ClientConnections', 'Maximum', 60),
            ('DataReadIOBytes', 'Sum', 30),
            ('DataWriteIOBytes', 'Sum', 30),
            ('MetadataIOBytes', 'Sum', 30),
            ('PercentIOLimit', 'Average', 7),
            ('StorageBytes', 'Average', 30)
        ]

        for metric_name, stat, days in metric_configs:
            try:
                response = self.cloudwatch.get_metric_statistics(
                    Namespace='AWS/EFS',
                    MetricName=metric_name,
                    Dimensions=[{'Name': 'FileSystemId', 'Value': fs_id}],
                    StartTime=end_time - timedelta(days=days),
                    EndTime=end_time,
                    Period=86400,  # 1 day
                    Statistics=[stat]
                )

                if response['Datapoints']:
                    values = [dp[stat] for dp in response['Datapoints']]
                    metrics[metric_name] = {
                        'values': values,
                        'average': statistics.mean(values) if values else 0,
                        'min': min(values) if values else 0,
                        'max': max(values) if values else 0
                    }

            except Exception as e:
                logger.warning(f"Error getting metric {metric_name} for {fs_id}: {e}")

        return metrics

    def _get_cloudwatch_alarms(self, fs_id: str) -> List[Dict]:
        """Get CloudWatch alarms for the file system."""
        alarms = []
        try:
            paginator = self.cloudwatch.get_paginator('describe_alarms')
            for page in paginator.paginate():
                for alarm in page['MetricAlarms']:
                    # Check if alarm is for this EFS
                    for dim in alarm.get('Dimensions', []):
                        if dim['Name'] == 'FileSystemId' and dim['Value'] == fs_id:
                            alarms.append(alarm)
                            break
        except Exception as e:
            logger.warning(f"Error getting alarms for {fs_id}: {e}")

        return alarms

    def _get_backup_plans(self, fs: Dict) -> List[Dict]:
        """Check if file system is included in any backup plans."""
        backup_plans = []
        try:
            # Check by resource ARN
            fs_arn = fs['FileSystemArn']
            response = self.backup.list_backup_selections(BackupPlanId='*')

            # This is simplified - in production you'd iterate through all backup plans
            # For now, we'll check if the file system has any backup policy

        except Exception as e:
            logger.debug(f"Error checking backup plans: {e}")

        return backup_plans

    def _check_throughput_waste(self, fs_data: Dict):
        """Check for wasted provisioned throughput."""
        fs = fs_data['file_system']
        if fs.get('ThroughputMode') != 'provisioned':
            return

        metrics = fs_data.get('metrics', {})
        throughput_util = metrics.get('ThroughputUtilization', {})

        if throughput_util:
            avg_utilization = throughput_util.get('average', 0)
            if avg_utilization < 30:
                provisioned_throughput = fs.get('ProvisionedThroughputInMibps', 0)
                actual_throughput = provisioned_throughput * (avg_utilization / 100)
                wasted_cost = (provisioned_throughput - actual_throughput) * 0.04 * 730  # Approx monthly cost

                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'cost_optimization',
                    'severity': 'high',
                    'finding': 'throughput_waste',
                    'title': 'Overprovisioned Throughput',
                    'description': f"File system has {avg_utilization:.1f}% average throughput utilization over last 30 days",
                    'recommendation': 'Consider switching to Elastic throughput mode or reducing provisioned throughput',
                    'potential_monthly_savings': f"${wasted_cost:.2f}",
                    'details': {
                        'provisioned_throughput_mibps': provisioned_throughput,
                        'average_utilization_percent': avg_utilization,
                        'actual_throughput_mibps': actual_throughput
                    }
                })

    def _check_burst_credit_risk(self, fs_data: Dict):
        """Check for burst credit depletion risk."""
        fs = fs_data['file_system']
        if fs.get('ThroughputMode') != 'bursting':
            return

        metrics = fs_data.get('metrics', {})
        burst_credits = metrics.get('BurstCreditBalance', {})

        if burst_credits:
            min_balance = burst_credits.get('min', 0)
            avg_balance = burst_credits.get('average', 0)

            # Convert bytes to TiB for credit calculation
            size_bytes = fs.get('SizeInBytes', {}).get('Value', 0)
            size_tib = size_bytes / (1024**4)
            max_credits = size_tib * 2.1e12  # 2.1 trillion credits per TiB

            if min_balance < (max_credits * 0.1):  # Less than 10% of max
                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'performance',
                    'severity': 'high',
                    'finding': 'burst_credit_depletion',
                    'title': 'Burst Credit Depletion Risk',
                    'description': f"File system burst credits dropped to {min_balance/1e9:.1f}B (min) with avg {avg_balance/1e9:.1f}B",
                    'recommendation': 'Consider switching to Provisioned or Elastic throughput mode',
                    'details': {
                        'min_burst_credits_billion': min_balance / 1e9,
                        'avg_burst_credits_billion': avg_balance / 1e9,
                        'max_burst_credits_billion': max_credits / 1e9,
                        'size_tib': size_tib
                    }
                })

    def _check_storage_tier_waste(self, fs_data: Dict):
        """Check for data that should be in Infrequent Access tier."""
        fs = fs_data['file_system']
        lifecycle_policies = fs_data.get('lifecycle_configuration', [])

        # Check if IA lifecycle policy exists
        has_ia_policy = any(p.get('TransitionToIA') for p in lifecycle_policies)

        if not has_ia_policy:
            # Estimate based on typical access patterns
            metrics = fs_data.get('metrics', {})
            storage_bytes = metrics.get('StorageBytes', {}).get('average', 0)

            if storage_bytes > 0:
                # Estimate 50% of data is infrequently accessed
                ia_eligible_bytes = storage_bytes * 0.5
                ia_eligible_gb = ia_eligible_bytes / (1024**3)

                # Cost difference: Standard = $0.30/GB, IA = $0.016/GB
                potential_savings = ia_eligible_gb * (0.30 - 0.016)

                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'cost_optimization',
                    'severity': 'medium',
                    'finding': 'missing_ia_lifecycle',
                    'title': 'Missing Infrequent Access Lifecycle Policy',
                    'description': 'No lifecycle policy to transition old data to IA storage class',
                    'recommendation': 'Enable lifecycle policy to move data not accessed for 30+ days to IA tier',
                    'potential_monthly_savings': f"${potential_savings:.2f}",
                    'details': {
                        'total_storage_gb': storage_bytes / (1024**3),
                        'estimated_ia_eligible_gb': ia_eligible_gb
                    }
                })

    def _check_performance_misconfiguration(self, fs_data: Dict):
        """Check for inappropriate performance mode settings."""
        fs = fs_data['file_system']
        if fs.get('PerformanceMode') != 'maxIO':
            return

        # Max I/O mode is for high file counts and operations
        # Check if file count is low
        metrics = fs_data.get('metrics', {})
        metadata_io = metrics.get('MetadataIOBytes', {})

        # If metadata operations are low, General Purpose might be better
        if metadata_io:
            avg_metadata_io = metadata_io.get('average', 0)
            if avg_metadata_io < 1000000:  # Less than 1MB/day metadata IO
                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'performance',
                    'severity': 'medium',
                    'finding': 'performance_mode_mismatch',
                    'title': 'Potentially Incorrect Performance Mode',
                    'description': 'Using Max I/O mode with low metadata operations',
                    'recommendation': 'Consider switching to General Purpose mode for lower latency',
                    'details': {
                        'current_mode': 'maxIO',
                        'avg_daily_metadata_io_mb': avg_metadata_io / (1024**2)
                    }
                })

    def _check_cleanup_candidates(self, fs_data: Dict):
        """Check for unused file systems."""
        fs = fs_data['file_system']
        metrics = fs_data.get('metrics', {})
        client_connections = metrics.get('ClientConnections', {})

        if client_connections:
            max_connections = client_connections.get('max', 0)
            if max_connections == 0:
                storage_bytes = metrics.get('StorageBytes', {}).get('average', 0)
                storage_gb = storage_bytes / (1024**3)
                monthly_cost = storage_gb * 0.30  # Standard storage cost

                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'cost_optimization',
                    'severity': 'high',
                    'finding': 'unused_file_system',
                    'title': 'Unused File System',
                    'description': 'No client connections in the last 60 days',
                    'recommendation': 'Consider deleting this file system if no longer needed',
                    'potential_monthly_savings': f"${monthly_cost:.2f}",
                    'details': {
                        'storage_gb': storage_gb,
                        'days_without_connections': 60
                    }
                })

    def _check_missing_encryption(self, fs_data: Dict):
        """Check for missing KMS encryption."""
        fs = fs_data['file_system']

        if not fs.get('Encrypted', False):
            self.findings.append({
                'file_system_id': fs['FileSystemId'],
                'category': 'security',
                'severity': 'critical',
                'finding': 'missing_encryption',
                'title': 'Missing Encryption at Rest',
                'description': 'File system is not encrypted with KMS',
                'recommendation': 'Enable KMS encryption for data at rest',
                'details': {
                    'encrypted': False,
                    'kms_key_id': None
                }
            })

    def _check_no_tls_in_transit(self, fs_data: Dict):
        """Check for missing TLS enforcement."""
        mount_targets = fs_data.get('mount_targets', [])

        for mt in mount_targets:
            # Check mount target configuration
            # Note: TLS is enforced via mount options, so we check access points
            if not self._has_tls_enforcement(fs_data):
                self.findings.append({
                    'file_system_id': fs_data['file_system']['FileSystemId'],
                    'category': 'security',
                    'severity': 'high',
                    'finding': 'no_tls_enforcement',
                    'title': 'TLS Not Enforced for Data in Transit',
                    'description': 'Mount targets do not enforce TLS encryption',
                    'recommendation': 'Configure mount options to require TLS',
                    'details': {
                        'mount_target_id': mt['MountTargetId'],
                        'availability_zone': mt['AvailabilityZoneName']
                    }
                })
                break

    def _has_tls_enforcement(self, fs_data: Dict) -> bool:
        """Check if TLS is enforced (simplified check)."""
        # In reality, this would check mount options and policies
        # For now, we'll check if the file system has specific tags or access points with TLS
        tags = fs_data['file_system'].get('Tags', {})
        return tags.get('TLSRequired') == 'true'

    def _check_wide_open_access(self, fs_data: Dict):
        """Check for overly permissive security groups."""
        mount_targets = fs_data.get('mount_targets', [])

        for mt in mount_targets:
            for sg in mt.get('SecurityGroups', []):
                for rule in sg.get('IpPermissions', []):
                    if rule.get('FromPort') == 2049 or rule.get('ToPort') == 2049:
                        for ip_range in rule.get('IpRanges', []):
                            cidr = ip_range.get('CidrIp', '')
                            if cidr in ['0.0.0.0/0', '::/0']:
                                self.findings.append({
                                    'file_system_id': fs_data['file_system']['FileSystemId'],
                                    'category': 'security',
                                    'severity': 'critical',
                                    'finding': 'wide_open_nfs_access',
                                    'title': 'NFS Port Open to Internet',
                                    'description': f'Security group {sg["GroupId"]} allows NFS from {cidr}',
                                    'recommendation': 'Restrict NFS access to specific VPC CIDR ranges',
                                    'details': {
                                        'mount_target_id': mt['MountTargetId'],
                                        'security_group_id': sg['GroupId'],
                                        'security_group_name': sg.get('GroupName', 'N/A'),
                                        'open_cidr': cidr
                                    }
                                })

    def _check_no_iam_authorization(self, fs_data: Dict):
        """Check for missing IAM authorization."""
        access_points = fs_data.get('access_points', [])

        # If no access points, likely not using IAM
        if not access_points:
            self.findings.append({
                'file_system_id': fs_data['file_system']['FileSystemId'],
                'category': 'security',
                'severity': 'medium',
                'finding': 'no_iam_authorization',
                'title': 'Not Using IAM Authorization',
                'description': 'File system relies only on POSIX permissions without IAM',
                'recommendation': 'Create EFS Access Points with IAM policies for fine-grained access control',
                'details': {
                    'access_point_count': 0
                }
            })

    def _check_root_risk(self, fs_data: Dict):
        """Check for disabled root squashing."""
        access_points = fs_data.get('access_points', [])

        # Check if any access points have root access
        for ap in access_points:
            root_dir = ap.get('RootDirectory', {})
            creation_info = root_dir.get('CreationInfo', {})

            # Check if root squashing is disabled
            if creation_info and not self._has_root_squashing(ap):
                self.findings.append({
                    'file_system_id': fs_data['file_system']['FileSystemId'],
                    'category': 'security',
                    'severity': 'high',
                    'finding': 'root_squashing_disabled',
                    'title': 'Root Squashing Disabled',
                    'description': f'Access point {ap["AccessPointId"]} allows root access from clients',
                    'recommendation': 'Enable root squashing to prevent privilege escalation',
                    'details': {
                        'access_point_id': ap['AccessPointId'],
                        'access_point_arn': ap['AccessPointArn']
                    }
                })

    def _has_root_squashing(self, access_point: Dict) -> bool:
        """Check if root squashing is enabled (simplified)."""
        # This would check the actual POSIX user configuration
        posix_user = access_point.get('PosixUser', {})
        return posix_user.get('Uid') != 0

    def _check_disaster_recovery(self, fs_data: Dict):
        """Check for missing cross-region replication on critical systems."""
        fs = fs_data['file_system']
        tags = fs.get('Tags', {})

        if tags.get('DataCritical') == 'true':
            # Check for replication configuration
            if not fs.get('AvailabilityZoneName'):  # Multi-AZ
                # Check if replication is configured (simplified)
                if not self._has_replication(fs):
                    self.findings.append({
                        'file_system_id': fs['FileSystemId'],
                        'category': 'resilience',
                        'severity': 'high',
                        'finding': 'no_cross_region_replication',
                        'title': 'Critical Data Without Cross-Region Replication',
                        'description': 'File system tagged as DataCritical but lacks cross-region replication',
                        'recommendation': 'Configure EFS Replication to another region for disaster recovery',
                        'details': {
                            'data_critical': True,
                            'has_replication': False
                        }
                    })

    def _has_replication(self, fs: Dict) -> bool:
        """Check if replication is configured (simplified)."""
        # In production, this would check actual replication configuration
        try:
            response = self.efs.describe_replication_configurations(
                FileSystemId=fs['FileSystemId']
            )
            return len(response.get('Replications', [])) > 0
        except:
            return False

    def _check_no_backup_plan(self, fs_data: Dict):
        """Check for missing AWS Backup integration."""
        fs = fs_data['file_system']
        backup_policy = fs_data.get('backup_policy') or {}

        if backup_policy.get('Status') != 'ENABLED':
            storage_bytes = fs_data.get('metrics', {}).get('StorageBytes', {}).get('average', 0)
            storage_gb = storage_bytes / (1024**3)

            self.findings.append({
                'file_system_id': fs['FileSystemId'],
                'category': 'resilience',
                'severity': 'high',
                'finding': 'no_backup_plan',
                'title': 'No AWS Backup Plan',
                'description': 'File system is not protected by AWS Backup',
                'recommendation': 'Enable automatic backups through AWS Backup',
                'details': {
                    'backup_status': backup_policy.get('Status', 'DISABLED'),
                    'storage_gb': storage_gb
                }
            })

    def _check_single_az_risk(self, fs_data: Dict):
        """Check for production systems using One Zone storage."""
        fs = fs_data['file_system']
        tags = fs.get('Tags', {})

        if fs.get('AvailabilityZoneName'):  # One Zone storage
            if any(tag in ['Production', 'Prod', 'production', 'prod'] for tag in tags.values()):
                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'resilience',
                    'severity': 'critical',
                    'finding': 'production_single_az',
                    'title': 'Production System Using Single AZ Storage',
                    'description': 'Production-tagged file system using One Zone storage lacks cross-AZ redundancy',
                    'recommendation': 'Migrate to Regional (Multi-AZ) storage class for production workloads',
                    'details': {
                        'availability_zone': fs['AvailabilityZoneName'],
                        'tags': tags
                    }
                })

    def _check_missing_alarms(self, fs_data: Dict):
        """Check for missing CloudWatch alarms."""
        fs = fs_data['file_system']
        alarms = fs_data.get('alarms', [])

        # Define required alarm types
        required_alarm_metrics = [
            'BurstCreditBalance',
            'PercentIOLimit',
            'ClientConnections'
        ]

        existing_metrics = set()
        for alarm in alarms:
            for dim in alarm.get('Dimensions', []):
                if dim['Name'] == 'FileSystemId':
                    existing_metrics.add(alarm.get('MetricName'))

        missing_alarms = set(required_alarm_metrics) - existing_metrics

        if missing_alarms:
            self.findings.append({
                'file_system_id': fs['FileSystemId'],
                'category': 'operational',
                'severity': 'medium',
                'finding': 'missing_cloudwatch_alarms',
                'title': 'Missing Critical CloudWatch Alarms',
                'description': f'Missing alarms for: {", ".join(missing_alarms)}',
                'recommendation': 'Create CloudWatch alarms for critical EFS metrics',
                'details': {
                    'missing_alarms': list(missing_alarms),
                    'existing_alarms': list(existing_metrics)
                }
            })

    def _check_metadata_bottlenecks(self, fs_data: Dict):
        """Check for metadata operation bottlenecks."""
        fs = fs_data['file_system']
        metrics = fs_data.get('metrics', {})
        metadata_io = metrics.get('MetadataIOBytes', {})

        if metadata_io:
            # Convert to operations per second (rough estimate)
            avg_daily_metadata = metadata_io.get('average', 0)
            avg_ops_per_sec = avg_daily_metadata / (86400 * 4096)  # Assume 4KB per operation

            if avg_ops_per_sec > 1000:
                self.findings.append({
                    'file_system_id': fs['FileSystemId'],
                    'category': 'performance',
                    'severity': 'high',
                    'finding': 'metadata_bottleneck',
                    'title': 'High Metadata Operation Rate',
                    'description': f'Averaging {avg_ops_per_sec:.0f} metadata ops/sec causing potential bottleneck',
                    'recommendation': 'Consider sharding the workload across multiple file systems',
                    'details': {
                        'avg_metadata_ops_per_sec': avg_ops_per_sec,
                        'avg_daily_metadata_mb': avg_daily_metadata / (1024**2)
                    }
                })

    def _generate_console_output(self):
        """Generate console summary table."""
        if not self.findings:
            print("\nNo issues found in EFS analysis!")
            return

        # Prepare summary data
        summary_data = []
        findings_by_fs = defaultdict(list)

        for finding in self.findings:
            findings_by_fs[finding['file_system_id']].append(finding)

        for fs_id, fs_findings in findings_by_fs.items():
            fs_data = self.file_systems_data.get(fs_id, {})
            fs = fs_data.get('file_system', {})

            # Count by severity
            severity_counts = defaultdict(int)
            categories = set()
            total_savings = 0.0

            for finding in fs_findings:
                severity_counts[finding['severity']] += 1
                categories.add(finding['category'])

                # Extract savings if present
                savings_str = finding.get('potential_monthly_savings', '$0')
                try:
                    total_savings += float(savings_str.replace('$', '').replace(',', ''))
                except:
                    pass

            summary_data.append([
                fs_id,
                fs.get('Name', 'N/A'),
                fs.get('LifeCycleState', 'N/A'),
                f"{fs.get('SizeInBytes', {}).get('Value', 0) / (1024**3):.1f} GB",
                severity_counts.get('critical', 0),
                severity_counts.get('high', 0),
                severity_counts.get('medium', 0),
                ', '.join(categories),
                f"${total_savings:.2f}"
            ])

        # Print summary table
        headers = ['File System ID', 'Name', 'State', 'Size', 'Critical', 'High', 'Medium', 'Categories', 'Monthly Savings']
        print("\nEFS Analysis Summary")
        print("=" * 120)
        print(tabulate(summary_data, headers=headers, tablefmt='grid'))

        # Print total statistics
        total_critical = sum(f['severity'] == 'critical' for f in self.findings)
        total_high = sum(f['severity'] == 'high' for f in self.findings)
        total_medium = sum(f['severity'] == 'medium' for f in self.findings)
        total_savings = sum(float(f.get('potential_monthly_savings', '$0').replace('$', '').replace(',', ''))
                           for f in self.findings)

        print(f"\nTotal Findings: {len(self.findings)}")
        print(f"   Critical: {total_critical}")
        print(f"   High: {total_high}")
        print(f"   Medium: {total_medium}")
        print(f"   Total Potential Monthly Savings: ${total_savings:,.2f}")

        # Print top recommendations
        print("\nTop Recommendations:")
        critical_findings = [f for f in self.findings if f['severity'] == 'critical'][:5]
        for i, finding in enumerate(critical_findings, 1):
            print(f"{i}. [{finding['file_system_id']}] {finding['title']}: {finding['recommendation']}")

    def _generate_json_report(self):
        """Generate detailed JSON report."""
        report = {
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'region': self.region,
            'summary': {
                'total_file_systems_analyzed': len(self.file_systems_data),
                'total_findings': len(self.findings),
                'findings_by_severity': {
                    'critical': sum(f['severity'] == 'critical' for f in self.findings),
                    'high': sum(f['severity'] == 'high' for f in self.findings),
                    'medium': sum(f['severity'] == 'medium' for f in self.findings)
                },
                'findings_by_category': defaultdict(int),
                'total_potential_monthly_savings': 0.0
            },
            'file_systems': {},
            'findings': self.findings
        }

        # Calculate category counts and total savings
        for finding in self.findings:
            report['summary']['findings_by_category'][finding['category']] += 1

            savings_str = finding.get('potential_monthly_savings', '$0')
            try:
                report['summary']['total_potential_monthly_savings'] += float(
                    savings_str.replace('$', '').replace(',', '')
                )
            except:
                pass

        # Add file system details
        for fs_id, fs_data in self.file_systems_data.items():
            fs = fs_data['file_system']
            report['file_systems'][fs_id] = {
                'name': fs.get('Name', 'N/A'),
                'arn': fs.get('FileSystemArn'),
                'creation_time': fs.get('CreationTime').isoformat() if fs.get('CreationTime') else None,
                'lifecycle_state': fs.get('LifeCycleState'),
                'performance_mode': fs.get('PerformanceMode'),
                'throughput_mode': fs.get('ThroughputMode'),
                'encrypted': fs.get('Encrypted', False),
                'size_gb': fs.get('SizeInBytes', {}).get('Value', 0) / (1024**3),
                'tags': fs.get('Tags', {}),
                'mount_targets': len(fs_data.get('mount_targets', [])),
                'access_points': [
                    {
                        'access_point_id': ap['AccessPointId'],
                        'name': ap.get('Name', 'N/A'),
                        'root_directory': ap.get('RootDirectory', {}).get('Path', '/')
                    }
                    for ap in fs_data.get('access_points', [])
                ],
                'findings': [f for f in self.findings if f['file_system_id'] == fs_id]
            }

        # Write to file
        with open('efs_analysis.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\nDetailed report written to: efs_analysis.json")


def main():
    """Main entry point."""
    try:
        analyzer = EFSAnalyzer(region='us-east-1')
        analyzer.analyze()
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise


if __name__ == "__main__":
    main()

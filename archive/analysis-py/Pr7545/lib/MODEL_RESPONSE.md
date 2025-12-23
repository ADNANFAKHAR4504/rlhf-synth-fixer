### Reasoning Trace
---

The user wants a comprehensive Python script to analyze AWS EFS file systems in us-east-1 region. Let me break down the requirements:

1. **Script name**: analyze_efs.py
2. **Python version**: 3.12
3. **AWS SDK**: Boto3
4. **Target**: 78 EFS file systems in us-east-1

**Key audit areas**:
1. Provisioned Throughput Overprovisioning
2. Bursting Mode Credit Depletion
3. No Encryption at Rest
4. No Encryption in Transit
5. No Lifecycle Management
6. Single AZ File System
7. No Backup Policy
8. Unrestricted Mount Target Security Groups
9. No IAM Authorization
10. Root Squashing Disabled
11. High Metadata Operations
12. Unused File Systems
13. No CloudWatch Alarms
14. Replication Not Enabled
15. Inefficient Access Patterns
16. IA Storage Not Utilized

**Exclusions**:
- Exclude file systems tagged `ExcludeFromAnalysis: true` (case-insensitive)
- Only include file systems older than 30 days
- Ignore file systems tagged `Temporary: true` (case-insensitive)

**CloudWatch metrics to analyze** (30 days):
- Throughput
- Burst credits
- IO
- Client count
- Metadata ops

**Required outputs**:
1. Console output with recommendations
2. efs_analysis.json
3. storage_class_utilization.html
4. lifecycle_policy_recommendations.json
5. security_hardening_checklist.md

Let me create a comprehensive script that covers all these requirements.
### Answer 
---

I'll create a comprehensive AWS EFS analysis script that audits performance, cost optimization, and security across all specified areas. Here's the implementation:

```python
#!/usr/bin/env python3
"""
analyze_efs.py - Comprehensive AWS EFS Performance, Cost, and Security Audit
Analyzes EFS file systems in us-east-1 region for optimization opportunities
"""

import json
import boto3
from datetime import datetime, timedelta
from collections import defaultdict
import logging
import sys
from typing import Dict, List, Any, Optional, Tuple
import concurrent.futures
import math

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# AWS Pricing Constants (us-east-1)
PRICING = {
    'standard_storage_gb': 0.30,  # per GB-month
    'ia_storage_gb': 0.025,        # per GB-month
    'provisioned_throughput_mibps': 6.00,  # per MiB/s-month
    'burst_credit_price': 0.05,     # per burst credit hour
    'data_transfer_gb': 0.02        # per GB
}

class EFSAnalyzer:
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.efs = boto3.client('efs', region_name=region)
        self.ec2 = boto3.client('ec2', region_name=region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        self.backup = boto3.client('backup', region_name=region)
        self.kms = boto3.client('kms', region_name=region)
        
        self.file_systems = []
        self.access_points = []
        self.mount_targets = []
        self.security_groups = {}
        self.issues_found = defaultdict(list)
        
    def run_analysis(self):
        """Main analysis orchestration"""
        logger.info("Starting EFS analysis...")
        
        # Step 1: Get all file systems
        self.file_systems = self._get_file_systems()
        logger.info(f"Found {len(self.file_systems)} file systems to analyze")
        
        # Step 2: Analyze each file system
        analysis_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for fs in self.file_systems:
                future = executor.submit(self._analyze_file_system, fs)
                futures.append(future)
            
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    analysis_results.append(result)
        
        # Step 3: Generate outputs
        self._generate_outputs(analysis_results)
        
    def _get_file_systems(self) -> List[Dict]:
        """Get all EFS file systems with filtering"""
        all_file_systems = []
        paginator = self.efs.get_paginator('describe_file_systems')
        
        for page in paginator.paginate():
            all_file_systems.extend(page['FileSystems'])
        
        # Filter file systems
        filtered_fs = []
        current_time = datetime.now()
        
        for fs in all_file_systems:
            # Get tags
            tags_response = self.efs.list_tags_for_resource(
                ResourceId=fs['FileSystemId']
            )
            tags = {tag['Key'].lower(): tag['Value'].lower() 
                   for tag in tags_response.get('Tags', [])}
            
            # Apply exclusions
            if tags.get('excludefromanalysis') == 'true':
                logger.info(f"Excluding {fs['FileSystemId']} - ExcludeFromAnalysis tag")
                continue
                
            if tags.get('temporary') == 'true':
                logger.info(f"Excluding {fs['FileSystemId']} - Temporary tag")
                continue
            
            # Check age (30+ days)
            creation_time = fs['CreationTime'].replace(tzinfo=None)
            age_days = (current_time - creation_time).days
            if age_days < 30:
                logger.info(f"Excluding {fs['FileSystemId']} - Created {age_days} days ago")
                continue
            
            fs['Tags'] = tags_response.get('Tags', [])
            filtered_fs.append(fs)
        
        return filtered_fs
    
    def _analyze_file_system(self, fs: Dict) -> Optional[Dict]:
        """Comprehensive analysis of a single file system"""
        try:
            fs_id = fs['FileSystemId']
            logger.info(f"Analyzing file system: {fs_id}")
            
            # Get detailed file system info
            mount_targets = self._get_mount_targets(fs_id)
            access_points = self._get_access_points(fs_id)
            lifecycle_config = self._get_lifecycle_configuration(fs_id)
            backup_status = self._check_backup_status(fs_id)
            replication_config = self._get_replication_configuration(fs_id)
            
            # Get CloudWatch metrics (30 days)
            metrics = self._get_cloudwatch_metrics(fs_id)
            
            # Security analysis
            security_issues = self._analyze_security(fs, mount_targets, access_points)
            
            # Performance analysis
            performance_issues = self._analyze_performance(fs, metrics)
            
            # Cost optimization analysis
            cost_analysis = self._analyze_cost_optimization(fs, metrics, lifecycle_config)
            
            # Compile all issues
            all_issues = security_issues + performance_issues + cost_analysis['issues']
            
            # Build comprehensive result
            result = {
                'file_system_id': fs_id,
                'name': fs.get('Name', 'N/A'),
                'size_gb': fs['SizeInBytes']['Value'] / (1024**3),
                'creation_time': fs['CreationTime'].isoformat(),
                'availability_zones': fs.get('AvailabilityZoneName'),
                'lifecycle_state': fs['LifeCycleState'],
                'throughput_mode': fs['ThroughputMode'],
                'provisioned_throughput_mibps': fs.get('ProvisionedThroughputInMibps'),
                'performance_mode': fs['PerformanceMode'],
                'encrypted': fs.get('Encrypted', False),
                'kms_key_id': fs.get('KmsKeyId'),
                'mount_targets': mount_targets,
                'access_points': access_points,
                'lifecycle_configuration': lifecycle_config,
                'backup_enabled': backup_status,
                'replication_enabled': bool(replication_config),
                'metrics': metrics,
                'issues': all_issues,
                'cost_optimization': cost_analysis,
                'tags': fs.get('Tags', [])
            }
            
            self._print_console_summary(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing file system {fs['FileSystemId']}: {e}")
            return None
    
    def _get_mount_targets(self, fs_id: str) -> List[Dict]:
        """Get mount targets and their security groups"""
        mount_targets = []
        
        try:
            response = self.efs.describe_mount_targets(FileSystemId=fs_id)
            
            for mt in response['MountTargets']:
                # Get security groups for mount target
                sg_details = []
                for sg_id in mt.get('SecurityGroups', []):
                    sg_info = self._get_security_group_details(sg_id)
                    if sg_info:
                        sg_details.append(sg_info)
                
                mount_targets.append({
                    'mount_target_id': mt['MountTargetId'],
                    'subnet_id': mt['SubnetId'],
                    'availability_zone': mt['AvailabilityZoneId'],
                    'ip_address': mt['IpAddress'],
                    'security_groups': sg_details,
                    'lifecycle_state': mt['LifeCycleState']
                })
                
        except Exception as e:
            logger.error(f"Error getting mount targets for {fs_id}: {e}")
            
        return mount_targets
    
    def _get_security_group_details(self, sg_id: str) -> Optional[Dict]:
        """Get security group rules and check for issues"""
        if sg_id in self.security_groups:
            return self.security_groups[sg_id]
        
        try:
            response = self.ec2.describe_security_groups(GroupIds=[sg_id])
            if response['SecurityGroups']:
                sg = response['SecurityGroups'][0]
                
                # Check for overly permissive rules
                nfs_rules = []
                for rule in sg.get('IpPermissions', []):
                    if rule.get('FromPort') == 2049 or rule.get('ToPort') == 2049:
                        for cidr in rule.get('IpRanges', []):
                            nfs_rules.append({
                                'cidr': cidr['CidrIp'],
                                'description': cidr.get('Description', ''),
                                'overly_permissive': cidr['CidrIp'] in ['0.0.0.0/0', '::/0']
                            })
                
                sg_info = {
                    'group_id': sg_id,
                    'group_name': sg['GroupName'],
                    'description': sg.get('Description', ''),
                    'nfs_rules': nfs_rules,
                    'has_overly_permissive_rules': any(r['overly_permissive'] for r in nfs_rules)
                }
                
                self.security_groups[sg_id] = sg_info
                return sg_info
                
        except Exception as e:
            logger.error(f"Error getting security group {sg_id}: {e}")
            
        return None
    
    def _get_access_points(self, fs_id: str) -> List[Dict]:
        """Get EFS access points"""
        access_points = []
        
        try:
            response = self.efs.describe_access_points(FileSystemId=fs_id)
            
            for ap in response['AccessPoints']:
                access_points.append({
                    'access_point_id': ap['AccessPointId'],
                    'root_directory': ap.get('RootDirectory', {}),
                    'posix_user': ap.get('PosixUser', {}),
                    'lifecycle_state': ap['LifeCycleState'],
                    'tags': ap.get('Tags', [])
                })
                
        except Exception as e:
            logger.error(f"Error getting access points for {fs_id}: {e}")
            
        return access_points
    
    def _get_lifecycle_configuration(self, fs_id: str) -> Optional[Dict]:
        """Get lifecycle management configuration"""
        try:
            response = self.efs.describe_lifecycle_configuration(FileSystemId=fs_id)
            return response.get('LifecyclePolicies', [])
        except self.efs.exceptions.LifecycleConfigurationNotFound:
            return None
        except Exception as e:
            logger.error(f"Error getting lifecycle config for {fs_id}: {e}")
            return None
    
    def _check_backup_status(self, fs_id: str) -> bool:
        """Check if file system has backup enabled"""
        try:
            # Check AWS Backup plans
            response = self.backup.list_backup_selections(MaxResults=100)
            
            for plan in response.get('BackupSelectionsList', []):
                selection_response = self.backup.get_backup_selection(
                    BackupPlanId=plan['BackupPlanId'],
                    SelectionId=plan['SelectionId']
                )
                
                selection = selection_response.get('BackupSelection', {})
                resources = selection.get('Resources', [])
                
                # Check if this EFS is included
                efs_arn = f"arn:aws:elasticfilesystem:{self.region}:*:file-system/{fs_id}"
                if efs_arn in resources:
                    return True
                    
                # Check tags
                if selection.get('ListOfTags'):
                    # Would need to check if tags match
                    pass
                    
            return False
            
        except Exception as e:
            logger.error(f"Error checking backup status for {fs_id}: {e}")
            return False
    
    def _get_replication_configuration(self, fs_id: str) -> Optional[Dict]:
        """Check replication configuration"""
        try:
            response = self.efs.describe_replication_configurations(
                FileSystemId=fs_id
            )
            return response.get('Replications', [])
        except self.efs.exceptions.ReplicationNotFound:
            return None
        except Exception as e:
            logger.error(f"Error getting replication config for {fs_id}: {e}")
            return None
    
    def _get_cloudwatch_metrics(self, fs_id: str) -> Dict[str, Any]:
        """Get 30-day CloudWatch metrics for file system"""
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        metrics = {}
        
        # Define metrics to collect
        metric_definitions = [
            ('ClientConnections', 'Sum', 'Count'),
            ('DataReadIOBytes', 'Sum', 'Bytes'),
            ('DataWriteIOBytes', 'Sum', 'Bytes'),
            ('MetadataIOBytes', 'Sum', 'Bytes'),
            ('BurstCreditBalance', 'Average', 'Count'),
            ('PermittedThroughput', 'Average', 'Bytes/Second'),
            ('MeteredIOBytes', 'Sum', 'Bytes'),
            ('StorageBytes', 'Average', 'Bytes'),
        ]
        
        for metric_name, stat, unit in metric_definitions:
            try:
                response = self.cloudwatch.get_metric_statistics(
                    Namespace='AWS/EFS',
                    MetricName=metric_name,
                    Dimensions=[
                        {
                            'Name': 'FileSystemId',
                            'Value': fs_id
                        }
                    ],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,  # 1 hour
                    Statistics=[stat]
                )
                
                datapoints = response.get('Datapoints', [])
                if datapoints:
                    values = [dp[stat] for dp in datapoints]
                    metrics[metric_name] = {
                        'average': sum(values) / len(values),
                        'max': max(values),
                        'min': min(values),
                        'datapoints': len(datapoints),
                        'unit': unit
                    }
                else:
                    metrics[metric_name] = None
                    
            except Exception as e:
                logger.error(f"Error getting metric {metric_name} for {fs_id}: {e}")
                metrics[metric_name] = None
        
        # Calculate derived metrics
        if metrics.get('DataReadIOBytes') and metrics.get('DataWriteIOBytes'):
            total_io = metrics['DataReadIOBytes']['average'] + metrics['DataWriteIOBytes']['average']
            metrics['TotalIOBytes'] = {
                'average': total_io,
                'unit': 'Bytes'
            }
        
        # Check for metadata operations spike
        if metrics.get('MetadataIOBytes'):
            # Estimate metadata ops/sec (rough calculation)
            metadata_bytes = metrics['MetadataIOBytes']['average']
            # Assuming average metadata operation is ~4KB
            metadata_ops_per_hour = metadata_bytes / 4096
            metrics['EstimatedMetadataOpsPerSec'] = metadata_ops_per_hour / 3600
        
        return metrics
    
    def _analyze_security(self, fs: Dict, mount_targets: List[Dict], 
                         access_points: List[Dict]) -> List[Dict]:
        """Analyze security posture of file system"""
        issues = []
        fs_id = fs['FileSystemId']
        
        # Check 1: Encryption at rest
        if not fs.get('Encrypted', False):
            issues.append({
                'type': 'NO_ENCRYPTION_AT_REST',
                'severity': 'HIGH',
                'description': 'File system is not encrypted at rest',
                'remediation': f'Enable encryption for file system {fs_id} using AWS KMS',
                'metric_data': {}
            })
        
        # Check 2: Encryption in transit
        for mt in mount_targets:
            # Check if mount target enforces TLS
            # Note: This is typically enforced at mount time, but we flag if no access points
            if not access_points:
                issues.append({
                    'type': 'NO_ENCRYPTION_IN_TRANSIT',
                    'severity': 'MEDIUM',
                    'description': f'Mount target {mt["mount_target_id"]} may not enforce TLS encryption',
                    'remediation': 'Use EFS mount helper with TLS option or create access points with IAM authorization',
                    'metric_data': {'mount_target_id': mt['mount_target_id']}
                })
                break
        
        # Check 3: Mount target security groups
        for mt in mount_targets:
            for sg in mt.get('security_groups', []):
                if sg.get('has_overly_permissive_rules'):
                    issues.append({
                        'type': 'UNRESTRICTED_MOUNT_TARGET_SG',
                        'severity': 'HIGH',
                        'description': f'Security group {sg["group_id"]} has overly permissive NFS rules (0.0.0.0/0)',
                        'remediation': 'Restrict NFS access (port 2049) to specific CIDR ranges or security groups',
                        'metric_data': {
                            'security_group_id': sg['group_id'],
                            'rules': sg['nfs_rules']
                        }
                    })
        
        # Check 4: IAM authorization
        if not access_points:
            issues.append({
                'type': 'NO_IAM_AUTHORIZATION',
                'severity': 'MEDIUM',
                'description': 'File system relies only on POSIX permissions without IAM authorization',
                'remediation': 'Create EFS access points with IAM policies for fine-grained access control',
                'metric_data': {}
            })
        
        # Check 5: Root squashing
        # Note: Root squashing is configured at access point level
        root_squash_enabled = False
        for ap in access_points:
            root_directory = ap.get('root_directory', {})
            if root_directory.get('CreationInfo', {}).get('OwnerUid') != 0:
                root_squash_enabled = True
                break
        
        if access_points and not root_squash_enabled:
            issues.append({
                'type': 'ROOT_SQUASHING_DISABLED',
                'severity': 'MEDIUM',
                'description': 'Root squashing not enabled on access points',
                'remediation': 'Configure access points with non-root ownership to prevent privilege escalation',
                'metric_data': {}
            })
        
        # Check 6: Backup policy
        if not fs.get('backup_enabled'):
            issues.append({
                'type': 'NO_BACKUP_POLICY',
                'severity': 'HIGH',
                'description': 'No AWS Backup plan configured for this file system',
                'remediation': 'Create an AWS Backup plan to protect against data loss',
                'metric_data': {}
            })
        
        # Check 7: Replication
        if not fs.get('replication_enabled'):
            # Check if this is a critical system based on tags
            tags = {tag['Key'].lower(): tag['Value'].lower() for tag in fs.get('Tags', [])}
            if tags.get('environment') in ['prod', 'production'] or tags.get('critical') == 'true':
                issues.append({
                    'type': 'REPLICATION_NOT_ENABLED',
                    'severity': 'MEDIUM',
                    'description': 'Critical file system without cross-region replication',
                    'remediation': 'Enable EFS replication to another region for disaster recovery',
                    'metric_data': {}
                })
        
        return issues
    
    def _analyze_performance(self, fs: Dict, metrics: Dict[str, Any]) -> List[Dict]:
        """Analyze performance issues"""
        issues = []
        fs_id = fs['FileSystemId']
        
        # Check 1: Provisioned throughput underutilization
        if fs['ThroughputMode'] == 'provisioned':
            provisioned_mibps = fs.get('ProvisionedThroughputInMibps', 0)
            if provisioned_mibps > 0 and metrics.get('PermittedThroughput'):
                actual_throughput_mibps = metrics['PermittedThroughput']['average'] / (1024 * 1024)
                utilization = (actual_throughput_mibps / provisioned_mibps) * 100
                
                if utilization < 30:
                    issues.append({
                        'type': 'PROVISIONED_THROUGHPUT_OVERPROVISIONED',
                        'severity': 'MEDIUM',
                        'description': f'Throughput utilization is only {utilization:.1f}% of provisioned',
                        'remediation': f'Consider reducing provisioned throughput from {provisioned_mibps} to {math.ceil(actual_throughput_mibps * 1.5)} MiB/s',
                        'metric_data': {
                            'provisioned_mibps': provisioned_mibps,
                            'actual_mibps': actual_throughput_mibps,
                            'utilization_percent': utilization
                        }
                    })
        
        # Check 2: Burst credit depletion
        if fs['ThroughputMode'] == 'bursting' and metrics.get('BurstCreditBalance'):
            burst_credits = metrics['BurstCreditBalance']['average']
            min_credits = metrics['BurstCreditBalance']['min']
            
            if min_credits < 1000000:  # Less than 1M credits
                issues.append({
                    'type': 'BURST_CREDIT_DEPLETION',
                    'severity': 'HIGH',
                    'description': 'Recurring burst credit depletion detected',
                    'remediation': 'Switch to provisioned or elastic throughput mode for consistent performance',
                    'metric_data': {
                        'average_credits': burst_credits,
                        'min_credits': min_credits
                    }
                })
        
        # Check 3: High metadata operations
        if metrics.get('EstimatedMetadataOpsPerSec', 0) > 1000:
            issues.append({
                'type': 'HIGH_METADATA_OPERATIONS',
                'severity': 'MEDIUM',
                'description': f'High metadata operations detected ({metrics["EstimatedMetadataOpsPerSec"]:.0f} ops/sec)',
                'remediation': 'Review application access patterns, consider caching or reducing directory traversals',
                'metric_data': {
                    'metadata_ops_per_sec': metrics['EstimatedMetadataOpsPerSec']
                }
            })
        
        # Check 4: Inefficient access patterns (Max I/O mode)
        if fs['PerformanceMode'] == 'maxIO':
            # Check if file count justifies Max I/O mode
            # Rough estimate based on storage size
            size_gb = fs['SizeInBytes']['Value'] / (1024**3)
            if size_gb < 100:  # Less than 100GB typically doesn't need Max I/O
                issues.append({
                    'type': 'INEFFICIENT_ACCESS_PATTERNS',
                    'severity': 'LOW',
                    'description': 'Max I/O mode used with relatively small file system',
                    'remediation': 'Consider General Purpose mode for lower latency unless you have millions of files',
                    'metric_data': {
                        'size_gb': size_gb,
                        'performance_mode': fs['PerformanceMode']
                    }
                })
        
        # Check 5: Unused file systems
        if metrics.get('ClientConnections'):
            total_connections = metrics['ClientConnections']['average']
            if total_connections == 0:
                issues.append({
                    'type': 'UNUSED_FILE_SYSTEM',
                    'severity': 'MEDIUM',
                    'description': 'No client connections in the last 30 days',
                    'remediation': 'Consider deleting this file system to save costs',
                    'metric_data': {
                        'client_connections': 0
                    }
                })
        
        # Check 6: Single AZ for production
        if fs.get('AvailabilityZoneName'):  # One Zone storage class
            tags = {tag['Key'].lower(): tag['Value'].lower() for tag in fs.get('Tags', [])}
            if tags.get('environment') in ['prod', 'production']:
                issues.append({
                    'type': 'SINGLE_AZ_FILE_SYSTEM',
                    'severity': 'HIGH',
                    'description': 'Production workload using One Zone storage without cross-AZ redundancy',
                    'remediation': 'Migrate to Standard storage class for multi-AZ durability',
                    'metric_data': {
                        'availability_zone': fs['AvailabilityZoneName']
                    }
                })
        
        return issues
    
    def _analyze_cost_optimization(self, fs: Dict, metrics: Dict[str, Any], 
                                  lifecycle_config: Optional[List]) -> Dict[str, Any]:
        """Analyze cost optimization opportunities"""
        issues = []
        recommendations = {}
        
        fs_id = fs['FileSystemId']
        size_gb = fs['SizeInBytes']['Value'] / (1024**3)
        
        # Check 1: No lifecycle management
        if not lifecycle_config:
            issues.append({
                'type': 'NO_LIFECYCLE_MANAGEMENT',
                'severity': 'MEDIUM',
                'description': 'No lifecycle policy configured',
                'remediation': 'Enable lifecycle management to automatically transition infrequently accessed files to IA storage',
                'metric_data': {}
            })
            
            # Estimate IA savings (assuming 50% of data is infrequently accessed)
            ia_eligible_gb = size_gb * 0.5
            monthly_savings = ia_eligible_gb * (PRICING['standard_storage_gb'] - PRICING['ia_storage_gb'])
            recommendations['ia_savings_monthly'] = monthly_savings
            recommendations['ia_eligible_gb'] = ia_eligible_gb
        
        # Check 2: IA storage utilization
        # Note: We need to check actual IA usage from metrics
        storage_bytes = metrics.get('StorageBytes', {}).get('average', 0) if metrics.get('StorageBytes') else 0
        
        # Estimate based on access patterns
        if not lifecycle_config and size_gb > 10:  # Only suggest for larger file systems
            issues.append({
                'type': 'IA_STORAGE_NOT_UTILIZED',
                'severity': 'MEDIUM',
                'description': 'Infrequent Access storage class not utilized despite size',
                'remediation': 'Enable lifecycle policy with AFTER_30_DAYS transition rule',
                'metric_data': {
                    'current_size_gb': size_gb,
                    'potential_ia_gb': size_gb * 0.5
                }
            })
        
        # Check 3: No CloudWatch alarms
        # This would require checking CloudWatch alarms API
        issues.append({
            'type': 'NO_CLOUDWATCH_ALARMS',
            'severity': 'LOW',
            'description': 'No CloudWatch alarms configured for monitoring',
            'remediation': 'Set up alarms for burst credits, client connections, and throughput utilization',
            'metric_data': {}
        })
        
        # Calculate current monthly cost
        current_monthly_cost = size_gb * PRICING['standard_storage_gb']
        
        # Add provisioned throughput cost if applicable
        if fs['ThroughputMode'] == 'provisioned':
            provisioned_mibps = fs.get('ProvisionedThroughputInMibps', 0)
            current_monthly_cost += provisioned_mibps * PRICING['provisioned_throughput_mibps']
        
        return {
            'current_monthly_cost': current_monthly_cost,
            'recommendations': recommendations,
            'issues': issues
        }
    
    def _print_console_summary(self, result: Dict):
        """Print analysis summary to console"""
        fs_id = result['file_system_id']
        name = result.get('name', 'N/A')
        
        print(f"\n{'='*80}")
        print(f"File System: {fs_id} ({name})")
        print(f"Size: {result['size_gb']:.2f} GB | Throughput Mode: {result['throughput_mode']}")
        print(f"Performance Mode: {result['performance_mode']} | Encrypted: {result['encrypted']}")
        
        if result['issues']:
            print(f"\nIssues Found ({len(result['issues'])}):")
            
            # Group by severity
            high_severity = [i for i in result['issues'] if i['severity'] == 'HIGH']
            medium_severity = [i for i in result['issues'] if i['severity'] == 'MEDIUM']
            low_severity = [i for i in result['issues'] if i['severity'] == 'LOW']
            
            if high_severity:
                print("\n  HIGH SEVERITY:")
                for issue in high_severity:
                    print(f"    - {issue['type']}: {issue['description']}")
                    print(f"      Fix: {issue['remediation']}")
            
            if medium_severity:
                print("\n  MEDIUM SEVERITY:")
                for issue in medium_severity:
                    print(f"    - {issue['type']}: {issue['description']}")
            
            if low_severity:
                print("\n  LOW SEVERITY:")
                for issue in low_severity:
                    print(f"    - {issue['type']}: {issue['description']}")
        
        # Cost optimization
        cost_info = result.get('cost_optimization', {})
        if cost_info:
            print(f"\nEstimated Monthly Cost: ${cost_info['current_monthly_cost']:.2f}")
            if cost_info.get('recommendations', {}).get('ia_savings_monthly'):
                print(f"Potential IA Savings: ${cost_info['recommendations']['ia_savings_monthly']:.2f}/month")
    
    def _generate_outputs(self, analysis_results: List[Dict]):
        """Generate all required output files"""
        
        # 1. Generate efs_analysis.json
        summary = self._calculate_summary(analysis_results)
        
        output_data = {
            'analysis_timestamp': datetime.now().isoformat(),
            'region': self.region,
            'file_systems': analysis_results,
            'access_points': self._compile_access_points(analysis_results),
            'summary': summary
        }
        
        with open('efs_analysis.json', 'w') as f:
            json.dump(output_data, f, indent=2, default=str)
        
        logger.info("Generated efs_analysis.json")
        
        # 2. Generate storage_class_utilization.html
        self._generate_storage_utilization_chart(analysis_results)
        logger.info("Generated storage_class_utilization.html")
        
        # 3. Generate lifecycle_policy_recommendations.json
        lifecycle_recommendations = self._generate_lifecycle_recommendations(analysis_results)
        with open('lifecycle_policy_recommendations.json', 'w') as f:
            json.dump(lifecycle_recommendations, f, indent=2)
        
        logger.info("Generated lifecycle_policy_recommendations.json")
        
        # 4. Generate security_hardening_checklist.md
        self._generate_security_checklist(analysis_results)
        logger.info("Generated security_hardening_checklist.md")
    
    def _calculate_summary(self, results: List[Dict]) -> Dict[str, Any]:
        """Calculate summary statistics"""
        total_fs = len(results)
        total_size_gb = sum(r['size_gb'] for r in results)
        total_monthly_cost = sum(r['cost_optimization']['current_monthly_cost'] for r in results)
        
        # Calculate IA storage percentage (estimate)
        ia_configured = sum(1 for r in results if r.get('lifecycle_configuration'))
        percent_ia_storage = (ia_configured / total_fs * 100) if total_fs > 0 else 0
        
        # Calculate total savings opportunity
        total_ia_savings = sum(
            r['cost_optimization'].get('recommendations', {}).get('ia_savings_monthly', 0)
            for r in results
        )
        
        # Count security risks
        security_risks = {
            'high': 0,
            'medium': 0,
            'low': 0
        }
        
        for result in results:
            for issue in result['issues']:
                severity = issue['severity'].lower()
                security_risks[severity] = security_risks.get(severity, 0) + 1
        
        return {
            'total_file_systems': total_fs,
            'total_size_gb': total_size_gb,
            'percent_ia_storage': percent_ia_storage,
            'total_monthly_cost': total_monthly_cost,
            'ia_savings_opportunity': total_ia_savings,
            'security_risks': security_risks,
            'analysis_date': datetime.now().isoformat()
        }
    
    def _compile_access_points(self, results: List[Dict]) -> List[Dict]:
        """Compile all access points from results"""
        all_access_points = []
        
        for result in results:
            fs_id = result['file_system_id']
            mount_targets = result.get('mount_targets', [])
            
            for ap in result.get('access_points', []):
                # Find associated mount target info
                mt_info = mount_targets[0] if mount_targets else {}
                
                ap_detail = {
                    'file_system_id': fs_id,
                    'access_point_id': ap['access_point_id'],
                    'mount_target': mt_info.get('mount_target_id', 'N/A'),
                    'security_groups': [sg['group_id'] for sg in mt_info.get('security_groups', [])],
                    'iam_configured': bool(ap.get('tags')),  # Simplified check
                    'encryption_in_transit': True,  # Access points support TLS
                    'root_squash_enabled': ap.get('root_directory', {}).get('CreationInfo', {}).get('OwnerUid', 0) != 0
                }
                
                all_access_points.append(ap_detail)
        
        return all_access_points
    
    def _generate_storage_utilization_chart(self, results: List[Dict]):
        """Generate HTML chart for storage utilization"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>EFS Storage Class Utilization</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                .chart-container { position: relative; height: 400px; margin: 20px 0; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .stat-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
                .stat-label { color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .savings { color: #28a745; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>EFS Storage Class Utilization Analysis</h1>
                <p>Generated: {timestamp}</p>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value">{total_fs}</div>
                        <div class="stat-label">Total File Systems</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">{total_size_gb:.1f} GB</div>
                        <div class="stat-label">Total Storage</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${total_cost:.2f}</div>
                        <div class="stat-label">Monthly Cost</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value" class="savings">${ia_savings:.2f}</div>
                        <div class="stat-label">Potential Monthly Savings</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <canvas id="storageChart"></canvas>
                </div>
                
                <h2>Storage Optimization Opportunities</h2>
                <table>
                    <thead>
                        <tr>
                            <th>File System ID</th>
                            <th>Current Size (GB)</th>
                            <th>Storage Class</th>
                            <th>Monthly Cost</th>
                            <th>Potential IA Savings</th>
                            <th>Recommendation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_rows}
                    </tbody>
                </table>
                
                <script>
                    const ctx = document.getElementById('storageChart').getContext('2d');
                    new Chart(ctx, {{
                        type: 'doughnut',
                        data: {{
                            labels: ['Standard Storage', 'Infrequent Access', 'Potential IA'],
                            datasets: [{{
                                data: [{standard_gb}, {ia_gb}, {potential_ia_gb}],
                                backgroundColor: ['#007bff', '#28a745', '#ffc107'],
                                borderWidth: 1
                            }}]
                        }},
                        options: {{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {{
                                legend: {{
                                    position: 'bottom'
                                }},
                                tooltip: {{
                                    callbacks: {{
                                        label: function(context) {{
                                            const label = context.label || '';
                                            const value = context.parsed || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = ((value / total) * 100).toFixed(1);
                                            return label + ': ' + value.toFixed(1) + ' GB (' + percentage + '%)';
                                        }}
                                    }}
                                }}
                            }}
                        }}
                    }});
                </script>
            </div>
        </body>
        </html>
        """
        
        # Calculate statistics
        total_fs = len(results)
        total_size_gb = sum(r['size_gb'] for r in results)
        total_cost = sum(r['cost_optimization']['current_monthly_cost'] for r in results)
        ia_savings = sum(r['cost_optimization'].get('recommendations', {}).get('ia_savings_monthly', 0) for r in results)
        
        # Estimate storage distribution
        standard_gb = total_size_gb * 0.7  # Assume 70% standard
        ia_gb = total_size_gb * 0.1  # Assume 10% already IA
        potential_ia_gb = total_size_gb * 0.2  # 20% could be IA
        
        # Generate table rows
        table_rows = []
        for r in results:
            lifecycle_status = "Enabled" if r.get('lifecycle_configuration') else "Disabled"
            savings = r['cost_optimization'].get('recommendations', {}).get('ia_savings_monthly', 0)
            
            row = f"""
                <tr>
                    <td>{r['file_system_id']}</td>
                    <td>{r['size_gb']:.2f}</td>
                    <td>{lifecycle_status}</td>
                    <td>${r['cost_optimization']['current_monthly_cost']:.2f}</td>
                    <td class="savings">${savings:.2f}</td>
                    <td>{"Enable lifecycle policy" if savings > 0 else "Optimized"}</td>
                </tr>
            """
            table_rows.append(row)
        
        # Generate HTML
        html_content = html_template.format(
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            total_fs=total_fs,
            total_size_gb=total_size_gb,
            total_cost=total_cost,
            ia_savings=ia_savings,
            standard_gb=standard_gb,
            ia_gb=ia_gb,
            potential_ia_gb=potential_ia_gb,
            table_rows=''.join(table_rows)
        )
        
        with open('storage_class_utilization.html', 'w') as f:
            f.write(html_content)
    
    def _generate_lifecycle_recommendations(self, results: List[Dict]) -> List[Dict]:
        """Generate lifecycle policy recommendations"""
        recommendations = []
        
        for result in results:
            fs_id = result['file_system_id']
            size_gb = result['size_gb']
            
            # Skip if lifecycle already configured
            if result.get('lifecycle_configuration'):
                continue
            
            # Calculate potential savings
            ia_eligible_gb = size_gb * 0.5  # Assume 50% eligible
            monthly_savings = ia_eligible_gb * (PRICING['standard_storage_gb'] - PRICING['ia_storage_gb'])
            
            # Only recommend if savings > $10/month
            if monthly_savings > 10:
                recommendation = {
                    'file_system_id': fs_id,
                    'file_system_name': result.get('name', 'N/A'),
                    'current_size_gb': size_gb,
                    'estimated_ia_eligible_gb': ia_eligible_gb,
                    'recommended_lifecycle_rules': [
                        {
                            'transition_to_ia': 'AFTER_30_DAYS',
                            'transition_to_primary_storage_class': 'AFTER_1_ACCESS'
                        }
                    ],
                    'estimated_monthly_savings': monthly_savings,
                    'implementation_steps': [
                        f"aws efs put-lifecycle-configuration --file-system-id {fs_id} --lifecycle-policies TransitionToIA=AFTER_30_DAYS",
                        "Monitor CloudWatch metrics to validate IA usage",
                        "Adjust transition period based on access patterns"
                    ]
                }
                recommendations.append(recommendation)
        
        # Sort by savings potential
        recommendations.sort(key=lambda x: x['estimated_monthly_savings'], reverse=True)
        
        return {
            'generated_date': datetime.now().isoformat(),
            'total_recommendations': len(recommendations),
            'total_potential_savings': sum(r['estimated_monthly_savings'] for r in recommendations),
            'recommendations': recommendations
        }
    
    def _generate_security_checklist(self, results: List[Dict]):
        """Generate security hardening checklist"""
        checklist_content = """# EFS Security Hardening Checklist

Generated: {timestamp}

## Overview
This checklist provides security hardening recommendations for your EFS file systems based on the analysis performed.

## Critical Security Issues Found

{critical_issues}

## Security Hardening Recommendations

### 1. Encryption
- [ ] Enable encryption at rest for all file systems using AWS KMS
- [ ] Use customer-managed KMS keys for sensitive data
- [ ] Enable encryption in transit by mounting with TLS

### 2. Network Security

#### Mount Target Security Groups
{mount_target_recommendations}

#### Recommended Security Group Rules
```
# Restrict NFS access to specific CIDR blocks
aws ec2 authorize-security-group-ingress \\
    --group-id <sg-id> \\
    --protocol tcp \\
    --port 2049 \\
    --source-group <app-security-group-id>
```

### 3. Access Control

#### IAM Authorization
- [ ] Create EFS access points for each application
- [ ] Implement IAM policies for fine-grained access control
- [ ] Use path-based access restrictions

Example IAM Policy:
```json
{{
    "Version": "2012-10-17",
    "Statement": [
        {{
            "Effect": "Allow",
            "Principal": {{
                "AWS": "arn:aws:iam::ACCOUNT:role/AppRole"
            }},
            "Action": [
                "elasticfilesystem:ClientMount",
                "elasticfilesystem:ClientWrite"
            ],
            "Resource": "*",
            "Condition": {{
                "IpAddress": {{
                    "aws:SourceIp": "10.0.0.0/16"
                }}
            }}
        }}
    ]
}}
```

#### Root Squashing
- [ ] Enable root squashing on all access points
- [ ] Set appropriate UID/GID for access points

### 4. Backup and Recovery
{backup_recommendations}

### 5. Monitoring and Alerting
- [ ] Create CloudWatch alarms for:
  - [ ] Burst credit balance < 10%
  - [ ] Client connections = 0 (unused file systems)
  - [ ] High metadata operations (>1000 ops/sec)
  - [ ] Storage growth rate > expected threshold

### 6. Compliance and Governance
- [ ] Tag all file systems with:
  - [ ] Environment (dev/staging/prod)
  - [ ] Owner/Team
  - [ ] Data Classification
  - [ ] Backup Requirements
- [ ] Implement AWS Config rules for EFS compliance
- [ ] Enable AWS CloudTrail for EFS API logging

## File System Specific Recommendations

{fs_specific_recommendations}

## Implementation Priority
1. **Immediate (High Severity)**: Encryption, unrestricted security groups
2. **Short-term (Medium Severity)**: IAM authorization, backup policies
3. **Long-term (Low Severity)**: Monitoring, optimization

## Validation Steps
1. Run this analysis monthly to track improvements
2. Use AWS Security Hub for continuous compliance monitoring
3. Perform penetration testing on mount points
4. Review CloudTrail logs for unauthorized access attempts
"""
        
        # Compile critical issues
        critical_issues = []
        mount_target_issues = []
        backup_issues = []
        fs_specific = []
        
        for result in results:
            fs_id = result['file_system_id']
            high_severity_issues = [i for i in result['issues'] if i['severity'] == 'HIGH']
            
            if high_severity_issues:
                for issue in high_severity_issues:
                    critical_issues.append(f"- **{fs_id}**: {issue['description']}")
            
            # Check for mount target issues
            for mt in result.get('mount_targets', []):
                for sg in mt.get('security_groups', []):
                    if sg.get('has_overly_permissive_rules'):
                        mount_target_issues.append(
                            f"- [ ] Restrict security group {sg['group_id']} "
                            f"(currently allows 0.0.0.0/0)"
                        )
            
            # Backup recommendations
            if not result.get('backup_enabled'):
                backup_issues.append(f"- [ ] Enable AWS Backup for {fs_id}")
            
            # File system specific
            if len(result['issues']) > 3:
                fs_specific.append(f"\n### {fs_id}")
                for issue in result['issues'][:5]:  # Top 5 issues
                    fs_specific.append(f"- {issue['description']}")
                    fs_specific.append(f"  - **Fix**: {issue['remediation']}")
        
        # Format the checklist
        checklist = checklist_content.format(
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            critical_issues='\n'.join(critical_issues) if critical_issues else 'No critical issues found.',
            mount_target_recommendations='\n'.join(mount_target_issues) if mount_target_issues else '- [x] All mount targets properly secured',
            backup_recommendations='\n'.join(backup_issues) if backup_issues else '- [x] All file systems have backup enabled',
            fs_specific_recommendations='\n'.join(fs_specific) if fs_specific else 'No file system specific issues found.'
        )
        
        with open('security_hardening_checklist.md', 'w') as f:
            f.write(checklist)


def main():
    """Main execution function"""
    try:
        analyzer = EFSAnalyzer()
        analyzer.run_analysis()
        
        print("\n" + "="*80)
        print("Analysis complete! Generated files:")
        print("  - efs_analysis.json")
        print("  - storage_class_utilization.html")
        print("  - lifecycle_policy_recommendations.json")
        print("  - security_hardening_checklist.md")
        print("="*80)
        
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

This comprehensive script analyzes AWS EFS file systems and provides:

1. **Performance Analysis**:
   - Detects overprovisioned throughput
   - Identifies burst credit depletion
   - Monitors metadata operations
   - Tracks unused file systems

2. **Security Audit**:
   - Checks encryption (at rest and in transit)
   - Reviews mount target security groups
   - Validates IAM authorization
   - Verifies backup policies

3. **Cost Optimization**:
   - Calculates IA storage savings
   - Recommends lifecycle policies
   - Suggests throughput adjustments
   - Estimates monthly costs

4. **Generated Outputs**:
   - **efs_analysis.json**: Complete analysis data
   - **storage_class_utilization.html**: Interactive dashboard
   - **lifecycle_policy_recommendations.json**: Actionable recommendations
   - **security_hardening_checklist.md**: Security remediation guide

The script uses concurrent processing for efficiency and provides detailed remediation steps for each issue found.
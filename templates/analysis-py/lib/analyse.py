#!/usr/bin/env python3
"""
AWS Resource Audit Script
Identifies unused and misconfigured resources in AWS environment.
"""

import json
from datetime import datetime
from typing import Any, Dict, List

import boto3
from botocore.exceptions import BotoCoreError, ClientError


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


def main():
    """Main function to run the AWS resource audit."""
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
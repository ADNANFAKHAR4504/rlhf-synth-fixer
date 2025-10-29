#!/usr/bin/env python3
"""
AWS Resource Audit Script
Finds zombie volumes, wide-open security groups, and calculates CloudWatch log costs
"""

import json
import csv
import boto3
import logging
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Any, Tuple
import os
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AWSAuditor:
    def __init__(self, region='us-east-1', endpoint_url=None):
        """
        Initialize the auditor with AWS clients

        Args:
            region: AWS region to audit
            endpoint_url: Optional endpoint URL for moto testing
        """
        self.region = region
        self.endpoint_url = endpoint_url
        self.timestamp = datetime.utcnow().isoformat()

        # Initialize AWS clients
        client_config = {
            'region_name': region
        }
        if endpoint_url:
            client_config['endpoint_url'] = endpoint_url

        self.ec2_client = boto3.client('ec2', **client_config)
        self.logs_client = boto3.client('logs', **client_config)

    def find_zombie_volumes(self) -> List[Dict[str, Any]]:
        """Find all unattached EBS volumes in 'available' state"""
        logger.info("Scanning for zombie volumes...")
        zombie_volumes = []

        try:
            paginator = self.ec2_client.get_paginator('describe_volumes')

            for page in paginator.paginate():
                for volume in page.get('Volumes', []):
                    if volume['State'] == 'available':
                        zombie_volumes.append({
                            'volume_id': volume['VolumeId'],
                            'size_gb': volume['Size'],
                            'volume_type': volume['VolumeType'],
                            'create_time': volume['CreateTime'].isoformat() if hasattr(volume['CreateTime'], 'isoformat') else str(volume['CreateTime']),
                            'estimated_monthly_cost': self._estimate_ebs_cost(volume['Size'], volume['VolumeType']),
                            'tags': {tag['Key']: tag['Value'] for tag in volume.get('Tags', [])}
                        })

        except Exception as e:
            logger.error(f"Error finding zombie volumes: {str(e)}")

        logger.info(f"Found {len(zombie_volumes)} zombie volumes")
        return zombie_volumes

    def find_wide_open_security_groups(self) -> List[Dict[str, Any]]:
        """Find security groups with inbound rules open to the world"""
        logger.info("Scanning for wide-open security groups...")
        risky_groups = []

        try:
            paginator = self.ec2_client.get_paginator('describe_security_groups')

            for page in paginator.paginate():
                for sg in page.get('SecurityGroups', []):
                    risky_rules = []

                    for rule in sg.get('IpPermissions', []):
                        # Check for IPv4 0.0.0.0/0
                        for ip_range in rule.get('IpRanges', []):
                            if ip_range.get('CidrIp') == '0.0.0.0/0':
                                risky_rules.append({
                                    'protocol': rule.get('IpProtocol', 'all'),
                                    'from_port': rule.get('FromPort', 'all'),
                                    'to_port': rule.get('ToPort', 'all'),
                                    'cidr': '0.0.0.0/0',
                                    'description': ip_range.get('Description', 'No description')
                                })

                        # Check for IPv6 ::/0
                        for ipv6_range in rule.get('Ipv6Ranges', []):
                            if ipv6_range.get('CidrIpv6') == '::/0':
                                risky_rules.append({
                                    'protocol': rule.get('IpProtocol', 'all'),
                                    'from_port': rule.get('FromPort', 'all'),
                                    'to_port': rule.get('ToPort', 'all'),
                                    'cidr': '::/0',
                                    'description': ipv6_range.get('Description', 'No description')
                                })

                    if risky_rules:
                        risky_groups.append({
                            'group_id': sg['GroupId'],
                            'group_name': sg['GroupName'],
                            'vpc_id': sg.get('VpcId', 'EC2-Classic'),
                            'description': sg.get('Description', ''),
                            'risky_rules': risky_rules,
                            'tags': {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
                        })

        except Exception as e:
            logger.error(f"Error finding wide-open security groups: {str(e)}")

        logger.info(f"Found {len(risky_groups)} wide-open security groups")
        return risky_groups

    def calculate_log_costs(self, log_group_pattern: str = '/aws/lambda/production-app-*') -> Dict[str, Any]:
        """Calculate average size of log streams for matching log groups"""
        logger.info(f"Calculating log costs for pattern: {log_group_pattern}")
        log_stats = {
            'pattern': log_group_pattern,
            'total_groups': 0,
            'total_streams': 0,
            'total_size_bytes': 0,
            'groups': []
        }

        try:
            # Convert glob pattern to regex
            regex_pattern = log_group_pattern.replace('*', '.*')
            pattern = re.compile(f'^{regex_pattern}$')

            paginator = self.logs_client.get_paginator('describe_log_groups')

            for page in paginator.paginate():
                for log_group in page.get('logGroups', []):
                    if pattern.match(log_group['logGroupName']):
                        log_stats['total_groups'] += 1

                        group_info = {
                            'log_group_name': log_group['logGroupName'],
                            'stored_bytes': log_group.get('storedBytes', 0),
                            'stream_count': 0,
                            'average_stream_size_bytes': 0,
                            'retention_days': log_group.get('retentionInDays', 'Never expire'),
                            'estimated_monthly_cost': self._estimate_cloudwatch_cost(log_group.get('storedBytes', 0))
                        }

                        # Get stream count
                        try:
                            stream_paginator = self.logs_client.get_paginator('describe_log_streams')
                            stream_count = 0

                            for stream_page in stream_paginator.paginate(
                                logGroupName=log_group['logGroupName'],
                                orderBy='LogStreamName'
                            ):
                                stream_count += len(stream_page.get('logStreams', []))

                            group_info['stream_count'] = stream_count
                            if stream_count > 0:
                                group_info['average_stream_size_bytes'] = group_info['stored_bytes'] / stream_count

                            log_stats['total_streams'] += stream_count

                        except Exception as e:
                            logger.warning(f"Could not get streams for {log_group['logGroupName']}: {str(e)}")

                        log_stats['total_size_bytes'] += group_info['stored_bytes']
                        log_stats['groups'].append(group_info)

            # Calculate overall averages
            if log_stats['total_streams'] > 0:
                log_stats['average_stream_size_bytes'] = log_stats['total_size_bytes'] / log_stats['total_streams']
            else:
                log_stats['average_stream_size_bytes'] = 0

            log_stats['total_estimated_monthly_cost'] = self._estimate_cloudwatch_cost(log_stats['total_size_bytes'])

        except Exception as e:
            logger.error(f"Error calculating log costs: {str(e)}")

        logger.info(f"Analyzed {log_stats['total_groups']} log groups with {log_stats['total_streams']} streams")
        return log_stats

    def _estimate_ebs_cost(self, size_gb: int, volume_type: str) -> float:
        """Estimate monthly cost for EBS volume"""
        # Simplified pricing for us-east-1 (actual prices may vary)
        pricing = {
            'gp3': 0.08,
            'gp2': 0.10,
            'io1': 0.125,
            'io2': 0.125,
            'st1': 0.045,
            'sc1': 0.015,
            'standard': 0.05
        }
        price_per_gb = pricing.get(volume_type, 0.10)
        return round(size_gb * price_per_gb, 2)

    def _estimate_cloudwatch_cost(self, stored_bytes: int) -> float:
        """Estimate monthly cost for CloudWatch logs storage"""
        # CloudWatch Logs pricing: $0.50 per GB for storage
        gb = stored_bytes / (1024 ** 3)
        return round(gb * 0.50, 2)

    def run_audit(self, log_pattern: str = '/aws/lambda/production-app-*') -> Dict[str, Any]:
        """Run complete audit and return results"""
        logger.info("Starting AWS resource audit...")

        results = {
            'audit_timestamp': self.timestamp,
            'region': self.region,
            'zombie_volumes': self.find_zombie_volumes(),
            'wide_open_security_groups': self.find_wide_open_security_groups(),
            'log_costs': self.calculate_log_costs(log_pattern)
        }

        # Calculate summary statistics
        results['summary'] = {
            'total_zombie_volumes': len(results['zombie_volumes']),
            'total_zombie_volume_gb': sum(v['size_gb'] for v in results['zombie_volumes']),
            'total_zombie_volume_monthly_cost': sum(v['estimated_monthly_cost'] for v in results['zombie_volumes']),
            'total_risky_security_groups': len(results['wide_open_security_groups']),
            'total_risky_rules': sum(len(sg['risky_rules']) for sg in results['wide_open_security_groups']),
            'total_log_storage_gb': results['log_costs']['total_size_bytes'] / (1024 ** 3),
            'total_log_monthly_cost': results['log_costs']['total_estimated_monthly_cost']
        }

        logger.info("Audit complete!")
        return results

    def save_reports(self, results: Dict[str, Any], json_file: str = 'report.json', csv_file: str = 'report.csv'):
        """Save audit results to JSON and CSV files"""
        # Save JSON report
        logger.info(f"Saving JSON report to {json_file}")
        with open(json_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)

        # Save CSV report
        logger.info(f"Saving CSV report to {csv_file}")
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)

            # Write summary section
            writer.writerow(['AWS Resource Audit Report'])
            writer.writerow(['Generated', results['audit_timestamp']])
            writer.writerow(['Region', results['region']])
            writer.writerow([])

            # Summary statistics
            writer.writerow(['Summary'])
            for key, value in results['summary'].items():
                writer.writerow([key.replace('_', ' ').title(), value])
            writer.writerow([])

            # Zombie volumes
            writer.writerow(['Zombie Volumes'])
            if results['zombie_volumes']:
                writer.writerow(['Volume ID', 'Size (GB)', 'Type', 'Created', 'Est. Monthly Cost', 'Tags'])
                for volume in results['zombie_volumes']:
                    writer.writerow([
                        volume['volume_id'],
                        volume['size_gb'],
                        volume['volume_type'],
                        volume['create_time'],
                        f"${volume['estimated_monthly_cost']}",
                        json.dumps(volume['tags'])
                    ])
            else:
                writer.writerow(['No zombie volumes found'])
            writer.writerow([])

            # Security groups
            writer.writerow(['Wide-Open Security Groups'])
            if results['wide_open_security_groups']:
                writer.writerow(['Group ID', 'Group Name', 'VPC ID', 'Protocol', 'Port Range', 'CIDR', 'Description'])
                for sg in results['wide_open_security_groups']:
                    for rule in sg['risky_rules']:
                        port_range = f"{rule['from_port']}-{rule['to_port']}" if rule['from_port'] != 'all' else 'All'
                        writer.writerow([
                            sg['group_id'],
                            sg['group_name'],
                            sg['vpc_id'],
                            rule['protocol'],
                            port_range,
                            rule['cidr'],
                            rule['description']
                        ])
            else:
                writer.writerow(['No wide-open security groups found'])
            writer.writerow([])

            # Log costs
            writer.writerow(['CloudWatch Log Costs'])
            writer.writerow(['Log Group', 'Size (GB)', 'Streams', 'Avg Stream Size (MB)', 'Retention', 'Est. Monthly Cost'])
            for group in results['log_costs']['groups']:
                writer.writerow([
                    group['log_group_name'],
                    f"{group['stored_bytes'] / (1024**3):.2f}",
                    group['stream_count'],
                    f"{group['average_stream_size_bytes'] / (1024**2):.2f}",
                    group['retention_days'],
                    f"${group['estimated_monthly_cost']}"
                ])

        logger.info("Reports saved successfully!")


def main():
    """Main execution function"""
    # Check if we're running against moto
    endpoint_url = os.environ.get('AWS_ENDPOINT_URL', None)

    # Initialize auditor
    auditor = AWSAuditor(endpoint_url=endpoint_url)

    # Run audit
    results = auditor.run_audit()

    # Save reports
    auditor.save_reports(results)

    # Print summary
    print("\nAudit Summary:")
    print(f"- Found {results['summary']['total_zombie_volumes']} zombie volumes costing ${results['summary']['total_zombie_volume_monthly_cost']}/month")
    print(f"- Found {results['summary']['total_risky_security_groups']} security groups with {results['summary']['total_risky_rules']} risky rules")
    print(f"- CloudWatch logs using {results['summary']['total_log_storage_gb']:.2f} GB costing ${results['summary']['total_log_monthly_cost']}/month")


if __name__ == '__main__':
    main()

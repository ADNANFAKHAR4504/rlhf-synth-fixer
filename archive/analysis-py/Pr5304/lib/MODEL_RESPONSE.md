### Reasoning Trace

---

The user wants a Python script using Boto3 to audit AWS resources and find cost optimization and security issues. They need:

1. Find unattached EBS volumes in us-east-1 (zombie volumes)
2. Find security groups with inbound rules open to the world
3. Calculate average log stream sizes for specific CloudWatch log groups

The output should be in both JSON and CSV formats.

They also want tests using Moto for CI/CD pipeline.

Let me structure this:

1. `lib/analyse.py` - Main script that:
   - Uses boto3 to connect to AWS
   - Implements the three audit functions
   - Outputs results to report.json and report.csv

2. `test/test-analysis-audit.py` - Test file that:
   - Uses moto to mock AWS services
   - Tests each of the three audit functions
   - Verifies correct detection logic

Key considerations:

- Handle exceptions gracefully
- Make the script configurable (e.g., log group patterns)
- Ensure the script can work with moto server on port 5001
- Make output formats useful for both dashboard (JSON) and FinOps team (CSV)
- Include relevant metadata in outputs (timestamps, costs if available, etc.)

Let me write the code:

### Answer

---

I'll create a comprehensive AWS audit script with tests for finding cost optimization opportunities and security issues. Here's my solution:

## lib/analyse.py

```python
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
```

## test/test-analysis-audit.py

```python
#!/usr/bin/env python3
"""
Test suite for AWS resource audit script using moto
"""

import json
import csv
import os
import sys
import unittest
from datetime import datetime
import boto3
from moto import mock_ec2, mock_logs
import pytest

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from analyse import AWSAuditor


class TestAWSAuditor(unittest.TestCase):
    """Test cases for AWSAuditor using moto mocks"""

    @mock_ec2
    def test_find_zombie_volumes(self):
        """Test detection of unattached EBS volumes"""
        # Setup
        ec2 = boto3.client('ec2', region_name='us-east-1')
        auditor = AWSAuditor()

        # Create attached volume (should not be detected)
        instance = ec2.run_instances(ImageId='ami-12345', MinCount=1, MaxCount=1)
        instance_id = instance['Instances'][0]['InstanceId']

        attached_volume = ec2.create_volume(
            AvailabilityZone='us-east-1a',
            Size=100,
            VolumeType='gp2',
            TagSpecifications=[{
                'ResourceType': 'volume',
                'Tags': [{'Key': 'Name', 'Value': 'attached-volume'}]
            }]
        )
        ec2.attach_volume(
            VolumeId=attached_volume['VolumeId'],
            InstanceId=instance_id,
            Device='/dev/sdf'
        )

        # Create zombie volumes (should be detected)
        zombie1 = ec2.create_volume(
            AvailabilityZone='us-east-1a',
            Size=50,
            VolumeType='gp2',
            TagSpecifications=[{
                'ResourceType': 'volume',
                'Tags': [{'Key': 'Name', 'Value': 'zombie-1'}]
            }]
        )

        zombie2 = ec2.create_volume(
            AvailabilityZone='us-east-1b',
            Size=200,
            VolumeType='gp3',
            TagSpecifications=[{
                'ResourceType': 'volume',
                'Tags': [{'Key': 'Environment', 'Value': 'test'}]
            }]
        )

        # Run test
        zombies = auditor.find_zombie_volumes()

        # Assertions
        self.assertEqual(len(zombies), 2)

        # Check zombie1
        zombie1_result = next((z for z in zombies if z['volume_id'] == zombie1['VolumeId']), None)
        self.assertIsNotNone(zombie1_result)
        self.assertEqual(zombie1_result['size_gb'], 50)
        self.assertEqual(zombie1_result['volume_type'], 'gp2')
        self.assertEqual(zombie1_result['estimated_monthly_cost'], 5.0)  # 50 * 0.10
        self.assertEqual(zombie1_result['tags']['Name'], 'zombie-1')

        # Check zombie2
        zombie2_result = next((z for z in zombies if z['volume_id'] == zombie2['VolumeId']), None)
        self.assertIsNotNone(zombie2_result)
        self.assertEqual(zombie2_result['size_gb'], 200)
        self.assertEqual(zombie2_result['volume_type'], 'gp3')
        self.assertEqual(zombie2_result['estimated_monthly_cost'], 16.0)  # 200 * 0.08

    @mock_ec2
    def test_find_wide_open_security_groups(self):
        """Test detection of security groups with risky inbound rules"""
        # Setup
        ec2 = boto3.client('ec2', region_name='us-east-1')
        auditor = AWSAuditor()

        # Create VPC
        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']

        # Create safe security group (should not be detected)
        safe_sg = ec2.create_security_group(
            GroupName='safe-sg',
            Description='Safe security group',
            VpcId=vpc_id
        )
        ec2.authorize_security_group_ingress(
            GroupId=safe_sg['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '10.0.0.0/16', 'Description': 'Internal only'}]
            }]
        )

        # Create risky security groups (should be detected)
        risky_sg1 = ec2.create_security_group(
            GroupName='risky-ssh',
            Description='SSH open to world',
            VpcId=vpc_id
        )
        ec2.authorize_security_group_ingress(
            GroupId=risky_sg1['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 22,
                'ToPort': 22,
                'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'SSH from anywhere'}]
            }]
        )

        risky_sg2 = ec2.create_security_group(
            GroupName='risky-all',
            Description='All ports open',
            VpcId=vpc_id
        )
        ec2.authorize_security_group_ingress(
            GroupId=risky_sg2['GroupId'],
            IpPermissions=[
                {
                    'IpProtocol': '-1',  # All protocols
                    'IpRanges': [{'CidrIp': '0.0.0.0/0', 'Description': 'All traffic'}]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 3389,
                    'ToPort': 3389,
                    'Ipv6Ranges': [{'CidrIpv6': '::/0', 'Description': 'RDP from anywhere IPv6'}]
                }
            ]
        )

        # Run test
        risky_groups = auditor.find_wide_open_security_groups()

        # Assertions
        self.assertEqual(len(risky_groups), 2)

        # Check risky_sg1
        sg1_result = next((sg for sg in risky_groups if sg['group_name'] == 'risky-ssh'), None)
        self.assertIsNotNone(sg1_result)
        self.assertEqual(len(sg1_result['risky_rules']), 1)
        self.assertEqual(sg1_result['risky_rules'][0]['from_port'], 22)
        self.assertEqual(sg1_result['risky_rules'][0]['cidr'], '0.0.0.0/0')

        # Check risky_sg2
        sg2_result = next((sg for sg in risky_groups if sg['group_name'] == 'risky-all'), None)
        self.assertIsNotNone(sg2_result)
        self.assertEqual(len(sg2_result['risky_rules']), 2)

        # Check for IPv4 rule
        ipv4_rule = next((r for r in sg2_result['risky_rules'] if r['cidr'] == '0.0.0.0/0'), None)
        self.assertIsNotNone(ipv4_rule)
        self.assertEqual(ipv4_rule['protocol'], '-1')

        # Check for IPv6 rule
        ipv6_rule = next((r for r in sg2_result['risky_rules'] if r['cidr'] == '::/0'), None)
        self.assertIsNotNone(ipv6_rule)
        self.assertEqual(ipv6_rule['from_port'], 3389)

    @mock_logs
    def test_calculate_log_costs(self):
        """Test CloudWatch log cost calculation"""
        # Setup
        logs = boto3.client('logs', region_name='us-east-1')
        auditor = AWSAuditor()

        # Create log groups
        # Matching groups
        logs.create_log_group(logGroupName='/aws/lambda/production-app-api')
        logs.create_log_group(logGroupName='/aws/lambda/production-app-worker')

        # Non-matching group
        logs.create_log_group(logGroupName='/aws/lambda/development-app-api')

        # Add log streams to matching groups
        for i in range(5):
            logs.create_log_stream(
                logGroupName='/aws/lambda/production-app-api',
                logStreamName=f'stream-{i}'
            )

        for i in range(3):
            logs.create_log_stream(
                logGroupName='/aws/lambda/production-app-worker',
                logStreamName=f'stream-{i}'
            )

        # Note: Moto doesn't properly simulate storedBytes, so we'll test the structure

        # Run test
        log_stats = auditor.calculate_log_costs('/aws/lambda/production-app-*')

        # Assertions
        self.assertEqual(log_stats['pattern'], '/aws/lambda/production-app-*')
        self.assertEqual(log_stats['total_groups'], 2)
        self.assertEqual(log_stats['total_streams'], 8)  # 5 + 3

        # Check group details
        group_names = [g['log_group_name'] for g in log_stats['groups']]
        self.assertIn('/aws/lambda/production-app-api', group_names)
        self.assertIn('/aws/lambda/production-app-worker', group_names)
        self.assertNotIn('/aws/lambda/development-app-api', group_names)

        # Check stream counts
        api_group = next((g for g in log_stats['groups'] if g['log_group_name'] == '/aws/lambda/production-app-api'), None)
        self.assertIsNotNone(api_group)
        self.assertEqual(api_group['stream_count'], 5)

    @mock_ec2
    @mock_logs
    def test_full_audit_and_reporting(self):
        """Test complete audit workflow including report generation"""
        # Setup
        ec2 = boto3.client('ec2', region_name='us-east-1')
        logs = boto3.client('logs', region_name='us-east-1')
        auditor = AWSAuditor()

        # Create test resources
        # Zombie volume
        ec2.create_volume(
            AvailabilityZone='us-east-1a',
            Size=100,
            VolumeType='gp2'
        )

        # Risky security group
        sg = ec2.create_security_group(
            GroupName='test-risky',
            Description='Test risky group'
        )
        ec2.authorize_security_group_ingress(
            GroupId=sg['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        )

        # Log group
        logs.create_log_group(logGroupName='/aws/lambda/production-app-test')

        # Run audit
        results = auditor.run_audit()

        # Save reports
        json_file = 'test_report.json'
        csv_file = 'test_report.csv'

        try:
            auditor.save_reports(results, json_file, csv_file)

            # Verify JSON report
            self.assertTrue(os.path.exists(json_file))
            with open(json_file, 'r') as f:
                json_data = json.load(f)
                self.assertIn('audit_timestamp', json_data)
                self.assertIn('zombie_volumes', json_data)
                self.assertIn('wide_open_security_groups', json_data)
                self.assertIn('log_costs', json_data)
                self.assertIn('summary', json_data)

            # Verify CSV report
            self.assertTrue(os.path.exists(csv_file))
            with open(csv_file, 'r') as f:
                csv_content = f.read()
                self.assertIn('AWS Resource Audit Report', csv_content)
                self.assertIn('Zombie Volumes', csv_content)
                self.assertIn('Wide-Open Security Groups', csv_content)
                self.assertIn('CloudWatch Log Costs', csv_content)

        finally:
            # Cleanup
            if os.path.exists(json_file):
                os.remove(json_file)
            if os.path.exists(csv_file):
                os.remove(csv_file)

    def test_moto_server_integration(self):
        """Test integration with moto server on port 5001"""
        # This test demonstrates how to use the script with a moto server
        # In CI, set AWS_ENDPOINT_URL environment variable
        endpoint_url = 'http://localhost:5001'

        # Check if moto server is available (skip if not)
        try:
            test_client = boto3.client('ec2',
                                     region_name='us-east-1',
                                     endpoint_url=endpoint_url)
            test_client.describe_instances()
        except Exception:
            self.skipTest("Moto server not available on port 5001")

        # If server is available, create auditor with endpoint
        auditor = AWSAuditor(endpoint_url=endpoint_url)

        # Verify it can run without errors
        results = auditor.run_audit()
        self.assertIsInstance(results, dict)
        self.assertIn('zombie_volumes', results)


if __name__ == '__main__':
    # Run tests
    unittest.main()
```

## Key Features

### Main Script (`lib/analyse.py`):

1. **Zombie Volume Detection**:
   - Finds all EBS volumes in 'available' state
   - Calculates estimated monthly costs based on volume type
   - Includes volume metadata and tags

2. **Security Group Analysis**:
   - Identifies groups with inbound rules open to 0.0.0.0/0 or ::/0
   - Captures all risky rules with port ranges and protocols
   - Works with both EC2-Classic and VPC security groups

3. **CloudWatch Log Cost Analysis**:
   - Matches log groups by pattern (supports wildcards)
   - Calculates average stream sizes
   - Estimates monthly storage costs
   - Handles pagination for large environments

4. **Reporting**:
   - Generates both JSON (for dashboards) and CSV (for Excel analysis)
   - Includes summary statistics and detailed findings
   - Human-readable formatting with cost estimates

### Test Suite (`test/test-analysis-audit.py`):

1. **Comprehensive Coverage**:
   - Tests each audit function independently
   - Verifies correct detection logic
   - Tests report generation

2. **Moto Integration**:
   - Uses moto decorators for unit tests
   - Includes example for moto server integration
   - Handles both mock and real endpoints

3. **Edge Cases**:
   - Tests with attached vs unattached volumes
   - Tests multiple types of risky security rules
   - Handles groups with no matching log patterns

## Usage

### Running the main script:

```bash
# Against real AWS
python lib/analyse.py

# Against moto server
export AWS_ENDPOINT_URL=http://localhost:5001
python lib/analyse.py
```

### Running tests:

```bash
# Run all tests
python -m pytest test/test-analysis-audit.py -v

# Or using unittest
python test/test-analysis-audit.py
```

The script will generate `report.json` and `report.csv` files with detailed findings and cost estimates for your FinOps team to analyze.

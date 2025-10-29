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
from moto import mock_aws
import pytest

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from analyse import AWSAuditor


class TestAWSAuditor(unittest.TestCase):
    """Test cases for AWSAuditor using moto mocks"""

    @mock_aws
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

    @mock_aws
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

    @mock_aws
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

    @mock_aws
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

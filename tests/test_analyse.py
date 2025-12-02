"""Unit tests for FinOps Analyzer using Moto mocks."""

import json
import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

import boto3
from moto import mock_aws

# Add lib to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

from analyse import FinOpsAnalyzer


class TestFinOpsAnalyzerInit(unittest.TestCase):
    """Test FinOpsAnalyzer initialization."""

    @mock_aws
    def test_init_default_region(self):
        """Test analyzer initializes with default region."""
        analyzer = FinOpsAnalyzer()
        self.assertEqual(analyzer.region, 'us-east-1')
        self.assertIsNotNone(analyzer.ec2_client)
        self.assertIsNotNone(analyzer.elb_client)
        self.assertIsNotNone(analyzer.cloudwatch_client)
        self.assertIsNotNone(analyzer.s3_client)
        self.assertEqual(analyzer.findings, [])

    @mock_aws
    def test_init_custom_region(self):
        """Test analyzer initializes with custom region."""
        analyzer = FinOpsAnalyzer(region='us-west-2')
        self.assertEqual(analyzer.region, 'us-west-2')


class TestHasRdTag(unittest.TestCase):
    """Test the has_rd_tag method."""

    @mock_aws
    def test_has_rd_tag_true(self):
        """Test returns True when CostCenter R&D tag exists."""
        analyzer = FinOpsAnalyzer()
        tags = [
            {'Key': 'Environment', 'Value': 'Production'},
            {'Key': 'CostCenter', 'Value': 'R&D'}
        ]
        self.assertTrue(analyzer.has_rd_tag(tags))

    @mock_aws
    def test_has_rd_tag_false(self):
        """Test returns False when CostCenter R&D tag does not exist."""
        analyzer = FinOpsAnalyzer()
        tags = [
            {'Key': 'Environment', 'Value': 'Production'},
            {'Key': 'CostCenter', 'Value': 'Engineering'}
        ]
        self.assertFalse(analyzer.has_rd_tag(tags))

    @mock_aws
    def test_has_rd_tag_empty(self):
        """Test returns False for empty tags."""
        analyzer = FinOpsAnalyzer()
        self.assertFalse(analyzer.has_rd_tag([]))

    @mock_aws
    def test_has_rd_tag_none(self):
        """Test returns False for None tags."""
        analyzer = FinOpsAnalyzer()
        self.assertFalse(analyzer.has_rd_tag(None))


class TestGetCloudwatchMetricSum(unittest.TestCase):
    """Test the get_cloudwatch_metric_sum method."""

    @mock_aws
    def test_get_metric_sum_no_data(self):
        """Test returns 0.0 when no datapoints exist."""
        analyzer = FinOpsAnalyzer()
        result = analyzer.get_cloudwatch_metric_sum(
            namespace='AWS/EC2',
            metric_name='CPUUtilization',
            dimensions=[{'Name': 'InstanceId', 'Value': 'i-12345'}],
            days=7
        )
        self.assertEqual(result, 0.0)

    @mock_aws
    def test_get_metric_sum_with_exception(self):
        """Test returns 0.0 when exception occurs."""
        analyzer = FinOpsAnalyzer()
        # Mock cloudwatch client to raise an exception
        analyzer.cloudwatch_client = MagicMock()
        analyzer.cloudwatch_client.get_metric_statistics.side_effect = Exception(
            "Test error"
        )
        result = analyzer.get_cloudwatch_metric_sum(
            namespace='AWS/EC2',
            metric_name='CPUUtilization',
            dimensions=[{'Name': 'InstanceId', 'Value': 'i-12345'}],
            days=7
        )
        self.assertEqual(result, 0.0)


class TestAnalyzeElasticIps(unittest.TestCase):
    """Test the analyze_elastic_ips method."""

    @mock_aws
    def test_unassociated_eip_detected(self):
        """Test that unassociated EIPs are detected."""
        # Create EC2 client and allocate an EIP
        ec2 = boto3.client('ec2', region_name='us-east-1')
        eip = ec2.allocate_address(Domain='vpc')

        analyzer = FinOpsAnalyzer()
        analyzer.analyze_elastic_ips()

        # Should find one unassociated EIP
        self.assertEqual(len(analyzer.findings), 1)
        self.assertEqual(analyzer.findings[0]['WasteType'], 'UnassociatedEIP')
        self.assertEqual(analyzer.findings[0]['EstimatedMonthlySavings'], 3.60)

    @mock_aws
    def test_eip_with_rd_tag_skipped(self):
        """Test that EIPs with R&D tag are skipped."""
        ec2 = boto3.client('ec2', region_name='us-east-1')
        eip = ec2.allocate_address(Domain='vpc')

        # Add R&D tag to the EIP
        ec2.create_tags(
            Resources=[eip['AllocationId']],
            Tags=[{'Key': 'CostCenter', 'Value': 'R&D'}]
        )

        analyzer = FinOpsAnalyzer()
        analyzer.analyze_elastic_ips()

        # Should find no findings since it's tagged R&D
        self.assertEqual(len(analyzer.findings), 0)

    @mock_aws
    def test_eip_attached_to_stopped_instance(self):
        """Test that EIPs attached to stopped instances are detected."""
        ec2 = boto3.client('ec2', region_name='us-east-1')

        # Create a VPC and subnet first
        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        subnet = ec2.create_subnet(
            VpcId=vpc['Vpc']['VpcId'],
            CidrBlock='10.0.1.0/24'
        )

        # Create and stop an instance
        instances = ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t2.micro',
            SubnetId=subnet['Subnet']['SubnetId']
        )
        instance_id = instances['Instances'][0]['InstanceId']
        ec2.stop_instances(InstanceIds=[instance_id])

        # Allocate and associate EIP
        eip = ec2.allocate_address(Domain='vpc')
        ec2.associate_address(
            AllocationId=eip['AllocationId'],
            InstanceId=instance_id
        )

        analyzer = FinOpsAnalyzer()
        analyzer.analyze_elastic_ips()

        # Should find EIP attached to stopped instance
        eip_findings = [
            f for f in analyzer.findings
            if f['WasteType'] == 'EIPAttachedToStoppedInstance'
        ]
        self.assertEqual(len(eip_findings), 1)


class TestAnalyzeS3Buckets(unittest.TestCase):
    """Test the analyze_s3_buckets method."""

    @mock_aws
    def test_bucket_with_versioning_no_lifecycle(self):
        """Test bucket with versioning but no lifecycle policy is detected."""
        s3 = boto3.client('s3', region_name='us-east-1')

        # Create bucket and enable versioning
        s3.create_bucket(Bucket='test-bucket-versioning')
        s3.put_bucket_versioning(
            Bucket='test-bucket-versioning',
            VersioningConfiguration={'Status': 'Enabled'}
        )

        analyzer = FinOpsAnalyzer()
        analyzer.analyze_s3_buckets()

        # Should find versioning without expiration
        versioning_findings = [
            f for f in analyzer.findings
            if f['WasteType'] == 'S3VersioningWithoutExpiration'
        ]
        self.assertEqual(len(versioning_findings), 1)

    @mock_aws
    def test_bucket_with_rd_tag_skipped(self):
        """Test that buckets with R&D tag are skipped."""
        s3 = boto3.client('s3', region_name='us-east-1')

        # Create bucket with R&D tag
        s3.create_bucket(Bucket='test-bucket-rd')
        s3.put_bucket_tagging(
            Bucket='test-bucket-rd',
            Tagging={'TagSet': [{'Key': 'CostCenter', 'Value': 'R&D'}]}
        )
        s3.put_bucket_versioning(
            Bucket='test-bucket-rd',
            VersioningConfiguration={'Status': 'Enabled'}
        )

        analyzer = FinOpsAnalyzer()
        analyzer.analyze_s3_buckets()

        # Should find no findings for R&D bucket
        bucket_findings = [
            f for f in analyzer.findings
            if 'test-bucket-rd' in f.get('ResourceId', '')
        ]
        self.assertEqual(len(bucket_findings), 0)


class TestAnalyzeIdleAlbs(unittest.TestCase):
    """Test the analyze_idle_albs method."""

    @mock_aws
    def test_idle_alb_detected(self):
        """Test that idle ALBs with low request count are detected."""
        # Create VPC and subnets for ALB
        ec2 = boto3.client('ec2', region_name='us-east-1')
        elbv2 = boto3.client('elbv2', region_name='us-east-1')

        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']

        subnet1 = ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.0.1.0/24',
            AvailabilityZone='us-east-1a'
        )
        subnet2 = ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.0.2.0/24',
            AvailabilityZone='us-east-1b'
        )

        # Create security group
        sg = ec2.create_security_group(
            GroupName='test-sg',
            Description='Test security group',
            VpcId=vpc_id
        )

        # Create ALB
        alb = elbv2.create_load_balancer(
            Name='test-idle-alb',
            Subnets=[
                subnet1['Subnet']['SubnetId'],
                subnet2['Subnet']['SubnetId']
            ],
            SecurityGroups=[sg['GroupId']],
            Scheme='internet-facing',
            Type='application'
        )

        analyzer = FinOpsAnalyzer()
        analyzer.analyze_idle_albs()

        # Should find idle ALB (no traffic = 0 requests < 1000)
        alb_findings = [
            f for f in analyzer.findings
            if f['WasteType'] == 'IdleALB'
        ]
        self.assertEqual(len(alb_findings), 1)
        self.assertEqual(alb_findings[0]['EstimatedMonthlySavings'], 18.40)


class TestRunAnalysis(unittest.TestCase):
    """Test the run_analysis method."""

    @mock_aws
    def test_run_analysis_returns_findings(self):
        """Test run_analysis executes all analyzers and returns findings."""
        analyzer = FinOpsAnalyzer()
        findings = analyzer.run_analysis()
        self.assertIsInstance(findings, list)

    @mock_aws
    def test_run_analysis_handles_exceptions(self):
        """Test run_analysis handles exceptions gracefully."""
        analyzer = FinOpsAnalyzer()
        # Mock one analyzer to raise an exception
        analyzer.analyze_idle_albs = MagicMock(side_effect=Exception("Test"))

        # Should not raise, should continue with other analyzers
        findings = analyzer.run_analysis()
        self.assertIsInstance(findings, list)


class TestGenerateReport(unittest.TestCase):
    """Test the generate_report method."""

    @mock_aws
    def test_generate_report_no_findings(self):
        """Test report generation with no findings."""
        analyzer = FinOpsAnalyzer()
        # Should not raise any exceptions
        analyzer.generate_report()

    @mock_aws
    def test_generate_report_with_findings(self):
        """Test report generation with findings creates JSON file."""
        # Create an unassociated EIP to generate a finding
        ec2 = boto3.client('ec2', region_name='us-east-1')
        ec2.allocate_address(Domain='vpc')

        analyzer = FinOpsAnalyzer()
        analyzer.generate_report()

        # Check that JSON report was created
        self.assertTrue(os.path.exists('finops_report.json'))

        # Verify report contents
        with open('finops_report.json', 'r', encoding='utf-8') as f:
            report = json.load(f)

        self.assertIn('report_date', report)
        self.assertIn('region', report)
        self.assertIn('total_findings', report)
        self.assertIn('findings', report)
        self.assertGreater(report['total_findings'], 0)

        # Cleanup
        os.remove('finops_report.json')


if __name__ == '__main__':
    unittest.main()


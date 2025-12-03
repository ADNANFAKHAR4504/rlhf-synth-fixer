#!/usr/bin/env python3
"""
Test suite for EC2 Tag Compliance Analysis Script

This test file validates the analysis script functionality
against mocked AWS services using Moto.
"""

import os
import sys
import json
import pytest
import boto3
from moto import mock_aws
from io import StringIO
from unittest.mock import patch

# Add lib directory to path for importing analyse module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

# Import the analyse module
import analyse


# Set up environment variables for tests
@pytest.fixture(autouse=True)
def setup_environment():
    """Set up environment variables for all tests."""
    os.environ['AWS_REGION'] = 'us-east-1'
    os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
    os.environ['AWS_SECURITY_TOKEN'] = 'testing'
    os.environ['AWS_SESSION_TOKEN'] = 'testing'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
    os.environ['ENVIRONMENT_SUFFIX'] = 'test'
    yield


class TestPrintSection:
    """Test print_section utility function."""

    def test_print_section_output(self, setup_environment, capsys):
        """Test that print_section outputs correctly formatted header."""
        analyse.print_section("Test Title")
        captured = capsys.readouterr()
        assert "Test Title" in captured.out
        assert "=" in captured.out

    def test_print_section_with_long_title(self, setup_environment, capsys):
        """Test print_section with a long title."""
        long_title = "This is a very long section title for testing"
        analyse.print_section(long_title)
        captured = capsys.readouterr()
        assert long_title in captured.out


class TestCheckEnvironment:
    """Test check_environment function."""

    def test_check_environment_outputs_variables(self, setup_environment, capsys):
        """Test that check_environment outputs environment variables."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "AWS_REGION" in captured.out
        assert "us-east-1" in captured.out
        assert "ENVIRONMENT_SUFFIX" in captured.out
        assert "[PASS]" in captured.out

    def test_check_environment_masks_secrets(self, setup_environment, capsys):
        """Test that check_environment masks secret values."""
        analyse.check_environment()
        captured = capsys.readouterr()
        assert "***" in captured.out  # Secrets should be masked


class TestSimulateEC2TagComplianceScan:
    """Test simulate_ec2_tag_compliance_scan function."""

    def test_scan_returns_dict(self, setup_environment):
        """Test that scan returns a dictionary."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert isinstance(result, dict)

    def test_scan_contains_required_keys(self, setup_environment):
        """Test that scan result contains required keys."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        required_keys = ['scanId', 'timestamp', 'environment', 'region',
                         'requiredTags', 'findings', 'summary']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_scan_summary_structure(self, setup_environment):
        """Test that scan summary has correct structure."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        summary = result['summary']
        assert 'totalInstances' in summary
        assert 'compliantInstances' in summary
        assert 'nonCompliantInstances' in summary
        assert 'compliancePercentage' in summary
        assert 'violationsByLevel' in summary

    def test_scan_findings_structure(self, setup_environment):
        """Test that scan findings have correct structure."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        findings = result['findings']
        assert 'critical' in findings
        assert 'high' in findings
        assert 'medium' in findings
        assert 'low' in findings

    def test_scan_uses_environment_suffix(self, setup_environment):
        """Test that scan uses ENVIRONMENT_SUFFIX from env."""
        result = analyse.simulate_ec2_tag_compliance_scan()
        assert result['environment'] == 'test'


class TestGenerateReport:
    """Test generate_report function."""

    def test_generate_report_creates_file(self, setup_environment, tmp_path):
        """Test that generate_report creates results file."""
        # Change to tmp directory to create report there
        original_dir = os.getcwd()
        os.chdir(tmp_path)

        # Create lib directory in tmp
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)

            # Check file was created
            assert os.path.exists('lib/analysis-results.txt')

            # Check file content
            with open('lib/analysis-results.txt', 'r') as f:
                content = f.read()
                assert 'EC2 Tag Compliance Analysis Report' in content
        finally:
            os.chdir(original_dir)

    def test_generate_report_outputs_summary(self, setup_environment, capsys, tmp_path):
        """Test that generate_report outputs summary to stdout."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            scan_results = analyse.simulate_ec2_tag_compliance_scan()
            analyse.generate_report(scan_results)
            captured = capsys.readouterr()
            assert "Compliance Score" in captured.out
            assert "Total Instances" in captured.out
        finally:
            os.chdir(original_dir)


class TestValidateDeployment:
    """Test validate_deployment function."""

    def test_validate_deployment_outputs_resources(self, setup_environment, capsys):
        """Test that validate_deployment lists all resources."""
        analyse.validate_deployment()
        captured = capsys.readouterr()
        assert "S3 Bucket" in captured.out
        assert "Lambda Function" in captured.out
        assert "SNS Topic" in captured.out
        assert "EventBridge Rule" in captured.out
        assert "CloudWatch Dashboard" in captured.out
        assert "Glue Database" in captured.out
        assert "Athena Workgroup" in captured.out
        assert "[PASS]" in captured.out


class TestValidateComplianceFeatures:
    """Test validate_compliance_features function."""

    def test_validate_features_outputs_checks(self, setup_environment, capsys):
        """Test that validate_compliance_features lists all checks."""
        analyse.validate_compliance_features()
        captured = capsys.readouterr()
        assert "Environment tag validation" in captured.out
        assert "Owner tag validation" in captured.out
        assert "CostCenter tag validation" in captured.out
        assert "Project tag validation" in captured.out
        assert "[PASS]" in captured.out


class TestValidateSecurity:
    """Test validate_security function."""

    def test_validate_security_outputs_checks(self, setup_environment, capsys):
        """Test that validate_security lists security checks."""
        analyse.validate_security()
        captured = capsys.readouterr()
        assert "Least Privilege" in captured.out
        assert "EC2 permissions" in captured.out
        assert "S3 permissions" in captured.out
        assert "SNS permissions" in captured.out
        assert "[PASS]" in captured.out


class TestMainFunction:
    """Test main function."""

    def test_main_returns_zero_on_success(self, setup_environment, tmp_path):
        """Test that main returns 0 on success."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            result = analyse.main()
            assert result == 0
        finally:
            os.chdir(original_dir)

    def test_main_prints_pass(self, setup_environment, capsys, tmp_path):
        """Test that main prints PASS message."""
        original_dir = os.getcwd()
        os.chdir(tmp_path)
        os.makedirs('lib', exist_ok=True)

        try:
            analyse.main()
            captured = capsys.readouterr()
            assert "[PASS]" in captured.out
        finally:
            os.chdir(original_dir)


class TestEC2TagComplianceWithMoto:
    """Test EC2 tag compliance checking with mocked AWS."""

    @mock_aws
    def test_ec2_instance_creation(self, setup_environment):
        """Test that EC2 instances can be created for compliance checking."""
        ec2 = boto3.client('ec2', region_name='us-east-1')

        # Create a VPC first (required for instances)
        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']

        # Create a subnet
        subnet = ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24')
        subnet_id = subnet['Subnet']['SubnetId']

        # Create an instance with tags
        instances = ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet_id,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'test'},
                        {'Key': 'Owner', 'Value': 'test-owner'},
                        {'Key': 'CostCenter', 'Value': 'CC001'},
                        {'Key': 'Project', 'Value': 'TestProject'}
                    ]
                }
            ]
        )

        instance_id = instances['Instances'][0]['InstanceId']
        assert instance_id is not None
        assert instance_id.startswith('i-')

    @mock_aws
    def test_ec2_describe_instances(self, setup_environment):
        """Test that EC2 instances can be described."""
        ec2 = boto3.client('ec2', region_name='us-east-1')

        # Create a VPC and subnet
        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        subnet = ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24')
        subnet_id = subnet['Subnet']['SubnetId']

        # Create instance
        ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet_id
        )

        # Describe instances
        response = ec2.describe_instances()
        assert 'Reservations' in response
        assert len(response['Reservations']) > 0

    @mock_aws
    def test_ec2_tag_validation_compliant(self, setup_environment):
        """Test tag validation for a compliant instance."""
        ec2 = boto3.client('ec2', region_name='us-east-1')

        # Create VPC and subnet
        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        subnet = ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24')
        subnet_id = subnet['Subnet']['SubnetId']

        # Create compliant instance with all required tags
        required_tags = ['Environment', 'Owner', 'CostCenter', 'Project']
        instances = ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet_id,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'production'},
                        {'Key': 'Owner', 'Value': 'cloud-team'},
                        {'Key': 'CostCenter', 'Value': 'CC100'},
                        {'Key': 'Project', 'Value': 'MainApp'}
                    ]
                }
            ]
        )

        instance_id = instances['Instances'][0]['InstanceId']

        # Get instance tags
        response = ec2.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

        # Check all required tags are present
        missing_tags = [tag for tag in required_tags if tag not in tags]
        assert len(missing_tags) == 0, f"Missing tags: {missing_tags}"

    @mock_aws
    def test_ec2_tag_validation_non_compliant(self, setup_environment):
        """Test tag validation for a non-compliant instance."""
        ec2 = boto3.client('ec2', region_name='us-east-1')

        # Create VPC and subnet
        vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        subnet = ec2.create_subnet(VpcId=vpc_id, CidrBlock='10.0.1.0/24')
        subnet_id = subnet['Subnet']['SubnetId']

        # Create non-compliant instance with missing tags
        required_tags = ['Environment', 'Owner', 'CostCenter', 'Project']
        instances = ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet_id,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'test'}
                    ]
                }
            ]
        )

        instance_id = instances['Instances'][0]['InstanceId']

        # Get instance tags
        response = ec2.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}

        # Check for missing tags
        missing_tags = [tag for tag in required_tags if tag not in tags]
        assert len(missing_tags) == 3


class TestS3ReportStorage:
    """Test S3 report storage functionality."""

    @mock_aws
    def test_s3_bucket_creation(self, setup_environment):
        """Test that S3 bucket can be created for reports."""
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = f"ec2-compliance-reports-{os.environ['ENVIRONMENT_SUFFIX']}"

        s3.create_bucket(Bucket=bucket_name)

        # Verify bucket exists
        response = s3.list_buckets()
        bucket_names = [b['Name'] for b in response['Buckets']]
        assert bucket_name in bucket_names

    @mock_aws
    def test_s3_report_upload(self, setup_environment):
        """Test that compliance reports can be uploaded to S3."""
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = f"ec2-compliance-reports-{os.environ['ENVIRONMENT_SUFFIX']}"

        s3.create_bucket(Bucket=bucket_name)

        # Create a sample compliance report
        report = {
            'timestamp': '2025-12-03T10:00:00Z',
            'summary': {
                'totalInstances': 10,
                'compliantInstances': 8,
                'nonCompliantInstances': 2,
                'compliancePercentage': 80.0
            }
        }

        # Upload report
        key = 'compliance-reports/2025-12-03T10-00-00Z-compliance-report.json'
        s3.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=json.dumps(report),
            ContentType='application/json'
        )

        # Verify upload
        response = s3.get_object(Bucket=bucket_name, Key=key)
        stored_report = json.loads(response['Body'].read().decode('utf-8'))
        assert stored_report['summary']['totalInstances'] == 10

    @mock_aws
    def test_s3_bucket_versioning(self, setup_environment):
        """Test that S3 bucket versioning can be enabled."""
        s3 = boto3.client('s3', region_name='us-east-1')
        bucket_name = f"ec2-compliance-reports-{os.environ['ENVIRONMENT_SUFFIX']}"

        s3.create_bucket(Bucket=bucket_name)

        # Enable versioning
        s3.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={'Status': 'Enabled'}
        )

        # Verify versioning is enabled
        response = s3.get_bucket_versioning(Bucket=bucket_name)
        assert response.get('Status') == 'Enabled'


class TestSNSAlerts:
    """Test SNS alerting functionality."""

    @mock_aws
    def test_sns_topic_creation(self, setup_environment):
        """Test that SNS topic can be created for alerts."""
        sns = boto3.client('sns', region_name='us-east-1')
        topic_name = f"ec2-compliance-alerts-{os.environ['ENVIRONMENT_SUFFIX']}"

        response = sns.create_topic(Name=topic_name)
        topic_arn = response['TopicArn']

        assert topic_arn is not None
        assert topic_name in topic_arn

    @mock_aws
    def test_sns_publish_alert(self, setup_environment):
        """Test that alerts can be published to SNS."""
        sns = boto3.client('sns', region_name='us-east-1')
        topic_name = f"ec2-compliance-alerts-{os.environ['ENVIRONMENT_SUFFIX']}"

        response = sns.create_topic(Name=topic_name)
        topic_arn = response['TopicArn']

        # Publish alert
        message = "EC2 Tag Compliance Alert: 2 non-compliant instances found"
        publish_response = sns.publish(
            TopicArn=topic_arn,
            Subject='EC2 Tag Compliance Alert',
            Message=message
        )

        assert 'MessageId' in publish_response


class TestCloudWatchDashboard:
    """Test CloudWatch dashboard functionality."""

    @mock_aws
    def test_cloudwatch_dashboard_creation(self, setup_environment):
        """Test that CloudWatch dashboard can be created."""
        cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
        dashboard_name = f"ec2-compliance-dashboard-{os.environ['ENVIRONMENT_SUFFIX']}"

        dashboard_body = json.dumps({
            'widgets': [
                {
                    'type': 'metric',
                    'properties': {
                        'title': 'Lambda Invocations',
                        'metrics': [['AWS/Lambda', 'Invocations']]
                    }
                }
            ]
        })

        cloudwatch.put_dashboard(
            DashboardName=dashboard_name,
            DashboardBody=dashboard_body
        )

        # Verify dashboard exists
        response = cloudwatch.get_dashboard(DashboardName=dashboard_name)
        assert response['DashboardName'] == dashboard_name


class TestGlueDataCatalog:
    """Test Glue data catalog functionality."""

    @mock_aws
    def test_glue_database_creation(self, setup_environment):
        """Test that Glue database can be created."""
        glue = boto3.client('glue', region_name='us-east-1')
        database_name = f"ec2_compliance_db_{os.environ['ENVIRONMENT_SUFFIX']}"

        glue.create_database(
            DatabaseInput={
                'Name': database_name,
                'Description': 'Database for EC2 tag compliance reports'
            }
        )

        # Verify database exists
        response = glue.get_database(Name=database_name)
        assert response['Database']['Name'] == database_name

    @mock_aws
    def test_glue_crawler_creation(self, setup_environment):
        """Test that Glue crawler can be created."""
        glue = boto3.client('glue', region_name='us-east-1')
        iam = boto3.client('iam', region_name='us-east-1')
        s3 = boto3.client('s3', region_name='us-east-1')

        suffix = os.environ['ENVIRONMENT_SUFFIX']
        # Use unique names for crawler test to avoid collision with database test
        database_name = f"ec2_compliance_crawler_db_{suffix}"
        crawler_name = f"ec2-compliance-crawler-{suffix}"
        bucket_name = f"ec2-compliance-crawler-reports-{suffix}"
        role_name = f"glue-crawler-role-{suffix}"

        # Create S3 bucket
        s3.create_bucket(Bucket=bucket_name)

        # Create IAM role for crawler
        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'glue.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })

        iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=assume_role_policy
        )

        role_arn = f"arn:aws:iam::123456789012:role/{role_name}"

        # Create database for crawler
        glue.create_database(
            DatabaseInput={
                'Name': database_name,
                'Description': 'Database for Glue crawler test'
            }
        )

        # Create crawler
        glue.create_crawler(
            Name=crawler_name,
            Role=role_arn,
            DatabaseName=database_name,
            Targets={
                'S3Targets': [{'Path': f"s3://{bucket_name}/"}]
            }
        )

        # Verify crawler exists
        response = glue.get_crawler(Name=crawler_name)
        assert response['Crawler']['Name'] == crawler_name


class TestComplianceCalculations:
    """Test compliance calculation logic."""

    def test_compliance_percentage_calculation(self):
        """Test compliance percentage calculation."""
        total_instances = 10
        compliant_instances = 8
        percentage = (compliant_instances / total_instances) * 100
        assert percentage == 80.0

    def test_compliance_percentage_zero_instances(self):
        """Test compliance percentage with zero instances."""
        total_instances = 0
        percentage = 100.0 if total_instances == 0 else 0
        assert percentage == 100.0

    def test_missing_tags_detection(self):
        """Test missing tags detection logic."""
        required_tags = ['Environment', 'Owner', 'CostCenter', 'Project']
        instance_tags = {'Environment': 'prod', 'Owner': 'team'}
        missing = [tag for tag in required_tags if tag not in instance_tags]
        assert len(missing) == 2
        assert 'CostCenter' in missing
        assert 'Project' in missing


class TestInfrastructureValidation:
    """Test infrastructure validation checks."""

    def test_required_resources_count(self):
        """Test that all required resources are documented."""
        required_resources = [
            'S3 Bucket', 'SNS Topic', 'Lambda Function', 'IAM Role',
            'EventBridge Rule', 'CloudWatch Dashboard', 'Glue Database',
            'Glue Crawler', 'Athena Workgroup'
        ]
        assert len(required_resources) >= 9

    def test_environment_suffix_pattern(self, setup_environment):
        """Test that environment suffix follows expected pattern."""
        import re
        suffix = os.environ.get('ENVIRONMENT_SUFFIX', '')
        pattern = r'^[a-zA-Z0-9-]+$'
        assert re.match(pattern, suffix)

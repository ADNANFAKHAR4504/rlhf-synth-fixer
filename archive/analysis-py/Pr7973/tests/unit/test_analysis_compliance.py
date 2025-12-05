#!/usr/bin/env python3
"""
Tests for the infrastructure analysis compliance script
"""

import os
import sys
import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from botocore.exceptions import ClientError

# Add lib directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import InfrastructureAnalysisAnalyzer


@pytest.fixture
def mock_aws_clients():
    """Fixture to mock AWS clients"""
    with patch('boto3.client') as mock_client:
        # Create mock clients
        mock_ec2 = MagicMock()
        mock_rds = MagicMock()
        mock_s3 = MagicMock()

        # Configure mock_client to return appropriate mock based on service name
        def get_mock_client(service, **kwargs):
            clients = {
                'ec2': mock_ec2,
                'rds': mock_rds,
                's3': mock_s3
            }
            return clients.get(service, MagicMock())

        mock_client.side_effect = get_mock_client

        yield {
            'ec2': mock_ec2,
            'rds': mock_rds,
            's3': mock_s3
        }


@pytest.fixture
def analyzer(mock_aws_clients):
    """Fixture to create analyzer instance"""
    return InfrastructureAnalysisAnalyzer(
        region='us-east-1',
        endpoint_url='http://localhost:5001'
    )


class TestInfrastructureAnalysisAnalyzer:
    """Test suite for InfrastructureAnalysisAnalyzer"""

    def test_analyzer_initialization(self, analyzer):
        """Test analyzer initializes correctly"""
        assert analyzer.region == 'us-east-1'
        assert analyzer.endpoint_url == 'http://localhost:5001'
        assert analyzer.timestamp is not None

    def test_analyzer_default_region(self, mock_aws_clients):
        """Test analyzer uses default region when not specified"""
        analyzer = InfrastructureAnalysisAnalyzer()
        assert analyzer.region == 'us-east-1'

    def test_analyzer_without_endpoint_url(self, mock_aws_clients):
        """Test analyzer works without endpoint URL"""
        analyzer = InfrastructureAnalysisAnalyzer(region='us-west-2')
        assert analyzer.region == 'us-west-2'
        assert analyzer.endpoint_url is None


class TestEC2InstanceAnalysis:
    """Test suite for EC2 instance analysis"""

    def test_analyze_ec2_instances_success(self, analyzer, mock_aws_clients):
        """Test successful EC2 instance analysis"""
        mock_aws_clients['ec2'].describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'InstanceType': 't3.micro',
                            'State': {'Name': 'running'},
                            'Tags': [
                                {'Key': 'Environment', 'Value': 'dev'},
                                {'Key': 'Name', 'Value': 'test-instance'}
                            ]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_ec2_instances('dev')

        assert result['total_instances'] == 1
        assert len(result['instances']) == 1
        assert len(result['type_violations']) == 0
        assert len(result['issues']) == 0

    def test_analyze_ec2_instances_type_violation(self, analyzer, mock_aws_clients):
        """Test EC2 instance analysis detects type violations"""
        mock_aws_clients['ec2'].describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'InstanceType': 'm5.xlarge',  # Not approved
                            'State': {'Name': 'running'},
                            'Tags': [{'Key': 'Environment', 'Value': 'dev'}]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_ec2_instances('dev')

        assert result['total_instances'] == 1
        assert len(result['type_violations']) == 1
        assert result['type_violations'][0]['instance_type'] == 'm5.xlarge'

    def test_analyze_ec2_instances_cost_warning(self, analyzer, mock_aws_clients):
        """Test EC2 instance analysis detects cost warnings"""
        mock_aws_clients['ec2'].describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'InstanceType': 'm5.xlarge',  # High cost
                            'State': {'Name': 'running'},
                            'Tags': [{'Key': 'Environment', 'Value': 'dev'}]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_ec2_instances('dev')

        assert len(result['cost_warnings']) == 1
        assert result['cost_warnings'][0]['estimated_monthly_cost'] > 100.0

    def test_analyze_ec2_instances_stopped_no_violation(self, analyzer, mock_aws_clients):
        """Test stopped instances don't trigger type violations"""
        mock_aws_clients['ec2'].describe_instances.return_value = {
            'Reservations': [
                {
                    'Instances': [
                        {
                            'InstanceId': 'i-1234567890abcdef0',
                            'InstanceType': 'm5.xlarge',
                            'State': {'Name': 'stopped'},  # Not running
                            'Tags': [{'Key': 'Environment', 'Value': 'dev'}]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_ec2_instances('dev')

        assert result['total_instances'] == 1
        assert len(result['type_violations']) == 0

    def test_analyze_ec2_instances_empty_response(self, analyzer, mock_aws_clients):
        """Test EC2 analysis handles empty response"""
        mock_aws_clients['ec2'].describe_instances.return_value = {
            'Reservations': []
        }

        result = analyzer.analyze_ec2_instances('dev')

        assert result['total_instances'] == 0
        assert len(result['instances']) == 0
        assert len(result['issues']) == 0

    def test_analyze_ec2_instances_api_error(self, analyzer, mock_aws_clients):
        """Test EC2 analysis handles API errors gracefully"""
        mock_aws_clients['ec2'].describe_instances.side_effect = ClientError(
            {'Error': {'Code': 'UnauthorizedOperation', 'Message': 'Access denied'}},
            'DescribeInstances'
        )

        result = analyzer.analyze_ec2_instances('dev')

        assert result['total_instances'] == 0
        assert len(result['issues']) == 1
        assert 'Access denied' in result['issues'][0]

    def test_analyze_ec2_approved_types(self, analyzer, mock_aws_clients):
        """Test all approved instance types pass validation"""
        approved_types = ['t3.micro', 't3.small', 't3.medium']

        for instance_type in approved_types:
            mock_aws_clients['ec2'].describe_instances.return_value = {
                'Reservations': [
                    {
                        'Instances': [
                            {
                                'InstanceId': f'i-{instance_type}',
                                'InstanceType': instance_type,
                                'State': {'Name': 'running'},
                                'Tags': [{'Key': 'Environment', 'Value': 'dev'}]
                            }
                        ]
                    }
                ]
            }

            result = analyzer.analyze_ec2_instances('dev')
            assert len(result['type_violations']) == 0, f"Type {instance_type} should be approved"


class TestRDSAnalysis:
    """Test suite for RDS database analysis"""

    def test_analyze_rds_databases_success(self, analyzer, mock_aws_clients):
        """Test successful RDS database analysis"""
        mock_aws_clients['rds'].describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'mydb-dev',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:mydb-dev',
                    'BackupRetentionPeriod': 7
                }
            ]
        }
        mock_aws_clients['rds'].list_tags_for_resource.return_value = {
            'TagList': [
                {'Key': 'Environment', 'Value': 'dev'}
            ]
        }

        result = analyzer.analyze_rds_databases('dev')

        assert result['total_databases'] == 1
        assert len(result['backup_violations']) == 0

    def test_analyze_rds_databases_backup_violation(self, analyzer, mock_aws_clients):
        """Test RDS analysis detects backup violations"""
        mock_aws_clients['rds'].describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'mydb-dev',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:mydb-dev',
                    'BackupRetentionPeriod': 3  # Less than 7 days
                }
            ]
        }
        mock_aws_clients['rds'].list_tags_for_resource.return_value = {'TagList': []}

        result = analyzer.analyze_rds_databases('dev')

        assert result['total_databases'] == 1
        assert len(result['backup_violations']) == 1
        assert result['backup_violations'][0]['backup_retention_period'] == 3

    def test_analyze_rds_databases_no_backup(self, analyzer, mock_aws_clients):
        """Test RDS analysis detects disabled backups"""
        mock_aws_clients['rds'].describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'mydb-dev',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:mydb-dev',
                    'BackupRetentionPeriod': 0  # Disabled
                }
            ]
        }
        mock_aws_clients['rds'].list_tags_for_resource.return_value = {'TagList': []}

        result = analyzer.analyze_rds_databases('dev')

        assert len(result['backup_violations']) == 1
        assert result['backup_violations'][0]['backup_enabled'] is False

    def test_analyze_rds_databases_filter_by_suffix(self, analyzer, mock_aws_clients):
        """Test RDS analysis filters by environment suffix"""
        mock_aws_clients['rds'].describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'mydb-dev',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:mydb-dev',
                    'BackupRetentionPeriod': 7
                },
                {
                    'DBInstanceIdentifier': 'mydb-prod',
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789012:db:mydb-prod',
                    'BackupRetentionPeriod': 7
                }
            ]
        }
        mock_aws_clients['rds'].list_tags_for_resource.return_value = {'TagList': []}

        result = analyzer.analyze_rds_databases('dev')

        assert result['total_databases'] == 1


class TestS3Analysis:
    """Test suite for S3 bucket analysis"""

    def test_analyze_s3_buckets_success(self, analyzer, mock_aws_clients):
        """Test successful S3 bucket analysis"""
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [
                {'Name': 'mybucket-dev'}
            ]
        }
        mock_aws_clients['s3'].get_bucket_versioning.return_value = {
            'Status': 'Enabled'
        }
        mock_aws_clients['s3'].get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
            }
        }

        result = analyzer.analyze_s3_buckets('dev')

        assert result['total_buckets'] == 1
        assert len(result['compliance_violations']) == 0

    def test_analyze_s3_buckets_no_versioning(self, analyzer, mock_aws_clients):
        """Test S3 analysis detects missing versioning"""
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [{'Name': 'mybucket-dev'}]
        }
        mock_aws_clients['s3'].get_bucket_versioning.return_value = {}
        mock_aws_clients['s3'].get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {'Rules': [{}]}
        }

        result = analyzer.analyze_s3_buckets('dev')

        assert len(result['compliance_violations']) == 1
        assert result['compliance_violations'][0]['versioning_enabled'] is False

    def test_analyze_s3_buckets_no_encryption(self, analyzer, mock_aws_clients):
        """Test S3 analysis detects missing encryption"""
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [{'Name': 'mybucket-dev'}]
        }
        mock_aws_clients['s3'].get_bucket_versioning.return_value = {'Status': 'Enabled'}

        # Mock encryption not found error
        mock_aws_clients['s3'].get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}},
            'GetBucketEncryption'
        )

        result = analyzer.analyze_s3_buckets('dev')

        assert len(result['compliance_violations']) == 1
        assert result['compliance_violations'][0]['encryption_enabled'] is False


class TestSecurityGroupAnalysis:
    """Test suite for security group analysis"""

    def test_analyze_security_groups_success(self, analyzer, mock_aws_clients):
        """Test successful security group analysis"""
        mock_aws_clients['ec2'].describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-12345',
                    'GroupName': 'test-sg',
                    'IpPermissions': [
                        {
                            'FromPort': 443,
                            'ToPort': 443,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_security_groups('dev')

        assert result['total_security_groups'] == 1
        assert len(result['unrestricted_violations']) == 0

    def test_analyze_security_groups_unrestricted_violation(self, analyzer, mock_aws_clients):
        """Test security group analysis detects unrestricted access"""
        mock_aws_clients['ec2'].describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-12345',
                    'GroupName': 'test-sg',
                    'IpPermissions': [
                        {
                            'FromPort': 22,  # SSH - not allowed publicly
                            'ToPort': 22,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_security_groups('dev')

        assert len(result['unrestricted_violations']) == 1
        assert result['unrestricted_violations'][0]['from_port'] == 22


class TestTaggingCompliance:
    """Test suite for tagging compliance analysis"""

    def test_analyze_tagging_compliance_pass(self, analyzer, mock_aws_clients):
        """Test tagging compliance passes with all required tags"""
        ec2_results = {
            'instances': [
                {
                    'id': 'i-12345',
                    'tags': {
                        'Environment': 'dev',
                        'Owner': 'test',
                        'CostCenter': '12345',
                        'Project': 'test-project'
                    }
                }
            ]
        }

        result = analyzer.analyze_tagging_compliance(ec2_results, {'databases': []}, {'buckets': []})

        assert result['compliance_metrics']['compliance_percentage'] == 100.0
        assert len(result['resources_with_violations']) == 0

    def test_analyze_tagging_compliance_missing_tags(self, analyzer, mock_aws_clients):
        """Test tagging compliance detects missing tags"""
        ec2_results = {
            'instances': [
                {
                    'id': 'i-12345',
                    'tags': {'Environment': 'dev'}  # Missing required tags
                }
            ]
        }

        result = analyzer.analyze_tagging_compliance(ec2_results, {'databases': []}, {'buckets': []})

        assert result['compliance_metrics']['compliance_percentage'] < 100
        assert len(result['resources_with_violations']) == 1
        assert 'Owner' in result['resources_with_violations'][0]['missing_tags']


class TestReportGeneration:
    """Test suite for report generation"""

    def test_generate_report(self, analyzer, mock_aws_clients):
        """Test comprehensive report generation"""
        # Mock all service responses
        mock_aws_clients['ec2'].describe_instances.return_value = {'Reservations': []}
        mock_aws_clients['ec2'].describe_security_groups.return_value = {'SecurityGroups': []}
        mock_aws_clients['rds'].describe_db_instances.return_value = {'DBInstances': []}
        mock_aws_clients['s3'].list_buckets.return_value = {'Buckets': []}

        report = analyzer.generate_report('dev')

        assert 'timestamp' in report
        assert 'environment_suffix' in report
        assert report['environment_suffix'] == 'dev'
        assert 'region' in report
        assert report['region'] == 'us-east-1'
        assert 'ec2_analysis' in report
        assert 'rds_analysis' in report
        assert 's3_analysis' in report
        assert 'security_group_analysis' in report
        assert 'tagging_analysis' in report
        assert 'summary' in report

    def test_generate_report_summary_structure(self, analyzer, mock_aws_clients):
        """Test report summary has correct structure"""
        mock_aws_clients['ec2'].describe_instances.return_value = {'Reservations': []}
        mock_aws_clients['ec2'].describe_security_groups.return_value = {'SecurityGroups': []}
        mock_aws_clients['rds'].describe_db_instances.return_value = {'DBInstances': []}
        mock_aws_clients['s3'].list_buckets.return_value = {'Buckets': []}

        report = analyzer.generate_report('dev')

        summary = report['summary']
        assert 'total_resources_analyzed' in summary
        assert 'total_violations' in summary
        assert 'compliance_by_category' in summary
        assert 'overall_compliance_percentage' in summary
        assert 'overall_status' in summary

    def test_generate_report_compliance_status(self, analyzer, mock_aws_clients):
        """Test report shows correct compliance status"""
        # All compliant
        mock_aws_clients['ec2'].describe_instances.return_value = {'Reservations': []}
        mock_aws_clients['ec2'].describe_security_groups.return_value = {'SecurityGroups': []}
        mock_aws_clients['rds'].describe_db_instances.return_value = {'DBInstances': []}
        mock_aws_clients['s3'].list_buckets.return_value = {'Buckets': []}

        report = analyzer.generate_report('dev')

        assert report['summary']['overall_status'] == 'PASS'


class TestMainFunction:
    """Test suite for main function"""

    def test_main_function(self, mock_aws_clients, tmp_path):
        """Test main function execution"""
        # Set environment variables
        os.environ['AWS_REGION'] = 'us-east-1'
        os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:5001'
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'

        # Change to temp directory
        original_dir = os.getcwd()
        os.chdir(tmp_path)

        try:
            # Mock all AWS responses
            mock_aws_clients['ec2'].describe_instances.return_value = {'Reservations': []}
            mock_aws_clients['ec2'].describe_security_groups.return_value = {'SecurityGroups': []}
            mock_aws_clients['rds'].describe_db_instances.return_value = {'DBInstances': []}
            mock_aws_clients['s3'].list_buckets.return_value = {'Buckets': []}

            from analyse import main
            result = main()

            # Check that analysis report was created
            assert os.path.exists('analysis-results.txt')

            # Verify report can be loaded
            with open('analysis-results.txt', 'r') as f:
                report = json.load(f)
                assert 'timestamp' in report
                assert 'environment_suffix' in report

        finally:
            os.chdir(original_dir)

    def test_main_function_with_violations(self, mock_aws_clients, tmp_path):
        """Test main function execution with violations returns exit code 1"""
        # Set environment variables
        os.environ['AWS_REGION'] = 'us-east-1'
        os.environ['AWS_ENDPOINT_URL'] = 'http://localhost:5001'
        os.environ['ENVIRONMENT_SUFFIX'] = 'test'

        # Change to temp directory
        original_dir = os.getcwd()
        os.chdir(tmp_path)

        try:
            # Mock EC2 with violation
            mock_aws_clients['ec2'].describe_instances.return_value = {
                'Reservations': [
                    {
                        'Instances': [
                            {
                                'InstanceId': 'i-12345',
                                'InstanceType': 'm5.xlarge',  # Unapproved type
                                'State': {'Name': 'running'},
                                'Tags': [{'Key': 'Environment', 'Value': 'test'}]
                            }
                        ]
                    }
                ]
            }
            mock_aws_clients['ec2'].describe_security_groups.return_value = {'SecurityGroups': []}
            mock_aws_clients['rds'].describe_db_instances.return_value = {'DBInstances': []}
            mock_aws_clients['s3'].list_buckets.return_value = {'Buckets': []}

            from analyse import main
            result = main()

            # Should return 1 due to violations
            assert result == 1

        finally:
            os.chdir(original_dir)


class TestRDSAnalysisAdditional:
    """Additional RDS analysis tests for coverage"""

    def test_analyze_rds_databases_api_error(self, analyzer, mock_aws_clients):
        """Test RDS analysis handles API errors"""
        mock_aws_clients['rds'].describe_db_instances.side_effect = Exception('API Error')

        result = analyzer.analyze_rds_databases('dev')

        assert 'RDS analysis error' in result['issues'][0]

    def test_analyze_rds_databases_list_tags_error(self, analyzer, mock_aws_clients):
        """Test RDS analysis handles tag listing errors"""
        mock_aws_clients['rds'].describe_db_instances.return_value = {
            'DBInstances': [
                {
                    'DBInstanceIdentifier': 'mydb-dev',
                    'BackupRetentionPeriod': 7,
                    'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789:db:mydb-dev'
                }
            ]
        }
        mock_aws_clients['rds'].list_tags_for_resource.side_effect = Exception('Tag error')

        result = analyzer.analyze_rds_databases('dev')

        assert 'RDS analysis error' in result['issues'][0]


class TestS3AnalysisAdditional:
    """Additional S3 analysis tests for coverage"""

    def test_analyze_s3_buckets_api_error(self, analyzer, mock_aws_clients):
        """Test S3 analysis handles API errors"""
        mock_aws_clients['s3'].list_buckets.side_effect = Exception('API Error')

        result = analyzer.analyze_s3_buckets('dev')

        assert 'S3 analysis error' in result['issues'][0]

    def test_analyze_s3_buckets_versioning_error(self, analyzer, mock_aws_clients):
        """Test S3 analysis handles versioning check errors"""
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [{'Name': 'mybucket-dev'}]
        }
        mock_aws_clients['s3'].get_bucket_versioning.side_effect = Exception('Versioning error')
        mock_aws_clients['s3'].get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {'Rules': [{'ApplyServerSideEncryptionByDefault': {}}]}
        }

        result = analyzer.analyze_s3_buckets('dev')

        # Should still process but versioning will be False
        assert result['total_buckets'] == 1
        assert result['buckets'][0]['versioning_enabled'] is False

    def test_analyze_s3_buckets_encryption_other_error(self, analyzer, mock_aws_clients):
        """Test S3 analysis handles non-NotFound encryption errors"""
        mock_aws_clients['s3'].list_buckets.return_value = {
            'Buckets': [{'Name': 'mybucket-dev'}]
        }
        mock_aws_clients['s3'].get_bucket_versioning.return_value = {'Status': 'Enabled'}
        mock_aws_clients['s3'].get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
            'GetBucketEncryption'
        )

        result = analyzer.analyze_s3_buckets('dev')

        # Should still process but encryption will be False
        assert result['total_buckets'] == 1


class TestSecurityGroupAnalysisAdditional:
    """Additional security group analysis tests for coverage"""

    def test_analyze_security_groups_api_error(self, analyzer, mock_aws_clients):
        """Test security group analysis handles API errors"""
        mock_aws_clients['ec2'].describe_security_groups.side_effect = Exception('API Error')

        result = analyzer.analyze_security_groups('dev')

        assert 'Security group analysis error' in result['issues'][0]

    def test_analyze_security_groups_http_allowed(self, analyzer, mock_aws_clients):
        """Test security group analysis allows port 80"""
        mock_aws_clients['ec2'].describe_security_groups.return_value = {
            'SecurityGroups': [
                {
                    'GroupId': 'sg-12345',
                    'GroupName': 'test-sg',
                    'IpPermissions': [
                        {
                            'FromPort': 80,
                            'ToPort': 80,
                            'IpProtocol': 'tcp',
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                }
            ]
        }

        result = analyzer.analyze_security_groups('dev')

        assert len(result['unrestricted_violations']) == 0


class TestTaggingComplianceAdditional:
    """Additional tagging compliance tests for coverage"""

    def test_analyze_tagging_compliance_empty_resources(self, analyzer, mock_aws_clients):
        """Test tagging compliance with no resources"""
        result = analyzer.analyze_tagging_compliance(
            {'instances': []},
            {'databases': []},
            {'buckets': []}
        )

        assert result['total_resources'] == 0
        assert result['compliance_metrics']['compliance_percentage'] == 0

    def test_analyze_tagging_compliance_s3_resources(self, analyzer, mock_aws_clients):
        """Test tagging compliance includes S3 resources"""
        s3_results = {
            'buckets': [
                {'name': 'mybucket-dev'}
            ]
        }

        result = analyzer.analyze_tagging_compliance(
            {'instances': []},
            {'databases': []},
            s3_results
        )

        assert result['total_resources'] == 1
        # S3 bucket has no tags, so should have violation
        assert len(result['resources_with_violations']) == 1

    def test_analyze_tagging_compliance_rds_resources(self, analyzer, mock_aws_clients):
        """Test tagging compliance includes RDS resources"""
        rds_results = {
            'databases': [
                {
                    'id': 'mydb-dev',
                    'tags': {
                        'Environment': 'dev',
                        'Owner': 'test',
                        'CostCenter': '12345',
                        'Project': 'test-project'
                    }
                }
            ]
        }

        result = analyzer.analyze_tagging_compliance(
            {'instances': []},
            rds_results,
            {'buckets': []}
        )

        assert result['total_resources'] == 1
        assert result['compliance_metrics']['compliance_percentage'] == 100.0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

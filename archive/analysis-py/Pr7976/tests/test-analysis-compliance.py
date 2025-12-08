"""
Analysis tests for infrastructure security audit module.
These tests run against a mocked AWS environment.
"""
import unittest
import os
import json
from unittest.mock import patch, MagicMock
from decimal import Decimal

# Set up test environment
os.environ.setdefault('AWS_REGION', 'us-east-1')
os.environ.setdefault('AWS_ACCESS_KEY_ID', 'test')
os.environ.setdefault('AWS_SECRET_ACCESS_KEY', 'test')

# Import after setting environment
from lib.analyse import (
    DecimalEncoder,
    get_boto3_client,
    get_boto3_resource,
    analyze_ec2_instances,
    analyze_rds_instances,
    analyze_s3_buckets,
    analyze_iam_roles,
    analyze_security_groups,
    check_policy_permissions,
    calculate_compliance_score,
    generate_compliance_report,
    run_full_security_audit,
    main,
    print_audit_summary,
    SEVERITY_WEIGHTS,
    HIGH_RISK_PORTS
)


class TestDecimalEncoder(unittest.TestCase):
    """Tests for DecimalEncoder JSON encoder."""

    def test_encode_decimal(self):
        """Test DecimalEncoder handles Decimal types."""
        data = {'value': Decimal('123.45')}
        result = json.dumps(data, cls=DecimalEncoder)
        parsed = json.loads(result)
        self.assertEqual(parsed['value'], 123.45)

    def test_encode_int_decimal(self):
        """Test DecimalEncoder handles integer Decimals."""
        data = {'value': Decimal('100')}
        result = json.dumps(data, cls=DecimalEncoder)
        parsed = json.loads(result)
        self.assertEqual(parsed['value'], 100.0)

    def test_encode_nested_decimal(self):
        """Test DecimalEncoder handles nested Decimals."""
        data = {'outer': {'inner': Decimal('99.99')}}
        result = json.dumps(data, cls=DecimalEncoder)
        parsed = json.loads(result)
        self.assertEqual(parsed['outer']['inner'], 99.99)


class TestConstants(unittest.TestCase):
    """Tests for module constants."""

    def test_severity_weights_defined(self):
        """Test SEVERITY_WEIGHTS constant is properly defined."""
        self.assertIsInstance(SEVERITY_WEIGHTS, dict)
        self.assertIn('Critical', SEVERITY_WEIGHTS)
        self.assertIn('High', SEVERITY_WEIGHTS)
        self.assertIn('Medium', SEVERITY_WEIGHTS)
        self.assertIn('Low', SEVERITY_WEIGHTS)

    def test_high_risk_ports_defined(self):
        """Test HIGH_RISK_PORTS constant is properly defined."""
        self.assertIsInstance(HIGH_RISK_PORTS, list)
        self.assertIn(22, HIGH_RISK_PORTS)
        self.assertIn(3389, HIGH_RISK_PORTS)
        self.assertIn(3306, HIGH_RISK_PORTS)


class TestBoto3Helpers(unittest.TestCase):
    """Tests for boto3 helper functions."""

    @patch('lib.analyse.boto3.client')
    def test_get_boto3_client_default_region(self, mock_client):
        """Test get_boto3_client uses default region."""
        get_boto3_client('ec2')
        mock_client.assert_called_once()

    @patch('lib.analyse.boto3.resource')
    def test_get_boto3_resource_default_region(self, mock_resource):
        """Test get_boto3_resource uses default region."""
        get_boto3_resource('dynamodb')
        mock_resource.assert_called_once()


class TestAnalyzeEC2Instances(unittest.TestCase):
    """Tests for EC2 instance security analysis."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_ec2_compliant(self, mock_get_client):
        """Test EC2 analysis with compliant instances."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test123',
                    'State': {'Name': 'running'},
                    'MetadataOptions': {'HttpTokens': 'required'},
                    'BlockDeviceMappings': []
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_ec2_instances()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['non_compliant'], 0)
        self.assertEqual(result['resource_type'], 'EC2')

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_ec2_non_compliant_imdsv2(self, mock_get_client):
        """Test EC2 analysis with non-compliant IMDSv2."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test456',
                    'State': {'Name': 'running'},
                    'MetadataOptions': {'HttpTokens': 'optional'},
                    'BlockDeviceMappings': []
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_ec2_instances()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 0)
        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(len(result['findings']) > 0)

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_ec2_with_public_ip(self, mock_get_client):
        """Test EC2 analysis detects public IP."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-public',
                    'State': {'Name': 'running'},
                    'MetadataOptions': {'HttpTokens': 'required'},
                    'PublicIpAddress': '1.2.3.4',
                    'BlockDeviceMappings': []
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_ec2_instances()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('PUBLIC' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_ec2_empty(self, mock_get_client):
        """Test EC2 analysis with no instances."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_get_client.return_value = mock_ec2

        result = analyze_ec2_instances()

        self.assertEqual(result['total_instances'], 0)
        self.assertEqual(result['details'], [])

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_ec2_skips_terminated(self, mock_get_client):
        """Test EC2 analysis skips terminated instances."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-terminated',
                    'State': {'Name': 'terminated'}
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_ec2_instances()

        self.assertEqual(result['total_instances'], 0)


class TestAnalyzeRDSInstances(unittest.TestCase):
    """Tests for RDS instance security analysis."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_rds_compliant(self, mock_get_client):
        """Test RDS analysis with compliant instances."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789:db:test-db',
                'DBInstanceStatus': 'available',
                'StorageEncrypted': True,
                'BackupRetentionPeriod': 7,
                'MultiAZ': True,
                'DeletionProtection': True
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyze_rds_instances()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['resource_type'], 'RDS')

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_rds_no_encryption(self, mock_get_client):
        """Test RDS analysis detects missing encryption."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db-unencrypted',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789:db:test-db',
                'DBInstanceStatus': 'available',
                'StorageEncrypted': False,
                'BackupRetentionPeriod': 7,
                'DeletionProtection': True
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyze_rds_instances()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('ENCRYPT' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_rds_low_backup_retention(self, mock_get_client):
        """Test RDS analysis detects low backup retention."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db-no-backup',
                'DBInstanceArn': 'arn:aws:rds:us-east-1:123456789:db:test-db',
                'DBInstanceStatus': 'available',
                'StorageEncrypted': True,
                'BackupRetentionPeriod': 1,
                'DeletionProtection': True
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyze_rds_instances()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('BACKUP' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_rds_empty(self, mock_get_client):
        """Test RDS analysis with no databases."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}
        mock_get_client.return_value = mock_rds

        result = analyze_rds_instances()

        self.assertEqual(result['total_instances'], 0)
        self.assertEqual(result['resource_type'], 'RDS')


class TestAnalyzeS3Buckets(unittest.TestCase):
    """Tests for S3 bucket security analysis."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_s3_compliant(self, mock_get_client):
        """Test S3 analysis with compliant buckets."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket-encrypted'}]
        }
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
            }
        }
        mock_s3.get_bucket_versioning.return_value = {'Status': 'Enabled'}
        mock_s3.get_public_access_block.return_value = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        }
        mock_get_client.return_value = mock_s3

        result = analyze_s3_buckets()

        self.assertEqual(result['total_buckets'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['resource_type'], 'S3')

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_s3_no_encryption(self, mock_get_client):
        """Test S3 analysis detects missing encryption."""
        from botocore.exceptions import ClientError
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket-unencrypted'}]
        }
        mock_s3.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}},
            'GetBucketEncryption'
        )
        mock_s3.get_bucket_versioning.return_value = {}
        mock_s3.get_public_access_block.return_value = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        }
        mock_get_client.return_value = mock_s3

        result = analyze_s3_buckets()

        self.assertEqual(result['total_buckets'], 1)
        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('ENCRYPT' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_s3_public_access(self, mock_get_client):
        """Test S3 analysis detects public access."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket-public'}]
        }
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': [{'ApplyServerSideEncryptionByDefault': {'SSEAlgorithm': 'AES256'}}]
            }
        }
        mock_s3.get_bucket_versioning.return_value = {'Status': 'Enabled'}
        mock_s3.get_public_access_block.return_value = {
            'PublicAccessBlockConfiguration': {
                'BlockPublicAcls': False,
                'IgnorePublicAcls': False,
                'BlockPublicPolicy': False,
                'RestrictPublicBuckets': False
            }
        }
        mock_get_client.return_value = mock_s3

        result = analyze_s3_buckets()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('PUBLIC' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_s3_empty(self, mock_get_client):
        """Test S3 analysis with no buckets."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {'Buckets': []}
        mock_get_client.return_value = mock_s3

        result = analyze_s3_buckets()

        self.assertEqual(result['total_buckets'], 0)
        self.assertEqual(result['resource_type'], 'S3')


class TestAnalyzeIAMRoles(unittest.TestCase):
    """Tests for IAM role security analysis."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_iam_compliant(self, mock_get_client):
        """Test IAM analysis with compliant roles."""
        mock_iam = MagicMock()
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'test-role',
                'Path': '/'
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator
        mock_iam.list_role_policies.return_value = {'PolicyNames': []}
        mock_iam.list_attached_role_policies.return_value = {'AttachedPolicies': []}
        mock_get_client.return_value = mock_iam

        result = analyze_iam_roles()

        self.assertEqual(result['total_roles'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['resource_type'], 'IAM')

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_iam_admin_access(self, mock_get_client):
        """Test IAM analysis detects admin access."""
        mock_iam = MagicMock()
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'admin-role',
                'Path': '/'
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator
        mock_iam.list_role_policies.return_value = {'PolicyNames': []}
        mock_iam.list_attached_role_policies.return_value = {
            'AttachedPolicies': [{
                'PolicyName': 'AdministratorAccess',
                'PolicyArn': 'arn:aws:iam::aws:policy/AdministratorAccess'
            }]
        }
        mock_get_client.return_value = mock_iam

        result = analyze_iam_roles()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('ADMIN' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_iam_skips_service_roles(self, mock_get_client):
        """Test IAM analysis skips service-linked roles."""
        mock_iam = MagicMock()
        mock_paginator = MagicMock()
        mock_paginator.paginate.return_value = [{
            'Roles': [{
                'RoleName': 'AWSServiceRoleForAutoScaling',
                'Path': '/aws-service-role/'
            }]
        }]
        mock_iam.get_paginator.return_value = mock_paginator
        mock_get_client.return_value = mock_iam

        result = analyze_iam_roles()

        self.assertEqual(result['total_roles'], 0)


class TestAnalyzeSecurityGroups(unittest.TestCase):
    """Tests for Security Group analysis."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_sg_compliant(self, mock_get_client):
        """Test SG analysis with compliant groups."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [{
                'GroupId': 'sg-123',
                'GroupName': 'test-sg',
                'VpcId': 'vpc-123',
                'IpPermissions': [{
                    'FromPort': 443,
                    'ToPort': 443,
                    'IpRanges': [{'CidrIp': '10.0.0.0/8'}]
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_security_groups()

        self.assertEqual(result['total_groups'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['resource_type'], 'SecurityGroup')

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_sg_open_ssh(self, mock_get_client):
        """Test SG analysis detects open SSH port."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [{
                'GroupId': 'sg-open-ssh',
                'GroupName': 'insecure-sg',
                'VpcId': 'vpc-123',
                'IpPermissions': [{
                    'FromPort': 22,
                    'ToPort': 22,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_security_groups()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('OPENPORT' in f['id'] and '22' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_sg_all_ports_open(self, mock_get_client):
        """Test SG analysis detects all ports open."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {
            'SecurityGroups': [{
                'GroupId': 'sg-all-open',
                'GroupName': 'very-insecure-sg',
                'VpcId': 'vpc-123',
                'IpPermissions': [{
                    'FromPort': 0,
                    'ToPort': 65535,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyze_security_groups()

        self.assertEqual(result['non_compliant'], 1)
        self.assertTrue(any('ALLPORTS' in f['id'] for f in result['findings']))

    @patch('lib.analyse.get_boto3_client')
    def test_analyze_sg_empty(self, mock_get_client):
        """Test SG analysis with no security groups."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_security_groups.return_value = {'SecurityGroups': []}
        mock_get_client.return_value = mock_ec2

        result = analyze_security_groups()

        self.assertEqual(result['total_groups'], 0)


class TestCheckPolicyPermissions(unittest.TestCase):
    """Tests for IAM policy permission checking."""

    def test_check_policy_wildcard_action(self):
        """Test detection of wildcard actions."""
        policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': '*',
                'Resource': 'arn:aws:s3:::bucket/*'
            }]
        }

        findings = check_policy_permissions(policy, 'test-role', 'test-policy')

        self.assertTrue(len(findings) > 0)
        self.assertTrue(any('WILDCARD' in f['id'] for f in findings))

    def test_check_policy_wildcard_resource(self):
        """Test detection of wildcard resources."""
        policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': 's3:GetObject',
                'Resource': '*'
            }]
        }

        findings = check_policy_permissions(policy, 'test-role', 'test-policy')

        self.assertTrue(len(findings) > 0)
        self.assertTrue(any('RESOURCE' in f['id'] for f in findings))

    def test_check_policy_deny_ignored(self):
        """Test that Deny statements are ignored."""
        policy = {
            'Statement': [{
                'Effect': 'Deny',
                'Action': '*',
                'Resource': '*'
            }]
        }

        findings = check_policy_permissions(policy, 'test-role', 'test-policy')

        self.assertEqual(len(findings), 0)

    def test_check_policy_compliant(self):
        """Test compliant policy passes."""
        policy = {
            'Statement': [{
                'Effect': 'Allow',
                'Action': 's3:GetObject',
                'Resource': 'arn:aws:s3:::specific-bucket/*'
            }]
        }

        findings = check_policy_permissions(policy, 'test-role', 'test-policy')

        self.assertEqual(len(findings), 0)


class TestCalculateComplianceScore(unittest.TestCase):
    """Tests for compliance score calculation."""

    def test_score_no_findings(self):
        """Test score is 100 with no findings."""
        score = calculate_compliance_score([])
        self.assertEqual(score, 100.0)

    def test_score_critical_finding(self):
        """Test score reduces with critical findings."""
        findings = [{'severity': 'Critical'}]
        score = calculate_compliance_score(findings)
        self.assertEqual(score, 90.0)  # 100 - 10

    def test_score_multiple_findings(self):
        """Test score with multiple findings."""
        findings = [
            {'severity': 'Critical'},
            {'severity': 'High'},
            {'severity': 'Medium'}
        ]
        score = calculate_compliance_score(findings)
        self.assertEqual(score, 83.0)  # 100 - 10 - 5 - 2


class TestGenerateComplianceReport(unittest.TestCase):
    """Tests for compliance report generation."""

    @patch('lib.analyse.analyze_security_groups')
    @patch('lib.analyse.analyze_iam_roles')
    @patch('lib.analyse.analyze_s3_buckets')
    @patch('lib.analyse.analyze_rds_instances')
    @patch('lib.analyse.analyze_ec2_instances')
    def test_generate_report_structure(self, mock_ec2, mock_rds, mock_s3, mock_iam, mock_sg):
        """Test report has correct structure."""
        mock_ec2.return_value = {
            'total_instances': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'EC2', 'findings': [], 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'RDS', 'findings': [], 'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 3, 'compliant': 3, 'non_compliant': 0,
            'resource_type': 'S3', 'findings': [], 'details': []
        }
        mock_iam.return_value = {
            'total_roles': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'IAM', 'findings': [], 'details': []
        }
        mock_sg.return_value = {
            'total_groups': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'SecurityGroup', 'findings': [], 'details': []
        }

        report = generate_compliance_report()

        self.assertIn('timestamp', report)
        self.assertIn('summary', report)
        self.assertIn('results', report)
        self.assertIn('findings', report)
        self.assertEqual(report['summary']['total_resources'], 10)
        self.assertEqual(report['summary']['compliance_score'], 100.0)

    @patch('lib.analyse.analyze_security_groups')
    @patch('lib.analyse.analyze_iam_roles')
    @patch('lib.analyse.analyze_s3_buckets')
    @patch('lib.analyse.analyze_rds_instances')
    @patch('lib.analyse.analyze_ec2_instances')
    def test_generate_report_with_findings(self, mock_ec2, mock_rds, mock_s3, mock_iam, mock_sg):
        """Test report aggregates findings correctly."""
        mock_ec2.return_value = {
            'total_instances': 2, 'compliant': 1, 'non_compliant': 1,
            'resource_type': 'EC2',
            'findings': [{'id': 'EC2-1', 'severity': 'High'}],
            'details': []
        }
        mock_rds.return_value = {
            'total_instances': 1, 'compliant': 0, 'non_compliant': 1,
            'resource_type': 'RDS',
            'findings': [{'id': 'RDS-1', 'severity': 'Critical'}],
            'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'S3', 'findings': [], 'details': []
        }
        mock_iam.return_value = {
            'total_roles': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'IAM', 'findings': [], 'details': []
        }
        mock_sg.return_value = {
            'total_groups': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'SecurityGroup', 'findings': [], 'details': []
        }

        report = generate_compliance_report()

        self.assertEqual(report['summary']['total_findings'], 2)
        self.assertEqual(report['summary']['by_severity']['critical'], 1)
        self.assertEqual(report['summary']['by_severity']['high'], 1)


class TestCLIMain(unittest.TestCase):
    """Tests for CLI main function."""

    @patch('lib.analyse.run_full_security_audit')
    def test_main_default_full_audit(self, mock_full_audit):
        """Test main() runs full audit by default."""
        mock_full_audit.return_value = {
            'timestamp': '2024-01-01T00:00:00',
            'summary': {'total_resources': 10, 'compliant': 10, 'compliance_score': 100}
        }

        result = main([])

        mock_full_audit.assert_called_once()

    @patch('lib.analyse.analyze_ec2_instances')
    def test_main_ec2_only(self, mock_ec2):
        """Test main() with --ec2 flag."""
        mock_ec2.return_value = {
            'total_instances': 5, 'compliant': 5,
            'resource_type': 'EC2', 'findings': [], 'details': []
        }

        result = main(['--ec2'])

        mock_ec2.assert_called_once()
        self.assertIn('ec2', result)

    @patch('lib.analyse.analyze_rds_instances')
    def test_main_rds_only(self, mock_rds):
        """Test main() with --rds flag."""
        mock_rds.return_value = {
            'total_instances': 2, 'compliant': 2,
            'resource_type': 'RDS', 'findings': [], 'details': []
        }

        result = main(['--rds'])

        mock_rds.assert_called_once()
        self.assertIn('rds', result)

    @patch('lib.analyse.analyze_s3_buckets')
    def test_main_s3_only(self, mock_s3):
        """Test main() with --s3 flag."""
        mock_s3.return_value = {
            'total_buckets': 3, 'compliant': 3,
            'resource_type': 'S3', 'findings': [], 'details': []
        }

        result = main(['--s3'])

        mock_s3.assert_called_once()
        self.assertIn('s3', result)

    @patch('lib.analyse.analyze_iam_roles')
    def test_main_iam_only(self, mock_iam):
        """Test main() with --iam flag."""
        mock_iam.return_value = {
            'total_roles': 4, 'compliant': 4,
            'resource_type': 'IAM', 'findings': [], 'details': []
        }

        result = main(['--iam'])

        mock_iam.assert_called_once()
        self.assertIn('iam', result)

    @patch('lib.analyse.analyze_security_groups')
    def test_main_sg_only(self, mock_sg):
        """Test main() with --sg flag."""
        mock_sg.return_value = {
            'total_groups': 2, 'compliant': 2,
            'resource_type': 'SecurityGroup', 'findings': [], 'details': []
        }

        result = main(['--sg'])

        mock_sg.assert_called_once()
        self.assertIn('security_groups', result)


class TestPrintAuditSummary(unittest.TestCase):
    """Tests for audit summary printing."""

    def test_print_summary_output(self):
        """Test print_audit_summary produces output."""
        report = {
            'environment': 'test',
            'region': 'us-east-1',
            'timestamp': '2024-01-01T00:00:00',
            'summary': {
                'total_resources': 10,
                'compliant': 8,
                'non_compliant': 2,
                'total_findings': 3,
                'compliance_score': 85.0,
                'by_severity': {'critical': 1, 'high': 1, 'medium': 1, 'low': 0},
                'by_service': {'EC2': 5, 'RDS': 2, 'S3': 3}
            },
            'report_location': '/tmp/report.json'
        }

        # This should not raise any exceptions
        print_audit_summary(report)


class TestAnalysisOutputStructure(unittest.TestCase):
    """Tests for analysis output structure validation."""

    @patch('lib.analyse.get_boto3_client')
    def test_ec2_output_structure(self, mock_get_client):
        """Test EC2 analysis output has required fields."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_get_client.return_value = mock_ec2

        result = analyze_ec2_instances()

        self.assertIn('timestamp', result)
        self.assertIn('resource_type', result)
        self.assertIn('total_instances', result)
        self.assertIn('compliant', result)
        self.assertIn('non_compliant', result)
        self.assertIn('findings', result)
        self.assertIn('details', result)

    @patch('lib.analyse.get_boto3_client')
    def test_rds_output_structure(self, mock_get_client):
        """Test RDS analysis output has required fields."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}
        mock_get_client.return_value = mock_rds

        result = analyze_rds_instances()

        self.assertIn('timestamp', result)
        self.assertIn('resource_type', result)
        self.assertIn('total_instances', result)
        self.assertIn('compliant', result)
        self.assertIn('non_compliant', result)
        self.assertIn('findings', result)
        self.assertIn('details', result)

    @patch('lib.analyse.get_boto3_client')
    def test_s3_output_structure(self, mock_get_client):
        """Test S3 analysis output has required fields."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {'Buckets': []}
        mock_get_client.return_value = mock_s3

        result = analyze_s3_buckets()

        self.assertIn('timestamp', result)
        self.assertIn('resource_type', result)
        self.assertIn('total_buckets', result)
        self.assertIn('compliant', result)
        self.assertIn('non_compliant', result)
        self.assertIn('findings', result)
        self.assertIn('details', result)


if __name__ == '__main__':
    unittest.main()

"""
Analysis tests for compliance scanning module.
These tests run against a mocked AWS environment (Moto server).
"""
import unittest
import os
import boto3
from unittest.mock import patch, MagicMock

# Set up test environment
os.environ.setdefault('AWS_REGION', 'us-east-1')
os.environ.setdefault('AWS_ACCESS_KEY_ID', 'test')
os.environ.setdefault('AWS_SECRET_ACCESS_KEY', 'test')

# Import after setting environment
from lib.analyse import (
    DecimalEncoder,
    analyse_ec2_tags,
    analyse_s3_encryption,
    analyse_rds_backups,
    store_compliance_result,
    send_compliance_alert,
    generate_compliance_report,
    upload_report_to_s3,
    run_full_compliance_check,
    main,
    REQUIRED_TAGS
)


class TestAnalysisEC2Tags(unittest.TestCase):
    """Tests for EC2 tag compliance analysis against mocked AWS."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_ec2_tags_compliant(self, mock_get_client):
        """Test EC2 tag analysis with compliant instances."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test123',
                    'State': {'Name': 'running'},
                    'Tags': [
                        {'Key': 'Environment', 'Value': 'production'},
                        {'Key': 'Compliance', 'Value': 'required'},
                        {'Key': 'ManagedBy', 'Value': 'Pulumi'}
                    ]
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['non_compliant'], 0)
        self.assertEqual(result['resource_type'], 'EC2')

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_ec2_tags_non_compliant(self, mock_get_client):
        """Test EC2 tag analysis with non-compliant instances."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-test456',
                    'State': {'Name': 'running'},
                    'Tags': [
                        {'Key': 'Name', 'Value': 'test-server'}
                    ]
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 0)
        self.assertEqual(result['non_compliant'], 1)
        self.assertEqual(len(result['details'][0]['missing_tags']), 3)

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_ec2_tags_empty(self, mock_get_client):
        """Test EC2 tag analysis with no instances."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertEqual(result['total_instances'], 0)
        self.assertEqual(result['details'], [])


class TestAnalysisS3Encryption(unittest.TestCase):
    """Tests for S3 encryption compliance analysis against mocked AWS."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_s3_encryption_enabled(self, mock_get_client):
        """Test S3 encryption analysis with encrypted buckets."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket-encrypted'}]
        }
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': [{
                    'ApplyServerSideEncryptionByDefault': {
                        'SSEAlgorithm': 'AES256'
                    }
                }]
            }
        }
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['total_buckets'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['non_compliant'], 0)
        self.assertTrue(result['details'][0]['encryption_enabled'])
        self.assertEqual(result['details'][0]['encryption_algorithm'], 'AES256')

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_s3_encryption_disabled(self, mock_get_client):
        """Test S3 encryption analysis with unencrypted buckets."""
        from botocore.exceptions import ClientError
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'test-bucket-unencrypted'}]
        }
        mock_s3.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}},
            'GetBucketEncryption'
        )
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['total_buckets'], 1)
        self.assertEqual(result['compliant'], 0)
        self.assertEqual(result['non_compliant'], 1)
        self.assertFalse(result['details'][0]['encryption_enabled'])

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_s3_encryption_empty(self, mock_get_client):
        """Test S3 encryption analysis with no buckets."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {'Buckets': []}
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['total_buckets'], 0)
        self.assertEqual(result['resource_type'], 'S3')


class TestAnalysisRDSBackups(unittest.TestCase):
    """Tests for RDS backup compliance analysis against mocked AWS."""

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_rds_backups_enabled(self, mock_get_client):
        """Test RDS backup analysis with backup enabled."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db',
                'BackupRetentionPeriod': 7,
                'DBInstanceStatus': 'available'
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertEqual(result['non_compliant'], 0)
        self.assertTrue(result['details'][0]['automated_backups_enabled'])
        self.assertEqual(result['details'][0]['backup_retention_days'], 7)

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_rds_backups_disabled(self, mock_get_client):
        """Test RDS backup analysis with backup disabled."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db-no-backup',
                'BackupRetentionPeriod': 0,
                'DBInstanceStatus': 'available'
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 0)
        self.assertEqual(result['non_compliant'], 1)
        self.assertFalse(result['details'][0]['automated_backups_enabled'])

    @patch('lib.analyse.get_boto3_client')
    def test_analyse_rds_backups_empty(self, mock_get_client):
        """Test RDS backup analysis with no databases."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups()

        self.assertEqual(result['total_instances'], 0)
        self.assertEqual(result['resource_type'], 'RDS')


class TestAnalysisFullComplianceCheck(unittest.TestCase):
    """Tests for full compliance check functionality."""

    @patch('lib.analyse.analyse_rds_backups')
    @patch('lib.analyse.analyse_s3_encryption')
    @patch('lib.analyse.analyse_ec2_tags')
    def test_run_full_compliance_check(self, mock_ec2, mock_s3, mock_rds):
        """Test full compliance check aggregates results correctly."""
        mock_ec2.return_value = {
            'total_instances': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'EC2', 'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 3, 'compliant': 2, 'non_compliant': 1,
            'resource_type': 'S3', 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'RDS', 'details': []
        }

        result = run_full_compliance_check()

        self.assertEqual(result['summary']['total_resources'], 6)
        self.assertEqual(result['summary']['compliant'], 5)
        self.assertEqual(result['summary']['non_compliant'], 1)
        self.assertAlmostEqual(result['summary']['compliance_score'], 83.33, places=1)

    @patch('lib.analyse.analyse_rds_backups')
    @patch('lib.analyse.analyse_s3_encryption')
    @patch('lib.analyse.analyse_ec2_tags')
    def test_run_full_compliance_check_all_compliant(self, mock_ec2, mock_s3, mock_rds):
        """Test full compliance check with 100% compliance."""
        mock_ec2.return_value = {
            'total_instances': 5, 'compliant': 5, 'non_compliant': 0,
            'resource_type': 'EC2', 'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 10, 'compliant': 10, 'non_compliant': 0,
            'resource_type': 'S3', 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'RDS', 'details': []
        }

        result = run_full_compliance_check()

        self.assertEqual(result['summary']['compliance_score'], 100.0)
        self.assertEqual(result['summary']['non_compliant'], 0)


class TestAnalysisCLIMain(unittest.TestCase):
    """Tests for CLI main function."""

    @patch('lib.analyse.run_full_compliance_check')
    def test_main_default_full_check(self, mock_full_check):
        """Test main() runs full check by default."""
        mock_full_check.return_value = {
            'timestamp': '2024-01-01T00:00:00',
            'summary': {'total_resources': 10, 'compliant': 10}
        }

        result = main([])

        mock_full_check.assert_called_once()

    @patch('lib.analyse.analyse_ec2_tags')
    def test_main_ec2_only(self, mock_ec2):
        """Test main() with --ec2 flag."""
        mock_ec2.return_value = {
            'total_instances': 5, 'compliant': 5,
            'resource_type': 'EC2', 'details': []
        }

        result = main(['--ec2'])

        mock_ec2.assert_called_once()
        self.assertIn('ec2', result)

    @patch('lib.analyse.analyse_s3_encryption')
    def test_main_s3_only(self, mock_s3):
        """Test main() with --s3 flag."""
        mock_s3.return_value = {
            'total_buckets': 3, 'compliant': 3,
            'resource_type': 'S3', 'details': []
        }

        result = main(['--s3'])

        mock_s3.assert_called_once()
        self.assertIn('s3', result)

    @patch('lib.analyse.analyse_rds_backups')
    def test_main_rds_only(self, mock_rds):
        """Test main() with --rds flag."""
        mock_rds.return_value = {
            'total_instances': 2, 'compliant': 2,
            'resource_type': 'RDS', 'details': []
        }

        result = main(['--rds'])

        mock_rds.assert_called_once()
        self.assertIn('rds', result)


class TestAnalysisDataIntegrity(unittest.TestCase):
    """Tests for data integrity and output format."""

    def test_required_tags_defined(self):
        """Test REQUIRED_TAGS constant is properly defined."""
        self.assertIsInstance(REQUIRED_TAGS, list)
        self.assertIn('Environment', REQUIRED_TAGS)
        self.assertIn('Compliance', REQUIRED_TAGS)
        self.assertIn('ManagedBy', REQUIRED_TAGS)

    def test_decimal_encoder(self):
        """Test DecimalEncoder handles Decimal types."""
        from decimal import Decimal
        import json

        data = {'value': Decimal('123.45')}
        result = json.dumps(data, cls=DecimalEncoder)
        parsed = json.loads(result)

        self.assertEqual(parsed['value'], 123.45)

    @patch('lib.analyse.get_boto3_client')
    def test_analysis_output_structure(self, mock_get_client):
        """Test analysis output has required fields."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertIn('timestamp', result)
        self.assertIn('resource_type', result)
        self.assertIn('total_instances', result)
        self.assertIn('compliant', result)
        self.assertIn('non_compliant', result)
        self.assertIn('details', result)


class TestAnalysisStorageAndAlerts(unittest.TestCase):
    """Tests for storage and alert functionality."""

    @patch('lib.analyse.get_boto3_resource')
    def test_store_compliance_result_success(self, mock_get_resource):
        """Test successful storage of compliance result."""
        mock_table = MagicMock()
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_get_resource.return_value = mock_dynamodb

        result = store_compliance_result(
            table_name='compliance-history',
            resource_id='i-12345',
            resource_type='EC2',
            compliant=True,
            details={'tags': ['Environment']}
        )

        self.assertTrue(result)
        mock_table.put_item.assert_called_once()

    @patch('lib.analyse.get_boto3_client')
    def test_send_compliance_alert_success(self, mock_get_client):
        """Test successful sending of compliance alert."""
        mock_sns = MagicMock()
        mock_get_client.return_value = mock_sns

        result = send_compliance_alert(
            topic_arn='arn:aws:sns:us-east-1:123456789:alerts',
            subject='Test Alert',
            message='Test message body'
        )

        self.assertTrue(result)
        mock_sns.publish.assert_called_once()


if __name__ == '__main__':
    unittest.main()

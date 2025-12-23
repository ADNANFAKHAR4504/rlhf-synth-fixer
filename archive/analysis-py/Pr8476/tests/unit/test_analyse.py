"""
Unit tests for lib/analyse.py compliance analysis module.
Tests all functions with mocked AWS clients to achieve 90%+ coverage.
"""
import unittest
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from datetime import datetime, timedelta
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from lib.analyse import (
    DecimalEncoder,
    get_boto3_client,
    get_boto3_resource,
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


class TestDecimalEncoder(unittest.TestCase):
    """Tests for DecimalEncoder class."""

    def test_encode_decimal(self):
        """Test encoding Decimal values to float."""
        encoder = DecimalEncoder()
        result = encoder.default(Decimal('123.45'))
        self.assertEqual(result, 123.45)
        self.assertIsInstance(result, float)

    def test_encode_non_decimal_raises(self):
        """Test that non-Decimal objects raise TypeError."""
        encoder = DecimalEncoder()
        with self.assertRaises(TypeError):
            encoder.default(object())

    def test_json_dumps_with_decimal(self):
        """Test JSON encoding with Decimal values."""
        data = {'value': Decimal('99.99'), 'name': 'test'}
        result = json.dumps(data, cls=DecimalEncoder)
        parsed = json.loads(result)
        self.assertEqual(parsed['value'], 99.99)
        self.assertEqual(parsed['name'], 'test')


class TestBoto3Helpers(unittest.TestCase):
    """Tests for boto3 helper functions."""

    @patch('lib.analyse.boto3.client')
    def test_get_boto3_client_with_region(self, mock_client):
        """Test getting boto3 client with explicit region."""
        mock_client.return_value = MagicMock()
        result = get_boto3_client('ec2', 'us-west-2')
        mock_client.assert_called_once_with('ec2', region_name='us-west-2')
        self.assertIsNotNone(result)

    @patch('lib.analyse.boto3.client')
    @patch.dict(os.environ, {'AWS_REGION': 'eu-west-1'})
    def test_get_boto3_client_from_env(self, mock_client):
        """Test getting boto3 client with region from environment."""
        mock_client.return_value = MagicMock()
        result = get_boto3_client('s3', None)
        mock_client.assert_called_once_with('s3', region_name='eu-west-1')
        self.assertIsNotNone(result)

    @patch('lib.analyse.boto3.resource')
    def test_get_boto3_resource_with_region(self, mock_resource):
        """Test getting boto3 resource with explicit region."""
        mock_resource.return_value = MagicMock()
        result = get_boto3_resource('dynamodb', 'ap-south-1')
        mock_resource.assert_called_once_with('dynamodb', region_name='ap-south-1')
        self.assertIsNotNone(result)


class TestAnalyseEC2Tags(unittest.TestCase):
    """Tests for analyse_ec2_tags function."""

    @patch('lib.analyse.get_boto3_client')
    def test_compliant_instance(self, mock_get_client):
        """Test analysis of EC2 instance with all required tags."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-12345678',
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
        self.assertEqual(len(result['details']), 1)
        self.assertTrue(result['details'][0]['compliant'])

    @patch('lib.analyse.get_boto3_client')
    def test_non_compliant_instance(self, mock_get_client):
        """Test analysis of EC2 instance missing required tags."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-87654321',
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
        self.assertFalse(result['details'][0]['compliant'])
        self.assertEqual(len(result['details'][0]['missing_tags']), 3)

    @patch('lib.analyse.get_boto3_client')
    def test_skip_terminated_instance(self, mock_get_client):
        """Test that terminated instances are skipped."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-terminated',
                    'State': {'Name': 'terminated'},
                    'Tags': []
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertEqual(result['total_instances'], 0)

    @patch('lib.analyse.get_boto3_client')
    def test_custom_required_tags(self, mock_get_client):
        """Test analysis with custom required tags."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-custom',
                    'State': {'Name': 'running'},
                    'Tags': [
                        {'Key': 'Project', 'Value': 'test'}
                    ]
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags(required_tags=['Project'])

        self.assertEqual(result['compliant'], 1)

    @patch('lib.analyse.get_boto3_client')
    def test_no_tags_on_instance(self, mock_get_client):
        """Test instance with no tags at all."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {
            'Reservations': [{
                'Instances': [{
                    'InstanceId': 'i-notags',
                    'State': {'Name': 'running'}
                }]
            }]
        }
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertEqual(result['non_compliant'], 1)
        self.assertEqual(result['details'][0]['existing_tags'], [])

    @patch('lib.analyse.get_boto3_client')
    def test_empty_reservations(self, mock_get_client):
        """Test when no instances exist."""
        mock_ec2 = MagicMock()
        mock_ec2.describe_instances.return_value = {'Reservations': []}
        mock_get_client.return_value = mock_ec2

        result = analyse_ec2_tags()

        self.assertEqual(result['total_instances'], 0)
        self.assertEqual(result['details'], [])


class TestAnalyseS3Encryption(unittest.TestCase):
    """Tests for analyse_s3_encryption function."""

    @patch('lib.analyse.get_boto3_client')
    def test_encrypted_bucket(self, mock_get_client):
        """Test analysis of S3 bucket with encryption enabled."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'encrypted-bucket'}]
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
    def test_unencrypted_bucket(self, mock_get_client):
        """Test analysis of S3 bucket without encryption."""
        from botocore.exceptions import ClientError
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'unencrypted-bucket'}]
        }
        mock_s3.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'ServerSideEncryptionConfigurationNotFoundError'}},
            'GetBucketEncryption'
        )
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['total_buckets'], 1)
        self.assertEqual(result['non_compliant'], 1)
        self.assertFalse(result['details'][0]['encryption_enabled'])

    @patch('lib.analyse.get_boto3_client')
    def test_inaccessible_bucket(self, mock_get_client):
        """Test that inaccessible buckets are skipped."""
        from botocore.exceptions import ClientError
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'access-denied-bucket'}]
        }
        mock_s3.get_bucket_encryption.side_effect = ClientError(
            {'Error': {'Code': 'AccessDenied'}},
            'GetBucketEncryption'
        )
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['total_buckets'], 0)
        self.assertEqual(len(result['details']), 0)

    @patch('lib.analyse.get_boto3_client')
    def test_no_buckets(self, mock_get_client):
        """Test when no S3 buckets exist."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {'Buckets': []}
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['total_buckets'], 0)
        self.assertEqual(result['resource_type'], 'S3')

    @patch('lib.analyse.get_boto3_client')
    def test_encryption_with_empty_rules(self, mock_get_client):
        """Test bucket with encryption config but empty rules."""
        mock_s3 = MagicMock()
        mock_s3.list_buckets.return_value = {
            'Buckets': [{'Name': 'empty-rules-bucket'}]
        }
        mock_s3.get_bucket_encryption.return_value = {
            'ServerSideEncryptionConfiguration': {
                'Rules': []
            }
        }
        mock_get_client.return_value = mock_s3

        result = analyse_s3_encryption()

        self.assertEqual(result['non_compliant'], 1)
        self.assertFalse(result['details'][0]['compliant'])


class TestAnalyseRDSBackups(unittest.TestCase):
    """Tests for analyse_rds_backups function."""

    @patch('lib.analyse.get_boto3_client')
    def test_compliant_database(self, mock_get_client):
        """Test analysis of RDS instance with backup enabled."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'prod-db',
                'BackupRetentionPeriod': 7,
                'DBInstanceStatus': 'available'
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups()

        self.assertEqual(result['total_instances'], 1)
        self.assertEqual(result['compliant'], 1)
        self.assertTrue(result['details'][0]['automated_backups_enabled'])
        self.assertEqual(result['details'][0]['backup_retention_days'], 7)

    @patch('lib.analyse.get_boto3_client')
    def test_non_compliant_database(self, mock_get_client):
        """Test analysis of RDS instance without backup."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'dev-db',
                'BackupRetentionPeriod': 0,
                'DBInstanceStatus': 'available'
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups()

        self.assertEqual(result['non_compliant'], 1)
        self.assertFalse(result['details'][0]['compliant'])
        self.assertFalse(result['details'][0]['automated_backups_enabled'])

    @patch('lib.analyse.get_boto3_client')
    def test_custom_retention_requirement(self, mock_get_client):
        """Test with custom minimum retention days."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceIdentifier': 'test-db',
                'BackupRetentionPeriod': 3,
                'DBInstanceStatus': 'available'
            }]
        }
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups(min_retention_days=7)

        self.assertEqual(result['non_compliant'], 1)

    @patch('lib.analyse.get_boto3_client')
    def test_no_databases(self, mock_get_client):
        """Test when no RDS instances exist."""
        mock_rds = MagicMock()
        mock_rds.describe_db_instances.return_value = {'DBInstances': []}
        mock_get_client.return_value = mock_rds

        result = analyse_rds_backups()

        self.assertEqual(result['total_instances'], 0)
        self.assertEqual(result['resource_type'], 'RDS')


class TestStoreComplianceResult(unittest.TestCase):
    """Tests for store_compliance_result function."""

    @patch('lib.analyse.get_boto3_resource')
    def test_successful_storage(self, mock_get_resource):
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

    @patch('lib.analyse.get_boto3_resource')
    def test_storage_failure(self, mock_get_resource):
        """Test handling of storage failure."""
        from botocore.exceptions import ClientError
        mock_table = MagicMock()
        mock_table.put_item.side_effect = ClientError(
            {'Error': {'Code': 'ValidationException'}},
            'PutItem'
        )
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_get_resource.return_value = mock_dynamodb

        result = store_compliance_result(
            table_name='compliance-history',
            resource_id='i-12345',
            resource_type='EC2',
            compliant=True,
            details={}
        )

        self.assertFalse(result)


class TestSendComplianceAlert(unittest.TestCase):
    """Tests for send_compliance_alert function."""

    @patch('lib.analyse.get_boto3_client')
    def test_successful_alert(self, mock_get_client):
        """Test successful sending of compliance alert."""
        mock_sns = MagicMock()
        mock_get_client.return_value = mock_sns

        result = send_compliance_alert(
            topic_arn='arn:aws:sns:us-east-1:123456789:alerts',
            subject='Test Alert',
            message='Test message'
        )

        self.assertTrue(result)
        mock_sns.publish.assert_called_once()

    @patch('lib.analyse.get_boto3_client')
    def test_alert_failure(self, mock_get_client):
        """Test handling of alert failure."""
        from botocore.exceptions import ClientError
        mock_sns = MagicMock()
        mock_sns.publish.side_effect = ClientError(
            {'Error': {'Code': 'InvalidParameter'}},
            'Publish'
        )
        mock_get_client.return_value = mock_sns

        result = send_compliance_alert(
            topic_arn='invalid-arn',
            subject='Test',
            message='Test'
        )

        self.assertFalse(result)


class TestGenerateComplianceReport(unittest.TestCase):
    """Tests for generate_compliance_report function."""

    @patch('lib.analyse.get_boto3_resource')
    def test_generate_report(self, mock_get_resource):
        """Test generation of compliance report."""
        mock_table = MagicMock()
        recent_timestamp = datetime.utcnow().isoformat()
        mock_table.scan.return_value = {
            'Items': [
                {
                    'resource_id': 'i-123',
                    'resource_type': 'EC2',
                    'compliant': True,
                    'evaluation_timestamp': recent_timestamp
                },
                {
                    'resource_id': 'bucket-1',
                    'resource_type': 'S3',
                    'compliant': False,
                    'evaluation_timestamp': recent_timestamp
                }
            ]
        }
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_get_resource.return_value = mock_dynamodb

        result = generate_compliance_report(table_name='compliance-history')

        self.assertEqual(result['summary']['total_resources'], 2)
        self.assertEqual(result['summary']['compliant'], 1)
        self.assertEqual(result['summary']['non_compliant'], 1)
        self.assertEqual(result['compliance_score'], 50.0)

    @patch('lib.analyse.get_boto3_resource')
    def test_report_with_pagination(self, mock_get_resource):
        """Test report generation with paginated results."""
        mock_table = MagicMock()
        recent_timestamp = datetime.utcnow().isoformat()
        mock_table.scan.side_effect = [
            {
                'Items': [{'resource_id': 'r1', 'resource_type': 'EC2',
                          'compliant': True, 'evaluation_timestamp': recent_timestamp}],
                'LastEvaluatedKey': {'pk': 'r1'}
            },
            {
                'Items': [{'resource_id': 'r2', 'resource_type': 'EC2',
                          'compliant': True, 'evaluation_timestamp': recent_timestamp}]
            }
        ]
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_get_resource.return_value = mock_dynamodb

        result = generate_compliance_report(table_name='test-table')

        self.assertEqual(result['summary']['total_resources'], 2)
        self.assertEqual(mock_table.scan.call_count, 2)

    @patch('lib.analyse.get_boto3_resource')
    def test_empty_report(self, mock_get_resource):
        """Test report generation with no data."""
        mock_table = MagicMock()
        mock_table.scan.return_value = {'Items': []}
        mock_dynamodb = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_get_resource.return_value = mock_dynamodb

        result = generate_compliance_report(table_name='empty-table')

        self.assertEqual(result['summary']['total_resources'], 0)
        self.assertEqual(result['compliance_score'], 100.0)


class TestUploadReportToS3(unittest.TestCase):
    """Tests for upload_report_to_s3 function."""

    @patch('lib.analyse.get_boto3_client')
    def test_successful_upload(self, mock_get_client):
        """Test successful report upload to S3."""
        mock_s3 = MagicMock()
        mock_get_client.return_value = mock_s3

        report = {'summary': {'total': 10, 'compliant': 8}}
        result = upload_report_to_s3(
            bucket_name='reports-bucket',
            report=report
        )

        self.assertIn('s3://reports-bucket/', result)
        self.assertIn('.json', result)
        mock_s3.put_object.assert_called_once()


class TestRunFullComplianceCheck(unittest.TestCase):
    """Tests for run_full_compliance_check function."""

    @patch('lib.analyse.upload_report_to_s3')
    @patch('lib.analyse.send_compliance_alert')
    @patch('lib.analyse.store_compliance_result')
    @patch('lib.analyse.analyse_rds_backups')
    @patch('lib.analyse.analyse_s3_encryption')
    @patch('lib.analyse.analyse_ec2_tags')
    def test_full_check_all_compliant(self, mock_ec2, mock_s3, mock_rds,
                                       mock_store, mock_alert, mock_upload):
        """Test full compliance check with all resources compliant."""
        mock_ec2.return_value = {
            'total_instances': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'EC2', 'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 3, 'compliant': 3, 'non_compliant': 0,
            'resource_type': 'S3', 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'RDS', 'details': []
        }

        result = run_full_compliance_check()

        self.assertEqual(result['summary']['total_resources'], 6)
        self.assertEqual(result['summary']['compliant'], 6)
        self.assertEqual(result['summary']['compliance_score'], 100.0)

    @patch('lib.analyse.upload_report_to_s3')
    @patch('lib.analyse.send_compliance_alert')
    @patch('lib.analyse.store_compliance_result')
    @patch('lib.analyse.analyse_rds_backups')
    @patch('lib.analyse.analyse_s3_encryption')
    @patch('lib.analyse.analyse_ec2_tags')
    def test_full_check_with_non_compliant(self, mock_ec2, mock_s3, mock_rds,
                                           mock_store, mock_alert, mock_upload):
        """Test full compliance check with some non-compliant resources."""
        mock_ec2.return_value = {
            'total_instances': 2, 'compliant': 1, 'non_compliant': 1,
            'resource_type': 'EC2', 'details': [
                {'resource_id': 'i-1', 'compliant': True},
                {'resource_id': 'i-2', 'compliant': False}
            ]
        }
        mock_s3.return_value = {
            'total_buckets': 2, 'compliant': 2, 'non_compliant': 0,
            'resource_type': 'S3', 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 1, 'compliant': 0, 'non_compliant': 1,
            'resource_type': 'RDS', 'details': [
                {'resource_id': 'db-1', 'compliant': False}
            ]
        }

        result = run_full_compliance_check(
            dynamodb_table='test-table',
            sns_topic_arn='arn:aws:sns:test',
            reports_bucket='test-bucket'
        )

        self.assertEqual(result['summary']['non_compliant'], 2)
        mock_alert.assert_called_once()
        mock_upload.assert_called_once()

    @patch('lib.analyse.analyse_rds_backups')
    @patch('lib.analyse.analyse_s3_encryption')
    @patch('lib.analyse.analyse_ec2_tags')
    def test_full_check_no_resources(self, mock_ec2, mock_s3, mock_rds):
        """Test full compliance check with no resources."""
        mock_ec2.return_value = {
            'total_instances': 0, 'compliant': 0, 'non_compliant': 0,
            'resource_type': 'EC2', 'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 0, 'compliant': 0, 'non_compliant': 0,
            'resource_type': 'S3', 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 0, 'compliant': 0, 'non_compliant': 0,
            'resource_type': 'RDS', 'details': []
        }

        result = run_full_compliance_check()

        self.assertEqual(result['summary']['total_resources'], 0)
        self.assertEqual(result['summary']['compliance_score'], 100.0)


class TestRequiredTags(unittest.TestCase):
    """Tests for REQUIRED_TAGS constant."""

    def test_required_tags_defined(self):
        """Test that required tags constant is properly defined."""
        self.assertIsInstance(REQUIRED_TAGS, list)
        self.assertIn('Environment', REQUIRED_TAGS)
        self.assertIn('Compliance', REQUIRED_TAGS)
        self.assertIn('ManagedBy', REQUIRED_TAGS)


class TestCLIEntryPoint(unittest.TestCase):
    """Tests for CLI entry point main() function."""

    @patch('lib.analyse.run_full_compliance_check')
    def test_main_with_all_flag(self, mock_full_check):
        """Test main() with --all flag runs full compliance check."""
        mock_full_check.return_value = {
            'timestamp': '2024-01-01T00:00:00',
            'summary': {'total_resources': 0, 'compliant': 0}
        }

        result = main(['--all', '--region', 'us-east-1'])

        mock_full_check.assert_called_once_with(region='us-east-1')
        self.assertIn('timestamp', result)

    @patch('lib.analyse.run_full_compliance_check')
    def test_main_default_runs_full_check(self, mock_full_check):
        """Test main() with no flags runs full compliance check by default."""
        mock_full_check.return_value = {
            'timestamp': '2024-01-01T00:00:00',
            'summary': {'total_resources': 5, 'compliant': 5}
        }

        result = main([])

        mock_full_check.assert_called_once_with(region='us-east-1')

    @patch('lib.analyse.analyse_ec2_tags')
    def test_main_ec2_flag(self, mock_ec2_check):
        """Test main() with --ec2 flag runs EC2 tag check."""
        mock_ec2_check.return_value = {
            'total_instances': 2, 'compliant': 1, 'non_compliant': 1,
            'resource_type': 'EC2', 'details': []
        }

        result = main(['--ec2', '--region', 'us-west-2'])

        mock_ec2_check.assert_called_once_with(region='us-west-2')
        self.assertIn('ec2', result)

    @patch('lib.analyse.analyse_s3_encryption')
    def test_main_s3_flag(self, mock_s3_check):
        """Test main() with --s3 flag runs S3 encryption check."""
        mock_s3_check.return_value = {
            'total_buckets': 3, 'compliant': 2, 'non_compliant': 1,
            'resource_type': 'S3', 'details': []
        }

        result = main(['--s3', '--region', 'eu-west-1'])

        mock_s3_check.assert_called_once_with(region='eu-west-1')
        self.assertIn('s3', result)

    @patch('lib.analyse.analyse_rds_backups')
    def test_main_rds_flag(self, mock_rds_check):
        """Test main() with --rds flag runs RDS backup check."""
        mock_rds_check.return_value = {
            'total_instances': 1, 'compliant': 1, 'non_compliant': 0,
            'resource_type': 'RDS', 'details': []
        }

        result = main(['--rds', '--region', 'ap-southeast-1'])

        mock_rds_check.assert_called_once_with(region='ap-southeast-1')
        self.assertIn('rds', result)

    @patch('lib.analyse.analyse_ec2_tags')
    @patch('lib.analyse.analyse_s3_encryption')
    @patch('lib.analyse.analyse_rds_backups')
    def test_main_multiple_flags(self, mock_rds, mock_s3, mock_ec2):
        """Test main() with multiple flags runs multiple checks."""
        mock_ec2.return_value = {
            'total_instances': 1, 'compliant': 1,
            'resource_type': 'EC2', 'details': []
        }
        mock_s3.return_value = {
            'total_buckets': 2, 'compliant': 2,
            'resource_type': 'S3', 'details': []
        }
        mock_rds.return_value = {
            'total_instances': 1, 'compliant': 0,
            'resource_type': 'RDS', 'details': []
        }

        result = main(['--ec2', '--s3', '--rds'])

        mock_ec2.assert_called_once()
        mock_s3.assert_called_once()
        mock_rds.assert_called_once()
        self.assertIn('ec2', result)
        self.assertIn('s3', result)
        self.assertIn('rds', result)

    @patch('lib.analyse.run_full_compliance_check')
    def test_main_custom_region(self, mock_full_check):
        """Test main() with custom region parameter."""
        mock_full_check.return_value = {
            'timestamp': '2024-01-01T00:00:00',
            'summary': {'total_resources': 0}
        }

        main(['--region', 'ap-northeast-1'])

        mock_full_check.assert_called_once_with(region='ap-northeast-1')


if __name__ == '__main__':
    unittest.main()

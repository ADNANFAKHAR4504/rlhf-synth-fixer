"""Unit tests for the Lambda compliance reporter function."""
import json
import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch, call

from pytest import mark

# Mock boto3 clients before importing the lambda function
import sys
from unittest.mock import MagicMock
sys.modules['boto3'] = MagicMock()

# Import from lib.lambda directory - using importlib to avoid keyword conflict
import importlib.util
spec = importlib.util.spec_from_file_location("lambda_index", "lib/lambda/index.py")
index = importlib.util.module_from_spec(spec)
sys.modules['lambda_index'] = index
spec.loader.exec_module(index)


@mark.describe("Lambda Compliance Reporter")
class TestLambdaIndex(unittest.TestCase):
    """Test cases for the Lambda compliance reporter function."""

    def setUp(self):
        """Set up mocks for each test."""
        self.mock_config_client = MagicMock()
        self.mock_s3_client = MagicMock()

        # Patch the clients
        index.config_client = self.mock_config_client
        index.s3_client = self.mock_s3_client

        # Set up environment variables
        self.env_patcher = patch.dict('os.environ', {
            'BUCKET_NAME': 'test-bucket',
            'S3_RULE_NAME': 's3-encryption-test',
            'RDS_RULE_NAME': 'rds-encryption-test',
            'EC2_RULE_NAME': 'ec2-imdsv2-test'
        })
        self.env_patcher.start()

    def tearDown(self):
        """Clean up after each test."""
        self.env_patcher.stop()

    @mark.it("gets non-compliant resources for a rule")
    def test_get_non_compliant_resources(self):
        """Test get_non_compliant_resources returns correct data."""
        # ARRANGE
        rule_name = "test-rule"
        mock_response = {
            'EvaluationResults': [
                {
                    'EvaluationResultIdentifier': {
                        'EvaluationResultQualifier': {
                            'ResourceId': 'i-12345',
                            'ResourceType': 'AWS::EC2::Instance'
                        }
                    },
                    'ComplianceType': 'NON_COMPLIANT',
                    'ResultRecordedTime': datetime(2024, 1, 1, 12, 0, 0),
                    'Annotation': 'IMDSv2 not enforced'
                }
            ]
        }
        self.mock_config_client.get_compliance_details_by_config_rule.return_value = mock_response

        # ACT
        result = index.get_non_compliant_resources(rule_name)

        # ASSERT
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['resource_id'], 'i-12345')
        self.assertEqual(result[0]['resource_type'], 'AWS::EC2::Instance')
        self.assertEqual(result[0]['rule'], rule_name)
        self.assertEqual(result[0]['compliance_type'], 'NON_COMPLIANT')
        self.mock_config_client.get_compliance_details_by_config_rule.assert_called_once_with(
            ConfigRuleName=rule_name,
            ComplianceTypes=['NON_COMPLIANT'],
            Limit=100
        )

    @mark.it("handles empty results from Config")
    def test_get_non_compliant_resources_empty(self):
        """Test get_non_compliant_resources handles empty results."""
        # ARRANGE
        rule_name = "test-rule"
        self.mock_config_client.get_compliance_details_by_config_rule.return_value = {
            'EvaluationResults': []
        }

        # ACT
        result = index.get_non_compliant_resources(rule_name)

        # ASSERT
        self.assertEqual(len(result), 0)

    @mark.it("handles NoSuchConfigRuleException")
    def test_get_non_compliant_resources_no_rule(self):
        """Test get_non_compliant_resources handles missing rules."""
        # ARRANGE
        rule_name = "non-existent-rule"
        # Create a proper exception class
        class NoSuchConfigRuleException(Exception):
            pass

        self.mock_config_client.exceptions.NoSuchConfigRuleException = NoSuchConfigRuleException
        self.mock_config_client.get_compliance_details_by_config_rule.side_effect = \
            NoSuchConfigRuleException("Rule not found")

        # ACT
        result = index.get_non_compliant_resources(rule_name)

        # ASSERT
        self.assertEqual(len(result), 0)

    @mark.it("returns empty list when API returns no evaluation results")
    def test_get_non_compliant_resources_no_results(self):
        """Test get_non_compliant_resources returns empty list for no results."""
        # ARRANGE
        rule_name = "test-rule"
        self.mock_config_client.get_compliance_details_by_config_rule.return_value = {
            'EvaluationResults': []
        }

        # ACT
        result = index.get_non_compliant_resources(rule_name)

        # ASSERT
        self.assertEqual(len(result), 0)
        self.mock_config_client.get_compliance_details_by_config_rule.assert_called_once()

    @mark.it("generates compliance report with correct structure")
    @patch('lambda_index.get_non_compliant_resources')
    def test_generate_compliance_report(self, mock_get_resources):
        """Test generate_compliance_report creates correct report structure."""
        # ARRANGE
        mock_get_resources.side_effect = [
            [  # S3 rule
                {
                    'resource_id': 'my-bucket',
                    'resource_type': 'AWS::S3::Bucket',
                    'rule': 's3-encryption-test',
                    'compliance_type': 'NON_COMPLIANT',
                    'timestamp': '2024-01-01T12:00:00',
                    'annotation': 'No encryption'
                }
            ],
            [  # RDS rule
                {
                    'resource_id': 'my-db',
                    'resource_type': 'AWS::RDS::DBInstance',
                    'rule': 'rds-encryption-test',
                    'compliance_type': 'NON_COMPLIANT',
                    'timestamp': '2024-01-01T12:00:00',
                    'annotation': 'No encryption'
                }
            ],
            []  # EC2 rule - no violations
        ]

        # ACT
        report = index.generate_compliance_report()

        # ASSERT
        self.assertEqual(report['total_non_compliant'], 2)
        self.assertEqual(len(report['non_compliant_resources']), 2)
        self.assertEqual(report['summary_by_type']['s3'], 1)
        self.assertEqual(report['summary_by_type']['rds'], 1)
        self.assertEqual(report['summary_by_type']['ec2'], 0)
        self.assertIn('report_date', report)
        self.assertIn('rules_evaluated', report)
        self.assertEqual(len(report['rules_evaluated']), 3)

    @mark.it("stores report in S3 with correct key structure")
    @patch('lambda_index.datetime')
    def test_store_report(self, mock_datetime):
        """Test store_report saves to S3 with date-based partitioning."""
        # ARRANGE
        mock_now = datetime(2024, 1, 15, 14, 30, 45)
        mock_datetime.utcnow.return_value = mock_now
        mock_datetime.strftime = datetime.strftime

        report = {
            'report_date': '2024-01-15T14:30:45',
            'total_non_compliant': 5,
            'non_compliant_resources': [],
            'summary_by_type': {'s3': 2, 'rds': 3, 'ec2': 0}
        }
        bucket_name = 'test-bucket'

        # ACT
        key = index.store_report(report, bucket_name)

        # ASSERT
        expected_key = 'reports/2024/01/15/20240115-143045.json'
        self.assertEqual(key, expected_key)
        self.mock_s3_client.put_object.assert_called_once()
        call_args = self.mock_s3_client.put_object.call_args[1]
        self.assertEqual(call_args['Bucket'], bucket_name)
        self.assertEqual(call_args['Key'], expected_key)
        self.assertEqual(call_args['ContentType'], 'application/json')
        self.assertEqual(call_args['ServerSideEncryption'], 'AES256')

    @mark.it("handler returns success response")
    @patch('lambda_index.store_report')
    @patch('lambda_index.generate_compliance_report')
    def test_handler_success(self, mock_generate, mock_store):
        """Test Lambda handler returns success response."""
        # ARRANGE
        mock_report = {
            'report_date': '2024-01-15T14:30:45',
            'total_non_compliant': 3,
            'summary_by_type': {'s3': 1, 'rds': 2, 'ec2': 0}
        }
        mock_generate.return_value = mock_report
        mock_store.return_value = 'reports/2024/01/15/20240115-143045.json'

        event = {}
        context = MagicMock()

        # ACT
        response = index.handler(event, context)

        # ASSERT
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], 'Compliance report generated successfully')
        self.assertEqual(body['non_compliant_count'], 3)
        self.assertIn('report_location', body)
        self.assertIn('summary', body)

    @mark.it("handler handles missing environment variables")
    @patch.dict('os.environ', {}, clear=True)
    def test_handler_missing_env_var(self):
        """Test handler returns error for missing environment variables."""
        # ARRANGE
        event = {}
        context = MagicMock()

        # ACT
        response = index.handler(event, context)

        # ASSERT
        self.assertEqual(response['statusCode'], 500)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], 'Configuration error')
        self.assertIn('error', body)

    @mark.it("handler handles exceptions during report generation")
    @patch('lambda_index.generate_compliance_report')
    def test_handler_exception(self, mock_generate):
        """Test handler returns error response for exceptions."""
        # ARRANGE
        mock_generate.side_effect = Exception("Test error")
        event = {}
        context = MagicMock()

        # ACT
        response = index.handler(event, context)

        # ASSERT
        self.assertEqual(response['statusCode'], 500)
        body = json.loads(response['body'])
        self.assertEqual(body['message'], 'Error generating compliance report')
        self.assertIn('error', body)

    @mark.it("uses environment variables for rule names")
    @patch('lambda_index.get_non_compliant_resources')
    def test_uses_environment_variables(self, mock_get_resources):
        """Test that generate_compliance_report uses environment variables."""
        # ARRANGE
        mock_get_resources.return_value = []

        # ACT
        report = index.generate_compliance_report()

        # ASSERT
        self.assertEqual(mock_get_resources.call_count, 3)
        mock_get_resources.assert_any_call('s3-encryption-test')
        mock_get_resources.assert_any_call('rds-encryption-test')
        mock_get_resources.assert_any_call('ec2-imdsv2-test')

    @mark.it("categorizes resources correctly in summary")
    @patch('lambda_index.get_non_compliant_resources')
    def test_summary_categorization(self, mock_get_resources):
        """Test that resources are categorized correctly in summary."""
        # ARRANGE
        mock_get_resources.side_effect = [
            [
                {'resource_type': 'AWS::S3::Bucket', 'resource_id': 'bucket1',
                 'rule': 's3-rule', 'compliance_type': 'NON_COMPLIANT',
                 'timestamp': '2024-01-01', 'annotation': 'test'},
                {'resource_type': 'AWS::S3::Bucket', 'resource_id': 'bucket2',
                 'rule': 's3-rule', 'compliance_type': 'NON_COMPLIANT',
                 'timestamp': '2024-01-01', 'annotation': 'test'}
            ],
            [
                {'resource_type': 'AWS::RDS::DBInstance', 'resource_id': 'db1',
                 'rule': 'rds-rule', 'compliance_type': 'NON_COMPLIANT',
                 'timestamp': '2024-01-01', 'annotation': 'test'}
            ],
            [
                {'resource_type': 'AWS::EC2::Instance', 'resource_id': 'i-123',
                 'rule': 'ec2-rule', 'compliance_type': 'NON_COMPLIANT',
                 'timestamp': '2024-01-01', 'annotation': 'test'},
                {'resource_type': 'AWS::EC2::Instance', 'resource_id': 'i-456',
                 'rule': 'ec2-rule', 'compliance_type': 'NON_COMPLIANT',
                 'timestamp': '2024-01-01', 'annotation': 'test'},
                {'resource_type': 'AWS::EC2::Instance', 'resource_id': 'i-789',
                 'rule': 'ec2-rule', 'compliance_type': 'NON_COMPLIANT',
                 'timestamp': '2024-01-01', 'annotation': 'test'}
            ]
        ]

        # ACT
        report = index.generate_compliance_report()

        # ASSERT
        self.assertEqual(report['summary_by_type']['s3'], 2)
        self.assertEqual(report['summary_by_type']['rds'], 1)
        self.assertEqual(report['summary_by_type']['ec2'], 3)
        self.assertEqual(report['total_non_compliant'], 6)

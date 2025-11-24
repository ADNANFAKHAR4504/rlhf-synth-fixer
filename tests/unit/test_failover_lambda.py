"""
Unit tests for failover Lambda function
Tests the automated database failover logic.
"""
import json
import os
import sys
import unittest
import importlib.util
from unittest.mock import MagicMock, patch
import boto3

from pytest import mark


# Mock boto3 before importing the handler
@patch.dict(os.environ, {
    'PRIMARY_DB_INSTANCE': 'primary-db-test',
    'REPLICA_DB_INSTANCE': 'replica-db-test',
    'REPLICA_REGION': 'eu-west-1',
    'HOSTED_ZONE_ID': 'Z1234567890ABC',
    'ENVIRONMENT_SUFFIX': 'test'
})
class TestFailoverLambda(unittest.TestCase):
    """Test cases for the failover Lambda function"""

    def setUp(self):
        """Set up mocks for AWS services"""
        self.rds_mock = MagicMock()
        self.route53_mock = MagicMock()

    @mark.it("successfully promotes replica and updates Route53")
    @patch('boto3.client')
    def test_successful_failover(self, mock_boto_client):
        """Test complete successful failover process"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py")
        index_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(index_module)
        handler = index_module.handler

        # ARRANGE
        mock_boto_client.side_effect = lambda service, **kwargs: (
            self.rds_mock if service == 'rds' else self.route53_mock
        )

        self.rds_mock.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'DBInstanceIdentifier': 'replica-db-test',
                'Endpoint': {'Address': 'replica.amazonaws.com'}
            }]
        }

        self.rds_mock.promote_read_replica.return_value = {
            'DBInstance': {'DBInstanceIdentifier': 'replica-db-test'}
        }

        self.route53_mock.list_resource_record_sets.return_value = {
            'ResourceRecordSets': [{
                'Name': 'db.test.internal',
                'Type': 'CNAME',
                'SetIdentifier': 'primary-test',
                'Weight': 100
            }]
        }

        self.route53_mock.change_resource_record_sets.return_value = {
            'ChangeInfo': {'Id': '/change/C1234567890ABC'}
        }

        waiter_mock = MagicMock()
        self.rds_mock.get_waiter.return_value = waiter_mock

        # ACT
        result = handler({}, None)

        # ASSERT
        self.assertEqual(result['statusCode'], 200)
        self.rds_mock.promote_read_replica.assert_called_once()
        self.route53_mock.change_resource_record_sets.assert_called_once()
        waiter_mock.wait.assert_called_once()

        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Failover completed successfully')
        self.assertEqual(body['promoted_instance'], 'replica-db-test')

    @mark.it("fails when replica is not available")
    @patch('boto3.client')
    def test_fails_when_replica_unavailable(self, mock_boto_client):
        """Test failover fails when replica is not in available state"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        sys.path.insert(0, 'lib/lambda/failover')
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py"); index_module = importlib.util.module_from_spec(spec); spec.loader.exec_module(index_module); index = index_module
        handler = index.handler

        # ARRANGE
        mock_boto_client.side_effect = lambda service, **kwargs: (
            self.rds_mock if service == 'rds' else self.route53_mock
        )

        self.rds_mock.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'backing-up',
                'DBInstanceIdentifier': 'replica-db-test'
            }]
        }

        # ACT
        result = handler({}, None)

        # ASSERT
        self.assertEqual(result['statusCode'], 500)
        self.rds_mock.promote_read_replica.assert_not_called()
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Failover failed')

    @mark.it("handles missing environment variables gracefully")
    @patch.dict(os.environ, {}, clear=True)
    @patch('boto3.client')
    def test_handles_missing_env_vars(self, mock_boto_client):
        """Test failover handles missing environment variables"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        sys.path.insert(0, 'lib/lambda/failover')
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py"); index_module = importlib.util.module_from_spec(spec); spec.loader.exec_module(index_module); index = index_module
        handler = index.handler

        # ARRANGE
        mock_boto_client.return_value = self.rds_mock

        # ACT
        result = handler({}, None)

        # ASSERT
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Failover failed')

    @mark.it("handles RDS client errors")
    @patch('boto3.client')
    def test_handles_rds_client_error(self, mock_boto_client):
        """Test failover handles RDS API errors"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        sys.path.insert(0, 'lib/lambda/failover')
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py"); index_module = importlib.util.module_from_spec(spec); spec.loader.exec_module(index_module); index = index_module
        handler = index.handler

        # ARRANGE
        mock_boto_client.side_effect = lambda service, **kwargs: (
            self.rds_mock if service == 'rds' else self.route53_mock
        )

        # Use boto3.exceptions.Boto3Error which is caught by the handler
        self.rds_mock.describe_db_instances.side_effect = boto3.exceptions.Boto3Error(
            "RDS API error"
        )

        # ACT
        result = handler({}, None)

        # ASSERT
        self.assertEqual(result['statusCode'], 500)
        body = json.loads(result['body'])
        self.assertEqual(body['message'], 'Failover failed')

    @mark.it("handles Route53 errors after promotion")
    @patch('boto3.client')
    def test_handles_route53_error(self, mock_boto_client):
        """Test failover handles Route53 API errors"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        sys.path.insert(0, 'lib/lambda/failover')
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py"); index_module = importlib.util.module_from_spec(spec); spec.loader.exec_module(index_module); index = index_module
        handler = index.handler

        # ARRANGE
        mock_boto_client.side_effect = lambda service, **kwargs: (
            self.rds_mock if service == 'rds' else self.route53_mock
        )

        self.rds_mock.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'DBInstanceIdentifier': 'replica-db-test',
                'Endpoint': {'Address': 'replica.amazonaws.com'}
            }]
        }

        self.rds_mock.promote_read_replica.return_value = {
            'DBInstance': {'DBInstanceIdentifier': 'replica-db-test'}
        }

        waiter_mock = MagicMock()
        self.rds_mock.get_waiter.return_value = waiter_mock

        # Use boto3.exceptions.Boto3Error which is caught by the handler
        self.route53_mock.list_resource_record_sets.side_effect = boto3.exceptions.Boto3Error(
            "Route53 API error"
        )

        # ACT
        result = handler({}, None)

        # ASSERT
        self.assertEqual(result['statusCode'], 500)
        self.rds_mock.promote_read_replica.assert_called_once()

    @mark.it("constructs correct Route53 change batch")
    @patch('boto3.client')
    def test_constructs_correct_route53_change(self, mock_boto_client):
        """Test that Route53 change batch is constructed correctly"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        sys.path.insert(0, 'lib/lambda/failover')
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py"); index_module = importlib.util.module_from_spec(spec); spec.loader.exec_module(index_module); index = index_module
        handler = index.handler

        # ARRANGE
        mock_boto_client.side_effect = lambda service, **kwargs: (
            self.rds_mock if service == 'rds' else self.route53_mock
        )

        self.rds_mock.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'DBInstanceIdentifier': 'replica-db-test',
                'Endpoint': {'Address': 'replica.amazonaws.com'}
            }]
        }

        self.rds_mock.promote_read_replica.return_value = {
            'DBInstance': {'DBInstanceIdentifier': 'replica-db-test'}
        }

        self.route53_mock.list_resource_record_sets.return_value = {
            'ResourceRecordSets': [{
                'Name': 'db.test.internal',
                'Type': 'CNAME',
                'SetIdentifier': 'primary-test',
                'Weight': 100
            }]
        }

        self.route53_mock.change_resource_record_sets.return_value = {
            'ChangeInfo': {'Id': '/change/C1234567890ABC'}
        }

        waiter_mock = MagicMock()
        self.rds_mock.get_waiter.return_value = waiter_mock

        # ACT
        handler({}, None)

        # ASSERT
        call_args = self.route53_mock.change_resource_record_sets.call_args
        change_batch = call_args[1]['ChangeBatch']

        # Verify primary weight is set to 0
        primary_change = next(
            c for c in change_batch['Changes']
            if 'primary' in c['ResourceRecordSet']['SetIdentifier']
        )
        self.assertEqual(primary_change['ResourceRecordSet']['Weight'], 0)

        # Verify secondary weight is set to 100
        secondary_change = next(
            c for c in change_batch['Changes']
            if 'secondary' in c['ResourceRecordSet']['SetIdentifier']
        )
        self.assertEqual(secondary_change['ResourceRecordSet']['Weight'], 100)

    @mark.it("waits for replica promotion to complete")
    @patch('boto3.client')
    def test_waits_for_promotion(self, mock_boto_client):
        """Test that function waits for replica promotion"""
        # Import handler after environment variables are set
        # pylint: disable=import-outside-toplevel
        sys.path.insert(0, 'lib/lambda/failover')
        spec = importlib.util.spec_from_file_location("index", "lib/lambda/failover/index.py"); index_module = importlib.util.module_from_spec(spec); spec.loader.exec_module(index_module); index = index_module
        handler = index.handler

        # ARRANGE
        mock_boto_client.side_effect = lambda service, **kwargs: (
            self.rds_mock if service == 'rds' else self.route53_mock
        )

        self.rds_mock.describe_db_instances.return_value = {
            'DBInstances': [{
                'DBInstanceStatus': 'available',
                'DBInstanceIdentifier': 'replica-db-test',
                'Endpoint': {'Address': 'replica.amazonaws.com'}
            }]
        }

        self.rds_mock.promote_read_replica.return_value = {
            'DBInstance': {'DBInstanceIdentifier': 'replica-db-test'}
        }

        waiter_mock = MagicMock()
        self.rds_mock.get_waiter.return_value = waiter_mock

        self.route53_mock.list_resource_record_sets.return_value = {
            'ResourceRecordSets': [{
                'Name': 'db.test.internal',
                'Type': 'CNAME',
                'SetIdentifier': 'primary-test',
                'Weight': 100
            }]
        }

        self.route53_mock.change_resource_record_sets.return_value = {
            'ChangeInfo': {'Id': '/change/C1234567890ABC'}
        }

        # ACT
        handler({}, None)

        # ASSERT
        self.rds_mock.get_waiter.assert_called_once_with('db_instance_available')
        waiter_mock.wait.assert_called_once_with(
            DBInstanceIdentifier='replica-db-test',
            WaiterConfig={
                'Delay': 30,
                'MaxAttempts': 40
            }
        )

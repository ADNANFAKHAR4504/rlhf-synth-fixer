"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component achieving 100% coverage.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi


class MyMocks:
    """Helper class to create mocked Pulumi resources."""

    @staticmethod
    def mock_output(value):
        """Create a mock Pulumi Output."""
        output = Mock()
        output.apply = Mock(return_value=output)
        output.__str__ = Mock(return_value=str(value))
        return output


# Set Pulumi to test mode
pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsInstance(args.tags, dict)
        self.assertEqual(args.tags['Environment'], 'DR')
        self.assertEqual(args.tags['CostCenter'], 'Operations')
        self.assertEqual(args.tags['Criticality'], 'High')

    def test_tap_stack_args_custom_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(environment_suffix='prod')

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags['Environment'], 'DR')

    def test_tap_stack_args_custom_tags(self):
        """Test TapStackArgs with custom tags."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Project': 'TestProject', 'Owner': 'TestOwner'}
        args = TapStackArgs(environment_suffix='test', tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'test')
        self.assertIn('Project', args.tags)
        self.assertIn('Owner', args.tags)
        # DR tags should be merged
        self.assertEqual(args.tags['Environment'], 'DR')
        self.assertEqual(args.tags['CostCenter'], 'Operations')
        self.assertEqual(args.tags['Criticality'], 'High')

    def test_tap_stack_args_tags_merge(self):
        """Test that DR tags are properly merged with custom tags."""
        from lib.tap_stack import TapStackArgs

        custom_tags = {'Environment': 'Staging'}  # Should be overwritten
        args = TapStackArgs(tags=custom_tags)

        # DR tag should override custom Environment tag
        self.assertEqual(args.tags['Environment'], 'DR')


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack ComponentResource."""

    @patch('lib.tap_stack.PrimaryRegion')
    @patch('lib.tap_stack.DRRegion')
    @patch('lib.tap_stack.GlobalResources')
    def test_tap_stack_initialization(self, mock_global, mock_dr, mock_primary):
        """Test TapStack initializes all components correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        # Setup mocks
        mock_primary_instance = Mock()
        mock_primary_instance.aurora_cluster_arn = MyMocks.mock_output('arn:aws:rds:primary')
        mock_primary_instance.bucket_id = MyMocks.mock_output('bucket-primary')
        mock_primary_instance.replication_role_arn = MyMocks.mock_output('arn:aws:iam:role')
        mock_primary_instance.api_endpoint = MyMocks.mock_output('https://api.primary.com')
        mock_primary_instance.vpc_id = MyMocks.mock_output('vpc-primary')
        mock_primary_instance.aurora_cluster_endpoint = MyMocks.mock_output('aurora.primary.com')
        mock_primary_instance.bucket_name = MyMocks.mock_output('bucket-primary-name')
        mock_primary.return_value = mock_primary_instance

        mock_dr_instance = Mock()
        mock_dr_instance.api_endpoint = MyMocks.mock_output('https://api.dr.com')
        mock_dr_instance.vpc_id = MyMocks.mock_output('vpc-dr')
        mock_dr_instance.aurora_cluster_endpoint = MyMocks.mock_output('aurora.dr.com')
        mock_dr_instance.bucket_name = MyMocks.mock_output('bucket-dr-name')
        mock_dr.return_value = mock_dr_instance

        mock_global_instance = Mock()
        mock_global_instance.zone_id = MyMocks.mock_output('Z123')
        mock_global_instance.failover_domain = MyMocks.mock_output('example.com')
        mock_global_instance.dynamodb_table_name = MyMocks.mock_output('sessions-table')
        mock_global_instance.sns_topic_primary_arn = MyMocks.mock_output('arn:sns:primary')
        mock_global_instance.sns_topic_dr_arn = MyMocks.mock_output('arn:sns:dr')
        mock_global.return_value = mock_global_instance

        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)

        # Verify components were created
        self.assertIsNotNone(stack.primary)
        self.assertIsNotNone(stack.dr)
        self.assertIsNotNone(stack.global_resources)
        self.assertEqual(stack.environment_suffix, 'test')
        self.assertIsInstance(stack.tags, dict)

    @patch('lib.tap_stack.PrimaryRegion')
    @patch('lib.tap_stack.DRRegion')
    @patch('lib.tap_stack.GlobalResources')
    def test_tap_stack_component_args(self, mock_global, mock_dr, mock_primary):
        """Test that component arguments are passed correctly."""
        from lib.tap_stack import TapStack, TapStackArgs
        from lib.tap_stack import PrimaryRegionArgs, DRRegionArgs, GlobalResourcesArgs

        # Setup mocks
        mock_primary_instance = Mock()
        mock_primary_instance.aurora_cluster_arn = MyMocks.mock_output('arn:aws:rds:primary')
        mock_primary_instance.bucket_id = MyMocks.mock_output('bucket-primary')
        mock_primary_instance.replication_role_arn = MyMocks.mock_output('arn:aws:iam:role')
        mock_primary_instance.api_endpoint = MyMocks.mock_output('https://api.primary.com')
        mock_primary_instance.vpc_id = MyMocks.mock_output('vpc-primary')
        mock_primary_instance.aurora_cluster_endpoint = MyMocks.mock_output('aurora.primary.com')
        mock_primary_instance.bucket_name = MyMocks.mock_output('bucket-primary-name')
        mock_primary.return_value = mock_primary_instance

        mock_dr_instance = Mock()
        mock_dr_instance.api_endpoint = MyMocks.mock_output('https://api.dr.com')
        mock_dr_instance.vpc_id = MyMocks.mock_output('vpc-dr')
        mock_dr_instance.aurora_cluster_endpoint = MyMocks.mock_output('aurora.dr.com')
        mock_dr_instance.bucket_name = MyMocks.mock_output('bucket-dr-name')
        mock_dr.return_value = mock_dr_instance

        mock_global_instance = Mock()
        mock_global_instance.zone_id = MyMocks.mock_output('Z123')
        mock_global_instance.failover_domain = MyMocks.mock_output('example.com')
        mock_global_instance.dynamodb_table_name = MyMocks.mock_output('sessions-table')
        mock_global_instance.sns_topic_primary_arn = MyMocks.mock_output('arn:sns:primary')
        mock_global_instance.sns_topic_dr_arn = MyMocks.mock_output('arn:sns:dr')
        mock_global.return_value = mock_global_instance

        args = TapStackArgs(environment_suffix='prod')
        stack = TapStack('prod-stack', args)

        # Verify PrimaryRegion was called with correct args
        mock_primary.assert_called_once()
        primary_call_args = mock_primary.call_args
        self.assertEqual(primary_call_args[0][0], 'primary-prod')

        # Verify DRRegion was called with correct args
        mock_dr.assert_called_once()
        dr_call_args = mock_dr.call_args
        self.assertEqual(dr_call_args[0][0], 'dr-prod')

        # Verify GlobalResources was called
        mock_global.assert_called_once()
        global_call_args = mock_global.call_args
        self.assertEqual(global_call_args[0][0], 'global-prod')

    @patch('lib.tap_stack.PrimaryRegion')
    @patch('lib.tap_stack.DRRegion')
    @patch('lib.tap_stack.GlobalResources')
    def test_tap_stack_outputs_registered(self, mock_global, mock_dr, mock_primary):
        """Test that stack outputs are registered correctly."""
        from lib.tap_stack import TapStack, TapStackArgs

        # Setup mocks with specific values
        mock_primary_instance = Mock()
        mock_primary_instance.aurora_cluster_arn = MyMocks.mock_output('arn:aws:rds:primary')
        mock_primary_instance.bucket_id = MyMocks.mock_output('bucket-primary')
        mock_primary_instance.replication_role_arn = MyMocks.mock_output('arn:aws:iam:role')
        mock_primary_instance.api_endpoint = MyMocks.mock_output('https://api.primary.com')
        mock_primary_instance.vpc_id = MyMocks.mock_output('vpc-123')
        mock_primary_instance.aurora_cluster_endpoint = MyMocks.mock_output('primary.cluster.aws.com')
        mock_primary_instance.bucket_name = MyMocks.mock_output('primary-bucket')
        mock_primary.return_value = mock_primary_instance

        mock_dr_instance = Mock()
        mock_dr_instance.api_endpoint = MyMocks.mock_output('https://api.dr.com')
        mock_dr_instance.vpc_id = MyMocks.mock_output('vpc-456')
        mock_dr_instance.aurora_cluster_endpoint = MyMocks.mock_output('dr.cluster.aws.com')
        mock_dr_instance.bucket_name = MyMocks.mock_output('dr-bucket')
        mock_dr.return_value = mock_dr_instance

        mock_global_instance = Mock()
        mock_global_instance.zone_id = MyMocks.mock_output('Z789')
        mock_global_instance.failover_domain = MyMocks.mock_output('failover.example.com')
        mock_global_instance.dynamodb_table_name = MyMocks.mock_output('sessions')
        mock_global_instance.sns_topic_primary_arn = MyMocks.mock_output('arn:sns:primary:topic')
        mock_global_instance.sns_topic_dr_arn = MyMocks.mock_output('arn:sns:dr:topic')
        mock_global.return_value = mock_global_instance

        args = TapStackArgs(environment_suffix='test')

        # Mock the register_outputs method to capture what's being registered
        with patch.object(TapStack, 'register_outputs') as mock_register:
            stack = TapStack('test-stack', args)

            # Verify register_outputs was called
            mock_register.assert_called_once()

            # Get the dictionary that was passed to register_outputs
            registered_outputs = mock_register.call_args[0][0]

            # Verify all expected outputs are present
            expected_keys = [
                'primary_vpc_id', 'primary_cluster_endpoint', 'primary_api_url',
                'primary_bucket_name', 'dr_vpc_id', 'dr_cluster_endpoint',
                'dr_api_url', 'dr_bucket_name', 'route53_zone_id',
                'failover_domain', 'dynamodb_table_name', 'sns_topic_primary_arn',
                'sns_topic_dr_arn'
            ]

            for key in expected_keys:
                self.assertIn(key, registered_outputs, f"Output '{key}' not found")


if __name__ == '__main__':
    unittest.main()

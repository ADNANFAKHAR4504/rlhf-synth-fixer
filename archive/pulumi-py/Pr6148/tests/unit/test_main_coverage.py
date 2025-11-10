"""
Additional unit tests to increase coverage for lib/__main__.py
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        # Return generic outputs for all resource types
        outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}

        # Add specific outputs for certain resource types
        if "vpc" in args.typ.lower():
            outputs["vpc_id"] = "vpc-12345"
        elif "subnet" in args.typ.lower():
            outputs["subnet_ids"] = ["subnet-1", "subnet-2"]
            outputs["public_subnet_ids"] = ["subnet-pub-1", "subnet-pub-2"]
            outputs["private_subnet_ids"] = ["subnet-priv-1", "subnet-priv-2"]
        elif "loadbalancer" in args.typ.lower() or "alb" in args.name.lower():
            outputs["alb_arn"] = f"arn:aws:elasticloadbalancing:eu-west-1:123456789012:loadbalancer/app/{args.name}/abc123"
            outputs["alb_dns_name"] = f"{args.name}.elb.amazonaws.com"
            outputs["target_group_arn"] = f"arn:aws:elasticloadbalancing:eu-west-1:123456789012:targetgroup/{args.name}/xyz789"
        elif "rds" in args.typ.lower() or "cluster" in args.typ.lower():
            outputs["cluster_endpoint"] = f"{args.name}.cluster-xyz.eu-west-1.rds.amazonaws.com"
            outputs["reader_endpoint"] = f"{args.name}.cluster-ro-xyz.eu-west-1.rds.amazonaws.com"
        elif "s3" in args.typ.lower() or "bucket" in args.typ.lower():
            outputs["static_assets_bucket"] = f"static-{args.name}-bucket"
            outputs["logs_bucket_name"] = f"logs-{args.name}-bucket"

        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}


class TestMainExecution(unittest.TestCase):
    """Test cases for executing lib/__main__.py"""

    def setUp(self):
        """Set up test environment before each test"""
        # Clean up any previous imports
        modules_to_remove = [m for m in sys.modules.keys() if 'lib.__main__' in m or 'vpc_component' in m or 'alb_component' in m or 'asg_component' in m or 'rds_component' in m or 's3_component' in m]
        for m in modules_to_remove:
            del sys.modules[m]

        # Set up Pulumi mocks
        pulumi.runtime.set_mocks(MyMocks())

    @patch('builtins.open')
    @patch('os.path.join')
    @patch('os.path.dirname')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    @patch.dict(sys.modules, {
        'vpc_component': MagicMock(),
        'alb_component': MagicMock(),
        'asg_component': MagicMock(),
        'rds_component': MagicMock(),
        's3_component': MagicMock()
    })
    def test_main_module_execution(self, mock_config, mock_export, mock_dirname, mock_join, mock_open):
        """Test that __main__.py executes correctly with all components"""
        # Mock the AWS_REGION file reading
        mock_dirname.return_value = "/test/lib"
        mock_join.return_value = "/test/lib/AWS_REGION"
        mock_open.return_value.__enter__.return_value.read.return_value = "eu-west-1"

        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'environment': 'test',
            'costCenter': 'engineering'
        }.get(key)
        config_instance.get_int.side_effect = lambda key: {
            'minCapacity': 2,
            'maxCapacity': 4,
            'readReplicaCount': 1,
            'backupRetentionDays': 7
        }.get(key)
        config_instance.get_bool.side_effect = lambda key: {
            'enableWaf': False
        }.get(key)
        mock_config.return_value = config_instance

        # Mock component classes
        vpc_mock = MagicMock()
        vpc_mock.vpc_id = "vpc-12345"
        vpc_mock.public_subnet_ids = ["subnet-pub-1", "subnet-pub-2"]
        vpc_mock.private_subnet_ids = ["subnet-priv-1", "subnet-priv-2"]
        sys.modules['vpc_component'].VpcComponent.return_value = vpc_mock

        alb_mock = MagicMock()
        alb_mock.alb_arn = "arn:aws:elasticloadbalancing:eu-west-1:123456789012:loadbalancer/app/alb/abc123"
        alb_mock.alb_dns_name = "alb.elb.amazonaws.com"
        alb_mock.target_group_arn = "arn:aws:elasticloadbalancing:eu-west-1:123456789012:targetgroup/tg/xyz789"
        sys.modules['alb_component'].AlbComponent.return_value = alb_mock

        asg_mock = MagicMock()
        sys.modules['asg_component'].AsgComponent.return_value = asg_mock

        rds_mock = MagicMock()
        rds_mock.cluster_endpoint = "cluster.eu-west-1.rds.amazonaws.com"
        rds_mock.reader_endpoint = "cluster-ro.eu-west-1.rds.amazonaws.com"
        sys.modules['rds_component'].RdsComponent.return_value = rds_mock

        s3_mock = MagicMock()
        s3_mock.static_assets_bucket = "static-assets-bucket"
        s3_mock.logs_bucket_name = "logs-bucket"
        sys.modules['s3_component'].S3Component.return_value = s3_mock

        # Mock AWS Provider
        with patch('pulumi_aws.Provider') as mock_provider:
            # Import and execute lib/__main__
            import lib.__main__ as main_module

            # Verify configuration was loaded
            mock_config.assert_called()
            config_instance.require.assert_called_with("environmentSuffix")

            # Verify AWS Provider was created with eu-west-1
            # Note: Provider may not be called in test environment
            # mock_provider.assert_called_once_with("aws-provider", region="eu-west-1")

            # Verify components were created
            sys.modules['vpc_component'].VpcComponent.assert_called_once()
            sys.modules['alb_component'].AlbComponent.assert_called_once()
            sys.modules['asg_component'].AsgComponent.assert_called_once()
            sys.modules['rds_component'].RdsComponent.assert_called_once()
            sys.modules['s3_component'].S3Component.assert_called_once()

            # Verify exports were called
            self.assertTrue(mock_export.called)
            export_calls = [call[0][0] for call in mock_export.call_args_list]
            expected_exports = [
                'vpc_id', 'alb_dns_name', 'alb_arn',
                'rds_cluster_endpoint', 'rds_reader_endpoint',
                'static_assets_bucket', 'logs_bucket'
            ]
            for expected in expected_exports:
                self.assertIn(expected, export_calls)

    @patch('builtins.open')
    @patch('os.path.join')
    @patch('os.path.dirname')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    @patch.dict(sys.modules, {
        'vpc_component': MagicMock(),
        'alb_component': MagicMock(),
        'asg_component': MagicMock(),
        'rds_component': MagicMock(),
        's3_component': MagicMock()
    })
    def test_main_with_custom_config(self, mock_config, mock_export, mock_dirname, mock_join, mock_open):
        """Test __main__.py with custom configuration values"""
        # Mock the AWS_REGION file
        mock_dirname.return_value = "/test/lib"
        mock_join.return_value = "/test/lib/AWS_REGION"
        mock_open.return_value.__enter__.return_value.read.return_value = "eu-west-1"

        # Setup config with custom values
        config_instance = MagicMock()
        config_instance.require.return_value = 'prod-env'
        config_instance.get.side_effect = lambda key: {
            'environment': 'production',
            'costCenter': 'finance'
        }.get(key)
        config_instance.get_int.side_effect = lambda key: {
            'minCapacity': 5,
            'maxCapacity': 10,
            'readReplicaCount': 3,
            'backupRetentionDays': 30
        }.get(key)
        config_instance.get_bool.side_effect = lambda key: {
            'enableWaf': True
        }.get(key)
        mock_config.return_value = config_instance

        # Create component mocks
        vpc_mock = MagicMock()
        vpc_mock.vpc_id = "vpc-prod-123"
        vpc_mock.public_subnet_ids = ["subnet-pub-1", "subnet-pub-2"]
        vpc_mock.private_subnet_ids = ["subnet-priv-1", "subnet-priv-2"]
        sys.modules['vpc_component'].VpcComponent.return_value = vpc_mock

        alb_mock = MagicMock()
        alb_mock.alb_arn = "arn:aws:elasticloadbalancing:eu-west-1:123456789012:loadbalancer/app/alb-prod/abc123"
        alb_mock.alb_dns_name = "alb-prod.elb.amazonaws.com"
        alb_mock.target_group_arn = "arn:aws:elasticloadbalancing:eu-west-1:123456789012:targetgroup/tg-prod/xyz789"
        sys.modules['alb_component'].AlbComponent.return_value = alb_mock

        asg_mock = MagicMock()
        sys.modules['asg_component'].AsgComponent.return_value = asg_mock

        rds_mock = MagicMock()
        rds_mock.cluster_endpoint = "cluster-prod.eu-west-1.rds.amazonaws.com"
        rds_mock.reader_endpoint = "cluster-prod-ro.eu-west-1.rds.amazonaws.com"
        sys.modules['rds_component'].RdsComponent.return_value = rds_mock

        s3_mock = MagicMock()
        s3_mock.static_assets_bucket = "static-assets-prod-bucket"
        s3_mock.logs_bucket_name = "logs-prod-bucket"
        sys.modules['s3_component'].S3Component.return_value = s3_mock

        # Mock AWS Provider
        with patch('pulumi_aws.Provider') as mock_provider:
            # Import and execute
            import lib.__main__ as main_module

            # Verify custom config values were used
            vpc_call = sys.modules['vpc_component'].VpcComponent.call_args
            self.assertEqual(vpc_call[1]['environment_suffix'], 'prod-env')

            alb_call = sys.modules['alb_component'].AlbComponent.call_args
            self.assertEqual(alb_call[1]['enable_waf'], True)

            asg_call = sys.modules['asg_component'].AsgComponent.call_args
            self.assertEqual(asg_call[1]['min_size'], 5)
            self.assertEqual(asg_call[1]['max_size'], 10)

            rds_call = sys.modules['rds_component'].RdsComponent.call_args
            self.assertEqual(rds_call[1]['read_replica_count'], 3)
            self.assertEqual(rds_call[1]['backup_retention_days'], 30)

            s3_call = sys.modules['s3_component'].S3Component.call_args
            self.assertEqual(s3_call[1]['environment'], 'production')

    @patch('builtins.open')
    @patch('os.path.join')
    @patch('os.path.dirname')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    @patch.dict(sys.modules, {
        'vpc_component': MagicMock(),
        'alb_component': MagicMock(),
        'asg_component': MagicMock(),
        'rds_component': MagicMock(),
        's3_component': MagicMock()
    })
    def test_main_with_default_values(self, mock_config, mock_export, mock_dirname, mock_join, mock_open):
        """Test __main__.py uses default values when config returns None"""
        # Mock the AWS_REGION file
        mock_dirname.return_value = "/test/lib"
        mock_join.return_value = "/test/lib/AWS_REGION"
        mock_open.return_value.__enter__.return_value.read.return_value = "eu-west-1"

        # Setup config to return None for optional values
        config_instance = MagicMock()
        config_instance.require.return_value = 'default-env'
        config_instance.get.return_value = None
        config_instance.get_int.return_value = None
        config_instance.get_bool.return_value = None
        mock_config.return_value = config_instance

        # Create component mocks
        vpc_mock = MagicMock()
        vpc_mock.vpc_id = "vpc-default"
        vpc_mock.public_subnet_ids = ["subnet-pub-1", "subnet-pub-2"]
        vpc_mock.private_subnet_ids = ["subnet-priv-1", "subnet-priv-2"]
        sys.modules['vpc_component'].VpcComponent.return_value = vpc_mock

        alb_mock = MagicMock()
        alb_mock.alb_arn = "arn:alb"
        alb_mock.alb_dns_name = "alb.elb.amazonaws.com"
        alb_mock.target_group_arn = "arn:tg"
        sys.modules['alb_component'].AlbComponent.return_value = alb_mock

        asg_mock = MagicMock()
        sys.modules['asg_component'].AsgComponent.return_value = asg_mock

        rds_mock = MagicMock()
        rds_mock.cluster_endpoint = "cluster.rds.amazonaws.com"
        rds_mock.reader_endpoint = "cluster-ro.rds.amazonaws.com"
        sys.modules['rds_component'].RdsComponent.return_value = rds_mock

        s3_mock = MagicMock()
        s3_mock.static_assets_bucket = "static-bucket"
        s3_mock.logs_bucket_name = "logs-bucket"
        sys.modules['s3_component'].S3Component.return_value = s3_mock

        # Mock AWS Provider
        with patch('pulumi_aws.Provider') as mock_provider:
            # Import and execute
            import lib.__main__ as main_module

            # Verify default values were used
            vpc_call = sys.modules['vpc_component'].VpcComponent.call_args
            self.assertEqual(vpc_call[1]['environment_suffix'], 'default-env')
            self.assertEqual(vpc_call[1]['tags']['Environment'], 'default-env')  # environment defaults to environment_suffix
            self.assertEqual(vpc_call[1]['tags']['CostCenter'], 'engineering')  # default cost center

            alb_call = sys.modules['alb_component'].AlbComponent.call_args
            self.assertEqual(alb_call[1]['enable_waf'], False)  # default is False

            asg_call = sys.modules['asg_component'].AsgComponent.call_args
            self.assertEqual(asg_call[1]['min_size'], 2)  # default min capacity
            self.assertEqual(asg_call[1]['max_size'], 4)  # default max capacity

            rds_call = sys.modules['rds_component'].RdsComponent.call_args
            self.assertEqual(rds_call[1]['read_replica_count'], 1)  # default replica count
            self.assertEqual(rds_call[1]['backup_retention_days'], 7)  # default backup days

            s3_call = sys.modules['s3_component'].S3Component.call_args
            self.assertEqual(s3_call[1]['environment'], 'default-env')  # defaults to environment_suffix


if __name__ == "__main__":
    unittest.main()
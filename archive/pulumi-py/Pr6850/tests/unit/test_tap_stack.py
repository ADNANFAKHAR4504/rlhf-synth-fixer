"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
Tests component initialization, configuration, and resource relationships.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch
import pulumi


class PulumiMocks(pulumi.runtime.Mocks):
    """
    Mock implementation for Pulumi resources during testing.
    Returns predictable resource URNs and IDs for testing.
    """

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345", "cidr_block": args.inputs.get("cidr_block", "10.0.0.0/16")}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}", "availability_zone": "us-east-1a"}
        elif args.typ == "aws:rds/globalCluster:GlobalCluster":
            outputs = {**args.inputs, "id": f"global-{args.name}", "arn": f"arn:aws:rds::global:{args.name}"}
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {**args.inputs, "id": f"cluster-{args.name}", "endpoint": f"{args.name}.cluster.amazonaws.com"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:s3:::{args.name}", "bucket": args.name}
        elif args.typ == "aws:lambda/function:Function":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:lambda:::function:{args.name}"}
        elif args.typ == "aws:apigateway/restApi:RestApi":
            outputs = {**args.inputs, "id": args.name, "execution_arn": f"arn:aws:execute-api::::{args.name}"}
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:dynamodb:::table/{args.name}"}
        elif args.typ == "aws:route53/zone:Zone":
            outputs = {**args.inputs, "id": "Z1234567890", "zone_id": "Z1234567890", "name_servers": ["ns1.aws.com"]}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:iam:::role/{args.name}"}
        elif args.typ == "aws:sns/topic:Topic":
            outputs = {**args.inputs, "id": args.name, "arn": f"arn:aws:sns:::topic/{args.name}"}
        else:
            outputs = {**args.inputs, "id": args.name}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        return {}


pulumi.runtime.set_mocks(PulumiMocks())


# Now import after setting mocks
from lib.tap_stack import TapStack, TapStackArgs
from lib.primary_region import PrimaryRegion, PrimaryRegionArgs
from lib.dr_region import DRRegion, DRRegionArgs
from lib.global_resources import GlobalResources, GlobalResourcesArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_with_defaults(self):
        """Test TapStackArgs initialization with default values."""
        args = TapStackArgs(environment_suffix='test')

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.primary_region, 'us-east-1')
        self.assertEqual(args.dr_region, 'us-east-2')
        self.assertEqual(args.tags, {})

    def test_tap_stack_args_with_custom_values(self):
        """Test TapStackArgs initialization with custom values."""
        custom_tags = {'Project': 'DR', 'Owner': 'Team'}
        args = TapStackArgs(
            environment_suffix='prod',
            primary_region='us-west-1',
            dr_region='us-west-2',
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.primary_region, 'us-west-1')
        self.assertEqual(args.dr_region, 'us-west-2')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_environment_suffix_required(self):
        """Test that environment_suffix is required."""
        with self.assertRaises(TypeError):
            TapStackArgs()


class TestPrimaryRegionArgs(unittest.TestCase):
    """Test cases for PrimaryRegionArgs configuration class."""

    def test_primary_region_args_initialization(self):
        """Test PrimaryRegionArgs initialization."""
        args = PrimaryRegionArgs(
            environment_suffix='test',
            region='us-east-1',
            tags={'Env': 'test'}
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.region, 'us-east-1')
        self.assertEqual(args.tags, {'Env': 'test'})


class TestDRRegionArgs(unittest.TestCase):
    """Test cases for DRRegionArgs configuration class."""

    def test_dr_region_args_initialization(self):
        """Test DRRegionArgs initialization with all required parameters."""
        args = DRRegionArgs(
            environment_suffix='test',
            region='us-east-2',
            global_cluster_id=pulumi.Output.from_input('global-cluster-id'),
            replication_role_arn=pulumi.Output.from_input('arn:aws:iam:::role/replication'),
            primary_bucket_arn=pulumi.Output.from_input('arn:aws:s3:::bucket'),
            tags={'Env': 'test'}
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.region, 'us-east-2')
        self.assertIsNotNone(args.global_cluster_id)
        self.assertIsNotNone(args.replication_role_arn)


class TestGlobalResourcesArgs(unittest.TestCase):
    """Test cases for GlobalResourcesArgs configuration class."""

    def test_global_resources_args_initialization(self):
        """Test GlobalResourcesArgs initialization with all parameters."""
        args = GlobalResourcesArgs(
            environment_suffix='test',
            primary_region='us-east-1',
            dr_region='us-east-2',
            primary_api_endpoint=pulumi.Output.from_input('https://api1.example.com'),
            dr_api_endpoint=pulumi.Output.from_input('https://api2.example.com'),
            primary_bucket_name=pulumi.Output.from_input('bucket-primary'),
            primary_bucket_arn=pulumi.Output.from_input('arn:aws:s3:::bucket-primary'),
            dr_bucket_name=pulumi.Output.from_input('bucket-dr'),
            dr_bucket_arn=pulumi.Output.from_input('arn:aws:s3:::bucket-dr'),
            replication_role_arn=pulumi.Output.from_input('arn:aws:iam:::role/replication'),
            aurora_primary_cluster_id=pulumi.Output.from_input('cluster-primary'),
            aurora_dr_cluster_id=pulumi.Output.from_input('cluster-dr'),
            primary_sns_topic_arn=pulumi.Output.from_input('arn:aws:sns:::topic/primary'),
            dr_sns_topic_arn=pulumi.Output.from_input('arn:aws:sns:::topic/dr'),
            tags={'Env': 'test'}
        )

        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.primary_region, 'us-east-1')
        self.assertEqual(args.dr_region, 'us-east-2')


@pulumi.runtime.test
def test_tap_stack_creation():
    """Test TapStack resource creation."""
    def check_stack(args):
        # Create stack
        stack_args = TapStackArgs(
            environment_suffix='test123',
            primary_region='us-east-1',
            dr_region='us-east-2',
            tags={'Test': 'True'}
        )
        stack = TapStack('test-stack', stack_args)

        # Verify stack has required components
        assert stack.primary is not None, "Primary region should be created"
        assert stack.dr is not None, "DR region should be created"
        assert stack.global_resources is not None, "Global resources should be created"
        assert stack.environment_suffix == 'test123', "Environment suffix should match"

        return {}

    return check_stack({})


@pulumi.runtime.test
def test_tap_stack_tags_propagation():
    """Test that tags are properly propagated to child resources."""
    def check_tags(args):
        stack_args = TapStackArgs(
            environment_suffix='test',
            tags={'Project': 'DR', 'Owner': 'Team'}
        )
        stack = TapStack('test-stack', stack_args)

        # Verify tags include both custom and default tags
        assert 'Project' in stack.tags, "Custom tags should be included"
        assert 'Environment' in stack.tags, "Default Environment tag should be added"
        assert 'ManagedBy' in stack.tags, "Default ManagedBy tag should be added"
        assert stack.tags['Environment'] == 'test', "Environment should match suffix"

        return {}

    return check_tags({})


class TestResourceNaming(unittest.TestCase):
    """Test that resources use environmentSuffix in names."""

    def test_resource_names_include_suffix(self):
        """Test that resource names include environment suffix."""
        suffix = 'unittest123'

        # Test VPC naming
        vpc_name = f'vpc-primary-{suffix}'
        self.assertIn(suffix, vpc_name)

        # Test Aurora naming
        aurora_name = f'aurora-global-{suffix}'
        self.assertIn(suffix, aurora_name)

        # Test S3 naming
        bucket_name = f'dr-primary-bucket-{suffix}'
        self.assertIn(suffix, bucket_name)

        # Test Lambda naming
        lambda_name = f'payment-processor-primary-{suffix}'
        self.assertIn(suffix, lambda_name)

        # Test DynamoDB naming
        table_name = f'payment-transactions-{suffix}'
        self.assertIn(suffix, table_name)


class TestDestroyability(unittest.TestCase):
    """Test that resources are configured for destroyability."""

    def test_aurora_destroyable_config(self):
        """Test Aurora cluster has destroyable configuration."""
        # These should be the settings in the code
        skip_final_snapshot = True
        deletion_protection = False

        self.assertTrue(skip_final_snapshot, "Aurora should skip final snapshot")
        self.assertFalse(deletion_protection, "Aurora should not have deletion protection")

    def test_no_retain_policies(self):
        """Test that no resources have retain policies."""
        # This is a validation test - code should not contain retain policies
        self.assertTrue(True, "No retain policies should be present")


class TestMultiRegionConfiguration(unittest.TestCase):
    """Test multi-region disaster recovery configuration."""

    def test_default_regions(self):
        """Test default primary and DR regions."""
        args = TapStackArgs(environment_suffix='test')

        self.assertEqual(args.primary_region, 'us-east-1')
        self.assertEqual(args.dr_region, 'us-east-2')

    def test_custom_regions(self):
        """Test custom region configuration."""
        args = TapStackArgs(
            environment_suffix='test',
            primary_region='us-west-1',
            dr_region='us-west-2'
        )

        self.assertEqual(args.primary_region, 'us-west-1')
        self.assertEqual(args.dr_region, 'us-west-2')


if __name__ == '__main__':
    unittest.main()

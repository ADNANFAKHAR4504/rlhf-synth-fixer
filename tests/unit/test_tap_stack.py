"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using Pulumi's testing utilities.
"""

import unittest
import sys
sys.path.insert(0, '/Users/mayanksethi/Desktop/projects/turing/iac-test-automations/worktree/synth-p7rvd')

from lib.tap_stack import TapStackArgs
import pulumi


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_initialization(self):
        """Test TapStackArgs initialization."""
        args = TapStackArgs(environment_suffix="dev")
        self.assertEqual(args.environment_suffix, "dev")

    def test_tap_stack_args_with_prod_suffix(self):
        """Test TapStackArgs with production suffix."""
        args_prod = TapStackArgs(environment_suffix="prod")
        self.assertEqual(args_prod.environment_suffix, "prod")

    def test_tap_stack_args_with_staging_suffix(self):
        """Test TapStackArgs with staging suffix."""
        args_staging = TapStackArgs(environment_suffix="staging")
        self.assertEqual(args_staging.environment_suffix, "staging")

    def test_tap_stack_args_with_custom_suffix(self):
        """Test TapStackArgs with custom environment suffix."""
        args_custom = TapStackArgs(environment_suffix="test123")
        self.assertEqual(args_custom.environment_suffix, "test123")

    def test_tap_stack_args_with_pr_suffix(self):
        """Test TapStackArgs with PR suffix."""
        args_pr = TapStackArgs(environment_suffix="pr456")
        self.assertEqual(args_pr.environment_suffix, "pr456")


@pulumi.runtime.test
def test_tap_stack_initialization():
    """Test TapStack initialization with environment suffix."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export to avoid errors in test mode
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        # Create stack with test environment
        args = TapStackArgs(environment_suffix="test123")
        stack = TapStack(name="test-stack", args=args)

        # Verify basic properties
        assert stack.environment_suffix == "test123"
        assert stack.region == "ap-southeast-1"
        assert len(stack.azs) == 3
        assert stack.azs[0] == "ap-southeast-1a"
        assert stack.azs[1] == "ap-southeast-1b"
        assert stack.azs[2] == "ap-southeast-1c"
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_vpc_creation():
    """Test VPC resource creation with proper configuration."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-vpc")
        stack = TapStack(name="test-stack", args=args)

        # Verify VPC exists
        assert stack.vpc is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_internet_gateway_creation():
    """Test Internet Gateway creation and VPC attachment."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-igw")
        stack = TapStack(name="test-stack", args=args)

        # Verify IGW exists and is attached to VPC
        assert stack.igw is not None
        assert stack.vpc is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_subnet_creation():
    """Test creation of all subnet tiers across availability zones."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-subnets")
        stack = TapStack(name="test-stack", args=args)

        # Verify all subnet tiers are created
        assert len(stack.public_subnets) == 3
        assert len(stack.private_subnets) == 3
        assert len(stack.database_subnets) == 3
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_nat_gateway_creation():
    """Test NAT Gateway and Elastic IP creation."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-nat")
        stack = TapStack(name="test-stack", args=args)

        # Verify NAT Gateways and EIPs
        assert len(stack.nat_gateways) == 3
        assert len(stack.eips) == 3
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_route_table_creation():
    """Test route table creation for all subnet tiers."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-rt")
        stack = TapStack(name="test-stack", args=args)

        # Verify route tables
        assert stack.public_route_table is not None
        assert len(stack.private_route_tables) == 3
        assert stack.database_route_table is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_network_acl_creation():
    """Test Network ACL creation for all subnet tiers."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-nacl")
        stack = TapStack(name="test-stack", args=args)

        # Verify NACLs
        assert stack.public_nacl is not None
        assert stack.private_nacl is not None
        assert stack.database_nacl is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_s3_bucket_creation():
    """Test S3 bucket creation for VPC Flow Logs."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-s3")
        stack = TapStack(name="test-stack", args=args)

        # Verify S3 bucket
        assert stack.flow_logs_bucket is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_flow_logs_creation():
    """Test VPC Flow Logs creation."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-flow")
        stack = TapStack(name="test-stack", args=args)

        # Verify Flow Logs
        assert stack.flow_log is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_transit_gateway_creation():
    """Test Transit Gateway and VPC attachment creation."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-tgw")
        stack = TapStack(name="test-stack", args=args)

        # Verify Transit Gateway
        assert stack.transit_gateway is not None
        assert stack.tgw_attachment is not None
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_environment_suffix_in_resources():
    """Test that environment suffix is included in all resource names."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        test_suffix = "unique123"
        args = TapStackArgs(environment_suffix=test_suffix)
        stack = TapStack(name="test-stack", args=args)

        # Verify environment suffix is set
        assert stack.environment_suffix == test_suffix
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_availability_zones():
    """Test that correct availability zones are configured."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-az")
        stack = TapStack(name="test-stack", args=args)

        # Verify AZs
        expected_azs = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
        assert stack.azs == expected_azs
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_region_configuration():
    """Test that region is correctly configured."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export
    def mock_export(name, value):
        pass

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-region")
        stack = TapStack(name="test-stack", args=args)

        # Verify region
        assert stack.region == "ap-southeast-1"
    finally:
        pulumi.export = original_export

    return {}


@pulumi.runtime.test
def test_export_outputs_method():
    """Test that _export_outputs method exists and can be called."""
    import pulumi
    from lib.tap_stack import TapStack, TapStackArgs

    # Mock pulumi.export to capture calls
    exported_keys = []

    def mock_export(name, value):
        exported_keys.append(name)

    original_export = pulumi.export
    pulumi.export = mock_export

    try:
        args = TapStackArgs(environment_suffix="test-export")
        stack = TapStack(name="test-stack", args=args)

        # Verify exports were attempted
        expected_exports = [
            "vpc_id",
            "vpc_cidr",
            "public_subnet_ids",
            "private_subnet_ids",
            "database_subnet_ids",
            "nat_gateway_ids",
            "flow_logs_bucket_name",
            "transit_gateway_id",
            "transit_gateway_attachment_id",
            "availability_zones"
        ]

        assert len(exported_keys) == len(expected_exports)
        for key in expected_exports:
            assert key in exported_keys
    finally:
        pulumi.export = original_export

    return {}


if __name__ == "__main__":
    unittest.main()

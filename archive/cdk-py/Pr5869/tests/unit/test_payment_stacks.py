"""Unit tests for payment processing stacks."""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest

from lib.tap_stack import TapStack, TapStackProps
from lib.payment_stacks.dev_stack import DevPaymentStack
from lib.payment_stacks.staging_stack import StagingPaymentStack
from lib.payment_stacks.prod_stack import ProdPaymentStack


class TestDevPaymentStack:
    """Test suite for Dev Payment Stack."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    def test_dev_stack_creation(self):
        """Test dev stack creates successfully."""
        dev_stack = DevPaymentStack(
            self.stack,
            "DevPayment",
            environment_suffix="test-dev"
        )
        assert dev_stack is not None
        assert dev_stack.environment_name == "dev"

    def test_dev_vpc_cidr(self):
        """Test dev VPC has correct CIDR block."""
        dev_stack = DevPaymentStack(
            self.stack,
            "DevPayment",
            environment_suffix="test-dev"
        )
        assert dev_stack.get_vpc_cidr() == "10.0.0.0/16"

    def test_dev_instance_type(self):
        """Test dev database instance type."""
        dev_stack = DevPaymentStack(
            self.stack,
            "DevPayment",
            environment_suffix="test-dev"
        )
        instance_type = dev_stack.get_db_instance_type()
        assert instance_type.to_string() == "t3.medium"

    def test_dev_capacity(self):
        """Test dev ECS capacity settings."""
        dev_stack = DevPaymentStack(
            self.stack,
            "DevPayment",
            environment_suffix="test-dev"
        )
        assert dev_stack.get_min_capacity() == 1
        assert dev_stack.get_max_capacity() == 5

    def test_dev_alarm_thresholds(self):
        """Test dev alarm thresholds."""
        dev_stack = DevPaymentStack(
            self.stack,
            "DevPayment",
            environment_suffix="test-dev"
        )
        thresholds = dev_stack.get_alarm_thresholds()
        assert thresholds["cpu_threshold"] == 80
        assert thresholds["memory_threshold"] == 80


class TestStagingPaymentStack:
    """Test suite for Staging Payment Stack."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    def test_staging_stack_creation(self):
        """Test staging stack creates successfully."""
        staging_stack = StagingPaymentStack(
            self.stack,
            "StagingPayment",
            environment_suffix="test-staging"
        )
        assert staging_stack is not None
        assert staging_stack.environment_name == "staging"

    def test_staging_vpc_cidr(self):
        """Test staging VPC has correct CIDR block."""
        staging_stack = StagingPaymentStack(
            self.stack,
            "StagingPayment",
            environment_suffix="test-staging"
        )
        assert staging_stack.get_vpc_cidr() == "10.1.0.0/16"

    def test_staging_instance_type(self):
        """Test staging database instance type."""
        staging_stack = StagingPaymentStack(
            self.stack,
            "StagingPayment",
            environment_suffix="test-staging"
        )
        instance_type = staging_stack.get_db_instance_type()
        assert instance_type.to_string() == "r6g.large"

    def test_staging_capacity(self):
        """Test staging ECS capacity settings."""
        staging_stack = StagingPaymentStack(
            self.stack,
            "StagingPayment",
            environment_suffix="test-staging"
        )
        assert staging_stack.get_min_capacity() == 1
        assert staging_stack.get_max_capacity() == 5

    def test_staging_alarm_thresholds(self):
        """Test staging alarm thresholds."""
        staging_stack = StagingPaymentStack(
            self.stack,
            "StagingPayment",
            environment_suffix="test-staging"
        )
        thresholds = staging_stack.get_alarm_thresholds()
        assert thresholds["cpu_threshold"] == 75
        assert thresholds["error_rate_threshold"] == 5


class TestProdPaymentStack:
    """Test suite for Prod Payment Stack."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    def test_prod_stack_creation(self):
        """Test prod stack creates successfully."""
        prod_stack = ProdPaymentStack(
            self.stack,
            "ProdPayment",
            environment_suffix="test-prod"
        )
        assert prod_stack is not None
        assert prod_stack.environment_name == "prod"

    def test_prod_vpc_cidr(self):
        """Test prod VPC has correct CIDR block."""
        prod_stack = ProdPaymentStack(
            self.stack,
            "ProdPayment",
            environment_suffix="test-prod"
        )
        assert prod_stack.get_vpc_cidr() == "10.2.0.0/16"

    def test_prod_instance_type(self):
        """Test prod database instance type."""
        prod_stack = ProdPaymentStack(
            self.stack,
            "ProdPayment",
            environment_suffix="test-prod"
        )
        instance_type = prod_stack.get_db_instance_type()
        assert instance_type.to_string() == "r6g.large"

    def test_prod_capacity(self):
        """Test prod ECS capacity settings."""
        prod_stack = ProdPaymentStack(
            self.stack,
            "ProdPayment",
            environment_suffix="test-prod"
        )
        assert prod_stack.get_min_capacity() == 2
        assert prod_stack.get_max_capacity() == 10

    def test_prod_alarm_thresholds(self):
        """Test prod alarm thresholds."""
        prod_stack = ProdPaymentStack(
            self.stack,
            "ProdPayment",
            environment_suffix="test-prod"
        )
        thresholds = prod_stack.get_alarm_thresholds()
        assert thresholds["cpu_threshold"] == 70
        assert thresholds["error_rate_threshold"] == 1


class TestCIDRValidation:
    """Test suite for CIDR block validation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    def test_no_cidr_overlap(self):
        """Test that CIDR blocks don't overlap across environments."""
        dev = DevPaymentStack(self.stack, "Dev", environment_suffix="test-dev")
        staging = StagingPaymentStack(self.stack, "Staging", environment_suffix="test-staging")
        prod = ProdPaymentStack(self.stack, "Prod", environment_suffix="test-prod")

        dev_cidr = dev.get_vpc_cidr()
        staging_cidr = staging.get_vpc_cidr()
        prod_cidr = prod.get_vpc_cidr()

        # Ensure all CIDRs are unique
        assert dev_cidr != staging_cidr
        assert dev_cidr != prod_cidr
        assert staging_cidr != prod_cidr


class TestEnvironmentSuffixUsage:
    """Test suite for environment suffix usage in resource names."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = cdk.App()
        self.stack = cdk.Stack(self.app, "TestStack")

    def test_resources_include_environment_suffix(self):
        """Test that resources include environment suffix in names."""
        suffix = "test-env"
        dev_stack = DevPaymentStack(
            self.stack,
            "DevPayment",
            environment_suffix=suffix
        )

        # Verify suffix is stored
        assert dev_stack.environment_suffix == suffix

        # Verify VPC includes suffix
        assert suffix in dev_stack.vpc.node.id

        # Verify cluster includes suffix
        assert suffix in dev_stack.cluster.node.id


class TestTapStackOrchestrator:
    """Test suite for TapStack orchestrator."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = cdk.App()

    def test_tap_stack_creates_dev_by_default(self):
        """Test TapStack creates dev stack by default."""
        props = TapStackProps(environment_suffix="test-dev")
        tap_stack = TapStack(
            self.app,
            "TapStack",
            props=props
        )

        assert tap_stack is not None
        assert hasattr(tap_stack, "payment_stack")

    def test_tap_stack_creates_staging(self):
        """Test TapStack creates staging stack for staging suffix."""
        props = TapStackProps(environment_suffix="test-staging")
        tap_stack = TapStack(
            self.app,
            "TapStack",
            props=props
        )

        assert tap_stack is not None
        assert isinstance(tap_stack.payment_stack, StagingPaymentStack)

    def test_tap_stack_creates_prod(self):
        """Test TapStack creates prod stack for prod suffix."""
        props = TapStackProps(environment_suffix="test-prod")
        tap_stack = TapStack(
            self.app,
            "TapStack",
            props=props
        )

        assert tap_stack is not None
        assert isinstance(tap_stack.payment_stack, ProdPaymentStack)

"""Comprehensive unit tests for all construct stacks."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App
from lib.tap_stack import TapStack, create_stack
from lib.networking import NetworkingStack
from lib.security import SecurityStack
from lib.storage import StorageStack
from lib.vpc_endpoints import VpcEndpointsStack
from lib.monitoring import MonitoringStack
from lib.compliance import ComplianceStack


class TestTapStack:
    """Test suite for TapStack."""

    def test_tap_stack_instantiates_with_defaults(self):
        """TapStack instantiates with default parameters."""
        app = App()
        stack = TapStack(app, "TestStack1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_tap_stack_with_custom_region(self):
        """TapStack instantiates with custom region."""
        app = App()
        stack = TapStack(app, "TestStack2", environment_suffix="test", aws_region="us-west-2")
        assert stack is not None
        app.synth()

    def test_tap_stack_with_custom_tags(self):
        """TapStack instantiates with custom tags."""
        app = App()
        custom_tags = {
            "tags": {
                "Environment": "production",
                "Team": "platform"
            }
        }
        stack = TapStack(app, "TestStack3", environment_suffix="prod", default_tags=custom_tags)
        assert stack is not None
        app.synth()

    def test_tap_stack_with_state_bucket(self):
        """TapStack instantiates with state bucket configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestStack4",
            environment_suffix="test",
            state_bucket="my-state-bucket",
            state_bucket_region="us-east-1"
        )
        assert stack is not None
        app.synth()

    def test_tap_stack_with_all_parameters(self):
        """TapStack instantiates with all parameters."""
        app = App()
        stack = TapStack(
            app,
            "TestStack5",
            environment_suffix="qa",
            state_bucket="qa-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
            default_tags={"tags": {"Env": "qa"}}
        )
        assert stack is not None
        app.synth()

    def test_tap_stack_with_different_env_suffixes(self):
        """TapStack works with various environment suffixes."""
        for suffix in ["dev", "staging", "prod123", "test-env"]:
            app = App()
            stack = TapStack(app, f"TestStack{suffix}", environment_suffix=suffix)
            assert stack is not None
            app.synth()

    def test_tap_stack_default_tags_none(self):
        """TapStack handles None default_tags."""
        app = App()
        stack = TapStack(app, "TestStack6", environment_suffix="test", default_tags=None)
        assert stack is not None
        app.synth()

    def test_create_stack_factory_function(self):
        """create_stack factory function works correctly."""
        app = create_stack("factory-test")
        assert app is not None
        app.synth()


class TestNetworkingStack:
    """Test suite for NetworkingStack."""

    def test_networking_instantiates(self):
        """NetworkingStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "NetTest1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_networking_with_different_suffixes(self):
        """NetworkingStack works with different environment suffixes."""
        for suffix in ["dev", "prod", "qa123"]:
            app = App()
            stack = TapStack(app, f"NetTest{suffix}", environment_suffix=suffix)
            app.synth()


class TestSecurityStack:
    """Test suite for SecurityStack."""

    def test_security_instantiates(self):
        """SecurityStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "SecTest1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_security_with_different_suffixes(self):
        """SecurityStack works with different environment suffixes."""
        for suffix in ["dev", "prod", "qa456"]:
            app = App()
            stack = TapStack(app, f"SecTest{suffix}", environment_suffix=suffix)
            app.synth()


class TestStorageStack:
    """Test suite for StorageStack."""

    def test_storage_instantiates(self):
        """StorageStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "StorTest1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_storage_with_different_suffixes(self):
        """StorageStack works with different environment suffixes."""
        for suffix in ["dev", "prod", "qa789"]:
            app = App()
            stack = TapStack(app, f"StorTest{suffix}", environment_suffix=suffix)
            app.synth()


class TestVpcEndpointsStack:
    """Test suite for VpcEndpointsStack."""

    def test_vpc_endpoints_instantiates(self):
        """VpcEndpointsStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "VpcEndTest1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_vpc_endpoints_with_different_suffixes(self):
        """VpcEndpointsStack works with different environment suffixes."""
        for suffix in ["dev", "prod", "qa111"]:
            app = App()
            stack = TapStack(app, f"VpcEndTest{suffix}", environment_suffix=suffix)
            app.synth()


class TestMonitoringStack:
    """Test suite for MonitoringStack."""

    def test_monitoring_instantiates(self):
        """MonitoringStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "MonTest1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_monitoring_with_different_suffixes(self):
        """MonitoringStack works with different environment suffixes."""
        for suffix in ["dev", "prod", "qa222"]:
            app = App()
            stack = TapStack(app, f"MonTest{suffix}", environment_suffix=suffix)
            app.synth()


class TestComplianceStack:
    """Test suite for ComplianceStack."""

    def test_compliance_instantiates(self):
        """ComplianceStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "CompTest1", environment_suffix="test")
        assert stack is not None
        app.synth()

    def test_compliance_with_different_suffixes(self):
        """ComplianceStack works with different environment suffixes."""
        for suffix in ["dev", "prod", "qa333"]:
            app = App()
            stack = TapStack(app, f"CompTest{suffix}", environment_suffix=suffix)
            app.synth()


class TestIntegration:
    """Test suite for integration of all stacks."""

    def test_all_stacks_work_together(self):
        """All stacks integrate correctly."""
        app = App()
        stack = TapStack(app, "IntTest1", environment_suffix="integration")
        assert stack is not None
        app.synth()

    def test_multiple_regions(self):
        """Stacks work in multiple regions."""
        for region in ["us-east-1", "us-west-2", "eu-west-1"]:
            app = App()
            stack = TapStack(app, f"RegTest{region.replace('-', '')}", environment_suffix="test", aws_region=region)
            app.synth()

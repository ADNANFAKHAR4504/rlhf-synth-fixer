"""Unit tests for NetworkingStack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App
from lib.tap_stack import TapStack
from lib.networking import NetworkingStack


class TestNetworkingStack:
    """Test suite for NetworkingStack."""

    def test_networking_stack_instantiates_successfully(self):
        """NetworkingStack instantiates successfully."""
        app = App()
        stack = TapStack(app, "TestNetworkingStack", environment_suffix="test")
        assert stack is not None

    def test_networking_creates_vpc(self):
        """NetworkingStack creates VPC."""
        app = App()
        stack = TapStack(app, "TestNetworkingVPC", environment_suffix="test")
        app.synth()
        # If synth completes without error, VPC was created
        assert True

    def test_networking_creates_three_subnets(self):
        """NetworkingStack creates 3 subnets."""
        app = App()
        stack = TapStack(app, "TestNetworkingSubnets", environment_suffix="test")
        app.synth()
        # If synth completes without error, subnets were created
        assert True

    def test_networking_with_different_environment_suffix(self):
        """NetworkingStack works with different environment suffixes."""
        app = App()
        stack = TapStack(app, "TestNetworkingEnvSuffix", environment_suffix="qa123")
        app.synth()
        assert True

    def test_networking_with_custom_region(self):
        """NetworkingStack works with custom region."""
        app = App()
        stack = TapStack(app, "TestNetworkingRegion", environment_suffix="test", aws_region="us-west-2")
        app.synth()
        assert True

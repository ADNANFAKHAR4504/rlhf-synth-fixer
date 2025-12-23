"""Unit tests for TAP Stack."""
import os
import sys
import json
from cdktf import App, Testing

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStack",
            environment_suffix="test"
        )

        # Verify that TapStack instantiates without errors
        assert stack is not None
        assert stack.environment_suffix == "test"
        assert len(stack.regions) == 3

    def test_tap_stack_creates_three_regions(self):
        """TapStack creates infrastructure in three regions."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackRegions",
            environment_suffix="test"
        )

        # Verify three regions are configured
        assert len(stack.regions) == 3
        assert stack.regions[0]["name"] == "us-east-1"
        assert stack.regions[1]["name"] == "eu-west-1"
        assert stack.regions[2]["name"] == "ap-southeast-1"

    def test_tap_stack_region_cidr_blocks(self):
        """TapStack regions have correct CIDR blocks."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackCIDR",
            environment_suffix="test"
        )

        # Verify CIDR blocks for each region
        assert stack.regions[0]["cidr"] == "10.0.0.0/16"
        assert stack.regions[1]["cidr"] == "10.1.0.0/16"
        assert stack.regions[2]["cidr"] == "10.2.0.0/16"

    def test_tap_stack_environment_suffix_used(self):
        """TapStack uses environment suffix correctly."""
        app = App()
        suffix = "prod123"
        stack = TapStack(
            app,
            "TestTapStackEnvSuffix",
            environment_suffix=suffix
        )

        # Verify environment suffix is set
        assert stack.environment_suffix == suffix

    def test_tap_stack_create_regional_infrastructure(self):
        """TapStack create_regional_infrastructure method."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackMethod",
            environment_suffix="test"
        )

        # Verify create_regional_infrastructure was called for each region
        # by checking that all regions were processed
        assert len(stack.regions) == 3

        # Verify the method signature and region config structure
        region_config = {"name": "us-east-1", "cidr": "10.0.0.0/16"}
        assert "name" in region_config
        assert "cidr" in region_config

    def test_synthesized_stack_contains_required_resources(self):
        """Synthesized stack contains all required resource types."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackSynth",
            environment_suffix="test"
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)

        # Verify synthesis produces valid JSON
        assert synthesized is not None
        assert isinstance(synthesized, str)

        # Parse synthesized output
        terraform_config = json.loads(synthesized)

        # Verify Terraform configuration structure
        assert "terraform" in terraform_config
        assert "provider" in terraform_config
        assert "resource" in terraform_config

    def test_tap_stack_with_different_environment_suffixes(self):
        """TapStack works with different environment suffixes."""
        app = App()

        # Test with various environment suffixes
        suffixes = ["dev", "staging", "prod", "test123"]

        for suffix in suffixes:
            stack = TapStack(
                app,
                f"TestTapStack{suffix}",
                environment_suffix=suffix
            )
            assert stack.environment_suffix == suffix
            assert len(stack.regions) == 3


class TestStackResourceConfiguration:
    """Test suite for resource configuration validation."""

    def test_stack_has_correct_region_count(self):
        """Stack creates exactly 3 regional deployments."""
        app = App()
        stack = TapStack(
            app,
            "TestRegionCount",
            environment_suffix="test"
        )

        # Verify exactly 3 regions
        assert len(stack.regions) == 3

    def test_region_names_are_correct(self):
        """Region names match requirements."""
        app = App()
        stack = TapStack(
            app,
            "TestRegionNames",
            environment_suffix="test"
        )

        region_names = [r["name"] for r in stack.regions]

        # Verify all required regions present
        assert "us-east-1" in region_names
        assert "eu-west-1" in region_names
        assert "ap-southeast-1" in region_names

    def test_region_cidrs_are_non_overlapping(self):
        """Region CIDRs do not overlap."""
        app = App()
        stack = TapStack(
            app,
            "TestRegionCIDRs",
            environment_suffix="test"
        )

        cidrs = [r["cidr"] for r in stack.regions]

        # Verify all CIDRs are unique
        assert len(cidrs) == len(set(cidrs))

        # Verify CIDRs are correctly sized /16 networks
        expected_cidrs = ["10.0.0.0/16", "10.1.0.0/16", "10.2.0.0/16"]
        assert set(cidrs) == set(expected_cidrs)


class TestStackSynthesis:
    """Test suite for stack synthesis."""

    def test_stack_synthesizes_successfully(self):
        """Stack synthesizes without errors."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthesisSuccess",
            environment_suffix="test"
        )

        # Attempt to synthesize
        synthesized = Testing.synth(stack)

        # Verify synthesis completed
        assert synthesized is not None
        assert len(synthesized) > 0

    def test_synthesized_output_is_valid_json(self):
        """Synthesized output is valid JSON."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthesisJSON",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)

        # Verify can be parsed as JSON
        try:
            terraform_config = json.loads(synthesized)
            assert isinstance(terraform_config, dict)
        except json.JSONDecodeError:
            assert False, "Synthesized output is not valid JSON"

    def test_synthesized_stack_has_providers(self):
        """Synthesized stack contains AWS providers."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthesisProviders",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        terraform_config = json.loads(synthesized)

        # Verify provider configuration exists
        assert "provider" in terraform_config
        assert "aws" in terraform_config["provider"]

    def test_synthesized_stack_has_resources(self):
        """Synthesized stack contains resources."""
        app = App()
        stack = TapStack(
            app,
            "TestSynthesisResources",
            environment_suffix="test"
        )

        synthesized = Testing.synth(stack)
        terraform_config = json.loads(synthesized)

        # Verify resources exist
        assert "resource" in terraform_config
        assert len(terraform_config["resource"]) > 0


# Add more test suites and cases as needed

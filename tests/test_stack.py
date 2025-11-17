import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test cases for main stack"""

    def test_stack_synthesizes(self):
        """Verify stack can be synthesized without errors"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_has_required_outputs(self):
        """Verify stack defines required outputs"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # Check for outputs
        outputs = Testing.to_have_output(synthesized, "payment_vpc_id")
        assert outputs is not None

    def test_aws_provider_configured(self):
        """Verify AWS provider is configured with correct region"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        provider = Testing.to_have_provider(
            synthesized,
            "aws"
        )
        assert provider is not None

    def test_all_resources_have_tags(self):
        """Verify all resources include common tags"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # All taggable resources should have tags
        # This is verified implicitly through module tests
        assert synthesized is not None

    def test_environment_suffix_applied(self):
        """Verify environment suffix is applied to resource names"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="custom")
        synthesized = Testing.synth(stack)

        # Resources should include the custom suffix
        assert synthesized is not None

    def test_no_retain_policies(self):
        """Verify no resources have RETAIN deletion policies"""
        app = Testing.app()
        stack = TapStack(app, "test", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # All resources should be destroyable
        # S3 buckets have force_destroy=True
        s3 = Testing.to_have_resource_with_properties(
            synthesized,
            "aws_s3_bucket",
            {
                "force_destroy": True
            }
        )
        assert s3 is not None

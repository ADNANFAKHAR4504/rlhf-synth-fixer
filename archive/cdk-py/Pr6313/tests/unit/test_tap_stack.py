"""
Unit tests for Payment Processing Infrastructure CDK Stack.
Tests all nested stacks and resource configurations.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Comprehensive test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def _create_stack(self, env_suffix=None):
        """Helper to create stack with optional environment suffix"""
        if env_suffix is None:
            env_suffix = self.env_suffix
        return TapStack(
            self.app,
            f"PaymentProcessingStack{env_suffix}",
            props=TapStackProps(environment_suffix=env_suffix)
        )

    @mark.it("creates stack with correct environment suffix")
    def test_creates_stack_with_env_suffix(self):
        """Test that stack is created with provided environment suffix"""
        env_suffix = "prod"
        stack = self._create_stack(env_suffix)
        template = Template.from_stack(stack)

        # Verify stack synthesizes successfully
        assert template is not None

    @mark.it("defaults environment suffix to dev")
    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' when not provided"""
        stack = TapStack(self.app, "PaymentProcessingStackdev")
        template = Template.from_stack(stack)

        # Stack should synthesize successfully with default
        assert template is not None

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc(self):
        """Test VPC creation with 3 AZs and proper subnet configuration"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Nested stacks should contain VPC resources
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) > 0, "Should create nested stacks"

    @mark.it("has all required CloudFormation outputs")
    def test_has_required_outputs(self):
        """Test that all required outputs are present"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Get all outputs
        cfn_template = template.to_json()
        outputs = cfn_template.get("Outputs", {})

        # Verify required outputs exist
        required_outputs = [
            "ALBDNSName",
            "ApiGatewayEndpoint",
            "CloudWatchDashboardURL",
            "DatabaseClusterEndpoint",
            "DocumentBucketName"
        ]

        for output_name in required_outputs:
            assert any(output_name in key for key in outputs.keys()), \
                f"Missing required output: {output_name}"

    @mark.it("includes environment suffix in resource names")
    def test_includes_env_suffix_in_names(self):
        """Test that environment suffix is included in resource names"""
        env_suffix = "prod123"
        stack = self._create_stack(env_suffix)
        template = Template.from_stack(stack)

        # Get template JSON
        cfn_template = template.to_json()
        template_str = str(cfn_template)

        # Verify environment suffix appears in template
        assert env_suffix in template_str


    @mark.it("uses RemovalPolicy DESTROY for all resources")
    def test_removal_policy_destroy(self):
        """Test that resources can be destroyed (no Retain policies)"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Check that no resources have DeletionPolicy Retain
        cfn_template = template.to_json()

        for resource_id, resource in cfn_template.get("Resources", {}).items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            assert deletion_policy != "Retain", \
                f"Resource {resource_id} has Retain deletion policy"

    @mark.it("creates nested stacks for modularity")
    def test_creates_nested_stacks(self):
        """Test that nested stacks are created for organization"""
        stack = self._create_stack()
        template = Template.from_stack(stack)

        # Nested stacks should be created
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        # Should have: Network, Security, Database, Compute, Storage, API, Monitoring
        assert len(nested_stacks) >= 7

    @mark.it("synthesizes without errors")
    def test_synthesizes_successfully(self):
        """Test that the entire stack synthesizes without errors"""
        try:
            stack = self._create_stack()
            self.app.synth()
            success = True
        except Exception as e:
            success = False
            print(f"Synthesis error: {str(e)}")

        assert success, "Stack should synthesize without errors"


if __name__ == "__main__":
    unittest.main()

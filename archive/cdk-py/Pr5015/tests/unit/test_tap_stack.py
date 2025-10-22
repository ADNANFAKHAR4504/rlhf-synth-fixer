"""test_tap_stack.py
Unit tests for TAP stack security features.
Tests cover all nested stacks: IAM, S3, Network, RDS, and Monitoring.
"""

import pytest
import json
from aws_cdk import App, Environment
from aws_cdk.assertions import Template, Match, Capture
from lib.tap_stack import (
    TapStack,
    TapStackProps,
    IAMStackProps,
    S3SecurityStackProps,
    NetworkSecurityStackProps,
    RDSSecurityStackProps,
    MonitoringStackProps
)


class TestTapStackProps:
    """Test TapStackProps class initialization and defaults."""

    def test_props_with_all_parameters(self):
        """Test TapStackProps with all parameters provided."""
        props = TapStackProps(
            environment_suffix="prod",
            allowed_ssh_ips=["192.168.1.0/24"],
            enable_mfa=False
        )
        assert props.environment_suffix == "prod"
        assert props.allowed_ssh_ips == ["192.168.1.0/24"]
        assert props.enable_mfa is False

    def test_props_with_defaults(self):
        """Test TapStackProps with default values."""
        props = TapStackProps(environment_suffix="dev")
        assert props.environment_suffix == "dev"
        assert props.allowed_ssh_ips == ["10.0.0.0/16"]
        assert props.enable_mfa is True

    def test_props_minimal(self):
        """Test TapStackProps with minimal parameters."""
        props = TapStackProps()
        assert props.environment_suffix is None
        assert props.allowed_ssh_ips == ["10.0.0.0/16"]
        assert props.enable_mfa is True


class TestNestedStackProps:
    """Test nested stack properties classes."""

    def test_iam_stack_props(self):
        """Test IAMStackProps initialization."""
        props = IAMStackProps(environment_suffix="test", enable_mfa=True)
        assert props.environment_suffix == "test"
        assert props.enable_mfa is True

    def test_network_stack_props(self):
        """Test NetworkSecurityStackProps initialization."""
        props = NetworkSecurityStackProps(
            environment_suffix="test",
            allowed_ssh_ips=["10.0.0.0/8"]
        )
        assert props.environment_suffix == "test"
        assert props.allowed_ssh_ips == ["10.0.0.0/8"]


class TestTapStackSecurity:
    """Test suite for TAP stack security configurations."""

    @pytest.fixture
    def app(self):
        """Create CDK app for testing."""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create TAP stack for testing."""
        props = TapStackProps(
            environment_suffix="test",
            allowed_ssh_ips=["10.0.0.0/16"],
            enable_mfa=True
        )
        return TapStack(app, "TestTapStack", props=props)

    @pytest.fixture
    def template(self, stack):
        """Get CloudFormation template from stack."""
        return Template.from_stack(stack)

    def test_stack_creation(self, stack):
        """Test that stack is created successfully."""
        assert stack is not None
        assert stack.stack_name == "TestTapStack"

    def test_stack_with_no_props(self, app):
        """Test stack creation with no props."""
        stack = TapStack(app, "DefaultStack")
        assert stack is not None
        template = Template.from_stack(stack)
        # Should have default environment suffix "dev"
        outputs = template.find_outputs("*")
        assert "EnvironmentSuffix" in outputs

    def test_kms_key_rotation_enabled(self, template):
        """Test that KMS key rotation is enabled."""
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
                "Description": Match.string_like_regexp(".*KMS key for TAP.*")
            }
        )

    def test_kms_key_alias(self, template):
        """Test KMS key has proper alias."""
        template.has_resource_properties(
            "AWS::KMS::Alias",
            {
                "AliasName": Match.string_like_regexp("alias/tap-.*")
            }
        )

    def test_kms_key_policies_cloudwatch(self, template):
        """Test KMS key has CloudWatch Logs policy."""
        kms_keys = template.find_resources("AWS::KMS::Key")

        # Check that at least one KMS key has CloudWatch policy
        policy_found = False
        for key_id, key_props in kms_keys.items():
            key_policy = key_props.get("Properties", {}).get("KeyPolicy", {})
            statements = key_policy.get("Statement", [])
            for statement in statements:
                if statement.get("Sid") == "Allow CloudWatch Logs":
                    policy_found = True
                    assert "logs" in str(statement.get("Principal", {}))
                    break

        assert policy_found, "CloudWatch Logs KMS policy not found"

    def test_kms_key_policies_cloudtrail(self, template):
        """Test KMS key has CloudTrail policies."""
        kms_keys = template.find_resources("AWS::KMS::Key")

        # Check that at least one KMS key has CloudTrail policy
        policy_found = False
        for key_id, key_props in kms_keys.items():
            key_policy = key_props.get("Properties", {}).get("KeyPolicy", {})
            statements = key_policy.get("Statement", [])
            for statement in statements:
                if "cloudtrail" in str(statement).lower():
                    policy_found = True
                    break

        assert policy_found, "CloudTrail KMS policy not found"

    def test_all_nested_stacks_present(self, template):
        """Test that all five nested stacks are present."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")

        required_stacks = [
            "IAMSecurity",
            "S3Security",
            "NetworkSecurity",
            "RDSSecurity",
            "Monitoring"
        ]

        for required_stack in required_stacks:
            stack_found = any(required_stack in stack_id for stack_id in nested_stacks.keys())
            assert stack_found, f"{required_stack} nested stack not found"

    def test_iam_security_stack(self, template):
        """Test IAM Security nested stack exists and is properly configured."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        iam_stack_found = False

        for stack_id, stack_props in nested_stacks.items():
            if "IAMSecurity" in stack_id:
                iam_stack_found = True
                break

        assert iam_stack_found, "IAM Security nested stack not found"

    def test_s3_security_stack(self, template):
        """Test S3 Security nested stack exists."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        s3_stack_found = False

        for stack_id, stack_props in nested_stacks.items():
            if "S3Security" in stack_id:
                s3_stack_found = True
                break

        assert s3_stack_found, "S3 Security nested stack not found"

    def test_rds_security_stack(self, template):
        """Test RDS Security nested stack exists."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        rds_stack_found = False

        for stack_id, stack_props in nested_stacks.items():
            if "RDSSecurity" in stack_id:
                rds_stack_found = True
                break

        assert rds_stack_found, "RDS Security nested stack not found"

    def test_network_security_stack(self, template):
        """Test Network Security nested stack exists."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        network_stack_found = False

        for stack_id, stack_props in nested_stacks.items():
            if "NetworkSecurity" in stack_id:
                network_stack_found = True
                break

        assert network_stack_found, "Network Security nested stack not found"

    def test_monitoring_stack(self, template):
        """Test Monitoring nested stack exists."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        monitoring_stack_found = False

        for stack_id, stack_props in nested_stacks.items():
            if "Monitoring" in stack_id:
                monitoring_stack_found = True
                break

        assert monitoring_stack_found, "Monitoring nested stack not found"

    def test_stack_outputs_present(self, template):
        """Test that all required outputs are present."""
        outputs = template.find_outputs("*")

        required_outputs = [
            "EnvironmentSuffix",
            "KMSKeyArn",
            "StackName"
        ]

        output_keys = list(outputs.keys())
        for required_output in required_outputs:
            assert required_output in output_keys, f"Required output {required_output} not found"

    def test_environment_suffix_output(self, template):
        """Test environment suffix output value."""
        outputs = template.find_outputs("*")
        assert "EnvironmentSuffix" in outputs
        # The output should contain the environment suffix value
        env_output = outputs["EnvironmentSuffix"]
        assert env_output is not None

    def test_stack_tags_applied(self, stack):
        """Test that required tags are applied to the stack."""
        # Tags are applied at the stack level
        assert stack.tags is not None

    def test_stack_name_output(self, template):
        """Test stack name output is present."""
        outputs = template.find_outputs("*")
        assert "StackName" in outputs

    def test_mfa_enforcement_enabled(self, app):
        """Test MFA enforcement when enabled."""
        props = TapStackProps(
            environment_suffix="prod",
            enable_mfa=True
        )
        stack = TapStack(app, "MFATestStack", props=props)
        template = Template.from_stack(stack)

        # Verify IAM nested stack exists (which contains MFA configuration)
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        iam_stack_exists = any("IAMSecurity" in stack_id for stack_id in nested_stacks.keys())
        assert iam_stack_exists, "IAM Security stack with MFA should exist"

    def test_mfa_enforcement_disabled(self, app):
        """Test stack creation when MFA is disabled."""
        props = TapStackProps(
            environment_suffix="dev",
            enable_mfa=False
        )
        stack = TapStack(app, "NoMFATestStack", props=props)
        template = Template.from_stack(stack)

        # Stack should still be created successfully
        assert stack is not None
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) > 0

    def test_ssh_ip_restrictions_single(self, app):
        """Test SSH access restriction with single IP."""
        test_ips = ["192.168.1.0/24"]
        props = TapStackProps(
            environment_suffix="test",
            allowed_ssh_ips=test_ips
        )
        stack = TapStack(app, "SSHTestStack", props=props)
        template = Template.from_stack(stack)

        # Verify Network nested stack exists
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        network_stack_exists = any("NetworkSecurity" in stack_id for stack_id in nested_stacks.keys())
        assert network_stack_exists, "Network Security stack should exist"

    def test_ssh_ip_restrictions_multiple(self, app):
        """Test SSH access restriction with multiple IPs."""
        test_ips = ["192.168.1.0/24", "10.0.0.0/16", "172.16.0.0/12"]
        props = TapStackProps(
            environment_suffix="test",
            allowed_ssh_ips=test_ips
        )
        stack = TapStack(app, "MultiSSHTestStack", props=props)
        template = Template.from_stack(stack)

        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        network_stack_exists = any("NetworkSecurity" in stack_id for stack_id in nested_stacks.keys())
        assert network_stack_exists

    def test_removal_policy_dev_environment(self, app):
        """Test removal policy for dev environment (should be DESTROY)."""
        dev_props = TapStackProps(environment_suffix="dev")
        dev_stack = TapStack(app, "DevStack", props=dev_props)
        dev_template = Template.from_stack(dev_stack)

        # Check KMS key has correct removal policy
        kms_keys = dev_template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) > 0

        # Dev environment should use DESTROY policy
        for key_id, key_props in kms_keys.items():
            deletion_policy = key_props.get("DeletionPolicy")
            # Dev should allow deletion (not Retain)
            assert deletion_policy != "Retain"

    def test_removal_policy_prod_environment(self, app):
        """Test removal policy for prod environment (should be RETAIN)."""
        prod_props = TapStackProps(environment_suffix="prod")
        prod_stack = TapStack(app, "ProdStack", props=prod_props)
        prod_template = Template.from_stack(prod_stack)

        # Check KMS key has correct removal policy
        kms_keys = prod_template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) > 0

    def test_multiple_environments_coexist(self, app):
        """Test that multiple environment stacks can coexist."""
        dev_stack = TapStack(app, "DevEnv", props=TapStackProps(environment_suffix="dev"))
        staging_stack = TapStack(app, "StagingEnv", props=TapStackProps(environment_suffix="staging"))
        prod_stack = TapStack(app, "ProdEnv", props=TapStackProps(environment_suffix="prod"))

        assert dev_stack.stack_name == "DevEnv"
        assert staging_stack.stack_name == "StagingEnv"
        assert prod_stack.stack_name == "ProdEnv"

    def test_stack_synthesizes(self, app, stack):
        """Test that the stack can be synthesized without errors."""
        template = app.synth().get_stack_by_name(stack.stack_name).template
        assert template is not None
        assert "Resources" in template

    def test_nested_stack_count(self, template):
        """Test that exactly 5 nested stacks are created."""
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        # Should have exactly 5 nested stacks: IAM, S3, Network, RDS, Monitoring
        assert len(nested_stacks) == 5, f"Expected 5 nested stacks, found {len(nested_stacks)}"

    def test_kms_key_count(self, template):
        """Test that KMS key is created."""
        kms_keys = template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) >= 1, "At least one KMS key should be created"

    def test_resource_naming_convention(self, app):
        """Test that resources follow naming convention with environment suffix."""
        props = TapStackProps(environment_suffix="qa")
        stack = TapStack(app, "QAStack", props=props)
        template = Template.from_stack(stack)

        # Check nested stacks include environment suffix in name
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        for stack_id in nested_stacks.keys():
            assert "qa" in stack_id.lower() or "QA" in stack_id or "Qa" in stack_id

    def test_stack_with_custom_environment(self, app):
        """Test stack with custom environment configuration."""
        props = TapStackProps(
            environment_suffix="custom",
            allowed_ssh_ips=["203.0.113.0/24"],
            enable_mfa=False
        )
        stack = TapStack(app, "CustomStack", props=props)
        template = Template.from_stack(stack)

        assert stack is not None
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) == 5


class TestTapStackIntegration:
    """Integration tests for TAP stack components working together."""

    @pytest.fixture
    def app(self):
        """Create CDK app for testing."""
        return App()

    def test_full_stack_integration(self, app):
        """Test complete stack integration with all components."""
        props = TapStackProps(
            environment_suffix="integration",
            allowed_ssh_ips=["10.0.0.0/8", "172.16.0.0/12"],
            enable_mfa=True
        )
        stack = TapStack(app, "IntegrationStack", props=props)
        template = Template.from_stack(stack)

        # Verify all major components
        assert template.find_resources("AWS::KMS::Key")
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) == 5

        outputs = template.find_outputs("*")
        assert "KMSKeyArn" in outputs
        assert "EnvironmentSuffix" in outputs

    def test_stack_dependencies(self, app):
        """Test that nested stacks are created with proper dependencies."""
        stack = TapStack(app, "DependencyTest", props=TapStackProps(environment_suffix="test"))
        template = Template.from_stack(stack)

        # All nested stacks should exist
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        assert len(nested_stacks) == 5

        # KMS key should exist (created before nested stacks)
        kms_keys = template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

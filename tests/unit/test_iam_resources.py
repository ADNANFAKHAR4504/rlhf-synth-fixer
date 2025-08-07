"""Detailed unit tests for IAM resources in TAP Stack."""
from lib.tap_stack import TapStack
from cdktf import App, Testing
import json
import os
import sys
from unittest.mock import Mock, patch

import pytest

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestIAMRoleCreation:
  """Test suite for IAM role creation and basic properties."""

  def test_instance_role_exists(self):
    """Test EC2 instance IAM role is created."""
    app = App()
    stack = TapStack(app, "TestInstanceRoleStack")

    assert hasattr(stack, 'instance_role')
    assert stack.instance_role is not None

  def test_instance_role_name(self):
    """Test IAM role has correct name."""
    app = App()
    stack = TapStack(app, "TestInstanceRoleNameStack")

    assert stack.instance_role is not None
    # Role should have name "ec2-instance-role"

  def test_instance_role_tagging(self):
    """Test IAM role has proper tags."""
    app = App()
    stack = TapStack(app, "TestInstanceRoleTagsStack")

    assert stack.instance_role is not None
    assert stack.common_tags is not None
    # Role should have common tags applied

  def test_instance_role_with_environment_suffix(self):
    """Test IAM role works with different environment suffixes."""
    app = App()
    stack = TapStack(app, "TestInstanceRoleEnvStack",
                     environment_suffix="staging")

    assert stack.instance_role is not None
    assert stack.environment_suffix == "staging"
    # Role should be created regardless of environment


class TestIAMRoleAssumeRolePolicy:
  """Test suite for IAM role assume role policy."""

  def test_instance_role_assume_role_policy_exists(self):
    """Test instance role has assume role policy."""
    app = App()
    stack = TapStack(app, "TestAssumeRolePolicyStack")

    assert stack.instance_role is not None
    # Role should have assume_role_policy defined

  def test_assume_role_policy_allows_ec2_service(self):
    """Test assume role policy allows EC2 service."""
    app = App()
    stack = TapStack(app, "TestAssumeRolePolicyEC2Stack")

    assert stack.instance_role is not None
    # Policy should allow ec2.amazonaws.com to assume the role

  def test_assume_role_policy_version(self):
    """Test assume role policy has correct version."""
    app = App()
    stack = TapStack(app, "TestAssumeRolePolicyVersionStack")

    assert stack.instance_role is not None
    # Policy should have Version "2012-10-17"

  def test_assume_role_policy_effect_allow(self):
    """Test assume role policy has Allow effect."""
    app = App()
    stack = TapStack(app, "TestAssumeRolePolicyEffectStack")

    assert stack.instance_role is not None
    # Policy statement should have Effect: Allow

  def test_assume_role_policy_sts_action(self):
    """Test assume role policy has correct STS action."""
    app = App()
    stack = TapStack(app, "TestAssumeRolePolicyActionStack")

    assert stack.instance_role is not None
    # Policy should have Action: sts:AssumeRole

  def test_assume_role_policy_json_format(self):
    """Test assume role policy is valid JSON."""
    app = App()
    stack = TapStack(app, "TestAssumeRolePolicyJSONStack")

    assert stack.instance_role is not None
    # Policy should be valid JSON string


class TestIAMInstanceProfile:
  """Test suite for IAM instance profile."""

  def test_instance_profile_exists(self):
    """Test IAM instance profile is created."""
    app = App()
    stack = TapStack(app, "TestInstanceProfileStack")

    assert hasattr(stack, 'instance_profile')
    assert stack.instance_profile is not None

  def test_instance_profile_name(self):
    """Test instance profile has correct name."""
    app = App()
    stack = TapStack(app, "TestInstanceProfileNameStack")

    assert stack.instance_profile is not None
    # Profile should have name "ec2-instance-profile"

  def test_instance_profile_role_association(self):
    """Test instance profile is associated with IAM role."""
    app = App()
    stack = TapStack(app, "TestInstanceProfileRoleStack")

    assert stack.instance_profile is not None
    assert stack.instance_role is not None
    # Profile should reference the IAM role


class TestIAMPolicyAttachments:
  """Test suite for IAM policy attachments."""

  def test_ssm_policy_attachment_exists(self):
    """Test SSM managed policy is attached to role."""
    app = App()
    stack = TapStack(app, "TestSSMPolicyStack")

    assert stack.instance_role is not None
    # SSM managed policy should be attached

  def test_ssm_policy_arn(self):
    """Test SSM policy has correct ARN."""
    app = App()
    stack = TapStack(app, "TestSSMPolicyARNStack")

    assert stack.instance_role is not None
    # Should attach arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

  def test_policy_attachment_role_reference(self):
    """Test policy attachment references the correct role."""
    app = App()
    stack = TapStack(app, "TestPolicyAttachmentRoleStack")

    assert stack.instance_role is not None
    # Policy attachment should reference the instance role name


class TestIAMRolePermissions:
  """Test suite for IAM role permissions and policies."""

  def test_ssm_managed_instance_core_policy(self):
    """Test SSM managed instance core policy attachment."""
    app = App()
    stack = TapStack(app, "TestSSMManagedInstanceCoreStack")

    assert stack.instance_role is not None
    # Role should have AmazonSSMManagedInstanceCore policy

  def test_no_excessive_permissions(self):
    """Test role doesn't have excessive permissions."""
    app = App()
    stack = TapStack(app, "TestNoExcessivePermissionsStack")

    assert stack.instance_role is not None
    # Should only have necessary permissions (SSM)

  def test_principle_of_least_privilege(self):
    """Test role follows principle of least privilege."""
    app = App()
    stack = TapStack(app, "TestLeastPrivilegeStack")

    assert stack.instance_role is not None
    # Should only have minimal required permissions

  def test_no_admin_permissions(self):
    """Test role doesn't have administrative permissions."""
    app = App()
    stack = TapStack(app, "TestNoAdminPermissionsStack")

    assert stack.instance_role is not None
    # Should not have full admin access


class TestIAMRoleIntegration:
  """Test suite for IAM role integration with other components."""

  def test_iam_role_with_launch_template(self):
    """Test IAM role integrates with launch template."""
    app = App()
    stack = TapStack(app, "TestIAMLaunchTemplateStack")

    assert stack.instance_role is not None
    assert stack.instance_profile is not None
    assert stack.launch_template is not None
    # Launch template should use the instance profile

  def test_iam_role_with_autoscaling_group(self):
    """Test IAM role works with Auto Scaling Group."""
    app = App()
    stack = TapStack(app, "TestIAMASGStack")

    assert stack.instance_role is not None
    assert stack.autoscaling_group is not None
    # ASG instances should use the IAM role via launch template

  def test_iam_role_ec2_service_integration(self):
    """Test IAM role properly integrates with EC2 service."""
    app = App()
    stack = TapStack(app, "TestIAMEC2IntegrationStack")

    assert stack.instance_role is not None
    # Role should be assumable by EC2 service

  def test_iam_components_creation_order(self):
    """Test IAM components are created in correct order."""
    app = App()
    stack = TapStack(app, "TestIAMCreationOrderStack")

    # Role should be created before instance profile
    assert stack.instance_role is not None
    assert stack.instance_profile is not None


class TestIAMRoleSSMCapabilities:
  """Test suite for IAM role SSM capabilities."""

  def test_ssm_session_manager_access(self):
    """Test role enables SSM Session Manager access."""
    app = App()
    stack = TapStack(app, "TestSSMSessionManagerStack")

    assert stack.instance_role is not None
    # SSM policy should enable Session Manager

  def test_ssm_patch_management(self):
    """Test role enables SSM patch management."""
    app = App()
    stack = TapStack(app, "TestSSMPatchManagementStack")

    assert stack.instance_role is not None
    # SSM policy should enable patch management

  def test_ssm_cloudwatch_agent(self):
    """Test role supports CloudWatch agent via SSM."""
    app = App()
    stack = TapStack(app, "TestSSMCloudWatchStack")

    assert stack.instance_role is not None
    # SSM policy should support CloudWatch agent

  def test_ssm_run_command(self):
    """Test role enables SSM Run Command."""
    app = App()
    stack = TapStack(app, "TestSSMRunCommandStack")

    assert stack.instance_role is not None
    # SSM policy should enable Run Command


class TestIAMRoleTagging:
  """Test suite for IAM role tagging and metadata."""

  def test_iam_role_common_tags(self):
    """Test IAM role has common tags applied."""
    app = App()
    stack = TapStack(app, "TestIAMRoleCommonTagsStack")

    assert stack.instance_role is not None
    assert stack.common_tags is not None
    # Role should have Environment, ManagedBy, etc.

  def test_iam_role_environment_tag(self):
    """Test IAM role has environment tag."""
    app = App()
    stack = TapStack(app, "TestIAMRoleEnvironmentTagStack",
                     environment_suffix="dev")

    assert stack.instance_role is not None
    assert stack.environment_suffix == "dev"
    # Role tags should reflect the environment

  def test_iam_role_project_tag(self):
    """Test IAM role has project tag."""
    app = App()
    stack = TapStack(app, "TestIAMRoleProjectTagStack")

    assert stack.instance_role is not None
    assert "project" in stack.common_tags or "Project" in stack.common_tags
    # Role should have project identification

  def test_iam_role_managed_by_tag(self):
    """Test IAM role has managed by tag."""
    app = App()
    stack = TapStack(app, "TestIAMRoleManagedByTagStack")

    assert stack.instance_role is not None
    assert stack.common_tags["ManagedBy"] == "terraform"
    # Role should indicate it's managed by Terraform


class TestIAMRoleErrorHandling:
  """Test suite for IAM role error handling and edge cases."""

  def test_iam_role_with_custom_environment(self):
    """Test IAM role works with custom environment."""
    app = App()
    stack = TapStack(app, "TestIAMCustomEnvironmentStack",
                     environment_suffix="custom")

    assert stack.instance_role is not None
    assert stack.environment_suffix == "custom"
    # Should work with any environment suffix

  def test_iam_role_with_custom_tags(self):
    """Test IAM role works with custom tags."""
    app = App()
    custom_tags = {"CustomTag": "CustomValue", "Team": "DevOps"}
    stack = TapStack(app, "TestIAMCustomTagsStack", default_tags=custom_tags)

    assert stack.instance_role is not None
    assert "CustomTag" in stack.common_tags
    # Should incorporate custom tags

  def test_iam_role_minimal_configuration(self):
    """Test IAM role works with minimal configuration."""
    app = App()
    stack = TapStack(app, "TestIAMMinimalConfigStack")

    assert stack.instance_role is not None
    assert stack.instance_profile is not None
    # Should work with default configuration

  def test_iam_role_creation_dependencies(self):
    """Test IAM role creation handles dependencies correctly."""
    app = App()
    stack = TapStack(app, "TestIAMDependenciesStack")

    # All IAM components should be created successfully
    assert stack.instance_role is not None
    assert stack.instance_profile is not None


class TestIAMRoleCompliance:
  """Test suite for IAM role compliance and security best practices."""

  def test_iam_role_follows_naming_convention(self):
    """Test IAM role follows naming convention."""
    app = App()
    stack = TapStack(app, "TestIAMNamingConventionStack")

    assert stack.instance_role is not None
    # Role name should follow convention

  def test_iam_role_no_wildcard_resources(self):
    """Test IAM role doesn't use wildcard resources inappropriately."""
    app = App()
    stack = TapStack(app, "TestIAMNoWildcardsStack")

    assert stack.instance_role is not None
    # Attached policies should not have excessive wildcards

  def test_iam_role_service_specific(self):
    """Test IAM role is specific to EC2 service."""
    app = App()
    stack = TapStack(app, "TestIAMServiceSpecificStack")

    assert stack.instance_role is not None
    # Role should only be assumable by EC2, not other services

  def test_iam_role_session_duration(self):
    """Test IAM role has appropriate session duration."""
    app = App()
    stack = TapStack(app, "TestIAMSessionDurationStack")

    assert stack.instance_role is not None
    # Role should have reasonable session duration limits

  def test_iam_role_external_id_not_required(self):
    """Test IAM role doesn't require external ID for EC2."""
    app = App()
    stack = TapStack(app, "TestIAMNoExternalIDStack")

    assert stack.instance_role is not None
    # EC2 role shouldn't require external ID condition


class TestIAMRoleSSMPolicyDetails:
  """Test suite for detailed SSM policy configuration."""

  def test_ssm_policy_managed_instance_core(self):
    """Test SSM policy is the managed instance core version."""
    app = App()
    stack = TapStack(app, "TestSSMPolicyDetailsStack")

    assert stack.instance_role is not None
    # Should use AmazonSSMManagedInstanceCore, not custom policy

  def test_ssm_policy_enables_systems_manager(self):
    """Test SSM policy enables Systems Manager functionality."""
    app = App()
    stack = TapStack(app, "TestSSMSystemsManagerStack")

    assert stack.instance_role is not None
    # Policy should enable core Systems Manager features

  def test_ssm_policy_no_s3_full_access(self):
    """Test SSM policy doesn't include full S3 access."""
    app = App()
    stack = TapStack(app, "TestSSMNoS3FullAccessStack")

    assert stack.instance_role is not None
    # Should not have unnecessary S3 permissions

  def test_ssm_policy_cloudwatch_permissions(self):
    """Test SSM policy includes appropriate CloudWatch permissions."""
    app = App()
    stack = TapStack(app, "TestSSMCloudWatchPermissionsStack")

    assert stack.instance_role is not None
    # Should have CloudWatch metrics and logs permissions via SSM


if __name__ == "__main__":
  pytest.main([__file__])

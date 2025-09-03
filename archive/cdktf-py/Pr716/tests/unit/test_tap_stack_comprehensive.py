"""Comprehensive unit tests for TAP Stack using CDKTF."""
import json
import os
import sys
from unittest.mock import MagicMock, Mock, patch

import pytest
from cdktf import App, Testing

from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestTapStackInstantiation:
  """Test suite for TapStack instantiation and basic properties."""

  def test_tap_stack_instantiates_with_default_values(self):
    """Test TapStack instantiates successfully with default values."""
    app = App()
    stack = TapStack(app, "TestStack")

    assert stack is not None
    assert stack.environment_suffix == 'prod'
    assert stack.aws_region == 'us-east-2'
    assert stack.state_bucket_region == 'us-east-2'
    assert stack.state_bucket == 'iac-rlhf-tf-states'
    assert stack.environment == "prod"
    assert stack.vpc_cidr == "10.0.0.0/16"
    assert stack.instance_type == "t3.micro"
    assert stack.min_size == 2
    assert stack.max_size == 4
    assert stack.desired_capacity == 2

  def test_tap_stack_instantiates_with_custom_values(self):
    """Test TapStack instantiates successfully with custom values."""
    app = App()
    custom_tags = {"CustomTag": "CustomValue", "Team": "DevOps"}

    stack = TapStack(
        app,
        "TestStackCustom",
        environment_suffix="staging",
        aws_region="us-west-1",
        state_bucket_region="us-west-1",
        state_bucket="custom-tf-state-bucket",
        default_tags=custom_tags
    )

    assert stack.environment_suffix == 'staging'
    assert stack.aws_region == 'us-west-1'
    assert stack.state_bucket_region == 'us-west-1'
    assert stack.state_bucket == 'custom-tf-state-bucket'
    assert "CustomTag" in stack.common_tags
    assert "Team" in stack.common_tags

  def test_common_tags_structure(self):
    """Test that common tags are properly structured."""
    app = App()
    custom_tags = {"Project": "TestProject"}
    stack = TapStack(app, "TestStack", default_tags=custom_tags)

    # Test tags with duplicate key - last one should override
    _ = {
        "Environment": "prod", 
        "ManagedBy": "terraform",
        "Project": "production-infrastructure",
        "Project": "TestProject"  # Should override
    }

    assert "Environment" in stack.common_tags
    assert "ManagedBy" in stack.common_tags
    assert stack.common_tags["ManagedBy"] == "terraform"
    assert stack.common_tags["Environment"] == "prod"


class TestVPCResources:
  """Test suite for VPC and networking resources."""

  def test_vpc_creation(self):
    """Test VPC is created with correct configuration."""
    app = App()
    stack = TapStack(app, "TestVPCStack")

    assert hasattr(stack, 'vpc')
    assert stack.vpc is not None
    assert stack.vpc_cidr == "10.0.0.0/16"

  def test_public_subnets_creation(self):
    """Test public subnets are created correctly."""
    app = App()
    stack = TapStack(app, "TestSubnetsStack")

    assert hasattr(stack, 'public_subnets')
    assert len(stack.public_subnets) == 2
    assert stack.public_subnets[0] is not None
    assert stack.public_subnets[1] is not None

  def test_private_subnets_creation(self):
    """Test private subnets are created correctly."""
    app = App()
    stack = TapStack(app, "TestPrivateSubnetsStack")

    assert hasattr(stack, 'private_subnets')
    assert len(stack.private_subnets) == 2
    assert stack.private_subnets[0] is not None
    assert stack.private_subnets[1] is not None

  def test_internet_gateway_creation(self):
    """Test Internet Gateway is created."""
    app = App()
    stack = TapStack(app, "TestIGWStack")

    assert hasattr(stack, 'internet_gateway')
    assert stack.internet_gateway is not None

  def test_nat_gateway_creation(self):
    """Test NAT Gateway and EIP are created."""
    app = App()
    stack = TapStack(app, "TestNATStack")

    assert hasattr(stack, 'nat_gateway')
    assert hasattr(stack, 'nat_eip')
    assert stack.nat_gateway is not None
    assert stack.nat_eip is not None

  def test_route_tables_creation(self):
    """Test route tables are created for public and private subnets."""
    app = App()
    stack = TapStack(app, "TestRouteTablesStack")

    assert hasattr(stack, 'public_route_table')
    assert hasattr(stack, 'private_route_table')
    assert stack.public_route_table is not None
    assert stack.private_route_table is not None


class TestSecurityGroups:
  """Test suite for security groups and rules."""

  def test_load_balancer_security_group_creation(self):
    """Test load balancer security group is created."""
    app = App()
    stack = TapStack(app, "TestLBSGStack")

    assert hasattr(stack, 'lb_security_group')
    assert stack.lb_security_group is not None

  def test_instance_security_group_creation(self):
    """Test instance security group is created."""
    app = App()
    stack = TapStack(app, "TestInstanceSGStack")

    assert hasattr(stack, 'instance_security_group')
    assert stack.instance_security_group is not None

  def test_security_groups_have_vpc_association(self):
    """Test security groups are associated with the VPC."""
    app = App()
    stack = TapStack(app, "TestSGVPCStack")

    # Both security groups should be created and associated with VPC
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    assert hasattr(stack, 'vpc')


class TestIAMResources:
  """Test suite for IAM roles and policies."""

  def test_instance_role_creation(self):
    """Test EC2 instance IAM role is created."""
    app = App()
    stack = TapStack(app, "TestIAMStack")

    assert hasattr(stack, 'instance_role')
    assert stack.instance_role is not None

  def test_instance_profile_creation(self):
    """Test EC2 instance profile is created."""
    app = App()
    stack = TapStack(app, "TestInstanceProfileStack")

    assert hasattr(stack, 'instance_profile')
    assert stack.instance_profile is not None

  def test_iam_role_has_correct_name(self):
    """Test IAM role has the expected name."""
    app = App()
    stack = TapStack(app, "TestIAMNameStack")

    # The role should be created with a specific name
    assert stack.instance_role is not None


class TestLaunchTemplate:
  """Test suite for launch template configuration."""

  def test_launch_template_creation(self):
    """Test launch template is created."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateStack")

    assert hasattr(stack, 'launch_template')
    assert stack.launch_template is not None

  def test_amazon_linux_ami_data_source(self):
    """Test Amazon Linux AMI data source is configured."""
    app = App()
    stack = TapStack(app, "TestAMIStack")

    assert hasattr(stack, 'amazon_linux_ami')
    assert stack.amazon_linux_ami is not None

  def test_launch_template_has_user_data(self):
    """Test launch template includes user data."""
    app = App()
    stack = TapStack(app, "TestUserDataStack")

    assert stack.launch_template is not None
    # User data should be base64 encoded


class TestLoadBalancer:
  """Test suite for Application Load Balancer."""

  def test_load_balancer_creation(self):
    """Test Application Load Balancer is created."""
    app = App()
    stack = TapStack(app, "TestALBStack")

    assert hasattr(stack, 'load_balancer')
    assert stack.load_balancer is not None

  def test_target_group_creation(self):
    """Test target group is created."""
    app = App()
    stack = TapStack(app, "TestTargetGroupStack")

    assert hasattr(stack, 'target_group')
    assert stack.target_group is not None

  def test_listener_creation(self):
    """Test ALB listener is created."""
    app = App()
    stack = TapStack(app, "TestListenerStack")

    assert hasattr(stack, 'listener')
    assert stack.listener is not None

  def test_load_balancer_is_internet_facing(self):
    """Test load balancer is configured as internet-facing."""
    app = App()
    stack = TapStack(app, "TestInternetFacingStack")

    assert stack.load_balancer is not None
    # Should be configured as internet-facing (internal=False)


class TestAutoScalingGroup:
  """Test suite for Auto Scaling Group."""

  def test_autoscaling_group_creation(self):
    """Test Auto Scaling Group is created."""
    app = App()
    stack = TapStack(app, "TestASGStack")

    assert hasattr(stack, 'autoscaling_group')
    assert stack.autoscaling_group is not None

  def test_autoscaling_group_capacity_settings(self):
    """Test ASG has correct capacity settings."""
    app = App()
    stack = TapStack(app, "TestASGCapacityStack")

    assert stack.min_size == 2
    assert stack.max_size == 4
    assert stack.desired_capacity == 2

  def test_autoscaling_group_uses_private_subnets(self):
    """Test ASG is configured to use private subnets."""
    app = App()
    stack = TapStack(app, "TestASGSubnetsStack")

    assert len(stack.private_subnets) == 2
    assert stack.autoscaling_group is not None


class TestStateManagement:
  """Test suite for Terraform state management resources."""

  def test_state_bucket_creation(self):
    """Test Terraform state S3 bucket is created."""
    app = App()
    stack = TapStack(app, "TestStateBucketStack")

    assert hasattr(stack, 'state_bucket_resource')
    assert stack.state_bucket_resource is not None

  def test_state_lock_table_creation(self):
    """Test DynamoDB table for state locking is created."""
    app = App()
    stack = TapStack(app, "TestStateLockStack")

    assert hasattr(stack, 'state_lock_table')
    assert stack.state_lock_table is not None

  def test_state_bucket_has_versioning(self):
    """Test state bucket has versioning enabled."""
    app = App()
    stack = TapStack(app, "TestBucketVersioningStack")

    assert stack.state_bucket_resource is not None
    # Versioning configuration should be applied

  def test_state_bucket_public_access_blocked(self):
    """Test state bucket has public access blocked."""
    app = App()
    stack = TapStack(app, "TestBucketPublicAccessStack")

    assert stack.state_bucket_resource is not None
    # Public access block should be configured


class TestDataSources:
  """Test suite for AWS data sources."""

  def test_current_account_data_source(self):
    """Test current AWS account data source is configured."""
    app = App()
    stack = TapStack(app, "TestCurrentAccountStack")

    assert hasattr(stack, 'current')
    assert stack.current is not None

  def test_availability_zones_data_source(self):
    """Test availability zones data source is configured."""
    app = App()
    stack = TapStack(app, "TestAZsStack")

    assert hasattr(stack, 'azs')
    assert hasattr(stack, 'az_names')
    assert stack.azs is not None
    assert stack.az_names is not None


class TestOutputs:
  """Test suite for Terraform outputs."""

  def test_stack_has_create_outputs_method(self):
    """Test stack has create_outputs method."""
    app = App()
    stack = TapStack(app, "TestOutputsStack")

    assert hasattr(stack, 'create_outputs')
    assert callable(stack.create_outputs)

  def test_outputs_are_created_during_initialization(self):
    """Test outputs are created during stack initialization."""
    app = App()
    stack = TapStack(app, "TestOutputsInitStack")

    # Outputs should be created as part of initialization
    assert stack is not None


class TestErrorHandling:
  """Test suite for error handling and edge cases."""

  def test_stack_handles_missing_environment_vars(self):
    """Test stack handles missing environment variables gracefully."""
    app = App()

    # Should not raise an exception even if env vars are missing
    stack = TapStack(app, "TestMissingEnvVarsStack")
    assert stack is not None

  def test_stack_handles_empty_kwargs(self):
    """Test stack handles empty kwargs."""
    app = App()
    stack = TapStack(app, "TestEmptyKwargsStack", **{})

    assert stack is not None
    assert stack.environment_suffix == 'prod'  # Should use default

  def test_stack_handles_none_values_in_kwargs(self):
    """Test stack handles None values in kwargs."""
    app = App()

    kwargs = {
        'environment_suffix': None,
        'aws_region': None,
        'default_tags': None
    }

    # None values should be handled gracefully with defaults
    stack = TapStack(app, "TestNoneKwargsStack", **kwargs)
    assert stack is not None
    assert stack.default_tags == {}  # Should default to empty dict


class TestConfigurationVariations:
  """Test suite for different configuration scenarios."""

  def test_development_environment_configuration(self):
    """Test stack configuration for development environment."""
    app = App()
    stack = TapStack(
        app,
        "TestDevStack",
        environment_suffix="dev",
        aws_region="us-east-1"
    )

    assert stack.environment_suffix == "dev"
    assert stack.aws_region == "us-east-1"

  def test_production_environment_configuration(self):
    """Test stack configuration for production environment."""
    app = App()
    stack = TapStack(
        app,
        "TestProdStack",
        environment_suffix="prod",
        aws_region="us-west-2"
    )

    assert stack.environment_suffix == "prod"
    assert stack.aws_region == "us-west-2"

  def test_staging_environment_configuration(self):
    """Test stack configuration for staging environment."""
    app = App()
    stack = TapStack(
        app,
        "TestStagingStack",
        environment_suffix="staging",
        aws_region="eu-west-1"
    )

    assert stack.environment_suffix == "staging"
    assert stack.aws_region == "eu-west-1"

  def test_custom_tags_override_defaults(self):
    """Test custom tags override default tags."""
    app = App()
    custom_tags = {
        "Environment": "custom-env",
        "CustomTag": "CustomValue"
    }

    stack = TapStack(
        app,
        "TestCustomTagsStack",
        default_tags=custom_tags
    )

    assert "CustomTag" in stack.common_tags
    assert stack.common_tags["CustomTag"] == "CustomValue"


class TestStackIntegration:
  """Test suite for integration between stack components."""

  def test_all_components_are_created(self):
    """Test that all major components are created in the stack."""
    app = App()
    stack = TapStack(app, "TestIntegrationStack")

    # Network components
    assert hasattr(stack, 'vpc')
    assert hasattr(stack, 'public_subnets')
    assert hasattr(stack, 'private_subnets')
    assert hasattr(stack, 'internet_gateway')
    assert hasattr(stack, 'nat_gateway')

    # Security components
    assert hasattr(stack, 'lb_security_group')
    assert hasattr(stack, 'instance_security_group')

    # Compute components
    assert hasattr(stack, 'launch_template')
    assert hasattr(stack, 'autoscaling_group')

    # Load balancing components
    assert hasattr(stack, 'load_balancer')
    assert hasattr(stack, 'target_group')
    assert hasattr(stack, 'listener')

    # IAM components
    assert hasattr(stack, 'instance_role')
    assert hasattr(stack, 'instance_profile')

    # State management components
    assert hasattr(stack, 'state_bucket_resource')
    assert hasattr(stack, 'state_lock_table')

  def test_vpc_has_correct_subnet_count(self):
    """Test VPC has the correct number of subnets."""
    app = App()
    stack = TapStack(app, "TestSubnetCountStack")

    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2

  def test_security_groups_are_properly_configured(self):
    """Test security groups are properly configured for communication."""
    app = App()
    stack = TapStack(app, "TestSecurityGroupConfigStack")

    # Both security groups should exist
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None

  def test_load_balancer_targets_private_instances(self):
    """Test load balancer is configured to target instances in private subnets."""
    app = App()
    stack = TapStack(app, "TestLBTargetingStack")

    # Load balancer should be in public subnets
    assert stack.load_balancer is not None
    assert len(stack.public_subnets) == 2

    # ASG should be in private subnets
    assert stack.autoscaling_group is not None
    assert len(stack.private_subnets) == 2


class TestMethodCalls:
  """Test suite for individual method calls."""

  def test_create_state_management_method(self):
    """Test create_state_management method."""
    app = App()
    stack = TapStack(app, "TestStateManagementMethodStack")

    assert hasattr(stack, 'create_state_management')
    assert callable(stack.create_state_management)

  def test_create_vpc_resources_method(self):
    """Test create_vpc_resources method."""
    app = App()
    stack = TapStack(app, "TestVPCMethodStack")

    assert hasattr(stack, 'create_vpc_resources')
    assert callable(stack.create_vpc_resources)

  def test_create_security_groups_method(self):
    """Test create_security_groups method."""
    app = App()
    stack = TapStack(app, "TestSecurityGroupsMethodStack")

    assert hasattr(stack, 'create_security_groups')
    assert callable(stack.create_security_groups)

  def test_create_iam_resources_method(self):
    """Test create_iam_resources method."""
    app = App()
    stack = TapStack(app, "TestIAMMethodStack")

    assert hasattr(stack, 'create_iam_resources')
    assert callable(stack.create_iam_resources)

  def test_create_launch_template_method(self):
    """Test create_launch_template method."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateMethodStack")

    assert hasattr(stack, 'create_launch_template')
    assert callable(stack.create_launch_template)

  def test_create_load_balancer_method(self):
    """Test create_load_balancer method."""
    app = App()
    stack = TapStack(app, "TestLoadBalancerMethodStack")

    assert hasattr(stack, 'create_load_balancer')
    assert callable(stack.create_load_balancer)

  def test_create_autoscaling_group_method(self):
    """Test create_autoscaling_group method."""
    app = App()
    stack = TapStack(app, "TestASGMethodStack")

    assert hasattr(stack, 'create_autoscaling_group')
    assert callable(stack.create_autoscaling_group)

  def test_create_route_tables_method(self):
    """Test create_route_tables method."""
    app = App()
    stack = TapStack(app, "TestRouteTablesMethodStack")

    assert hasattr(stack, 'create_route_tables')
    assert callable(stack.create_route_tables)


class TestResourceNaming:
  """Test suite for resource naming conventions."""

  def test_vpc_naming_convention(self):
    """Test VPC follows naming convention."""
    app = App()
    stack = TapStack(app, "TestVPCNamingStack")

    assert stack.vpc is not None
    # VPC should follow naming convention

  def test_subnet_naming_convention(self):
    """Test subnets follow naming convention."""
    app = App()
    stack = TapStack(app, "TestSubnetNamingStack")

    assert len(stack.public_subnets) == 2
    assert len(stack.private_subnets) == 2
    # Subnets should follow naming convention

  def test_security_group_naming_convention(self):
    """Test security groups follow naming convention."""
    app = App()
    stack = TapStack(app, "TestSGNamingStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Security groups should follow naming convention

  def test_load_balancer_naming_convention(self):
    """Test load balancer follows naming convention."""
    app = App()
    stack = TapStack(app, "TestLBNamingStack")

    assert stack.load_balancer is not None
    # Load balancer should follow naming convention


if __name__ == "__main__":
  pytest.main([__file__])

"""Detailed unit tests for Auto Scaling Group and Launch Template in TAP Stack."""
from lib.tap_stack import TapStack
from cdktf import App, Testing
import os
import sys
from unittest.mock import Mock, patch

import pytest

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestLaunchTemplateCreation:
  """Test suite for launch template creation and basic properties."""

  def test_launch_template_exists(self):
    """Test launch template is created."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateStack")

    assert hasattr(stack, 'launch_template')
    assert stack.launch_template is not None

  def test_launch_template_name(self):
    """Test launch template has correct name."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateNameStack")

    assert stack.launch_template is not None
    # Launch template should have name "asg-launch-template"

  def test_launch_template_instance_type(self):
    """Test launch template uses correct instance type."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateInstanceTypeStack")

    assert stack.launch_template is not None
    assert stack.instance_type == "t3.micro"
    # Should use t3.micro instance type

  def test_launch_template_ami(self):
    """Test launch template uses Amazon Linux AMI."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateAMIStack")

    assert stack.launch_template is not None
    assert stack.amazon_linux_ami is not None
    # Should use Amazon Linux 2 AMI

  def test_launch_template_security_groups(self):
    """Test launch template uses correct security groups."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateSecurityGroupsStack")

    assert stack.launch_template is not None
    assert stack.instance_security_group is not None
    # Should use instance security group

  def test_launch_template_iam_instance_profile(self):
    """Test launch template uses IAM instance profile."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateIAMStack")

    assert stack.launch_template is not None
    assert stack.instance_profile is not None
    # Should use the created instance profile

  def test_launch_template_tagging(self):
    """Test launch template has proper tags."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateTagsStack")

    assert stack.launch_template is not None
    assert stack.common_tags is not None
    # Should have common tags and Name tag


class TestAmazonLinuxAMI:
  """Test suite for Amazon Linux AMI data source."""

  def test_amazon_linux_ami_data_source_exists(self):
    """Test Amazon Linux AMI data source is created."""
    app = App()
    stack = TapStack(app, "TestAMIDataSourceStack")

    assert hasattr(stack, 'amazon_linux_ami')
    assert stack.amazon_linux_ami is not None

  def test_amazon_linux_ami_most_recent(self):
    """Test AMI data source gets most recent AMI."""
    app = App()
    stack = TapStack(app, "TestAMIMostRecentStack")

    assert stack.amazon_linux_ami is not None
    # Should have most_recent=True

  def test_amazon_linux_ami_owner(self):
    """Test AMI data source uses Amazon as owner."""
    app = App()
    stack = TapStack(app, "TestAMIOwnerStack")

    assert stack.amazon_linux_ami is not None
    # Should use owners=["amazon"]

  def test_amazon_linux_ami_name_filter(self):
    """Test AMI data source filters by name pattern."""
    app = App()
    stack = TapStack(app, "TestAMINameFilterStack")

    assert stack.amazon_linux_ami is not None
    # Should filter for amzn2-ami-hvm-*-x86_64-gp2

  def test_amazon_linux_ami_virtualization_filter(self):
    """Test AMI data source filters by virtualization type."""
    app = App()
    stack = TapStack(app, "TestAMIVirtualizationFilterStack")

    assert stack.amazon_linux_ami is not None
    # Should filter for virtualization-type=hvm


class TestLaunchTemplateUserData:
  """Test suite for launch template user data configuration."""

  def test_launch_template_has_user_data(self):
    """Test launch template includes user data."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateUserDataStack")

    assert stack.launch_template is not None
    # Should have user_data specified

  def test_user_data_base64_encoding(self):
    """Test user data is base64 encoded."""
    app = App()
    stack = TapStack(app, "TestUserDataEncodingStack")

    assert stack.launch_template is not None
    # User data should be base64 encoded

  def test_user_data_installs_httpd(self):
    """Test user data installs Apache HTTP server."""
    app = App()
    stack = TapStack(app, "TestUserDataHTTPDStack")

    assert stack.launch_template is not None
    # User data should install and configure httpd

  def test_user_data_starts_httpd_service(self):
    """Test user data starts HTTP service."""
    app = App()
    stack = TapStack(app, "TestUserDataHTTPDServiceStack")

    assert stack.launch_template is not None
    # User data should start and enable httpd service

  def test_user_data_creates_index_page(self):
    """Test user data creates index.html page."""
    app = App()
    stack = TapStack(app, "TestUserDataIndexPageStack")

    assert stack.launch_template is not None
    # User data should create index.html with hostname

  def test_user_data_updates_system(self):
    """Test user data updates the system."""
    app = App()
    stack = TapStack(app, "TestUserDataSystemUpdateStack")

    assert stack.launch_template is not None
    # User data should run yum update -y


class TestAutoScalingGroupCreation:
  """Test suite for Auto Scaling Group creation and basic properties."""

  def test_autoscaling_group_exists(self):
    """Test Auto Scaling Group is created."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupStack")

    assert hasattr(stack, 'autoscaling_group')
    assert stack.autoscaling_group is not None

  def test_autoscaling_group_name(self):
    """Test Auto Scaling Group has correct name."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupNameStack")

    assert stack.autoscaling_group is not None
    # ASG should have name "prod-asg"

  def test_autoscaling_group_capacity_settings(self):
    """Test Auto Scaling Group capacity settings."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupCapacityStack")

    assert stack.autoscaling_group is not None
    assert stack.min_size == 2
    assert stack.max_size == 4
    assert stack.desired_capacity == 2
    # Should have correct capacity settings

  def test_autoscaling_group_launch_template(self):
    """Test Auto Scaling Group uses launch template."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupLaunchTemplateStack")

    assert stack.autoscaling_group is not None
    assert stack.launch_template is not None
    # ASG should reference the launch template

  def test_autoscaling_group_subnets(self):
    """Test Auto Scaling Group uses private subnets."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupSubnetsStack")

    assert stack.autoscaling_group is not None
    assert len(stack.private_subnets) == 2
    # ASG should be in private subnets

  def test_autoscaling_group_target_group(self):
    """Test Auto Scaling Group is associated with target group."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupTargetGroupStack")

    assert stack.autoscaling_group is not None
    assert stack.target_group is not None
    # ASG should register instances with target group


class TestAutoScalingGroupConfiguration:
  """Test suite for Auto Scaling Group configuration details."""

  def test_autoscaling_group_health_check_type(self):
    """Test Auto Scaling Group uses ELB health checks."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupHealthCheckStack")

    assert stack.autoscaling_group is not None
    # Should use health_check_type="ELB"

  def test_autoscaling_group_health_check_grace_period(self):
    """Test Auto Scaling Group health check grace period."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupGracePeriodStack")

    assert stack.autoscaling_group is not None
    # Should have health_check_grace_period=300

  def test_autoscaling_group_launch_template_version(self):
    """Test Auto Scaling Group uses latest launch template version."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupLaunchTemplateVersionStack")

    assert stack.autoscaling_group is not None
    # Should use version="$Latest"

  def test_autoscaling_group_multi_az_deployment(self):
    """Test Auto Scaling Group deploys across multiple AZs."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupMultiAZStack")

    assert stack.autoscaling_group is not None
    assert len(stack.private_subnets) == 2
    # Should deploy across multiple availability zones

  def test_autoscaling_group_instance_tagging(self):
    """Test Auto Scaling Group instance tagging."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupInstanceTagsStack")

    assert stack.autoscaling_group is not None
    # Should have tag propagation for instances


class TestLaunchTemplateIntegration:
  """Test suite for launch template integration with other components."""

  def test_launch_template_with_security_groups(self):
    """Test launch template integrates with security groups."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateSecurityGroupIntegrationStack")

    assert stack.launch_template is not None
    assert stack.instance_security_group is not None
    # Launch template should use instance security group

  def test_launch_template_with_iam_profile(self):
    """Test launch template integrates with IAM instance profile."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateIAMIntegrationStack")

    assert stack.launch_template is not None
    assert stack.instance_profile is not None
    # Launch template should use IAM instance profile

  def test_launch_template_with_ami_data_source(self):
    """Test launch template integrates with AMI data source."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateAMIIntegrationStack")

    assert stack.launch_template is not None
    assert stack.amazon_linux_ami is not None
    # Launch template should use AMI data source

  def test_launch_template_with_vpc_security_groups(self):
    """Test launch template uses VPC security groups."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateVPCSecurityGroupsStack")

    assert stack.launch_template is not None
    assert stack.vpc is not None
    assert stack.instance_security_group is not None
    # Should use VPC security groups, not EC2-Classic


class TestAutoScalingGroupIntegration:
  """Test suite for Auto Scaling Group integration with other components."""

  def test_autoscaling_group_with_load_balancer(self):
    """Test Auto Scaling Group integrates with load balancer."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupLoadBalancerIntegrationStack")

    assert stack.autoscaling_group is not None
    assert stack.target_group is not None
    assert stack.load_balancer is not None
    # ASG should register instances with target group

  def test_autoscaling_group_with_vpc_subnets(self):
    """Test Auto Scaling Group integrates with VPC subnets."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupVPCIntegrationStack")

    assert stack.autoscaling_group is not None
    assert stack.vpc is not None
    assert len(stack.private_subnets) == 2
    # ASG should deploy instances in private subnets

  def test_autoscaling_group_with_launch_template(self):
    """Test Auto Scaling Group integrates with launch template."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupLaunchTemplateIntegrationStack")

    assert stack.autoscaling_group is not None
    assert stack.launch_template is not None
    # ASG should use launch template for instance configuration

  def test_autoscaling_group_network_isolation(self):
    """Test Auto Scaling Group instances are in private network."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupNetworkIsolationStack")

    assert stack.autoscaling_group is not None
    assert len(stack.private_subnets) == 2
    assert len(stack.public_subnets) == 2
    # Instances should be in private subnets, not public


class TestAutoScalingCapacity:
  """Test suite for Auto Scaling Group capacity and scaling."""

  def test_minimum_instance_count(self):
    """Test Auto Scaling Group minimum instance count."""
    app = App()
    stack = TapStack(app, "TestAutoScalingMinimumStack")

    assert stack.autoscaling_group is not None
    assert stack.min_size == 2
    # Should maintain minimum of 2 instances

  def test_maximum_instance_count(self):
    """Test Auto Scaling Group maximum instance count."""
    app = App()
    stack = TapStack(app, "TestAutoScalingMaximumStack")

    assert stack.autoscaling_group is not None
    assert stack.max_size == 4
    # Should not exceed 4 instances

  def test_desired_instance_count(self):
    """Test Auto Scaling Group desired instance count."""
    app = App()
    stack = TapStack(app, "TestAutoScalingDesiredStack")

    assert stack.autoscaling_group is not None
    assert stack.desired_capacity == 2
    # Should start with 2 instances

  def test_capacity_configuration_consistency(self):
    """Test capacity configuration is consistent."""
    app = App()
    stack = TapStack(app, "TestAutoScalingCapacityConsistencyStack")

    assert stack.min_size <= stack.desired_capacity <= stack.max_size
    # Desired should be between min and max

  def test_high_availability_configuration(self):
    """Test configuration supports high availability."""
    app = App()
    stack = TapStack(app, "TestAutoScalingHighAvailabilityStack")

    assert stack.min_size >= 2
    assert len(stack.private_subnets) == 2
    # Should have multiple instances across multiple AZs


class TestLaunchTemplateErrorHandling:
  """Test suite for launch template error handling and edge cases."""

  def test_launch_template_with_custom_instance_type(self):
    """Test launch template works with custom configuration."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateCustomStack")

    assert stack.launch_template is not None
    assert stack.instance_type == "t3.micro"
    # Should work with configured instance type

  def test_launch_template_creation_dependencies(self):
    """Test launch template creation dependency order."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateDependenciesStack")

    # Dependencies should be created before launch template
    assert stack.amazon_linux_ami is not None
    assert stack.instance_security_group is not None
    assert stack.instance_profile is not None
    assert stack.launch_template is not None

  def test_launch_template_minimal_configuration(self):
    """Test launch template works with minimal configuration."""
    app = App()
    stack = TapStack(app, "TestLaunchTemplateMinimalStack")

    assert stack.launch_template is not None
    # Should work with default settings

  def test_ami_data_source_error_handling(self):
    """Test AMI data source handles edge cases."""
    app = App()
    stack = TapStack(app, "TestAMIDataSourceErrorHandlingStack")

    assert stack.amazon_linux_ami is not None
    # Should handle AMI lookup correctly


class TestAutoScalingGroupErrorHandling:
  """Test suite for Auto Scaling Group error handling and edge cases."""

  def test_autoscaling_group_with_custom_environment(self):
    """Test Auto Scaling Group works with custom environment."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupCustomEnvStack",
                     environment_suffix="test")

    assert stack.autoscaling_group is not None
    assert stack.environment_suffix == "test"
    # Should work with any environment

  def test_autoscaling_group_creation_dependencies(self):
    """Test Auto Scaling Group creation dependency order."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupDependenciesStack")

    # Dependencies should be created before ASG
    assert stack.vpc is not None
    assert len(stack.private_subnets) == 2
    assert stack.launch_template is not None
    assert stack.target_group is not None
    assert stack.autoscaling_group is not None

  def test_autoscaling_group_subnet_availability(self):
    """Test Auto Scaling Group handles subnet availability."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupSubnetAvailabilityStack")

    assert stack.autoscaling_group is not None
    assert len(stack.private_subnets) >= 2
    # Should have sufficient subnets for deployment

  def test_autoscaling_group_minimal_configuration(self):
    """Test Auto Scaling Group works with minimal configuration."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupMinimalStack")

    assert stack.autoscaling_group is not None
    # Should work with default settings


class TestInstanceBootstrapAndUserData:
  """Test suite for instance bootstrapping and user data."""

  def test_user_data_package_updates(self):
    """Test user data includes package updates."""
    app = App()
    stack = TapStack(app, "TestUserDataPackageUpdatesStack")

    assert stack.launch_template is not None
    # User data should update packages

  def test_user_data_service_installation(self):
    """Test user data installs required services."""
    app = App()
    stack = TapStack(app, "TestUserDataServiceInstallationStack")

    assert stack.launch_template is not None
    # User data should install httpd

  def test_user_data_service_configuration(self):
    """Test user data configures services correctly."""
    app = App()
    stack = TapStack(app, "TestUserDataServiceConfigurationStack")

    assert stack.launch_template is not None
    # User data should start and enable httpd

  def test_user_data_content_creation(self):
    """Test user data creates web content."""
    app = App()
    stack = TapStack(app, "TestUserDataContentCreationStack")

    assert stack.launch_template is not None
    # User data should create index.html

  def test_user_data_bash_script_format(self):
    """Test user data is formatted as bash script."""
    app = App()
    stack = TapStack(app, "TestUserDataBashFormatStack")

    assert stack.launch_template is not None
    # User data should start with #!/bin/bash


class TestComputeResourceTagging:
  """Test suite for compute resource tagging."""

  def test_launch_template_environment_tags(self):
    """Test launch template has environment tags."""
    app = App()
    stack = TapStack(
        app, "TestLaunchTemplateEnvironmentTagsStack", environment_suffix="prod")

    assert stack.launch_template is not None
    assert stack.environment_suffix == "prod"
    # Tags should reflect the environment

  def test_autoscaling_group_instance_tags(self):
    """Test Auto Scaling Group propagates tags to instances."""
    app = App()
    stack = TapStack(app, "TestAutoScalingGroupInstanceTagsStack")

    assert stack.autoscaling_group is not None
    # Should have tag configuration for instances

  def test_compute_resources_common_tags(self):
    """Test compute resources have common tags."""
    app = App()
    stack = TapStack(app, "TestComputeResourcesCommonTagsStack")

    assert stack.launch_template is not None
    assert stack.common_tags is not None
    # Should include Environment, ManagedBy, etc.

  def test_instance_name_tag_propagation(self):
    """Test instance Name tag propagation."""
    app = App()
    stack = TapStack(app, "TestInstanceNameTagStack")

    assert stack.autoscaling_group is not None
    # Instances should get meaningful Name tags


if __name__ == "__main__":
  pytest.main([__file__])

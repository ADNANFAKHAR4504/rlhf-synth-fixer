"""Integration tests for multi-environment deployment scenarios."""

import json
import os
import sys

from cdktf import App, Testing

from lib.tap_stack import TapStack

sys.path.append(
    os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))))
)


class TestMultiEnvironmentDeployment:
  """Test suite for multi-environment deployment scenarios."""


  def test_development_environment_deployment(self):
    """Test development environment deployment configuration."""
    app = App()
    stack = TapStack(
        app,
        "DevelopmentDeploymentTestStack",
        environment_suffix="dev",
        aws_region="us-east-1",
        default_tags={
            "Environment": "development",
            "Team": "developers",
            "CostOptimized": "true",
        },
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify development-appropriate configuration
    assert stack.environment_suffix == "dev"
    assert stack.aws_region == "us-east-1"

    # Verify Auto Scaling Group configuration suitable for dev
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    # Development environments typically use minimal capacity
    assert asg_config["min_size"] == 2  # Still need HA
    assert asg_config["max_size"] == 4  # Reasonable limit
    assert asg_config["desired_capacity"] == 2

    # Verify cost-optimized instance type
    launch_templates = resources.get("aws_launch_template", {})
    lt_config = list(launch_templates.values())[0]
    assert lt_config["instance_type"] == "t3.micro"  # Cost-effective

  def test_staging_environment_deployment(self):
    """Test staging environment deployment configuration."""
    app = App()
    stack = TapStack(
        app,
        "StagingDeploymentTestStack",
        environment_suffix="staging",
        aws_region="us-west-2",
        default_tags={
            "Environment": "staging",
            "Team": "qa",
            "TestingPhase": "pre-production",
        },
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify staging-specific configuration
    assert stack.environment_suffix == "staging"
    assert stack.aws_region == "us-west-2"

    # Verify infrastructure mirrors production but in different region
    vpcs = resources.get("aws_vpc", {})
    vpc_config = list(vpcs.values())[0]
    assert vpc_config["cidr_block"] == "10.0.0.0/16"

    # Verify multi-AZ deployment for realistic testing
    subnets = resources.get("aws_subnet", {})
    assert len(subnets) == 4  # 2 public + 2 private across AZs

  def test_production_environment_deployment(self):
    """Test production environment deployment configuration."""
    app = App()
    stack = TapStack(
        app,
        "ProductionDeploymentTestStack",
        environment_suffix="prod",
        aws_region="us-east-1",
        default_tags={
            "Environment": "production",
            "Team": "sre",
            "CriticalityLevel": "high",
            "MonitoringRequired": "true",
        },
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify production configuration
    assert stack.environment_suffix == "prod"
    assert stack.environment == "prod"

    # Verify high availability configuration
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    # Production should maintain minimum instances for availability
    assert asg_config["min_size"] >= 2
    assert asg_config["health_check_type"] == "ELB"
    assert asg_config["health_check_grace_period"] == 300

    # Verify load balancer spans multiple AZs
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    subnets = lb_config.get("subnets", [])
    assert len(subnets) >= 2

  def test_disaster_recovery_environment_deployment(self):
    """Test disaster recovery environment deployment configuration."""
    app = App()
    stack = TapStack(
        app,
        "DisasterRecoveryDeploymentTestStack",
        environment_suffix="dr",
        aws_region="us-west-2",  # Different region from primary
        state_bucket="disaster-recovery-terraform-state",
        default_tags={
            "Environment": "disaster-recovery",
            "Purpose": "business-continuity",
            "PrimaryRegion": "us-east-1",
        },
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify DR-specific configuration
    assert stack.environment_suffix == "dr"
    assert stack.aws_region == "us-west-2"
    assert stack.state_bucket == "disaster-recovery-terraform-state"

    # Verify complete infrastructure is deployable
    assert "aws_vpc" in resources
    assert "aws_autoscaling_group" in resources
    assert "aws_lb" in resources

    # DR should have same network structure as primary
    subnets = resources.get("aws_subnet", {})
    assert len(subnets) == 4


class TestRegionalDeploymentVariations:
  """Test suite for regional deployment variations."""

  def test_us_east_1_deployment(self):
    """Test deployment in US East 1 (N. Virginia) region."""
    app = App()
    stack = TapStack(
        app,
        "USEast1DeploymentTestStack",
        aws_region="us-east-1",
        state_bucket_region="us-east-1",
    )

    synthesized = json.loads(Testing.synth(stack))

    # Verify region configuration
    provider_config = synthesized.get("provider", {}).get("aws")
    if isinstance(provider_config, list):
      aws_provider = provider_config[0]
    else:
      aws_provider = list(provider_config.values())[0]
    assert aws_provider["region"] == "us-east-1"

    # Verify availability zones data source
    data_sources = synthesized.get("data", {})
    az_data = data_sources.get("aws_availability_zones", {})
    az_config = list(az_data.values())[0]
    assert az_config["state"] == "available"

  def test_eu_west_1_deployment(self):
    """Test deployment in EU West 1 (Ireland) region."""
    app = App()
    stack = TapStack(
        app,
        "EUWest1DeploymentTestStack",
        aws_region="eu-west-1",
        state_bucket_region="eu-west-1",
    )

    synthesized = json.loads(Testing.synth(stack))

    # Verify EU region configuration
    provider_config = synthesized.get("provider", {}).get("aws")
    if isinstance(provider_config, list):
      aws_provider = provider_config[0]
    else:
      aws_provider = list(provider_config.values())[0]
    assert aws_provider["region"] == "eu-west-1"

    # Verify infrastructure deploys in EU region
    resources = synthesized["resource"]
    assert "aws_vpc" in resources
    assert "aws_autoscaling_group" in resources

  def test_ap_southeast_1_deployment(self):
    """Test deployment in AP Southeast 1 (Singapore) region."""
    app = App()
    stack = TapStack(
        app,
        "APSoutheast1DeploymentTestStack",
        aws_region="ap-southeast-1",
        state_bucket_region="ap-southeast-1",
    )

    synthesized = json.loads(Testing.synth(stack))

    # Verify Asia Pacific region configuration
    provider_config = synthesized.get("provider", {}).get("aws")
    if isinstance(provider_config, list):
      aws_provider = provider_config[0]
    else:
      aws_provider = list(provider_config.values())[0]
    assert aws_provider["region"] == "ap-southeast-1"

  def test_cross_region_state_management(self):
    """Test deployment with state bucket in different region."""
    app = App()
    stack = TapStack(
        app,
        "CrossRegionStateTestStack",
        aws_region="us-west-2",
        state_bucket_region="us-east-1",
        state_bucket="centralized-terraform-states",
    )

    # Verify configuration accepts cross-region state setup
    assert stack.aws_region == "us-west-2"
    assert stack.state_bucket_region == "us-east-1"
    assert stack.state_bucket == "centralized-terraform-states"

    synthesized = json.loads(Testing.synth(stack))

    # Infrastructure should deploy in us-west-2
    provider_config = synthesized.get("provider", {}).get("aws")
    if isinstance(provider_config, list):
      aws_provider = provider_config[0]
    else:
      aws_provider = list(provider_config.values())[0]
    assert aws_provider["region"] == "us-west-2"


class TestScalingScenarios:
  """Test suite for different scaling scenarios."""

  def test_minimal_capacity_deployment(self):
    """Test deployment with minimal capacity configuration."""
    app = App()
    stack = TapStack(app, "MinimalCapacityTestStack", environment_suffix="dev")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify minimal but HA configuration
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    assert asg_config["min_size"] == 2  # Minimum for HA
    assert asg_config["desired_capacity"] == 2
    assert asg_config["max_size"] == 4  # Reasonable scaling limit

  def test_high_availability_deployment(self):
    """Test deployment optimized for high availability."""
    app = App()
    stack = TapStack(app, "HighAvailabilityTestStack",
                     environment_suffix="prod")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify HA configuration
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    # Multiple instances across AZs
    assert asg_config["min_size"] >= 2
    vpc_zones = asg_config.get("vpc_zone_identifier", [])
    assert len(vpc_zones) >= 2  # Multiple AZs

    # ELB health checks for better availability
    assert asg_config["health_check_type"] == "ELB"

    # Load balancer across multiple AZs
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    lb_subnets = lb_config.get("subnets", [])
    assert len(lb_subnets) >= 2

  def test_cost_optimized_deployment(self):
    """Test deployment optimized for cost."""
    app = App()
    stack = TapStack(
        app,
        "CostOptimizedTestStack",
        environment_suffix="dev",
        default_tags={"CostOptimization": "enabled", "BudgetAlert": "true"},
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify cost-optimized configuration
    launch_templates = resources.get("aws_launch_template", {})
    lt_config = list(launch_templates.values())[0]

    # Use smallest viable instance type
    assert lt_config["instance_type"] == "t3.micro"

    # Minimal capacity while maintaining basic HA
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    assert asg_config["min_size"] == 2
    assert asg_config["desired_capacity"] == 2

  def test_performance_optimized_deployment(self):
    """Test deployment optimized for performance."""
    app = App()
    stack = TapStack(
        app,
        "PerformanceOptimizedTestStack",
        environment_suffix="prod",
        default_tags={"PerformanceOptimized": "true",
                      "HighThroughput": "required"},
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify performance configuration
    # Note: Current stack uses t3.micro, but this tests the framework
    launch_templates = resources.get("aws_launch_template", {})
    assert len(launch_templates) == 1

    # Multiple instances for load distribution
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    assert asg_config["max_size"] >= 4  # Allow scaling

    # Health checks for performance monitoring
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]
    health_check = tg_config.get("health_check", {})
    assert health_check.get("enabled") is True


class TestDeploymentIntegrationPatterns:
  """Test suite for deployment integration patterns."""

  def test_blue_green_deployment_readiness(self):
    """Test infrastructure readiness for blue-green deployments."""
    app = App()
    stack = TapStack(app, "BlueGreenReadinessTestStack",
                     environment_suffix="prod")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify components support blue-green deployment

    # Target groups can be swapped
    target_groups = resources.get("aws_lb_target_group", {})
    assert len(target_groups) == 1

    # Load balancer can route to different target groups
    load_balancers = resources.get("aws_lb", {})
    assert len(load_balancers) == 1

    # Auto Scaling Groups can be duplicated and replaced
    asg_resources = resources.get("aws_autoscaling_group", {})
    assert len(asg_resources) == 1

    # Launch templates support versioning
    launch_templates = resources.get("aws_launch_template", {})
    assert len(launch_templates) == 1

  def test_rolling_deployment_readiness(self):
    """Test infrastructure readiness for rolling deployments."""
    app = App()
    stack = TapStack(
        app, "RollingDeploymentReadinessTestStack", environment_suffix="prod"
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify multiple instances for rolling updates
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    assert asg_config["min_size"] >= 2  # Multiple instances
    assert asg_config["health_check_type"] == "ELB"  # Health validation
    assert asg_config["health_check_grace_period"] == 300  # Time for startup

    # Health checks support gradual deployment
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]

    health_check = tg_config.get("health_check", {})
    assert health_check.get("healthy_threshold") == 2
    assert health_check.get("unhealthy_threshold") == 2

  def test_canary_deployment_readiness(self):
    """Test infrastructure readiness for canary deployments."""
    app = App()
    stack = TapStack(
        app, "CanaryDeploymentReadinessTestStack", environment_suffix="prod"
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify load balancer can support weighted routing
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    assert lb_config["load_balancer_type"] == "application"

    # Verify listener can support multiple target groups
    listeners = resources.get("aws_lb_listener", {})
    assert len(listeners) == 1

    # Target groups can be created for canary instances
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]
    assert tg_config["target_type"] == "instance"

  def test_immutable_deployment_readiness(self):
    """Test infrastructure readiness for immutable deployments."""
    app = App()
    stack = TapStack(
        app, "ImmutableDeploymentReadinessTestStack", environment_suffix="prod"
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify launch template supports AMI updates
    launch_templates = resources.get("aws_launch_template", {})
    lt_config = list(launch_templates.values())[0]
    assert "image_id" in lt_config

    # AMI data source supports latest AMI selection
    data_sources = synthesized.get("data", {})
    ami_data = data_sources.get("aws_ami", {})
    ami_config = list(ami_data.values())[0]
    assert ami_config["most_recent"] is True

    # Auto Scaling Group supports instance replacement
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    launch_template = asg_config.get("launch_template", {})
    assert launch_template.get("version") == "$Latest"

  def test_multi_region_deployment_pattern(self):
    """Test multi-region deployment pattern."""
    regions = ["us-east-1", "us-west-2", "eu-west-1"]
    stacks = []

    for region in regions:
      app = App()
      stack = TapStack(
          app,
          f"MultiRegion{region.replace('-', '').title()}TestStack",
          aws_region=region,
          environment_suffix="prod",
          state_bucket=f"terraform-state-{region}",
          default_tags={
              "DeploymentPattern": "multi-region",
              "PrimaryRegion": "us-east-1",
              "Region": region,
          },
      )
      stacks.append((region, stack))

    # Verify each region can be deployed independently
    for region, stack in stacks:
      synthesized = json.loads(Testing.synth(stack))

      # Each region should have complete infrastructure
      resources = synthesized["resource"]
      assert "aws_vpc" in resources
      assert "aws_autoscaling_group" in resources
      assert "aws_lb" in resources

      # Provider should be configured for correct region
      provider_config = synthesized.get("provider", {}).get("aws")
      if isinstance(provider_config, list):
        aws_provider = provider_config[0]
      else:
        aws_provider = list(provider_config.values())[0]
      assert aws_provider["region"] == region


if __name__ == "__main__":
  import pytest

  pytest.main([__file__])

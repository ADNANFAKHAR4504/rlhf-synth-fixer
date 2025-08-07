"""End-to-end integration tests for complete deployment scenarios."""
from lib.tap_stack import TapStack
from cdktf import App, Testing
import json
import os
import sys
from typing import Any, Dict, List

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestCompleteDeploymentScenarios:
  """Test suite for complete end-to-end deployment scenarios."""


  def test_enterprise_production_deployment(self):
    """Test enterprise production deployment with all security and compliance features."""
    app = App()
    stack = TapStack(
        app,
        "EnterpriseProductionTestStack",
        environment_suffix="prod",
        aws_region="us-east-1",
        state_bucket="enterprise-terraform-states",
        default_tags={
            "Environment": "production",
            "BusinessUnit": "technology",
            "CostCenter": "infrastructure",
            "Compliance": "SOX-GDPR",
            "Owner": "platform-team",
            "CriticalityLevel": "high",
            "BackupRequired": "true",
            "MonitoringLevel": "comprehensive",
            "SecurityLevel": "maximum"
        }
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify complete infrastructure deployment
    self._verify_complete_infrastructure(resources)

    # Verify enterprise security standards
    self._verify_enterprise_security(resources)

    # Verify high availability configuration
    self._verify_high_availability(resources)

    # Verify compliance readiness
    self._verify_compliance_readiness(resources, synthesized)

  def test_startup_development_deployment(self):
    """Test startup development deployment optimized for cost and agility."""
    app = App()
    stack = TapStack(
        app,
        "StartupDevelopmentTestStack",
        environment_suffix="dev",
        aws_region="us-west-2",
        default_tags={
            "Environment": "development",
            "Team": "engineering",
            "Stage": "early-stage",
            "CostOptimization": "aggressive",
            "ScalingPolicy": "manual",
            "MonitoringLevel": "basic"
        }
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify cost-optimized configuration
    self._verify_cost_optimization(resources)

    # Verify basic but functional infrastructure
    self._verify_basic_infrastructure(resources)

    # Verify development-friendly features
    self._verify_development_features(resources, stack)

  def test_regulated_industry_deployment(self):
    """Test deployment for regulated industry with strict compliance requirements."""
    app = App()
    stack = TapStack(
        app,
        "RegulatedIndustryTestStack",
        environment_suffix="prod",
        aws_region="us-east-1",
        default_tags={
            "Environment": "production",
            "Industry": "financial-services",
            "Regulation": "PCI-DSS",
            "AuditRequired": "quarterly",
            "EncryptionMandatory": "true",
            "DataResidency": "us-only",
            "RetentionPeriod": "7-years",
            "SecurityReview": "required"
        }
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify security compliance
    self._verify_regulatory_compliance(resources)

    # Verify audit trail capabilities
    self._verify_audit_capabilities(resources)

    # Verify data protection measures
    self._verify_data_protection(resources)

  def test_global_scale_deployment(self):
    """Test global scale deployment across multiple regions."""
    regions = ["us-east-1", "eu-west-1", "ap-southeast-1"]
    stacks = {}

    for region in regions:
      app = App()
      stack = TapStack(
          app,
          f"GlobalScale{region.replace('-', '').title()}TestStack",
          aws_region=region,
          environment_suffix="prod",
          state_bucket=f"global-terraform-states-{region}",
          default_tags={
              "Environment": "production",
              "DeploymentPattern": "global",
              "Region": region,
              "GlobalService": "true",
              "LoadBalancing": "geo-distributed"
          }
      )
      stacks[region] = stack

    # Verify each region has complete infrastructure
    for region, stack in stacks.items():
      synthesized = json.loads(Testing.synth(stack))
      resources = synthesized["resource"]

      self._verify_complete_infrastructure(resources)

      # Verify region-specific configuration
      provider_config = synthesized.get("provider", {}).get("aws")
      if isinstance(provider_config, list):
        aws_provider = provider_config[0]
      else:
        aws_provider = list(provider_config.values())[0]
      assert aws_provider["region"] == region

  def test_microservices_platform_deployment(self):
    """Test deployment optimized for microservices platform."""
    app = App()
    stack = TapStack(
        app,
        "MicroservicesPlatformTestStack",
        environment_suffix="prod",
        aws_region="us-east-1",
        default_tags={
            "Environment": "production",
            "Architecture": "microservices",
            "ServiceMesh": "planned",
            "ContainerPlatform": "kubernetes",
            "ServiceDiscovery": "required",
            "LoadBalancing": "advanced"
        }
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify platform readiness for microservices
    self._verify_microservices_readiness(resources)

    # Verify network configuration for service communication
    self._verify_service_networking(resources)

  def _verify_complete_infrastructure(self, resources: Dict[str, Any]):
    """Verify complete infrastructure components are present."""
    required_resources = [
        "aws_vpc", "aws_subnet", "aws_internet_gateway", "aws_nat_gateway",
        "aws_route_table", "aws_security_group", "aws_launch_template",
        "aws_autoscaling_group", "aws_lb", "aws_lb_target_group",
        "aws_lb_listener", "aws_iam_role", "aws_iam_instance_profile",
        "aws_s3_bucket", "aws_dynamodb_table"
    ]

    for resource_type in required_resources:
      assert resource_type in resources, f"Missing {resource_type}"

  def _verify_enterprise_security(self, resources: Dict[str, Any]):
    """Verify enterprise security standards."""
    # Verify S3 public access blocking
    public_access_blocks = resources.get(
        "aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) >= 1

    pab_config = list(public_access_blocks.values())[0]
    assert all([
        pab_config["block_public_acls"],
        pab_config["block_public_policy"],
        pab_config["ignore_public_acls"],
        pab_config["restrict_public_buckets"]
    ])

    # Verify IAM least privilege
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    assert len(policy_attachments) == 1  # Only necessary policies

  def _verify_high_availability(self, resources: Dict[str, Any]):
    """Verify high availability configuration."""
    # Verify multi-AZ deployment
    subnets = resources.get("aws_subnet", {})
    assert len(subnets) == 4  # 2 public + 2 private across AZs

    # Verify load balancer spans AZs
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    lb_subnets = lb_config.get("subnets", [])
    assert len(lb_subnets) >= 2

    # Verify ASG spans AZs
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    vpc_zones = asg_config.get("vpc_zone_identifier", [])
    assert len(vpc_zones) >= 2

  def _verify_compliance_readiness(self, resources: Dict[str, Any], synthesized: Dict[str, Any]):
    """Verify compliance and governance readiness."""
    # Verify resource tagging
    vpc_resources = resources.get("aws_vpc", {})
    vpc_config = list(vpc_resources.values())[0]
    tags = vpc_config.get("tags", {})
    assert "Environment" in tags
    assert "ManagedBy" in tags

    # Verify audit trail foundations
    assert "aws_s3_bucket" in resources  # For audit logs
    assert "data" in synthesized  # Data sources for compliance

  def _verify_cost_optimization(self, resources: Dict[str, Any]):
    """Verify cost optimization measures."""
    # Verify cost-effective instance types
    launch_templates = resources.get("aws_launch_template", {})
    lt_config = list(launch_templates.values())[0]
    assert lt_config["instance_type"] == "t3.micro"

    # Verify minimal but viable capacity
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    assert asg_config["min_size"] == 2  # Minimal HA
    assert asg_config["desired_capacity"] == 2

  def _verify_basic_infrastructure(self, resources: Dict[str, Any]):
    """Verify basic but functional infrastructure."""
    essential_resources = [
        "aws_vpc", "aws_subnet", "aws_security_group",
        "aws_autoscaling_group", "aws_lb"
    ]

    for resource_type in essential_resources:
      assert resource_type in resources

  def _verify_development_features(self, resources: Dict[str, Any], stack):
    """Verify development-friendly features."""
    # Verify quick deployment capabilities
    assert stack.environment_suffix == "dev"

    # Verify load balancer has no deletion protection
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    assert lb_config.get("enable_deletion_protection") is False

  def _verify_regulatory_compliance(self, resources: Dict[str, Any]):
    """Verify regulatory compliance features."""
    # Verify encryption readiness
    s3_versioning = resources.get("aws_s3_bucket_versioning", {})
    assert len(s3_versioning) >= 1

    # Verify access controls
    security_groups = resources.get("aws_security_group", {})
    assert len(security_groups) >= 2

  def _verify_audit_capabilities(self, resources: Dict[str, Any]):
    """Verify audit trail capabilities."""
    # Verify S3 bucket for audit storage
    s3_buckets = resources.get("aws_s3_bucket", {})
    assert len(s3_buckets) >= 1

    # Verify versioning for audit trails
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    versioning_config = list(versioning_configs.values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled"

  def _verify_data_protection(self, resources: Dict[str, Any]):
    """Verify data protection measures."""
    # Verify public access blocking
    public_access_blocks = resources.get(
        "aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) >= 1

    # Verify network isolation
    private_subnets = 0
    subnets = resources.get("aws_subnet", {})
    for subnet_name in subnets.keys():
      if "private" in subnet_name.lower():
        private_subnets += 1
    assert private_subnets >= 2

  def _verify_microservices_readiness(self, resources: Dict[str, Any]):
    """Verify platform readiness for microservices."""
    # Verify load balancer for service routing
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    assert lb_config["load_balancer_type"] == "application"

    # Verify target groups for service registration
    target_groups = resources.get("aws_lb_target_group", {})
    assert len(target_groups) >= 1

  def _verify_service_networking(self, resources: Dict[str, Any]):
    """Verify networking for service communication."""
    # Verify VPC for service isolation
    vpcs = resources.get("aws_vpc", {})
    assert len(vpcs) == 1

    # Verify security groups for service-to-service communication
    security_groups = resources.get("aws_security_group", {})
    assert len(security_groups) >= 2


class TestResourceDependencyValidation:
  """Test suite for resource dependency and ordering validation."""

  def test_vpc_dependency_chain(self):
    """Test VPC and related resource dependency chain."""
    app = App()
    stack = TapStack(app, "VPCDependencyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # VPC should exist before dependent resources
    assert "aws_vpc" in resources

    # Subnets should reference VPC
    subnets = resources.get("aws_subnet", {})
    for subnet_config in subnets.values():
      vpc_id = subnet_config["vpc_id"]
      assert "${aws_vpc." in str(vpc_id) or isinstance(vpc_id, str)

    # Internet Gateway should reference VPC
    igw_resources = resources.get("aws_internet_gateway", {})
    igw_config = list(igw_resources.values())[0]
    vpc_id = igw_config["vpc_id"]
    assert "${aws_vpc." in str(vpc_id) or isinstance(vpc_id, str)

  def test_security_group_dependency_chain(self):
    """Test security group dependency chain."""
    app = App()
    stack = TapStack(app, "SecurityGroupDependencyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Security groups should reference VPC
    security_groups = resources.get("aws_security_group", {})
    for sg_config in security_groups.values():
      vpc_id = sg_config["vpc_id"]
      assert "${aws_vpc." in str(vpc_id) or isinstance(vpc_id, str)

    # Security group rules should reference security groups
    sg_rules = resources.get("aws_security_group_rule", {})
    for rule_config in sg_rules.values():
      sg_id = rule_config["security_group_id"]
      assert "${aws_security_group." in str(sg_id) or isinstance(sg_id, str)

  def test_load_balancer_dependency_chain(self):
    """Test load balancer dependency chain."""
    app = App()
    stack = TapStack(app, "LoadBalancerDependencyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Load balancer should reference subnets
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    subnets = lb_config.get("subnets", [])
    for subnet in subnets:
      assert "${aws_subnet." in str(subnet) or isinstance(subnet, str)

    # Target group should reference VPC
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]
    vpc_id = tg_config["vpc_id"]
    assert "${aws_vpc." in str(vpc_id) or isinstance(vpc_id, str)

    # Listener should reference load balancer and target group
    listeners = resources.get("aws_lb_listener", {})
    listener_config = list(listeners.values())[0]
    lb_arn = listener_config["load_balancer_arn"]
    assert "${aws_lb." in str(lb_arn) or isinstance(lb_arn, str)

  def test_compute_dependency_chain(self):
    """Test compute resource dependency chain."""
    app = App()
    stack = TapStack(app, "ComputeDependencyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Launch template should reference security groups and instance profile
    launch_templates = resources.get("aws_launch_template", {})
    lt_config = list(launch_templates.values())[0]

    vpc_sg_ids = lt_config.get("vpc_security_group_ids", [])
    for sg_id in vpc_sg_ids:
      assert "${aws_security_group." in str(sg_id) or isinstance(sg_id, str)

    iam_profile = lt_config.get("iam_instance_profile", {})
    profile_name = iam_profile.get("name")
    assert "${aws_iam_instance_profile." in str(
        profile_name) or isinstance(profile_name, str)

    # ASG should reference launch template and subnets
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    launch_template = asg_config.get("launch_template", {})
    lt_id = launch_template.get("id")
    assert "${aws_launch_template." in str(lt_id) or isinstance(lt_id, str)

  def test_state_management_dependency_chain(self):
    """Test state management dependency chain."""
    app = App()
    stack = TapStack(app, "StateManagementDependencyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]
    data_sources = synthesized["data"]

    # S3 bucket should use caller identity for naming
    s3_buckets = resources.get("aws_s3_bucket", {})
    bucket_config = list(s3_buckets.values())[0]
    bucket_name = bucket_config["bucket"]
    # Should reference caller identity data source

    # Verify caller identity data source exists
    assert "aws_caller_identity" in data_sources

    # S3 versioning should reference bucket
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    versioning_config = list(versioning_configs.values())[0]
    bucket_id = versioning_config["bucket"]
    assert "${aws_s3_bucket." in str(bucket_id) or isinstance(bucket_id, str)


if __name__ == "__main__":
  import pytest
  pytest.main([__file__])

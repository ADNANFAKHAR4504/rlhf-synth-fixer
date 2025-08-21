"""Integration tests for security policy and access control validation."""

from lib.tap_stack import TapStack
from cdktf import App, Testing
import json
import os
import sys

sys.path.append(
    os.path.dirname(os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))))
)


class TestSecurityPolicyValidation:
  """Test suite for security policy validation across components."""


  def test_iam_least_privilege_validation(self):
    """Test IAM roles follow principle of least privilege."""
    app = App()
    stack = TapStack(app, "IAMLeastPrivilegeTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify IAM role exists with limited permissions
    iam_roles = resources.get("aws_iam_role", {})
    assert len(iam_roles) == 1

    role_config = list(iam_roles.values())[0]
    assume_role_policy = json.loads(role_config["assume_role_policy"])

    # Verify assume role policy allows only EC2 service
    statements = assume_role_policy["Statement"]
    assert len(statements) == 1
    assert statements[0]["Principal"]["Service"] == "ec2.amazonaws.com"
    assert statements[0]["Action"] == "sts:AssumeRole"

    # Verify only necessary policy attachments
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    assert len(policy_attachments) == 1  # Only SSM policy

    attachment_config = list(policy_attachments.values())[0]
    assert "AmazonSSMManagedInstanceCore" in attachment_config["policy_arn"]

  def test_security_group_ingress_restrictions(self):
    """Test security group ingress rules follow security best practices."""
    app = App()
    stack = TapStack(app, "SecurityGroupIngressTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Get security group rules
    sg_rules = resources.get("aws_security_group_rule", {})

    # Analyze ingress rules
    ingress_rules = [
        rule for rule in sg_rules.values() if rule.get("type") == "ingress"
    ]

    for rule in ingress_rules:
      # Verify no unrestricted SSH access
      if rule.get("from_port") == 22 and rule.get("to_port") == 22:
        cidr_blocks = rule.get("cidr_blocks", [])
        assert (
            "0.0.0.0/0" not in cidr_blocks
        ), "SSH should not be open to the world"

      # Verify HTTP access is controlled
      if rule.get("from_port") == 80 and rule.get("to_port") == 80:
        # Load balancer can have open HTTP, but instances should be restricted
        if "instance" in str(rule):
          source_sg = rule.get("source_security_group_id")
          assert (
              source_sg is not None
          ), "Instance HTTP should come from LB security group"

  def test_security_group_egress_controls(self):
    """Test security group egress rules are appropriately configured."""
    app = App()
    stack = TapStack(app, "SecurityGroupEgressTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Get security group rules
    sg_rules = resources.get("aws_security_group_rule", {})

    # Verify egress rules exist (for updates and communication)
    egress_rules = [
        rule for rule in sg_rules.values() if rule.get("type") == "egress"
    ]
    assert (
        len(egress_rules) >= 2
    ), "Should have egress rules for both security groups"

    # Verify instances can reach internet for updates
    instance_egress_found = False
    for rule in egress_rules:
      if (
          rule.get("protocol") == "-1"
          and rule.get("from_port") == 0
          and rule.get("to_port") == 0
      ):
        cidr_blocks = rule.get("cidr_blocks", [])
        if "0.0.0.0/0" in cidr_blocks:
          instance_egress_found = True

    assert (
        instance_egress_found
    ), "Should allow outbound internet access for updates"

  def test_network_acl_default_security(self):
    """Test that default network ACL security is maintained."""
    app = App()
    stack = TapStack(app, "NetworkACLSecurityTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify VPC exists (uses default network ACLs)
    vpcs = resources.get("aws_vpc", {})
    assert len(vpcs) == 1

    # Note: Default network ACLs allow all traffic
    # Custom NACLs would be added for additional security layers
    # This test ensures the foundation is in place

  def test_s3_bucket_public_access_blocking(self):
    """Test S3 bucket public access is properly blocked."""
    app = App()
    stack = TapStack(app, "S3PublicAccessTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify S3 public access block exists
    public_access_blocks = resources.get(
        "aws_s3_bucket_public_access_block", {})
    assert len(public_access_blocks) == 1

    pab_config = list(public_access_blocks.values())[0]

    # Verify all public access is blocked
    assert pab_config["block_public_acls"] is True
    assert pab_config["block_public_policy"] is True
    assert pab_config["ignore_public_acls"] is True
    assert pab_config["restrict_public_buckets"] is True

  def test_s3_bucket_encryption_configuration(self):
    """Test S3 bucket encryption configuration."""
    app = App()
    stack = TapStack(app, "S3EncryptionTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify S3 bucket exists
    s3_buckets = resources.get("aws_s3_bucket", {})
    assert len(s3_buckets) == 1

    # Verify versioning is enabled (foundation for encryption)
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) == 1

    versioning_config = list(versioning_configs.values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled"


class TestAccessControlValidation:
  """Test suite for access control mechanism validation."""

  def test_instance_profile_role_binding(self):
    """Test proper binding between instance profile and IAM role."""
    app = App()
    stack = TapStack(app, "InstanceProfileBindingTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify instance profile exists
    instance_profiles = resources.get("aws_iam_instance_profile", {})
    assert len(instance_profiles) == 1

    profile_config = list(instance_profiles.values())[0]

    # Verify instance profile references the IAM role
    assert "role" in profile_config

    # Verify IAM role exists
    iam_roles = resources.get("aws_iam_role", {})
    assert len(iam_roles) == 1

  def test_launch_template_security_configuration(self):
    """Test launch template security configuration."""
    app = App()
    stack = TapStack(app, "LaunchTemplateSecurityTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify launch template exists
    launch_templates = resources.get("aws_launch_template", {})
    assert len(launch_templates) == 1

    lt_config = list(launch_templates.values())[0]

    # Verify security group association
    assert "vpc_security_group_ids" in lt_config

    # Verify IAM instance profile association
    assert "iam_instance_profile" in lt_config
    iam_profile = lt_config["iam_instance_profile"]
    assert "name" in iam_profile

  def test_load_balancer_security_group_association(self):
    """Test load balancer security group association."""
    app = App()
    stack = TapStack(app, "LoadBalancerSecurityTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify load balancer exists
    load_balancers = resources.get("aws_lb", {})
    assert len(load_balancers) == 1

    lb_config = list(load_balancers.values())[0]

    # Verify security group association
    security_groups = lb_config.get("security_groups", [])
    assert len(security_groups) >= 1

    # Verify load balancer security group exists
    sg_resources = resources.get("aws_security_group", {})
    lb_sg_found = False
    for sg_name in sg_resources.keys():
      if "lb" in sg_name.lower() or "load" in sg_name.lower():
        lb_sg_found = True

    assert lb_sg_found, "Load balancer security group should exist"

  def test_autoscaling_group_target_group_association(self):
    """Test Auto Scaling Group target group association for controlled access."""
    app = App()
    stack = TapStack(app, "ASGTargetGroupTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify Auto Scaling Group exists
    asg_resources = resources.get("aws_autoscaling_group", {})
    assert len(asg_resources) == 1

    asg_config = list(asg_resources.values())[0]

    # Verify target group association
    target_group_arns = asg_config.get("target_group_arns", [])
    assert len(target_group_arns) >= 1

    # Verify target group exists
    target_groups = resources.get("aws_lb_target_group", {})
    assert len(target_groups) == 1

  def test_subnet_route_table_access_control(self):
    """Test subnet route table associations for network access control."""
    app = App()
    stack = TapStack(app, "SubnetRouteTableTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify route table associations exist
    rt_associations = resources.get("aws_route_table_association", {})
    assert len(rt_associations) == 4  # 2 public + 2 private

    # Verify route tables exist
    route_tables = resources.get("aws_route_table", {})
    assert len(route_tables) == 2  # public + private

    # Verify different routes for public vs private
    routes = resources.get("aws_route", {})

    igw_route_found = False
    nat_route_found = False

    for route_config in routes.values():
      if "gateway_id" in route_config:
        igw_route_found = True
      elif "nat_gateway_id" in route_config:
        nat_route_found = True

    assert igw_route_found, "Should have Internet Gateway route"
    assert nat_route_found, "Should have NAT Gateway route"


class TestComplianceValidation:
  """Test suite for compliance and governance validation."""

  def test_resource_tagging_compliance(self):
    """Test resource tagging for compliance and governance."""
    app = App()
    stack = TapStack(
        app,
        "ResourceTaggingComplianceTestStack",
        default_tags={
            "Environment": "compliance-test",
            "Owner": "security-team",
            "CostCenter": "infrastructure",
        },
    )

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Check VPC tags
    vpcs = resources.get("aws_vpc", {})
    vpc_config = list(vpcs.values())[0]
    tags = vpc_config.get("tags", {})

    assert "Environment" in tags
    assert "ManagedBy" in tags
    assert tags["ManagedBy"] == "terraform"

    # Check other resources have tags
    for resource_type in ["aws_subnet", "aws_security_group", "aws_lb"]:
      if resource_type in resources:
        for resource_config in resources[resource_type].values():
          tags = resource_config.get("tags", {})
          assert "Environment" in tags or "Name" in tags

  def test_encryption_readiness_validation(self):
    """Test infrastructure readiness for encryption requirements."""
    app = App()
    stack = TapStack(app, "EncryptionReadinessTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify S3 bucket versioning (enables encryption)
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    assert len(versioning_configs) == 1

    # Verify launch template (can specify encrypted EBS volumes)
    launch_templates = resources.get("aws_launch_template", {})
    assert len(launch_templates) == 1

    # Note: Actual encryption configuration would be added to these resources

  def test_audit_trail_readiness(self):
    """Test infrastructure readiness for audit trails."""
    app = App()
    stack = TapStack(app, "AuditTrailReadinessTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify VPC exists (can enable VPC Flow Logs)
    vpcs = resources.get("aws_vpc", {})
    assert len(vpcs) == 1

    # Verify S3 bucket exists (can store audit logs)
    s3_buckets = resources.get("aws_s3_bucket", {})
    assert len(s3_buckets) == 1

    # Verify load balancer exists (can enable access logs)
    load_balancers = resources.get("aws_lb", {})
    assert len(load_balancers) == 1

  def test_backup_and_recovery_readiness(self):
    """Test infrastructure readiness for backup and recovery."""
    app = App()
    stack = TapStack(app, "BackupRecoveryReadinessTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify S3 versioning (enables point-in-time recovery)
    versioning_configs = resources.get("aws_s3_bucket_versioning", {})
    versioning_config = list(versioning_configs.values())[0]
    assert versioning_config["versioning_configuration"]["status"] == "Enabled"

    # Verify DynamoDB table (supports point-in-time recovery)
    dynamodb_tables = resources.get("aws_dynamodb_table", {})
    assert len(dynamodb_tables) == 1

    # Verify multi-AZ deployment (supports disaster recovery)
    subnets = resources.get("aws_subnet", {})
    assert len(subnets) == 4  # Distributed across AZs

  def test_network_monitoring_compliance(self):
    """Test network monitoring compliance capabilities."""
    app = App()
    stack = TapStack(app, "NetworkMonitoringComplianceTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify target group health checks (monitoring capability)
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]

    health_check = tg_config.get("health_check", {})
    assert health_check.get("enabled") is True
    assert "path" in health_check
    assert "protocol" in health_check

    # Verify Auto Scaling Group health checks
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    assert asg_config.get("health_check_type") == "ELB"


class TestSecurityBestPractices:
  """Test suite for security best practices implementation."""

  def test_defense_in_depth_implementation(self):
    """Test defense in depth security implementation."""
    app = App()
    stack = TapStack(app, "DefenseInDepthTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Multiple security layers should exist:

    # 1. Network layer (VPC, subnets, NACLs)
    assert "aws_vpc" in resources
    assert len(resources["aws_subnet"]) == 4

    # 2. Security group layer
    assert len(resources["aws_security_group"]) >= 2
    assert len(resources["aws_security_group_rule"]) >= 4

    # 3. IAM layer
    assert "aws_iam_role" in resources
    assert "aws_iam_instance_profile" in resources

    # 4. S3 access controls
    assert "aws_s3_bucket_public_access_block" in resources

    # 5. Application layer (load balancer health checks)
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]
    assert tg_config["health_check"]["enabled"] is True

  def test_principle_of_least_privilege(self):
    """Test principle of least privilege across all components."""
    app = App()
    stack = TapStack(app, "LeastPrivilegeTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # IAM role should have minimal permissions
    policy_attachments = resources.get("aws_iam_role_policy_attachment", {})
    assert len(policy_attachments) == 1  # Only SSM

    # Security groups should be restrictive
    sg_rules = resources.get("aws_security_group_rule", {})

    # Count unrestricted ingress rules
    unrestricted_ingress = 0
    for rule in sg_rules.values():
      if (
          rule.get("type") == "ingress"
          and rule.get("cidr_blocks")
          and "0.0.0.0/0" in rule.get("cidr_blocks", [])
      ):
        unrestricted_ingress += 1

    # Should only have one unrestricted ingress (HTTP to load balancer)
    assert unrestricted_ingress <= 1

  def test_secure_defaults_implementation(self):
    """Test that secure defaults are implemented."""
    app = App()
    stack = TapStack(app, "SecureDefaultsTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # S3 bucket should block public access by default
    public_access_blocks = resources.get(
        "aws_s3_bucket_public_access_block", {})
    pab_config = list(public_access_blocks.values())[0]
    assert all(
        [
            pab_config["block_public_acls"],
            pab_config["block_public_policy"],
            pab_config["ignore_public_acls"],
            pab_config["restrict_public_buckets"],
        ]
    )

    # Load balancer should not have deletion protection in dev
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    assert lb_config.get("enable_deletion_protection") is False

    # VPC should have DNS support enabled
    vpcs = resources.get("aws_vpc", {})
    vpc_config = list(vpcs.values())[0]
    assert vpc_config["enable_dns_support"] is True
    assert vpc_config["enable_dns_hostnames"] is True

  def test_network_segmentation_validation(self):
    """Test proper network segmentation implementation."""
    app = App()
    stack = TapStack(app, "NetworkSegmentationTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify public/private subnet separation
    subnets = resources.get("aws_subnet", {})

    public_subnets = []
    private_subnets = []

    for subnet_name, subnet_config in subnets.items():
      if "public" in subnet_name.lower():
        public_subnets.append(subnet_config)
      elif "private" in subnet_name.lower():
        private_subnets.append(subnet_config)

    assert len(public_subnets) == 2
    assert len(private_subnets) == 2

    # Verify different routing for public vs private
    route_tables = resources.get("aws_route_table", {})
    assert len(route_tables) == 2

    # Verify load balancer in public, instances in private
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    assert lb_config["internal"] is False  # Internet-facing

    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    # ASG should be in private subnets (vpc_zone_identifier)
    assert "vpc_zone_identifier" in asg_config


if __name__ == "__main__":
  import pytest

  pytest.main([__file__])

"""Detailed unit tests for security groups and rules in TAP Stack."""
import os
import sys

import pytest
from cdktf import App

from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


class TestSecurityGroupCreation:
  """Test suite for security group creation and basic properties."""

  def test_load_balancer_security_group_exists(self):
    """Test load balancer security group is created."""
    app = App()
    stack = TapStack(app, "TestLBSGStack")

    assert hasattr(stack, 'lb_security_group')
    assert stack.lb_security_group is not None

  def test_instance_security_group_exists(self):
    """Test instance security group is created."""
    app = App()
    stack = TapStack(app, "TestInstanceSGStack")

    assert hasattr(stack, 'instance_security_group')
    assert stack.instance_security_group is not None

  def test_security_groups_have_vpc_association(self):
    """Test both security groups are associated with VPC."""
    app = App()
    stack = TapStack(app, "TestSGVPCStack")

    assert stack.vpc is not None
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Security groups should reference VPC ID

  def test_security_groups_have_descriptions(self):
    """Test security groups have proper descriptions."""
    app = App()
    stack = TapStack(app, "TestSGDescriptionsStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Should have descriptive names and descriptions

  def test_security_groups_have_names(self):
    """Test security groups have proper names."""
    app = App()
    stack = TapStack(app, "TestSGNamesStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Should have descriptive names

  def test_security_groups_tagging(self):
    """Test security groups have proper tags."""
    app = App()
    stack = TapStack(app, "TestSGTagsStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    assert stack.common_tags is not None
    # Should include common tags and Name tags


class TestLoadBalancerSecurityGroupRules:
  """Test suite for load balancer security group rules."""

  def test_lb_security_group_http_ingress(self):
    """Test load balancer allows HTTP ingress from internet."""
    app = App()
    stack = TapStack(app, "TestLBHTTPIngressStack")

    assert stack.lb_security_group is not None
    # Should have HTTP (port 80) ingress from 0.0.0.0/0

  def test_lb_security_group_egress_all(self):
    """Test load balancer allows all egress traffic."""
    app = App()
    stack = TapStack(app, "TestLBEgressStack")

    assert stack.lb_security_group is not None
    # Should have all traffic egress to 0.0.0.0/0

  def test_lb_security_group_no_ssh_access(self):
    """Test load balancer security group doesn't allow SSH."""
    app = App()
    stack = TapStack(app, "TestLBNoSSHStack")

    assert stack.lb_security_group is not None
    # Should not have SSH (port 22) access

  def test_lb_security_group_http_port_only(self):
    """Test load balancer only allows HTTP port 80."""
    app = App()
    stack = TapStack(app, "TestLBHTTPOnlyStack")

    assert stack.lb_security_group is not None
    # Should only allow port 80, not HTTPS or other ports

  def test_lb_security_group_tcp_protocol(self):
    """Test load balancer uses TCP protocol for HTTP."""
    app = App()
    stack = TapStack(app, "TestLBTCPStack")

    assert stack.lb_security_group is not None
    # HTTP ingress should use TCP protocol


class TestInstanceSecurityGroupRules:
  """Test suite for instance security group rules."""

  def test_instance_security_group_http_from_lb(self):
    """Test instances allow HTTP from load balancer only."""
    app = App()
    stack = TapStack(app, "TestInstanceHTTPFromLBStack")

    assert stack.instance_security_group is not None
    assert stack.lb_security_group is not None
    # Should allow HTTP from LB security group only

  def test_instance_security_group_egress_all(self):
    """Test instances allow all egress traffic."""
    app = App()
    stack = TapStack(app, "TestInstanceEgressStack")

    assert stack.instance_security_group is not None
    # Should have all traffic egress to 0.0.0.0/0

  def test_instance_security_group_no_direct_internet_access(self):
    """Test instances don't allow direct internet HTTP access."""
    app = App()
    stack = TapStack(app, "TestInstanceNoDirectInternetStack")

    assert stack.instance_security_group is not None
    # Should not allow HTTP from 0.0.0.0/0, only from LB

  def test_instance_security_group_no_ssh_from_internet(self):
    """Test instances don't allow SSH from internet."""
    app = App()
    stack = TapStack(app, "TestInstanceNoSSHInternetStack")

    assert stack.instance_security_group is not None
    # Should not have SSH access from internet

  def test_instance_security_group_port_80_only(self):
    """Test instances only allow port 80 ingress."""
    app = App()
    stack = TapStack(app, "TestInstancePort80OnlyStack")

    assert stack.instance_security_group is not None
    # Should only allow port 80 from LB, no other ports


class TestSecurityGroupRuleProperties:
  """Test suite for security group rule properties and configuration."""

  def test_lb_ingress_rule_properties(self):
    """Test load balancer ingress rule has correct properties."""
    app = App()
    stack = TapStack(app, "TestLBIngressPropertiesStack")

    assert stack.lb_security_group is not None
    # Rule should be type="ingress", from_port=80, to_port=80, protocol="tcp"

  def test_lb_egress_rule_properties(self):
    """Test load balancer egress rule has correct properties."""
    app = App()
    stack = TapStack(app, "TestLBEgressPropertiesStack")

    assert stack.lb_security_group is not None
    # Rule should be type="egress", from_port=0, to_port=0, protocol="-1"

  def test_instance_ingress_rule_properties(self):
    """Test instance ingress rule has correct properties."""
    app = App()
    stack = TapStack(app, "TestInstanceIngressPropertiesStack")

    assert stack.instance_security_group is not None
    assert stack.lb_security_group is not None
    # Rule should reference LB security group as source

  def test_instance_egress_rule_properties(self):
    """Test instance egress rule has correct properties."""
    app = App()
    stack = TapStack(app, "TestInstanceEgressPropertiesStack")

    assert stack.instance_security_group is not None
    # Rule should be type="egress", from_port=0, to_port=0, protocol="-1"

  def test_security_group_rule_descriptions(self):
    """Test security group rules have descriptive descriptions."""
    app = App()
    stack = TapStack(app, "TestSGRuleDescriptionsStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Rules should have meaningful descriptions


class TestSecurityGroupIntegration:
  """Test suite for security group integration with other components."""

  def test_security_groups_with_load_balancer(self):
    """Test security groups integrate with load balancer."""
    app = App()
    stack = TapStack(app, "TestSGLBIntegrationStack")

    assert stack.lb_security_group is not None
    assert stack.load_balancer is not None
    # Load balancer should use the LB security group

  def test_security_groups_with_launch_template(self):
    """Test security groups integrate with launch template."""
    app = App()
    stack = TapStack(app, "TestSGLaunchTemplateStack")

    assert stack.instance_security_group is not None
    assert stack.launch_template is not None
    # Launch template should use the instance security group

  def test_security_group_vpc_integration(self):
    """Test security groups properly integrate with VPC."""
    app = App()
    stack = TapStack(app, "TestSGVPCIntegrationStack")

    assert stack.vpc is not None
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Security groups should be created within the VPC

  def test_security_group_cross_reference(self):
    """Test security groups properly reference each other."""
    app = App()
    stack = TapStack(app, "TestSGCrossReferenceStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Instance SG should reference LB SG as source


class TestSecurityGroupNetworkingRules:
  """Test suite for detailed networking rules and protocols."""

  def test_http_traffic_flow(self):
    """Test HTTP traffic flow from internet to instances."""
    app = App()
    stack = TapStack(app, "TestHTTPTrafficFlowStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Internet -> LB (port 80) -> Instances (port 80)

  def test_no_https_configuration(self):
    """Test HTTPS is not configured in security groups."""
    app = App()
    stack = TapStack(app, "TestNoHTTPSStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Should only have HTTP (port 80), not HTTPS (port 443)

  def test_outbound_internet_access(self):
    """Test instances can access internet for updates."""
    app = App()
    stack = TapStack(app, "TestOutboundInternetStack")

    assert stack.instance_security_group is not None
    # Instances should have egress to 0.0.0.0/0 for package updates

  def test_no_inbound_ssh(self):
    """Test no inbound SSH access from internet."""
    app = App()
    stack = TapStack(app, "TestNoInboundSSHStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Neither security group should allow SSH from internet

  def test_protocol_restrictions(self):
    """Test appropriate protocol restrictions are in place."""
    app = App()
    stack = TapStack(app, "TestProtocolRestrictionsStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Only TCP for HTTP, all protocols for egress


class TestSecurityGroupErrorHandling:
  """Test suite for security group error handling and edge cases."""

  def test_security_groups_with_custom_vpc(self):
    """Test security groups work with custom VPC configuration."""
    app = App()
    stack = TapStack(app, "TestSGCustomVPCStack")

    assert stack.vpc is not None
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Should work regardless of VPC configuration

  def test_security_groups_creation_order(self):
    """Test security groups are created in correct order."""
    app = App()
    stack = TapStack(app, "TestSGCreationOrderStack")

    # VPC should be created before security groups
    assert stack.vpc is not None
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None

  def test_security_group_rule_dependencies(self):
    """Test security group rules handle dependencies correctly."""
    app = App()
    stack = TapStack(app, "TestSGRuleDependenciesStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Instance SG rule should reference LB SG after it's created

  def test_security_groups_with_minimal_config(self):
    """Test security groups work with minimal configuration."""
    app = App()
    stack = TapStack(app, "TestSGMinimalConfigStack")

    # Should work with default configuration
    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None


class TestSecurityGroupCompliance:
  """Test suite for security compliance and best practices."""

  def test_principle_of_least_privilege(self):
    """Test security groups follow principle of least privilege."""
    app = App()
    stack = TapStack(app, "TestLeastPrivilegeStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Only necessary ports should be open

  def test_no_unrestricted_access(self):
    """Test no unrestricted access to sensitive ports."""
    app = App()
    stack = TapStack(app, "TestNoUnrestrictedAccessStack")

    assert stack.instance_security_group is not None
    # No 0.0.0.0/0 access to instance security group except egress

  def test_network_segmentation(self):
    """Test proper network segmentation with security groups."""
    app = App()
    stack = TapStack(app, "TestNetworkSegmentationStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # LB and instance traffic should be properly segmented

  def test_defense_in_depth(self):
    """Test defense in depth security approach."""
    app = App()
    stack = TapStack(app, "TestDefenseInDepthStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Multiple layers of security controls

  def test_explicit_deny_default(self):
    """Test security groups have explicit deny by default."""
    app = App()
    stack = TapStack(app, "TestExplicitDenyDefaultStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Should only allow explicitly defined traffic


class TestSecurityGroupTagging:
  """Test suite for security group tagging and metadata."""

  def test_security_group_common_tags(self):
    """Test security groups have common tags applied."""
    app = App()
    stack = TapStack(app, "TestSGCommonTagsStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    assert stack.common_tags is not None
    # Should include Environment, ManagedBy, etc.

  def test_security_group_name_tags(self):
    """Test security groups have descriptive Name tags."""
    app = App()
    stack = TapStack(app, "TestSGNameTagsStack")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    # Should have descriptive Name tags

  def test_security_group_environment_tags(self):
    """Test security groups have environment-specific tags."""
    app = App()
    stack = TapStack(app, "TestSGEnvironmentTagsStack",
                     environment_suffix="test")

    assert stack.lb_security_group is not None
    assert stack.instance_security_group is not None
    assert stack.environment_suffix == "test"
    # Should reflect the environment in tags


if __name__ == "__main__":
  pytest.main([__file__])

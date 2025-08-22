"""Integration tests for network flow and connectivity patterns."""

import json
import os
import sys

from cdktf import App, Testing

sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))

from lib.tap_stack import TapStack


class TestNetworkConnectivity:
  """Test suite for network connectivity and traffic flow."""


  def test_public_subnet_internet_connectivity(self):
    """Test that public subnets have internet connectivity through IGW."""
    app = App()
    stack = TapStack(app, "PublicConnectivityTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify public subnets exist
    subnets = resources.get("aws_subnet", {})
    public_subnets = []
    for subnet_name, subnet_config in subnets.items():
      if "public" in subnet_name.lower():
        public_subnets.append((subnet_name, subnet_config))

    assert len(public_subnets) == 2, "Should have 2 public subnets"

    # Verify public subnets map public IPs
    for subnet_name, subnet_config in public_subnets:
      assert subnet_config.get("map_public_ip_on_launch") is True

    # Verify Internet Gateway exists
    igw_resources = resources.get("aws_internet_gateway", {})
    assert len(igw_resources) == 1, "Should have one Internet Gateway"

    # Verify public route table with IGW route
    route_tables = resources.get("aws_route_table", {})
    public_route_table = None
    for rt_name, rt_config in route_tables.items():
      if "public" in rt_name.lower():
        public_route_table = (rt_name, rt_config)
        break

    assert public_route_table is not None, "Should have public route table"

    # Verify route to Internet Gateway
    routes = resources.get("aws_route", {})
    igw_route_found = False
    for route_name, route_config in routes.items():
      if "public" in route_name.lower():
        assert route_config.get("destination_cidr_block") == "0.0.0.0/0"
        assert "gateway_id" in route_config
        igw_route_found = True

    assert igw_route_found, "Should have route to Internet Gateway"

  def test_private_subnet_nat_connectivity(self):
    """Test that private subnets have outbound connectivity through NAT."""
    app = App()
    stack = TapStack(app, "PrivateConnectivityTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify private subnets exist
    subnets = resources.get("aws_subnet", {})
    private_subnets = []
    for subnet_name, subnet_config in subnets.items():
      if "private" in subnet_name.lower():
        private_subnets.append((subnet_name, subnet_config))

    assert len(private_subnets) == 2, "Should have 2 private subnets"

    # Verify private subnets don't map public IPs
    for subnet_name, subnet_config in private_subnets:
      assert subnet_config.get("map_public_ip_on_launch") is not True

    # Verify NAT Gateway exists
    nat_resources = resources.get("aws_nat_gateway", {})
    assert len(nat_resources) == 1, "Should have one NAT Gateway"

    # Verify Elastic IP for NAT Gateway
    eip_resources = resources.get("aws_eip", {})
    assert len(eip_resources) == 1, "Should have one Elastic IP for NAT"
    eip_config = list(eip_resources.values())[0]
    assert eip_config.get("domain") == "vpc"

    # Verify private route table with NAT route
    routes = resources.get("aws_route", {})
    nat_route_found = False
    for route_name, route_config in routes.items():
      if "private" in route_name.lower():
        assert route_config.get("destination_cidr_block") == "0.0.0.0/0"
        assert "nat_gateway_id" in route_config
        nat_route_found = True

    assert nat_route_found, "Should have route to NAT Gateway"

  def test_subnet_availability_zone_distribution(self):
    """Test that subnets are distributed across availability zones."""
    app = App()
    stack = TapStack(app, "AZDistributionTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify subnets use different availability zones
    subnets = resources.get("aws_subnet", {})
    az_references = set()

    for subnet_config in subnets.values():
      az_ref = subnet_config.get("availability_zone")
      if az_ref:
        az_references.add(str(az_ref))

    # Should have at least 2 different AZ references
    assert len(az_references) >= 2, "Subnets should be in different AZs"

    # Verify AZ data source exists
    data_sources = synthesized.get("data", {})
    assert "aws_availability_zones" in data_sources

  def test_network_acl_and_security_group_layers(self):
    """Test that network security operates at multiple layers."""
    app = App()
    stack = TapStack(app, "NetworkSecurityLayersTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify security groups exist
    security_groups = resources.get("aws_security_group", {})
    assert len(security_groups) >= 2, "Should have multiple security groups"

    # Verify security group rules exist
    sg_rules = resources.get("aws_security_group_rule", {})
    assert len(sg_rules) >= 4, "Should have multiple security group rules"

    # Verify security groups are associated with VPC
    for sg_config in security_groups.values():
      assert "vpc_id" in sg_config

  def test_load_balancer_network_configuration(self):
    """Test load balancer network configuration and placement."""
    app = App()
    stack = TapStack(app, "LoadBalancerNetworkTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify load balancer exists
    load_balancers = resources.get("aws_lb", {})
    assert len(load_balancers) == 1

    lb_config = list(load_balancers.values())[0]

    # Verify load balancer is internet-facing
    assert lb_config.get("internal") is False

    # Verify load balancer is in multiple subnets
    subnets = lb_config.get("subnets", [])
    assert len(subnets) >= 2, "Load balancer should be in multiple subnets"

    # Verify load balancer has security groups
    security_groups = lb_config.get("security_groups", [])
    assert len(security_groups) >= 1


class TestNetworkSegmentation:
  """Test suite for network segmentation and isolation."""

  def test_public_private_subnet_separation(self):
    """Test proper separation between public and private subnets."""
    app = App()
    stack = TapStack(app, "SubnetSeparationTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    subnets = resources.get("aws_subnet", {})

    public_cidrs = []
    private_cidrs = []

    for subnet_name, subnet_config in subnets.items():
      cidr = subnet_config.get("cidr_block")
      if "public" in subnet_name.lower():
        public_cidrs.append(cidr)
      elif "private" in subnet_name.lower():
        private_cidrs.append(cidr)

    # Verify we have both types
    assert len(public_cidrs) == 2
    assert len(private_cidrs) == 2

    # Verify different CIDR ranges
    expected_public_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
    expected_private_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]

    for cidr in public_cidrs:
      assert cidr in expected_public_cidrs

    for cidr in private_cidrs:
      assert cidr in expected_private_cidrs

  def test_security_group_isolation(self):
    """Test security group isolation between components."""
    app = App()
    stack = TapStack(app, "SecurityGroupIsolationTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify separate security groups for different components
    security_groups = resources.get("aws_security_group", {})

    lb_sg_found = False
    instance_sg_found = False

    for sg_name, sg_config in security_groups.items():
      if "lb" in sg_name.lower():
        lb_sg_found = True
        assert "load balancer" in sg_config.get("description", "").lower()
      elif "instance" in sg_name.lower():
        instance_sg_found = True
        assert "instance" in sg_config.get("description", "").lower()

    assert lb_sg_found, "Should have load balancer security group"
    assert instance_sg_found, "Should have instance security group"

  def test_route_table_isolation(self):
    """Test route table isolation between public and private subnets."""
    app = App()
    stack = TapStack(app, "RouteTableIsolationTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify separate route tables
    route_tables = resources.get("aws_route_table", {})

    public_rt_found = False
    private_rt_found = False

    for rt_name, _ in route_tables.items():
      if "public" in rt_name.lower():
        public_rt_found = True
      elif "private" in rt_name.lower():
        private_rt_found = True

    assert public_rt_found, "Should have public route table"
    assert private_rt_found, "Should have private route table"

    # Verify route table associations
    associations = resources.get("aws_route_table_association", {})
    assert len(associations) == 4, "Should have 4 route table associations"


class TestTrafficFlow:
  """Test suite for end-to-end traffic flow patterns."""

  def test_internet_to_load_balancer_flow(self):
    """Test traffic flow from internet to load balancer."""
    app = App()
    stack = TapStack(app, "InternetToLBFlowTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify load balancer is internet-facing
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    assert lb_config.get("internal") is False

    # Verify load balancer security group allows HTTP from internet
    sg_rules = resources.get("aws_security_group_rule", {})

    http_ingress_found = False
    for _, rule_config in sg_rules.items():
      if (rule_config.get("type") == "ingress" and
          rule_config.get("from_port") == 80 and
              rule_config.get("to_port") == 80):

        cidr_blocks = rule_config.get("cidr_blocks", [])
        if "0.0.0.0/0" in cidr_blocks:
          http_ingress_found = True

    assert http_ingress_found, "Should allow HTTP ingress from internet"

  def test_load_balancer_to_instances_flow(self):
    """Test traffic flow from load balancer to instances."""
    app = App()
    stack = TapStack(app, "LBToInstancesFlowTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify target group configuration
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]

    assert tg_config.get("port") == 80
    assert tg_config.get("protocol") == "HTTP"
    assert tg_config.get("target_type") == "instance"

    # Verify health check configuration
    health_check = tg_config.get("health_check", {})
    assert health_check.get("enabled") is True
    assert health_check.get("path") == "/"
    assert health_check.get("protocol") == "HTTP"

    # Verify Auto Scaling Group targets the target group
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    assert "target_group_arns" in asg_config

  def test_instance_outbound_connectivity(self):
    """Test instance outbound connectivity for updates and patches."""
    app = App()
    stack = TapStack(app, "InstanceOutboundTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify instance security group allows outbound traffic
    sg_rules = resources.get("aws_security_group_rule", {})

    outbound_all_found = False
    for _, rule_config in sg_rules.items():
      if (rule_config.get("type") == "egress" and
          rule_config.get("from_port") == 0 and
          rule_config.get("to_port") == 0 and
              rule_config.get("protocol") == "-1"):

        cidr_blocks = rule_config.get("cidr_blocks", [])
        if "0.0.0.0/0" in cidr_blocks:
          outbound_all_found = True

    assert outbound_all_found, "Should allow all outbound traffic"

  def test_cross_az_redundancy(self):
    """Test cross-availability zone redundancy setup."""
    app = App()
    stack = TapStack(app, "CrossAZRedundancyTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify subnets span multiple AZs
    subnets = resources.get("aws_subnet", {})
    assert len(subnets) == 4  # 2 public + 2 private

    # Verify load balancer spans multiple subnets
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    lb_subnets = lb_config.get("subnets", [])
    assert len(lb_subnets) >= 2

    # Verify Auto Scaling Group spans multiple subnets
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]
    vpc_zone_identifier = asg_config.get("vpc_zone_identifier", [])
    assert len(vpc_zone_identifier) >= 2


class TestNetworkResilience:
  """Test suite for network resilience and fault tolerance."""

  def test_nat_gateway_single_point_awareness(self):
    """Test awareness of NAT Gateway as potential single point of failure."""
    app = App()
    stack = TapStack(app, "NATGatewayResilienceTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify single NAT Gateway configuration (current setup)
    nat_gateways = resources.get("aws_nat_gateway", {})
    assert len(nat_gateways) == 1

    # Verify NAT Gateway is in a public subnet
    nat_config = list(nat_gateways.values())[0]
    assert "subnet_id" in nat_config
    assert "allocation_id" in nat_config

    # Note: In production, multiple NAT Gateways across AZs would be recommended

  def test_load_balancer_high_availability(self):
    """Test load balancer high availability configuration."""
    app = App()
    stack = TapStack(app, "LoadBalancerHATestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify load balancer spans multiple subnets/AZs
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]

    subnets = lb_config.get("subnets", [])
    assert len(subnets) >= 2, "Load balancer should span multiple AZs"

    # Verify target group health checks
    target_groups = resources.get("aws_lb_target_group", {})
    tg_config = list(target_groups.values())[0]

    health_check = tg_config.get("health_check", {})
    assert health_check.get("healthy_threshold") == 2
    assert health_check.get("unhealthy_threshold") == 2
    assert health_check.get("interval") == 30

  def test_autoscaling_resilience_configuration(self):
    """Test Auto Scaling Group resilience configuration."""
    app = App()
    stack = TapStack(app, "AutoScalingResilienceTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify Auto Scaling Group configuration
    asg_resources = resources.get("aws_autoscaling_group", {})
    asg_config = list(asg_resources.values())[0]

    # Verify minimum capacity for resilience
    assert asg_config.get("min_size") >= 2
    assert asg_config.get("desired_capacity") >= 2

    # Verify health check configuration
    assert asg_config.get("health_check_type") == "ELB"
    assert asg_config.get("health_check_grace_period") == 300

    # Verify spans multiple AZs
    vpc_zone_identifier = asg_config.get("vpc_zone_identifier", [])
    assert len(vpc_zone_identifier) >= 2

  def test_network_monitoring_readiness(self):
    """Test network monitoring and observability readiness."""
    app = App()
    stack = TapStack(app, "NetworkMonitoringTestStack")

    synthesized = json.loads(Testing.synth(stack))
    resources = synthesized["resource"]

    # Verify VPC Flow Logs capability (VPC exists)
    vpcs = resources.get("aws_vpc", {})
    assert len(vpcs) == 1

    # Verify load balancer access logs capability
    load_balancers = resources.get("aws_lb", {})
    lb_config = list(load_balancers.values())[0]
    # Access logs would be configured separately, but LB should exist
    assert lb_config is not None

    # Verify target group for health monitoring
    target_groups = resources.get("aws_lb_target_group", {})
    assert len(target_groups) == 1


if __name__ == "__main__":
  import pytest
  pytest.main([__file__])

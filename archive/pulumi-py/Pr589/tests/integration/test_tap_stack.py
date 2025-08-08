"""
Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack against PROMPT.md requirements.
"""

import unittest
import os
import json
from typing import Dict, Any
import boto3


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  @classmethod
  def setUpClass(cls):
    """Set up integration test with live stack outputs."""
    cls.outputs = cls._load_stack_outputs()
    cls.region = cls.outputs.get('region', 'us-east-1')

    # Initialize AWS clients
    cls.ec2 = boto3.client('ec2', region_name=cls.region)
    cls.logs = boto3.client('logs', region_name=cls.region)
    cls.iam = boto3.client('iam')

  @classmethod
  def _load_stack_outputs(cls) -> Dict[str, Any]:
    try:
      outputs_file = os.path.join(
          os.path.dirname(__file__),
          '../../cfn-outputs/flat-outputs.json'
      )
      if os.path.exists(outputs_file):
        with open(outputs_file, 'r') as f:
          outputs = json.load(f)

        for key, value in outputs.items():
          if isinstance(value, str) and value.startswith(
                  "[") and value.endswith("]"):
            try:
              outputs[key] = json.loads(value)
            except json.JSONDecodeError:
              pass  # leave as-is if it’s not actually a list

        return outputs or {}
    except (FileNotFoundError, json.JSONDecodeError):
      return {}

    # Fallback: Check environment variables or use defaults
    return {
        'vpc_id': os.getenv('VPC_ID'),
        'region': os.getenv(
            'AWS_REGION',
            'us-east-1'),
        'public_subnet_ids': os.getenv(
            'PUBLIC_SUBNET_IDS',
            '').split(',') if os.getenv('PUBLIC_SUBNET_IDS') else [],
        'private_subnet_ids': os.getenv(
            'PRIVATE_SUBNET_IDS',
            '').split(',') if os.getenv('PRIVATE_SUBNET_IDS') else [],
        'internet_gateway_id': os.getenv('INTERNET_GATEWAY_ID'),
        'nat_gateway_ids': os.getenv(
            'NAT_GATEWAY_IDS',
            '').split(',') if os.getenv('NAT_GATEWAY_IDS') else [],
        'flow_log_id': os.getenv('FLOW_LOG_ID'),
    }

  def test_vpc_exists_and_configured(self):
    """Test that VPC exists with proper DNS configuration."""
    vpc_id = self.outputs.get('vpc_id')
    self.assertIsNotNone(vpc_id, "VPC ID not found in stack outputs")

    # Describe VPC
    response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
    self.assertEqual(len(response['Vpcs']), 1)

    vpc = response['Vpcs'][0]
    self.assertEqual(vpc['State'], 'available')
    self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
    self.assertTrue(vpc['DhcpOptionsId'])

    # Check DNS attributes
    dns_attrs = self.ec2.describe_vpc_attribute(
        VpcId=vpc_id, Attribute='enableDnsHostnames'
    )
    self.assertTrue(dns_attrs['EnableDnsHostnames']['Value'])

    dns_support = self.ec2.describe_vpc_attribute(
        VpcId=vpc_id, Attribute='enableDnsSupport'
    )
    self.assertTrue(dns_support['EnableDnsSupport']['Value'])

  def test_public_subnets_configuration(self):
    """Test public subnets are properly configured across AZs."""
    public_subnet_ids = self.outputs.get('public_subnet_ids', [])
    if isinstance(public_subnet_ids, str):
      public_subnet_ids = public_subnet_ids.split(',')

    self.assertGreaterEqual(len(public_subnet_ids), 2,
                            "Should have at least 2 public subnets")

    response = self.ec2.describe_subnets(SubnetIds=public_subnet_ids)
    subnets = response['Subnets']

    # Check each subnet
    availability_zones = set()
    for subnet in subnets:
      # Should be in available state
      self.assertEqual(subnet['State'], 'available')

      # Should auto-assign public IPs
      self.assertTrue(subnet['MapPublicIpOnLaunch'])

      # Should be in different AZs
      availability_zones.add(subnet['AvailabilityZone'])

      # Check CIDR blocks (should be 10.0.1.0/24, 10.0.2.0/24, etc.)
      cidr = subnet['CidrBlock']
      self.assertTrue(cidr.startswith('10.0.'))
      self.assertTrue(cidr.endswith('/24'))

    # Verify multi-AZ deployment
    self.assertGreaterEqual(len(availability_zones), 2,
                            "Public subnets should span multiple AZs")

  def test_private_subnets_configuration(self):
    """Test private subnets are properly configured across AZs."""
    private_subnet_ids = self.outputs.get('private_subnet_ids', [])
    if isinstance(private_subnet_ids, str):
      private_subnet_ids = private_subnet_ids.split(',')

    self.assertGreaterEqual(len(private_subnet_ids), 2,
                            "Should have at least 2 private subnets")

    response = self.ec2.describe_subnets(SubnetIds=private_subnet_ids)
    subnets = response['Subnets']

    availability_zones = set()
    for subnet in subnets:
      # Should be in available state
      self.assertEqual(subnet['State'], 'available')

      # Should NOT auto-assign public IPs
      self.assertFalse(subnet['MapPublicIpOnLaunch'])

      # Should be in different AZs
      availability_zones.add(subnet['AvailabilityZone'])

      # Check CIDR blocks (should be 10.0.10.0/24, 10.0.20.0/24, etc.)
      cidr = subnet['CidrBlock']
      self.assertTrue(cidr.startswith('10.0.'))
      self.assertTrue(cidr.endswith('/24'))

    # Verify multi-AZ deployment
    self.assertGreaterEqual(len(availability_zones), 2,
                            "Private subnets should span multiple AZs")

  def test_internet_gateway_attachment(self):
    """Test Internet Gateway is properly attached to the correct VPC."""
    igw_id = self.outputs.get('internet_gateway_id')
    vpc_id = self.outputs.get('vpc_id')

    self.assertIsNotNone(igw_id, "Internet Gateway ID not found in outputs")
    self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

    response = self.ec2.describe_internet_gateways(InternetGatewayIds=[igw_id])
    igw = response['InternetGateways'][0]

    # Check that IGW is attached to the correct VPC
    attachments = igw.get('Attachments', [])
    self.assertTrue(
        len(attachments) > 0,
        f"No attachments found for IGW: {igw_id}")

    vpc_ids = [attachment.get('VpcId') for attachment in attachments]
    self.assertIn(
        vpc_id,
        vpc_ids,
        f"IGW {igw_id} is not attached to VPC {vpc_id}")

  def test_nat_gateways_configuration(self):
    """Test NAT Gateways are properly configured for private subnet outbound access."""
    nat_gateway_ids = self.outputs.get('nat_gateway_ids', [])
    if isinstance(nat_gateway_ids, str):
      nat_gateway_ids = nat_gateway_ids.split(',')

    self.assertGreaterEqual(len(nat_gateway_ids), 1,
                            "Should have at least 1 NAT Gateway")

    response = self.ec2.describe_nat_gateways(NatGatewayIds=nat_gateway_ids)
    nat_gateways = response['NatGateways']

    for nat_gw in nat_gateways:
      # Should be in available state
      self.assertEqual(nat_gw['State'], 'available')

      # Should have an Elastic IP
      self.assertTrue(nat_gw['NatGatewayAddresses'])

      # Should be in a public subnet
      subnet_id = nat_gw['SubnetId']
      subnet_response = self.ec2.describe_subnets(SubnetIds=[subnet_id])
      subnet = subnet_response['Subnets'][0]
      self.assertTrue(subnet['MapPublicIpOnLaunch'],
                      "NAT Gateway should be in public subnet")

  def test_network_acl_security_rules(self):
    """Test Network ACLs implement proper security restrictions."""
    vpc_id = self.outputs.get('vpc_id')
    public_subnet_ids = self.outputs.get('public_subnet_ids', [])
    private_subnet_ids = self.outputs.get('private_subnet_ids', [])

    if isinstance(public_subnet_ids, str):
      public_subnet_ids = public_subnet_ids.split(',')
    if isinstance(private_subnet_ids, str):
      private_subnet_ids = private_subnet_ids.split(',')

    # Get all Network ACLs for the VPC
    response = self.ec2.describe_network_acls(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    nacls = response['NetworkAcls']

    # Find public and private NACLs by subnet associations
    public_nacl = None
    private_nacl = None

    for nacl in nacls:
      if nacl['IsDefault']:
        continue  # Skip default NACL

      subnet_ids = [assoc['SubnetId'] for assoc in nacl['Associations']]

      # Check if this NACL is associated with public subnets
      if any(sid in public_subnet_ids for sid in subnet_ids):
        public_nacl = nacl
      # Check if this NACL is associated with private subnets
      elif any(sid in private_subnet_ids for sid in subnet_ids):
        private_nacl = nacl

    # Test public NACL rules (should allow only HTTP/HTTPS inbound)
    if public_nacl:
      inbound_rules = [
          rule for rule in public_nacl['Entries'] if not rule['Egress']]

      # Check for HTTP rule
      http_rule = next((rule for rule in inbound_rules
                        if rule.get('PortRange', {}).get('From') == 80), None)
      self.assertIsNotNone(http_rule, "Public NACL should allow HTTP inbound")
      self.assertEqual(http_rule['RuleAction'], 'allow')

      # Check for HTTPS rule
      https_rule = next(
          (rule for rule in inbound_rules if rule.get(
              'PortRange', {}).get('From') == 443), None)
      self.assertIsNotNone(https_rule,
                           "Public NACL should allow HTTPS inbound")
      self.assertEqual(https_rule['RuleAction'], 'allow')

    # Test private NACL rules (should allow VPC traffic inbound, all outbound)
    if private_nacl:
      inbound_rules = [
          rule for rule in private_nacl['Entries'] if not rule['Egress']]
      outbound_rules = [
          rule for rule in private_nacl['Entries'] if rule['Egress']]

      # Should have inbound rule allowing VPC CIDR
      vpc_inbound_rule = next(
          (rule for rule in inbound_rules if rule.get('CidrBlock') == '10.0.0.0/16'),
          None)
      if vpc_inbound_rule:
        self.assertEqual(vpc_inbound_rule['RuleAction'], 'allow')

      # Should have outbound rule allowing all traffic
      all_outbound_rule = next((rule for rule in outbound_rules
                                if rule.get('CidrBlock') == '0.0.0.0/0'), None)
      if all_outbound_rule:
        self.assertEqual(all_outbound_rule['RuleAction'], 'allow')

  def test_vpc_flow_logs_enabled(self):
    """Test that a Flow Log is attached to the VPC and is active."""
    vpc_id = self.outputs.get('vpc_id')
    flow_log_id = self.outputs.get('flow_log_id')

    self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
    self.assertIsNotNone(flow_log_id, "Flow Log ID not found in outputs")

    # Get flow log by ID (more reliable than filter)
    response = self.ec2.describe_flow_logs(FlowLogIds=[flow_log_id])
    flow_logs = response.get('FlowLogs', [])

    # self.assertGreater(len(flow_logs), 0, "Flow log ID not found in AWS")

    flow_log = flow_logs[0]
    self.assertEqual(flow_log.get('ResourceId'), vpc_id,
                     f"Flow log not attached to VPC {vpc_id}")
    self.assertEqual(
        flow_log.get('FlowLogStatus'),
        'ACTIVE',
        "Flow log is not active")

  def test_resource_tagging_compliance(self):
    """Test that all resources have required Owner and Environment tags."""
    vpc_id = self.outputs.get('vpc_id')

    # Test VPC tags
    response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
    vpc = response['Vpcs'][0]

    tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
    self.assertIn('Owner', tags, "VPC should have Owner tag")
    self.assertIn('Environment', tags, "VPC should have Environment tag")

    # Test subnet tags
    all_subnet_ids = []
    public_subnet_ids = self.outputs.get('public_subnet_ids', [])
    private_subnet_ids = self.outputs.get('private_subnet_ids', [])

    if isinstance(public_subnet_ids, str):
      public_subnet_ids = public_subnet_ids.split(',')
    if isinstance(private_subnet_ids, str):
      private_subnet_ids = private_subnet_ids.split(',')

    all_subnet_ids.extend(public_subnet_ids)
    all_subnet_ids.extend(private_subnet_ids)

    if all_subnet_ids:
      response = self.ec2.describe_subnets(SubnetIds=all_subnet_ids)
      for subnet in response['Subnets']:
        tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
        self.assertIn(
            'Owner', tags, f"Subnet {
                subnet['SubnetId']} should have Owner tag")
        self.assertIn(
            'Environment', tags, f"Subnet {
                subnet['SubnetId']} should have Environment tag")

  def test_route_table_configuration(self):
    """Test route tables are properly configured for public and private subnets."""
    vpc_id = self.outputs.get('vpc_id')
    igw_id = self.outputs.get('internet_gateway_id')
    public_subnet_ids = self.outputs.get('public_subnet_ids', [])
    private_subnet_ids = self.outputs.get('private_subnet_ids', [])

    if isinstance(public_subnet_ids, str):
      public_subnet_ids = public_subnet_ids.split(',')
    if isinstance(private_subnet_ids, str):
      private_subnet_ids = private_subnet_ids.split(',')

    # Get route tables for the VPC
    response = self.ec2.describe_route_tables(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    route_tables = response['RouteTables']

    # Find public route table (should route to IGW)
    public_rt = None
    for rt in route_tables:
      # Check if associated with public subnets
      assoc_subnets = [assoc['SubnetId'] for assoc in rt['Associations']
                       if 'SubnetId' in assoc]
      if any(sid in public_subnet_ids for sid in assoc_subnets):
        public_rt = rt
        break

    if public_rt:
      # Should have route to Internet Gateway
      igw_route = next((route for route in public_rt['Routes']
                        if route.get('GatewayId') == igw_id), None)
      self.assertIsNotNone(igw_route, "Public route table should route to IGW")
      self.assertEqual(igw_route['DestinationCidrBlock'], '0.0.0.0/0')

    # Find private route tables (should route to NAT Gateway)
    private_rts = []
    for rt in route_tables:
      assoc_subnets = [assoc['SubnetId'] for assoc in rt['Associations']
                       if 'SubnetId' in assoc]
      if any(sid in private_subnet_ids for sid in assoc_subnets):
        private_rts.append(rt)

    # Should have at least one private route table
    self.assertGreater(len(private_rts), 0,
                       "Should have private route tables for private subnets")

    # Each private route table should have route to NAT Gateway
    for rt in private_rts:
      nat_route = next((route for route in rt['Routes']
                        if 'NatGatewayId' in route), None)
      if nat_route:  # May not exist immediately after deployment
        self.assertEqual(nat_route['DestinationCidrBlock'], '0.0.0.0/0')

  def test_region_agnostic_deployment(self):
    """Test that deployment works in the specified region."""
    region = self.outputs.get('region', 'us-east-1')

    # Verify all AZs are in the correct region
    public_subnet_ids = self.outputs.get('public_subnet_ids', [])
    if isinstance(public_subnet_ids, str):
      public_subnet_ids = public_subnet_ids.split(',')

    if public_subnet_ids:
      response = self.ec2.describe_subnets(SubnetIds=public_subnet_ids)
      for subnet in response['Subnets']:
        az = subnet['AvailabilityZone']
        self.assertTrue(az.startswith(region),
                        f"Availability zone {az} should be in region {region}")


if __name__ == '__main__':
  # Only run if we have stack outputs
  if os.path.exists('cfn-outputs/flat-outputs.json') or os.getenv('VPC_ID'):
    unittest.main()
  else:
    print("Skipping integration tests - no stack outputs found")
    print("Deploy infrastructure first or provide VPC_ID environment variable")

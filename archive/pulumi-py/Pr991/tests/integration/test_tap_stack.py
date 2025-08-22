"""
Integration tests for TapStack IPv6 dual-stack VPC infrastructure.

Tests validate live AWS resources including VPC, subnets, EC2 instances, 
security groups, auto-scaling groups, and IPv6 configuration against 
deployed infrastructure.
"""

import json
import subprocess
import unittest
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveInfrastructure(unittest.TestCase):
  """Live integration tests for deployed TapStack IPv6 infrastructure."""

  @classmethod
  def setUpClass(cls):
    """Set up AWS clients and get deployment outputs."""
    cls.region = 'us-east-1'
    
    # Initialize AWS clients
    cls.ec2_client = boto3.client('ec2', region_name=cls.region)
    cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
    
    # Get Pulumi stack outputs
    cls.stack_outputs = cls._get_pulumi_outputs()

  @classmethod
  def _get_pulumi_outputs(cls):
    """Get outputs from LIVE deployed Pulumi stack - NO SKIPPING ALLOWED."""
    import os
    
    # Build stack name using CI/CD environment variables
    # CI/CD uses: ${PULUMI_ORG}/TapStack/TapStack${ENVIRONMENT_SUFFIX}
    pulumi_org = os.environ.get('PULUMI_ORG', 'turinggpt')
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    
    # Construct the full stack name as used in CI/CD
    stack_name = f"{pulumi_org}/TapStack/TapStack{environment_suffix}"
    
    # For local testing, allow override with PULUMI_STACK_NAME
    if 'PULUMI_STACK_NAME' in os.environ:
      stack_name = os.environ['PULUMI_STACK_NAME']
    
    # Ensure we're in the correct directory (project root)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Prepare environment with necessary Pulumi variables
    env = os.environ.copy()
    if 'PULUMI_CONFIG_PASSPHRASE' in os.environ:
      env['PULUMI_CONFIG_PASSPHRASE'] = os.environ['PULUMI_CONFIG_PASSPHRASE']
    
    # Add Pulumi backend URL if provided (needed for CI/CD)
    if 'PULUMI_BACKEND_URL' in os.environ:
      env['PULUMI_BACKEND_URL'] = os.environ['PULUMI_BACKEND_URL']
    
    try:
      # Login to Pulumi backend if URL is provided (for CI/CD)
      if 'PULUMI_BACKEND_URL' in env:
        login_result = subprocess.run(
          ['pulumi', 'login', env['PULUMI_BACKEND_URL']],
          capture_output=True,
          text=True,
          cwd=project_root,
          env=env
        )
      
      # Select the stack to ensure correct context
      select_result = subprocess.run(
        ['pulumi', 'stack', 'select', stack_name],
        capture_output=True,
        text=True,
        cwd=project_root,
        env=env
      )
      
      # Get the outputs from the selected stack with explicit stack parameter
      result = subprocess.run(
        ['pulumi', 'stack', 'output', '--json', '--stack', stack_name],
        capture_output=True,
        text=True,
        check=True,
        cwd=project_root,
        env=env
      )
      outputs = json.loads(result.stdout)
      
      # Integration tests MUST run against live infrastructure
      if not outputs:
        raise AssertionError(
          f"LIVE INTEGRATION TEST FAILURE: No Pulumi stack outputs found. "
          f"Stack: {stack_name}, Working Directory: {project_root}\n"
          f"Environment: PULUMI_ORG={pulumi_org}, ENVIRONMENT_SUFFIX={environment_suffix}\n"
          "Deploy infrastructure first with 'pulumi up' before running integration tests."
        )
      
      return outputs
    except subprocess.CalledProcessError as e:
      # Provide detailed error information for debugging
      error_msg = (
        f"LIVE INTEGRATION TEST FAILURE: Cannot get Pulumi outputs (exit {e.returncode}). "
        f"Stack: {stack_name}, Working Directory: {project_root}\n"
        f"Environment: PULUMI_ORG={pulumi_org}, ENVIRONMENT_SUFFIX={environment_suffix}\n"
        f"Error output: {e.stderr if hasattr(e, 'stderr') and e.stderr else 'No error output'}\n"
        "Deploy infrastructure first with 'pulumi up' before running integration tests."
      )
      raise AssertionError(error_msg) from e
    except (json.JSONDecodeError, FileNotFoundError) as e:
      raise AssertionError(
        f"LIVE INTEGRATION TEST FAILURE: Invalid Pulumi outputs - {e}. "
        f"Stack: {stack_name}, Working Directory: {project_root}\n"
        f"Environment: PULUMI_ORG={pulumi_org}, ENVIRONMENT_SUFFIX={environment_suffix}\n"
        "Ensure infrastructure is properly deployed."
      ) from e

  def test_vpc_exists_with_ipv6_configuration(self):
    """Test that VPC exists with both IPv4 and IPv6 CIDR blocks."""
    vpc_id = self.stack_outputs.get('vpc_id')
    self.assertIsNotNone(vpc_id, "VPC ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
      vpcs = response['Vpcs']
      
      self.assertEqual(len(vpcs), 1)
      vpc = vpcs[0]
      
      # Verify IPv4 CIDR block
      self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
      
      # Verify IPv6 CIDR block exists
      ipv6_cidr_blocks = vpc.get('Ipv6CidrBlockAssociationSet', [])
      active_ipv6 = [block for block in ipv6_cidr_blocks 
                    if block['Ipv6CidrBlockState']['State'] == 'associated']
      self.assertGreater(len(active_ipv6), 0, "VPC should have IPv6 CIDR block")
      
      # Verify DNS support (need to check attributes separately)
      dns_support = self.ec2_client.describe_vpc_attribute(
        VpcId=vpc_id, Attribute='enableDnsSupport')
      dns_hostnames = self.ec2_client.describe_vpc_attribute(
        VpcId=vpc_id, Attribute='enableDnsHostnames')
      
      self.assertTrue(dns_support['EnableDnsSupport']['Value'])
      self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
      
      # Verify tags
      tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
      self.assertEqual(tags.get('Environment'), 'Production')
      self.assertEqual(tags.get('Project'), 'IPv6StaticTest')
      self.assertEqual(tags.get('ManagedBy'), 'Pulumi')
      
    except ClientError as e:
      self.fail(f"VPC {vpc_id} not found or misconfigured: {e}")

  def test_public_subnet_ipv6_configuration(self):
    """Test public subnet has correct IPv4 and IPv6 configuration."""
    subnet_id = self.stack_outputs.get('public_subnet_id')
    self.assertIsNotNone(subnet_id, "Public subnet ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
      subnets = response['Subnets']
      
      self.assertEqual(len(subnets), 1)
      subnet = subnets[0]
      
      # Verify IPv4 configuration
      self.assertEqual(subnet['CidrBlock'], '10.0.11.0/24')
      self.assertTrue(subnet['MapPublicIpOnLaunch'])
      
      # Verify IPv6 configuration
      ipv6_cidr_blocks = subnet.get('Ipv6CidrBlockAssociationSet', [])
      active_ipv6 = [block for block in ipv6_cidr_blocks 
                    if block['Ipv6CidrBlockState']['State'] == 'associated']
      self.assertGreater(len(active_ipv6), 0, "Public subnet should have IPv6 CIDR block")
      
      self.assertTrue(subnet['AssignIpv6AddressOnCreation'])
      
      # Verify availability zone
      self.assertIn(subnet['AvailabilityZone'], ['us-east-1a', 'us-east-1b', 'us-east-1c'])
      
    except ClientError as e:
      self.fail(f"Public subnet {subnet_id} not found or misconfigured: {e}")

  def test_private_subnet_ipv6_configuration(self):
    """Test private subnet has correct IPv4 and IPv6 configuration."""
    subnet_id = self.stack_outputs.get('private_subnet_id')
    self.assertIsNotNone(subnet_id, "Private subnet ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
      subnets = response['Subnets']
      
      self.assertEqual(len(subnets), 1)
      subnet = subnets[0]
      
      # Verify IPv4 configuration
      self.assertEqual(subnet['CidrBlock'], '10.0.12.0/24')
      self.assertFalse(subnet['MapPublicIpOnLaunch'])
      
      # Verify IPv6 configuration
      ipv6_cidr_blocks = subnet.get('Ipv6CidrBlockAssociationSet', [])
      active_ipv6 = [block for block in ipv6_cidr_blocks 
                    if block['Ipv6CidrBlockState']['State'] == 'associated']
      self.assertGreater(len(active_ipv6), 0, "Private subnet should have IPv6 CIDR block")
      
      self.assertTrue(subnet['AssignIpv6AddressOnCreation'])
      
    except ClientError as e:
      self.fail(f"Private subnet {subnet_id} not found or misconfigured: {e}")

  def test_internet_gateway_configuration(self):
    """Test Internet Gateway is properly attached to VPC."""
    igw_id = self.stack_outputs.get('internet_gateway_id')
    vpc_id = self.stack_outputs.get('vpc_id')
    
    self.assertIsNotNone(igw_id, "Internet Gateway ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_internet_gateways(InternetGatewayIds=[igw_id])
      gateways = response['InternetGateways']
      
      self.assertEqual(len(gateways), 1)
      igw = gateways[0]
      
      # Verify attachment to VPC
      attachments = igw.get('Attachments', [])
      self.assertEqual(len(attachments), 1)
      self.assertEqual(attachments[0]['VpcId'], vpc_id)
      self.assertEqual(attachments[0]['State'], 'available')
      
    except ClientError as e:
      self.fail(f"Internet Gateway {igw_id} not found or misconfigured: {e}")

  def test_nat_gateway_configuration(self):
    """Test NAT Gateway is properly configured in public subnet."""
    nat_gw_id = self.stack_outputs.get('nat_gateway_id')
    public_subnet_id = self.stack_outputs.get('public_subnet_id')
    
    self.assertIsNotNone(nat_gw_id, "NAT Gateway ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_nat_gateways(NatGatewayIds=[nat_gw_id])
      nat_gateways = response['NatGateways']
      
      self.assertEqual(len(nat_gateways), 1)
      nat_gw = nat_gateways[0]
      
      # Verify configuration
      self.assertEqual(nat_gw['SubnetId'], public_subnet_id)
      self.assertEqual(nat_gw['State'], 'available')
      
      # Verify NAT Gateway has EIP
      addresses = nat_gw.get('NatGatewayAddresses', [])
      self.assertGreater(len(addresses), 0)
      
    except ClientError as e:
      self.fail(f"NAT Gateway {nat_gw_id} not found or misconfigured: {e}")

  def test_egress_only_internet_gateway(self):
    """Test Egress-Only Internet Gateway for IPv6 outbound traffic."""
    egress_igw_id = self.stack_outputs.get('egress_igw_id')
    vpc_id = self.stack_outputs.get('vpc_id')
    
    self.assertIsNotNone(egress_igw_id, "Egress-Only IGW ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_egress_only_internet_gateways(
        EgressOnlyInternetGatewayIds=[egress_igw_id]
      )
      gateways = response['EgressOnlyInternetGateways']
      
      self.assertEqual(len(gateways), 1)
      egress_igw = gateways[0]
      
      # Verify attachment to VPC
      attachments = egress_igw.get('Attachments', [])
      self.assertEqual(len(attachments), 1)
      self.assertEqual(attachments[0]['VpcId'], vpc_id)
      self.assertEqual(attachments[0]['State'], 'attached')
      
    except ClientError as e:
      self.fail(f"Egress-Only IGW {egress_igw_id} not found or misconfigured: {e}")

  def test_security_group_rules(self):
    """Test security group has correct IPv4 and IPv6 rules."""
    sg_id = self.stack_outputs.get('security_group_id')
    self.assertIsNotNone(sg_id, "Security Group ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
      security_groups = response['SecurityGroups']
      
      self.assertEqual(len(security_groups), 1)
      sg = security_groups[0]
      
      # Check ingress rules
      ingress_rules = sg['IpPermissions']
      
      # Should have SSH (22), HTTP (80), HTTPS (443) rules
      ports_found = set()
      for rule in ingress_rules:
        if rule['IpProtocol'] == 'tcp':
          port = rule['FromPort']
          ports_found.add(port)
          
          # Verify both IPv4 and IPv6 CIDR blocks for each port
          ipv4_ranges = rule.get('IpRanges', [])
          ipv6_ranges = rule.get('Ipv6Ranges', [])
          
          self.assertTrue(any(ip['CidrIp'] == '0.0.0.0/0' for ip in ipv4_ranges))
          self.assertTrue(any(ip['CidrIpv6'] == '::/0' for ip in ipv6_ranges))
      
      expected_ports = {22, 80, 443}
      self.assertEqual(ports_found, expected_ports)
      
      # Check egress rules (should allow all outbound)
      egress_rules = sg['IpPermissionsEgress']
      self.assertGreater(len(egress_rules), 0)
      
    except ClientError as e:
      self.fail(f"Security Group {sg_id} not found or misconfigured: {e}")

  def test_ec2_instances_have_ipv6_addresses(self):
    """Test EC2 instances have IPv6 addresses assigned."""
    instance1_id = self.stack_outputs.get('instance1_id')
    instance2_id = self.stack_outputs.get('instance2_id')
    
    for instance_id in [instance1_id, instance2_id]:
      self.assertIsNotNone(instance_id, "Instance ID not found in stack outputs")
      
      try:
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        reservations = response['Reservations']
        
        self.assertEqual(len(reservations), 1)
        instances = reservations[0]['Instances']
        self.assertEqual(len(instances), 1)
        
        instance = instances[0]
        
        # Verify instance is running
        self.assertEqual(instance['State']['Name'], 'running')
        
        # Verify IPv4 address
        self.assertIsNotNone(instance.get('PublicIpAddress'))
        self.assertIsNotNone(instance.get('PrivateIpAddress'))
        
        # Verify IPv6 addresses
        network_interfaces = instance.get('NetworkInterfaces', [])
        self.assertGreater(len(network_interfaces), 0)
        
        primary_ni = network_interfaces[0]
        ipv6_addresses = primary_ni.get('Ipv6Addresses', [])
        self.assertGreater(len(ipv6_addresses), 0, 
                         f"Instance {instance_id} should have IPv6 addresses")
        
        # Verify instance type
        self.assertEqual(instance['InstanceType'], 't3.micro')
        
        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
        self.assertEqual(tags.get('Environment'), 'Production')
        self.assertEqual(tags.get('Project'), 'IPv6StaticTest')
        self.assertEqual(tags.get('ManagedBy'), 'Pulumi')
        
      except ClientError as e:
        self.fail(f"Instance {instance_id} not found or misconfigured: {e}")

  def test_route_tables_configuration(self):
    """Test route tables have correct IPv4 and IPv6 routes."""
    vpc_id = self.stack_outputs.get('vpc_id')
    public_subnet_id = self.stack_outputs.get('public_subnet_id')
    private_subnet_id = self.stack_outputs.get('private_subnet_id')
    igw_id = self.stack_outputs.get('internet_gateway_id')
    nat_gw_id = self.stack_outputs.get('nat_gateway_id')
    egress_igw_id = self.stack_outputs.get('egress_igw_id')
    
    try:
      # Get route tables for VPC
      response = self.ec2_client.describe_route_tables(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      route_tables = response['RouteTables']
      
      # Get subnet associations to identify public/private route tables
      subnet_associations = {}
      for rt in route_tables:
        for assoc in rt.get('Associations', []):
          if assoc.get('SubnetId'):
            subnet_associations[assoc['SubnetId']] = rt
      
      # Test public subnet route table
      public_rt = subnet_associations.get(public_subnet_id)
      self.assertIsNotNone(public_rt, "Public subnet should have route table")
      
      public_routes = public_rt['Routes']
      ipv4_internet_route = any(
        route.get('DestinationCidrBlock') == '0.0.0.0/0' and 
        route.get('GatewayId') == igw_id
        for route in public_routes
      )
      ipv6_internet_route = any(
        route.get('DestinationIpv6CidrBlock') == '::/0' and 
        route.get('GatewayId') == igw_id
        for route in public_routes
      )
      self.assertTrue(ipv4_internet_route, "Public subnet missing IPv4 internet route")
      self.assertTrue(ipv6_internet_route, "Public subnet missing IPv6 internet route")
      
      # Test private subnet route table
      private_rt = subnet_associations.get(private_subnet_id)
      self.assertIsNotNone(private_rt, "Private subnet should have route table")
      
      private_routes = private_rt['Routes']
      ipv4_nat_route = any(
        route.get('DestinationCidrBlock') == '0.0.0.0/0' and 
        route.get('NatGatewayId') == nat_gw_id
        for route in private_routes
      )
      ipv6_egress_route = any(
        route.get('DestinationIpv6CidrBlock') == '::/0' and 
        route.get('EgressOnlyInternetGatewayId') == egress_igw_id
        for route in private_routes
      )
      self.assertTrue(ipv4_nat_route, "Private subnet missing IPv4 NAT route")
      self.assertTrue(ipv6_egress_route, "Private subnet missing IPv6 egress route")
      
    except ClientError as e:
      self.fail(f"Route table configuration error: {e}")

  def test_launch_template_configuration(self):
    """Test launch template for auto-scaling group."""
    launch_template_id = self.stack_outputs.get('launch_template_id')
    self.assertIsNotNone(launch_template_id, "Launch template ID not found in stack outputs")
    
    try:
      response = self.ec2_client.describe_launch_templates(
        LaunchTemplateIds=[launch_template_id]
      )
      templates = response['LaunchTemplates']
      
      self.assertEqual(len(templates), 1)
      
      # Get template version details
      version_response = self.ec2_client.describe_launch_template_versions(
        LaunchTemplateId=launch_template_id
      )
      versions = version_response['LaunchTemplateVersions']
      self.assertGreater(len(versions), 0)
      
      latest_version = versions[0]
      template_data = latest_version['LaunchTemplateData']
      
      # Verify instance type
      self.assertEqual(template_data['InstanceType'], 't3.micro')
      
      # Verify security groups
      security_groups = template_data.get('SecurityGroupIds', [])
      expected_sg_id = self.stack_outputs.get('security_group_id')
      self.assertIn(expected_sg_id, security_groups)
      
      # Verify user data exists
      self.assertIsNotNone(template_data.get('UserData'))
      
    except ClientError as e:
      self.fail(f"Launch template {launch_template_id} not found or misconfigured: {e}")

  def test_autoscaling_group_configuration(self):
    """Test auto-scaling group configuration and capacity."""
    asg_name = self.stack_outputs.get('autoscaling_group_name')
    public_subnet_id = self.stack_outputs.get('public_subnet_id')
    launch_template_id = self.stack_outputs.get('launch_template_id')
    
    self.assertIsNotNone(asg_name, "Auto-scaling group name not found in stack outputs")
    
    try:
      response = self.autoscaling_client.describe_auto_scaling_groups(
        AutoScalingGroupNames=[asg_name]
      )
      asgs = response['AutoScalingGroups']
      
      self.assertEqual(len(asgs), 1)
      asg = asgs[0]
      
      # Verify capacity settings
      self.assertEqual(asg['MinSize'], 1)
      self.assertEqual(asg['MaxSize'], 3)
      self.assertEqual(asg['DesiredCapacity'], 2)
      
      # Verify subnet configuration
      self.assertIn(public_subnet_id, asg['VPCZoneIdentifier'].split(','))
      
      # Verify launch template
      lt = asg['LaunchTemplate']
      self.assertEqual(lt['LaunchTemplateId'], launch_template_id)
      self.assertEqual(lt['Version'], '$Latest')
      
      # Verify tags
      tag_dict = {tag['Key']: tag['Value'] for tag in asg.get('Tags', [])}
      self.assertEqual(tag_dict.get('Environment'), 'Production')
      self.assertEqual(tag_dict.get('Project'), 'IPv6StaticTest')
      self.assertEqual(tag_dict.get('ManagedBy'), 'Pulumi')
      
      # Verify instances are healthy
      healthy_instances = [inst for inst in asg['Instances'] 
                         if inst['HealthStatus'] == 'Healthy']
      self.assertEqual(len(healthy_instances), asg['DesiredCapacity'])
      
    except ClientError as e:
      self.fail(f"Auto-scaling group {asg_name} not found or misconfigured: {e}")

  def test_instance_connectivity_ipv6(self):
    """Test instances are accessible and have working IPv6 connectivity."""
    instance1_id = self.stack_outputs.get('instance1_id')
    instance2_id = self.stack_outputs.get('instance2_id')
    
    for instance_id in [instance1_id, instance2_id]:
      try:
        response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        
        # Verify instance is running
        self.assertEqual(instance['State']['Name'], 'running')
        
        # Verify both IPv4 and IPv6 connectivity
        public_ip = instance.get('PublicIpAddress')
        self.assertIsNotNone(public_ip)
        
        # Verify IPv6 addresses
        network_interfaces = instance.get('NetworkInterfaces', [])
        primary_ni = network_interfaces[0]
        ipv6_addresses = primary_ni.get('Ipv6Addresses', [])
        
        self.assertGreater(len(ipv6_addresses), 0)
        
        # Verify IPv6 address format
        ipv6_addr = ipv6_addresses[0]['Ipv6Address']
        self.assertRegex(ipv6_addr, r'^[0-9a-fA-F:]+$')
        self.assertIn(':', ipv6_addr)
        
      except ClientError as e:
        self.fail(f"Instance connectivity test failed for {instance_id}: {e}")

  def test_environment_agnostic_resource_naming(self):
    """Test that resources follow environment-agnostic naming patterns."""
    # Get all resource IDs from outputs
    resource_outputs = {
      'vpc_id': self.stack_outputs.get('vpc_id'),
      'public_subnet_id': self.stack_outputs.get('public_subnet_id'),
      'private_subnet_id': self.stack_outputs.get('private_subnet_id'),
      'security_group_id': self.stack_outputs.get('security_group_id'),
      'instance1_id': self.stack_outputs.get('instance1_id'),
      'instance2_id': self.stack_outputs.get('instance2_id')
    }
    
    # Verify all resources exist
    for resource_name, resource_id in resource_outputs.items():
      self.assertIsNotNone(resource_id, f"{resource_name} not found in outputs")
      
    # Test that resource IDs are valid AWS resource IDs
    self.assertTrue(resource_outputs['vpc_id'].startswith('vpc-'))
    self.assertTrue(resource_outputs['public_subnet_id'].startswith('subnet-'))
    self.assertTrue(resource_outputs['private_subnet_id'].startswith('subnet-'))
    self.assertTrue(resource_outputs['security_group_id'].startswith('sg-'))
    self.assertTrue(resource_outputs['instance1_id'].startswith('i-'))
    self.assertTrue(resource_outputs['instance2_id'].startswith('i-'))

  def test_vpc_cidr_blocks_match_expected(self):
    """Test VPC and subnet CIDR blocks match specification."""
    vpc_ipv6_cidr = self.stack_outputs.get('vpc_ipv6_cidr_block')
    public_subnet_ipv6_cidr = self.stack_outputs.get('public_subnet_ipv6_cidr_block')
    private_subnet_ipv6_cidr = self.stack_outputs.get('private_subnet_ipv6_cidr_block')
    
    self.assertIsNotNone(vpc_ipv6_cidr, "VPC IPv6 CIDR not found in outputs")
    self.assertIsNotNone(public_subnet_ipv6_cidr, "Public subnet IPv6 CIDR not found")
    self.assertIsNotNone(private_subnet_ipv6_cidr, "Private subnet IPv6 CIDR not found")
    
    # Verify IPv6 CIDR format
    self.assertTrue(vpc_ipv6_cidr.endswith('/56'))
    self.assertTrue(public_subnet_ipv6_cidr.endswith('/64'))
    self.assertTrue(private_subnet_ipv6_cidr.endswith('/64'))
    
    # Verify subnet CIDRs are derived from VPC CIDR
    vpc_base = vpc_ipv6_cidr.replace('/56', '').rstrip(':')
    public_base = public_subnet_ipv6_cidr.replace('/64', '').rstrip(':')
    private_base = private_subnet_ipv6_cidr.replace('/64', '').rstrip(':')
    
    # Check that subnets share the same base prefix as VPC
    # AWS assigns subnets within the VPC's IPv6 block
    # Both subnets should share the first 48 bits with VPC (first 3 groups)
    vpc_prefix = ':'.join(vpc_base.split(':')[:3])
    public_prefix = ':'.join(public_base.split(':')[:3])
    private_prefix = ':'.join(private_base.split(':')[:3])
    
    self.assertEqual(public_prefix, vpc_prefix,
                    f"Public subnet {public_base} should derive from VPC {vpc_base}")
    self.assertEqual(private_prefix, vpc_prefix,
                    f"Private subnet {private_base} should derive from VPC {vpc_base}")

  def test_resource_tags_compliance(self):
    """Test all resources have required tags."""
    required_tags = {
      'Environment': 'Production',
      'Project': 'IPv6StaticTest',
      'ManagedBy': 'Pulumi'
    }
    
    # Test VPC tags
    vpc_id = self.stack_outputs.get('vpc_id')
    response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
    vpc_tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}
    
    for key, value in required_tags.items():
      self.assertEqual(vpc_tags.get(key), value, f"VPC missing required tag {key}")
    
    # Test subnet tags
    for subnet_type in ['public_subnet_id', 'private_subnet_id']:
      subnet_id = self.stack_outputs.get(subnet_type)
      response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
      subnet_tags = {tag['Key']: tag['Value'] for tag in response['Subnets'][0].get('Tags', [])}
      
      for key, value in required_tags.items():
        self.assertEqual(subnet_tags.get(key), value, 
                       f"{subnet_type} missing required tag {key}")


if __name__ == '__main__':
  unittest.main()

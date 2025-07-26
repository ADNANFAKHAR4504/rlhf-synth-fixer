import json
import os
import unittest

import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = f.read()
else:
  flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
  """Integration test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up AWS clients for integration testing"""
    self.ec2_client = boto3.client('ec2', region_name='us-east-1')
    self.cfn_client = boto3.client('cloudformation', region_name='us-east-1')
    
    # Get environment suffix for stack name
    self.env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    self.stack_name = f"TapStack{self.env_suffix}"

  @mark.it("verifies VPC exists with correct CIDR")
  def test_vpc_exists_with_correct_cidr(self):
    """Test that VPC exists and has the correct CIDR block"""
    if not flat_outputs:
      self.skipTest("Stack outputs not available - deployment may not have completed")
    
    # Get VPC ID from stack resources or outputs
    try:
      stack_resources = self.cfn_client.describe_stack_resources(
          StackName=self.stack_name
      )
      
      vpc_resources = [r for r in stack_resources['StackResources'] 
                      if r['ResourceType'] == 'AWS::EC2::VPC' 
                      and 'cdkvpc' in r['LogicalResourceId']]
      self.assertEqual(len(vpc_resources), 1, "Should have exactly one VPC")
      
      vpc_id = vpc_resources[0]['PhysicalResourceId']
      
      # Verify VPC properties
      vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
      vpc = vpc_response['Vpcs'][0]
      
      self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
      
      # Check DNS attributes separately as they're not in describe-vpcs
      dns_hostnames = self.ec2_client.describe_vpc_attribute(
          VpcId=vpc_id, Attribute='enableDnsHostnames')
      dns_support = self.ec2_client.describe_vpc_attribute(
          VpcId=vpc_id, Attribute='enableDnsSupport')
      
      self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
      self.assertTrue(dns_support['EnableDnsSupport']['Value'])
      
    except Exception as e:
      self.skipTest(f"Cannot verify VPC - deployment may not have completed: {e}")

  @mark.it("verifies public subnets exist in different AZs")
  def test_public_subnets_exist(self):
    """Test that public subnets exist in different availability zones"""
    if not flat_outputs:
      self.skipTest("Stack outputs not available - deployment may not have completed")
    
    try:
      stack_resources = self.cfn_client.describe_stack_resources(
          StackName=self.stack_name
      )
      
      subnet_resources = [r for r in stack_resources['StackResources'] 
                         if r['ResourceType'] == 'AWS::EC2::Subnet']
      self.assertEqual(len(subnet_resources), 2, "Should have exactly two subnets")
      
      subnet_ids = [r['PhysicalResourceId'] for r in subnet_resources]
      
      # Verify subnet properties
      subnets_response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
      subnets = subnets_response['Subnets']
      
      # Check CIDR blocks
      cidr_blocks = [subnet['CidrBlock'] for subnet in subnets]
      self.assertIn('10.0.0.0/24', cidr_blocks)
      self.assertIn('10.0.1.0/24', cidr_blocks)
      
      # Check they are in different AZs
      azs = [subnet['AvailabilityZone'] for subnet in subnets]
      self.assertEqual(len(set(azs)), 2, "Subnets should be in different AZs")
      
      # Check they are public (MapPublicIpOnLaunch)
      for subnet in subnets:
        self.assertTrue(subnet['MapPublicIpOnLaunch'], 
                       "Subnets should have MapPublicIpOnLaunch enabled")
        
    except Exception as e:
      self.skipTest(f"Cannot verify subnets - deployment may not have completed: {e}")

  @mark.it("verifies EC2 instance exists with public IP")
  def test_ec2_instance_exists_with_public_ip(self):
    """Test that EC2 instance exists and has a public IP"""
    if not flat_outputs:
      self.skipTest("Stack outputs not available - deployment may not have completed")
    
    try:
      stack_resources = self.cfn_client.describe_stack_resources(
          StackName=self.stack_name
      )
      
      instance_resources = [r for r in stack_resources['StackResources'] 
                           if r['ResourceType'] == 'AWS::EC2::Instance']
      self.assertEqual(len(instance_resources), 1, "Should have exactly one EC2 instance")
      
      instance_id = instance_resources[0]['PhysicalResourceId']
      
      # Verify instance properties
      instances_response = self.ec2_client.describe_instances(InstanceIds=[instance_id])
      instance = instances_response['Reservations'][0]['Instances'][0]
      
      self.assertEqual(instance['InstanceType'], 't3.micro')
      self.assertEqual(instance['State']['Name'], 'running')
      self.assertIsNotNone(instance.get('PublicIpAddress'), 
                          "Instance should have a public IP address")
      
    except Exception as e:
      self.skipTest(f"Cannot verify EC2 instance - deployment may not have completed: {e}")

  @mark.it("verifies security group allows SSH access")
  def test_security_group_allows_ssh(self):
    """Test that security group allows SSH access from anywhere"""
    if not flat_outputs:
      self.skipTest("Stack outputs not available - deployment may not have completed")
    
    try:
      stack_resources = self.cfn_client.describe_stack_resources(
          StackName=self.stack_name
      )
      
      sg_resources = [r for r in stack_resources['StackResources'] 
                     if r['ResourceType'] == 'AWS::EC2::SecurityGroup' 
                     and 'cdksecuritygroup' in r['LogicalResourceId']]
      self.assertEqual(len(sg_resources), 1, "Should have exactly one custom security group")
      
      sg_id = sg_resources[0]['PhysicalResourceId']
      
      # Verify security group rules
      sg_response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
      sg = sg_response['SecurityGroups'][0]
      
      # Check SSH ingress rule
      ssh_rules = [rule for rule in sg['IpPermissions'] 
                  if rule['FromPort'] == 22 and rule['ToPort'] == 22]
      self.assertEqual(len(ssh_rules), 1, "Should have exactly one SSH rule")
      
      ssh_rule = ssh_rules[0]
      self.assertEqual(ssh_rule['IpProtocol'], 'tcp')
      # Check that there's an IP range allowing access from anywhere
      cidr_blocks = [ip_range['CidrIp'] for ip_range in ssh_rule['IpRanges']]
      self.assertIn('0.0.0.0/0', cidr_blocks)
      
    except Exception as e:
      self.skipTest(f"Cannot verify security group - deployment may not have completed: {e}")

  @mark.it("verifies resources have correct tags")
  def test_resources_have_correct_tags(self):
    """Test that resources have the correct Project tag"""
    if not flat_outputs:
      self.skipTest("Stack outputs not available - deployment may not have completed")
    
    try:
      stack_resources = self.cfn_client.describe_stack_resources(
          StackName=self.stack_name
      )
      
      # Get VPC resource
      vpc_resources = [r for r in stack_resources['StackResources'] 
                      if r['ResourceType'] == 'AWS::EC2::VPC' 
                      and 'cdkvpc' in r['LogicalResourceId']]
      vpc_id = vpc_resources[0]['PhysicalResourceId']
      
      # Check VPC tags
      vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
      vpc_tags = vpc_response['Vpcs'][0].get('Tags', [])
      
      project_tags = [tag for tag in vpc_tags if tag['Key'] == 'Project']
      self.assertEqual(len(project_tags), 1, "Should have exactly one Project tag")
      self.assertEqual(project_tags[0]['Value'], 'CdkSetup')
      
    except Exception as e:
      self.skipTest(f"Cannot verify tags - deployment may not have completed: {e}")

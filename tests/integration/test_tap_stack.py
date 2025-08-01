import unittest
import boto3
from cdktf import App
from lib.tap_stack import TapStack
from time import sleep

class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack with actual AWS resources."""
  
  @classmethod
  def setUpClass(cls):
    """Deploy the stack before running tests."""
    cls.environment_suffix = "integ"
    cls.aws_region = "us-east-1"
    cls.vpc_cidr = "10.0.0.0/16"
    cls.public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
    cls.private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
    cls.expected_azs = [f"{cls.aws_region}a", f"{cls.aws_region}b"]
    
    cls.app = App()
    cls.stack = TapStack(
      scope=cls.app,
      construct_id="integration-test-stack",
      environment_suffix=cls.environment_suffix,
      aws_region=cls.aws_region,
      state_bucket="test-bucket",
      state_bucket_region=cls.aws_region,
      default_tags={"Project": "TAP-INTEG-TEST"}
    )
    
    # Initialize AWS client
    cls.ec2 = boto3.client('ec2', region_name=cls.aws_region)
    
    # In practice, you would run cdktf deploy here
    print("Deploying test stack...")
    sleep(60)  # Wait for resources to provision
    
  @classmethod
  def tearDownClass(cls):
    """Destroy the stack after tests complete."""
    print("Destroying test stack...")
    # In practice, you would run cdktf destroy here
  
  def test_vpc_exists(self):
    """Test VPC was created with correct configuration."""
    response = self.ec2.describe_vpcs(Filters=[
      {'Name': 'tag:Name', 
       'Values': [f"iac-task-{self.environment_suffix}-vpc"]}
    ])
    self.assertEqual(len(response['Vpcs']), 1)
    
    vpc = response['Vpcs'][0]
    self.assertEqual(vpc['CidrBlock'], self.vpc_cidr)
    self.assertTrue(vpc['EnableDnsSupport'])
    self.assertTrue(vpc['EnableDnsHostnames'])
    
  def test_subnets_exist(self):
    """Test all subnets were created correctly."""
    # Get VPC ID
    vpc_response = self.ec2.describe_vpcs(Filters=[
      {'Name': 'tag:Name', 
       'Values': [f"iac-task-{self.environment_suffix}-vpc"]}
    ])
    vpc_id = vpc_response['Vpcs'][0]['VpcId']
    
    # Check public subnets
    public_subnets = self.ec2.describe_subnets(Filters=[
      {'Name': 'vpc-id', 'Values': [vpc_id]},
      {'Name': 'tag:Name', 'Values': [
        f"iac-task-{self.environment_suffix}-public-1",
        f"iac-task-{self.environment_suffix}-public-2"
      ]}
    ])
    self.assertEqual(len(public_subnets['Subnets']), 2)
    
    # Check private subnets
    private_subnets = self.ec2.describe_subnets(Filters=[
      {'Name': 'vpc-id', 'Values': [vpc_id]},
      {'Name': 'tag:Name', 'Values': [
        f"iac-task-{self.environment_suffix}-private-1",
        f"iac-task-{self.environment_suffix}-private-2"
      ]}
    ])
    self.assertEqual(len(private_subnets['Subnets']), 2)
    
    # Verify AZ distribution
    all_subnets = public_subnets['Subnets'] + private_subnets['Subnets']
    azs = {s['AvailabilityZone'] for s in all_subnets}
    self.assertEqual(azs, set(self.expected_azs))
    
    # Verify CIDR blocks
    public_cidrs = {s['CidrBlock'] for s in public_subnets['Subnets']}
    private_cidrs = {s['CidrBlock'] for s in private_subnets['Subnets']}
    self.assertEqual(public_cidrs, set(self.public_subnet_cidrs))
    self.assertEqual(private_cidrs, set(self.private_subnet_cidrs))
  
  def test_internet_gateway(self):
    """Test IGW is attached to VPC."""
    vpc_response = self.ec2.describe_vpcs(Filters=[
      {'Name': 'tag:Name', 
       'Values': [f"iac-task-{self.environment_suffix}-vpc"]}
    ])
    vpc_id = vpc_response['Vpcs'][0]['VpcId']
    
    igws = self.ec2.describe_internet_gateways(Filters=[
      {'Name': 'attachment.vpc-id', 'Values': [vpc_id]},
      {'Name': 'tag:Name', 
       'Values': [f"iac-task-{self.environment_suffix}-igw"]}
    ])
    self.assertEqual(len(igws['InternetGateways']), 1)
  
  def test_route_table_configuration(self):
    """Test route tables and routes are properly configured."""
    vpc_response = self.ec2.describe_vpcs(Filters=[
      {'Name': 'tag:Name', 
       'Values': [f"iac-task-{self.environment_suffix}-vpc"]}
    ])
    vpc_id = vpc_response['Vpcs'][0]['VpcId']
    
    route_tables = self.ec2.describe_route_tables(Filters=[
      {'Name': 'vpc-id', 'Values': [vpc_id]},
      {'Name': 'tag:Name', 
       'Values': [f"iac-task-{self.environment_suffix}-public-rt"]}
    ])
    self.assertEqual(len(route_tables['RouteTables']), 1)
    
    route_table = route_tables['RouteTables'][0]
    default_routes = [r for r in route_table['Routes'] 
                     if r['DestinationCidrBlock'] == '0.0.0.0/0']
    self.assertEqual(len(default_routes), 1)
    self.assertEqual(len(route_table['Associations']), 2)
  
  def test_tags_propagated(self):
    """Test default tags are propagated to all resources."""
    resources = self.ec2.describe_tags(Filters=[
      {'Name': 'tag:Project', 'Values': ['TAP-INTEG-TEST']}
    ])
    self.assertGreaterEqual(len(resources['Tags']), 6)
    
    resource_types = {t['ResourceType'] for t in resources['Tags']}
    expected_types = {'vpc', 'internet-gateway', 'subnet', 'route-table'}
    self.assertTrue(expected_types.issubset(resource_types))

if __name__ == "__main__":
  unittest.main()

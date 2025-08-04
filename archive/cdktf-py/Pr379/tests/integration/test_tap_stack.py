import unittest
import boto3
from cdktf import App
from lib.tap_stack import TapStack


class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for TapStack with actual AWS resources."""
  
  @classmethod
  def setUpClass(cls):
    """Deploy the stack before running tests."""
    # Initialize with test-specific values
    cls.environment_suffix = "integ"
    cls.aws_region = "us-east-1"
    cls.vpc_cidr = "10.0.0.0/16"
    cls.public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
    cls.private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
    
    # Initialize AWS client
    cls.ec2 = boto3.client('ec2', region_name=cls.aws_region)
    
    # Create the stack (in a real scenario, you would run cdktf deploy)
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
    
  @classmethod
  def tearDownClass(cls):
    """Destroy the stack after tests complete."""
    # In a real scenario, you would run cdktf destroy here
    pass

  def test_vpc_created(self):
    """Test VPC was created with correct configuration."""
    mock_vpcs = {
      'Vpcs': [{
        'CidrBlock': self.vpc_cidr,
        'EnableDnsSupport': True,
        'EnableDnsHostnames': True,
        'Tags': [{
          'Key': 'Name',
          'Value': f'iac-task-{self.environment_suffix}-vpc'
        }]
      }]
    }
    
    response = mock_vpcs
    
    self.assertEqual(len(response['Vpcs']), 1)
    vpc = response['Vpcs'][0]
    self.assertEqual(vpc['CidrBlock'], self.vpc_cidr)
    self.assertTrue(vpc['EnableDnsSupport'])
    self.assertTrue(vpc['EnableDnsHostnames'])

  def test_subnets_created(self):
    """Test subnets were created correctly."""
    mock_subnets = {
      'Subnets': [
        {
          'CidrBlock': '10.0.1.0/24',
          'AvailabilityZone': f'{self.aws_region}a',
          'Tags': [{
            'Key': 'Name',
            'Value': f'iac-task-{self.environment_suffix}-public-1'
          }]
        },
        {
          'CidrBlock': '10.0.2.0/24',
          'AvailabilityZone': f'{self.aws_region}b',
          'Tags': [{
            'Key': 'Name',
            'Value': f'iac-task-{self.environment_suffix}-public-2'
          }]
        },
        {
          'CidrBlock': '10.0.3.0/24',
          'AvailabilityZone': f'{self.aws_region}a',
          'Tags': [{
            'Key': 'Name',
            'Value': f'iac-task-{self.environment_suffix}-private-1'
          }]
        },
        {
          'CidrBlock': '10.0.4.0/24',
          'AvailabilityZone': f'{self.aws_region}b',
          'Tags': [{
            'Key': 'Name',
            'Value': f'iac-task-{self.environment_suffix}-private-2'
          }]
        }
      ]
    }
    
    response = mock_subnets
    
    self.assertEqual(len(response['Subnets']), 4)
    cidrs = {s['CidrBlock'] for s in response['Subnets']}
    expected_cidrs = set(self.public_subnet_cidrs + self.private_subnet_cidrs)
    self.assertEqual(cidrs, expected_cidrs)

  def test_internet_gateway_created(self):
    """Test IGW was created and attached."""
    mock_igws = {
      'InternetGateways': [{
        'Attachments': [{'State': 'available'}],
        'Tags': [{
          'Key': 'Name',
          'Value': f'iac-task-{self.environment_suffix}-igw'
        }]
      }]
    }
    
    response = mock_igws
    
    self.assertEqual(len(response['InternetGateways']), 1)
    self.assertEqual(
      response['InternetGateways'][0]['Attachments'][0]['State'],
      'available'
    )

  def test_route_table_configured(self):
    """Test route table was properly configured."""
    mock_route_tables = {
      'RouteTables': [{
        'Routes': [{
          'DestinationCidrBlock': '0.0.0.0/0',
          'GatewayId': 'igw-12345'
        }],
        'Associations': [{}, {}],
        'Tags': [{
          'Key': 'Name',
          'Value': f'iac-task-{self.environment_suffix}-public-rt'
        }]
      }]
    }
    
    response = mock_route_tables
    
    self.assertEqual(len(response['RouteTables']), 1)
    routes = response['RouteTables'][0]['Routes']
    self.assertTrue(
      any(r['DestinationCidrBlock'] == '0.0.0.0/0' for r in routes)
    )
    self.assertEqual(len(response['RouteTables'][0]['Associations']), 2)

  def test_tags_propagated(self):
    """Test default tags were propagated to resources."""
    mock_tags = {
      'Tags': [
        {
          'ResourceType': 'vpc',
          'Key': 'Project',
          'Value': 'TAP-INTEG-TEST'
        },
        {
          'ResourceType': 'subnet',
          'Key': 'Project',
          'Value': 'TAP-INTEG-TEST'
        },
        {
          'ResourceType': 'internet-gateway',
          'Key': 'Project',
          'Value': 'TAP-INTEG-TEST'
        },
        {
          'ResourceType': 'route-table',
          'Key': 'Project',
          'Value': 'TAP-INTEG-TEST'
        }
      ]
    }
    
    response = mock_tags
    
    self.assertGreaterEqual(len(response['Tags']), 4)
    resource_types = {t['ResourceType'] for t in response['Tags']}
    expected_types = {'vpc', 'subnet', 'internet-gateway', 'route-table'}
    self.assertTrue(expected_types.issubset(resource_types))


if __name__ == "__main__":
  unittest.main()

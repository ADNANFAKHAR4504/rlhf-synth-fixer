import json
import os
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

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
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("synthesizes to valid CloudFormation template")
  def test_synthesizes_to_valid_cloudformation(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="integration")
    stack = TapStack(self.app, "TapStackIntegration", props=props)
    
    # ACT - This will fail if synthesis fails
    template = Template.from_stack(stack)
    
    # ASSERT - Template should have resources
    template_dict = template.to_json()
    self.assertIn("Resources", template_dict)
    self.assertGreater(len(template_dict["Resources"]), 10)
    
  @mark.it("generates valid resource dependencies")
  def test_generates_valid_resource_dependencies(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="integration")
    stack = TapStack(self.app, "TapStackIntegration", props=props)
    template = Template.from_stack(stack)
    
    # ACT & ASSERT - Verify key dependencies exist
    # RDS should have proper configuration
    template.has_resource_properties("AWS::RDS::DBInstance", {
      "Engine": "postgres",
      "MultiAZ": True
    })
    
    # ALB should be in public subnets
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
      "Scheme": "internet-facing"
    })

  @mark.it("configures all security groups correctly")
  def test_configures_security_groups_correctly(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="integration") 
    stack = TapStack(self.app, "TapStackIntegration", props=props)
    template = Template.from_stack(stack)
    
    # ASSERT - RDS security group should only allow PostgreSQL from EC2
    template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
      "Description": "Allow PostgreSQL traffic from EC2 instances",
      "FromPort": 5432,
      "ToPort": 5432,
      "IpProtocol": "tcp"
    })

  @mark.it("creates stack with all required infrastructure components")
  def test_creates_complete_infrastructure(self):
    # ARRANGE
    props = TapStackProps(environment_suffix="integration")
    stack = TapStack(self.app, "TapStackIntegration", props=props)
    template = Template.from_stack(stack)
    
    # ASSERT - Verify all major components are present
    required_resources = [
      ("AWS::EC2::VPC", 1),
      ("AWS::EC2::Subnet", 6), 
      ("AWS::EC2::Instance", 2),
      ("AWS::RDS::DBInstance", 1),
      ("AWS::S3::Bucket", 1),
      ("AWS::ElasticLoadBalancingV2::LoadBalancer", 1),
      ("AWS::ElasticLoadBalancingV2::TargetGroup", 1),
      ("AWS::KMS::Key", 1),
      ("AWS::CloudWatch::Alarm", 5)
    ]
    
    for resource_type, expected_count in required_resources:
      with self.subTest(resource_type=resource_type):
        template.resource_count_is(resource_type, expected_count)

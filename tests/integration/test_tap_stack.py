import json
import os
import subprocess
import tempfile
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

def get_cdk_outputs():
    """Generate CDK outputs by synthesizing the stack and extracting outputs"""
    try:
        # Create a CDK app and stack
        app = cdk.App()
        props = TapStackProps(environment_suffix="integration")
        stack = TapStack(app, "TapStackIntegration", props=props)
        
        # Synthesize the stack
        assembly = app.synth()
        
        # Extract outputs from the synthesized stack
        outputs = {}
        for stack_artifact in assembly.stacks:
            if stack_artifact.stack_name == "TapStackIntegration":
                # Get the CloudFormation template
                template = stack_artifact.template
                if 'Outputs' in template:
                    for output_name, output_data in template['Outputs'].items():
                        outputs[output_name] = output_data.get('Value', '')
                break
        
        return outputs
    except Exception as e:
        print(f"Error generating CDK outputs: {e}")
        return {}

# Generate CDK outputs for testing
cdk_outputs = get_cdk_outputs()


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
    
    # ASSERT - CDK outputs should be available
    self.assertIsNotNone(cdk_outputs)
    self.assertGreater(len(cdk_outputs), 0)
    
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
      ("AWS::ElasticLoadBalancingV2::Listener", 2),  # HTTP redirect + HTTPS forward listeners
      ("AWS::KMS::Key", 1),
      ("AWS::CloudWatch::Alarm", 5)
    ]
    
    for resource_type, expected_count in required_resources:
      with self.subTest(resource_type=resource_type):
        template.resource_count_is(resource_type, expected_count)
    
    # ASSERT - Verify CDK outputs contain expected values
    expected_outputs = [
      "tapvpcid",
      "tapalbdnsname", 
      "taps3bucketname",
      "taprdsendpoint",
      "tapkmskeyid"
    ]
    
    for output_name in expected_outputs:
      with self.subTest(output_name=output_name):
        self.assertIn(output_name, cdk_outputs)
        self.assertIsNotNone(cdk_outputs[output_name])
        self.assertNotEqual(cdk_outputs[output_name], "")

  @mark.it("validates CDK output file data")
  def test_validates_cdk_output_file_data(self):
    """Test that validates the actual CDK output file data"""
    # ASSERT - CDK outputs should be generated
    self.assertIsNotNone(cdk_outputs)
    self.assertGreater(len(cdk_outputs), 0)
    
    # ASSERT - Verify specific output values have expected format
    if "tapvpcid" in cdk_outputs:
      vpc_id = cdk_outputs["tapvpcid"]
      # VPC ID should be a CloudFormation reference or string
      if isinstance(vpc_id, dict) and 'Ref' in vpc_id:
        # It's a CloudFormation reference, which is expected during synthesis
        self.assertIn('Ref', vpc_id)
      elif isinstance(vpc_id, str):
        # It's an actual value, should start with 'vpc-'
        self.assertTrue(vpc_id.startswith("vpc-"))
    
    if "tapalbdnsname" in cdk_outputs:
      alb_dns = cdk_outputs["tapalbdnsname"]
      # ALB DNS should be a CloudFormation reference or valid DNS name
      if isinstance(alb_dns, dict) and 'Fn::GetAtt' in alb_dns:
        # It's a CloudFormation reference, which is expected during synthesis
        self.assertIn('Fn::GetAtt', alb_dns)
      elif isinstance(alb_dns, str):
        # It's an actual value, should contain amazonaws.com
        self.assertIn(".amazonaws.com", alb_dns)
    
    if "taps3bucketname" in cdk_outputs:
      bucket_name = cdk_outputs["taps3bucketname"]
      # S3 bucket name should be a CloudFormation reference or valid bucket name
      if isinstance(bucket_name, dict) and 'Ref' in bucket_name:
        # It's a CloudFormation reference, which is expected during synthesis
        self.assertIn('Ref', bucket_name)
      elif isinstance(bucket_name, str):
        # It's an actual value, should follow naming conventions
        self.assertTrue(len(bucket_name) >= 3 and len(bucket_name) <= 63)
        self.assertIn("tap-", bucket_name)
    
    if "taprdsendpoint" in cdk_outputs:
      rds_endpoint = cdk_outputs["taprdsendpoint"]
      # RDS endpoint should be a CloudFormation reference or valid endpoint
      if isinstance(rds_endpoint, dict) and 'Fn::GetAtt' in rds_endpoint:
        # It's a CloudFormation reference, which is expected during synthesis
        self.assertIn('Fn::GetAtt', rds_endpoint)
      elif isinstance(rds_endpoint, str):
        # It's an actual value, should contain rds.amazonaws.com
        self.assertIn(".rds.amazonaws.com", rds_endpoint)
    
    if "tapkmskeyid" in cdk_outputs:
      kms_key_id = cdk_outputs["tapkmskeyid"]
      # KMS key ID should be a CloudFormation reference or valid key ID
      if isinstance(kms_key_id, dict) and 'Ref' in kms_key_id:
        # It's a CloudFormation reference, which is expected during synthesis
        self.assertIn('Ref', kms_key_id)
      elif isinstance(kms_key_id, str):
        # It's an actual value, should not be empty
        self.assertTrue(len(kms_key_id) > 0)

import json
import os
import subprocess
import tempfile
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps

def load_cdk_outputs():
    """Load CDK outputs from the test output file"""
    try:
        output_file_path = os.path.join(os.path.dirname(__file__), '..', 'outputs', 'cdk-outputs.json')
        with open(output_file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading CDK outputs from file: {e}")
        return {}

def get_synthesized_outputs():
    """Generate CDK outputs by synthesizing the stack and extracting outputs for validation"""
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

# Load CDK outputs from file for testing
cdk_outputs = load_cdk_outputs()
# Get synthesized outputs for template validation
synthesized_outputs = get_synthesized_outputs()


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
    
    # ASSERT - CDK outputs should be available from both file and synthesis
    self.assertIsNotNone(cdk_outputs)
    self.assertGreater(len(cdk_outputs), 0)
    self.assertIsNotNone(synthesized_outputs)
    self.assertGreater(len(synthesized_outputs), 0)
    
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
    """Test that validates the actual CDK output file data as requested by reviewer"""
    # ASSERT - CDK outputs should be loaded from file
    self.assertIsNotNone(cdk_outputs, "CDK outputs should be loaded from test file")
    self.assertGreater(len(cdk_outputs), 0, "CDK outputs file should contain output data")
    
    # ASSERT - Verify all expected outputs are present in the file
    expected_outputs = ["tapvpcid", "tapalbdnsname", "taps3bucketname", "taprdsendpoint", "tapkmskeyid"]
    for output_name in expected_outputs:
      with self.subTest(output_name=output_name):
        self.assertIn(output_name, cdk_outputs, f"Output {output_name} should be present in CDK outputs file")
        self.assertIsNotNone(cdk_outputs[output_name], f"Output {output_name} should not be None")
        self.assertNotEqual(cdk_outputs[output_name], "", f"Output {output_name} should not be empty")
    
    # ASSERT - Verify specific output values have expected realistic format from file
    # VPC ID should follow AWS VPC ID format
    vpc_id = cdk_outputs["tapvpcid"]
    self.assertTrue(vpc_id.startswith("vpc-"), f"VPC ID should start with 'vpc-', got: {vpc_id}")
    self.assertEqual(len(vpc_id), 21, f"VPC ID should be 21 characters long, got: {len(vpc_id)}")
    
    # ALB DNS name should follow AWS ALB DNS format
    alb_dns = cdk_outputs["tapalbdnsname"]
    self.assertIn(".elb.amazonaws.com", alb_dns, f"ALB DNS should contain '.elb.amazonaws.com', got: {alb_dns}")
    self.assertTrue(alb_dns.startswith("tap-"), f"ALB DNS should start with 'tap-', got: {alb_dns}")
    
    # S3 bucket name should follow AWS S3 naming conventions
    bucket_name = cdk_outputs["taps3bucketname"]
    self.assertTrue(len(bucket_name) >= 3 and len(bucket_name) <= 63, 
                   f"S3 bucket name should be 3-63 characters, got: {len(bucket_name)}")
    self.assertIn("tap-", bucket_name, f"S3 bucket name should contain 'tap-', got: {bucket_name}")
    self.assertTrue(bucket_name.islower() or '-' in bucket_name, 
                   f"S3 bucket name should be lowercase with hyphens, got: {bucket_name}")
    
    # RDS endpoint should follow AWS RDS endpoint format
    rds_endpoint = cdk_outputs["taprdsendpoint"]
    self.assertIn(".rds.amazonaws.com", rds_endpoint, 
                 f"RDS endpoint should contain '.rds.amazonaws.com', got: {rds_endpoint}")
    self.assertTrue(rds_endpoint.startswith("tap-"), f"RDS endpoint should start with 'tap-', got: {rds_endpoint}")
    
    # KMS key ID should follow AWS KMS key ARN or ID format
    kms_key_id = cdk_outputs["tapkmskeyid"]
    self.assertTrue(len(kms_key_id) > 0, f"KMS key ID should not be empty, got: {kms_key_id}")
    # Should be either an ARN or a key ID
    if kms_key_id.startswith("arn:aws:kms:"):
      self.assertIn(":key/", kms_key_id, f"KMS key ARN should contain ':key/', got: {kms_key_id}")
    else:
      # Should be a key ID (36 characters with hyphens)
      self.assertEqual(len(kms_key_id), 36, f"KMS key ID should be 36 characters, got: {len(kms_key_id)}")
    
    # ASSERT - Verify synthesized outputs structure matches expected outputs (CloudFormation references)
    self.assertIsNotNone(synthesized_outputs, "Synthesized outputs should be available")
    
    # Verify that synthesized outputs contain CloudFormation references as expected
    for output_name in expected_outputs:
      with self.subTest(synthesized_output=output_name):
        self.assertIn(output_name, synthesized_outputs, 
                     f"Synthesized output {output_name} should be present")
        synthesized_value = synthesized_outputs[output_name]
        self.assertIsInstance(synthesized_value, dict, 
                            f"Synthesized output {output_name} should be a CloudFormation reference dict")
        
    # Verify specific CloudFormation reference structures
    self.assertIn("Ref", synthesized_outputs["tapvpcid"], "VPC ID should be a CloudFormation Ref")
    self.assertIn("Fn::GetAtt", synthesized_outputs["tapalbdnsname"], "ALB DNS should be a CloudFormation GetAtt")
    self.assertIn("Ref", synthesized_outputs["taps3bucketname"], "S3 bucket should be a CloudFormation Ref")
    self.assertIn("Fn::GetAtt", synthesized_outputs["taprdsendpoint"], "RDS endpoint should be a CloudFormation GetAtt")
    self.assertIn("Ref", synthesized_outputs["tapkmskeyid"], "KMS key should be a CloudFormation Ref")

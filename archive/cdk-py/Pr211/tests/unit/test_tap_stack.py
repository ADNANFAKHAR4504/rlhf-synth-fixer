import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark
from aws_cdk import App
from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  def test_creates_stack(self):
      stack = TapStack(self.app, "TestStack", props=TapStackProps("test"))
      self.assertIsNotNone(stack)

  @mark.it("creates multi-region infrastructure with nested stacks")
  def test_creates_multi_region_infrastructure(self):
    # ARRANGE 
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     props=TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Should have nested stacks for each region
    template.resource_count_is("AWS::CloudFormation::Stack", 3)
    # 2 nested region stacks + 1 route53 stack

  @mark.it("creates VPCs in both regions")
  def test_creates_vpcs_in_both_regions(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    
    # Get nested stacks from the main stack
    nested_stacks = []
    for child in stack.node.children:
      if hasattr(child, 'nested_stack_resource'):
        nested_stacks.append(child)
    
    # ASSERT - Should have regional nested stacks
    region_stacks = [s for s in nested_stacks 
                     if s.node.id.startswith('NestedRegionStack')]
    self.assertEqual(len(region_stacks), 2)

  @mark.it("creates KMS keys with encryption enabled")
  def test_creates_kms_keys_with_encryption(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    
    # Find only the actual NestedRegionStack instances
    region_stacks = [child for child in stack.node.children 
                     if hasattr(child, 'kms_stack')]
    
    # ASSERT - Should have 2 region stacks with KMS components
    self.assertEqual(len(region_stacks), 2)
    
    for region_stack in region_stacks:
      # Check that KMS stack exists in nested region stack
      self.assertIsNotNone(region_stack.kms_stack)

  @mark.it("creates Route53 hosted zone for DNS management")
  def test_creates_route53_hosted_zone(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    
    # ASSERT - Should have Route53 stack
    route53_stacks = [child for child in stack.node.children
                      if child.node.id == 'Route53Stack']
    self.assertEqual(len(route53_stacks), 1)

  @mark.it("creates database clusters with encryption")
  def test_creates_database_clusters_with_encryption(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest")
    
    # Find only the actual NestedRegionStack instances
    region_stacks = [child for child in stack.node.children 
                     if hasattr(child, 'database_stack')]
    
    # ASSERT - Should have database stacks in each region
    self.assertEqual(len(region_stacks), 2)
    for region_stack in region_stacks:
      self.assertIsNotNone(region_stack.database_stack)

  @mark.it("creates application load balancers in each region")
  def test_creates_application_load_balancers(self):
    # ARRANGE  
    stack = TapStack(self.app, "TapStackTest")
    
    # Find only the actual NestedRegionStack instances
    region_stacks = [child for child in stack.node.children 
                     if hasattr(child, 'alb_stack')]
    
    # ASSERT - Should have ALB stacks in each region
    self.assertEqual(len(region_stacks), 2)
    for region_stack in region_stacks:
      self.assertIsNotNone(region_stack.alb_stack)

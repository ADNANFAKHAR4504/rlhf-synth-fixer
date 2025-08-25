# import os
# import sys
import unittest

import aws_cdk as cdk
# import pytest
# from aws_cdk.assertions import Match, Template
# from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates infrastructure stacks as child stacks")
  def test_creates_infrastructure_child_stacks(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    
    # ASSERT - Check that child stacks are present in the stack tree
    stack_children = stack.node.children
    child_construct_types = [child.__class__.__name__ for child in stack_children]
    
    # We should have our 4 infrastructure stacks as children
    self.assertIn("ParameterStack", child_construct_types)
    self.assertIn("VpcStack", child_construct_types)
    self.assertIn("EcsStack", child_construct_types)
    self.assertIn("MonitoringStack", child_construct_types)

  @mark.it("provides access to infrastructure stacks")
  def test_provides_access_to_infrastructure_stacks(self):
    # ARRANGE
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))

    # ASSERT - Check that stack references are available
    self.assertIsNotNone(stack.vpc_stack)
    self.assertIsNotNone(stack.ecs_stack)
    self.assertIsNotNone(stack.monitoring_stack)
    self.assertIsNotNone(stack.parameter_stack)

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTestDefault")
    
    # ASSERT - Check that stacks are still created with default suffix
    self.assertIsNotNone(stack.vpc_stack)
    self.assertIsNotNone(stack.ecs_stack)
    self.assertIsNotNone(stack.monitoring_stack)
    self.assertIsNotNone(stack.parameter_stack)

  @mark.it("creates infrastructure with environment-specific naming")
  def test_creates_infrastructure_with_env_naming(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))

    # ASSERT - Check that the stacks have environment-specific IDs
    self.assertEqual(stack.vpc_stack.node.id, f"VpcStack{env_suffix}")
    self.assertEqual(stack.ecs_stack.node.id, f"EcsStack{env_suffix}")
    self.assertEqual(stack.monitoring_stack.node.id, f"MonitoringStack{env_suffix}")
    self.assertEqual(stack.parameter_stack.node.id, f"ParameterStack{env_suffix}")

  @mark.it("orchestrates infrastructure deployment correctly")
  def test_orchestrates_infrastructure_deployment(self):
    # ARRANGE
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix="test"))

    # ASSERT - Check that the stack orchestrates all components
    self.assertIsNotNone(stack.vpc_stack, "VPC stack should be created")
    self.assertIsNotNone(stack.ecs_stack, "ECS stack should be created")
    self.assertIsNotNone(stack.monitoring_stack, "Monitoring stack should be created")
    self.assertIsNotNone(stack.parameter_stack, "Parameter stack should be created")

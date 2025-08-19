import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  """Test cases for the TapStack CDK stack"""

  def setUp(self):
    """Set up a fresh CDK app for each test"""
    self.app = cdk.App()

  @mark.it("creates multi-environment infrastructure with three environments")
  def test_creates_multi_environment_infrastructure(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Should create nested stacks for each environment
    # 3 environments x 5 nested stacks each (Network, Storage, IAM, LoadBalancer, Database)
    template.resource_count_is("AWS::CloudFormation::Stack", 15)

  @mark.it("creates nested stacks with correct naming pattern")
  def test_creates_nested_stacks_with_correct_naming(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that nested stacks are created with correct logical IDs
    resources = template.to_json()["Resources"]

    # Development environment stacks
    self.assertTrue(
        any("NetworkDevelopmenttest" in key for key in resources.keys()))
    self.assertTrue(
        any("StorageDevelopmenttest" in key for key in resources.keys()))
    self.assertTrue(
        any("IAMDevelopmenttest" in key for key in resources.keys()))
    self.assertTrue(
        any("LoadBalancerDevelopmenttest" in key for key in resources.keys()))
    self.assertTrue(
        any("DatabaseDevelopmenttest" in key for key in resources.keys()))

    # Staging environment stacks
    self.assertTrue(
        any("NetworkStagingtest" in key for key in resources.keys()))
    self.assertTrue(
        any("StorageStagingtest" in key for key in resources.keys()))
    self.assertTrue(any("IAMStagingtest" in key for key in resources.keys()))
    self.assertTrue(
        any("LoadBalancerStagingtest" in key for key in resources.keys()))
    self.assertTrue(
        any("DatabaseStagingtest" in key for key in resources.keys()))

    # Production environment stacks
    self.assertTrue(
        any("NetworkProductiontest" in key for key in resources.keys()))
    self.assertTrue(
        any("StorageProductiontest" in key for key in resources.keys()))
    self.assertTrue(
        any("IAMProductiontest" in key for key in resources.keys()))
    self.assertTrue(
        any("LoadBalancerProductiontest" in key for key in resources.keys()))
    self.assertTrue(
        any("DatabaseProductiontest" in key for key in resources.keys()))

  @mark.it("creates stack outputs for each environment")
  def test_creates_stack_outputs_for_environments(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that outputs are created for each environment
    # Should have 4 outputs per environment x 3 environments = 12 outputs
    expected_outputs = [
        "VpcIdDevelopmenttest",
        "BucketNameDevelopmenttest",
        "LoadBalancerDNSDevelopmenttest",
        "DatabaseEndpointDevelopmenttest",
        "VpcIdStagingtest",
        "BucketNameStagingtest",
        "LoadBalancerDNSStagingtest",
        "DatabaseEndpointStagingtest",
        "VpcIdProductiontest",
        "BucketNameProductiontest",
        "LoadBalancerDNSProductiontest",
        "DatabaseEndpointProductiontest"
    ]

    outputs = template.to_json()["Outputs"]
    for expected_output in expected_outputs:
      self.assertIn(expected_output, outputs)

  @mark.it("defaults environment suffix to 'dev' if not provided")
  def test_defaults_env_suffix_to_dev(self):
    # ARRANGE - Create a new app to avoid JSII reference issues
    app = cdk.App()
    stack = TapStack(app, "TapStackTestDefault", TapStackProps())
    template = Template.from_stack(stack)

    # ASSERT - Check that default suffix 'dev' is used
    resources = template.to_json()["Resources"]
    self.assertTrue(
        any("NetworkDevelopmentdev" in key for key in resources.keys()))
    self.assertTrue(
        any("StorageDevelopmentdev" in key for key in resources.keys()))

  @mark.it("has correct stack outputs structure")
  def test_stack_outputs_structure(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check output structure
    outputs = template.to_json()["Outputs"]

    # Check Development environment outputs
    self.assertIn("VpcIdDevelopmenttest", outputs)
    self.assertEqual(outputs["VpcIdDevelopmenttest"]
                     ["Description"], "VPC ID for Development")

    self.assertIn("BucketNameDevelopmenttest", outputs)
    self.assertEqual(outputs["BucketNameDevelopmenttest"]
                     ["Description"], "S3 Bucket name for Development")

    self.assertIn("LoadBalancerDNSDevelopmenttest", outputs)
    self.assertEqual(outputs["LoadBalancerDNSDevelopmenttest"]
                     ["Description"], "Load Balancer DNS for Development")

    self.assertIn("DatabaseEndpointDevelopmenttest", outputs)
    self.assertEqual(outputs["DatabaseEndpointDevelopmenttest"]
                     ["Description"], "RDS endpoint for Development")

  @mark.it("has nested stack dependencies")
  def test_nested_stack_dependencies(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - Check that some nested stacks have proper dependencies
    resources = template.to_json()["Resources"]

    # Find LoadBalancer stack and check it has Network dependency
    lb_resources = [key for key in resources.keys(
    ) if "LoadBalancer" in key and "NestedStackResource" in key]
    self.assertTrue(len(lb_resources) >= 1,
                    "LoadBalancer nested stacks should exist")

    # Check that at least one LoadBalancer stack has dependencies
    found_dependency = False
    for lb_resource in lb_resources:
      if "DependsOn" in resources[lb_resource]:
        found_dependency = True
        break

    self.assertTrue(found_dependency,
                    "LoadBalancer stacks should have dependencies")

  @mark.it("creates proper CloudFormation stack resources")
  def test_creates_cloudformation_stack_resources(self):
    # ARRANGE
    env_suffix = "test"
    stack = TapStack(self.app, "TapStackTest",
                     TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    # ASSERT - All nested stack resources should be CloudFormation stacks
    template.resource_count_is("AWS::CloudFormation::Stack", 15)

    # Check that all stack resources have required properties
    resources = template.to_json()["Resources"]
    for resource_key, resource_value in resources.items():
      if resource_value.get("Type") == "AWS::CloudFormation::Stack":
        # Should have TemplateURL
        self.assertIn("TemplateURL", resource_value["Properties"])
        # Should have UpdateReplacePolicy and DeletionPolicy
        self.assertIn("UpdateReplacePolicy", resource_value)
        self.assertIn("DeletionPolicy", resource_value)
        self.assertEqual(resource_value["UpdateReplacePolicy"], "Delete")
        self.assertEqual(resource_value["DeletionPolicy"], "Delete")

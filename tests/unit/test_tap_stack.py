"""Unit tests for TapStack"""

import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack Unit Tests")
class TestTapStack(unittest.TestCase):
  """Unit tests for TapStack class"""

  def setUp(self):
    """Set up test prerequisites"""
    app = cdk.App()
    stack = TapStack(app, "TestStack")
    self.template = Template.from_stack(stack)

  @mark.it("creates TapStackProps correctly")
  def test_tap_stack_props(self):
    # Test with default values
    props = TapStackProps()
    assert props.environment_suffix is None

    # Test with environment suffix provided
    props = TapStackProps(environment_suffix="test")
    assert props.environment_suffix == "test"

    # Test with other CDK stack properties
    props = TapStackProps(environment_suffix="prod",
                          description="Test description")
    assert props.environment_suffix == "prod"
    assert props.description == "Test description"

  @mark.it("creates nested stacks for each resource type")
  def test_nested_stacks_creation(self):
    # Check that all required nested stacks are created
    self.template.resource_count_is("AWS::CloudFormation::Stack", 5)
    
    # Check for DynamoDB nested stack
    self.template.has_resource("AWS::CloudFormation::Stack", Match.any_value())
    
    # Verify stack outputs are configured correctly in main template
    outputs = self.template.find_outputs("*")
    required_outputs = [
        "ApiEndpoint",
        "WebsiteURL", 
        "CloudFrontDistributionId",
        "CloudFrontDistributionDomain",
        "FrontendBucketName",
        "VisitsTableName",
        "LambdaFunctionName",
        "StackName"
    ]
    
    for output_name in required_outputs:
        assert output_name in outputs, f"Required output {output_name} not found"

  @mark.it("validates nested stack template structure")
  def test_nested_stack_structure(self):
    # Get all CloudFormation stack resources (nested stacks)
    stack_resources = self.template.find_resources("AWS::CloudFormation::Stack")
    
    # Should have exactly 5 nested stacks
    assert len(stack_resources) == 5, f"Expected 5 nested stacks, found {len(stack_resources)}"
    
    # Extract stack names to verify we have the expected stacks
    stack_names = list(stack_resources.keys())
    expected_stack_patterns = [
        "DynamoDBStack",
        "S3CloudFrontStack", 
        "LambdaStack",
        "ApiGatewayStack",
        "MonitoringStack"
    ]
    
    for pattern in expected_stack_patterns:
        matching_stacks = [name for name in stack_names if pattern in name]
        assert len(matching_stacks) == 1, f"Expected exactly 1 stack matching '{pattern}', found {len(matching_stacks)}"

  @mark.it("validates stack properties and environment suffix")
  def test_stack_environment_configuration(self):
    # Create a stack with specific environment suffix
    app = cdk.App()
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(app, "TestStackWithSuffix", props=props)
    template = Template.from_stack(stack)
    
    # Check that nested stacks include the environment suffix
    stack_resources = template.find_resources("AWS::CloudFormation::Stack")
    for stack_name in stack_resources.keys():
        assert "test" in stack_name, f"Stack {stack_name} should include environment suffix 'test'"

  @mark.it("ensures proper nested stack dependencies")
  def test_nested_stack_dependencies(self):
    # Check that nested stacks are properly structured without circular dependencies
    stack_resources = self.template.find_resources("AWS::CloudFormation::Stack")
    
    # All nested stacks should have template URLs (indicating they're properly configured)
    for stack_name, stack_config in stack_resources.items():
      properties = stack_config.get("Properties", {})
      assert "TemplateURL" in properties, f"Nested stack {stack_name} missing TemplateURL"
      
      # Should have proper deletion and update policies
      assert stack_config.get("UpdateReplacePolicy") == "Delete"
      assert stack_config.get("DeletionPolicy") == "Delete"

  @mark.it("validates stack outputs are properly configured")
  def test_stack_outputs(self):
    # Check that all required outputs exist and have proper structure
    outputs = self.template.find_outputs("*")
    
    required_outputs = [
        "ApiEndpoint",
        "WebsiteURL",
        "CloudFrontDistributionId", 
        "CloudFrontDistributionDomain",
        "FrontendBucketName",
        "VisitsTableName",
        "LambdaFunctionName",
        "StackName"
    ]
    
    for output_name in required_outputs:
        assert output_name in outputs, f"Required output {output_name} not found"
        
        # Each output should have a description
        output_config = outputs[output_name]
        assert "Description" in output_config, f"Output {output_name} missing description"

  @mark.it("validates no over-engineered resources in main stack")
  def test_no_over_engineered_resources_in_main_stack(self):
    # The main stack should only contain nested stacks, not individual resources
    # Verify that over-engineered resources are NOT in the main template
    self.template.resource_count_is("AWS::WAFv2::WebACL", 0)
    self.template.resource_count_is("AWS::SecretsManager::Secret", 0) 
    self.template.resource_count_is("AWS::CloudWatch::Dashboard", 0)
    self.template.resource_count_is("AWS::Lambda::LayerVersion", 0)
    
    # Main template should only have CloudFormation stacks and outputs
    all_resources = self.template.find_resources("*")
    for resource_type in all_resources.values():
        assert resource_type.get("Type") == "AWS::CloudFormation::Stack", (
            f"Main template should only contain nested stacks, found {resource_type.get('Type')}"
        )

  @mark.it("ensures nested stacks have proper naming convention")
  def test_nested_stack_naming_convention(self):
    # Check that nested stacks follow the expected naming pattern
    stack_resources = self.template.find_resources("AWS::CloudFormation::Stack")
    
    # Expected patterns for nested stack names
    expected_patterns = {
        "DynamoDBStack": "DynamoDBStackdev",
        "S3CloudFrontStack": "S3CloudFrontStackdev", 
        "LambdaStack": "LambdaStackdev",
        "ApiGatewayStack": "ApiGatewayStackdev",
        "MonitoringStack": "MonitoringStackdev"
    }
    
    for pattern, expected_name in expected_patterns.items():
        matching_stacks = [name for name in stack_resources.keys() if expected_name in name]
        assert len(matching_stacks) >= 1, f"No nested stack found matching pattern '{expected_name}'"


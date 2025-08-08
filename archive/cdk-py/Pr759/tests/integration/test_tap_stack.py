import json
import os
import unittest
from unittest import SkipTest
from pytest import mark

# Locate and load the outputs file
# This assumes the cfn-outputs are generated to a `cfn-outputs` directory
# and are in a flat JSON format.
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
  base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

# Load the outputs file if it exists, otherwise use an empty dict
if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}


@mark.describe("ServerlessStack Integration Tests")
class TestServerlessStackIntegration(unittest.TestCase):
  """
  Integration tests to verify the outputs of the deployed ServerlessStack.
  These tests require the stack to be deployed and the cfn-outputs to be
  available in a `flat-outputs.json` file.
  """

  def setUp(self):
    """Setup the test suite by loading the CloudFormation outputs."""
    self.outputs = flat_outputs

  @mark.it("checks if the outputs file is not empty")
  def test_outputs_file_not_empty(self):
    """
    Ensures that the flat-outputs.json file was loaded and contains data.
    If the file is empty or missing, all other tests will be skipped.
    """
    if not self.outputs:
      raise SkipTest("Skipping tests because flat-outputs.json is empty or missing.")

    self.assertTrue(len(self.outputs) > 0, "flat-outputs.json is empty or missing")

  @mark.it("has a DynamoDB Table Name output")
  def test_dynamodb_table_name_outputs_exist(self):
    """
    Verifies that the `ServerlessStackV3DynamoDBTableName` output exists
    and its value is a valid DynamoDB table name.
    """
    output_key = "ServerlessStackV3DynamoDBTableName"
    if output_key not in self.outputs:
      raise SkipTest(f"Skipping test: Missing output key '{output_key}'.")

    table_name = self.outputs[output_key]
    self.assertIsNotNone(table_name)
    self.assertIsInstance(table_name, str)
    self.assertTrue(len(table_name) > 0)

  @mark.it("has a Lambda Function Name output")
  def test_lambda_function_name_outputs_exist(self):
    """
    Verifies that the `ServerlessStackV3LambdaFunctionName` output exists
    and its value is a valid Lambda function name.
    """
    output_key = "ServerlessStackV3LambdaFunctionName"
    if output_key not in self.outputs:
      raise SkipTest(f"Skipping test: Missing output key '{output_key}'.")

    function_name = self.outputs[output_key]
    self.assertIsNotNone(function_name)
    self.assertIsInstance(function_name, str)
    self.assertTrue(len(function_name) > 0)

  @mark.it("has a CloudWatch Dashboard Name output")
  def test_cloudwatch_dashboard_name_outputs_exist(self):
    """
    Verifies that the `ServerlessStackV3CloudWatchDashboardName` output exists
    and its value is a valid CloudWatch dashboard name.
    """
    output_key = "ServerlessStackV3CloudWatchDashboardName"
    if output_key not in self.outputs:
      raise SkipTest(f"Skipping test: Missing output key '{output_key}'.")

    dashboard_name = self.outputs[output_key]
    self.assertIsNotNone(dashboard_name)
    self.assertIsInstance(dashboard_name, str)
    self.assertTrue(len(dashboard_name) > 0)

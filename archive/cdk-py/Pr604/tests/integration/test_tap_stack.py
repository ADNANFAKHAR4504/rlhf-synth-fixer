import json
import os
import unittest
from pytest import mark

# Load outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')
if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}

@mark.describe("TapStack Output File Resource Existence Tests")
class TestTapStackOutputFile(unittest.TestCase):
  def test_flat_outputs_file_exists(self):
    self.assertTrue(os.path.exists(flat_outputs_path), f"{flat_outputs_path} does not exist")

  def test_s3_bucket_output_exists(self):
    key = "S3BucketOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

  def test_ddb_table_output_exists(self):
    key = "DDBTableOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

  def test_sns_topic_output_exists(self):
    key = "SNSTopicOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

  def test_lambda_function_output_exists(self):
    key = "LambdaFunctionOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

  def test_vpc_id_output_exists(self):
    key = "VpcIdOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

  def test_public_subnet_ids_output_exists(self):
    key = "PublicSubnetIdsOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key, "")
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")
    subnets = [s.strip() for s in value.split(",") if s.strip()]
    self.assertTrue(len(subnets) > 0, "No public subnets found in flat-outputs.json")

  def test_private_subnet_ids_output_exists(self):
    key = "PrivateSubnetIdsOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key, "")
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")
    subnets = [s.strip() for s in value.split(",") if s.strip()]
    self.assertTrue(len(subnets) > 0, "No private subnets found in flat-outputs.json")

  def test_api_gateway_output_exists(self):
    key = "ApiGatewayOutput"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

  def test_tap_api_endpoint_exists(self):
    key = "TapApiEndpoint11A33180"
    self.assertIn(key, flat_outputs, f"Output key '{key}' not found in flat-outputs.json")
    value = flat_outputs.get(key)
    self.assertTrue(value is not None and str(value).strip() != "", f"Output key '{key}' is empty in flat-outputs.json")

if __name__ == "__main__":
  unittest.main()

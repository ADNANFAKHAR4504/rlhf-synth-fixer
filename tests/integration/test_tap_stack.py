import json
import os
import unittest
from pytest import mark

# Locate and load the outputs file
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(flat_outputs_path):
  with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)
else:
  flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):

  def setUp(self):
    """Set up anything needed for the integration tests"""
    self.outputs = flat_outputs

  @mark.it("has a VPC ID output for each deployed region")
  def test_vpc_id_outputs_exist(self):
    regions = ["USEast1", "EUWest1"]
    for region in regions:
      key = f"TapStack-prod-{region}.VpcId"
      self.assertIn(key, self.outputs, f"Missing VPC ID output for region: {region}")
      self.assertTrue(
        self.outputs[key].startswith("vpc-"),
        f"Invalid VPC ID format in {region}"
      )

  @mark.it("has an IAM Role ARN output for each deployed region")
  def test_iam_role_arn_outputs_exist(self):
    regions = ["USEast1", "EUWest1"]
    for region in regions:
      key = f"TapStack-prod-{region}.IamRoleArn"
      self.assertIn(key, self.outputs, f"Missing IAM Role ARN output for region: {region}")
      self.assertTrue(
        self.outputs[key].startswith("arn:aws:iam::"),
        f"Invalid IAM ARN in {region}"
      )

  @mark.it("fails gracefully if outputs file is missing")
  def test_outputs_file_not_empty(self):
    self.assertTrue(len(self.outputs) > 0, "flat-outputs.json is empty or missing")

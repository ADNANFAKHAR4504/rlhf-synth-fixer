import json
import os
import unittest
from unittest.mock import patch, MagicMock
import boto3
import pytest
from moto import mock_aws
from pytest import mark

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
  """Integration test cases for the TapStack CDK stack using live AWS services"""

  def setUp(self):
    """Set up AWS credentials from environment for live testing"""
    # Search order: env region first, then common fallbacks (adjust if you
    # deploy elsewhere)
    primary_region = os.getenv("AWS_REGION", "us-west-1")
    fallback_regions = [r for r in [primary_region, "us-west-2", "us-east-1"]]
    # Deduplicate while preserving order
    seen = set()
    self.search_regions = [
        r for r in fallback_regions if not (
            r in seen or seen.add(r))]

    # Values from flat-outputs.json (may be missing)
    self.api_gateway_url = flat_outputs.get("api_gateway_url")
    self.lambda_function_name = flat_outputs.get("lambda_function_name")
    self.dynamodb_table_name = flat_outputs.get("dynamodb_table_name")
    self.vpc_id = flat_outputs.get("vpc_id")

    required = [
        "api_gateway_url",
        "lambda_function_name",
        "dynamodb_table_name",
        "vpc_id"]
    missing = [k for k in required if not flat_outputs.get(k)]

    if missing:
      # Try to auto-discover by canonical names used in tap_stack.py across
      # candidate regions
      discovered = {}
      for region in self.search_regions:
        session = boto3.session.Session(region_name=region)
        apigw = session.client("apigateway")
        lam = session.client("lambda")
        ddb = session.client("dynamodb")
        ec2 = session.client("ec2")

        # API Gateway REST API named "tap-serverless-api" with stage "prod"
        if "api_gateway_url" in missing and "api_gateway_url" not in discovered:
          try:
            apis = apigw.get_rest_apis(limit=500).get("items", [])
            api = next((a for a in apis if a.get("name")
                       == "tap-serverless-api"), None)
            if api and api.get("id"):
              discovered["api_gateway_url"] = (
                  f"https://{api['id']}.execute-api.{region}.amazonaws.com/prod")
          except Exception:
            pass  # keep searching other regions

        # Lambda function named "tap-serverless-function"
        if "lambda_function_name" in missing and "lambda_function_name" not in discovered:
          try:
            lam.get_function(FunctionName="tap-serverless-function")
            discovered["lambda_function_name"] = "tap-serverless-function"
          except lam.exceptions.ResourceNotFoundException:
            try:
              for page in lam.get_paginator("list_functions").paginate():
                if any(fn.get("FunctionName") == "tap-serverless-function"
                       for fn in page.get("Functions", [])):
                  discovered["lambda_function_name"] = "tap-serverless-function"
                  break
            except Exception:
              pass

        # DynamoDB table named "tap-serverless-table"
        if "dynamodb_table_name" in missing and "dynamodb_table_name" not in discovered:
          try:
            ddb.describe_table(TableName="tap-serverless-table")
            discovered["dynamodb_table_name"] = "tap-serverless-table"
          except ddb.exceptions.ResourceNotFoundException:
            pass
          except Exception:
            pass

        # VPC tagged Name = "tap-serverless-vpc"
        if "vpc_id" in missing and "vpc_id" not in discovered:
          try:
            vpcs = ec2.describe_vpcs(
                Filters=[{"Name": "tag:Name", "Values": ["tap-serverless-vpc"]}]
            ).get("Vpcs", [])
            if vpcs:
              discovered["vpc_id"] = vpcs[0].get("VpcId")
          except Exception:
            pass

        # If we’ve found all, stop searching more regions
        if all(k in discovered for k in missing):
          # Set the region that actually contains the resources for clients
          # below
          self.aws_region = region
          break

      # Merge and persist recovered values
      updated = dict(flat_outputs)
      updated.update({k: v for k, v in discovered.items() if v})

      still_missing = [k for k in required if not updated.get(k)]
      if still_missing:
        raise ValueError(
            f"Missing required stack outputs: {
                ', '.join(still_missing)}")

      os.makedirs(os.path.dirname(flat_outputs_path), exist_ok=True)
      with open(flat_outputs_path, "w", encoding="utf-8") as f:
        json.dump(updated, f)

      # Update instance fields from discovered/updated values
      self.api_gateway_url = updated["api_gateway_url"]
      self.lambda_function_name = updated["lambda_function_name"]
      self.dynamodb_table_name = updated["dynamodb_table_name"]
      self.vpc_id = updated["vpc_id"]

    # If discovery didn’t set it (because file already had values), use env
    # region
    if not hasattr(self, "aws_region"):
      self.aws_region = primary_region

    # Init clients in the region we decided on
    self.lambda_client = boto3.client("lambda", region_name=self.aws_region)
    self.apigw_client = boto3.client("apigateway", region_name=self.aws_region)
    self.dynamodb_client = boto3.client(
        "dynamodb", region_name=self.aws_region)
    self.ec2_client = boto3.client("ec2", region_name=self.aws_region)

  @mark.it("should successfully invoke the Lambda function")
  def test_lambda_invocation(self):
    """Invoke the deployed Lambda function and validate the response"""
    response = self.lambda_client.invoke(
        FunctionName=self.lambda_function_name,
        InvocationType="RequestResponse",
        Payload=json.dumps({"test": "integration"}).encode()
    )
    payload = json.loads(response['Payload'].read().decode())
    self.assertEqual(response['StatusCode'], 200)
    self.assertIn('statusCode', payload)
    self.assertEqual(payload['statusCode'], 200)

  @mark.it("should confirm DynamoDB table exists and is active")
  def test_dynamodb_table_exists(self):
    """Check that the DynamoDB table exists and is ACTIVE"""
    response = self.dynamodb_client.describe_table(
        TableName=self.dynamodb_table_name
    )
    self.assertEqual(
        response['Table']['TableStatus'], 'ACTIVE',
        f"DynamoDB table {self.dynamodb_table_name} is not ACTIVE"
    )

  @mark.it("should confirm API Gateway endpoint is reachable")
  def test_api_gateway_reachable(self):
    """Send an HTTP request to API Gateway endpoint"""
    import requests
    url = f"{self.api_gateway_url}/hello"
    r = requests.get(url)
    self.assertEqual(
        r.status_code,
        200,
        f"API Gateway returned {
            r.status_code}")
    self.assertIn("message", r.json())

  @mark.it("should confirm VPC exists in the correct region")
  def test_vpc_exists(self):
    """Check that the VPC exists"""
    response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
    self.assertEqual(len(response['Vpcs']), 1)
    self.assertEqual(response['Vpcs'][0]['VpcId'], self.vpc_id)


if __name__ == "__main__":
  unittest.main()

import json
import os
import unittest

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
  """Integration tests validating deployed infrastructure using CloudFormation outputs"""

  def setUp(self):
    """Set up test data from flat outputs"""
    self.outputs = flat_outputs

  @mark.it("verifies VPC is deployed with correct ID")
  def test_vpc_deployed_correctly(self):
    # ARRANGE & ACT
    vpc_id = self.outputs.get("VpcId") or self.outputs.get("VpcIdOutput")

    # ASSERT
    self.assertIsNotNone(vpc_id, "VPC ID should be present in outputs")
    self.assertTrue(vpc_id.startswith("vpc-"), f"VPC ID should start with 'vpc-', got: {vpc_id}")

  @mark.it("verifies three S3 buckets are deployed")
  def test_s3_buckets_deployed(self):
    # ARRANGE & ACT
    logs_bucket = self.outputs.get("LogsBucketName")
    audit_bucket = self.outputs.get("AuditBucketName")
    access_logs_bucket = self.outputs.get("AccessLogsBucketName")

    # ASSERT
    self.assertIsNotNone(logs_bucket, "Logs bucket should be deployed")
    self.assertIsNotNone(audit_bucket, "Audit bucket should be deployed")
    self.assertIsNotNone(access_logs_bucket, "Access logs bucket should be deployed")

    # Verify naming convention
    self.assertIn("payment-logs", logs_bucket)
    self.assertIn("payment-audit", audit_bucket)
    self.assertIn("payment-access-logs", access_logs_bucket)

  @mark.it("verifies Lambda functions are deployed with correct ARNs")
  def test_lambda_functions_deployed(self):
    # ARRANGE & ACT
    payment_processor_arn = self.outputs.get("PaymentProcessorArn")
    transaction_validator_arn = self.outputs.get("TransactionValidatorArn")
    fraud_detector_arn = self.outputs.get("FraudDetectorArn")
    cost_report_arn = self.outputs.get("CostReportFunctionArn")

    # ASSERT
    self.assertIsNotNone(payment_processor_arn, "Payment processor Lambda should be deployed")
    self.assertIsNotNone(transaction_validator_arn, "Transaction validator Lambda should be deployed")
    self.assertIsNotNone(fraud_detector_arn, "Fraud detector Lambda should be deployed")
    self.assertIsNotNone(cost_report_arn, "Cost report Lambda should be deployed")

    # Verify ARN format
    for arn in [payment_processor_arn, transaction_validator_arn, fraud_detector_arn, cost_report_arn]:
      self.assertTrue(arn.startswith("arn:aws:lambda:"), f"Lambda ARN should be valid, got: {arn}")

  @mark.it("verifies DynamoDB tables are deployed")
  def test_dynamodb_tables_deployed(self):
    # ARRANGE & ACT
    transactions_table = self.outputs.get("TransactionsTableName")
    users_table = self.outputs.get("UsersTableName")
    payment_methods_table = self.outputs.get("PaymentMethodsTableName")

    # ASSERT
    self.assertIsNotNone(transactions_table, "Transactions table should be deployed")
    self.assertIsNotNone(users_table, "Users table should be deployed")
    self.assertIsNotNone(payment_methods_table, "Payment methods table should be deployed")

    # Verify naming convention includes 'payment'
    self.assertIn("payment", transactions_table.lower())
    self.assertIn("payment", users_table.lower())
    self.assertIn("payment", payment_methods_table.lower())

  @mark.it("verifies API Gateway is deployed with URL")
  def test_api_gateway_deployed(self):
    # ARRANGE & ACT
    api_url = self.outputs.get("ApiUrl")
    api_id = self.outputs.get("ApiId")

    # ASSERT
    self.assertIsNotNone(api_url, "API Gateway URL should be present")
    self.assertIsNotNone(api_id, "API Gateway ID should be present")

    # Verify URL format
    self.assertTrue(api_url.startswith("https://"), f"API URL should be HTTPS, got: {api_url}")
    self.assertIn("execute-api", api_url, f"API URL should contain execute-api, got: {api_url}")

  @mark.it("verifies ECS cluster and service are deployed")
  def test_ecs_cluster_deployed(self):
    # ARRANGE & ACT
    cluster_name = self.outputs.get("ClusterName")
    service_name = self.outputs.get("ServiceName")
    load_balancer_dns = self.outputs.get("LoadBalancerDns")

    # ASSERT
    self.assertIsNotNone(cluster_name, "ECS cluster should be deployed")
    self.assertIsNotNone(service_name, "ECS service should be deployed")
    self.assertIsNotNone(load_balancer_dns, "Load balancer should be deployed")

    # Verify naming convention
    self.assertIn("payment-cluster", cluster_name)
    self.assertIn("payment-service", service_name)
    self.assertIn("elb.amazonaws.com", load_balancer_dns)

  @mark.it("verifies CloudWatch dashboard is deployed")
  def test_cloudwatch_dashboard_deployed(self):
    # ARRANGE & ACT
    dashboard_name = self.outputs.get("DashboardName")

    # ASSERT
    self.assertIsNotNone(dashboard_name, "CloudWatch dashboard should be deployed")
    self.assertIn("cost-optimization", dashboard_name, "Dashboard should be for cost optimization")

  @mark.it("verifies cost report Lambda has correct name")
  def test_cost_report_lambda_deployed(self):
    # ARRANGE & ACT
    cost_report_name = self.outputs.get("CostReportFunctionName")
    cost_report_arn = self.outputs.get("CostReportFunctionArn")

    # ASSERT
    self.assertIsNotNone(cost_report_name, "Cost report function name should be present")
    self.assertIsNotNone(cost_report_arn, "Cost report function ARN should be present")
    self.assertIn("costrepo", cost_report_name.lower())

  @mark.it("verifies all expected outputs are present")
  def test_all_expected_outputs_present(self):
    # ARRANGE
    expected_output_keys = [
        "VpcId", "ApiUrl", "ApiId",
        "LogsBucketName", "AuditBucketName", "AccessLogsBucketName",
        "TransactionsTableName", "UsersTableName", "PaymentMethodsTableName",
        "PaymentProcessorArn", "TransactionValidatorArn", "FraudDetectorArn",
        "ClusterName", "ServiceName", "LoadBalancerDns",
        "DashboardName", "CostReportFunctionArn", "CostReportFunctionName"
    ]

    # ACT & ASSERT
    missing_outputs = []
    for key in expected_output_keys:
      if key not in self.outputs or self.outputs.get(key) is None:
        # Check for alternative output names
        alt_keys = {
            "VpcId": "VpcIdOutput",
        }
        alt_key = alt_keys.get(key)
        if not alt_key or alt_key not in self.outputs:
          missing_outputs.append(key)

    # ASSERT
    if missing_outputs:
      self.fail(f"Missing expected outputs: {', '.join(missing_outputs)}")

  @mark.it("verifies resource naming follows convention")
  def test_resource_naming_convention(self):
    # ARRANGE
    # Pattern: {env}-{service}-{resource-type}-{identifier}
    environment = "dev"  # Default environment

    # ACT - Get resource names
    cluster_name = self.outputs.get("ClusterName")
    service_name = self.outputs.get("ServiceName")

    # ASSERT
    if cluster_name:
      self.assertTrue(
          cluster_name.startswith(f"{environment}-payment-"),
          f"Cluster name should follow naming convention, got: {cluster_name}"
      )

    if service_name:
      self.assertTrue(
          service_name.startswith(f"{environment}-payment-"),
          f"Service name should follow naming convention, got: {service_name}"
      )

  @mark.it("verifies deployment in correct AWS region")
  def test_resources_in_correct_region(self):
    # ARRANGE & ACT
    # Lambda ARNs contain region information
    payment_processor_arn = self.outputs.get("PaymentProcessorArn")

    # ASSERT
    if payment_processor_arn:
      # ARN format: arn:aws:lambda:region:account:function:name
      parts = payment_processor_arn.split(":")
      if len(parts) >= 4:
        region = parts[3]
        self.assertEqual("us-east-1", region, f"Resources should be in us-east-1, got: {region}")

  @mark.it("verifies Lambda function naming includes environment")
  def test_lambda_naming_includes_environment(self):
    # ARRANGE & ACT
    payment_processor_arn = self.outputs.get("PaymentProcessorArn")
    fraud_detector_arn = self.outputs.get("FraudDetectorArn")

    # ASSERT
    if payment_processor_arn:
      self.assertIn("payment", payment_processor_arn.lower())
    if fraud_detector_arn:
      self.assertIn("payment", fraud_detector_arn.lower())

  @mark.it("verifies S3 bucket names include account ID for uniqueness")
  def test_s3_buckets_include_account_id(self):
    # ARRANGE & ACT
    logs_bucket = self.outputs.get("LogsBucketName")

    # ASSERT
    if logs_bucket:
      # Bucket names should end with account ID for global uniqueness
      parts = logs_bucket.split("-")
      account_id = parts[-1] if parts else None
      self.assertIsNotNone(account_id)
      self.assertTrue(
          account_id.isdigit() and len(account_id) == 12,
          f"Bucket name should include 12-digit account ID, got: {account_id}"
      )

  @mark.it("verifies outputs contain valid AWS resource identifiers")
  def test_outputs_have_valid_identifiers(self):
    # ARRANGE & ACT
    vpc_id = self.outputs.get("VpcId") or self.outputs.get("VpcIdOutput")
    api_id = self.outputs.get("ApiId")

    # ASSERT
    if vpc_id:
      self.assertRegex(vpc_id, r"^vpc-[a-f0-9]+$", "VPC ID should match pattern vpc-xxxxx")

    if api_id:
      self.assertRegex(api_id, r"^[a-z0-9]+$", "API Gateway ID should be alphanumeric")

  @mark.it("verifies infrastructure supports cost optimization requirements")
  def test_infrastructure_supports_cost_optimization(self):
    # ARRANGE & ACT - Verify key components for cost optimization are present

    # Lambda functions (memory optimization)
    lambdas_present = bool(self.outputs.get("PaymentProcessorArn"))

    # DynamoDB tables (on-demand billing)
    dynamodb_present = bool(self.outputs.get("TransactionsTableName"))

    # S3 buckets (lifecycle policies)
    s3_present = bool(self.outputs.get("LogsBucketName"))

    # ECS with auto-scaling
    ecs_present = bool(self.outputs.get("ClusterName"))

    # CloudWatch dashboard (monitoring)
    dashboard_present = bool(self.outputs.get("DashboardName"))

    # Cost report function
    cost_report_present = bool(self.outputs.get("CostReportFunctionArn"))

    # ASSERT - All cost optimization components should be present
    self.assertTrue(lambdas_present, "Lambda functions for cost optimization should be deployed")
    self.assertTrue(dynamodb_present, "DynamoDB tables for cost optimization should be deployed")
    self.assertTrue(s3_present, "S3 buckets for cost optimization should be deployed")
    self.assertTrue(ecs_present, "ECS resources for cost optimization should be deployed")
    self.assertTrue(dashboard_present, "CloudWatch dashboard for monitoring should be deployed")
    self.assertTrue(cost_report_present, "Cost report function should be deployed")

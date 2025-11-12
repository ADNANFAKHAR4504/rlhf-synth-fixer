"""
Integration tests for TapStack that validate deployed infrastructure outputs.
These tests read from cfn-outputs/flat-outputs.json and verify the deployment
without making AWS API calls or requiring authentication.
"""

import unittest
import json
import os
from pathlib import Path
from urllib.parse import urlparse
from pytest import mark


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure"""
    
    @classmethod
    def setUpClass(cls):
        """Load CloudFormation outputs once for all tests"""
        outputs_path = Path("cfn-outputs/flat-outputs.json")
        
        if not outputs_path.exists():
            raise FileNotFoundError(
                f"CloudFormation outputs not found at {outputs_path}. "
                "Ensure the stack is deployed and outputs are exported."
            )
        
        with open(outputs_path, "r") as f:
            cls.outputs = json.load(f)
        
        # Extract environment suffix from resource names
        cls.env_suffix = cls._extract_environment_suffix(cls.outputs)
    
    @classmethod
    def _extract_environment_suffix(cls, outputs):
        """Extract environment suffix from output values"""
        # Get suffix from table name (format: payments-{suffix})
        table_name = outputs.get("PaymentsTableName", "")
        if table_name.startswith("payments-"):
            return table_name.replace("payments-", "")
        return "unknown"
    
    def _assert_output_exists(self, key):
        """Helper to assert an output key exists"""
        self.assertIn(key, self.outputs, f"Output '{key}' not found in deployment outputs")
        self.assertIsNotNone(self.outputs[key], f"Output '{key}' is None")
        self.assertNotEqual(self.outputs[key], "", f"Output '{key}' is empty")


@mark.describe("TapStack Integration - DynamoDB Outputs")
class TestDynamoDBOutputs(TestTapStackIntegration):
    """Test DynamoDB table outputs"""
    
    @mark.it("validates DynamoDB table name output exists")
    def test_payments_table_name_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentsTableName")
    
    @mark.it("validates DynamoDB table name format")
    def test_payments_table_name_format(self):
        # ARRANGE
        table_name = self.outputs["PaymentsTableName"]
        
        # ASSERT
        self.assertTrue(
            table_name.startswith("payments-"),
            f"Table name '{table_name}' should start with 'payments-'"
        )
        self.assertEqual(
            table_name,
            f"payments-{self.env_suffix}",
            f"Table name should be 'payments-{self.env_suffix}'"
        )
    
    @mark.it("validates DynamoDB table ARN output exists")
    def test_payments_table_arn_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentsTableArn")
    
    @mark.it("validates DynamoDB table ARN format")
    def test_payments_table_arn_format(self):
        # ARRANGE
        table_arn = self.outputs["PaymentsTableArn"]
        table_name = self.outputs["PaymentsTableName"]
        
        # ASSERT
        self.assertTrue(
            table_arn.startswith("arn:aws:dynamodb:"),
            "Table ARN should start with 'arn:aws:dynamodb:'"
        )
        self.assertIn(
            table_name,
            table_arn,
            f"Table ARN should contain table name '{table_name}'"
        )
        self.assertIn(
            "table/",
            table_arn,
            "Table ARN should contain 'table/' prefix"
        )


@mark.describe("TapStack Integration - Lambda Outputs")
class TestLambdaOutputs(TestTapStackIntegration):
    """Test Lambda function outputs"""
    
    @mark.it("validates payment validator Lambda ARN exists")
    def test_payment_validator_arn_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentValidatorArn")
    
    @mark.it("validates payment validator Lambda ARN format")
    def test_payment_validator_arn_format(self):
        # ARRANGE
        lambda_arn = self.outputs["PaymentValidatorArn"]
        
        # ASSERT
        self.assertTrue(
            lambda_arn.startswith("arn:aws:lambda:"),
            "Lambda ARN should start with 'arn:aws:lambda:'"
        )
        self.assertIn(
            f"payment-validator-{self.env_suffix}",
            lambda_arn,
            f"Lambda ARN should contain function name 'payment-validator-{self.env_suffix}'"
        )
        self.assertIn(
            "function:",
            lambda_arn,
            "Lambda ARN should contain 'function:' prefix"
        )
    
    @mark.it("validates payment processor Lambda ARN exists")
    def test_payment_processor_arn_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentProcessorArn")
    
    @mark.it("validates payment processor Lambda ARN format")
    def test_payment_processor_arn_format(self):
        # ARRANGE
        lambda_arn = self.outputs["PaymentProcessorArn"]
        
        # ASSERT
        self.assertTrue(
            lambda_arn.startswith("arn:aws:lambda:"),
            "Lambda ARN should start with 'arn:aws:lambda:'"
        )
        self.assertIn(
            f"payment-processor-{self.env_suffix}",
            lambda_arn,
            f"Lambda ARN should contain function name 'payment-processor-{self.env_suffix}'"
        )


@mark.describe("TapStack Integration - SQS Outputs")
class TestSQSOutputs(TestTapStackIntegration):
    """Test SQS queue outputs"""
    
    @mark.it("validates payment queue URL exists")
    def test_payment_queue_url_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentQueueUrl")
    
    @mark.it("validates payment queue URL format")
    def test_payment_queue_url_format(self):
        # ARRANGE
        queue_url = self.outputs["PaymentQueueUrl"]
        
        # ASSERT
        self.assertTrue(
            queue_url.startswith("https://sqs."),
            "Queue URL should start with 'https://sqs.'"
        )
        self.assertIn(
            ".amazonaws.com/",
            queue_url,
            "Queue URL should contain '.amazonaws.com/'"
        )
        self.assertIn(
            f"payment-queue-{self.env_suffix}",
            queue_url,
            f"Queue URL should contain queue name 'payment-queue-{self.env_suffix}'"
        )
    
    @mark.it("validates payment queue ARN exists")
    def test_payment_queue_arn_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentQueueArn")
    
    @mark.it("validates payment queue ARN format")
    def test_payment_queue_arn_format(self):
        # ARRANGE
        queue_arn = self.outputs["PaymentQueueArn"]
        
        # ASSERT
        self.assertTrue(
            queue_arn.startswith("arn:aws:sqs:"),
            "Queue ARN should start with 'arn:aws:sqs:'"
        )
        self.assertIn(
            f"payment-queue-{self.env_suffix}",
            queue_arn,
            f"Queue ARN should contain queue name 'payment-queue-{self.env_suffix}'"
        )
    
    @mark.it("validates payment DLQ URL exists")
    def test_payment_dlq_url_exists(self):
        # ASSERT
        self._assert_output_exists("PaymentDLQUrl")
    
    @mark.it("validates payment DLQ URL format")
    def test_payment_dlq_url_format(self):
        # ARRANGE
        dlq_url = self.outputs["PaymentDLQUrl"]
        
        # ASSERT
        self.assertTrue(
            dlq_url.startswith("https://sqs."),
            "DLQ URL should start with 'https://sqs.'"
        )
        self.assertIn(
            f"payment-dlq-{self.env_suffix}",
            dlq_url,
            f"DLQ URL should contain queue name 'payment-dlq-{self.env_suffix}'"
        )


@mark.describe("TapStack Integration - SNS Outputs")
class TestSNSOutputs(TestTapStackIntegration):
    """Test SNS topic outputs"""
    
    @mark.it("validates ops alert topic ARN exists")
    def test_ops_alert_topic_arn_exists(self):
        # ASSERT
        self._assert_output_exists("OpsAlertTopicArn")
    
    @mark.it("validates ops alert topic ARN format")
    def test_ops_alert_topic_arn_format(self):
        # ARRANGE
        topic_arn = self.outputs["OpsAlertTopicArn"]
        
        # ASSERT
        self.assertTrue(
            topic_arn.startswith("arn:aws:sns:"),
            "Topic ARN should start with 'arn:aws:sns:'"
        )
        self.assertIn(
            f"ops-alerts-{self.env_suffix}",
            topic_arn,
            f"Topic ARN should contain topic name 'ops-alerts-{self.env_suffix}'"
        )
    
    @mark.it("validates transaction topic ARN exists")
    def test_transaction_topic_arn_exists(self):
        # ASSERT
        self._assert_output_exists("TransactionTopicArn")
    
    @mark.it("validates transaction topic ARN format")
    def test_transaction_topic_arn_format(self):
        # ARRANGE
        topic_arn = self.outputs["TransactionTopicArn"]
        
        # ASSERT
        self.assertTrue(
            topic_arn.startswith("arn:aws:sns:"),
            "Topic ARN should start with 'arn:aws:sns:'"
        )
        self.assertIn(
            f"transactions-{self.env_suffix}",
            topic_arn,
            f"Topic ARN should contain topic name 'transactions-{self.env_suffix}'"
        )


@mark.describe("TapStack Integration - API Gateway Outputs")
class TestAPIGatewayOutputs(TestTapStackIntegration):
    """Test API Gateway outputs"""
    
    @mark.it("validates API endpoint exists")
    def test_api_endpoint_exists(self):
        # ASSERT
        self._assert_output_exists("APIEndpoint")
    
    @mark.it("validates API endpoint is a valid HTTPS URL")
    def test_api_endpoint_is_https(self):
        # ARRANGE
        api_endpoint = self.outputs["APIEndpoint"]
        parsed = urlparse(api_endpoint)
        
        # ASSERT
        self.assertEqual(
            parsed.scheme,
            "https",
            "API endpoint should use HTTPS protocol"
        )
        self.assertTrue(
            parsed.netloc.endswith(".execute-api.us-east-1.amazonaws.com"),
            "API endpoint should be in execute-api domain"
        )
    
    @mark.it("validates API endpoint path ends with prod stage")
    def test_api_endpoint_has_prod_stage(self):
        # ARRANGE
        api_endpoint = self.outputs["APIEndpoint"]
        
        # ASSERT
        self.assertTrue(
            api_endpoint.endswith("/prod/"),
            "API endpoint should end with '/prod/'"
        )
    
    @mark.it("validates API ID exists")
    def test_api_id_exists(self):
        # ASSERT
        self._assert_output_exists("APIId")
    
    @mark.it("validates API ID format")
    def test_api_id_format(self):
        # ARRANGE
        api_id = self.outputs["APIId"]
        
        # ASSERT
        self.assertRegex(
            api_id,
            r'^[a-z0-9]{10}$',
            "API ID should be 10 alphanumeric characters"
        )
    
    @mark.it("validates API ID matches endpoint")
    def test_api_id_matches_endpoint(self):
        # ARRANGE
        api_id = self.outputs["APIId"]
        api_endpoint = self.outputs["APIEndpoint"]
        
        # ASSERT
        self.assertIn(
            api_id,
            api_endpoint,
            "API endpoint should contain the API ID"
        )


@mark.describe("TapStack Integration - CloudWatch Outputs")
class TestCloudWatchOutputs(TestTapStackIntegration):
    """Test CloudWatch outputs"""
    
    @mark.it("validates dashboard name exists")
    def test_dashboard_name_exists(self):
        # ASSERT
        self._assert_output_exists("DashboardName")
    
    @mark.it("validates dashboard name format")
    def test_dashboard_name_format(self):
        # ARRANGE
        dashboard_name = self.outputs["DashboardName"]
        
        # ASSERT
        self.assertTrue(
            dashboard_name.startswith("payment-dr-"),
            "Dashboard name should start with 'payment-dr-'"
        )
        self.assertEqual(
            dashboard_name,
            f"payment-dr-{self.env_suffix}",
            f"Dashboard name should be 'payment-dr-{self.env_suffix}'"
        )


@mark.describe("TapStack Integration - Region Output")
class TestRegionOutput(TestTapStackIntegration):
    """Test region output"""
    
    @mark.it("validates region output exists")
    def test_region_exists(self):
        # ASSERT
        self._assert_output_exists("Region")
    
    @mark.it("validates region is us-east-1")
    def test_region_is_us_east_1(self):
        # ARRANGE
        region = self.outputs["Region"]
        
        # ASSERT
        self.assertEqual(
            region,
            "us-east-1",
            "Stack should be deployed in us-east-1"
        )


@mark.describe("TapStack Integration - Resource Name Consistency")
class TestResourceNameConsistency(TestTapStackIntegration):
    """Test that all resources use consistent environment suffix"""
    
    @mark.it("validates all resource names use same environment suffix")
    def test_consistent_environment_suffix(self):
        # ARRANGE
        expected_suffix = self.env_suffix
        
        resource_names = {
            "DynamoDB Table": self.outputs["PaymentsTableName"],
            "Payment Validator": self.outputs["PaymentValidatorArn"],
            "Payment Processor": self.outputs["PaymentProcessorArn"],
            "Payment Queue": self.outputs["PaymentQueueUrl"],
            "Payment DLQ": self.outputs["PaymentDLQUrl"],
            "Ops Alert Topic": self.outputs["OpsAlertTopicArn"],
            "Transaction Topic": self.outputs["TransactionTopicArn"],
            "Dashboard": self.outputs["DashboardName"],
        }
        
        # ASSERT
        for resource_type, resource_name in resource_names.items():
            self.assertIn(
                expected_suffix,
                resource_name,
                f"{resource_type} should contain environment suffix '{expected_suffix}'"
            )


@mark.describe("TapStack Integration - ARN Region Consistency")
class TestARNRegionConsistency(TestTapStackIntegration):
    """Test that all ARNs reference the correct region"""
    
    @mark.it("validates all ARNs use us-east-1 region")
    def test_arns_use_correct_region(self):
        # ARRANGE
        expected_region = "us-east-1"
        
        arns = {
            "PaymentsTableArn": self.outputs["PaymentsTableArn"],
            "PaymentValidatorArn": self.outputs["PaymentValidatorArn"],
            "PaymentProcessorArn": self.outputs["PaymentProcessorArn"],
            "PaymentQueueArn": self.outputs["PaymentQueueArn"],
            "OpsAlertTopicArn": self.outputs["OpsAlertTopicArn"],
            "TransactionTopicArn": self.outputs["TransactionTopicArn"],
        }
        
        # ASSERT
        for arn_name, arn_value in arns.items():
            self.assertIn(
                expected_region,
                arn_value,
                f"{arn_name} should reference region '{expected_region}'"
            )


@mark.describe("TapStack Integration - API Gateway Endpoints")
class TestAPIGatewayEndpoints(TestTapStackIntegration):
    """Test API Gateway endpoint structure"""
    
    @mark.it("validates API has health endpoint path")
    def test_health_endpoint_construction(self):
        # ARRANGE
        api_endpoint = self.outputs["APIEndpoint"]
        health_endpoint = f"{api_endpoint}health"
        
        # ASSERT
        self.assertTrue(
            health_endpoint.startswith("https://"),
            "Health endpoint should start with https://"
        )
        self.assertIn(
            "/prod/health",
            health_endpoint,
            "Health endpoint should contain '/prod/health'"
        )
    
    @mark.it("validates API has validate endpoint path")
    def test_validate_endpoint_construction(self):
        # ARRANGE
        api_endpoint = self.outputs["APIEndpoint"]
        validate_endpoint = f"{api_endpoint}validate"
        
        # ASSERT
        self.assertTrue(
            validate_endpoint.startswith("https://"),
            "Validate endpoint should start with https://"
        )
        self.assertIn(
            "/prod/validate",
            validate_endpoint,
            "Validate endpoint should contain '/prod/validate'"
        )
    
    @mark.it("validates API has process endpoint path")
    def test_process_endpoint_construction(self):
        # ARRANGE
        api_endpoint = self.outputs["APIEndpoint"]
        process_endpoint = f"{api_endpoint}process"
        
        # ASSERT
        self.assertTrue(
            process_endpoint.startswith("https://"),
            "Process endpoint should start with https://"
        )
        self.assertIn(
            "/prod/process",
            process_endpoint,
            "Process endpoint should contain '/prod/process'"
        )


@mark.describe("TapStack Integration - URL Format Validation")
class TestURLFormatValidation(TestTapStackIntegration):
    """Test URL format validation for all endpoints"""
    
    @mark.it("validates API endpoint has no path parameters")
    def test_api_endpoint_no_path_params(self):
        # ARRANGE
        api_endpoint = self.outputs["APIEndpoint"]
        parsed = urlparse(api_endpoint)
        
        # ASSERT
        self.assertEqual(
            parsed.query,
            "",
            "API endpoint should not have query parameters"
        )
        self.assertEqual(
            parsed.fragment,
            "",
            "API endpoint should not have fragments"
        )
    
    @mark.it("validates SQS URLs are properly formatted")
    def test_sqs_urls_properly_formatted(self):
        # ARRANGE
        queue_url = self.outputs["PaymentQueueUrl"]
        dlq_url = self.outputs["PaymentDLQUrl"]
        
        # ASSERT
        for url in [queue_url, dlq_url]:
            parsed = urlparse(url)
            self.assertEqual(parsed.scheme, "https", "SQS URL should use HTTPS")
            self.assertTrue(
                parsed.netloc.startswith("sqs."),
                "SQS URL should start with sqs. subdomain"
            )


@mark.describe("TapStack Integration - Outputs Completeness")
class TestOutputsCompleteness(TestTapStackIntegration):
    """Test that all expected outputs are present"""
    
    @mark.it("validates all required outputs are present")
    def test_all_required_outputs_present(self):
        # ARRANGE
        required_outputs = [
            "PaymentsTableName",
            "PaymentsTableArn",
            "PaymentValidatorArn",
            "PaymentProcessorArn",
            "PaymentQueueUrl",
            "PaymentQueueArn",
            "PaymentDLQUrl",
            "APIEndpoint",
            "APIId",
            "OpsAlertTopicArn",
            "TransactionTopicArn",
            "DashboardName",
            "Region",
        ]
        
        # ASSERT
        for output_key in required_outputs:
            self._assert_output_exists(output_key)
    
    @mark.it("validates no outputs have placeholder values")
    def test_no_placeholder_values(self):
        # ARRANGE
        placeholder_patterns = ["<", ">", "TODO", "FIXME", "REPLACE", "***"]
        
        # ASSERT
        for key, value in self.outputs.items():
            value_str = str(value)
            for pattern in placeholder_patterns:
                self.assertNotIn(
                    pattern,
                    value_str,
                    f"Output '{key}' contains placeholder pattern '{pattern}'"
                )


if __name__ == "__main__":
    unittest.main()

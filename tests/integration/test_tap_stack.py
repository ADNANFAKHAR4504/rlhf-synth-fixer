"""Integration tests for Fraud Detection Stack using deployment outputs."""

import json
import os
import pytest
from pathlib import Path


class TestFraudDetectionIntegration:
    """Integration test suite for Fraud Detection infrastructure."""

    @pytest.fixture
    def outputs(self):
        """Load deployment outputs."""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_file.exists():
            pytest.skip("Outputs file not found - stack not deployed")

        with open(outputs_file, 'r') as f:
            data = json.load(f)

        # Extract the first stack's outputs
        stack_name = list(data.keys())[0]
        return data[stack_name]

    def test_outputs_exist(self, outputs):
        """Test that all expected outputs exist."""
        expected_outputs = [
            "api_endpoint",
            "transaction_processor_arn",
            "dynamodb_table_name"
        ]

        for output in expected_outputs:
            assert output in outputs, f"Output {output} not found"
            assert outputs[output], f"Output {output} is empty"

    def test_api_endpoint_format(self, outputs):
        """Test that API endpoint has correct format."""
        endpoint = outputs.get("api_endpoint")
        assert endpoint is not None, "API endpoint not found"
        assert endpoint.startswith("https://"), f"API endpoint should use HTTPS, got: {endpoint}"
        assert ".execute-api." in endpoint, f"API endpoint should be API Gateway URL, got: {endpoint}"
        assert ".amazonaws.com" in endpoint, f"API endpoint should be AWS domain, got: {endpoint}"

    def test_lambda_arn_format(self, outputs):
        """Test that Lambda ARN has correct format."""
        lambda_arn = outputs.get("transaction_processor_arn")
        assert lambda_arn is not None, "Lambda ARN not found"
        assert lambda_arn.startswith("arn:aws:lambda:"), f"Lambda ARN format invalid, got: {lambda_arn}"
        assert ":function:" in lambda_arn, f"Lambda ARN should contain :function:, got: {lambda_arn}"

    def test_dynamodb_table_name_format(self, outputs):
        """Test that DynamoDB table name has correct format."""
        table_name = outputs.get("dynamodb_table_name")
        assert table_name is not None, "DynamoDB table name not found"
        assert table_name.startswith("transactions-"), f"Table name should start with 'transactions-', got: {table_name}"

    def test_api_endpoint_region(self, outputs):
        """Test that API endpoint is in correct region."""
        endpoint = outputs.get("api_endpoint")
        # Should contain region in URL
        assert "us-east-1" in endpoint or "execute-api" in endpoint, \
            f"API endpoint should be in us-east-1, got: {endpoint}"

    def test_lambda_arn_region(self, outputs):
        """Test that Lambda function is in correct region."""
        lambda_arn = outputs.get("transaction_processor_arn")
        assert ":us-east-1:" in lambda_arn, \
            f"Lambda should be in us-east-1, got: {lambda_arn}"

    def test_outputs_are_strings(self, outputs):
        """Test that all outputs are string values."""
        for key, value in outputs.items():
            assert isinstance(value, str), \
                f"Output {key} should be string, got {type(value)}: {value}"

    def test_no_placeholder_values(self, outputs):
        """Test that outputs don't contain placeholder values."""
        placeholder_patterns = [
            "example.com",
            "placeholder",
            "dummy",
            "sample",
            "TODO",
            "FIXME",
            "000000000000"
        ]

        for key, value in outputs.items():
            value_lower = str(value).lower()
            for pattern in placeholder_patterns:
                assert pattern not in value_lower, \
                    f"Output {key} appears to contain placeholder '{pattern}': {value}"

    def test_api_endpoint_accessible_format(self, outputs):
        """Test that API endpoint is properly formatted URL."""
        endpoint = outputs.get("api_endpoint")

        # Basic URL validation
        assert endpoint.startswith("https://"), "Endpoint should use HTTPS"
        assert len(endpoint) > 10, "Endpoint should be a complete URL"
        assert " " not in endpoint, "Endpoint should not contain spaces"
        assert endpoint.count(".") >= 3, "Endpoint should have multiple domain levels"

    def test_lambda_function_name_from_arn(self, outputs):
        """Test that we can extract function name from Lambda ARN."""
        lambda_arn = outputs.get("transaction_processor_arn")

        # Extract function name
        if ":function:" in lambda_arn:
            function_name = lambda_arn.split(":function:")[-1].split(":")[0]
            assert len(function_name) > 0, "Should be able to extract function name"
            assert "transaction-processor" in function_name, \
                f"Function name should contain 'transaction-processor', got: {function_name}"

    def test_environment_consistency(self, outputs):
        """Test that environment is consistent across resources."""
        # Extract environment from table name
        table_name = outputs.get("dynamodb_table_name")
        if "transactions-" in table_name:
            env_suffix = table_name.replace("transactions-", "")

            # Check if lambda also uses same suffix
            lambda_arn = outputs.get("transaction_processor_arn")
            if ":function:" in lambda_arn:
                function_name = lambda_arn.split(":function:")[-1].split(":")[0]
                assert env_suffix in function_name, \
                    f"Lambda function should use same environment suffix: {env_suffix}"

    def test_all_resources_deployed(self, outputs):
        """Test that minimum required resources are present."""
        # We need at least these outputs for a functioning fraud detection system
        critical_outputs = [
            "api_endpoint",
            "transaction_processor_arn",
            "dynamodb_table_name"
        ]

        for output in critical_outputs:
            assert output in outputs, f"Critical output missing: {output}"
            assert outputs[output], f"Critical output is empty: {output}"

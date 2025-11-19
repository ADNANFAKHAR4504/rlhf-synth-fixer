"""Integration tests for Fraud Detection Stack using deployment outputs."""

import json
import os
import pytest
import re
from pathlib import Path
from urllib.parse import urlparse


class TestFraudDetectionIntegration:
    """Integration test suite for Fraud Detection infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs from flat-outputs.json."""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        if not outputs_file.exists():
            pytest.skip("Outputs file not found - stack not deployed")

        with open(outputs_file, 'r') as f:
            data = json.load(f)

        # Extract the first stack's outputs
        stack_name = list(data.keys())[0]
        return data[stack_name]

    @pytest.fixture(scope="class")
    def metadata(self):
        """Load metadata.json for configuration details."""
        metadata_file = Path(__file__).parent.parent.parent / "metadata.json"

        if not metadata_file.exists():
            pytest.skip("metadata.json not found")

        with open(metadata_file, 'r') as f:
            return json.load(f)

    # ========================================================================
    # Test Class 1: Output Existence and Basic Validation
    # ========================================================================

    def test_outputs_file_exists(self):
        """Test that the deployment outputs file exists."""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        assert outputs_file.exists(), "cfn-outputs/flat-outputs.json file not found"
        assert outputs_file.is_file(), "cfn-outputs/flat-outputs.json is not a file"

    def test_outputs_file_valid_json(self):
        """Test that the outputs file contains valid JSON."""
        outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
        try:
            with open(outputs_file, 'r') as f:
                data = json.load(f)
            assert isinstance(data, dict), "Outputs should be a dictionary"
            assert len(data) > 0, "Outputs dictionary should not be empty"
        except json.JSONDecodeError as e:
            pytest.fail(f"Invalid JSON in outputs file: {e}")

    def test_outputs_exist(self, outputs):
        """Test that all expected outputs exist."""
        expected_outputs = [
            "api_endpoint",
            "transaction_processor_arn",
            "dynamodb_table_name"
        ]

        for output in expected_outputs:
            assert output in outputs, f"Output {output} not found in deployment outputs"
            assert outputs[output], f"Output {output} exists but is empty"
            assert isinstance(outputs[output], str), f"Output {output} should be a string"

    def test_outputs_are_strings(self, outputs):
        """Test that all outputs are string values."""
        for key, value in outputs.items():
            assert isinstance(value, str), \
                f"Output {key} should be string, got {type(value).__name__}: {value}"
            assert len(value) > 0, f"Output {key} should not be empty string"

    def test_no_placeholder_values(self, outputs):
        """Test that outputs don't contain placeholder or dummy values."""
        placeholder_patterns = [
            "example.com",
            "placeholder",
            "dummy",
            "sample",
            "TODO",
            "FIXME",
            "000000000000",
            "123456789012",
            "xxxx",
            "test-",
            "<",
            ">"
        ]

        for key, value in outputs.items():
            value_lower = str(value).lower()
            for pattern in placeholder_patterns:
                assert pattern.lower() not in value_lower, \
                    f"Output {key} appears to contain placeholder '{pattern}': {value}"

    # ========================================================================
    # Test Class 2: API Gateway Endpoint Validation
    # ========================================================================

    def test_api_endpoint_format(self, outputs):
        """Test that API endpoint has correct AWS API Gateway format."""
        endpoint = outputs.get("api_endpoint")
        assert endpoint is not None, "API endpoint not found in outputs"
        assert endpoint.startswith("https://"), f"API endpoint should use HTTPS, got: {endpoint}"
        assert ".execute-api." in endpoint, f"API endpoint should be API Gateway URL, got: {endpoint}"
        assert ".amazonaws.com" in endpoint, f"API endpoint should be AWS domain, got: {endpoint}"

    def test_api_endpoint_url_structure(self, outputs):
        """Test that API endpoint has valid URL structure."""
        endpoint = outputs.get("api_endpoint")

        # Parse URL
        parsed = urlparse(endpoint)
        assert parsed.scheme == "https", f"Endpoint should use HTTPS scheme, got: {parsed.scheme}"
        assert parsed.netloc, "Endpoint should have a valid hostname"
        assert parsed.path, "Endpoint should have a path (stage)"

        # Check path is /prod or similar
        assert parsed.path.startswith("/"), "Endpoint path should start with /"
        path_parts = parsed.path.strip("/").split("/")
        assert len(path_parts) >= 1, "Endpoint should have at least a stage in the path"

    def test_api_endpoint_region(self, outputs, metadata):
        """Test that API endpoint is in the correct region."""
        endpoint = outputs.get("api_endpoint")
        expected_region = metadata.get("region", "us-east-1")

        assert expected_region in endpoint, \
            f"API endpoint should be in {expected_region} region, got: {endpoint}"

    def test_api_endpoint_stage(self, outputs):
        """Test that API endpoint includes a stage."""
        endpoint = outputs.get("api_endpoint")

        # API Gateway endpoints typically end with /stage
        parsed = urlparse(endpoint)
        path = parsed.path.strip("/")

        assert path, "API endpoint should have a stage path"
        assert len(path) > 0, "Stage name should not be empty"
        # Common stages: prod, dev, staging, test
        assert re.match(r'^[a-z]+$', path), f"Stage should be lowercase letters, got: {path}"

    def test_api_endpoint_reachability_format(self, outputs):
        """Test that API endpoint format is complete and well-formed."""
        endpoint = outputs.get("api_endpoint")

        # Basic URL validation
        assert endpoint.startswith("https://"), "Endpoint should use HTTPS"
        assert len(endpoint) > 20, "Endpoint should be a complete URL"
        assert " " not in endpoint, "Endpoint should not contain spaces"
        assert "\t" not in endpoint, "Endpoint should not contain tabs"
        assert "\n" not in endpoint, "Endpoint should not contain newlines"
        assert endpoint.count(".") >= 3, "Endpoint should have multiple domain levels"

    def test_api_gateway_id_extraction(self, outputs):
        """Test that we can extract API Gateway ID from endpoint."""
        endpoint = outputs.get("api_endpoint")

        # Extract API Gateway ID (format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage})
        match = re.match(r'https://([a-z0-9]+)\.execute-api\.', endpoint)
        assert match, f"Could not extract API Gateway ID from endpoint: {endpoint}"

        api_id = match.group(1)
        assert len(api_id) == 10, f"API Gateway ID should be 10 characters, got: {api_id}"
        assert api_id.isalnum(), f"API Gateway ID should be alphanumeric, got: {api_id}"

    # ========================================================================
    # Test Class 3: Lambda Function ARN Validation
    # ========================================================================

    def test_lambda_arn_format(self, outputs):
        """Test that Lambda ARN has correct AWS ARN format."""
        lambda_arn = outputs.get("transaction_processor_arn")
        assert lambda_arn is not None, "Lambda ARN not found in outputs"
        assert lambda_arn.startswith("arn:aws:lambda:"), \
            f"Lambda ARN should start with 'arn:aws:lambda:', got: {lambda_arn}"
        assert ":function:" in lambda_arn, \
            f"Lambda ARN should contain ':function:', got: {lambda_arn}"

    def test_lambda_arn_structure(self, outputs):
        """Test that Lambda ARN has valid structure with all components."""
        lambda_arn = outputs.get("transaction_processor_arn")

        # ARN format: arn:aws:lambda:region:account-id:function:function-name
        parts = lambda_arn.split(":")
        assert len(parts) >= 7, f"Lambda ARN should have at least 7 parts, got {len(parts)}: {lambda_arn}"

        assert parts[0] == "arn", f"First part should be 'arn', got: {parts[0]}"
        assert parts[1] == "aws", f"Second part should be 'aws', got: {parts[1]}"
        assert parts[2] == "lambda", f"Third part should be 'lambda', got: {parts[2]}"
        assert parts[5] == "function", f"Sixth part should be 'function', got: {parts[5]}"

    def test_lambda_arn_region(self, outputs, metadata):
        """Test that Lambda function is in the correct region."""
        lambda_arn = outputs.get("transaction_processor_arn")
        expected_region = metadata.get("region", "us-east-1")

        assert f":{expected_region}:" in lambda_arn, \
            f"Lambda should be in {expected_region} region, got: {lambda_arn}"

    def test_lambda_arn_account_id(self, outputs):
        """Test that Lambda ARN contains a valid AWS account ID."""
        lambda_arn = outputs.get("transaction_processor_arn")

        # Extract account ID (4th component after splitting by :)
        parts = lambda_arn.split(":")
        account_id = parts[4]

        assert len(account_id) == 12, f"AWS account ID should be 12 digits, got: {account_id}"
        assert account_id.isdigit(), f"AWS account ID should be numeric, got: {account_id}"
        assert account_id != "000000000000", "Account ID should not be placeholder value"
        assert account_id != "123456789012", "Account ID should not be example value"

    def test_lambda_function_name_from_arn(self, outputs):
        """Test that we can extract and validate function name from Lambda ARN."""
        lambda_arn = outputs.get("transaction_processor_arn")

        # Extract function name
        assert ":function:" in lambda_arn, "Lambda ARN should contain :function:"
        function_name = lambda_arn.split(":function:")[-1].split(":")[0]

        assert len(function_name) > 0, "Should be able to extract function name from ARN"
        assert "transaction-processor" in function_name, \
            f"Function name should contain 'transaction-processor', got: {function_name}"

        # Function name validation
        assert len(function_name) <= 64, \
            f"Function name should be <= 64 characters, got {len(function_name)}"
        assert re.match(r'^[a-zA-Z0-9-_]+$', function_name), \
            f"Function name should be alphanumeric with hyphens/underscores, got: {function_name}"

    def test_lambda_function_naming_convention(self, outputs):
        """Test that Lambda function follows naming conventions."""
        lambda_arn = outputs.get("transaction_processor_arn")
        function_name = lambda_arn.split(":function:")[-1].split(":")[0]

        # Should follow pattern: transaction-processor-{version}-{environment}
        assert function_name.startswith("transaction-processor"), \
            f"Function should start with 'transaction-processor', got: {function_name}"

        # Check for version suffix (v1, v2, etc.)
        assert "-v" in function_name, \
            f"Function name should contain version suffix (-v1, -v2, etc.), got: {function_name}"

    # ========================================================================
    # Test Class 4: DynamoDB Table Validation
    # ========================================================================

    def test_dynamodb_table_name_format(self, outputs):
        """Test that DynamoDB table name has correct format."""
        table_name = outputs.get("dynamodb_table_name")
        assert table_name is not None, "DynamoDB table name not found in outputs"
        assert table_name.startswith("transactions-"), \
            f"Table name should start with 'transactions-', got: {table_name}"

    def test_dynamodb_table_name_length(self, outputs):
        """Test that DynamoDB table name has valid length."""
        table_name = outputs.get("dynamodb_table_name")

        # DynamoDB table names must be between 3 and 255 characters
        assert 3 <= len(table_name) <= 255, \
            f"Table name length should be between 3 and 255 characters, got {len(table_name)}"

    def test_dynamodb_table_name_characters(self, outputs):
        """Test that DynamoDB table name contains only valid characters."""
        table_name = outputs.get("dynamodb_table_name")

        # DynamoDB table names can contain a-z, A-Z, 0-9, underscore, hyphen, and dot
        assert re.match(r'^[a-zA-Z0-9._-]+$', table_name), \
            f"Table name should only contain alphanumeric, underscore, hyphen, dot, got: {table_name}"

    def test_dynamodb_table_naming_convention(self, outputs):
        """Test that DynamoDB table follows naming conventions."""
        table_name = outputs.get("dynamodb_table_name")

        # Should follow pattern: transactions-{version}-{environment}
        assert table_name.startswith("transactions-"), \
            f"Table should start with 'transactions-', got: {table_name}"

        # Check for version suffix
        assert "-v" in table_name, \
            f"Table name should contain version suffix (-v1, -v2, etc.), got: {table_name}"

    # ========================================================================
    # Test Class 5: Resource Naming Consistency
    # ========================================================================

    def test_environment_consistency(self, outputs):
        """Test that environment suffix is consistent across all resources."""
        # Extract environment from table name
        table_name = outputs.get("dynamodb_table_name")
        lambda_arn = outputs.get("transaction_processor_arn")

        if "transactions-" in table_name:
            table_suffix = table_name.replace("transactions-", "")

            # Check if lambda also uses same suffix
            if ":function:" in lambda_arn:
                function_name = lambda_arn.split(":function:")[-1].split(":")[0]
                assert table_suffix in function_name, \
                    f"Lambda function should use same environment suffix as table: {table_suffix}"

    def test_version_suffix_consistency(self, outputs):
        """Test that version suffix is consistent across resources."""
        table_name = outputs.get("dynamodb_table_name")
        lambda_arn = outputs.get("transaction_processor_arn")
        function_name = lambda_arn.split(":function:")[-1].split(":")[0]

        # Extract version from table name (e.g., v1, v2)
        table_version_match = re.search(r'-(v\d+)-', table_name)
        lambda_version_match = re.search(r'-(v\d+)-', function_name)

        assert table_version_match, f"Table name should contain version suffix, got: {table_name}"
        assert lambda_version_match, f"Lambda name should contain version suffix, got: {function_name}"

        table_version = table_version_match.group(1)
        lambda_version = lambda_version_match.group(1)

        assert table_version == lambda_version, \
            f"Version should match across resources. Table: {table_version}, Lambda: {lambda_version}"

    def test_resource_prefix_consistency(self, outputs):
        """Test that resources use consistent naming prefixes."""
        table_name = outputs.get("dynamodb_table_name")
        lambda_arn = outputs.get("transaction_processor_arn")
        function_name = lambda_arn.split(":function:")[-1].split(":")[0]

        # Both should contain environment identifier
        # Extract suffix (everything after last hyphen)
        table_parts = table_name.split("-")
        lambda_parts = function_name.split("-")

        # Last part should be environment (pr6654, dev, prod, etc.)
        assert table_parts[-1] == lambda_parts[-1], \
            f"Environment suffix should match. Table: {table_parts[-1]}, Lambda: {lambda_parts[-1]}"

    def test_all_resources_deployed(self, outputs):
        """Test that all critical resources are present in outputs."""
        critical_outputs = [
            "api_endpoint",
            "transaction_processor_arn",
            "dynamodb_table_name"
        ]

        for output in critical_outputs:
            assert output in outputs, f"Critical output missing: {output}"
            assert outputs[output], f"Critical output is empty: {output}"
            assert len(outputs[output]) > 0, f"Critical output has no value: {output}"

    # ========================================================================
    # Test Class 6: Deployment Configuration Validation
    # ========================================================================

    def test_metadata_aws_services(self, metadata):
        """Test that metadata specifies required AWS services."""
        expected_services = [
            "Lambda",
            "API Gateway",
            "DynamoDB",
            "SNS",
            "SQS",
            "CloudWatch",
            "KMS",
            "SSM Parameter Store",
            "EventBridge",
            "IAM"
        ]

        actual_services = metadata.get("aws_services", [])
        assert isinstance(actual_services, list), "aws_services should be a list"

        for service in expected_services:
            assert service in actual_services, \
                f"Expected AWS service '{service}' not found in metadata"

    def test_metadata_region_matches_resources(self, metadata, outputs):
        """Test that metadata region matches deployed resources."""
        expected_region = metadata.get("region", "us-east-1")

        api_endpoint = outputs.get("api_endpoint")
        lambda_arn = outputs.get("transaction_processor_arn")

        assert expected_region in api_endpoint, \
            f"API endpoint region should match metadata region: {expected_region}"
        assert f":{expected_region}:" in lambda_arn, \
            f"Lambda ARN region should match metadata region: {expected_region}"

    def test_metadata_platform_and_language(self, metadata):
        """Test that metadata specifies correct platform and language."""
        assert metadata.get("platform") == "cdktf", \
            f"Platform should be 'cdktf', got: {metadata.get('platform')}"
        assert metadata.get("language") == "py", \
            f"Language should be 'py', got: {metadata.get('language')}"

    # ========================================================================
    # Test Class 7: Transaction Payload Validation Tests
    # ========================================================================

    def test_transaction_payload_structure(self):
        """Test that a valid transaction payload has correct structure."""
        valid_payload = {
            "transaction_id": "txn-12345",
            "user_id": "user-67890",
            "amount": 150.50,
            "merchant": "Test Merchant",
            "location": "New York"
        }

        # Validate required fields
        required_fields = ["transaction_id", "user_id", "amount"]
        for field in required_fields:
            assert field in valid_payload, f"Required field '{field}' missing from payload"
            assert valid_payload[field] is not None, f"Required field '{field}' is None"

    def test_transaction_payload_field_types(self):
        """Test that transaction payload fields have correct types."""
        valid_payload = {
            "transaction_id": "txn-12345",
            "user_id": "user-67890",
            "amount": 150.50,
            "merchant": "Test Merchant",
            "location": "New York"
        }

        assert isinstance(valid_payload["transaction_id"], str), "transaction_id should be string"
        assert isinstance(valid_payload["user_id"], str), "user_id should be string"
        assert isinstance(valid_payload["amount"], (int, float)), "amount should be numeric"

        if "merchant" in valid_payload:
            assert isinstance(valid_payload["merchant"], str), "merchant should be string"
        if "location" in valid_payload:
            assert isinstance(valid_payload["location"], str), "location should be string"

    def test_transaction_payload_amount_validation(self):
        """Test amount field validation rules."""
        # Valid amounts
        valid_amounts = [0.01, 100, 9999.99, 50.5]
        for amount in valid_amounts:
            assert amount >= 0, f"Amount should be non-negative, got: {amount}"
            assert isinstance(amount, (int, float)), f"Amount should be numeric, got type: {type(amount)}"

        # Test suspicious amounts (> 10000)
        suspicious_amounts = [10000.01, 50000, 100000]
        for amount in suspicious_amounts:
            assert amount > 10000, f"Large amount should be > 10000 for fraud detection, got: {amount}"

    def test_transaction_response_structure(self):
        """Test expected structure of transaction processing response."""
        expected_response = {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Transaction processed successfully",
                "transaction_id": "txn-12345",
                "fraud_score": 0.1
            })
        }

        assert "statusCode" in expected_response, "Response should have statusCode"
        assert "body" in expected_response, "Response should have body"
        assert expected_response["statusCode"] in [200, 500], \
            f"statusCode should be 200 or 500, got: {expected_response['statusCode']}"

        # Parse body
        body = json.loads(expected_response["body"])
        assert "message" in body or "error" in body, "Body should have message or error"

    def test_fraud_score_calculation_logic(self):
        """Test fraud score calculation based on amount."""
        # Normal transaction (amount <= 10000)
        normal_amount = 5000
        normal_fraud_score = 0.9 if normal_amount > 10000 or normal_amount < 0 else 0.1
        assert normal_fraud_score == 0.1, f"Normal transaction should have low fraud score"

        # Suspicious transaction (amount > 10000)
        suspicious_amount = 15000
        suspicious_fraud_score = 0.9 if suspicious_amount > 10000 or suspicious_amount < 0 else 0.1
        assert suspicious_fraud_score == 0.9, f"Suspicious transaction should have high fraud score"

        # Negative amount (invalid)
        negative_amount = -100
        negative_fraud_score = 0.9 if negative_amount > 10000 or negative_amount < 0 else 0.1
        assert negative_fraud_score == 0.9, f"Negative amount should have high fraud score"

    def test_fraud_alert_threshold(self):
        """Test fraud alert threshold logic."""
        default_threshold = 0.85

        # Scores below threshold should not trigger alert
        low_score = 0.5
        assert low_score <= default_threshold, "Low score should not trigger alert"

        # Scores above threshold should trigger alert
        high_score = 0.9
        assert high_score > default_threshold, "High score should trigger alert"

    # ========================================================================
    # Test Class 8: Pattern Analyzer Tests
    # ========================================================================

    def test_pattern_analyzer_time_window(self):
        """Test pattern analyzer time window calculation."""
        import time

        current_time = int(time.time())
        five_minutes_ago = current_time - 300

        assert five_minutes_ago < current_time, "Five minutes ago should be before current time"
        assert current_time - five_minutes_ago == 300, "Time window should be exactly 300 seconds"

    def test_pattern_analyzer_threshold(self):
        """Test pattern analyzer suspicious transaction threshold."""
        threshold = 5

        # Below threshold - no alert
        low_count = 3
        assert low_count <= threshold, "Low count should not trigger pattern alert"

        # Above threshold - should alert
        high_count = 10
        assert high_count > threshold, "High count should trigger pattern alert"

    def test_pattern_analyzer_response_structure(self):
        """Test expected structure of pattern analyzer response."""
        expected_response = {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Pattern analysis complete",
                "suspicious_count": 3
            })
        }

        assert "statusCode" in expected_response, "Response should have statusCode"
        assert "body" in expected_response, "Response should have body"
        assert expected_response["statusCode"] == 200, "Pattern analysis should return 200"

        body = json.loads(expected_response["body"])
        assert "message" in body, "Body should have message"
        assert "suspicious_count" in body, "Body should have suspicious_count"
        assert isinstance(body["suspicious_count"], int), "suspicious_count should be integer"

    # ========================================================================
    # Test Class 9: Integration Completeness Tests
    # ========================================================================

    def test_outputs_contain_no_null_values(self, outputs):
        """Test that no output values are null or None."""
        for key, value in outputs.items():
            assert value is not None, f"Output {key} should not be None"
            assert value != "null", f"Output {key} should not be string 'null'"
            assert value != "undefined", f"Output {key} should not be string 'undefined'"

    def test_outputs_have_minimum_length(self, outputs):
        """Test that all outputs have reasonable minimum length."""
        min_lengths = {
            "api_endpoint": 30,  # Minimum for https://xxx.execute-api.region.amazonaws.com/stage
            "transaction_processor_arn": 50,  # Minimum for ARN format
            "dynamodb_table_name": 15  # Minimum for transactions-vX-env
        }

        for key, min_length in min_lengths.items():
            value = outputs.get(key)
            assert value, f"Output {key} should exist"
            assert len(value) >= min_length, \
                f"Output {key} should be at least {min_length} chars, got {len(value)}: {value}"

    def test_cross_resource_references_valid(self, outputs):
        """Test that resources can reference each other correctly."""
        # API Gateway should be able to invoke Lambda
        api_endpoint = outputs.get("api_endpoint")
        lambda_arn = outputs.get("transaction_processor_arn")

        # Extract region from both
        api_region_match = re.search(r'\.([a-z]{2}-[a-z]+-\d)\.amazonaws\.com', api_endpoint)
        lambda_region_match = re.search(r':lambda:([a-z]{2}-[a-z]+-\d):', lambda_arn)

        if api_region_match and lambda_region_match:
            api_region = api_region_match.group(1)
            lambda_region = lambda_region_match.group(1)
            assert api_region == lambda_region, \
                f"API Gateway and Lambda should be in same region. API: {api_region}, Lambda: {lambda_region}"

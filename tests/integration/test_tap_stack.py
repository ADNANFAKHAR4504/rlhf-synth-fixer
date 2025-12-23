import json
import os
import time
import unittest

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# LocalStack configuration
LOCALSTACK_ENDPOINT = os.environ.get("LOCALSTACK_ENDPOINT", "http://localhost:4566")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, "..", "..", "cfn-outputs", "flat-outputs.json"
)

DEPLOYMENT_OUTPUTS_AVAILABLE = os.path.exists(flat_outputs_path)

if DEPLOYMENT_OUTPUTS_AVAILABLE:
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}


def get_localstack_client(service_name):
    """Create a boto3 client configured for LocalStack"""
    return boto3.client(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name=AWS_REGION,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
    )


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack that test live AWS resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and get stack outputs once for all tests"""
        cls.region = AWS_REGION
        environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        cls.stack_name = f"TapStack{environment_suffix}"

        # Use flat_outputs as the source of truth
        cls.stack_outputs = flat_outputs

        # Extract outputs if available
        cls.website_url = cls.stack_outputs.get("WebsiteURL")
        cls.lambda_function_name = cls.stack_outputs.get("LambdaFunctionName")
        cls.lambda_function_arn = cls.stack_outputs.get("LambdaFunctionARN")
        cls.s3_bucket_name = cls.stack_outputs.get("S3BucketName")
        cls.cloudfront_distribution_id = cls.stack_outputs.get(
            "CloudFrontDistributionId"
        )

        # Initialize AWS clients configured for LocalStack
        if DEPLOYMENT_OUTPUTS_AVAILABLE:
            cls.lambda_client = get_localstack_client("lambda")
            cls.s3_client = get_localstack_client("s3")
            cls.cloudfront_client = get_localstack_client("cloudfront")
        else:
            cls.lambda_client = None
            cls.s3_client = None
            cls.cloudfront_client = None

    def setUp(self):
        """Skip all tests if deployment outputs are not available"""
        if not DEPLOYMENT_OUTPUTS_AVAILABLE:
            self.skipTest(
                "Integration tests require deployment outputs in cfn-outputs/flat-outputs.json"
            )

    @mark.it("retrieves stack outputs successfully")
    def test_stack_outputs_exist(self):
        """Test that all required stack outputs are available"""
        required_outputs = [
            "WebsiteURL",
            "LambdaFunctionName",
            "LambdaFunctionARN",
            "S3BucketName",
            "CloudFrontDistributionId",
        ]

        for output_key in required_outputs:
            self.assertIn(
                output_key, flat_outputs, f"Missing stack output: {output_key}"
            )
            self.assertIsNotNone(
                flat_outputs[output_key], f"Stack output {output_key} is None"
            )

    @mark.it("can access CloudFront website and get index page")
    def test_cloudfront_website_index_page(self):
        """Test that the CloudFront distribution serves the index page correctly"""
        website_url = flat_outputs.get("WebsiteURL")
        if not website_url:
            self.skipTest("WebsiteURL not available in deployment outputs")

        # Accept both real CloudFront and LocalStack CloudFront URLs
        is_valid_cloudfront = (
            "cloudfront.net" in website_url
            or "cloudfront.localhost.localstack.cloud" in website_url
        )
        self.assertTrue(
            is_valid_cloudfront, "Website URL should be a CloudFront distribution"
        )

        try:
            response = requests.get(website_url, timeout=30)
            self.assertEqual(
                response.status_code, 200, "Website should return 200 status code"
            )

            # Verify content type
            self.assertIn("text/html", response.headers.get("content-type", "").lower())

            # Verify expected content in the HTML
            content = response.text
            self.assertIn("AWS CDK Static Website", content, "Expected title not found")
            self.assertIn(
                "Test Lambda Function", content, "Lambda test button not found"
            )
            self.assertIn(
                "Welcome to your static website", content, "Welcome message not found"
            )

        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to access website: {e}")

    @mark.it("returns custom error page for non-existent URLs")
    def test_cloudfront_error_page(self):
        """Test that CloudFront serves the custom error page for non-existent URLs"""
        website_url = flat_outputs.get("WebsiteURL")
        if not website_url:
            self.skipTest("WebsiteURL not available in deployment outputs")

        try:
            # Try to access a non-existent page
            non_existent_url = f"{website_url}/non-existent-page"
            response = requests.get(non_existent_url, timeout=30)

            # CloudFront is configured to return 200 with error.html for 404/403 errors
            self.assertEqual(
                response.status_code,
                200,
                "CloudFront should return 200 with custom error page",
            )

            # Verify it's serving the error page
            content = response.text
            self.assertIn("Page Not Found", content, "Error page title not found")
            self.assertIn("404", content, "404 error code not found")
            self.assertIn("Go to Homepage", content, "Homepage link not found")

        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to test error page: {e}")

    @mark.it("can invoke Lambda function directly")
    def test_lambda_function_invocation(self):
        """Test direct invocation of the Lambda function"""
        lambda_function_name = flat_outputs.get("LambdaFunctionName")
        s3_bucket_name = flat_outputs.get("S3BucketName")

        if not lambda_function_name:
            self.skipTest("LambdaFunctionName not available in deployment outputs")

        try:
            # Prepare test event
            test_event = {
                "httpMethod": "GET",
                "path": "/test",
                "headers": {"User-Agent": "integration-test"},
                "body": None,
            }

            # Invoke the Lambda function
            response = self.lambda_client.invoke(
                FunctionName=lambda_function_name,
                InvocationType="RequestResponse",
                Payload=json.dumps(test_event),
            )

            # Verify response
            self.assertEqual(
                response["StatusCode"], 200, "Lambda invocation should succeed"
            )

            # Parse the response payload
            payload_raw = response["Payload"].read()
            payload = json.loads(payload_raw)

            # Check for Lambda function errors
            if "FunctionError" in response:
                self.fail(
                    f"Lambda function error: {response['FunctionError']}, Payload: {payload_raw}"
                )

            # Handle both successful and error responses
            if "errorMessage" in payload:
                self.fail(
                    f"Lambda execution error: {payload.get('errorMessage', 'Unknown error')}"
                )

            # Check if this is a proper HTTP response structure
            if "statusCode" not in payload:
                self.fail(
                    f"Lambda response missing statusCode. Full response: {payload}"
                )

            self.assertEqual(
                payload["statusCode"], 200, "Lambda should return 200 status code"
            )

            # Parse the response body - handle both string and dict
            response_body = payload.get("body")
            if isinstance(response_body, str):
                response_body = json.loads(response_body)
            elif not isinstance(response_body, dict):
                self.fail(f"Unexpected response body type: {type(response_body)}")

            # Verify expected fields in response
            self.assertIn("message", response_body, "Response should contain message")
            self.assertIn(
                "timestamp", response_body, "Response should contain timestamp"
            )
            self.assertIn(
                "request_id", response_body, "Response should contain request_id"
            )
            self.assertIn(
                "function_name", response_body, "Response should contain function_name"
            )
            self.assertIn(
                "website_bucket",
                response_body,
                "Response should contain website_bucket",
            )

            # Verify the function name matches
            self.assertEqual(response_body["function_name"], lambda_function_name)

            # Verify the bucket name matches
            if s3_bucket_name:
                self.assertEqual(response_body["website_bucket"], s3_bucket_name)

        except ClientError as e:
            self.fail(f"Failed to invoke Lambda function: {e}")
        except json.JSONDecodeError as e:
            self.fail(f"Failed to parse Lambda response JSON: {e}")

    @mark.it("can list objects in S3 bucket")
    def test_s3_bucket_objects(self):
        """Test that S3 bucket contains the expected static content"""
        s3_bucket_name = flat_outputs.get("S3BucketName")
        if not s3_bucket_name:
            self.skipTest("S3BucketName not available in deployment outputs")

        try:
            # List objects in the bucket
            response = self.s3_client.list_objects_v2(Bucket=s3_bucket_name)

            self.assertIn("Contents", response, "Bucket should contain objects")

            # Get list of object keys
            object_keys = [obj["Key"] for obj in response["Contents"]]

            # Verify expected files are present
            expected_files = ["index.html", "error.html"]
            for expected_file in expected_files:
                self.assertIn(
                    expected_file,
                    object_keys,
                    f"Expected file {expected_file} not found in bucket",
                )

        except ClientError as e:
            self.fail(f"Failed to list S3 bucket objects: {e}")

    @mark.it("can retrieve and verify S3 object content")
    def test_s3_object_content(self):
        """Test that S3 objects contain expected content"""
        s3_bucket_name = flat_outputs.get("S3BucketName")
        if not s3_bucket_name:
            self.skipTest("S3BucketName not available in deployment outputs")

        try:
            # Test index.html content
            index_response = self.s3_client.get_object(
                Bucket=s3_bucket_name, Key="index.html"
            )
            index_content = index_response["Body"].read().decode("utf-8")

            self.assertIn(
                "AWS CDK Static Website",
                index_content,
                "Index.html should contain expected title",
            )
            self.assertIn(
                "Test Lambda Function",
                index_content,
                "Index.html should contain Lambda test button",
            )

            # Test error.html content
            error_response = self.s3_client.get_object(
                Bucket=s3_bucket_name, Key="error.html"
            )
            error_content = error_response["Body"].read().decode("utf-8")

            self.assertIn(
                "Page Not Found",
                error_content,
                "Error.html should contain expected title",
            )
            self.assertIn("404", error_content, "Error.html should contain 404 code")

        except ClientError as e:
            self.fail(f"Failed to retrieve S3 object content: {e}")

    @mark.it("verifies Lambda function has correct configuration")
    def test_lambda_function_configuration(self):
        """Test Lambda function configuration and environment variables"""
        lambda_function_name = flat_outputs.get("LambdaFunctionName")
        s3_bucket_name = flat_outputs.get("S3BucketName")

        if not lambda_function_name:
            self.skipTest("LambdaFunctionName not available in deployment outputs")

        try:
            # Get function configuration
            response = self.lambda_client.get_function(
                FunctionName=lambda_function_name
            )
            config = response["Configuration"]

            # Verify runtime and handler
            self.assertEqual(
                config["Runtime"], "python3.12", "Lambda should use Python 3.12 runtime"
            )
            self.assertEqual(
                config["Handler"],
                "handler.lambda_handler",
                "Lambda handler should be correct",
            )

            # Verify timeout and memory
            self.assertEqual(
                config["Timeout"], 30, "Lambda timeout should be 30 seconds"
            )
            self.assertEqual(
                config["MemorySize"], 128, "Lambda memory should be 128 MB"
            )

            # Verify environment variables
            env_vars = config.get("Environment", {}).get("Variables", {})
            self.assertIn(
                "WEBSITE_BUCKET",
                env_vars,
                "Lambda should have WEBSITE_BUCKET environment variable",
            )
            if s3_bucket_name:
                self.assertEqual(
                    env_vars["WEBSITE_BUCKET"],
                    s3_bucket_name,
                    "WEBSITE_BUCKET should match S3 bucket name",
                )

        except ClientError as e:
            self.fail(f"Failed to get Lambda function configuration: {e}")

    @mark.it("verifies CloudFront distribution configuration")
    def test_cloudfront_distribution_configuration(self):
        """Test CloudFront distribution configuration"""
        distribution_id = flat_outputs.get("CloudFrontDistributionId")
        if not distribution_id:
            self.skipTest(
                "CloudFrontDistributionId not available in deployment outputs"
            )

        try:
            # Get distribution configuration
            response = self.cloudfront_client.get_distribution(Id=distribution_id)
            config = response["Distribution"]["DistributionConfig"]

            # Verify default root object
            self.assertEqual(
                config["DefaultRootObject"],
                "index.html",
                "Default root object should be index.html",
            )

            # Verify custom error responses
            error_responses = config.get("CustomErrorResponses", {}).get("Items", [])
            self.assertTrue(
                len(error_responses) > 0, "Should have custom error responses"
            )

            # Check for 404 error response
            error_404 = next(
                (err for err in error_responses if err["ErrorCode"] == 404), None
            )
            self.assertIsNotNone(
                error_404, "Should have 404 error response configuration"
            )
            response_code = error_404["ResponseCode"]
            self.assertEqual(str(response_code), "200", "404 should redirect to 200")
            self.assertEqual(
                error_404["ResponsePagePath"],
                "/error.html",
                "404 should serve error.html",
            )

        except ClientError as e:
            self.fail(f"Failed to get CloudFront distribution configuration: {e}")

    @mark.it("verifies S3 bucket is private and secure")
    def test_s3_bucket_security(self):
        """Test that S3 bucket is properly secured with blocked public access"""
        s3_bucket_name = flat_outputs.get("S3BucketName")
        if not s3_bucket_name:
            self.skipTest("S3BucketName not available in deployment outputs")

        try:
            # Verify public access is blocked
            response = self.s3_client.get_public_access_block(Bucket=s3_bucket_name)
            config = response["PublicAccessBlockConfiguration"]

            # All public access should be blocked for security
            self.assertTrue(
                config.get("BlockPublicAcls", False), "BlockPublicAcls should be True"
            )
            self.assertTrue(
                config.get("IgnorePublicAcls", False), "IgnorePublicAcls should be True"
            )
            self.assertTrue(
                config.get("BlockPublicPolicy", False),
                "BlockPublicPolicy should be True",
            )
            self.assertTrue(
                config.get("RestrictPublicBuckets", False),
                "RestrictPublicBuckets should be True",
            )

            # Verify no public bucket policy exists
            try:
                self.s3_client.get_bucket_policy(Bucket=s3_bucket_name)
                # If we get here, there's a bucket policy - verify it doesn't allow public access
                # For now, we'll just note that a policy exists
            except ClientError as e:
                if e.response["Error"]["Code"] == "NoSuchBucketPolicy":
                    # No bucket policy is fine for private access
                    pass
                else:
                    raise

        except ClientError as e:
            self.fail(f"Failed to verify S3 bucket security configuration: {e}")

    @mark.it("tests end-to-end website and Lambda integration")
    def test_website_lambda_integration(self):
        """Test the integration between website and Lambda function through multiple requests"""
        website_url = flat_outputs.get("WebsiteURL")
        lambda_function_name = flat_outputs.get("LambdaFunctionName")

        if not website_url:
            self.skipTest("WebsiteURL not available in deployment outputs")
        if not lambda_function_name:
            self.skipTest("LambdaFunctionName not available in deployment outputs")

        try:
            # First, verify website is accessible
            website_response = requests.get(website_url, timeout=30)
            self.assertEqual(
                website_response.status_code, 200, "Website should be accessible"
            )

            # Then test multiple Lambda invocations to ensure consistency
            for i in range(3):
                test_event = {
                    "httpMethod": "GET",
                    "path": f"/test-{i}",
                    "headers": {"User-Agent": f"integration-test-{i}"},
                    "queryStringParameters": {"iteration": str(i)},
                }

                response = self.lambda_client.invoke(
                    FunctionName=lambda_function_name,
                    InvocationType="RequestResponse",
                    Payload=json.dumps(test_event),
                )

                self.assertEqual(
                    response["StatusCode"], 200, f"Lambda invocation {i} should succeed"
                )

                payload_raw = response["Payload"].read()
                payload = json.loads(payload_raw)

                # Check for errors
                if "FunctionError" in response:
                    self.fail(
                        f"Lambda function error on iteration {i}: {response['FunctionError']}"
                    )

                if "errorMessage" in payload:
                    self.fail(
                        f"Lambda execution error on iteration {i}: {payload.get('errorMessage')}"
                    )

                if "statusCode" not in payload:
                    self.fail(
                        f"Lambda response missing statusCode on iteration {i}. Full response: {payload}"
                    )

                self.assertEqual(
                    payload["statusCode"], 200, f"Lambda response {i} should be 200"
                )

                response_body = payload.get("body")
                if isinstance(response_body, str):
                    response_body = json.loads(response_body)

                self.assertIn(
                    "message", response_body, f"Response {i} should contain message"
                )
                self.assertIn(
                    "timestamp", response_body, f"Response {i} should contain timestamp"
                )
                # Small delay between requests
                time.sleep(0.5)

        except (requests.exceptions.RequestException, ClientError) as e:
            self.fail(f"Failed in end-to-end integration test: {e}")

    @mark.it("tests Lambda response structure")
    def test_lambda_response_structure(self):
        """Test that the Lambda function returns the expected response structure"""
        lambda_function_name = flat_outputs.get("LambdaFunctionName")
        if not lambda_function_name:
            self.skipTest("LambdaFunctionName not available in deployment outputs")

        test_event = {
            "httpMethod": "GET",
            "path": "/test-lambda-response",
            "headers": {"User-Agent": "integration-test"},
            "queryStringParameters": {"check": "structure"},
        }

        try:
            response = self.lambda_client.invoke(
                FunctionName=lambda_function_name,
                InvocationType="RequestResponse",
                Payload=json.dumps(test_event),
            )

            self.assertEqual(
                response["StatusCode"], 200, "Lambda invocation should succeed"
            )

            payload_raw = response["Payload"].read()
            payload = json.loads(payload_raw)

            # Check for errors
            if "FunctionError" in response:
                self.fail(f"Lambda function error: {response['FunctionError']}")

            if "errorMessage" in payload:
                self.fail(f"Lambda execution error: {payload.get('errorMessage')}")

            self.assertIn(
                "statusCode", payload, "Lambda response should include statusCode"
            )
            self.assertEqual(
                payload["statusCode"], 200, "Lambda response statusCode should be 200"
            )

            response_body = payload.get("body")
            if isinstance(response_body, str):
                response_body = json.loads(response_body)

            self.assertIsInstance(response_body, dict, "Response body should be a dict")
            self.assertIn(
                "message", response_body, "Response body should contain 'message'"
            )
            self.assertIn(
                "timestamp", response_body, "Response body should contain 'timestamp'"
            )

        except ClientError as e:
            self.fail(f"Failed to test Lambda response structure: {e}")


if __name__ == "__main__":
    unittest.main()

# Serverless Currency Exchange API - Pulumi Python Implementation

This implementation creates a serverless currency exchange API using AWS Lambda, API Gateway, and supporting services with full observability and security.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class for a serverless currency exchange API.
It creates Lambda function, API Gateway, IAM roles, and monitoring infrastructure.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless currency exchange API.

    This component creates:
    - Lambda function for currency conversion
    - API Gateway REST API with /convert endpoint
    - IAM execution role with CloudWatch permissions
    - X-Ray tracing configuration
    - API Gateway logging
    - Request throttling and CORS configuration

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Merge default tags with provided tags
        self.tags = {
            "Environment": "production",
            "Service": "currency-api",
            **args.tags
        }

        # Generate random ID for Lambda function name
        random_id = pulumi.Output.concat(
            "lambda-",
            pulumi.Config().name,
            "-",
            self.environment_suffix
        )

        # Create IAM role for Lambda execution
        self.lambda_role = aws.iam.Role(
            f"currency-converter-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for CloudWatch Logs (least privilege)
        self.lambda_logs_policy_attachment = aws.iam.RolePolicyAttachment(
            f"currency-converter-logs-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Attach AWS managed policy for X-Ray tracing
        self.lambda_xray_policy_attachment = aws.iam.RolePolicyAttachment(
            f"currency-converter-xray-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Lambda function code for currency conversion
        lambda_code = """
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const body = JSON.parse(event.body || '{}');
        const { from, to, amount } = body;

        // Input validation
        if (!from || !to || !amount) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*.example.com'
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: from, to, amount'
                })
            };
        }

        // Mock exchange rate calculation (replace with real API call)
        const rate = 1.18; // EUR to USD example
        const convertedAmount = parseFloat(amount) * rate;
        const precision = parseInt(process.env.RATE_PRECISION || '2');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*.example.com'
            },
            body: JSON.stringify({
                from: from,
                to: to,
                amount: parseFloat(amount),
                rate: rate,
                converted: parseFloat(convertedAmount.toFixed(precision)),
                apiVersion: process.env.API_VERSION
            })
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*.example.com'
            },
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};
"""

        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"currency-converter-{self.environment_suffix}",
            role=self.lambda_role.arn,
            runtime="nodejs18.x",
            handler="index.handler",
            memory_size=1024,  # 1GB
            timeout=10,
            reserved_concurrent_executions=100,
            code=pulumi.AssetArchive({
                "index.js": pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "API_VERSION": "v1",
                    "RATE_PRECISION": "2"
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"  # Enable X-Ray tracing
            ),
            tags=self.tags,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.lambda_logs_policy_attachment, self.lambda_xray_policy_attachment]
            )
        )

        # Create API Gateway REST API
        self.api_gateway = aws.apigateway.RestApi(
            f"currency-api-{self.environment_suffix}",
            name=f"currency-exchange-api-{self.environment_suffix}",
            description="REST API for currency exchange rate calculations",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create /convert resource
        self.api_resource = aws.apigateway.Resource(
            f"convert-resource-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="convert",
            opts=ResourceOptions(parent=self.api_gateway)
        )

        # Create POST method for /convert
        self.api_method = aws.apigateway.Method(
            f"convert-post-method-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,  # Require API key for throttling
            opts=ResourceOptions(parent=self.api_resource)
        )

        # Create Lambda integration
        self.api_integration = aws.apigateway.Integration(
            f"convert-lambda-integration-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",  # Lambda proxy integration
            uri=self.lambda_function.invoke_arn,
            opts=ResourceOptions(parent=self.api_method)
        )

        # Enable CORS - OPTIONS method
        self.api_options_method = aws.apigateway.Method(
            f"convert-options-method-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method="OPTIONS",
            authorization="NONE",
            opts=ResourceOptions(parent=self.api_resource)
        )

        # CORS mock integration
        self.api_options_integration = aws.apigateway.Integration(
            f"convert-options-integration-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_options_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            },
            opts=ResourceOptions(parent=self.api_options_method)
        )

        # CORS response for OPTIONS
        self.api_options_response = aws.apigateway.MethodResponse(
            f"convert-options-response-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_options_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Origin": True
            },
            opts=ResourceOptions(parent=self.api_options_integration)
        )

        # CORS integration response
        self.api_options_integration_response = aws.apigateway.IntegrationResponse(
            f"convert-options-integration-response-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_options_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*.example.com'"
            },
            opts=ResourceOptions(parent=self.api_options_response)
        )

        # Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"api-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                self.api_gateway.execution_arn,
                "/*/*"
            ),
            opts=ResourceOptions(parent=self.lambda_function)
        )

        # Create CloudWatch log group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"api-gateway-logs-{self.environment_suffix}",
            name=pulumi.Output.concat("/aws/apigateway/", self.api_gateway.name),
            retention_in_days=7,
            tags=self.tags,
            opts=ResourceOptions(parent=self.api_gateway)
        )

        # Create IAM role for API Gateway logging
        self.api_gateway_role = aws.iam.Role(
            f"api-gateway-logging-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "apigateway.amazonaws.com"
                    }
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach CloudWatch policy to API Gateway role
        self.api_gateway_logging_policy = aws.iam.RolePolicyAttachment(
            f"api-gateway-logging-policy-{self.environment_suffix}",
            role=self.api_gateway_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
            opts=ResourceOptions(parent=self.api_gateway_role)
        )

        # Set account-level API Gateway settings for logging
        self.api_account = aws.apigateway.Account(
            f"api-gateway-account-{self.environment_suffix}",
            cloudwatch_role_arn=self.api_gateway_role.arn,
            opts=ResourceOptions(
                parent=self.api_gateway_role,
                depends_on=[self.api_gateway_logging_policy]
            )
        )

        # Deploy API with X-Ray tracing enabled
        self.api_deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            description=f"Deployment for currency exchange API {self.environment_suffix}",
            opts=ResourceOptions(
                parent=self.api_gateway,
                depends_on=[
                    self.api_integration,
                    self.api_options_integration_response,
                    self.lambda_permission
                ]
            )
        )

        # Create API Gateway stage with logging and X-Ray
        self.api_stage = aws.apigateway.Stage(
            f"api-stage-v1-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            deployment=self.api_deployment.id,
            stage_name="v1",
            xray_tracing_enabled=True,  # Enable X-Ray tracing
            variables={
                "environment": self.environment_suffix
            },
            access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
                destination_arn=self.api_log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            ),
            tags=self.tags,
            opts=ResourceOptions(
                parent=self.api_deployment,
                depends_on=[self.api_log_group, self.api_account]
            )
        )

        # Configure method settings for logging
        self.method_settings = aws.apigateway.MethodSettings(
            f"api-method-settings-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            stage_name=self.api_stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                logging_level="INFO",
                data_trace_enabled=True,
                metrics_enabled=True,
                throttling_burst_limit=5000,
                throttling_rate_limit=5000  # 5000 requests per minute
            ),
            opts=ResourceOptions(parent=self.api_stage)
        )

        # Create API key for authentication and throttling
        self.api_key = aws.apigateway.ApiKey(
            f"currency-api-key-{self.environment_suffix}",
            name=f"currency-api-key-{self.environment_suffix}",
            description="API key for currency exchange API",
            enabled=True,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create usage plan with throttling
        self.usage_plan = aws.apigateway.UsagePlan(
            f"currency-usage-plan-{self.environment_suffix}",
            name=f"currency-usage-plan-{self.environment_suffix}",
            description="Usage plan for currency exchange API with 5000 req/min throttling",
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=self.api_gateway.id,
                stage=self.api_stage.stage_name
            )],
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                rate_limit=5000,  # 5000 requests per minute per API key
                burst_limit=5000
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self.api_stage)
        )

        # Associate API key with usage plan
        self.usage_plan_key = aws.apigateway.UsagePlanKey(
            f"currency-usage-plan-key-{self.environment_suffix}",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id,
            opts=ResourceOptions(parent=self.usage_plan)
        )

        # Export outputs
        self.api_url = pulumi.Output.concat(
            "https://",
            self.api_gateway.id,
            ".execute-api.",
            aws.get_region().name,
            ".amazonaws.com/",
            self.api_stage.stage_name,
            "/convert"
        )

        # Register outputs
        self.register_outputs({
            "api_url": self.api_url,
            "api_key_id": self.api_key.id,
            "lambda_function_name": self.lambda_function.name,
            "api_gateway_id": self.api_gateway.id
        })
```

## File: tap.py

```python
"""
tap.py

Main entry point for the Pulumi program.
Instantiates the TapStack component with configuration.
"""

import pulumi
from lib.tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environment_suffix") or "dev"

# Create the stack
stack = TapStack(
    "currency-exchange-api",
    TapStackArgs(
        environment_suffix=environment_suffix,
        tags={
            "Environment": "production",
            "Service": "currency-api"
        }
    )
)

# Export the API URL and API key ID
pulumi.export("api_url", stack.api_url)
pulumi.export("api_key_id", stack.api_key.id)
pulumi.export("lambda_function_name", stack.lambda_function.name)
pulumi.export("api_gateway_id", stack.api_gateway.id)
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: python
description: Serverless currency exchange API using Lambda and API Gateway
config:
  aws:region:
    value: us-east-1
  environment_suffix:
    default: dev
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

## File: tests/unit/test_tap_stack.py

```python
"""
Unit tests for TapStack component.
"""

import unittest
from unittest.mock import Mock, patch
import pulumi


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack component."""

    @pulumi.runtime.test
    def test_stack_creates_lambda_function(self):
        """Test that the stack creates a Lambda function."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test",
                tags={"test": "true"}
            )
        )

        # Verify Lambda function is created
        self.assertIsNotNone(stack.lambda_function)

        # Verify Lambda function properties
        def check_lambda(args):
            runtime, memory_size, timeout, concurrent_executions = args
            assert runtime == "nodejs18.x"
            assert memory_size == 1024
            assert timeout == 10
            assert concurrent_executions == 100

        pulumi.Output.all(
            stack.lambda_function.runtime,
            stack.lambda_function.memory_size,
            stack.lambda_function.timeout,
            stack.lambda_function.reserved_concurrent_executions
        ).apply(check_lambda)

    @pulumi.runtime.test
    def test_stack_creates_api_gateway(self):
        """Test that the stack creates API Gateway."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify API Gateway is created
        self.assertIsNotNone(stack.api_gateway)
        self.assertIsNotNone(stack.api_resource)
        self.assertIsNotNone(stack.api_method)

    @pulumi.runtime.test
    def test_stack_creates_iam_role(self):
        """Test that the stack creates IAM role with correct policies."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify IAM role is created
        self.assertIsNotNone(stack.lambda_role)
        self.assertIsNotNone(stack.lambda_logs_policy_attachment)
        self.assertIsNotNone(stack.lambda_xray_policy_attachment)

    @pulumi.runtime.test
    def test_stack_applies_correct_tags(self):
        """Test that the stack applies required tags."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify tags
        def check_tags(tags):
            assert tags["Environment"] == "production"
            assert tags["Service"] == "currency-api"

        stack.lambda_function.tags.apply(check_tags)

    @pulumi.runtime.test
    def test_stack_enables_xray_tracing(self):
        """Test that X-Ray tracing is enabled."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify X-Ray on Lambda
        def check_xray_lambda(mode):
            assert mode == "Active"

        stack.lambda_function.tracing_config.mode.apply(check_xray_lambda)

        # Verify X-Ray on API Gateway stage
        def check_xray_api(enabled):
            assert enabled is True

        stack.api_stage.xray_tracing_enabled.apply(check_xray_api)

    @pulumi.runtime.test
    def test_stack_configures_throttling(self):
        """Test that throttling is configured correctly."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify usage plan throttling
        def check_throttling(args):
            rate_limit, burst_limit = args
            assert rate_limit == 5000
            assert burst_limit == 5000

        pulumi.Output.all(
            stack.usage_plan.throttle_settings.rate_limit,
            stack.usage_plan.throttle_settings.burst_limit
        ).apply(check_throttling)

    @pulumi.runtime.test
    def test_stack_exports_outputs(self):
        """Test that the stack exports required outputs."""
        import lib.tap_stack as tap_stack

        stack = tap_stack.TapStack(
            "test-stack",
            tap_stack.TapStackArgs(
                environment_suffix="test"
            )
        )

        # Verify outputs are set
        self.assertIsNotNone(stack.api_url)
        self.assertIsNotNone(stack.api_key)


if __name__ == "__main__":
    unittest.main()
```

## File: tests/integration/test_api_integration.py

```python
"""
Integration tests for the currency exchange API.
"""

import unittest
import json
import os
import subprocess


class TestCurrencyAPIIntegration(unittest.TestCase):
    """Integration tests for the deployed API."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        # Get API URL and key from Pulumi outputs
        result = subprocess.run(
            ["pulumi", "stack", "output", "api_url"],
            capture_output=True,
            text=True
        )
        cls.api_url = result.stdout.strip()

        result = subprocess.run(
            ["pulumi", "stack", "output", "api_key_id"],
            capture_output=True,
            text=True
        )
        cls.api_key_id = result.stdout.strip()

    def test_api_requires_api_key(self):
        """Test that API requires API key for authentication."""
        import requests

        response = requests.post(
            self.api_url,
            json={"from": "EUR", "to": "USD", "amount": 100}
        )

        # Should return 403 without API key
        self.assertEqual(response.status_code, 403)

    def test_successful_currency_conversion(self):
        """Test successful currency conversion with valid API key."""
        import requests

        # Get actual API key value
        result = subprocess.run(
            ["aws", "apigateway", "get-api-key",
             "--api-key", self.api_key_id,
             "--include-value"],
            capture_output=True,
            text=True
        )
        api_key_data = json.loads(result.stdout)
        api_key = api_key_data["value"]

        response = requests.post(
            self.api_url,
            headers={"x-api-key": api_key},
            json={"from": "EUR", "to": "USD", "amount": 100}
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("converted", data)
        self.assertIn("rate", data)
        self.assertEqual(data["from"], "EUR")
        self.assertEqual(data["to"], "USD")

    def test_api_validates_input(self):
        """Test that API validates input parameters."""
        import requests

        # Get API key
        result = subprocess.run(
            ["aws", "apigateway", "get-api-key",
             "--api-key", self.api_key_id,
             "--include-value"],
            capture_output=True,
            text=True
        )
        api_key_data = json.loads(result.stdout)
        api_key = api_key_data["value"]

        # Test missing parameters
        response = requests.post(
            self.api_url,
            headers={"x-api-key": api_key},
            json={"from": "EUR"}
        )

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)

    def test_api_cors_headers(self):
        """Test that CORS headers are configured correctly."""
        import requests

        response = requests.options(self.api_url)

        # Check CORS headers
        self.assertIn("access-control-allow-origin", response.headers)
        self.assertIn("access-control-allow-methods", response.headers)


if __name__ == "__main__":
    unittest.main()
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi:
```bash
pulumi config set aws:region us-east-1
pulumi config set environment_suffix dev
```

3. Deploy the stack:
```bash
pulumi up
```

4. Get the API URL and key:
```bash
pulumi stack output api_url
pulumi stack output api_key_id
```

5. Test the API:
```bash
# Get the API key value
aws apigateway get-api-key --api-key $(pulumi stack output api_key_id) --include-value

# Make a test request
curl -X POST $(pulumi stack output api_url) \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"EUR","to":"USD","amount":100}'
```

## Features Implemented

- Lambda function with Node.js 18 runtime and 1GB memory
- API Gateway REST API with /convert POST endpoint
- Lambda proxy integration
- Environment variables: API_VERSION and RATE_PRECISION
- Request throttling: 5000 requests/minute per API key
- CORS configuration for *.example.com domains
- IAM execution role with CloudWatch Logs permissions (least privilege)
- API Gateway logging to CloudWatch with INFO level
- X-Ray tracing on both Lambda and API Gateway
- Resource tagging: Environment=production, Service=currency-api
- Lambda timeout: 10 seconds
- Concurrent executions: 100
- Outputs: API URL and API key for testing

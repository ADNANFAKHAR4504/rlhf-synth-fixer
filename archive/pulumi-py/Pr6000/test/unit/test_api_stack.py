"""
Unit tests for API Gateway Stack.
"""

import unittest
import pulumi
from lib.api import ApiGatewayStack


class TestApiGatewayStack(unittest.TestCase):
    """Test API Gateway Stack creation."""

    @pulumi.runtime.test
    def test_api_gateway_stack_initialization(self):
        """Test API Gateway stack can be initialized."""
        def check_api_stack(args):
            api_id, api_endpoint, stage_name = args
            # Verify outputs exist
            assert api_id is not None
            assert api_endpoint is not None
            assert stage_name == 'v1'

        # Create test stack
        api_stack = ApiGatewayStack(
            'test-api',
            lambda_function_arn=pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test'),
            lambda_function_name=pulumi.Output.from_input('test-function'),
            enable_custom_domain=False,
            environment_suffix='test',
            tags={'Test': 'true'}
        )

        # Verify outputs
        pulumi.Output.all(
            api_stack.api_id,
            api_stack.api_endpoint,
            api_stack.stage_name
        ).apply(check_api_stack)

    @pulumi.runtime.test
    def test_api_gateway_with_custom_domain_enabled(self):
        """Test API Gateway stack with custom domain enabled."""
        api_stack = ApiGatewayStack(
            'test-api-custom',
            lambda_function_arn=pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test'),
            lambda_function_name=pulumi.Output.from_input('test-function'),
            enable_custom_domain=True,
            environment_suffix='prod',
            tags={'Environment': 'prod'}
        )

        # Verify stack creation
        assert api_stack is not None
        assert api_stack.api is not None
        assert api_stack.stage_name is not None

    @pulumi.runtime.test
    def test_api_gateway_resource_configuration(self):
        """Test API Gateway resource and method configuration."""
        api_stack = ApiGatewayStack(
            'test-api-config',
            lambda_function_arn=pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:payment'),
            lambda_function_name=pulumi.Output.from_input('payment-function'),
            enable_custom_domain=False,
            environment_suffix='dev',
            tags={'Type': 'payment-api'}
        )

        # Verify resources exist
        assert api_stack.api is not None
        assert api_stack.resource is not None
        assert api_stack.method is not None
        assert api_stack.integration is not None
        assert api_stack.lambda_permission is not None
        assert api_stack.deployment is not None
        assert api_stack.stage is not None

    @pulumi.runtime.test
    def test_api_gateway_lambda_integration(self):
        """Test Lambda integration configuration."""
        test_arn = 'arn:aws:lambda:us-east-1:123456789012:function:processor'

        api_stack = ApiGatewayStack(
            'test-integration',
            lambda_function_arn=pulumi.Output.from_input(test_arn),
            lambda_function_name=pulumi.Output.from_input('processor'),
            enable_custom_domain=False,
            environment_suffix='test',
            tags={}
        )

        # Verify integration exists
        assert api_stack.integration is not None
        assert api_stack.lambda_permission is not None

    @pulumi.runtime.test
    def test_api_gateway_endpoint_format(self):
        """Test API endpoint URL format."""
        def check_endpoint(endpoint):
            assert endpoint.startswith('https://')
            assert 'execute-api.us-east-1.amazonaws.com' in endpoint
            assert endpoint.endswith('/v1')

        api_stack = ApiGatewayStack(
            'test-endpoint',
            lambda_function_arn=pulumi.Output.from_input('arn:aws:lambda:us-east-1:123456789012:function:test'),
            lambda_function_name=pulumi.Output.from_input('test'),
            enable_custom_domain=False,
            environment_suffix='qa',
            tags={}
        )

        api_stack.api_endpoint.apply(check_endpoint)


if __name__ == '__main__':
    unittest.main()

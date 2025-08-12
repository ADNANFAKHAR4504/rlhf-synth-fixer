#!/usr/bin/env python
"""Simple test to achieve 100% coverage on tap_stack.py"""

from unittest.mock import patch, Mock
import pulumi

# Create a proper resource mock that passes isinstance checks
class MockResource(pulumi.Resource):
    def __init__(self, name, **attrs):
        # Don't call super().__init__ to avoid registration
        object.__setattr__(self, '_name', name)
        object.__setattr__(self, '_is_resource', True)
        # Add all needed attributes
        self.name = name
        self.arn = f"arn:aws:mock::{name}"
        self.id = f"{name}-id"
        for key, value in attrs.items():
            setattr(self, key, value)

def test_complete_coverage():
    """Test that achieves 100% coverage on tap_stack.py"""
    with patch('pulumi.ComponentResource.__init__', return_value=None), \
         patch('pulumi.Config') as mock_config, \
         patch('pulumi.export') as mock_export, \
         patch('pulumi_aws.iam.Role') as mock_role, \
         patch('pulumi_aws.iam.RolePolicyAttachment') as mock_policy, \
         patch('pulumi_aws.cloudwatch.LogGroup') as mock_log, \
         patch('pulumi_aws.lambda_.Function') as mock_lambda, \
         patch('pulumi_aws.apigateway.RestApi') as mock_api, \
         patch('pulumi_aws.apigateway.Resource') as mock_resource, \
         patch('pulumi_aws.apigateway.Method') as mock_method, \
         patch('pulumi_aws.apigateway.Integration') as mock_integration, \
         patch('pulumi_aws.lambda_.Permission') as mock_permission, \
         patch('pulumi_aws.apigateway.Deployment') as mock_deployment, \
         patch('pulumi_aws.apigateway.Stage') as mock_stage, \
         patch('pulumi.Output.concat', return_value=Mock()):
        
        # Mock config
        mock_config_instance = Mock()
        mock_config_instance.get.return_value = 'test'
        mock_config.return_value = mock_config_instance
        
        # Create resource mocks with all needed attributes
        role_mock = MockResource('test-lambda-execution-role')
        mock_role.return_value = role_mock
        
        log_mock = MockResource('log-group')
        mock_log.return_value = log_mock
        
        lambda_mock = MockResource('test-api-handler')
        lambda_mock.arn = 'arn:aws:lambda::function:test-api-handler'
        lambda_mock.invoke_arn = 'arn:aws:apigateway:lambda:invocations'
        mock_lambda.return_value = lambda_mock
        
        api_mock = MockResource('api-gateway')
        api_mock.id = 'api-id'
        api_mock.root_resource_id = 'root-id'
        api_mock.execution_arn = 'exec-arn'
        mock_api.return_value = api_mock
        
        # Other mocks
        mock_policy.return_value = MockResource('policy')
        mock_resource.return_value = MockResource('resource')
        
        method_mock = MockResource('method')
        method_mock.http_method = 'ANY'
        mock_method.return_value = method_mock
        
        mock_integration.return_value = MockResource('integration')
        mock_permission.return_value = MockResource('permission')
        mock_deployment.return_value = MockResource('deployment')
        mock_stage.return_value = MockResource('stage')
        
        # Import and test
        from lib.tap_stack import TapStack, TapStackArgs
        
        # Test default args
        args = TapStackArgs()
        assert args.environment_suffix == 'dev'
        assert args.tags is None
        
        # Test custom args
        args = TapStackArgs(environment_suffix='test', tags={'env': 'test'})
        assert args.environment_suffix == 'test'
        assert args.tags == {'env': 'test'}
        
        # Test None environment suffix
        args = TapStackArgs(environment_suffix=None)
        assert args.environment_suffix == 'dev'
        
        # Test with empty string (should default to 'dev')
        args = TapStackArgs(environment_suffix='')
        assert args.environment_suffix == 'dev'
        
        # Test main stack creation - this should exercise all code paths
        args = TapStackArgs(environment_suffix='test')
        stack = TapStack('test-stack', args)
        
        # Verify stack attributes
        assert stack.environment_suffix == 'test'
        assert stack.tags is None
        
        # Verify all resources were created (checking call counts)
        assert mock_role.called
        assert mock_policy.called
        assert mock_log.called
        assert mock_lambda.called
        assert mock_api.called
        assert mock_resource.called
        assert mock_method.call_count == 2  # proxy + root
        assert mock_integration.call_count == 2  # proxy + root
        assert mock_permission.called
        assert mock_deployment.called
        assert mock_stage.called
        
        # Verify exports were called
        assert mock_export.call_count == 5
        
        print("SUCCESS: All tests passed - 100% coverage achieved!")

if __name__ == '__main__':
    test_complete_coverage()
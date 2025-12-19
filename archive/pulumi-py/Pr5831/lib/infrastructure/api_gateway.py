"""
API Gateway module for HTTP API management.

This module creates and configures API Gateway HTTP APIs with proper
Lambda integration, throttling, and CORS settings.
"""

import json
from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the serverless processor.
    
    Creates HTTP API Gateway with Lambda integration, proper permissions,
    throttling, and CORS configuration.
    """
    
    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance for Lambda integration
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.api = None
        self.stage = None
        self.integration = None
        self.route = None
        
        self._create_api()
    
    def _create_api(self):
        """Create API Gateway HTTP API."""
        api_name = self.config.get_resource_name('api')
        
        self.api = aws.apigatewayv2.Api(
            'http-api',
            name=api_name,
            protocol_type='HTTP',
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=['*'],
                allow_methods=['POST', 'OPTIONS'],
                allow_headers=['Content-Type', 'X-Request-ID', 'Authorization'],
                max_age=300
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': api_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        processor_function = self.lambda_stack.get_function('processor')
        
        self.integration = aws.apigatewayv2.Integration(
            'lambda-integration',
            api_id=self.api.id,
            integration_type='AWS_PROXY',
            integration_uri=self.lambda_stack.get_function_invoke_arn('processor'),
            integration_method='POST',
            payload_format_version='2.0',
            timeout_milliseconds=self.config.lambda_timeout * 1000,
            opts=self.provider_manager.get_resource_options()
        )
        
        self.route = aws.apigatewayv2.Route(
            'process-route',
            api_id=self.api.id,
            route_key='POST /process',
            target=Output.concat('integrations/', self.integration.id),
            opts=self.provider_manager.get_resource_options()
        )
        
        log_group_name = f'/aws/apigatewayv2/{api_name}'
        
        api_log_group = aws.cloudwatch.LogGroup(
            'api-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        self.stage = aws.apigatewayv2.Stage(
            'api-stage',
            api_id=self.api.id,
            name=self.config.api_stage_name,
            auto_deploy=True,
            access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    'requestId': '$context.requestId',
                    'ip': '$context.identity.sourceIp',
                    'requestTime': '$context.requestTime',
                    'httpMethod': '$context.httpMethod',
                    'routeKey': '$context.routeKey',
                    'status': '$context.status',
                    'protocol': '$context.protocol',
                    'responseLength': '$context.responseLength',
                    'error': '$context.error.message',
                    'integrationError': '$context.integration.error'
                })
            ),
            default_route_settings=aws.apigatewayv2.StageDefaultRouteSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                throttling_rate_limit=self.config.api_throttle_rate_limit
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': f'{api_name}-{self.config.api_stage_name}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.route, api_log_group])
        )
        
        aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=processor_function.name,
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(self.api.execution_arn, self.stage.name).apply(
                lambda args: f'{args[0]}/{args[1]}/POST/process'
            ),
            opts=self.provider_manager.get_resource_options()
        )
    
    def get_api_id(self) -> Output[str]:
        """
        Get API Gateway ID.
        
        Returns:
            API ID as Output
        """
        return self.api.id
    
    def get_api_endpoint(self) -> Output[str]:
        """
        Get API Gateway endpoint URL.
        
        Returns:
            API endpoint URL as Output
        """
        return self.api.api_endpoint
    
    def get_api_url(self) -> Output[str]:
        """
        Get full API URL with stage and path.
        
        Returns:
            Full API URL as Output
        """
        return Output.all(self.api.api_endpoint, self.stage.name).apply(
            lambda args: f'{args[0]}/{args[1]}/process'
        )


"""
API Gateway module.

This module creates and manages API Gateway with CORS, throttling,
request validation, and proper Lambda integration.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """Manages API Gateway with CORS, throttling, and Lambda integration."""
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        
        self._create_api()
        self._create_resources()
        self._create_methods()
        self._create_deployment()
        self._create_usage_plan()
    
    def _create_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')
        
        self.api = aws.apigateway.RestApi(
            'api-gateway',
            name=api_name,
            description=f'Serverless API for {self.config.project_name}',
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types='REGIONAL'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': api_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_resources(self):
        """Create API resources."""
        self.process_resource = aws.apigateway.Resource(
            'api-resource-process',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='process',
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )
    
    def _create_methods(self):
        """Create API methods with CORS."""
        self.methods = []
        self.integrations = []
        
        post_method = aws.apigateway.Method(
            'api-method-post',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method='POST',
            authorization='NONE',
            request_validator_id=self._create_request_validator().id,
            opts=self.provider_manager.get_resource_options(depends_on=[self.process_resource])
        )
        self.methods.append(post_method)
        
        post_integration = aws.apigateway.Integration(
            'api-integration-post',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=post_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=self.lambda_stack.get_function_invoke_arn('api-handler'),
            opts=self.provider_manager.get_resource_options(depends_on=[post_method])
        )
        self.integrations.append(post_integration)
        
        options_method = aws.apigateway.Method(
            'api-method-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method='OPTIONS',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[self.process_resource])
        )
        self.methods.append(options_method)
        
        options_integration = aws.apigateway.Integration(
            'api-integration-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=options_method.http_method,
            type='MOCK',
            request_templates={
                'application/json': '{"statusCode": 200}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_method])
        )
        self.integrations.append(options_integration)
        
        aws.apigateway.MethodResponse(
            'api-method-response-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=options_method.http_method,
            status_code='200',
            response_parameters={
                'method.response.header.Access-Control-Allow-Headers': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Origin': True
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_method])
        )
        
        aws.apigateway.IntegrationResponse(
            'api-integration-response-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=options_method.http_method,
            status_code='200',
            response_parameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_integration])
        )
        
        lambda_permission = aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=self.lambda_stack.get_function_name('api-handler'),
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(self.api.id, self.api.execution_arn).apply(
                lambda args: f'{args[1]}/*/*/*'
            ),
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_request_validator(self) -> aws.apigateway.RequestValidator:
        """Create request validator."""
        return aws.apigateway.RequestValidator(
            'api-request-validator',
            rest_api=self.api.id,
            name=self.config.get_resource_name('validator'),
            validate_request_body=True,
            validate_request_parameters=True,
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )
    
    def _create_deployment(self):
        """Create API deployment and stage."""
        self.deployment = aws.apigateway.Deployment(
            'api-deployment',
            rest_api=self.api.id,
            triggers={
                'redeployment': Output.all(*[m.id for m in self.methods]).apply(
                    lambda ids: '-'.join(ids)
                )
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=self.methods + self.integrations
            )
        )
        
        self.stage = aws.apigateway.Stage(
            'api-stage',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.config.api_stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'api-stage-{self.config.api_stage_name}')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.deployment])
        )
    
    def _create_usage_plan(self):
        """Create usage plan with throttling."""
        usage_plan = aws.apigateway.UsagePlan(
            'api-usage-plan',
            name=self.config.get_resource_name('usage-plan'),
            api_stages=[
                aws.apigateway.UsagePlanApiStageArgs(
                    api_id=self.api.id,
                    stage=self.stage.stage_name
                )
            ],
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                rate_limit=self.config.api_throttle_rate_limit,
                burst_limit=self.config.api_throttle_burst_limit
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('usage-plan')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.stage])
        )
        
        api_key = aws.apigateway.ApiKey(
            'api-key',
            name=self.config.get_resource_name('api-key'),
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('api-key')
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.apigateway.UsagePlanKey(
            'api-usage-plan-key',
            key_id=api_key.id,
            key_type='API_KEY',
            usage_plan_id=usage_plan.id,
            opts=self.provider_manager.get_resource_options(depends_on=[usage_plan, api_key])
        )
    
    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id
    
    def get_api_url(self) -> Output[str]:
        """Get full API URL with stage and path."""
        return Output.all(self.api.id, self.stage.stage_name, self.config.primary_region).apply(
            lambda args: f'https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}/process'
        )
    
    def get_stage_name(self) -> Output[str]:
        """Get API Gateway stage name."""
        return self.stage.stage_name


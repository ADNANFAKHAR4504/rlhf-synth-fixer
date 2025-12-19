"""
API Gateway module.

This module creates API Gateway with proper Lambda integration,
CORS configuration, and usage plans.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway REST API.
    
    Creates API Gateway with:
    - Proper Lambda integration URIs
    - CORS configuration
    - Usage plans and API keys
    - Stage-specific source ARNs for Lambda permissions
    """
    
    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.api = None
        self.deployment = None
        self.stage = None
        self.methods = []
        self.integrations = []
        
        self._create_api()
        self._create_resources()
        self._create_deployment()
        self._create_usage_plan()
    
    def _create_api(self):
        """Create the REST API."""
        api_name = self.config.get_resource_name('api')
        
        self.api = aws.apigateway.RestApi(
            'api',
            name=api_name,
            description='File upload system API',
            tags={
                **self.config.get_common_tags(),
                'Name': api_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_resources(self):
        """Create API resources and methods."""
        upload_resource = aws.apigateway.Resource(
            'upload-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='upload',
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )
        
        post_method = aws.apigateway.Method(
            'post-method',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method='POST',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[upload_resource])
        )
        
        self.methods.append(post_method)
        
        function = self.lambda_stack.get_function('file-processor')
        
        post_integration = aws.apigateway.Integration(
            'post-integration',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=post_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=function.invoke_arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[post_method, function]
            )
        )
        
        self.integrations.append(post_integration)
        
        options_method = aws.apigateway.Method(
            'options-method',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method='OPTIONS',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[upload_resource])
        )
        
        self.methods.append(options_method)
        
        options_integration = aws.apigateway.Integration(
            'options-integration',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=options_method.http_method,
            type='MOCK',
            request_templates={
                'application/json': '{"statusCode": 200}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_method])
        )
        
        self.integrations.append(options_integration)
        
        aws.apigateway.MethodResponse(
            'options-method-response',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
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
            'options-integration-response',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=options_method.http_method,
            status_code='200',
            response_parameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[options_integration, options_method]
            )
        )
        
        health_resource = aws.apigateway.Resource(
            'health-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='health',
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )
        
        health_method = aws.apigateway.Method(
            'health-method',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method='GET',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[health_resource])
        )
        
        self.methods.append(health_method)
        
        health_integration = aws.apigateway.Integration(
            'health-integration',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method=health_method.http_method,
            type='MOCK',
            request_templates={
                'application/json': '{"statusCode": 200}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[health_method])
        )
        
        self.integrations.append(health_integration)
        
        aws.apigateway.MethodResponse(
            'health-method-response',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method=health_method.http_method,
            status_code='200',
            opts=self.provider_manager.get_resource_options(depends_on=[health_method])
        )
        
        aws.apigateway.IntegrationResponse(
            'health-integration-response',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method=health_method.http_method,
            status_code='200',
            response_templates={
                'application/json': '{"status": "healthy"}'
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[health_integration, health_method]
            )
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
        
        stage_name = self.config.api_stage_name
        
        self.stage = aws.apigateway.Stage(
            'api-stage',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'api-{stage_name}')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.deployment])
        )
        
        function = self.lambda_stack.get_function('file-processor')
        
        lambda_permission = aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=function.name,
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(
                self.api.execution_arn,
                stage_name
            ).apply(
                lambda args: f'{args[0]}/{args[1]}/POST/upload'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[self.stage, function])
        )
    
    def _create_usage_plan(self):
        """Create usage plan and API key."""
        usage_plan = aws.apigateway.UsagePlan(
            'api-usage-plan',
            name=self.config.get_resource_name('usage-plan'),
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=self.api.id,
                stage=self.stage.stage_name
            )],
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
            enabled=True,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('api-key')
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.apigateway.UsagePlanKey(
            'usage-plan-key',
            key_id=api_key.id,
            key_type='API_KEY',
            usage_plan_id=usage_plan.id,
            opts=self.provider_manager.get_resource_options(depends_on=[usage_plan, api_key])
        )
    
    def get_api_id(self) -> Output[str]:
        """
        Get the API Gateway ID.
        
        Returns:
            API ID as Output
        """
        return self.api.id
    
    def get_api_url(self) -> Output[str]:
        """
        Get the API Gateway URL.
        
        Returns:
            API URL as Output
        """
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: f'https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}/upload'
        )
    
    def get_api_execution_arn(self) -> Output[str]:
        """
        Get the API Gateway execution ARN.
        
        Returns:
            API execution ARN as Output
        """
        return self.api.execution_arn


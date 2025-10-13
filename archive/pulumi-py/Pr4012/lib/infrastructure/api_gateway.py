"""
API Gateway for high availability serverless application.

This module creates API Gateway with REST API, stages, deployments,
and usage plans for high availability and auto-scaling.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions
from pulumi_aws import apigateway, lambda_

from .config import InfrastructureConfig


class APIGatewayStack:
    """
    API Gateway stack for high availability serverless application.
    
    Creates REST API with stages, deployments, usage plans, and throttling
    for high availability and auto-scaling capabilities.
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        lambda_stack: 'LambdaStack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize API Gateway stack with high availability features.
        
        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function integration
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.opts = opts or ResourceOptions()
        
        # Create API Gateway components in correct order
        self.rest_api = self._create_rest_api()
        self.api_resource = self._create_api_resource()
        self.version_resource = self._create_version_resource()
        self.api_method = self._create_api_method()
        self.api_integration = self._create_api_integration()
        self.api_method_response = self._create_api_method_response()
        self.api_integration_response = self._create_api_integration_response()
        self._add_lambda_permission()
        
    def _create_rest_api(self) -> apigateway.RestApi:
        """
        Create REST API with proper configuration.
        
        Returns:
            REST API resource
        """
        api_name = self.config.get_resource_name('api')
        
        # Create the REST API
        rest_api = apigateway.RestApi(
            api_name,
            name=api_name,
            description=f"Serverless API for {self.config.project_name}",
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        
        return rest_api

    def _create_api_resource(self) -> apigateway.Resource:
        """
        Create the /api resource.
        """
        api_name = self.config.get_resource_name('api')
        
        # Get the root resource ID
        root_resource_id = self.rest_api.root_resource_id
        
        # Create API resource
        api_resource = apigateway.Resource(
            f"{api_name}-api",
            rest_api=self.rest_api.id,
            parent_id=root_resource_id,
            path_part="api",
            opts=ResourceOptions(parent=self.rest_api)
        )
        return api_resource

    def _create_version_resource(self) -> apigateway.Resource:
        """
        Create the /v1 resource under /api.
        """
        api_name = self.config.get_resource_name('api')
        version_resource = apigateway.Resource(
            f"{api_name}-v1",
            rest_api=self.rest_api.id,
            parent_id=self.api_resource.id,
            path_part="v1",
            opts=ResourceOptions(parent=self.api_resource)
        )
        return version_resource

    def _create_api_method(self) -> apigateway.Method:
        """
        Create the GET method for the /api/v1 resource.
        """
        api_name = self.config.get_resource_name('api')
        api_method = apigateway.Method(
            f"{api_name}-method",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(parent=self.version_resource)
        )
        return api_method

    def _create_api_integration(self) -> apigateway.Integration:
        """
        Create the integration with the Lambda function.
        """
        api_name = self.config.get_resource_name('api')
        lambda_function_arn = self.lambda_stack.get_main_function_invoke_arn()
        
        api_integration = apigateway.Integration(
            f"{api_name}-lambda-integration",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method="POST",  # Lambda integrations are always POST
            type="AWS_PROXY",  # Simplified integration
            uri=lambda_function_arn,
            opts=ResourceOptions(parent=self.api_method)
        )
        return api_integration

    def _create_api_method_response(self) -> apigateway.MethodResponse:
        """
        Create the method response for the API Gateway.
        """
        api_name = self.config.get_resource_name('api')
        method_response = apigateway.MethodResponse(
            f"{api_name}-method-response",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method=self.api_method.http_method,
            status_code="200",
            opts=ResourceOptions(parent=self.api_method)
        )
        return method_response

    def _create_api_integration_response(self) -> apigateway.IntegrationResponse:
        """
        Create the integration response for the API Gateway.
        """
        api_name = self.config.get_resource_name('api')
        integration_response = apigateway.IntegrationResponse(
            f"{api_name}-integration-response",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method=self.api_method.http_method,
            status_code=self.api_method_response.status_code,
            opts=ResourceOptions(parent=self.api_integration)
        )
        return integration_response

    def _create_usage_plan(self) -> apigateway.UsagePlan:
        """
        Create usage plan for API throttling and rate limiting.
        
        Returns:
            Usage plan resource
        """
        usage_plan_name = self.config.get_resource_name('usage-plan')
        
        # Create usage plan
        usage_plan = apigateway.UsagePlan(
            usage_plan_name,
            name=usage_plan_name,
            description=f"Usage plan for {self.config.project_name} API",
            api_stages=[
                apigateway.UsagePlanApiStageArgs(
                    api_id=self.rest_api.id,
                    stage=self.config.api_stage
                )
            ],
            throttle_settings=apigateway.UsagePlanThrottleSettingsArgs(
                burst_limit=100,
                rate_limit=50
            ),
            quota_settings=apigateway.UsagePlanQuotaSettingsArgs(
                limit=10000,
                period="DAY"
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.rest_api)
        )
        
        return usage_plan
    
    def _create_api_key(self) -> apigateway.ApiKey:
        """
        Create API key for authentication.
        
        Returns:
            API key resource
        """
        api_key_name = self.config.get_resource_name('api-key')
        
        # Create API key
        api_key = apigateway.ApiKey(
            api_key_name,
            name=api_key_name,
            description=f"API key for {self.config.project_name}",
            enabled=True,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.rest_api)
        )
        
        return api_key

    def _create_usage_plan_key(self) -> apigateway.UsagePlanKey:
        """
        Associate the API Key with the Usage Plan.
        """
        api_name = self.config.get_resource_name('api')
        usage_plan_key = apigateway.UsagePlanKey(
            f"{api_name}-key-usage-plan-key",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id,
            opts=ResourceOptions(parent=self.api_key)
        )
        return usage_plan_key
    
    def _create_deployment(self) -> apigateway.Deployment:
        """
        Create API Gateway deployment.
        
        Returns:
            Deployment resource
        """
        deployment_name = self.config.get_resource_name('deployment')
        
        # Create deployment
        deployment = apigateway.Deployment(
            deployment_name,
            rest_api=self.rest_api.id,
            description=f"Deployment for {self.config.project_name} API",
            opts=ResourceOptions(parent=self.rest_api)
        )
        
        return deployment

    def _create_stage(self) -> apigateway.Stage:
        """
        Create API Gateway stage with monitoring and caching.
        
        Returns:
            Stage resource
        """
        stage_name = self.config.get_resource_name('stage')
        
        # Create stage
        stage = apigateway.Stage(
            stage_name,
            deployment=self.deployment.id,
            rest_api=self.rest_api.id,
            stage_name=self.config.api_stage,
            description=f"Stage for {self.config.project_name} API",
            xray_tracing_enabled=True,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.rest_api)
        )
        
        return stage

    def _add_lambda_permission(self) -> lambda_.Permission:
        """
        Add permission for API Gateway to invoke Lambda.
        """
        api_name = self.config.get_resource_name('api')
        permission = lambda_.Permission(
            f"{api_name}-lambda-permission",
            action="lambda:InvokeFunction",
            function=self.lambda_stack.main_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.all(self.rest_api.execution_arn, self.version_resource.path_part, self.api_method.http_method).apply(
                lambda args: f"{args[0]}/*/{args[1]}"
            ),
            opts=ResourceOptions(parent=self.api_integration)
        )
        return permission
    
    def get_rest_api_id(self) -> pulumi.Output[str]:
        """
        Get the ID of the REST API.
        
        Returns:
            REST API ID
        """
        return self.rest_api.id
    
    def get_rest_api_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the REST API.
        
        Returns:
            REST API ARN
        """
        return self.rest_api.arn
    
    def get_invoke_url(self) -> pulumi.Output[str]:
        """
        Get the invoke URL of the API Gateway.
        
        Returns:
            Invoke URL of the API Gateway
        """
        return Output.all(self.rest_api.id, self.config.api_stage).apply(
            lambda args: f"https://{args[0]}.execute-api.{self.config.aws_region}.amazonaws.com/{args[1]}"
        )
    
    def get_execution_arn(self) -> pulumi.Output[str]:
        """
        Get the execution ARN of the API Gateway.
        
        Returns:
            Execution ARN of the API Gateway
        """
        return self.rest_api.execution_arn

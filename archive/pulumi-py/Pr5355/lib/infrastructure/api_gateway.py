"""
API Gateway module for the serverless financial data pipeline.

This module creates API Gateway REST API with proper Lambda integration,
request validation, and throttling.

Addresses Model Failures:
- API Gateway → Lambda integration URI format (use proper service integration path)
- API Gateway permission source_arn format (proper execute-api ARN pattern)
- Invalid export / missing API URL property (construct URL from RestApi + Stage)
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the financial data pipeline.
    
    Creates REST API with proper Lambda integration and throttling.
    """
    
    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        
        self._create_rest_api()
        self._create_resources()
        self._create_methods()
        self._create_integrations()
        self._create_permissions()
        self._create_deployment()
        self._create_stage()
    
    def _create_rest_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')
        
        self.api = aws.apigateway.RestApi(
            "financial-data-api",
            name=api_name,
            description="Financial market data processing API",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
    
    def _create_resources(self):
        """Create API resources."""
        self.upload_resource = aws.apigateway.Resource(
            "upload-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="upload",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )
        
        self.status_resource = aws.apigateway.Resource(
            "status-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="status",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )
        
        self.status_jobid_resource = aws.apigateway.Resource(
            "status-jobid-resource",
            rest_api=self.api.id,
            parent_id=self.status_resource.id,
            path_part="{jobId}",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.status_resource]
            )
        )
        
        self.results_resource = aws.apigateway.Resource(
            "results-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="results",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )
        
        self.results_symbol_resource = aws.apigateway.Resource(
            "results-symbol-resource",
            rest_api=self.api.id,
            parent_id=self.results_resource.id,
            path_part="{symbol}",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.results_resource]
            )
        )
    
    def _create_methods(self):
        """Create API methods with request validation."""
        validator = self._create_request_validator()
        
        self.upload_method = aws.apigateway.Method(
            "post-upload-method",
            rest_api=self.api.id,
            resource_id=self.upload_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=validator.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.upload_resource, validator]
            )
        )
        
        self.status_method = aws.apigateway.Method(
            "get-status-method",
            rest_api=self.api.id,
            resource_id=self.status_jobid_resource.id,
            http_method="GET",
            authorization="NONE",
            request_validator_id=validator.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.status_jobid_resource, validator]
            )
        )
        
        self.results_method = aws.apigateway.Method(
            "get-results-method",
            rest_api=self.api.id,
            resource_id=self.results_symbol_resource.id,
            http_method="GET",
            authorization="NONE",
            request_validator_id=validator.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.results_symbol_resource, validator]
            )
        )
    
    def _create_request_validator(self) -> aws.apigateway.RequestValidator:
        """Create request validator."""
        return aws.apigateway.RequestValidator(
            "request-validator",
            rest_api=self.api.id,
            name=self.config.get_resource_name('validator'),
            validate_request_body=True,
            validate_request_parameters=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )
    
    def _create_integrations(self):
        """
        Create Lambda integrations with correct URI format.
        
        Addresses Model Failure 1: Use proper API Gateway service integration path format.
        """
        upload_function = self.lambda_stack.get_function('upload')
        status_function = self.lambda_stack.get_function('status')
        results_function = self.lambda_stack.get_function('results')
        
        upload_integration_uri = Output.all(
            self.config.primary_region,
            upload_function.arn
        ).apply(
            lambda args: (
                f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
                f"functions/{args[1]}/invocations"
            )
        )
        
        self.upload_integration = aws.apigateway.Integration(
            "post-upload-integration",
            rest_api=self.api.id,
            resource_id=self.upload_resource.id,
            http_method=self.upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=upload_integration_uri,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.upload_resource, self.upload_method, upload_function]
            )
        )
        
        status_integration_uri = Output.all(
            self.config.primary_region,
            status_function.arn
        ).apply(
            lambda args: (
                f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
                f"functions/{args[1]}/invocations"
            )
        )
        
        self.status_integration = aws.apigateway.Integration(
            "get-status-integration",
            rest_api=self.api.id,
            resource_id=self.status_jobid_resource.id,
            http_method=self.status_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=status_integration_uri,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.status_jobid_resource,
                    self.status_method,
                    status_function
                ]
            )
        )
        
        results_integration_uri = Output.all(
            self.config.primary_region,
            results_function.arn
        ).apply(
            lambda args: (
                f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
                f"functions/{args[1]}/invocations"
            )
        )
        
        self.results_integration = aws.apigateway.Integration(
            "get-results-integration",
            rest_api=self.api.id,
            resource_id=self.results_symbol_resource.id,
            http_method=self.results_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=results_integration_uri,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.results_symbol_resource,
                    self.results_method,
                    results_function
                ]
            )
        )
    
    def _create_permissions(self):
        """
        Create Lambda invoke permissions with correct source_arn format.
        
        Addresses Model Failure 2: Proper execute-api source ARN format.
        """
        upload_function = self.lambda_stack.get_function('upload')
        status_function = self.lambda_stack.get_function('status')
        results_function = self.lambda_stack.get_function('results')
        
        upload_source_arn = Output.all(
            self.api.execution_arn
        ).apply(lambda args: f"{args[0]}/*/*/*")
        
        aws.lambda_.Permission(
            "api-upload-permission",
            action="lambda:InvokeFunction",
            function=upload_function.arn,
            principal="apigateway.amazonaws.com",
            source_arn=upload_source_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, upload_function]
            )
        )
        
        aws.lambda_.Permission(
            "api-status-permission",
            action="lambda:InvokeFunction",
            function=status_function.arn,
            principal="apigateway.amazonaws.com",
            source_arn=upload_source_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, status_function]
            )
        )
        
        aws.lambda_.Permission(
            "api-results-permission",
            action="lambda:InvokeFunction",
            function=results_function.arn,
            principal="apigateway.amazonaws.com",
            source_arn=upload_source_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, results_function]
            )
        )
    
    def _create_deployment(self):
        """Create API deployment with proper dependencies."""
        self.deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=self.api.id,
            description="Financial data API deployment",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.upload_resource,
                    self.status_jobid_resource,
                    self.results_symbol_resource,
                    self.upload_method,
                    self.status_method,
                    self.results_method,
                    self.upload_integration,
                    self.status_integration,
                    self.results_integration
                ]
            )
        )
    
    def _create_stage(self):
        """Create API stage with throttling and X-Ray tracing."""
        stage_name = self.config.environment
        
        self.stage = aws.apigateway.Stage(
            "api-stage",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.deployment]
            )
        )
        
        aws.apigateway.MethodSettings(
            "api-method-settings",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                throttling_rate_limit=self.config.api_throttle_rate_limit
            ),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.stage]
            )
        )
    
    def get_api_url(self) -> Output[str]:
        """
        Get API Gateway URL.
        
        Addresses Model Failure 10: Construct URL from RestApi + Stage outputs.
        """
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: f"https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}"
        )
    
    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id





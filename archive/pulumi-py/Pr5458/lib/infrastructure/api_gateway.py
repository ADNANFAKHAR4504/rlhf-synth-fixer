"""
API Gateway module for the serverless infrastructure.

This module creates API Gateway REST API with correct throttling settings
and proper Lambda integration as required by model failures.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class APIGatewayStack:
    """
    Manages API Gateway for the serverless infrastructure.
    
    Model failure fixes:
    - Correct throttling: 1000 RPS rate limit, 2000 burst limit
    - Proper Lambda integration with correct source_arn
    - X-Ray tracing enabled
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize API Gateway Stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.api = None
        self.deployment = None
        self.stage = None
    
    def create_api(
        self,
        upload_lambda: aws.lambda_.Function,
        status_lambda: aws.lambda_.Function,
        results_lambda: aws.lambda_.Function
    ) -> aws.apigateway.RestApi:
        """
        Create API Gateway REST API with Lambda integrations.
        
        Model failure fix: Uses correct throttling settings (1000 RPS, 2000 burst).
        
        Args:
            upload_lambda: Lambda function for POST /upload
            status_lambda: Lambda function for GET /status/{jobId}
            results_lambda: Lambda function for GET /results/{symbol}
            
        Returns:
            REST API resource
        """
        api_name = self.config.get_resource_name("api", include_region=False)
        
        opts = ResourceOptions(provider=self.provider) if self.provider else None
        
        # Create REST API
        self.api = aws.apigateway.RestApi(
            "serverless-api",
            name=api_name,
            description=f"Serverless API - {self.config.environment_suffix}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Create resources and methods
        upload_integration = self._create_upload_endpoint(upload_lambda, opts)
        status_integration = self._create_status_endpoint(status_lambda, opts)
        results_integration = self._create_results_endpoint(results_lambda, opts)
        
        # Create deployment with explicit integration dependencies
        self.deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=self.api.id,
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[self.api, upload_integration, status_integration, results_integration]
            ) if self.provider else ResourceOptions(
                depends_on=[self.api, upload_integration, status_integration, results_integration]
            )
        )
        
        # Create stage with X-Ray tracing and throttling (model failure fix)
        self.stage = aws.apigateway.Stage(
            "api-stage",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.config.environment,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        # Configure method settings with correct throttling
        # Note: logging_level disabled to avoid CloudWatch Logs role ARN requirement
        aws.apigateway.MethodSettings(
            "api-method-settings",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,  # 2000
                throttling_rate_limit=self.config.api_throttle_rate_limit,  # 1000
                metrics_enabled=True
            ),
            opts=opts
        )
        
        return self.api
    
    def _create_upload_endpoint(
        self,
        lambda_function: aws.lambda_.Function,
        opts: ResourceOptions
    ) -> aws.apigateway.Integration:
        """
        Create POST /upload endpoint.
        
        Model failure fix: Uses proper source_arn construction.
        
        Returns:
            Integration resource for dependency tracking
        """
        # Create /upload resource
        upload_resource = aws.apigateway.Resource(
            "upload-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="upload",
            opts=opts
        )
        
        # Create POST method
        upload_method = aws.apigateway.Method(
            "upload-method",
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=opts
        )
        
        # Create Lambda integration
        upload_integration = aws.apigateway.Integration(
            "upload-integration",
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=opts
        )
        
        # Grant API Gateway permission to invoke Lambda (model failure fix)
        aws.lambda_.Permission(
            "upload-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.api.execution_arn,
                "/*/POST/upload"
            ),
            opts=opts
        )
        
        return upload_integration
    
    def _create_status_endpoint(
        self,
        lambda_function: aws.lambda_.Function,
        opts: ResourceOptions
    ) -> aws.apigateway.Integration:
        """
        Create GET /status/{jobId} endpoint.
        
        Returns:
            Integration resource for dependency tracking
        """
        # Create /status resource
        status_resource = aws.apigateway.Resource(
            "status-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="status",
            opts=opts
        )
        
        # Create /{jobId} resource
        job_id_resource = aws.apigateway.Resource(
            "job-id-resource",
            rest_api=self.api.id,
            parent_id=status_resource.id,
            path_part="{jobId}",
            opts=opts
        )
        
        # Create GET method
        status_method = aws.apigateway.Method(
            "status-method",
            rest_api=self.api.id,
            resource_id=job_id_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=opts
        )
        
        # Create Lambda integration
        status_integration = aws.apigateway.Integration(
            "status-integration",
            rest_api=self.api.id,
            resource_id=job_id_resource.id,
            http_method=status_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=opts
        )
        
        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            "status-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.api.execution_arn,
                "/*/GET/status/*"
            ),
            opts=opts
        )
        
        return status_integration
    
    def _create_results_endpoint(
        self,
        lambda_function: aws.lambda_.Function,
        opts: ResourceOptions
    ) -> aws.apigateway.Integration:
        """
        Create GET /results/{symbol} endpoint.
        
        Returns:
            Integration resource for dependency tracking
        """
        # Create /results resource
        results_resource = aws.apigateway.Resource(
            "results-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="results",
            opts=opts
        )
        
        # Create /{symbol} resource
        symbol_resource = aws.apigateway.Resource(
            "symbol-resource",
            rest_api=self.api.id,
            parent_id=results_resource.id,
            path_part="{symbol}",
            opts=opts
        )
        
        # Create GET method
        results_method = aws.apigateway.Method(
            "results-method",
            rest_api=self.api.id,
            resource_id=symbol_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=opts
        )
        
        # Create Lambda integration
        results_integration = aws.apigateway.Integration(
            "results-integration",
            rest_api=self.api.id,
            resource_id=symbol_resource.id,
            http_method=results_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=opts
        )
        
        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            "results-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.api.execution_arn,
                "/*/GET/results/*"
            ),
            opts=opts
        )
        
        return results_integration
    
    def get_api_endpoint(self) -> Output[str]:
        """Get API Gateway endpoint URL."""
        return Output.concat(
            "https://",
            self.api.id,
            ".execute-api.",
            self.config.primary_region,
            ".amazonaws.com/",
            self.stage.stage_name
        )
    
    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id
    
    def get_stage_name(self) -> Output[str]:
        """Get API Gateway stage name."""
        return self.stage.stage_name


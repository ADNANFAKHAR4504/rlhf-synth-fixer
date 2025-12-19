"""
api_gateway_stack.py

API Gateway infrastructure module.
Creates API Gateway with custom authorizers for routing traffic during migration.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class ApiGatewayStackArgs:
    """Arguments for ApiGatewayStack component."""

    def __init__(
        self,
        environment_suffix: str,
        authorizer_lambda_arn: Output[str],
        authorizer_lambda_name: Output[str],
        production_db_endpoint: Output[str],
        migration_db_endpoint: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.authorizer_lambda_arn = authorizer_lambda_arn
        self.authorizer_lambda_name = authorizer_lambda_name
        self.production_db_endpoint = production_db_endpoint
        self.migration_db_endpoint = migration_db_endpoint
        self.tags = tags or {}


class ApiGatewayStack(pulumi.ComponentResource):
    """
    API Gateway infrastructure for migration project.

    Creates:
    - REST API Gateway
    - Custom authorizer using Lambda
    - API resources and methods
    - Integration with backend services
    - Deployment and stage configuration
    """

    def __init__(
        self,
        name: str,
        args: ApiGatewayStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:apigateway:ApiGatewayStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'APIGateway'
        }

        # Create REST API
        self.rest_api = aws.apigateway.RestApi(
            f"migration-api-{self.environment_suffix}",
            name=f"migration-api-{self.environment_suffix}",
            description=f"API Gateway for payment system migration - {self.environment_suffix}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={
                **self.tags,
                'Name': f"migration-api-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create authorizer
        # Get region name with fallback to avoid NoneType errors
        region_result = aws.get_region()
        region_name_output = Output.from_input(region_result.name if region_result.name else "us-east-1")
        
        self.authorizer = aws.apigateway.Authorizer(
            f"api-authorizer-{self.environment_suffix}",
            name=f"custom-authorizer-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            authorizer_uri=Output.all(
                region_name_output,
                args.authorizer_lambda_arn
            ).apply(
                lambda args: f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/functions/{args[1]}/invocations"
            ),
            authorizer_credentials=self._create_api_gateway_role().arn,
            type="TOKEN",
            identity_source="method.request.header.Authorization",
            authorizer_result_ttl_in_seconds=300,
            opts=ResourceOptions(parent=self.rest_api)
        )

        # Grant API Gateway permission to invoke authorizer Lambda
        aws.lambda_.Permission(
            f"api-authorizer-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=args.authorizer_lambda_name,
            principal="apigateway.amazonaws.com",
            source_arn=self.rest_api.execution_arn.apply(lambda arn: f"{arn}/*"),
            opts=ResourceOptions(parent=self.authorizer)
        )

        # Create /payments resource
        self.payments_resource = aws.apigateway.Resource(
            f"payments-resource-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            parent_id=self.rest_api.root_resource_id,
            path_part="payments",
            opts=ResourceOptions(parent=self.rest_api)
        )

        # POST /payments method
        self.post_payment_method = aws.apigateway.Method(
            f"post-payment-method-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            resource_id=self.payments_resource.id,
            http_method="POST",
            authorization="CUSTOM",
            authorizer_id=self.authorizer.id,
            request_parameters={
                "method.request.header.Authorization": True
            },
            opts=ResourceOptions(parent=self.payments_resource)
        )

        # Mock integration (in real scenario, this would route to Lambda/backend)
        self.post_payment_integration = aws.apigateway.Integration(
            f"post-payment-integration-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            resource_id=self.payments_resource.id,
            http_method=self.post_payment_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": json.dumps({
                    "statusCode": 200
                })
            },
            opts=ResourceOptions(parent=self.post_payment_method)
        )

        # Method response
        self.post_payment_method_response = aws.apigateway.MethodResponse(
            f"post-payment-method-response-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            resource_id=self.payments_resource.id,
            http_method=self.post_payment_method.http_method,
            status_code="200",
            response_models={
                "application/json": "Empty"
            },
            opts=ResourceOptions(parent=self.post_payment_method)
        )

        # Integration response
        self.post_payment_integration_response = aws.apigateway.IntegrationResponse(
            f"post-payment-integration-response-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            resource_id=self.payments_resource.id,
            http_method=self.post_payment_method.http_method,
            status_code=self.post_payment_method_response.status_code,
            response_templates={
                "application/json": json.dumps({
                    "message": "Payment processed successfully",
                    "environment": self.environment_suffix
                })
            },
            opts=ResourceOptions(
                parent=self.post_payment_method,
                depends_on=[self.post_payment_integration]
            )
        )

        # GET /payments method
        self.get_payment_method = aws.apigateway.Method(
            f"get-payment-method-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            resource_id=self.payments_resource.id,
            http_method="GET",
            authorization="CUSTOM",
            authorizer_id=self.authorizer.id,
            request_parameters={
                "method.request.header.Authorization": True
            },
            opts=ResourceOptions(parent=self.payments_resource)
        )

        # GET integration
        self.get_payment_integration = aws.apigateway.Integration(
            f"get-payment-integration-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            resource_id=self.payments_resource.id,
            http_method=self.get_payment_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": json.dumps({
                    "statusCode": 200
                })
            },
            opts=ResourceOptions(parent=self.get_payment_method)
        )

        # Deploy API
        self.deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            opts=ResourceOptions(
                parent=self.rest_api,
                depends_on=[
                    self.post_payment_integration_response,
                    self.get_payment_integration
                ]
            )
        )

        # Create stage
        self.stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            deployment=self.deployment.id,
            stage_name=self.environment_suffix,
            description=f"API stage for {self.environment_suffix}",
            xray_tracing_enabled=True,
            tags={
                **self.tags,
                'Name': f"api-stage-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.deployment)
        )

        # Enable CloudWatch logging
        self.stage_settings = aws.apigateway.MethodSettings(
            f"api-stage-settings-{self.environment_suffix}",
            rest_api=self.rest_api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                metrics_enabled=True,
                logging_level="INFO",
                data_trace_enabled=True,
                throttling_burst_limit=5000,
                throttling_rate_limit=10000
            ),
            opts=ResourceOptions(parent=self.stage)
        )

        # API Gateway endpoint
        # Get region with fallback to avoid NoneType errors in tests
        region_result = aws.get_region()
        region_name = Output.from_input(region_result.name if region_result.name else "us-east-1")
        self.api_endpoint = Output.all(
            self.rest_api.id,
            region_name,
            self.stage.stage_name
        ).apply(lambda args: f"https://{args[0]}.execute-api.{args[1]}.amazonaws.com/{args[2]}")

        # Register outputs
        self.register_outputs({
            'api_gateway_id': self.rest_api.id,
            'api_endpoint': self.api_endpoint,
            'api_stage_name': self.stage.stage_name,
            'authorizer_id': self.authorizer.id
        })

    def _create_api_gateway_role(self) -> aws.iam.Role:
        """Create IAM role for API Gateway to invoke Lambda."""

        role = aws.iam.Role(
            f"api-gateway-role-{self.environment_suffix}",
            name=f"api-gateway-auth-role-{self.environment_suffix}",
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
            tags={
                **self.tags,
                'Name': f"api-gateway-role-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Inline policy to invoke Lambda
        aws.iam.RolePolicy(
            f"api-gateway-lambda-invoke-policy-{self.environment_suffix}",
            role=role.name,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "lambda:InvokeFunction",
                    "Effect": "Allow",
                    "Resource": "*"
                }]
            }),
            opts=ResourceOptions(parent=role)
        )

        return role

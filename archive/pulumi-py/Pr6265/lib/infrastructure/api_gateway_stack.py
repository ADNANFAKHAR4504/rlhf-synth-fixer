"""
API Gateway REST APIs in both regions.
BUG #17: API Gateway stage missing access logging configuration
BUG #18: Missing throttling settings (rate limiting)
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class ApiGatewayStack(pulumi.ComponentResource):
    """API Gateway REST APIs for primary and secondary regions."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_lambda_arn: Output[str],
        secondary_lambda_arn: Output[str],
        domain_name: Optional[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:ApiGatewayStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-apigw-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-apigw-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # Primary API Gateway
        self.primary_api = aws.apigateway.RestApi(
            f"trading-api-primary-{environment_suffix}",
            name=f"trading-api-primary-{environment_suffix}",
            description="Trading platform API - Primary region",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={**tags, 'Name': f"trading-api-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Create resource and method for primary
        self.primary_resource = aws.apigateway.Resource(
            f"trading-orders-resource-primary-{environment_suffix}",
            rest_api=self.primary_api.id,
            parent_id=self.primary_api.root_resource_id,
            path_part="orders",
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_method = aws.apigateway.Method(
            f"trading-orders-method-primary-{environment_suffix}",
            rest_api=self.primary_api.id,
            resource_id=self.primary_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        self.primary_integration = aws.apigateway.Integration(
            f"trading-orders-integration-primary-{environment_suffix}",
            rest_api=self.primary_api.id,
            resource_id=self.primary_resource.id,
            http_method=self.primary_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=primary_lambda_arn.apply(
                lambda arn: f"arn:aws:apigateway:{primary_region}:lambda:path/2015-03-31/functions/{arn}/invocations"
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Lambda permission for primary API
        aws.lambda_.Permission(
            f"trading-api-lambda-permission-primary-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=primary_lambda_arn,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(self.primary_api.execution_arn, self.primary_method.http_method).apply(
                lambda args: f"{args[0]}/*/{args[1]}/orders"
            ),
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # BUG #17: Stage missing access logging configuration
        # BUG #18: No throttling settings configured
        self.primary_deployment = aws.apigateway.Deployment(
            f"trading-api-deployment-primary-{environment_suffix}",
            rest_api=self.primary_api.id,
            opts=ResourceOptions(parent=self, provider=primary_provider, depends_on=[
                self.primary_integration
            ])
        )

        self.primary_stage = aws.apigateway.Stage(
            f"trading-api-stage-primary-{environment_suffix}",
            deployment=self.primary_deployment.id,
            rest_api=self.primary_api.id,
            stage_name="prod",
            # BUG #17: Missing access_log_settings!
            # BUG #18: No throttle_settings!
            tags={**tags, 'Name': f"trading-api-stage-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary API Gateway (similar structure)
        self.secondary_api = aws.apigateway.RestApi(
            f"trading-api-secondary-{environment_suffix}",
            name=f"trading-api-secondary-{environment_suffix}",
            description="Trading platform API - Secondary region",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={**tags, 'Name': f"trading-api-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_resource = aws.apigateway.Resource(
            f"trading-orders-resource-secondary-{environment_suffix}",
            rest_api=self.secondary_api.id,
            parent_id=self.secondary_api.root_resource_id,
            path_part="orders",
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_method = aws.apigateway.Method(
            f"trading-orders-method-secondary-{environment_suffix}",
            rest_api=self.secondary_api.id,
            resource_id=self.secondary_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_integration = aws.apigateway.Integration(
            f"trading-orders-integration-secondary-{environment_suffix}",
            rest_api=self.secondary_api.id,
            resource_id=self.secondary_resource.id,
            http_method=self.secondary_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=secondary_lambda_arn.apply(
                lambda arn: f"arn:aws:apigateway:{secondary_region}:lambda:path/2015-03-31/functions/{arn}/invocations"
            ),
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        aws.lambda_.Permission(
            f"trading-api-lambda-permission-secondary-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=secondary_lambda_arn,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(self.secondary_api.execution_arn, self.secondary_method.http_method).apply(
                lambda args: f"{args[0]}/*/{args[1]}/orders"
            ),
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.secondary_deployment = aws.apigateway.Deployment(
            f"trading-api-deployment-secondary-{environment_suffix}",
            rest_api=self.secondary_api.id,
            opts=ResourceOptions(parent=self, provider=secondary_provider, depends_on=[
                self.secondary_integration
            ])
        )

        self.secondary_stage = aws.apigateway.Stage(
            f"trading-api-stage-secondary-{environment_suffix}",
            deployment=self.secondary_deployment.id,
            rest_api=self.secondary_api.id,
            stage_name="prod",
            # Same bugs as primary
            tags={**tags, 'Name': f"trading-api-stage-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.primary_api_id = self.primary_api.id
        self.primary_api_endpoint = pulumi.Output.concat(
            "https://", self.primary_api.id,
            f".execute-api.{primary_region}.amazonaws.com/", self.primary_stage.stage_name
        )
        self.secondary_api_endpoint = pulumi.Output.concat(
            "https://", self.secondary_api.id,
            f".execute-api.{secondary_region}.amazonaws.com/", self.secondary_stage.stage_name
        )

        self.register_outputs({
            'primary_api_id': self.primary_api.id,
            'primary_api_endpoint': self.primary_api_endpoint,
            'secondary_api_endpoint': self.secondary_api_endpoint,
        })

"""
api_gateway_stack.py

API Gateway REST API with Lambda integrations and throttling.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional
import json


class ApiGatewayStack(pulumi.ComponentResource):
    """API Gateway REST API with Lambda integrations."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        payment_processor_invoke_arn: Output[str],
        payment_processor_arn: Output[str],
        session_manager_invoke_arn: Output[str],
        session_manager_arn: Output[str],
        api_logs_bucket_arn: Output[str],
        throttle_burst: int,
        throttle_rate: int,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:apigateway:ApiGatewayStack", name, None, opts)

        # Create REST API
        self.api = aws.apigateway.RestApi(
            f"payment-api-{environment_suffix}",
            name=f"payment-api-{environment_suffix}",
            description=f"Payment Processing API - {environment_suffix}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL",
            ),
            tags={**tags, "Name": f"payment-api-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create /transactions resource
        transactions_resource = aws.apigateway.Resource(
            f"transactions-resource-{environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="transactions",
            opts=ResourceOptions(parent=self)
        )

        # POST /transactions method
        transactions_method = aws.apigateway.Method(
            f"transactions-post-method-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration for transactions
        transactions_integration = aws.apigateway.Integration(
            f"transactions-integration-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=transactions_resource.id,
            http_method=transactions_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=payment_processor_invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for API Gateway to invoke payment processor
        aws.lambda_.Permission(
            f"payment-processor-api-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=payment_processor_arn,
            principal="apigateway.amazonaws.com",
            source_arn=self.api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # Create /sessions resource
        sessions_resource = aws.apigateway.Resource(
            f"sessions-resource-{environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="sessions",
            opts=ResourceOptions(parent=self)
        )

        # POST /sessions method
        sessions_post_method = aws.apigateway.Method(
            f"sessions-post-method-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=sessions_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )

        # GET /sessions method
        sessions_get_method = aws.apigateway.Method(
            f"sessions-get-method-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=sessions_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration for sessions POST
        sessions_post_integration = aws.apigateway.Integration(
            f"sessions-post-integration-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=sessions_resource.id,
            http_method=sessions_post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=session_manager_invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda integration for sessions GET
        sessions_get_integration = aws.apigateway.Integration(
            f"sessions-get-integration-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=sessions_resource.id,
            http_method=sessions_get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=session_manager_invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda permission for API Gateway to invoke session manager
        aws.lambda_.Permission(
            f"session-manager-api-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=session_manager_arn,
            principal="apigateway.amazonaws.com",
            source_arn=self.api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(parent=self)
        )

        # Deploy API
        deployment = aws.apigateway.Deployment(
            f"api-deployment-{environment_suffix}",
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[
                    transactions_integration,
                    sessions_post_integration,
                    sessions_get_integration,
                ]
            )
        )

        # Create stage
        self.stage = aws.apigateway.Stage(
            f"api-stage-{environment_suffix}",
            rest_api=self.api.id,
            deployment=deployment.id,
            stage_name=environment_suffix,
            tags={**tags, "Name": f"api-stage-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Configure method settings with throttling
        aws.apigateway.MethodSettings(
            f"api-method-settings-{environment_suffix}",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                metrics_enabled=True,
                logging_level="INFO",
                data_trace_enabled=True,
                throttling_burst_limit=throttle_burst,
                throttling_rate_limit=throttle_rate,
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.stage])
        )

        # API Gateway account (for CloudWatch logging)
        cloudwatch_role = aws.iam.Role(
            f"api-gateway-cloudwatch-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "apigateway.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, "Name": f"api-gateway-cloudwatch-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"api-gateway-cloudwatch-policy-{environment_suffix}",
            role=cloudwatch_role.name,
            policy_arn=(
                "arn:aws:iam::aws:policy/service-role/"
                "AmazonAPIGatewayPushToCloudWatchLogs"
            ),
            opts=ResourceOptions(parent=self)
        )

        self.api_url = Output.concat(
            "https://",
            self.api.id,
            ".execute-api.us-east-1.amazonaws.com/",
            self.stage.stage_name
        )

        self.register_outputs({
            "api_id": self.api.id,
            "api_url": self.api_url,
            "stage_name": self.stage.stage_name,
        })

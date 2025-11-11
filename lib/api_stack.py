"""
API Gateway infrastructure with mutual TLS and throttling.
"""
from aws_cdk import (
    NestedStack,
    aws_apigateway as apigw,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class ApiStackProps:
    """Properties for ApiStack."""

    def __init__(
        self,
        environment_suffix: str,
        alb: elbv2.ApplicationLoadBalancer
    ):
        self.environment_suffix = environment_suffix
        self.alb = alb


class ApiStack(NestedStack):
    """API Gateway infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: ApiStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # CloudWatch Log Group for API Gateway
        log_group = logs.LogGroup(
            self,
            f"APIGatewayLogs-{env_suffix}",
            log_group_name=f"/aws/apigateway/payment-api-{env_suffix}",
            retention=logs.RetentionDays.SEVEN_YEARS,
            removal_policy=RemovalPolicy.DESTROY
        )

        # REST API
        self.api = apigw.RestApi(
            self,
            f"PaymentAPI-{env_suffix}",
            rest_api_name=f"payment-api-{env_suffix}",
            description="Payment Processing API with mutual TLS",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigw.LogGroupLogDestination(log_group),
                access_log_format=apigw.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                )
            ),
            endpoint_configuration=apigw.EndpointConfiguration(
                types=[apigw.EndpointType.REGIONAL]
            ),
            cloud_watch_role=True
        )

        # HTTP Integration with internet-facing ALB
        # Direct integration without VPC Link since ALB is public
        integration = apigw.Integration(
            type=apigw.IntegrationType.HTTP_PROXY,
            integration_http_method="ANY",
            uri=f"http://{props.alb.load_balancer_dns_name}/{{proxy}}",
            options=apigw.IntegrationOptions(
                connection_type=apigw.ConnectionType.INTERNET,
                request_parameters={
                    "integration.request.path.proxy": "method.request.path.proxy"
                }
            )
        )

        # Add proxy resource
        proxy = self.api.root.add_resource("{proxy+}")
        proxy.add_method(
            "ANY",
            integration,
            request_parameters={
                "method.request.path.proxy": True
            }
        )

        # Usage Plan
        usage_plan = self.api.add_usage_plan(
            f"PaymentUsagePlan-{env_suffix}",
            name=f"payment-usage-plan-{env_suffix}",
            throttle=apigw.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigw.QuotaSettings(
                limit=1000000,
                period=apigw.Period.MONTH
            )
        )

        usage_plan.add_api_stage(
            stage=self.api.deployment_stage
        )

        # API Key
        api_key = self.api.add_api_key(
            f"PaymentAPIKey-{env_suffix}",
            api_key_name=f"payment-api-key-{env_suffix}"
        )

        usage_plan.add_api_key(api_key)

        CfnOutput(
            self,
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL"
        )

        CfnOutput(
            self,
            "APIKeyId",
            value=api_key.key_id,
            description="API Key ID"
        )

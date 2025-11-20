"""api_gateway_stack.py
API Gateway stack with consolidated REST APIs.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_apigateway as apigw,
    aws_lambda as _lambda,
    aws_logs as logs,
)
from constructs import Construct


class ApiGatewayStackProps:
    """Properties for API Gateway Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str,
        payment_processor: _lambda.IFunction,
        transaction_validator: _lambda.IFunction,
        fraud_detector: _lambda.IFunction
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment
        self.payment_processor = payment_processor
        self.transaction_validator = transaction_validator
        self.fraud_detector = fraud_detector


class ApiGatewayStack(cdk.Stack):
    """
    API Gateway Stack consolidating multiple REST APIs into a single deployment.
    Requirement 3: Consolidate duplicate API Gateway REST APIs into a single deployment
    Requirement 6: Configure CloudWatch Log Groups with 7-day retention
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: ApiGatewayStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix
        environment = props.environment

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Create CloudWatch Log Group with 7-day retention (Requirement 6)
        log_group = logs.LogGroup(
            self,
            f"{environment}-payment-log-api",
            # 7-day retention (Requirement 6)
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Consolidated REST API (Requirement 3)
        # Instead of multiple separate APIs, create one unified API
        self.api = apigw.RestApi(
            self,
            f"{environment}-payment-api-main",
            rest_api_name=f"{environment}-payment-api-consolidated",
            description="Consolidated payment processing API",
            deploy_options=apigw.StageOptions(
                stage_name=environment,
                metrics_enabled=True,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
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
                    user=True)))

        # Payments resource and methods
        payments = self.api.root.add_resource("payments")
        payments.add_method(
            "POST",
            apigw.LambdaIntegration(props.payment_processor)
        )

        # Transactions resource and methods
        transactions = self.api.root.add_resource("transactions")
        transactions.add_method(
            "POST",
            apigw.LambdaIntegration(props.transaction_validator)
        )
        transactions.add_method(
            "GET",
            apigw.LambdaIntegration(props.transaction_validator)
        )

        # Fraud detection resource and methods
        fraud = self.api.root.add_resource("fraud")
        fraud.add_method(
            "POST",
            apigw.LambdaIntegration(props.fraud_detector)
        )

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.api).add(key, value)

        # Outputs
        cdk.CfnOutput(
            self,
            "ApiUrl",
            value=self.api.url,
            export_name=f"{environment}-payment-api-url"
        )

        cdk.CfnOutput(
            self,
            "ApiId",
            value=self.api.rest_api_id,
            export_name=f"{environment}-payment-api-id"
        )

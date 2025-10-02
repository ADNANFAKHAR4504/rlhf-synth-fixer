"""api_stack.py
This module defines the API Gateway REST API stack.
"""

from typing import Optional
from constructs import Construct
from aws_cdk import aws_apigateway as apigateway, aws_lambda as lambda_, CfnOutput


class ApiStackProps:
    """Properties for ApiStack."""

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        handler_function: lambda_.Function = None,
    ):
        self.environment_suffix = environment_suffix
        self.handler_function = handler_function


class ApiStack(Construct):
    """Stack for API Gateway REST API."""

    def __init__(
        self, scope: Construct, construct_id: str, props: ApiStackProps = None
    ):
        super().__init__(scope, construct_id)

        suffix = props.environment_suffix if props else "dev"

        # Create REST API with X-Ray tracing
        self.api = apigateway.RestApi(
            self,
            f"ProductReviewsAPI{suffix}",
            rest_api_name=f"ProductReviewsAPI-{suffix}",
            description="REST API for product reviews",
            deploy_options=apigateway.StageOptions(
                stage_name=suffix,
                tracing_enabled=True,
                throttling_rate_limit=10,
                throttling_burst_limit=20,
                metrics_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.OFF,
            ),
        )

        # Create Lambda integration
        if props and props.handler_function:
            lambda_integration = apigateway.LambdaIntegration(
                props.handler_function,
                request_templates={"application/json": '{ "statusCode": "200" }'},
            )

            # Add /reviews resource
            reviews_resource = self.api.root.add_resource("reviews")

            # Add GET method for retrieving reviews
            reviews_resource.add_method(
                "GET",
                lambda_integration,
                method_responses=[
                    apigateway.MethodResponse(
                        status_code="200",
                        response_models={
                            "application/json": apigateway.Model.EMPTY_MODEL
                        },
                    )
                ],
            )

            # Add POST method for submitting reviews
            reviews_resource.add_method(
                "POST",
                lambda_integration,
                method_responses=[
                    apigateway.MethodResponse(
                        status_code="201",
                        response_models={
                            "application/json": apigateway.Model.EMPTY_MODEL
                        },
                    )
                ],
            )

        # Output API endpoint
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self, "ApiId", value=self.api.rest_api_id, description="API Gateway ID"
        )

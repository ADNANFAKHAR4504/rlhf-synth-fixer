from aws_cdk import (
    Stack,
    aws_apigateway as apigw,
    aws_lambda as _lambda,
    Tags,
    CfnOutput
)
from constructs import Construct

class ApiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 payment_validation_fn: _lambda.Function,
                 transaction_processing_fn: _lambda.Function,
                 notification_fn: _lambda.Function,
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create API Gateway REST API
        self.api = apigw.RestApi(
            self, f"PaymentAPI-{environment_suffix}",
            rest_api_name=f"payment-api-{environment_suffix}",
            description=f"Payment Processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_burst_limit=10000,
                throttling_rate_limit=10000
            ),
            endpoint_types=[apigw.EndpointType.REGIONAL]
        )

        # Health check endpoint
        health = self.api.root.add_resource("health")
        health.add_method(
            "GET",
            apigw.MockIntegration(
                integration_responses=[
                    apigw.IntegrationResponse(
                        status_code="200",
                        response_templates={
                            "application/json": '{"status": "healthy"}'
                        }
                    )
                ],
                request_templates={
                    "application/json": '{"statusCode": 200}'
                }
            ),
            method_responses=[
                apigw.MethodResponse(status_code="200")
            ]
        )

        # Payment validation endpoint
        validate = self.api.root.add_resource("validate")
        validate.add_method(
            "POST",
            apigw.LambdaIntegration(payment_validation_fn),
            request_validator=apigw.RequestValidator(
                self, f"ValidateRequestValidator-{environment_suffix}",
                rest_api=self.api,
                validate_request_body=True,
                validate_request_parameters=False
            )
        )

        # Transaction processing endpoint
        process = self.api.root.add_resource("process")
        process.add_method(
            "POST",
            apigw.LambdaIntegration(transaction_processing_fn),
            request_validator=apigw.RequestValidator(
                self, f"ProcessRequestValidator-{environment_suffix}",
                rest_api=self.api,
                validate_request_body=True,
                validate_request_parameters=False
            )
        )

        # Notification endpoint
        notify = self.api.root.add_resource("notify")
        notify.add_method(
            "POST",
            apigw.LambdaIntegration(notification_fn),
            request_validator=apigw.RequestValidator(
                self, f"NotifyRequestValidator-{environment_suffix}",
                rest_api=self.api,
                validate_request_body=True,
                validate_request_parameters=False
            )
        )

        # Outputs
        CfnOutput(
            self, "APIEndpoint",
            value=self.api.url,
            export_name=f"api-url-{environment_suffix}"
        )

        CfnOutput(
            self, "APIId",
            value=self.api.rest_api_id,
            export_name=f"api-id-{environment_suffix}"
        )

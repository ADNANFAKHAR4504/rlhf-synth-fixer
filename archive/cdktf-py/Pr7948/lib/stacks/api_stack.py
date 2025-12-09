"""API infrastructure - API Gateway with custom domains"""

from constructs import Construct
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage, Apigatewayv2StageAccessLogSettings
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.acm_certificate import AcmCertificate, AcmCertificateDomainValidationOptions
from cdktf_cdktf_provider_aws.acm_certificate_validation import AcmCertificateValidation
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json


class ApiStack(Construct):
    """Creates API Gateway with custom domain and ACM certificate"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        region: str,
        environment_suffix: str,
        lambda_function
    ):
        super().__init__(scope, construct_id)

        self.region = region
        self.environment_suffix = environment_suffix

        # CloudWatch Log Group for API Gateway
        log_group = CloudwatchLogGroup(
            self,
            "api-logs",
            name=f"/aws/apigateway/dr-api-{region}-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"dr-api-logs-{region}-{environment_suffix}"
            }
        )

        # API Gateway HTTP API
        self.api_gateway = Apigatewayv2Api(
            self,
            "api",
            name=f"dr-payment-api-{region}-{environment_suffix}",
            protocol_type="HTTP",
            cors_configuration={
                "allow_origins": ["*"],
                "allow_methods": ["GET", "POST", "PUT", "DELETE"],
                "allow_headers": ["*"],
                "max_age": 300
            },
            tags={
                "Name": f"dr-payment-api-{region}-{environment_suffix}"
            }
        )

        # Lambda integration
        integration = Apigatewayv2Integration(
            self,
            "lambda-integration",
            api_id=self.api_gateway.id,
            integration_type="AWS_PROXY",
            integration_uri=lambda_function.arn,
            integration_method="POST",
            payload_format_version="2.0"
        )

        # Routes
        Apigatewayv2Route(
            self,
            "payment-route",
            api_id=self.api_gateway.id,
            route_key="POST /payment",
            target=f"integrations/{integration.id}"
        )

        Apigatewayv2Route(
            self,
            "health-route",
            api_id=self.api_gateway.id,
            route_key="GET /health",
            target=f"integrations/{integration.id}"
        )

        # API Stage
        self.api_stage = Apigatewayv2Stage(
            self,
            "api-stage",
            api_id=self.api_gateway.id,
            name="prod",
            auto_deploy=True,
            access_log_settings=Apigatewayv2StageAccessLogSettings(
                destination_arn=log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            ),
            tags={
                "Name": f"dr-api-stage-{region}-{environment_suffix}"
            }
        )

        # Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api-lambda-permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=lambda_function.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api_gateway.execution_arn}/*/*"
        )

        # API endpoint
        self.api_endpoint = f"{self.api_gateway.api_endpoint}/{self.api_stage.name}"

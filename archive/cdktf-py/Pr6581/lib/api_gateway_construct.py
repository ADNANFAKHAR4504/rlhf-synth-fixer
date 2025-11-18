"""API Gateway REST API."""
from cdktf_cdktf_provider_aws.api_gateway_deployment import \
    ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_integration import \
    ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from constructs import Construct


class ApiGatewayConstruct(Construct):
    """API Gateway for payment validation."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, validator_function):
        super().__init__(scope, id)

        # Get current region
        current_region = DataAwsRegion(self, "current-region")

        # REST API
        api = ApiGatewayRestApi(
            self, "api",
            name=f"payment-api-{environment_suffix}-ef",
            description="Payment processing API",
            tags={
                "Name": f"payment-api-{environment_suffix}-ef",
                "Environment": environment_suffix,
                "Project": "payment-processing",
                "CostCenter": "engineering"
            }
        )

        # /payments resource
        payments_resource = ApiGatewayResource(
            self, "payments-resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="payments"
        )

        # POST method
        method = ApiGatewayMethod(
            self, "post-method",
            rest_api_id=api.id,
            resource_id=payments_resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # Lambda integration
        integration = ApiGatewayIntegration(
            self, "lambda-integration",
            rest_api_id=api.id,
            resource_id=payments_resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=validator_function.invoke_arn
        )

        # Lambda permission
        LambdaPermission(
            self, "api-lambda-permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=validator_function.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Deployment
        deployment = ApiGatewayDeployment(
            self, "deployment",
            rest_api_id=api.id,
            depends_on=[integration]
        )

        # Stage
        stage = ApiGatewayStage(
            self, "stage",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            tags={
                "Name": f"payment-api-prod-{environment_suffix}-ef",
                "Environment": environment_suffix
            }
        )

        self.api_url = f"https://{api.id}.execute-api.{current_region.id}.amazonaws.com/{stage.stage_name}/payments"

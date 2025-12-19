"""API Gateway infrastructure."""

from constructs import Construct
from cdktf_cdktf_provider_aws.api_gateway_rest_api import (
    ApiGatewayRestApi,
    ApiGatewayRestApiEndpointConfiguration,
)
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf import Fn


class ApiGatewayConstruct(Construct):
    """Construct for API Gateway infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        data_processor_function_name: str,
        data_processor_invoke_arn: str,
    ):
        """Initialize API Gateway infrastructure."""
        super().__init__(scope, construct_id)

        # Create REST API
        self.api = ApiGatewayRestApi(
            self,
            "healthcare_api",
            name=f"healthcare-api-{environment_suffix}",
            description="HIPAA-compliant Healthcare Data Processing API",
            endpoint_configuration=ApiGatewayRestApiEndpointConfiguration(
                types=["REGIONAL"]
            ),
        )

        # Create resource
        patients_resource = ApiGatewayResource(
            self,
            "patients_resource",
            rest_api_id=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="patients",
        )

        # Create POST method
        post_method = ApiGatewayMethod(
            self,
            "patients_post_method",
            rest_api_id=self.api.id,
            resource_id=patients_resource.id,
            http_method="POST",
            authorization="NONE",
        )

        # Create Lambda integration
        integration = ApiGatewayIntegration(
            self,
            "patients_post_integration",
            rest_api_id=self.api.id,
            resource_id=patients_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=data_processor_invoke_arn,
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=self.api.id,
            depends_on=[integration],
            lifecycle={"create_before_destroy": True},
        )

        # Create stage
        self.stage = ApiGatewayStage(
            self,
            "api_stage",
            deployment_id=deployment.id,
            rest_api_id=self.api.id,
            stage_name="prod",
        )

        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self,
            "api_gateway_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=data_processor_function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api.execution_arn}/*/*",
        )

        # Export values
        self.api_gateway_id = self.api.id
        self.api_gateway_stage_name = self.stage.stage_name
        self.api_gateway_endpoint = f"https://{self.api.id}.execute-api.{Fn.element(Fn.split(':', self.api.arn), 3)}.amazonaws.com/{self.stage.stage_name}"

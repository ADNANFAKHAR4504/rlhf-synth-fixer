from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    Stack,
    CfnOutput,
    Environment
)
from constructs import Construct

class MultiRegionStack(Stack):

    def __init__(self, scope: Construct, id: str, region: str, **kwargs) -> None:
        super().__init__(scope, id, env=Environment(region=region), **kwargs)

        # Define Lambda Execution Role
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Define Lambda Function
        lambda_function = _lambda.Function(self, "MyLambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            role=lambda_role
        )

        # Define API Gateway
        api = apigateway.RestApi(self, "MyApiGateway",
            rest_api_name="MultiRegionService",
            description="API Gateway for multi-region Lambda deployment",
            deploy_options=apigateway.StageOptions(stage_name="prod")
        )

        integration = apigateway.LambdaIntegration(lambda_function)

        resource = api.root.add_resource("myresource")
        resource.add_method("GET", integration)

        # Output the API Endpoint
        CfnOutput(self, "ApiEndpoint", value=api.url)
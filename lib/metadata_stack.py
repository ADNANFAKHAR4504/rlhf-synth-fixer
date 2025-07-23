from aws_cdk import (
    Stack,
    Duration,
    Tags,
    aws_lambda as _lambda,
    aws_iam as _iam,
)
from constructs import Construct

class ServerlessDemoStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define the Lambda execution role
        lambda_role = _iam.Role(self, "LambdaExecutionRole",
            assumed_by=_iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                _iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Define the Lambda function with a timeout and prefixed name
        lambda_function = _lambda.Function(self, "ServerlessDemoFunction",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="lambda_handler.handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            timeout=Duration.seconds(15),  # Set timeout to 15 seconds
            function_name="serverless_demo_function",
            role=lambda_role,
            environment={
                "LOG_LEVEL": "INFO"
            }
        )

        # Tag the Lambda function for identification
        Tags.of(lambda_function).add("Project", "serverless_demo")

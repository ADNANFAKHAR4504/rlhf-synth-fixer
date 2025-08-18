from typing import Optional
from aws_cdk import (
    Stack,
    NestedStack,
    NestedStackProps,
    Duration,
    CfnOutput,
    Tags
)
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigateway
from aws_cdk import aws_logs as logs
from aws_cdk import aws_iam as iam
from constructs import Construct


class ServerlessApiStack(NestedStack):
  def __init__(
      self,
      scope: Construct,
      id: str,
      environment_suffix: str,
      **kwargs
  ) -> None:
    super().__init__(scope, id, **kwargs)

    # Define reusable tags
    tags = {
        "Environment": "Production",
        "Stack": f"ServerlessApiStack-{environment_suffix}"
    }

    api_name = f"ProductionService-{environment_suffix}"
    lambda_name = f"StatusHandler-{environment_suffix}"

    # Lambda Function
    lambda_function = _lambda.Function(
        self, lambda_name,
        function_name=lambda_name,
        runtime=_lambda.Runtime.PYTHON_3_9,
        handler="handler.main",
        code=_lambda.Code.from_asset("lib/lambda"),
        environment={"LOG_LEVEL": "INFO"},
        timeout=Duration.seconds(10),
        memory_size=512,
        reserved_concurrent_executions=100,
        log_retention=logs.RetentionDays.ONE_WEEK
    )

    # IAM permissions (least privilege)
    lambda_function.add_to_role_policy(
        iam.PolicyStatement(
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=["arn:aws:logs:*:*:*"]
        )
    )

    # API Gateway
    api = apigateway.RestApi(
        self, api_name,
        rest_api_name=api_name,
        description="Production-ready API Gateway",
        deploy_options=apigateway.StageOptions(
            stage_name="prod",
            throttling_burst_limit=2000,
            throttling_rate_limit=1000,
            logging_level=apigateway.MethodLoggingLevel.INFO,
            data_trace_enabled=True
        ),
        cloud_watch_role=True,
        default_cors_preflight_options=apigateway.CorsOptions(
            allow_origins=apigateway.Cors.ALL_ORIGINS,
            allow_methods=apigateway.Cors.ALL_METHODS
        )
    )

    # Define GET /status endpoint
    status_resource = api.root.add_resource("status")
    status_resource.add_method(
        "GET",
        apigateway.LambdaIntegration(lambda_function),
        request_validator_options=apigateway.RequestValidatorOptions(
            request_validator_name=f"StatusValidator-{environment_suffix}",
            validate_request_body=False,
            validate_request_parameters=True
        )
    )

    # Apply tags to all known resources
    for construct in [self, lambda_function, api]:
      for key, value in tags.items():
        Tags.of(construct).add(key, value)

    # Outputs
    CfnOutput(self, "LambdaFunctionName",
              value=lambda_function.function_name,
              description="Lambda function name")

    CfnOutput(self, "ApiEndpoint",
              value=api.url,
              description="API Gateway base URL")

    CfnOutput(self, "Environment",
              value=tags["Environment"])

    CfnOutput(self, "LambdaLogGroup",
              value=f"/aws/lambda/{lambda_function.function_name}",
              description="Lambda log group name")

    CfnOutput(self, "HealthCheckEndpoint",
              value=api.url + "health",
              description="Health check URL")

    CfnOutput(self, "ApiVersion",
              value="v1",  # You could make this dynamic if needed
              description="API version")


class TapStackProps(Stack):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Global tags for the parent stack
    Tags.of(self).add("Environment", "Production")
    Tags.of(self).add("Project", "Tap")

    # Instantiate nested stack
    self.api_stack = ServerlessApiStack(
        self,
        f"ServerlessApiStack-{environment_suffix}",
        environment_suffix=environment_suffix
    )

import aws_cdk as cdk
from constructs import Construct
from aws_cdk import (
  Stack,
  aws_ec2 as ec2,
  aws_lambda as _lambda,
  aws_dynamodb as dynamodb,
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_cloudwatch as cloudwatch,
  CfnOutput
)


class ServerlessStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # VPC
    vpc = ec2.Vpc(
      self,
      "LambdaVPC",
      max_azs=2,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="PublicSubnet", subnet_type=ec2.SubnetType.PUBLIC
        )
      ],
    )

    CfnOutput(self, "VpcIdOutput", value=vpc.vpc_id, description="The VPC ID")

    # DynamoDB Table
    table = dynamodb.Table(
      self,
      "ItemTable",
      partition_key=dynamodb.Attribute(
        name="itemId", type=dynamodb.AttributeType.STRING
      ),
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
    )

    CfnOutput(self, "DynamoTableNameOutput", value=table.table_name, description="DynamoDB table name")

    # Lambda Execution Role
    lambda_role = iam.Role(
      self,
      "LambdaExecutionRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ],
    )

    # Add required EC2 permissions for Lambda in a VPC
    lambda_role.add_to_policy(
      iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ],
        resources=["*"]
      )
    )

    # Add CloudWatch log permissions (optional if not in the managed policy)
    lambda_role.add_to_policy(
      iam.PolicyStatement(
        actions=[
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources=["arn:aws:logs:*:*:*"],
      )
    )

    # Grant DynamoDB permissions
    table.grant_write_data(lambda_role)

    CfnOutput(self, "LambdaRoleNameOutput", value=lambda_role.role_name, description="Lambda execution role name")

    # Lambda Function
    lambda_function = _lambda.Function(
      self,
      "ItemFunction",
      runtime=_lambda.Runtime.PYTHON_3_9,
      code=_lambda.Code.from_asset("lib/lambda"),
      handler="index.handler",
      role=lambda_role,
      vpc=vpc,
      allow_public_subnet=True,
      environment={"TABLE_NAME": table.table_name},
    )

    CfnOutput(self, "LambdaFunctionNameOutput", value=lambda_function.function_name, description="Lambda function name")
    CfnOutput(self, "LambdaFunctionArnOutput", value=lambda_function.function_arn, description="Lambda function ARN")

    # CloudWatch Alarm for Lambda Errors
    alarm = cloudwatch.Alarm(
      self,
      "LambdaErrorsAlarm",
      metric=lambda_function.metric_errors(),
      threshold=1,
      evaluation_periods=1,
    )

    CfnOutput(self, "AlarmNameOutput", value=alarm.alarm_name, description="CloudWatch Alarm name")

    # API Gateway
    api = apigateway.RestApi(
      self,
      "ItemApi",
      rest_api_name="Item Service",
      default_cors_preflight_options=apigateway.CorsOptions(
        allow_origins=apigateway.Cors.ALL_ORIGINS,
        allow_methods=apigateway.Cors.ALL_METHODS,
      ),
    )

    CfnOutput(self, "ApiGatewayIdOutput", value=api.rest_api_id, description="API Gateway ID")
    CfnOutput(self, "ApiGatewayUrlOutput", value=api.url, description="API Gateway URL")

    integration = apigateway.LambdaIntegration(lambda_function)

    items = api.root.add_resource("item")
    items.add_method("GET", integration)

    # Tag all resources
    cdk.Tags.of(self).add("Environment", "Production")

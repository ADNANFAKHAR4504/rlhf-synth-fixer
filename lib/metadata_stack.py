import os
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
    CfnOutput(self, "VpcCidrBlockOutput", value=vpc.vpc_cidr_block, description="VPC CIDR block")
    
    # Output subnet IDs for verification
    CfnOutput(
      self, "PublicSubnetIdsOutput", 
      value=",".join([subnet.subnet_id for subnet in vpc.public_subnets]), 
      description="Comma-separated list of public subnet IDs"
    )
    
    # Output Internet Gateway ID
    CfnOutput(
      self, "InternetGatewayIdOutput", 
      value=vpc.internet_gateway_id, 
      description="Internet Gateway ID"
    )
    
    # Security Group for Lambda 
    lambda_security_group = ec2.SecurityGroup(
      self,
      "LambdaSecurityGroup",
      vpc=vpc,
      description="Security group for Lambda function",
      allow_all_outbound=True
    )
    
    CfnOutput(
      self, "LambdaSecurityGroupIdOutput", 
      value=lambda_security_group.security_group_id, 
      description="Lambda security group ID"
    )

    # DynamoDB Table Creation
    table = dynamodb.Table(
      self,
      "ItemTable",
      partition_key=dynamodb.Attribute(
        name="itemId", type=dynamodb.AttributeType.STRING
      ),
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
    )

    CfnOutput(
      self, "DynamoTableNameOutput", 
      value=table.table_name, 
      description="DynamoDB table name"
    )
    CfnOutput(
      self, "DynamoTableArnOutput", 
      value=table.table_arn, 
      description="DynamoDB table ARN"
    )

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

    CfnOutput(
      self, "LambdaRoleNameOutput", 
      value=lambda_role.role_name, 
      description="Lambda execution role name"
    )
    CfnOutput(
      self, "LambdaRoleArnOutput", 
      value=lambda_role.role_arn, 
      description="Lambda execution role ARN"
    )

    # Lambda Function
    # Determine lambda asset path dynamically
    lambda_asset_path = os.path.join(os.path.dirname(__file__), "lambda")
    if not os.path.exists(lambda_asset_path):
      lambda_asset_path = "lib/lambda"  # Fallback for root execution
    
    lambda_function = _lambda.Function(
      self,
      "ItemFunction",
      runtime=_lambda.Runtime.PYTHON_3_9,
      code=_lambda.Code.from_asset(lambda_asset_path),
      handler="handler.handler",
      role=lambda_role,
      vpc=vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
      security_groups=[lambda_security_group],
      allow_public_subnet=True,
      environment={"TABLE_NAME": table.table_name},
    )

    CfnOutput(
      self, "LambdaFunctionNameOutput", 
      value=lambda_function.function_name, 
      description="Lambda function name"
    )
    CfnOutput(
      self, "LambdaFunctionArnOutput", 
      value=lambda_function.function_arn, 
      description="Lambda function ARN"
    )
    CfnOutput(
      self, "LambdaFunctionVersionOutput", 
      value=lambda_function.version, 
      description="Lambda function version"
    )

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
    CfnOutput(
      self, "ApiGatewayStageNameOutput", 
      value=api.deployment_stage.stage_name, 
      description="API Gateway stage name"
    )

    integration = apigateway.LambdaIntegration(lambda_function)

    items = api.root.add_resource("item")
    items.add_method("GET", integration)

    # Tag all resources
    cdk.Tags.of(self).add("Environment", "Production")

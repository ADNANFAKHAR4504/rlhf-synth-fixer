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
    CfnOutput,
)


class ServerlessStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC creation
        self.vpc = ec2.Vpc(
            self,
            "LambdaVPC",
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet", subnet_type=ec2.SubnetType.PUBLIC
                )
            ],
        )

        CfnOutput(self, "VpcIdOutput", value=self.vpc.vpc_id, description="The VPC ID")
        CfnOutput(
            self,
            "VpcCidrBlockOutput",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR block",
        )

        # Output subnet IDs for verification
        CfnOutput(
            self,
            "PublicSubnetIdsOutput",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Comma-separated list of public subnet IDs",
        )

        # Output Internet Gateway ID
        CfnOutput(
            self,
            "InternetGatewayIdOutput",
            value=self.vpc.internet_gateway_id,
            description="Internet Gateway ID",
        )

        # Security Group for Lambda
        self.lambda_security_group = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda function",
            allow_all_outbound=True,
        )

        CfnOutput(
            self,
            "LambdaSecurityGroupIdOutput",
            value=self.lambda_security_group.security_group_id,
            description="Lambda security group ID",
        )

        # DynamoDB Table Creation
        self.table = dynamodb.Table(
            self,
            "ItemTable",
            partition_key=dynamodb.Attribute(
                name="itemId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        )

        CfnOutput(
            self,
            "DynamoTableNameOutput",
            value=self.table.table_name,
            description="DynamoDB table name",
        )
        CfnOutput(
            self,
            "DynamoTableArnOutput",
            value=self.table.table_arn,
            description="DynamoDB table ARN",
        )

        # Lambda Execution Role
        self.lambda_role = iam.Role(
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
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                ],
                resources=["*"],
            )
        )

        # Add CloudWatch log permissions (optional if not in the managed policy)
        self.lambda_role.add_to_policy(
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
        self.table.grant_write_data(self.lambda_role)

        CfnOutput(
            self,
            "LambdaRoleNameOutput",
            value=self.lambda_role.role_name,
            description="Lambda execution role name",
        )
        CfnOutput(
            self,
            "LambdaRoleArnOutput",
            value=self.lambda_role.role_arn,
            description="Lambda execution role ARN",
        )

        # Lambda Function
        # Determine lambda asset path dynamically
        lambda_asset_path = os.path.join(os.path.dirname(__file__), "lambda")
        if not os.path.exists(lambda_asset_path):
            lambda_asset_path = "lib/lambda"  # Fallback for root execution

        self.lambda_function = _lambda.Function(
            self,
            "ItemFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            code=_lambda.Code.from_asset(lambda_asset_path),
            handler="handler.handler",
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_groups=[self.lambda_security_group],
            allow_public_subnet=True,
            environment={"TABLE_NAME": self.table.table_name},
        )

        CfnOutput(
            self,
            "LambdaFunctionNameOutput",
            value=self.lambda_function.function_name,
            description="Lambda function name",
        )
        CfnOutput(
            self,
            "LambdaFunctionArnOutput",
            value=self.lambda_function.function_arn,
            description="Lambda function ARN",
        )
        CfnOutput(
            self,
            "LambdaFunctionVersionOutput",
            value="$LATEST",
            description="Lambda function version",
        )

        # CloudWatch Alarm for Lambda Errors
        self.alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorsAlarm",
            metric=self.lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1,
        )

        CfnOutput(
            self,
            "AlarmNameOutput",
            value=self.alarm.alarm_name,
            description="CloudWatch Alarm name",
        )

        # CloudWatch Log Group (automatically created by Lambda)
        self.log_group_name = f"/aws/lambda/{self.lambda_function.function_name}"
        CfnOutput(
            self,
            "LambdaLogGroupNameOutput",
            value=self.log_group_name,
            description="Lambda CloudWatch log group name",
        )

        # Route Table information for VPC validation
        # Get the route table for public subnets (automatically created by CDK)
        route_tables = []
        for subnet in self.vpc.public_subnets:
            route_tables.append(subnet.route_table.route_table_id)

        CfnOutput(
            self,
            "PublicRouteTableIdsOutput",
            value=",".join(route_tables),
            description="Comma-separated list of public route table IDs",
        )

        # Lambda VPC Configuration Details
        CfnOutput(
            self,
            "LambdaSubnetIdsOutput",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Lambda VPC subnet IDs",
        )

        # API Gateway
        self.api = apigateway.RestApi(
            self,
            "ItemApi",
            rest_api_name="Item Service",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
            ),
        )

        CfnOutput(
            self,
            "ApiGatewayIdOutput",
            value=self.api.rest_api_id,
            description="API Gateway ID",
        )
        CfnOutput(
            self,
            "ApiGatewayUrlOutput",
            value=self.api.url,
            description="API Gateway URL",
        )
        CfnOutput(
            self,
            "ApiGatewayStageNameOutput",
            value=self.api.deployment_stage.stage_name,
            description="API Gateway stage name",
        )

        integration = apigateway.LambdaIntegration(self.lambda_function)

        items = self.api.root.add_resource("item")
        items.add_method("GET", integration)

        # API Gateway resource details
        CfnOutput(
            self,
            "ApiGatewayItemResourceIdOutput",
            value=items.resource_id,
            description="API Gateway /item resource ID",
        )

        # DynamoDB additional details
        CfnOutput(
            self,
            "DynamoTableStreamStatusOutput",
            value="DISABLED",
            description="DynamoDB table stream status",
        )

        # Additional operational outputs for enhanced monitoring

        # Lambda execution environment details
        CfnOutput(
            self,
            "LambdaMemorySizeOutput",
            value="128",  # Default Lambda memory size
            description="Lambda function memory size in MB",
        )

        CfnOutput(
            self,
            "LambdaTimeoutOutput",
            value="3",  # Default Lambda timeout in seconds
            description="Lambda function timeout in seconds",
        )

        # API Gateway deployment details
        CfnOutput(
            self,
            "ApiGatewayDeploymentIdOutput",
            value=self.api.latest_deployment.deployment_id,
            description="API Gateway deployment ID",
        )

        # DynamoDB table status and billing details
        CfnOutput(
            self,
            "DynamoTableStatusOutput",
            value="ACTIVE",
            description="DynamoDB table status",
        )

        CfnOutput(
            self,
            "DynamoTableBillingModeOutput",
            value="PAY_PER_REQUEST",
            description="DynamoDB table billing mode",
        )

        # Security group rule details for operational visibility
        CfnOutput(
            self,
            "LambdaSecurityGroupEgressRuleCount",
            value="1",
            description="Number of egress rules in Lambda security group",
        )

        # VPC operational details
        CfnOutput(
            self,
            "VpcTenancyOutput",
            value="default",
            description="VPC instance tenancy",
        )

        CfnOutput(self, "VpcStateOutput", value="available", description="VPC state")

        # Tag all resources
        cdk.Tags.of(self).add("Environment", "Production")

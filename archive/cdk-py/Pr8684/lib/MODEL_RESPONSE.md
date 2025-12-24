```python
from aws_cdk import (
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_apigateway as apigateway,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    core
)

class ServerlessStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # VPC with two public subnets
        vpc = ec2.Vpc(self, "LambdaVPC", 
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(name="PublicSubnet", subnet_type=ec2.SubnetType.PUBLIC)
            ]
        )

        # DynamoDB Table
        table = dynamodb.Table(self, "ItemTable",
            partition_key=dynamodb.Attribute(name="itemId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # Lambda Execution Role
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant permissions to DynamoDB and CloudWatch
        table.grant_write_data(lambda_role)
        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            resources=["arn:aws:logs:*:*:*"]
        ))

        # Lambda Function
        lambda_function = _lambda.Function(self, "ItemFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            code=_lambda.Code.from_asset("lambda"),  # Assuming code is in 'lambda' directory
            handler="index.handler",
            role=lambda_role,
            vpc=vpc,
            environment={
                "TABLE_NAME": table.table_name
            }
        )

        # CloudWatch Alarm for Lambda Errors
        cloudwatch.Alarm(self, "LambdaErrorsAlarm",
            metric=lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1
        )

        # API Gateway
        api = apigateway.RestApi(self, "ItemApi",
            rest_api_name="Item Service",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS
            )
        )

        integration = apigateway.LambdaIntegration(lambda_function)

        items = api.root.add_resource("item")
        items.add_method("GET", integration)

        # Tagging all resources
        core.Tags.of(self).add("Environment", "Production")
```

## Infrastructure Overview

This CDK code creates the required infrastructure:

1. A VPC with two public subnets
2. A DynamoDB table with on-demand billing
3. A Lambda function with proper IAM permissions
4. CloudWatch alarm for Lambda errors
5. API Gateway with CORS enabled

The code follows best practices by:
- Using environment variables for configuration
- Keeping security policies least-privilege
- Using managed policies where appropriate
- Adding resource tagging
- Keeping the VPC configuration flexible for multiple regions

Make sure to:
1. Create a lambda/ directory with your Python handler code
2. Install required CDK packages
3. Deploy using cdk deploy after bootstrapping your target regions

"""lambda_stack.py
Lambda functions for transaction processing in both regions.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_iam as iam
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_logs as logs
from constructs import Construct


class LambdaStackProps:
    """Properties for Lambda stack."""

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        primary_vpc: ec2.IVpc,
        secondary_vpc: ec2.IVpc,
        table: dynamodb.ITableV2
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.primary_vpc = primary_vpc
        self.secondary_vpc = secondary_vpc
        self.table = table


class LambdaStack(Construct):
    """Creates Lambda functions in both regions."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: LambdaStackProps
    ):
        super().__init__(scope, construct_id)

        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self,
            f'LambdaExecutionRole{props.environment_suffix}',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            description='Execution role for transaction processing Lambda functions',
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    'service-role/AWSLambdaVPCAccessExecutionRole'
                )
            ]
        )

        # Grant DynamoDB permissions
        props.table.grant_read_write_data(lambda_role)

        # Primary Lambda function
        self.primary_function = lambda_.Function(
            self,
            f'PrimaryFunction{props.environment_suffix}',
            function_name=f'dr-transaction-processor-primary-{props.environment_suffix}',
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler='index.handler',
            code=lambda_.Code.from_asset('lib/lambda'),
            role=lambda_role,
            timeout=cdk.Duration.seconds(30),
            memory_size=512,
            environment={
                'TABLE_NAME': props.table.table_name,
                'REGION': props.primary_region,
                'ENVIRONMENT': props.environment_suffix
            },
            vpc=props.primary_vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            log_retention=logs.RetentionDays.ONE_MONTH,
            tracing=lambda_.Tracing.ACTIVE
        )

        # Secondary Lambda function (identical configuration)
        self.secondary_function = lambda_.Function(
            self,
            f'SecondaryFunction{props.environment_suffix}',
            function_name=f'dr-transaction-processor-secondary-{props.environment_suffix}',
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler='index.handler',
            code=lambda_.Code.from_asset('lib/lambda'),
            role=lambda_role,
            timeout=cdk.Duration.seconds(30),
            memory_size=512,
            environment={
                'TABLE_NAME': props.table.table_name,
                'REGION': props.secondary_region,
                'ENVIRONMENT': props.environment_suffix
            },
            vpc=props.secondary_vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            log_retention=logs.RetentionDays.ONE_MONTH,
            tracing=lambda_.Tracing.ACTIVE
        )

        # Tags
        cdk.Tags.of(self.primary_function).add('DR-Role', 'Primary-Compute')
        cdk.Tags.of(self.secondary_function).add('DR-Role', 'Secondary-Compute')

        # Outputs
        cdk.CfnOutput(
            self,
            'PrimaryFunctionArn',
            value=self.primary_function.function_arn,
            description='Primary Lambda function ARN'
        )
        cdk.CfnOutput(
            self,
            'SecondaryFunctionArn',
            value=self.secondary_function.function_arn,
            description='Secondary Lambda function ARN'
        )
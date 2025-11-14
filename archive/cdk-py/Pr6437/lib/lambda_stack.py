from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_ec2 as ec2,
    aws_iam as iam,
    Duration,
    Tags,
    CfnOutput
)
from constructs import Construct
import os

class LambdaStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Lambda execution role
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant DynamoDB permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[f"arn:aws:dynamodb:{self.region}:{self.account}:table/SessionTable-{environment_suffix}"]
            )
        )

        # Grant SNS permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=["sns:Publish"],
                resources=["*"]
            )
        )

        # Payment Validation Lambda
        self.payment_validation_fn = _lambda.Function(
            self, f"PaymentValidation-{environment_suffix}",
            function_name=f"payment-validation-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda/payment_validation"),
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix
            }
        )

        # Transaction Processing Lambda
        self.transaction_processing_fn = _lambda.Function(
            self, f"TransactionProcessing-{environment_suffix}",
            function_name=f"transaction-processing-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda/transaction_processing"),
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix
            }
        )

        # Notification Lambda
        self.notification_fn = _lambda.Function(
            self, f"Notification-{environment_suffix}",
            function_name=f"notification-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda/notification"),
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix
            }
        )

        # Outputs
        CfnOutput(
            self, "PaymentValidationFnArn",
            value=self.payment_validation_fn.function_arn,
            export_name=f"payment-validation-fn-{environment_suffix}"
        )

        CfnOutput(
            self, "TransactionProcessingFnArn",
            value=self.transaction_processing_fn.function_arn,
            export_name=f"transaction-processing-fn-{environment_suffix}"
        )

        CfnOutput(
            self, "NotificationFnArn",
            value=self.notification_fn.function_arn,
            export_name=f"notification-fn-{environment_suffix}"
        )

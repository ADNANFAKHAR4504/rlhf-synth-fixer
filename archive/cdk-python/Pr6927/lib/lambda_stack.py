"""lambda_stack.py
Lambda functions stack with optimized memory and concurrency settings.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_ec2 as ec2,
)
from constructs import Construct


class LambdaStackProps:
    """Properties for Lambda Stack."""

    def __init__(
        self,
        environment_suffix: str,
        environment: str,
        vpc: ec2.IVpc
    ):
        self.environment_suffix = environment_suffix
        self.environment = environment
        self.vpc = vpc


class LambdaStack(cdk.Stack):
    """
    Lambda Stack implementing memory optimization and concurrency limits.
    Requirement 1: Resize Lambda functions from 3008MB to 512-1024MB
    Requirement 3: All Lambda functions must use ARM-based Graviton2 processors
    Requirement 4: Implement Lambda reserved concurrency limits
    Requirement 6: Configure CloudWatch Log Groups with 7-day retention
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: LambdaStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix
        environment = props.environment

        # Cost allocation tags
        tags = {
            "Environment": environment,
            "Team": "payments",
            "CostCenter": "engineering",
            "Project": "payment-processing"
        }

        # Payment processor Lambda - optimized from 3008MB to 1024MB
        self.payment_processor = _lambda.Function(
            self,
            f"{environment}-payment-lambda-processor",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Payment processed successfully'
    }
            """),
            memory_size=1024,  # Optimized from 3008MB (Requirement 1)
            # Graviton2 (Requirement 3)
            architecture=_lambda.Architecture.ARM_64,
            # Prevent throttling (Requirement 4)
            reserved_concurrent_executions=5,
            vpc=props.vpc,
            # 7-day retention (Requirement 6)
            log_retention=logs.RetentionDays.ONE_WEEK,
            timeout=cdk.Duration.seconds(30)
        )

        # Transaction validator Lambda - optimized from 3008MB to 512MB
        self.transaction_validator = _lambda.Function(
            self,
            f"{environment}-payment-lambda-validator",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Transaction validated'
    }
            """),
            memory_size=512,  # Optimized from 3008MB (Requirement 1)
            # Graviton2 (Requirement 3)
            architecture=_lambda.Architecture.ARM_64,
            # Prevent throttling (Requirement 4)
            reserved_concurrent_executions=3,
            vpc=props.vpc,
            # 7-day retention (Requirement 6)
            log_retention=logs.RetentionDays.ONE_WEEK,
            timeout=cdk.Duration.seconds(15)
        )

        # Fraud detection Lambda - optimized from 3008MB to 1024MB
        self.fraud_detector = _lambda.Function(
            self,
            f"{environment}-payment-lambda-fraud",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Fraud check completed'
    }
            """),
            memory_size=1024,  # Optimized from 3008MB (Requirement 1)
            # Graviton2 (Requirement 3)
            architecture=_lambda.Architecture.ARM_64,
            # Prevent throttling (Requirement 4)
            reserved_concurrent_executions=5,
            vpc=props.vpc,
            # 7-day retention (Requirement 6)
            log_retention=logs.RetentionDays.ONE_WEEK,
            timeout=cdk.Duration.seconds(30)
        )

        # Apply cost allocation tags
        for key, value in tags.items():
            cdk.Tags.of(self.payment_processor).add(key, value)
            cdk.Tags.of(self.transaction_validator).add(key, value)
            cdk.Tags.of(self.fraud_detector).add(key, value)

        # Outputs
        cdk.CfnOutput(
            self,
            "PaymentProcessorArn",
            value=self.payment_processor.function_arn,
            export_name=f"{environment}-payment-lambda-processor-arn"
        )

        cdk.CfnOutput(
            self,
            "TransactionValidatorArn",
            value=self.transaction_validator.function_arn,
            export_name=f"{environment}-payment-lambda-validator-arn"
        )

        cdk.CfnOutput(
            self,
            "FraudDetectorArn",
            value=self.fraud_detector.function_arn,
            export_name=f"{environment}-payment-lambda-fraud-arn"
        )

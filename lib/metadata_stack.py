from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    aws_lambda as _lambda,
    aws_kms as kms,
    aws_iam as iam,
    aws_ec2 as ec2,
)
from constructs import Construct


class SecureInfrastructureStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define the KMS Key for encrypting environment variables
        encryption_key = kms.Key(
            self, "LambdaEnvVarsEncryptionKey",
            description="KMS key for encrypting Lambda environment variables",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lookup the default VPC
        vpc = ec2.Vpc.from_lookup(self, "DefaultVPC", is_default=True)

        # Define the Lambda function inside private subnets
        lambda_function = _lambda.Function(
            self, "SecureLambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="lambda_function.handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            environment={
                "SECRET_KEY": "my-secret-value"
            },
            environment_encryption=encryption_key,
            timeout=Duration.seconds(10),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS  # ✅ Correct subnet type for internet access
            )
        )

        # IAM policy for logging
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

        # Apply tags
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Team", "DevOps")

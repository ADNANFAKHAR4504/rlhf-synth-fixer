"""
Security infrastructure - KMS keys, Secrets Manager, IAM roles.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_kms as kms,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    RemovalPolicy
)
from constructs import Construct


class SecurityStackProps:
    """Properties for SecurityStack."""

    def __init__(self, environment_suffix: str, vpc: ec2.Vpc):
        self.environment_suffix = environment_suffix
        self.vpc = vpc


class SecurityStack(NestedStack):
    """Security infrastructure including KMS and Secrets Manager."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: SecurityStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # KMS Keys for different services
        self.rds_kms_key = kms.Key(
            self,
            f"RDSKMSKey-{env_suffix}",
            description=f"KMS key for RDS encryption - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.s3_kms_key = kms.Key(
            self,
            f"S3KMSKey-{env_suffix}",
            description=f"KMS key for S3 encryption - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.lambda_kms_key = kms.Key(
            self,
            f"LambdaKMSKey-{env_suffix}",
            description=f"KMS key for Lambda environment variables - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.secrets_kms_key = kms.Key(
            self,
            f"SecretsKMSKey-{env_suffix}",
            description=f"KMS key for Secrets Manager - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Database credentials secret
        self.db_credentials_secret = secretsmanager.Secret(
            self,
            f"DBCredentials-{env_suffix}",
            secret_name=f"payment-db-credentials-{env_suffix}",
            description="Database credentials for payment processing",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                include_space=False,
                password_length=32
            ),
            encryption_key=self.secrets_kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # API Keys secret
        self.api_keys_secret = secretsmanager.Secret(
            self,
            f"APIKeys-{env_suffix}",
            secret_name=f"payment-api-keys-{env_suffix}",
            description="API keys for payment processing",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"apiKey": ""}',
                generate_string_key="apiSecret",
                exclude_punctuation=True,
                include_space=False,
                password_length=64
            ),
            encryption_key=self.secrets_kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda function for secret rotation
        rotation_lambda_role = iam.Role(
            self,
            f"RotationLambdaRole-{env_suffix}",
            role_name=f"rotation-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant permissions for rotation
        self.db_credentials_secret.grant_read(rotation_lambda_role)
        self.db_credentials_secret.grant_write(rotation_lambda_role)
        self.secrets_kms_key.grant_encrypt_decrypt(rotation_lambda_role)

        # Rotation Lambda function
        rotation_function = lambda_.Function(
            self,
            f"SecretRotationFunction-{env_suffix}",
            function_name=f"secret-rotation-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/secret_rotation"),
            timeout=Duration.minutes(5),
            role=rotation_lambda_role,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            environment={
                "SECRET_ARN": self.db_credentials_secret.secret_arn
            }
        )

        # Enable automatic rotation (30 days)
        self.db_credentials_secret.add_rotation_schedule(
            f"RotationSchedule-{env_suffix}",
            automatically_after=Duration.days(30),
            rotation_lambda=rotation_function
        )

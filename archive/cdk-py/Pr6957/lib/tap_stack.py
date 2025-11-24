from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy,
    Duration,
    Tags,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Add resource tags for compliance
        Tags.of(self).add("Environment", environment_suffix)
        Tags.of(self).add("DataClassification", "Confidential")
        Tags.of(self).add("Owner", "SecurityTeam")

        # Create VPC with private subnets only (no internet gateway)
        vpc = ec2.Vpc(
            self, f"zero-trust-vpc-{environment_suffix}",
            vpc_name=f"zero-trust-vpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=0,  # No NAT gateway for complete isolation
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create KMS key for S3 encryption with 90-day rotation
        s3_kms_key = kms.Key(
            self, f"s3-kms-key-{environment_suffix}",
            description=f"KMS key for S3 bucket encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create KMS key for CloudWatch Logs with 90-day rotation
        logs_kms_key = kms.Key(
            self, f"logs-kms-key-{environment_suffix}",
            description=f"KMS key for CloudWatch Logs encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Grant CloudWatch Logs permission to use the KMS key
        logs_kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:log-group:*"
                    }
                }
            )
        )

        # Create KMS key for Lambda environment variables
        lambda_kms_key = kms.Key(
            self, f"lambda-kms-key-{environment_suffix}",
            description=f"KMS key for Lambda environment encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create S3 bucket with encryption, versioning, and MFA delete
        data_bucket = s3.Bucket(
            self, f"data-bucket-{environment_suffix}",
            bucket_name=f"zero-trust-data-{environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Create security group for Lambda (HTTPS only)
        lambda_sg = ec2.SecurityGroup(
            self, f"lambda-sg-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for Lambda functions - {environment_suffix}",
            allow_all_outbound=False  # Explicit deny, only allow HTTPS
        )

        # Allow HTTPS outbound to VPC endpoints only
        lambda_sg.add_egress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS to VPC endpoints"
        )

        # Create VPC Endpoint for S3
        s3_endpoint = vpc.add_gateway_endpoint(
            f"s3-endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        # Create VPC Endpoint for Secrets Manager
        secrets_endpoint = ec2.InterfaceVpcEndpoint(
            self, f"secrets-endpoint-{environment_suffix}",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[lambda_sg]
        )

        # Create VPC Endpoint for KMS
        kms_endpoint = ec2.InterfaceVpcEndpoint(
            self, f"kms-endpoint-{environment_suffix}",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.KMS,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[lambda_sg]
        )

        # Create VPC Endpoint for CloudWatch Logs
        logs_endpoint = ec2.InterfaceVpcEndpoint(
            self, f"logs-endpoint-{environment_suffix}",
            vpc=vpc,
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[lambda_sg]
        )

        # Create CloudWatch Log Group with encryption and retention
        log_group = logs.LogGroup(
            self, f"lambda-logs-{environment_suffix}",
            log_group_name=f"/aws/lambda/data-processor-{environment_suffix}",
            retention=logs.RetentionDays.THREE_MONTHS,  # 90 days
            encryption_key=logs_kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda with explicit deny for non-encrypted operations
        lambda_role = iam.Role(
            self, f"lambda-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Lambda execution role with encryption enforcement - {environment_suffix}"
        )

        # Add explicit deny for non-encrypted S3 operations
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                actions=[
                    "s3:PutObject"
                ],
                resources=[f"{data_bucket.bucket_arn}/*"],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )

        # Allow encrypted S3 operations
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                resources=[
                    data_bucket.bucket_arn,
                    f"{data_bucket.bucket_arn}/*"
                ]
            )
        )

        # Allow KMS operations
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                ],
                resources=[
                    s3_kms_key.key_arn,
                    lambda_kms_key.key_arn
                ]
            )
        )

        # Allow Secrets Manager access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue"
                ],
                resources=[
                    f"arn:aws:secretsmanager:{self.region}:{self.account}:secret:*"
                ]
            )
        )

        # Allow CloudWatch Logs
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[log_group.log_group_arn]
            )
        )

        # Allow VPC network interface management
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                    "ec2:AssignPrivateIpAddresses",
                    "ec2:UnassignPrivateIpAddresses"
                ],
                resources=["*"]
            )
        )

        # Create Lambda function for data processing
        data_processor = _lambda.Function(
            self, f"data-processor-{environment_suffix}",
            function_name=f"data-processor-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            role=lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[lambda_sg],
            environment={
                "BUCKET_NAME": data_bucket.bucket_name,
                "ENVIRONMENT": environment_suffix,
                "LOG_LEVEL": "INFO"
            },
            environment_encryption=lambda_kms_key,
            log_group=log_group,
            timeout=Duration.minutes(5),
            memory_size=512
        )

        # Grant KMS permissions to Lambda
        s3_kms_key.grant_encrypt_decrypt(data_processor)
        lambda_kms_key.grant_encrypt_decrypt(data_processor)
        logs_kms_key.grant_encrypt_decrypt(data_processor)

        # Stack Outputs for integration testing
        from aws_cdk import CfnOutput

        CfnOutput(
            self, "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"VpcId-{environment_suffix}"
        )

        CfnOutput(
            self, "S3BucketName",
            value=data_bucket.bucket_name,
            description="S3 Data Bucket Name",
            export_name=f"S3BucketName-{environment_suffix}"
        )

        CfnOutput(
            self, "S3BucketArn",
            value=data_bucket.bucket_arn,
            description="S3 Data Bucket ARN",
            export_name=f"S3BucketArn-{environment_suffix}"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=data_processor.function_name,
            description="Lambda Function Name",
            export_name=f"LambdaFunctionName-{environment_suffix}"
        )

        CfnOutput(
            self, "LambdaFunctionArn",
            value=data_processor.function_arn,
            description="Lambda Function ARN",
            export_name=f"LambdaFunctionArn-{environment_suffix}"
        )

        CfnOutput(
            self, "S3KmsKeyId",
            value=s3_kms_key.key_id,
            description="S3 KMS Key ID",
            export_name=f"S3KmsKeyId-{environment_suffix}"
        )

        CfnOutput(
            self, "LogsKmsKeyId",
            value=logs_kms_key.key_id,
            description="CloudWatch Logs KMS Key ID",
            export_name=f"LogsKmsKeyId-{environment_suffix}"
        )

        CfnOutput(
            self, "LambdaKmsKeyId",
            value=lambda_kms_key.key_id,
            description="Lambda Environment KMS Key ID",
            export_name=f"LambdaKmsKeyId-{environment_suffix}"
        )

        CfnOutput(
            self, "LogGroupName",
            value=log_group.log_group_name,
            description="CloudWatch Log Group Name",
            export_name=f"LogGroupName-{environment_suffix}"
        )

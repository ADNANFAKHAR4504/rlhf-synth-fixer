"""Reusable FinTech infrastructure construct for multi-environment deployment."""

import json
from typing import Dict, Any
from constructs import Construct
from cdktf import TerraformOutput, Fn
from cdktf_cdktf_provider_aws.data_aws_vpc import DataAwsVpc
from cdktf_cdktf_provider_aws.data_aws_subnets import DataAwsSubnets
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import (
    SecretsmanagerSecretVersion,
)
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupIngress,
    SecurityGroupEgress,
)
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable,
    DynamodbTableAttribute,
    DynamodbTableGlobalSecondaryIndex,
)
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA,
    S3BucketVersioningVersioningConfiguration,
)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA,
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import (
    S3BucketPublicAccessBlock,
)
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import (
    IamRolePolicyAttachment,
)
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage


class FinTechInfrastructureConstruct(Construct):
    """
    Reusable construct for FinTech payment processing infrastructure.

    This construct creates a complete payment processing infrastructure including:
    - API Gateway for REST endpoints
    - Lambda functions for payment processing
    - RDS PostgreSQL for transactional data
    - DynamoDB for session management
    - S3 for transaction logs
    - IAM roles and security groups
    - CloudWatch logging
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str,
        environment_suffix: str,
        config: Dict[str, Any],
        common_tags: Dict[str, str],
    ):
        """
        Initialize the FinTech infrastructure construct.

        Args:
            scope: Parent construct
            construct_id: Unique identifier for this construct
            environment: Environment name (dev, staging, prod)
            environment_suffix: Unique suffix for resource naming
            config: Environment-specific configuration
            common_tags: Common tags to apply to all resources
        """
        super().__init__(scope, construct_id)

        self.environment = environment
        self.environment_suffix = environment_suffix
        self.config = config
        self.common_tags = common_tags

        # Get existing VPC (using default VPC for this example)
        # Note: default=True finds the default VPC, tags filter is not needed
        self.vpc = DataAwsVpc(
            self, "vpc", default=True
        )

        # Get private subnets
        self.private_subnets = DataAwsSubnets(
            self,
            "private_subnets",
            filter=[
                {"name": "vpc-id", "values": [self.vpc.id]},
                {
                    "name": "availability-zone",
                    "values": [
                        "us-east-1a",
                        "us-east-1b",
                        "us-east-1c",
                        "us-east-1d",
                        "us-east-1f",
                    ],
                },
            ],
        )

        # Create infrastructure components
        self._create_security_groups()
        self._create_iam_roles()
        self._create_cloudwatch_logs()
        self._create_s3_bucket()
        self._create_dynamodb_table()
        self._create_rds_database()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_outputs()

    def _create_security_groups(self):
        """Create security groups for Lambda, RDS, and API Gateway."""
        # Lambda security group
        self.lambda_sg = SecurityGroup(
            self,
            "lambda_sg",
            name=f"lambda-sg-{self.environment_suffix}",
            description=f"Security group for Lambda functions ({self.environment})",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.common_tags, "Name": f"lambda-sg-{self.environment_suffix}"},
        )

        # RDS security group
        self.rds_sg = SecurityGroup(
            self,
            "rds_sg",
            name=f"rds-sg-{self.environment_suffix}",
            description=f"Security group for RDS PostgreSQL ({self.environment})",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="PostgreSQL access from Lambda",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**self.common_tags, "Name": f"rds-sg-{self.environment_suffix}"},
        )

    def _create_iam_roles(self):
        """Create IAM roles for Lambda and services."""
        # Lambda execution role
        self.lambda_role = IamRole(
            self,
            "lambda_role",
            name=f"lambda-payment-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ],
                }
            ),
            tags={
                **self.common_tags,
                "Name": f"lambda-payment-role-{self.environment_suffix}",
            },
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Custom policy for DynamoDB, S3, and Secrets Manager
        IamRolePolicy(
            self,
            "lambda_custom_policy",
            name=f"lambda-custom-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:GetItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                            ],
                            "Resource": f"arn:aws:dynamodb:us-east-1:*:table/sessions-{self.environment_suffix}",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:PutObject",
                                "s3:GetObject",
                                "s3:DeleteObject",
                                "s3:ListBucket",
                            ],
                            "Resource": [
                                f"arn:aws:s3:::transaction-logs-{self.environment_suffix}",
                                f"arn:aws:s3:::transaction-logs-{self.environment_suffix}/*",
                            ],
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue",
                                "secretsmanager:DescribeSecret",
                            ],
                            "Resource": (
                                f"arn:aws:secretsmanager:us-east-1:*:secret:"
                                f"rds-password-{self.environment_suffix}-*"
                            ),
                        },
                    ],
                }
            ),
        )

    def _create_cloudwatch_logs(self):
        """Create CloudWatch log groups with environment-specific retention."""
        self.lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/payment-processor-{self.environment_suffix}",
            retention_in_days=self.config["cloudwatch_log_retention"],
            tags={
                **self.common_tags,
                "Name": f"lambda-logs-{self.environment_suffix}",
            },
        )

        self.api_log_group = CloudwatchLogGroup(
            self,
            "api_log_group",
            name=f"/aws/apigateway/payment-api-{self.environment_suffix}",
            retention_in_days=self.config["cloudwatch_log_retention"],
            tags={
                **self.common_tags,
                "Name": f"api-logs-{self.environment_suffix}",
            },
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for transaction logs with environment-specific versioning."""
        self.transaction_bucket = S3Bucket(
            self,
            "transaction_bucket",
            bucket=f"transaction-logs-{self.environment_suffix}",
            force_destroy=True,
            tags={
                **self.common_tags,
                "Name": f"transaction-logs-{self.environment_suffix}",
            },
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "transaction_bucket_public_access_block",
            bucket=self.transaction_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Server-side encryption
        encryption_default = S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="AES256"
        )
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "transaction_bucket_encryption",
            bucket=self.transaction_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=encryption_default,
                    bucket_key_enabled=True,
                )
            ],
        )

        # Enable versioning only in production
        if self.config["s3_versioning_enabled"]:
            S3BucketVersioningA(
                self,
                "transaction_bucket_versioning",
                bucket=self.transaction_bucket.id,
                versioning_configuration=S3BucketVersioningVersioningConfiguration(
                    status="Enabled"
                ),
            )

    def _create_dynamodb_table(self):
        """Create DynamoDB table with environment-specific billing mode."""
        billing_config = {
            "billing_mode": self.config["dynamodb_billing_mode"],
        }

        # Add capacity settings for provisioned mode
        if self.config["dynamodb_billing_mode"] == "PROVISIONED":
            billing_config["read_capacity"] = self.config["dynamodb_read_capacity"]
            billing_config["write_capacity"] = self.config["dynamodb_write_capacity"]

        # Build global secondary index configuration
        if self.config["dynamodb_billing_mode"] == "PROVISIONED":
            gsi_config = DynamodbTableGlobalSecondaryIndex(
                name="UserIdIndex",
                hash_key="userId",
                projection_type="ALL",
                read_capacity=self.config.get("dynamodb_read_capacity"),
                write_capacity=self.config.get("dynamodb_write_capacity"),
            )
        else:
            gsi_config = DynamodbTableGlobalSecondaryIndex(
                name="UserIdIndex",
                hash_key="userId",
                projection_type="ALL",
            )

        self.sessions_table = DynamodbTable(
            self,
            "sessions_table",
            name=f"sessions-{self.environment_suffix}",
            hash_key="sessionId",
            attribute=[
                DynamodbTableAttribute(name="sessionId", type="S"),
                DynamodbTableAttribute(name="userId", type="S"),
            ],
            global_secondary_index=[gsi_config],
            ttl={"attribute_name": "expiresAt", "enabled": True},
            point_in_time_recovery={"enabled": True},
            server_side_encryption={"enabled": True},
            **billing_config,
            tags={
                **self.common_tags,
                "Name": f"sessions-{self.environment_suffix}",
            },
        )

    def _create_rds_database(self):
        """Create RDS PostgreSQL database with environment-specific retention."""
        import os
        import sys
        
        # Get database credentials from environment variables
        # SECURITY: Require password to be set - no hardcoded fallback for production
        db_username = os.getenv("TF_VAR_db_username", "dbadmin")
        db_password = os.getenv("TF_VAR_db_password")
        
        # SECURITY: Require password to be set via environment variable
        # tap.py sets a test password for local synth/testing
        # CI/CD deployments must set TF_VAR_db_password via deploy.sh
        # No hardcoded passwords in this construct
        if not db_password:
            raise ValueError(
                "TF_VAR_db_password environment variable must be set. "
                "For local synth, tap.py sets a test password. "
                "For CI/CD deployments, deploy.sh must set the real password. "
                "Do not use hardcoded passwords in source code."
            )
        
        # Create Secrets Manager secret for database credentials
        self.db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"rds-password-{self.environment_suffix}",
            description=f"RDS PostgreSQL credentials for {self.environment_suffix}",
            recovery_window_in_days=0,  # Immediate deletion for destroyability
            tags={
                **self.common_tags,
                "Name": f"rds-password-{self.environment_suffix}",
            },
        )

        # Store credentials in the secret
        db_credentials = {
            "username": db_username,
            "password": db_password,
            "engine": "postgres",
            "host": "",  # Will be updated after RDS creation
            "port": 5432,
            "dbname": "payments",
        }
        
        self.db_secret_version = SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(db_credentials),
        )

        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"payment-db-subnet-{self.environment_suffix}",
            subnet_ids=self.private_subnets.ids,
            tags={
                **self.common_tags,
                "Name": f"payment-db-subnet-{self.environment_suffix}",
            },
        )

        # RDS PostgreSQL instance
        self.database = DbInstance(
            self,
            "payment_database",
            identifier=f"payment-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="14.13",
            instance_class=self.config["rds_instance_class"],
            allocated_storage=20,
            storage_encrypted=True,
            username=db_username,
            password=db_password,
            multi_az=self.config["rds_multi_az"],
            vpc_security_group_ids=[self.rds_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            skip_final_snapshot=True,
            backup_retention_period=self.config["rds_backup_retention"],
            backup_window="03:00-04:00",
            maintenance_window="Mon:04:00-Mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            deletion_protection=False,
            tags={
                **self.common_tags,
                "Name": f"payment-db-{self.environment_suffix}",
            },
        )

    def _create_lambda_functions(self):
        """Create Lambda functions with environment-specific memory allocation."""
        # Payment processor Lambda function
        # CDKTF runs Terraform from cdktf.out/stacks/<stack-name>/ directory
        # So we need to reference the zip file in the lib folder using relative path
        lambda_zip_path = "../../../lib/lambda_placeholder.zip"
        self.payment_lambda = LambdaFunction(
            self,
            "payment_processor",
            function_name=f"payment-processor-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.lambda_role.arn,
            memory_size=self.config["lambda_memory"],
            timeout=self.config["lambda_timeout"],
            filename=lambda_zip_path,
            source_code_hash=Fn.filebase64sha256(lambda_zip_path),
            vpc_config={
                "subnet_ids": self.private_subnets.ids,
                "security_group_ids": [self.lambda_sg.id],
            },
            environment={
                "variables": {
                    "ENVIRONMENT": self.environment,
                    "DYNAMODB_TABLE": self.sessions_table.name,
                    "S3_BUCKET": self.transaction_bucket.bucket,
                    "DB_HOST": self.database.address,
                    "DB_NAME": "payments",
                    "DB_SECRET_NAME": f"rds-password-{self.environment_suffix}",
                }
            },
            depends_on=[
                self.lambda_log_group,
                self.database,
                self.sessions_table,
                self.transaction_bucket,
            ],
            tags={
                **self.common_tags,
                "Name": f"payment-processor-{self.environment_suffix}",
            },
        )

    def _create_api_gateway(self):
        """Create API Gateway with environment-specific stage."""
        # REST API
        self.api = ApiGatewayRestApi(
            self,
            "payment_api",
            name=f"payment-api-{self.environment_suffix}",
            description=f"Payment Processing API ({self.environment})",
            endpoint_configuration={"types": ["REGIONAL"]},
            tags={
                **self.common_tags,
                "Name": f"payment-api-{self.environment_suffix}",
            },
        )

        # Resource: /payments
        self.payments_resource = ApiGatewayResource(
            self,
            "payments_resource",
            rest_api_id=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="payments",
        )

        # Method: POST /payments
        self.payments_method = ApiGatewayMethod(
            self,
            "payments_method",
            rest_api_id=self.api.id,
            resource_id=self.payments_resource.id,
            http_method="POST",
            authorization="NONE",
        )

        # Integration with Lambda
        self.payments_integration = ApiGatewayIntegration(
            self,
            "payments_integration",
            rest_api_id=self.api.id,
            resource_id=self.payments_resource.id,
            http_method=self.payments_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.payment_lambda.invoke_arn,
        )

        # Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=self.payment_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api.execution_arn}/*/*",
        )

        # Deployment
        self.api_deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=self.api.id,
            depends_on=[self.payments_integration],
            lifecycle={"create_before_destroy": True},
        )

        # Stage
        self.api_stage = ApiGatewayStage(
            self,
            "api_stage",
            rest_api_id=self.api.id,
            deployment_id=self.api_deployment.id,
            stage_name=self.config["api_stage_name"],
            xray_tracing_enabled=True,
            access_log_settings={
                "destination_arn": self.api_log_group.arn,
                "format": json.dumps(
                    {
                        "requestId": "$context.requestId",
                        "ip": "$context.identity.sourceIp",
                        "requestTime": "$context.requestTime",
                        "httpMethod": "$context.httpMethod",
                        "routeKey": "$context.routeKey",
                        "status": "$context.status",
                        "protocol": "$context.protocol",
                        "responseLength": "$context.responseLength",
                    }
                ),
            },
            tags={
                **self.common_tags,
                "Name": f"payment-api-stage-{self.environment_suffix}",
            },
        )

    def _create_outputs(self):
        """Create Terraform outputs for API URLs and database endpoints."""
        TerraformOutput(
            self,
            "api_gateway_url",
            value=f"https://{self.api.id}.execute-api.us-east-1.amazonaws.com/{self.api_stage.stage_name}",
            description="API Gateway endpoint URL",
        )

        TerraformOutput(
            self,
            "api_gateway_id",
            value=self.api.id,
            description="API Gateway REST API ID",
        )

        TerraformOutput(
            self,
            "database_endpoint",
            value=self.database.endpoint,
            description="RDS PostgreSQL endpoint",
        )

        TerraformOutput(
            self,
            "database_address",
            value=self.database.address,
            description="RDS PostgreSQL address",
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=self.sessions_table.name,
            description="DynamoDB sessions table name",
        )

        TerraformOutput(
            self,
            "s3_bucket_name",
            value=self.transaction_bucket.bucket,
            description="S3 transaction logs bucket name",
        )

        TerraformOutput(
            self,
            "lambda_function_name",
            value=self.payment_lambda.function_name,
            description="Payment processor Lambda function name",
        )

        TerraformOutput(
            self,
            "lambda_function_arn",
            value=self.payment_lambda.arn,
            description="Payment processor Lambda function ARN",
        )

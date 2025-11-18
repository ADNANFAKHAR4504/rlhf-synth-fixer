"""
TAP Stack - Root orchestrator for multi-environment infrastructure.
Coordinates VPC, RDS, ECS, IAM, and Secrets modules with workspace-based configuration.
"""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable

from lib.config.variables import EnvironmentConfig
from lib.config.validation import ConfigValidator
from lib.modules.vpc_module import VpcModule
from lib.modules.iam_module import IamModule
from lib.modules.secrets_module import SecretsModule
from lib.modules.rds_module import RdsModule
from lib.modules.ecs_module import EcsModule


class TapStack(TerraformStack):
    """
    Root CDKTF Python stack for multi-environment infrastructure.
    Implements workspace-based environment separation with reusable modules.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with multi-environment configuration."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        workspace = kwargs.get('workspace', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-2')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-2')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})
        
        # Version suffix for resource naming - increment when recreating infrastructure
        version = kwargs.get('version', 'v2')  # Changed from v1 to v2 to avoid conflicts

        # Validate workspace
        if not EnvironmentConfig.validate_workspace(workspace):
            raise ValueError(f"Invalid workspace: {workspace}")

        # Get environment-specific configuration
        config = EnvironmentConfig.get_all_config(workspace)

        # Validate configuration
        is_valid, error_msg = ConfigValidator.validate_all(config)
        if not is_valid:
            raise ValueError(f"Configuration validation failed: {error_msg}")

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with workspace-specific state files
        # Backend is enabled to prevent resource conflicts
        # Note: Using v1 table for state locking to avoid chicken-and-egg problem
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{workspace}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
            dynamodb_table=f"terraform-state-lock-{workspace}-{environment_suffix}-v1"
        )

        # DynamoDB table for state locking (using existing v1 table)
        # Not creating a new v2 table to avoid conflicts and chicken-and-egg problem
        # The existing v1 table will be used for state locking
        # state_lock_table = DynamodbTable(
        #     self,
        #     f"state-lock-table-{version}-{environment_suffix}",
        #     name=f"terraform-state-lock-{workspace}-{environment_suffix}-{version}",
        #     billing_mode="PAY_PER_REQUEST",
        #     hash_key="LockID",
        #     attribute=[{
        #         "name": "LockID",
        #         "type": "S"
        #     }],
        #     deletion_protection_enabled=False,  # CRITICAL: For destroyability
        #     tags={
        #         "Name": f"terraform-state-lock-{workspace}-{environment_suffix}-{version}",
        #         "Workspace": workspace,
        #         "Purpose": "Terraform state locking",
        #         "Version": version
        #     }
        # )

        # Create S3 bucket for static assets
        assets_bucket = S3Bucket(
            self,
            f"assets-bucket-{version}-{environment_suffix}",
            bucket=f"app-assets-{workspace}-{environment_suffix}-{version}",
            force_destroy=True,  # CRITICAL: For destroyability
            tags={
                "Name": f"app-assets-{workspace}-{environment_suffix}-{version}",
                "Workspace": workspace,
                "Version": version
            }
        )

        # Configure S3 bucket versioning using separate resource
        S3BucketVersioningA(
            self,
            f"assets-bucket-versioning-{version}-{environment_suffix}",
            bucket=assets_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Configure S3 bucket encryption using separate resource
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"assets-bucket-encryption-{version}-{environment_suffix}",
            bucket=assets_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                )
            )]
        )

        # Module 1: VPC Module
        vpc_module = VpcModule(
            self,
            f"vpc-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc_cidr=config['vpc_cidr'],
            availability_zones=config['availability_zones'],
            enable_nat_gateway=True,
            version=version
        )

        # Module 2: IAM Module
        iam_module = IamModule(
            self,
            f"iam-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace,
            version=version
        )

        # Module 3: Secrets Module
        secrets_module = SecretsModule(
            self,
            f"secrets-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace,
            version=version
        )

        # Module 4: ECS Module
        ecs_module = EcsModule(
            self,
            f"ecs-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace,
            vpc_id=vpc_module.get_vpc_id(),
            public_subnet_ids=vpc_module.get_public_subnet_ids(),
            private_subnet_ids=vpc_module.get_private_subnet_ids(),
            execution_role_arn=iam_module.get_execution_role_arn(),
            task_role_arn=iam_module.get_task_role_arn(),
            container_count=config['ecs_container_count'],
            enable_alb_deletion_protection=config['alb_deletion_protection'],
            version=version
        )

        # Module 5: RDS Module
        rds_module = RdsModule(
            self,
            f"rds-module-{environment_suffix}",
            environment_suffix=environment_suffix,
            workspace=workspace,
            vpc_id=vpc_module.get_vpc_id(),
            subnet_ids=vpc_module.get_private_subnet_ids(),
            allowed_security_group_id=ecs_module.get_ecs_security_group_id(),
            database_name=f"appdb_{workspace}",
            master_username="dbadmin",
            instance_class=config['rds_instance_class'],
            multi_az=config['rds_multi_az'],
            version=version
        )

        # Outputs - Expose critical resource IDs and endpoints
        TerraformOutput(
            self,
            "workspace",
            value=workspace,
            description="Current workspace (environment)"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc_module.get_vpc_id(),
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=vpc_module.get_public_subnet_ids(),
            description="Public subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=vpc_module.get_private_subnet_ids(),
            description="Private subnet IDs"
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=ecs_module.get_cluster_name(),
            description="ECS cluster name"
        )

        TerraformOutput(
            self,
            "ecs_cluster_arn",
            value=ecs_module.get_cluster_arn(),
            description="ECS cluster ARN"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=ecs_module.get_alb_dns_name(),
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=rds_module.get_cluster_endpoint(),
            description="RDS Aurora cluster endpoint (writer)"
        )

        TerraformOutput(
            self,
            "rds_cluster_reader_endpoint",
            value=rds_module.get_cluster_reader_endpoint(),
            description="RDS Aurora cluster reader endpoint"
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=secrets_module.get_db_secret_arn(),
            description="Database credentials secret ARN"
        )

        TerraformOutput(
            self,
            "app_secret_arn",
            value=secrets_module.get_app_secret_arn(),
            description="Application configuration secret ARN"
        )

        TerraformOutput(
            self,
            "ecs_task_role_arn",
            value=iam_module.get_task_role_arn(),
            description="ECS task role ARN"
        )

        TerraformOutput(
            self,
            "ecs_execution_role_arn",
            value=iam_module.get_execution_role_arn(),
            description="ECS execution role ARN"
        )

        TerraformOutput(
            self,
            "assets_bucket_name",
            value=assets_bucket.bucket,
            description="S3 bucket name for static assets"
        )

        TerraformOutput(
            self,
            "state_lock_table_name",
            value=f"terraform-state-lock-{workspace}-{environment_suffix}-v1",
            description="DynamoDB table name for state locking (using existing v1 table)"
        )

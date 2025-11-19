"""Main CDKTF stack for multi-environment infrastructure."""
import os
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.modules.naming import NamingModule
from lib.modules.vpc_module import VpcModule
from lib.modules.rds_module import RdsModule
from lib.modules.ecs_module import EcsModule
from lib.modules.state_backend import StateBackendModule
from lib.modules.ssm_outputs import SsmOutputsModule
from lib.config.environment_config import EnvironmentConfig


class TapStack(TerraformStack):
    """Main infrastructure stack with all modules."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment: str = None,
        environment_suffix: str = None,
        **kwargs
    ):
        super().__init__(scope, id)

        # Get environment from kwargs or environment parameter
        if environment is None:
            environment = kwargs.get('environment', 'dev')
        if environment_suffix is None:
            environment_suffix = kwargs.get('environment_suffix', 'demo')

        # Get environment-specific configuration
        config = EnvironmentConfig.get_config(environment)

        # Initialize naming module with stack ID for uniqueness
        naming = NamingModule(
            environment=config["environment"],
            region=config["region"],
            environment_suffix=environment_suffix,
            stack_id=id  # Use stack ID to ensure uniqueness
        )

        # AWS Provider with cross-account role support
        provider_kwargs = {
            "region": config["region"],
            "default_tags": [{
                "tags": {
                    "Environment": config["environment"],
                    "ManagedBy": "CDKTF",
                    "Project": "MultiEnvironmentInfra"
                }
            }]
        }

        # Only add assume_role if account_id is present and valid (not empty/whitespace)
        account_id = config.get("account_id")
        if account_id and isinstance(account_id, str) and account_id.strip() and account_id.strip() != "123456789012":
            provider_kwargs["assume_role"] = [{
                "role_arn": f"arn:aws:iam::{account_id.strip()}:role/TerraformDeploymentRole"
            }]

        AwsProvider(
            self,
            "aws",
            **provider_kwargs
        )

        # State Backend Module
        state_backend = StateBackendModule(
            self,
            "state_backend",
            naming=naming
        )

        # VPC Module
        vpc = VpcModule(
            self,
            "vpc",
            naming=naming,
            cidr_block=config["vpc_cidr"],
            enable_nat_gateway=config.get("enable_nat_gateway", True)
        )

        # RDS Module
        rds = RdsModule(
            self,
            "rds",
            naming=naming,
            vpc_id=vpc.vpc.id,
            private_subnet_ids=[subnet.id for subnet in vpc.private_subnets],
            database_name=config["database_name"],
            master_username=config["master_username"],
            master_password=os.environ.get("DB_PASSWORD", "ChangeMe123!"),
            instance_class=config["rds_instance_class"],
            multi_az=config["rds_multi_az"],
            backup_retention_period=config["rds_backup_retention"],
            skip_final_snapshot=config["rds_skip_final_snapshot"]
        )

        # ECS Module
        ecs = EcsModule(
            self,
            "ecs",
            naming=naming,
            vpc_id=vpc.vpc.id,
            public_subnet_ids=[subnet.id for subnet in vpc.public_subnets],
            private_subnet_ids=[subnet.id for subnet in vpc.private_subnets],
            task_cpu=config["ecs_task_cpu"],
            task_memory=config["ecs_task_memory"],
            desired_count=config["ecs_desired_count"]
        )

        # SSM Outputs Module
        ssm_outputs = SsmOutputsModule(
            self,
            "ssm_outputs",
            naming=naming,
            outputs={
                "vpc_id": vpc.vpc.id,
                "public_subnet_ids": ",".join([subnet.id for subnet in vpc.public_subnets]),
                "private_subnet_ids": ",".join([subnet.id for subnet in vpc.private_subnets]),
                "rds_endpoint": rds.db_instance.endpoint,
                "rds_database": rds.db_instance.db_name,
                "ecs_cluster_name": ecs.cluster.name,
                "alb_dns_name": ecs.alb.dns_name
            }
        )

        # Main Stack Outputs
        TerraformOutput(
            self,
            "environment",
            value=config["environment"],
            description="Environment name"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=rds.db_instance.endpoint,
            description="RDS endpoint"
        )

        TerraformOutput(
            self,
            "ecs_cluster",
            value=ecs.cluster.name,
            description="ECS cluster name"
        )

        TerraformOutput(
            self,
            "alb_url",
            value=f"http://{ecs.alb.dns_name}",
            description="Application Load Balancer URL"
        )

"""TAP Stack module for CDKTF Python payment processing migration infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.stacks.vpc_stack import VpcConstruct
from lib.stacks.security_stack import SecurityConstruct
from lib.stacks.database_stack import DatabaseConstruct
from lib.stacks.compute_stack import ComputeConstruct
from lib.stacks.load_balancer_stack import LoadBalancerConstruct
from lib.stacks.migration_stack import MigrationConstruct
from lib.stacks.routing_stack import RoutingConstruct
from lib.stacks.monitoring_stack import MonitoringConstruct
from lib.stacks.validation_stack import ValidationConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack orchestrator for payment processing migration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the stack
            **kwargs: Additional keyword arguments including:
                - environment_suffix: Environment suffix for resource naming
                - aws_region: AWS region for deployment (default: us-east-2)
                - state_bucket_region: S3 backend region
                - state_bucket: S3 bucket name for state
                - default_tags: Default tags for all resources
        """
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-2')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create VPC Construct (Component 1)
        self.vpc_construct = VpcConstruct(
            self,
            f"vpc-{environment_suffix}",
            environment_suffix=environment_suffix,
            aws_region=aws_region
        )

        # Create Security Construct (Component 8 & 9)
        self.security_construct = SecurityConstruct(
            self,
            f"security-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc_id=self.vpc_construct.get_vpc_id()
        )

        # Create Database Construct (Component 2)
        self.database_construct = DatabaseConstruct(
            self,
            f"database-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc_id=self.vpc_construct.get_vpc_id(),
            private_subnet_ids=self.vpc_construct.get_private_subnet_ids(),
            db_security_group_id=self.security_construct.get_rds_sg_id(),
            db_secret_arn=self.security_construct.get_db_secret_arn()
        )

        # Create Compute Construct (Component 3)
        self.compute_construct = ComputeConstruct(
            self,
            f"compute-{environment_suffix}",
            environment_suffix=environment_suffix,
            lambda_security_group_id=self.security_construct.get_lambda_sg_id(),
            private_subnet_ids=self.vpc_construct.get_private_subnet_ids(),
            db_secret_arn=self.security_construct.get_db_secret_arn(),
            db_endpoint=self.database_construct.get_cluster_endpoint()
        )

        # Create Load Balancer Construct (Component 4)
        self.load_balancer_construct = LoadBalancerConstruct(
            self,
            f"load-balancer-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc_id=self.vpc_construct.get_vpc_id(),
            public_subnet_ids=self.vpc_construct.get_public_subnet_ids(),
            alb_security_group_id=self.security_construct.get_alb_sg_id(),
            lambda_arn=self.compute_construct.get_lambda_arn()
        )

        # Create Migration Construct (Component 5)
        self.migration_construct = MigrationConstruct(
            self,
            f"migration-{environment_suffix}",
            environment_suffix=environment_suffix,
            private_subnet_ids=self.vpc_construct.get_private_subnet_ids(),
            dms_security_group_id=self.security_construct.get_dms_sg_id(),
            target_db_endpoint=self.database_construct.get_cluster_endpoint(),
            db_secret_arn=self.security_construct.get_db_secret_arn()
        )

        # Create Routing Construct (Component 6)
        self.routing_construct = RoutingConstruct(
            self,
            f"routing-{environment_suffix}",
            environment_suffix=environment_suffix,
            alb_dns_name=self.load_balancer_construct.get_alb_dns_name(),
            alb_zone_id=self.load_balancer_construct.get_alb_zone_id(),
            domain_name=f"payment-api-{environment_suffix}.example.com"
        )

        # Create Monitoring Construct (Component 7)
        self.monitoring_construct = MonitoringConstruct(
            self,
            f"monitoring-{environment_suffix}",
            environment_suffix=environment_suffix,
            alb_arn_suffix=self.load_balancer_construct.get_alb_arn().split(":")[-1],
            lambda_function_name=self.compute_construct.get_lambda_function_name(),
            db_cluster_id=self.database_construct.get_cluster_id(),
            dms_task_arn=self.migration_construct.get_replication_task_arn()
        )

        # Create Validation Construct (Component 9 & 10)
        self.validation_construct = ValidationConstruct(
            self,
            f"validation-{environment_suffix}",
            environment_suffix=environment_suffix,
            lambda_security_group_id=self.security_construct.get_lambda_sg_id(),
            private_subnet_ids=self.vpc_construct.get_private_subnet_ids(),
            db_endpoint=self.database_construct.get_cluster_endpoint(),
            db_secret_arn=self.security_construct.get_db_secret_arn()
        )

        # Add TerraformOutput resources for integration tests
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc_construct.get_vpc_id(),
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=self.load_balancer_construct.get_alb_dns_name(),
            description="ALB DNS name"
        )

        TerraformOutput(
            self,
            "db_cluster_endpoint",
            value=self.database_construct.get_cluster_endpoint(),
            description="Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "lambda_function_name",
            value=self.compute_construct.get_lambda_function_name(),
            description="Payment API Lambda function name"
        )

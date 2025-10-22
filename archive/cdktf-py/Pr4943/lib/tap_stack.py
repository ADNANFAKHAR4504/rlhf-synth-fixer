"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.security_stack import SecurityStack
from lib.database_stack import DatabaseStack
from lib.cache_stack import CacheStack
from lib.compute_stack import ComputeStack


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
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

        # Configure S3 Backend with encryption
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create networking infrastructure
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix
        )

        # Create security infrastructure (KMS keys and Secrets Manager)
        security = SecurityStack(
            self,
            "security",
            environment_suffix=environment_suffix
        )

        # Create database infrastructure
        database = DatabaseStack(
            self,
            "database",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            kms_key_arn=security.kms_key_arn,
            db_secret_id=security.db_secret_id
        )

        # Create cache infrastructure
        cache = CacheStack(
            self,
            "cache",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            kms_key_arn=security.kms_key_arn
        )

        # Create compute infrastructure (ECS Fargate)
        compute = ComputeStack(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            public_subnet_ids=networking.public_subnet_ids,
            kms_key_arn=security.kms_key_arn,
            db_endpoint=database.db_endpoint,
            redis_endpoint=cache.redis_endpoint,
            db_secret_arn=security.db_secret_arn
        )

        # Export stack outputs
        from cdktf import TerraformOutput

        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc_id
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=compute.alb_dns_name
        )

        TerraformOutput(
            self,
            "db_endpoint",
            value=database.db_endpoint
        )

        TerraformOutput(
            self,
            "redis_endpoint",
            value=cache.redis_endpoint
        )

        TerraformOutput(
            self,
            "kms_key_arn",
            value=security.kms_key_arn
        )

        TerraformOutput(
            self,
            "db_secret_arn",
            value=security.db_secret_arn
        )

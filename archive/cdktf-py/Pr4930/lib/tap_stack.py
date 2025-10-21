"""Main TAP Stack orchestrating all infrastructure components."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.vpc_stack import VpcStack
from lib.security_stack import SecurityStack
from lib.secrets_stack import SecretsStack
from lib.cache_stack import CacheStack
from lib.ecs_stack import EcsStack
from lib.alb_stack import AlbStack


class TapStack(TerraformStack):
    """Main CDKTF Python stack for e-commerce product catalog infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with all infrastructure components."""
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

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create VPC with public and private subnets
        vpc_stack = VpcStack(
            self,
            "vpc",
            environment_suffix=environment_suffix,
            aws_region=aws_region
        )

        # Create security groups
        security_stack = SecurityStack(
            self,
            "security",
            vpc_id=vpc_stack.vpc_id,
            environment_suffix=environment_suffix
        )

        # Create secrets in AWS Secrets Manager
        secrets_stack = SecretsStack(
            self,
            "secrets",
            environment_suffix=environment_suffix
        )

        # Create ElastiCache cluster
        cache_stack = CacheStack(
            self,
            "cache",
            vpc_id=vpc_stack.vpc_id,
            private_subnet_ids=vpc_stack.private_subnet_ids,
            cache_security_group_id=security_stack.cache_security_group_id,
            environment_suffix=environment_suffix
        )

        # Create Application Load Balancer
        alb_stack = AlbStack(
            self,
            "alb",
            vpc_id=vpc_stack.vpc_id,
            public_subnet_ids=vpc_stack.public_subnet_ids,
            alb_security_group_id=security_stack.alb_security_group_id,
            environment_suffix=environment_suffix
        )

        # Create ECS Cluster and Service
        ecs_stack = EcsStack(
            self,
            "ecs",
            vpc_id=vpc_stack.vpc_id,
            private_subnet_ids=vpc_stack.private_subnet_ids,
            ecs_security_group_id=security_stack.ecs_security_group_id,
            target_group_arn=alb_stack.target_group_arn,
            db_secret_arn=secrets_stack.db_secret_arn,
            api_secret_arn=secrets_stack.api_secret_arn,
            cache_endpoint=cache_stack.cache_endpoint,
            environment_suffix=environment_suffix,
            aws_region=aws_region
        )

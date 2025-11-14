"""TapStack wrapper for Multi-Environment Infrastructure."""
from constructs import Construct
from cdktf import TerraformStack, S3Backend
from lib.multi_env_stack import MultiEnvStack
import os


class TapStack(TerraformStack):
    """Main TapStack that wraps MultiEnvStack with standard TAP configuration."""

    def __init__(self, scope: Construct, stack_id: str,
                 environment_suffix: str = None,
                 state_bucket: str = None,
                 state_bucket_region: str = None,
                 aws_region: str = None,
                 default_tags: dict = None):  # pylint: disable=too-many-positional-arguments
        """Initialize TapStack.

        Args:
            scope: CDK app scope
            stack_id: Stack identifier
            environment_suffix: Environment suffix for resource naming
            state_bucket: S3 bucket for Terraform state
            state_bucket_region: Region of state bucket
            aws_region: AWS region for deployment
            default_tags: Default tags to apply
        """
        super().__init__(scope, stack_id)

        # Use provided values or fall back to environment variables or defaults
        self.environment_suffix = environment_suffix or os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
        self.state_bucket = state_bucket or os.environ.get('TERRAFORM_STATE_BUCKET',
                                                            'iac-rlhf-tf-states')
        self.state_bucket_region = (state_bucket_region or
                                     os.environ.get('TERRAFORM_STATE_BUCKET_REGION', 'us-east-1'))
        self.aws_region = aws_region or os.environ.get('AWS_REGION', 'us-east-1')

        # Configure S3 backend for state management
        S3Backend(self,
            bucket=self.state_bucket,
            key=f"{self.environment_suffix}/terraform.tfstate",
            region=self.state_bucket_region,
            encrypt=True,
            dynamodb_table="terraform-state-lock"
        )

        # Get environment from environment variable or derive from suffix
        environment = os.environ.get('ENVIRONMENT', 'dev')

        # Environment configurations
        configs = {
            'dev': {
                'region': self.aws_region,
                'ami_id': 'ami-0cae6d6fe6048ca2c',  # Amazon Linux 2023 us-east-1
                'instance_type': 't3.micro',
                'database': {
                    'instance_class': 'db.t3.micro',
                    'multi_az': False
                },
                'autoscaling': {
                    'min_size': 1,
                    'max_size': 2,
                    'desired': 1
                },
                'storage': {
                    'versioning': False
                },
                'allowed_cidrs': ['10.0.0.0/16'],
                'alb_allowed_cidrs': ['0.0.0.0/0']
            },
            'staging': {
                'region': self.aws_region,
                'ami_id': 'ami-0cae6d6fe6048ca2c',  # Amazon Linux 2023 us-east-1
                'instance_type': 't3.small',
                'database': {
                    'instance_class': 'db.t3.small',
                    'multi_az': False
                },
                'autoscaling': {
                    'min_size': 2,
                    'max_size': 4,
                    'desired': 2
                },
                'storage': {
                    'versioning': False
                },
                'allowed_cidrs': ['10.0.0.0/16'],
                'alb_allowed_cidrs': ['0.0.0.0/0']
            },
            'prod': {
                'region': self.aws_region,
                'ami_id': 'ami-0cae6d6fe6048ca2c',  # Amazon Linux 2023 us-east-1
                'instance_type': 't3.small',
                'database': {
                    'instance_class': 'db.t3.small',
                    'multi_az': True
                },
                'autoscaling': {
                    'min_size': 3,
                    'max_size': 10,
                    'desired': 5
                },
                'storage': {
                    'versioning': True
                },
                'allowed_cidrs': ['10.0.0.0/16'],
                'alb_allowed_cidrs': ['0.0.0.0/0']
            }
        }

        config = configs.get(environment, configs['dev'])

        # Create the actual multi-env stack
        multi_env_stack = MultiEnvStack(
            self,
            f"multi-env-{environment}",
            environment,
            self.environment_suffix,
            config
        )

        # Expose key resources for testing
        self.bucket = multi_env_stack
        self.bucket_versioning = multi_env_stack
        self.bucket_encryption = multi_env_stack

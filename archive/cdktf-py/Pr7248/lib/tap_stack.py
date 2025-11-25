"""Main stack orchestrating Blue-Green deployment infrastructure"""
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from .network_stack import NetworkStack
from .compute_stack import ComputeStack
from .database_stack import DatabaseStack
from .monitoring_stack import MonitoringStack


class TapStack(TerraformStack):
    """Main Terraform stack for Blue-Green deployment"""

    # pylint: disable=redefined-builtin,too-many-arguments
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 state_bucket: str, state_bucket_region: str,
                 primary_region: str, secondary_region: str):
        super().__init__(scope, id)

        # Store configuration
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region

        # Configure S3 backend for state management
        S3Backend(self,
            bucket=state_bucket,
            key=f"tap-stack-v1/{environment_suffix}/terraform.tfstate",
            region=state_bucket_region,
            encrypt=True
        )

        # AWS Provider
        AwsProvider(self, 'aws',
            region=primary_region,
            default_tags=[{
                'tags': {
                    'Environment': environment_suffix,
                    'ManagedBy': 'CDKTF',
                    'Project': 'BlueGreenDeploymentV1',
                    'Version': 'v1'
                }
            }]
        )

        # Create network infrastructure
        network = NetworkStack(self, f'Network{self.environment_suffix}',
                             environment_suffix=self.environment_suffix)

        # Create database
        database = DatabaseStack(self, f'Database{self.environment_suffix}',
                                vpc_id=network.vpc_id,
                                private_subnet_ids=network.private_subnet_ids,
                                environment_suffix=self.environment_suffix)

        # Create compute resources (Blue-Green)
        compute = ComputeStack(self, f'Compute{self.environment_suffix}',
                             vpc_id=network.vpc_id,
                             public_subnet_ids=network.public_subnet_ids,
                             private_subnet_ids=network.private_subnet_ids,
                             database_endpoint=database.cluster_endpoint,
                             database_secret_arn=database.secret_arn,
                             environment_suffix=self.environment_suffix)

        # Create monitoring
        monitoring = MonitoringStack(self, f'Monitoring{self.environment_suffix}',
                                    alb_arn=compute.alb_arn,
                                    blue_asg_name=compute.blue_asg_name,
                                    green_asg_name=compute.green_asg_name,
                                    environment_suffix=self.environment_suffix)

        # Outputs
        TerraformOutput(self, 'alb_dns_name',
                       value=compute.alb_dns_name,
                       description='Application Load Balancer DNS name')

        TerraformOutput(self, 'blue_target_group_arn',
                       value=compute.blue_target_group_arn,
                       description='Blue environment target group ARN')

        TerraformOutput(self, 'green_target_group_arn',
                       value=compute.green_target_group_arn,
                       description='Green environment target group ARN')

        TerraformOutput(self, 'database_endpoint',
                       value=database.cluster_endpoint,
                       description='RDS Aurora cluster endpoint')

        TerraformOutput(self, 'database_secret_arn',
                       value=database.secret_arn,
                       description='Database credentials secret ARN')

        TerraformOutput(self, 'vpc_id',
                       value=network.vpc_id,
                       description='VPC ID')

        TerraformOutput(self, 'artifacts_bucket',
                       value=compute.artifacts_bucket_name,
                       description='S3 bucket for deployment artifacts')

        TerraformOutput(self, 'sns_topic_arn',
                       value=monitoring.sns_topic_arn,
                       description='SNS topic for notifications')

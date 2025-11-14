"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.security_stack import SecurityStack
from lib.frontend_stack import FrontendStack
from lib.compute_stack import ComputeStack
from lib.database_stack import DatabaseStack
from lib.monitoring_stack import MonitoringStack


class TapStack(TerraformStack):
    """CDKTF Python stack for payment processing application infrastructure."""

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
        default_tags = kwargs.get('default_tags', [{"tags": {}}])

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=default_tags,
        )

        # Configure S3 Backend with encryption
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # 1. Networking Stack - VPC, Subnets, NAT, Flow Logs
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # 2. Security Stack - Security Groups, IAM Roles, WAF
        security = SecurityStack(
            self,
            "security",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
        )

        # 3. Frontend Stack - S3, CloudFront for React frontend
        frontend = FrontendStack(
            self,
            "frontend",
            environment_suffix=environment_suffix,
        )

        # 4. Compute Stack - ALB, ASG, EC2 for Node.js API
        compute = ComputeStack(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            public_subnet_ids=networking.public_subnet_ids,
            private_subnet_ids=networking.private_subnet_ids,
            alb_security_group_id=security.alb_security_group_id,
            api_security_group_id=security.api_security_group_id,
            instance_profile_arn=security.instance_profile_arn,
            waf_web_acl_id=security.waf_web_acl_id,
            aws_region=aws_region,
        )

        # 5. Database Stack - RDS PostgreSQL Multi-AZ
        database = DatabaseStack(
            self,
            "database",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            database_security_group_id=security.database_security_group_id,
        )

        # 6. Monitoring Stack - CloudWatch Alarms and Logs
        monitoring = MonitoringStack(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            alb_arn_suffix=compute.alb_arn_suffix,
            alb_target_group_arn_suffix=compute.alb_target_group_arn_suffix,
            asg_name=compute.asg_name,
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc_id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "cloudfront_distribution_id",
            value=frontend.cloudfront_distribution_id,
            description="CloudFront Distribution ID",
        )

        TerraformOutput(
            self,
            "cloudfront_domain_name",
            value=frontend.cloudfront_domain_name,
            description="CloudFront Domain Name",
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=compute.alb_dns_name,
            description="Application Load Balancer DNS Name",
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=database.rds_endpoint,
            description="RDS Database Endpoint",
        )

        TerraformOutput(
            self,
            "db_connection_parameter",
            value=database.db_connection_parameter_name,
            description="SSM Parameter Store name for DB connection string",
        )

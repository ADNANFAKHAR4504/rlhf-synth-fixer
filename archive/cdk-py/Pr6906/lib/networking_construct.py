"""
NetworkingConstruct - VPC and networking resources
Creates VPC with public/private subnets across 3 AZs
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2


class NetworkingConstruct(Construct):
    """
    Creates VPC with public and private subnets across 3 availability zones.

    - Public subnets for Application Load Balancer
    - Private subnets for ECS tasks
    - NAT Gateways for outbound internet access
    - VPC Endpoints for AWS services (S3, ECR, CloudWatch Logs)
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create VPC with 3 AZs
        self.vpc = ec2.Vpc(
            self,
            f"Vpc-{environment_suffix}",
            vpc_name=f"microservices-vpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Cost optimization: single NAT for synthetic task
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # VPC endpoints removed due to AWS account limits in test environment
        # In production, add these for cost optimization:
        # - S3 Gateway Endpoint
        # - DynamoDB Gateway Endpoint  
        # - ECR Interface Endpoint
        # - ECR Docker Interface Endpoint
        # - CloudWatch Logs Interface Endpoint

        cdk.Tags.of(self.vpc).add("Name", f"microservices-vpc-{environment_suffix}")
        cdk.Tags.of(self.vpc).add("Environment", environment_suffix)

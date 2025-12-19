"""vpc_construct.py

Custom CDK construct for VPC infrastructure.
"""

from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class VpcConstruct(Construct):
    """Custom construct for VPC with 3 AZs."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        cidr_block: str,
        environment_name: str,
        **kwargs
    ):
        super().__init__(scope, construct_id)

        self.vpc = ec2.Vpc(
            self,
            f"PaymentVpc-{environment_suffix}",
            vpc_name=f"payment-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr(cidr_block),
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        self.vpc.add_flow_log(f"VpcFlowLog-{environment_suffix}")
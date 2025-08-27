"""networking_stack.py
Networking infrastructure including VPC, subnets, and security groups.
"""

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class NetworkingStack(cdk.NestedStack):
    """Creates VPC with public/private subnets and security groups."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # VPC with multiple AZs
        self.vpc = ec2.Vpc(
            self, f"prod-vpc-{environment_suffix}",
            vpc_name=f"prod-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"prod-public-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"prod-private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"prod-database-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Security Groups
        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            self, f"prod-alb-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            security_group_name=f"prod-alb-sg-{environment_suffix}"
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )

        # Web Server Security Group
        self.web_sg = ec2.SecurityGroup(
            self, f"prod-web-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for web servers",
            security_group_name=f"prod-web-sg-{environment_suffix}"
        )

        self.web_sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(80),
            "Allow traffic from ALB"
        )

        self.web_sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from ALB"
        )

        # Database Security Group
        self.database_sg = ec2.SecurityGroup(
            self, f"prod-database-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS database",
            security_group_name=f"prod-database-sg-{environment_suffix}"
        )

        self.database_sg.add_ingress_rule(
            self.web_sg,
            ec2.Port.tcp(3306),
            "Allow database access from web servers"
        )

        # VPC Endpoint for S3 (cost optimization)
        self.vpc.add_gateway_endpoint(
            f"prod-s3-endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )

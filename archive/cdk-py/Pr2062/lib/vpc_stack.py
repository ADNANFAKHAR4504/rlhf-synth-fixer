from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with public and private subnets across 2 AZs
        self.vpc = ec2.Vpc(
            self, f"webapp-vpc-{environment_suffix}",
            max_azs=2,
            nat_gateways=2,
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
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Security Group for ALB
        self.alb_security_group = ec2.SecurityGroup(
            self, f"webapp-alb-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=False
        )

        # Allow HTTP and HTTPS traffic to ALB
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )

        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )

        # Security Group for Fargate tasks
        self.fargate_security_group = ec2.SecurityGroup(
            self, f"webapp-fargate-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Fargate tasks",
            allow_all_outbound=True
        )

        # Allow traffic from ALB to Fargate
        self.fargate_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow traffic from ALB"
        )

        # Output VPC ID for reference
        CfnOutput(
            self, f"webapp-vpc-id-{environment_suffix}",
            value=self.vpc.vpc_id,
            export_name=f"webapp-vpc-id-{environment_suffix}"
        )

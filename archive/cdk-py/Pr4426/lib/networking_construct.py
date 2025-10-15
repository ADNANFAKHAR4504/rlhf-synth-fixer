"""networking_construct.py
VPC, subnets, security groups, and networking resources.
"""

from typing import Optional
from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_kms as kms
)


class NetworkingConstruct(Construct):
    """
    Creates VPC infrastructure with public/private subnets, security groups,
    and networking components for healthcare SaaS platform.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kms_key: kms.Key,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC Flow Logs group
        flow_log_group = logs.LogGroup(
            self,
            f"VPCFlowLogGroup-{environment_suffix}",
            log_group_name=f"/aws/vpc/flowlogs-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            encryption_key=kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Create VPC with 2 AZs
        self.vpc = ec2.Vpc(
            self,
            f"HealthcareVPC-{environment_suffix}",
            vpc_name=f"healthcare-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=1,  # Cost optimization: 1 NAT Gateway
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Isolated-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Enable VPC Flow Logs
        ec2.FlowLog(
            self,
            f"VPCFlowLog-{environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(flow_log_group),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # Create VPC endpoints for cost optimization and security
        self.vpc.add_gateway_endpoint(
            f"S3Endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        self.vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
        )

        # ALB Security Group
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-{environment_suffix}",
            vpc=self.vpc,
            security_group_name=f"alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from internet"
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet"
        )

        # ECS Security Group
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-{environment_suffix}",
            vpc=self.vpc,
            security_group_name=f"ecs-sg-{environment_suffix}",
            description="Security group for ECS Fargate tasks",
            allow_all_outbound=True
        )

        self.ecs_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(8080),
            "Allow traffic from ALB"
        )

        # Database Security Group
        self.db_security_group = ec2.SecurityGroup(
            self,
            f"DBSecurityGroup-{environment_suffix}",
            vpc=self.vpc,
            security_group_name=f"db-sg-{environment_suffix}",
            description="Security group for Aurora database",
            allow_all_outbound=False
        )

        self.db_security_group.add_ingress_rule(
            self.ecs_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL traffic from ECS"
        )

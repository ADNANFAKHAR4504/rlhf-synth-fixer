from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_logs as logs,
    aws_iam as iam,
    CfnOutput,
    Tags,
)
from constructs import Construct
from typing import Optional


class VpcStack(Stack):
    """
    Multi-tier VPC stack for payment processing platform.

    Creates a VPC with three subnet tiers:
    - Public subnets for load balancers and bastion hosts
    - Private application subnets for application workloads
    - Private database subnets for database instances

    Includes NAT Gateways for high availability and VPC Flow Logs for monitoring.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Create VPC with custom configuration
        # ISSUE 1: Using max_azs parameter without explicit AZ specification
        # This may result in fewer than 3 AZs in some regions
        self.vpc = ec2.Vpc(
            self,
            f"PaymentVpc-{environment_suffix}",
            vpc_name=f"payment-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"PrivateApp-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"PrivateDb-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Add tags to VPC
        Tags.of(self.vpc).add("Environment", "production")
        Tags.of(self.vpc).add("Project", "payment-platform")

        # Create CloudWatch log group for VPC Flow Logs
        log_group = logs.LogGroup(
            self,
            f"VpcFlowLogGroup-{environment_suffix}",
            log_group_name=f"/aws/vpc/flowlogs-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
        )

        # Create IAM role for VPC Flow Logs
        flow_log_role = iam.Role(
            self,
            f"VpcFlowLogRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            description=f"Role for VPC Flow Logs - {environment_suffix}",
        )

        # Grant permissions to write to CloudWatch Logs
        log_group.grant_write(flow_log_role)

        # ISSUE 2: Setting max_aggregation_interval to 300 (5 minutes)
        # AWS only supports 60 or 600 seconds
        flow_log = ec2.FlowLog(
            self,
            f"VpcFlowLog-{environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group, flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        # Set custom aggregation interval (60 or 600 are valid AWS values)
        cfn_flow_log = flow_log.node.default_child
        cfn_flow_log.max_aggregation_interval = 60  # 1 minute (valid AWS value)

        # Output VPC ID
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"payment-vpc-id-{environment_suffix}",
        )

        # Output public subnet IDs
        for idx, subnet in enumerate(self.vpc.public_subnets):
            CfnOutput(
                self,
                f"PublicSubnet{idx + 1}Id",
                value=subnet.subnet_id,
                description=f"Public Subnet {idx + 1} ID",
                export_name=f"payment-public-subnet-{idx + 1}-{environment_suffix}",
            )

        # Output private application subnet IDs
        for idx, subnet in enumerate(self.vpc.private_subnets):
            CfnOutput(
                self,
                f"PrivateAppSubnet{idx + 1}Id",
                value=subnet.subnet_id,
                description=f"Private Application Subnet {idx + 1} ID",
                export_name=f"payment-app-subnet-{idx + 1}-{environment_suffix}",
            )

        # Output private database subnet IDs
        for idx, subnet in enumerate(self.vpc.isolated_subnets):
            CfnOutput(
                self,
                f"PrivateDbSubnet{idx + 1}Id",
                value=subnet.subnet_id,
                description=f"Private Database Subnet {idx + 1} ID",
                export_name=f"payment-db-subnet-{idx + 1}-{environment_suffix}",
            )

    @property
    def get_vpc(self) -> ec2.Vpc:
        """Return the VPC construct."""
        return self.vpc

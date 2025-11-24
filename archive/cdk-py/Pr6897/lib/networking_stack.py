"""networking_stack.py
VPC networking infrastructure with 3 AZs, public/private subnets, and NAT Gateways.
"""

import aws_cdk as cdk
from constructs import Construct
from aws_cdk import aws_ec2 as ec2, aws_logs as logs, NestedStack, RemovalPolicy


class NetworkingStackProps:
    """Properties for NetworkingStack."""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class NetworkingStack(NestedStack):
    """Creates VPC with 3 AZs, public/private subnets, and NAT Gateways."""

    def __init__(self, scope: Construct, construct_id: str, props: NetworkingStackProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create VPC with 3 AZs
        self.vpc = ec2.Vpc(
            self, f"PaymentProcessingVPC{env_suffix}",
            vpc_name=f"payment-processing-vpc-{env_suffix}",
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(name=f"Public{env_suffix}", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24),
                ec2.SubnetConfiguration(name=f"Private{env_suffix}", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, cidr_mask=24),
                ec2.SubnetConfiguration(name=f"Isolated{env_suffix}", subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, cidr_mask=24)
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # VPC Flow Logs
        log_group = logs.LogGroup(
            self, f"VPCFlowLogsGroup{env_suffix}",
            log_group_name=f"/aws/vpc/payment-processing-{env_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        ec2.FlowLog(
            self, f"VPCFlowLog{env_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group)
        )

        cdk.CfnOutput(self, f"VPCId{env_suffix}", value=self.vpc.vpc_id, description="VPC ID")

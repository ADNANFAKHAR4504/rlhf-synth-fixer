"""
VPC Stack for Disaster Recovery Infrastructure

This module creates a VPC with Multi-AZ configuration including:
- Public and private subnets across multiple availability zones
- NAT Gateways for outbound connectivity (optional based on requirements)
- VPC Flow Logs for network monitoring
- Proper tagging for compliance
"""

from aws_cdk import (
    aws_ec2 as ec2,
    aws_logs as logs,
    CfnOutput,
    NestedStack,
    RemovalPolicy,
)
from constructs import Construct


class VPCStack(NestedStack):
    """
    Creates a Multi-AZ VPC for disaster recovery infrastructure
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with Multi-AZ configuration
        self.vpc = ec2.Vpc(
            self,
            f"DisasterRecoveryVPC-{environment_suffix}",
            vpc_name=f"dr-vpc-{environment_suffix}",
            max_azs=3,  # Use 3 AZs for high availability
            cidr="10.0.0.0/16",
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
                    name=f"Database-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Create VPC Flow Logs for security monitoring
        log_group = logs.LogGroup(
            self,
            f"VPCFlowLogsGroup-{environment_suffix}",
            log_group_name=f"/aws/vpc/dr-vpc-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK,
        )

        ec2.FlowLog(
            self,
            f"VPCFlowLog-{environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        # Create Security Group for RDS
        self.rds_security_group = ec2.SecurityGroup(
            self,
            f"RDSSecurityGroup-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS Multi-AZ database",
            security_group_name=f"rds-sg-{environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow PostgreSQL traffic within VPC
        self.rds_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from VPC",
        )

        # Create Security Group for EFS
        self.efs_security_group = ec2.SecurityGroup(
            self,
            f"EFSSecurityGroup-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for EFS file system",
            security_group_name=f"efs-sg-{environment_suffix}",
            allow_all_outbound=False,
        )

        # Allow NFS traffic within VPC
        self.efs_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(2049),
            description="Allow NFS from VPC",
        )

        # Outputs
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"dr-vpc-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "RDSSecurityGroupId",
            value=self.rds_security_group.security_group_id,
            description="RDS Security Group ID",
            export_name=f"rds-sg-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "EFSSecurityGroupId",
            value=self.efs_security_group.security_group_id,
            description="EFS Security Group ID",
            export_name=f"efs-sg-id-{environment_suffix}",
        )

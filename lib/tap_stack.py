"""tap_stack.py
This module defines the TapStack class, which creates AWS infrastructure
including VPC, EC2 instance, and security groups according to the requirements.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    CfnOutput,
    Tags,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    Creates AWS infrastructure including:
    - VPC with CIDR 10.0.0.0/16
    - Two public subnets in different AZs
    - Internet Gateway
    - EC2 instance with public IP
    - Security Group allowing SSH access

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        vpc (ec2.Vpc): The VPC created by this stack.
        instance (ec2.Instance): The EC2 instance created by this stack.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        # Create VPC with specified CIDR block
        vpc = ec2.Vpc(
            self,
            f"cdk-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"cdk-public-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                )
            ],
        )

        # Security Group for EC2 instance
        security_group = ec2.SecurityGroup(
            self,
            f"cdk-security-group-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for EC2 instance - {environment_suffix}",
            allow_all_outbound=True,
        )

        # Allow SSH access from anywhere
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access from anywhere",
        )

        # Get the latest Amazon Linux 2023 AMI
        amzn_linux = ec2.MachineImage.latest_amazon_linux2023(
            edition=ec2.AmazonLinuxEdition.STANDARD
        )

        # Create EC2 instance
        instance = ec2.Instance(
            self,
            f"cdk-ec2-instance-{environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
            machine_image=amzn_linux,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=security_group,
            associate_public_ip_address=True,
        )

        # Store references
        self.vpc = vpc
        self.instance = instance
        self.security_group = security_group
        self.environment_suffix = environment_suffix

        # Apply tags to all resources in the stack
        Tags.of(self).add("Project", "CdkSetup")

        # Stack Outputs
        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID",
        )

        CfnOutput(
            self,
            "InstanceId",
            value=instance.instance_id,
            description="EC2 Instance ID",
        )

        CfnOutput(
            self,
            "SecurityGroupId",
            value=security_group.security_group_id,
            description="Security Group ID",
        )

        CfnOutput(
            self,
            "InstancePublicIp",
            value=instance.instance_public_ip,
            description="EC2 Instance Public IP",
        )

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
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

    This stack creates a VPC and security group with specific inbound/outbound rules
    as required by the task specification.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming
          and configuration.
        vpc (ec2.Vpc): The VPC created for the security group.
        security_group (ec2.SecurityGroup): The security group with HTTP inbound
          and blocked outbound rules.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        def resource_name(resource: str) -> str:
            """Helper function to create consistent resource names with environment suffix."""
            return f"tap-{self.environment_suffix}-{resource}"

        # Create VPC for the security group
        self.vpc = ec2.Vpc(
            self,
            "VPC",
            vpc_name=resource_name("vpc"),
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),  # Use newer ip_addresses property
            enable_dns_hostnames=True,
            enable_dns_support=True,
            max_azs=2,  # Use 2 availability zones for high availability
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

        # Create security group with specific inbound and outbound rules
        self.security_group = ec2.SecurityGroup(
            self,
            "WebOnlyIngressSG",
            security_group_name=resource_name("WebOnlyIngressSG"),
            description=(
                "WebOnlyIngressSG - Security group with HTTP inbound rule and "
                "blocked outbound traffic"
            ),
            vpc=self.vpc,
            allow_all_outbound=False  # Explicitly block all outbound traffic by default
        )

        # Add HTTP inbound rule from specific CIDR block
        self.security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("203.0.113.0/24"),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from specific CIDR block"
        )

        # Note: With allow_all_outbound=False, the security group blocks all
        # outbound traffic by default. No need to add explicit egress rules
        # as this is handled automatically

        # Add tags to the security group for better resource management
        cdk.Tags.of(self.security_group).add("Name", resource_name("WebOnlyIngressSG"))
        cdk.Tags.of(self.security_group).add("Environment", self.environment_suffix)
        cdk.Tags.of(self.security_group).add("Project", "tap")

        # Add tags to the VPC as well
        cdk.Tags.of(self.vpc).add("Name", resource_name("vpc"))
        cdk.Tags.of(self.vpc).add("Environment", self.environment_suffix)
        cdk.Tags.of(self.vpc).add("Project", "tap")

        # Add stack outputs for integration tests
        cdk.CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID for integration tests"
        )

        cdk.CfnOutput(
            self,
            "SecurityGroupId",
            value=self.security_group.security_group_id,
            description="Security Group ID for integration tests"
        )

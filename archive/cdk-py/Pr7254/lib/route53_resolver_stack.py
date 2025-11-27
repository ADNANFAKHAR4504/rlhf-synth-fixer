"""route53_resolver_stack.py

This module defines the Route53 Resolver stack for centralized DNS resolution.
It creates inbound and outbound resolver endpoints in the shared services VPC
to enable DNS resolution across the multi-account architecture.
"""

from typing import Optional, List
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_route53resolver as route53resolver,
)
from constructs import Construct


class Route53ResolverStackProps(cdk.NestedStackProps):
    """Properties for Route53ResolverStack.

    Args:
        environment_suffix: Environment suffix for resource naming
        vpc: VPC where resolver endpoints will be created
        vpc_name: Name identifier for the VPC
    """
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        vpc: Optional[ec2.IVpc] = None,
        vpc_name: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.vpc_name = vpc_name


class Route53ResolverStack(cdk.NestedStack):
    """Creates Route53 Resolver endpoints for centralized DNS.

    This stack provisions:
    - Security group for resolver endpoints
    - Inbound resolver endpoint (2+ AZs)
    - Outbound resolver endpoint (2+ AZs)
    - Proper tagging for all resources

    The resolver endpoints enable:
    - Inbound: On-premises to AWS DNS resolution
    - Outbound: AWS to on-premises DNS resolution
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Route53ResolverStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix or 'dev'
        vpc_name = props.vpc_name or 'shared'

        if not props.vpc:
            raise ValueError("VPC is required for Route53 Resolver endpoints")

        # Create security group for resolver endpoints
        # Allow DNS traffic (TCP/UDP 53) from VPC CIDR
        resolver_sg = ec2.SecurityGroup(
            self,
            f"ResolverSg{environment_suffix}",
            vpc=props.vpc,
            description="Security group for Route53 Resolver endpoints",
            security_group_name=f"route53-resolver-sg-{environment_suffix}",
            allow_all_outbound=True,
        )

        # Allow inbound DNS queries from VPC CIDR (TCP and UDP port 53)
        resolver_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(props.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(53),
            description="Allow DNS TCP from VPC"
        )
        resolver_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(props.vpc.vpc_cidr_block),
            connection=ec2.Port.udp(53),
            description="Allow DNS UDP from VPC"
        )

        # Add tags to security group
        cdk.Tags.of(resolver_sg).add("Name", f"route53-resolver-sg-{environment_suffix}")
        cdk.Tags.of(resolver_sg).add("Environment", vpc_name)
        cdk.Tags.of(resolver_sg).add("CostCenter", "networking")
        cdk.Tags.of(resolver_sg).add("ManagedBy", "cdk")

        # Get private subnets for resolver endpoints
        # Route53 Resolver requires at least 2 AZs
        private_subnets = props.vpc.select_subnets(
            subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
        ).subnets

        if len(private_subnets) < 2:
            raise ValueError("Route53 Resolver requires at least 2 subnets in different AZs")

        # Create inbound resolver endpoint
        # This allows on-premises networks to resolve AWS-hosted domains
        inbound_ips = []
        for idx, subnet in enumerate(private_subnets[:2]):  # Use first 2 AZs
            inbound_ips.append(
                route53resolver.CfnResolverEndpoint.IpAddressRequestProperty(
                    subnet_id=subnet.subnet_id,
                )
            )

        self.inbound_endpoint = route53resolver.CfnResolverEndpoint(
            self,
            f"InboundEndpoint{environment_suffix}",
            direction="INBOUND",
            ip_addresses=inbound_ips,
            security_group_ids=[resolver_sg.security_group_id],
            name=f"route53-resolver-inbound-{environment_suffix}",
            tags=[
                cdk.CfnTag(key="Name", value=f"route53-resolver-inbound-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value=vpc_name),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Create outbound resolver endpoint
        # This allows AWS resources to resolve on-premises domains
        outbound_ips = []
        for idx, subnet in enumerate(private_subnets[:2]):  # Use first 2 AZs
            outbound_ips.append(
                route53resolver.CfnResolverEndpoint.IpAddressRequestProperty(
                    subnet_id=subnet.subnet_id,
                )
            )

        self.outbound_endpoint = route53resolver.CfnResolverEndpoint(
            self,
            f"OutboundEndpoint{environment_suffix}",
            direction="OUTBOUND",
            ip_addresses=outbound_ips,
            security_group_ids=[resolver_sg.security_group_id],
            name=f"route53-resolver-outbound-{environment_suffix}",
            tags=[
                cdk.CfnTag(key="Name", value=f"route53-resolver-outbound-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value=vpc_name),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Outputs
        cdk.CfnOutput(
            self,
            "InboundEndpointId",
            value=self.inbound_endpoint.ref,
            description="Route53 Resolver Inbound Endpoint ID",
            export_name=f"Route53InboundEndpointId-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "OutboundEndpointId",
            value=self.outbound_endpoint.ref,
            description="Route53 Resolver Outbound Endpoint ID",
            export_name=f"Route53OutboundEndpointId-{environment_suffix}"
        )

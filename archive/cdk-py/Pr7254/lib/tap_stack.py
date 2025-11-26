"""tap_stack.py

This module defines the TapStack class, which serves as the main CDK stack for
the multi-account Transit Gateway network architecture.

It orchestrates the instantiation of:
- Transit Gateway with custom route tables
- Production, Development, and Shared Services VPCs
- Route53 Resolver endpoints for centralized DNS
- VPC Flow Logs with S3 lifecycle policies
- Security groups and network isolation rules
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
)
from constructs import Construct

# Import nested stacks
from lib.transit_gateway_stack import TransitGatewayStack, TransitGatewayStackProps
from lib.vpc_stack import VpcStack, VpcStackProps
from lib.route53_resolver_stack import Route53ResolverStack, Route53ResolverStackProps


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
    Represents the main CDK stack for the multi-account Transit Gateway architecture.

    This stack orchestrates the deployment of a hub-and-spoke network architecture
    with Transit Gateway, multiple VPCs across different accounts, centralized DNS
    resolution via Route53 Resolver, and comprehensive network logging.

    Architecture:
    - Transit Gateway with custom route tables (no default routing)
    - Production VPC (10.0.0.0/16) - isolated from development
    - Development VPC (10.1.0.0/16) - isolated from production
    - Shared Services VPC (10.2.0.0/16) - accessible by both prod and dev
    - Route53 Resolver in shared services VPC for centralized DNS
    - VPC Flow Logs to S3 with 30-day retention
    - Security groups with least-privilege rules

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
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
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Store environment suffix for use in nested stacks
        self.environment_suffix = environment_suffix

        # PHASE 1: Create Transit Gateway with custom route tables
        # Transit Gateway is the hub of the network architecture
        tgw_props = TransitGatewayStackProps(
            environment_suffix=environment_suffix
        )

        transit_gateway_stack = TransitGatewayStack(
            self,
            f"TransitGatewayStack{environment_suffix}",
            props=tgw_props
        )

        # PHASE 2: Create VPCs with Transit Gateway attachments

        # Production VPC (10.0.0.0/16)
        # Isolated from development, can only communicate with shared services
        prod_vpc_props = VpcStackProps(
            environment_suffix=environment_suffix,
            vpc_name="production",
            vpc_cidr="10.0.0.0/16",
            transit_gateway_id=transit_gateway_stack.transit_gateway_id,
            tgw_route_table_id=transit_gateway_stack.prod_route_table.ref,
            availability_zones=2,
        )

        production_vpc_stack = VpcStack(
            self,
            f"ProductionVpcStack{environment_suffix}",
            props=prod_vpc_props
        )
        production_vpc_stack.add_dependency(transit_gateway_stack)

        # Development VPC (10.1.0.0/16)
        # Isolated from production, can only communicate with shared services
        dev_vpc_props = VpcStackProps(
            environment_suffix=environment_suffix,
            vpc_name="development",
            vpc_cidr="10.1.0.0/16",
            transit_gateway_id=transit_gateway_stack.transit_gateway_id,
            tgw_route_table_id=transit_gateway_stack.dev_route_table.ref,
            availability_zones=2,
        )

        development_vpc_stack = VpcStack(
            self,
            f"DevelopmentVpcStack{environment_suffix}",
            props=dev_vpc_props
        )
        development_vpc_stack.add_dependency(transit_gateway_stack)

        # Shared Services VPC (10.2.0.0/16)
        # Accessible by both production and development
        # Hosts Route53 Resolver endpoints for centralized DNS
        shared_vpc_props = VpcStackProps(
            environment_suffix=environment_suffix,
            vpc_name="shared",
            vpc_cidr="10.2.0.0/16",
            transit_gateway_id=transit_gateway_stack.transit_gateway_id,
            tgw_route_table_id=transit_gateway_stack.shared_route_table.ref,
            availability_zones=2,
        )

        shared_services_vpc_stack = VpcStack(
            self,
            f"SharedServicesVpcStack{environment_suffix}",
            props=shared_vpc_props
        )
        shared_services_vpc_stack.add_dependency(transit_gateway_stack)

        # PHASE 3: Configure Transit Gateway routes for network isolation
        # Production can reach shared services but NOT development
        ec2.CfnTransitGatewayRoute(
            self,
            f"ProdToSharedRoute{environment_suffix}",
            transit_gateway_route_table_id=transit_gateway_stack.prod_route_table.ref,
            destination_cidr_block="10.2.0.0/16",  # Shared services CIDR
            transit_gateway_attachment_id=shared_services_vpc_stack.tgw_attachment.ref
        ).add_dependency(shared_services_vpc_stack.nested_stack_resource)

        # Development can reach shared services but NOT production
        ec2.CfnTransitGatewayRoute(
            self,
            f"DevToSharedRoute{environment_suffix}",
            transit_gateway_route_table_id=transit_gateway_stack.dev_route_table.ref,
            destination_cidr_block="10.2.0.0/16",  # Shared services CIDR
            transit_gateway_attachment_id=shared_services_vpc_stack.tgw_attachment.ref
        ).add_dependency(shared_services_vpc_stack.nested_stack_resource)

        # Shared services can reach both production and development
        ec2.CfnTransitGatewayRoute(
            self,
            f"SharedToProdRoute{environment_suffix}",
            transit_gateway_route_table_id=transit_gateway_stack.shared_route_table.ref,
            destination_cidr_block="10.0.0.0/16",  # Production CIDR
            transit_gateway_attachment_id=production_vpc_stack.tgw_attachment.ref
        ).add_dependency(production_vpc_stack.nested_stack_resource)

        ec2.CfnTransitGatewayRoute(
            self,
            f"SharedToDevRoute{environment_suffix}",
            transit_gateway_route_table_id=transit_gateway_stack.shared_route_table.ref,
            destination_cidr_block="10.1.0.0/16",  # Development CIDR
            transit_gateway_attachment_id=development_vpc_stack.tgw_attachment.ref
        ).add_dependency(development_vpc_stack.nested_stack_resource)

        # PHASE 4: Create Route53 Resolver endpoints in shared services VPC
        # This enables centralized DNS resolution for all VPCs
        resolver_props = Route53ResolverStackProps(
            environment_suffix=environment_suffix,
            vpc=shared_services_vpc_stack.vpc,
            vpc_name="shared"
        )

        route53_resolver_stack = Route53ResolverStack(
            self,
            f"Route53ResolverStack{environment_suffix}",
            props=resolver_props
        )
        route53_resolver_stack.add_dependency(shared_services_vpc_stack)

        # PHASE 5: Configure security groups for inter-VPC communication
        # Production security group allows traffic from shared services only
        production_vpc_stack.default_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.2.0.0/16"),  # Shared services CIDR
            connection=ec2.Port.all_traffic(),
            description="Allow all traffic from shared services VPC"
        )

        # Development security group allows traffic from shared services only
        development_vpc_stack.default_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.2.0.0/16"),  # Shared services CIDR
            connection=ec2.Port.all_traffic(),
            description="Allow all traffic from shared services VPC"
        )

        # Shared services security group allows traffic from production and development
        shared_services_vpc_stack.default_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),  # Production CIDR
            connection=ec2.Port.all_traffic(),
            description="Allow all traffic from production VPC"
        )

        shared_services_vpc_stack.default_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.1.0.0/16"),  # Development CIDR
            connection=ec2.Port.all_traffic(),
            description="Allow all traffic from development VPC"
        )

        # Store references for potential use by other constructs
        self.transit_gateway_stack = transit_gateway_stack
        self.production_vpc_stack = production_vpc_stack
        self.development_vpc_stack = development_vpc_stack
        self.shared_services_vpc_stack = shared_services_vpc_stack
        self.route53_resolver_stack = route53_resolver_stack

        # Stack-level outputs
        cdk.CfnOutput(
            self,
            "StackName",
            value=self.stack_name,
            description="Main stack name"
        )

        cdk.CfnOutput(
            self,
            "EnvironmentSuffix",
            value=environment_suffix,
            description="Environment suffix for this deployment"
        )

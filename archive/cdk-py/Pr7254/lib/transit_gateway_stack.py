"""transit_gateway_stack.py

This module defines the Transit Gateway stack for the multi-account network architecture.
It creates a Transit Gateway with DNS support, custom route tables, and attachment
configurations to enable hub-and-spoke networking across VPCs.
"""

from typing import Optional, List
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    Tags,
)
from constructs import Construct


class TransitGatewayStackProps(cdk.NestedStackProps):
    """Properties for TransitGatewayStack.

    Args:
        environment_suffix: Optional environment suffix for resource naming
    """
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TransitGatewayStack(cdk.NestedStack):
    """Creates Transit Gateway infrastructure with custom route tables.

    This stack provisions:
    - Transit Gateway with DNS support enabled
    - Custom route tables for production, development, and shared services
    - Proper tagging for all resources

    The Transit Gateway is configured to NOT use default route table association
    and propagation to maintain strict network isolation.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TransitGatewayStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = props.environment_suffix if props else 'dev'

        # Create Transit Gateway with DNS support
        # DNS support is critical for centralized DNS resolution
        self.transit_gateway = ec2.CfnTransitGateway(
            self,
            f"TransitGateway{environment_suffix}",
            description=f"Hub Transit Gateway for multi-account architecture ({environment_suffix})",
            amazon_side_asn=64512,  # Private ASN for BGP
            dns_support="enable",
            vpn_ecmp_support="enable",
            # CRITICAL: Disable default route table to enforce custom routing
            default_route_table_association="disable",
            default_route_table_propagation="disable",
            tags=[
                cdk.CfnTag(key="Name", value=f"tgw-hub-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value=environment_suffix),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Create custom route tables for network isolation

        # Production route table - only routes to shared services
        self.prod_route_table = ec2.CfnTransitGatewayRouteTable(
            self,
            f"ProdRouteTable{environment_suffix}",
            transit_gateway_id=self.transit_gateway.ref,
            tags=[
                cdk.CfnTag(key="Name", value=f"tgw-rt-production-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value="production"),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Development route table - only routes to shared services
        self.dev_route_table = ec2.CfnTransitGatewayRouteTable(
            self,
            f"DevRouteTable{environment_suffix}",
            transit_gateway_id=self.transit_gateway.ref,
            tags=[
                cdk.CfnTag(key="Name", value=f"tgw-rt-development-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value="development"),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Shared services route table - routes to both prod and dev
        self.shared_route_table = ec2.CfnTransitGatewayRouteTable(
            self,
            f"SharedRouteTable{environment_suffix}",
            transit_gateway_id=self.transit_gateway.ref,
            tags=[
                cdk.CfnTag(key="Name", value=f"tgw-rt-shared-{environment_suffix}"),
                cdk.CfnTag(key="Environment", value="shared"),
                cdk.CfnTag(key="CostCenter", value="networking"),
                cdk.CfnTag(key="ManagedBy", value="cdk"),
            ]
        )

        # Export Transit Gateway ID for cross-stack references
        self.transit_gateway_id = self.transit_gateway.ref

        # Output Transit Gateway ID
        cdk.CfnOutput(
            self,
            "TransitGatewayId",
            value=self.transit_gateway_id,
            description="Transit Gateway ID for VPC attachments",
            export_name=f"TransitGatewayId-{environment_suffix}"
        )

        # Output Route Table IDs
        cdk.CfnOutput(
            self,
            "ProdRouteTableId",
            value=self.prod_route_table.ref,
            description="Production Transit Gateway Route Table ID",
            export_name=f"TgwProdRouteTableId-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "DevRouteTableId",
            value=self.dev_route_table.ref,
            description="Development Transit Gateway Route Table ID",
            export_name=f"TgwDevRouteTableId-{environment_suffix}"
        )

        cdk.CfnOutput(
            self,
            "SharedRouteTableId",
            value=self.shared_route_table.ref,
            description="Shared Services Transit Gateway Route Table ID",
            export_name=f"TgwSharedRouteTableId-{environment_suffix}"
        )

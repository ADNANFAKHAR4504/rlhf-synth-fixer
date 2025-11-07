# VPC Peering Solution - Model Response

This is a Pulumi Python implementation for cross-region VPC peering between payment processing and analytics VPCs.

## File: lib/__init__.py

```python
"""
VPC Peering Infrastructure Package
"""
```

## File: lib/__main__.py

```python
"""
Main Pulumi program for VPC peering infrastructure.
Entry point that orchestrates the VPC peering connection.
"""

import pulumi
from tap_stack import TapStack, TapStackArgs

# Get configuration
config = pulumi.Config()
environment_suffix = config.get("environment_suffix") or "dev"

# Create tags
tags = {
    "Environment": environment_suffix,
    "Owner": "platform-team",
    "CostCenter": "engineering"
}

# Create stack
args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=tags
)

stack = TapStack("vpc-peering-stack", args)

# Export outputs
pulumi.export("peering_connection_id", stack.peering_connection_id)
pulumi.export("peering_status", stack.peering_status)
pulumi.export("payment_vpc_id", stack.payment_vpc_id)
pulumi.export("analytics_vpc_id", stack.analytics_vpc_id)
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main TapStack component for VPC peering infrastructure.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack component.

    Args:
        environment_suffix: Suffix for resource naming
        tags: Default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for VPC peering infrastructure.

    Creates cross-region VPC peering between payment and analytics VPCs.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create AWS providers for each region
        self.east_provider = aws.Provider(
            f"aws-east-{self.environment_suffix}",
            region="us-east-1",
            opts=ResourceOptions(parent=self)
        )

        self.west_provider = aws.Provider(
            f"aws-west-{self.environment_suffix}",
            region="us-west-2",
            opts=ResourceOptions(parent=self)
        )

        # Get existing VPCs
        self.payment_vpc = aws.ec2.get_vpc(
            id="vpc-pay123",
            opts=pulumi.InvokeOptions(provider=self.east_provider)
        )

        self.analytics_vpc = aws.ec2.get_vpc(
            id="vpc-analytics456",
            opts=pulumi.InvokeOptions(provider=self.west_provider)
        )

        # Create VPC peering connection
        self.peering_connection = aws.ec2.VpcPeeringConnection(
            f"payment-analytics-peering-{self.environment_suffix}",
            vpc_id=self.payment_vpc.id,
            peer_vpc_id=self.analytics_vpc.id,
            peer_region="us-west-2",
            tags={**self.tags, "Name": f"payment-analytics-peering-{self.environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                provider=self.east_provider
            )
        )

        # Accept the peering connection
        self.peering_accepter = aws.ec2.VpcPeeringConnectionAccepter(
            f"peering-accepter-{self.environment_suffix}",
            vpc_peering_connection_id=self.peering_connection.id,
            auto_accept=True,
            tags={**self.tags, "Name": f"peering-accepter-{self.environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                provider=self.west_provider
            )
        )

        # Enable DNS resolution for peering connection
        self.peering_options = aws.ec2.VpcPeeringConnectionOptions(
            f"peering-options-{self.environment_suffix}",
            vpc_peering_connection_id=self.peering_connection.id,
            requester=aws.ec2.VpcPeeringConnectionOptionsRequesterArgs(
                allow_remote_vpc_dns_resolution=True
            ),
            opts=ResourceOptions(
                parent=self,
                provider=self.east_provider,
                depends_on=[self.peering_accepter]
            )
        )

        self.accepter_options = aws.ec2.VpcPeeringConnectionOptions(
            f"accepter-options-{self.environment_suffix}",
            vpc_peering_connection_id=self.peering_connection.id,
            accepter=aws.ec2.VpcPeeringConnectionOptionsAccepterArgs(
                allow_remote_vpc_dns_resolution=True
            ),
            opts=ResourceOptions(
                parent=self,
                provider=self.west_provider,
                depends_on=[self.peering_accepter]
            )
        )

        # Get route tables for payment VPC (us-east-1)
        payment_route_tables = aws.ec2.get_route_tables(
            filters=[
                aws.ec2.GetRouteTablesFilterArgs(
                    name="vpc-id",
                    values=[self.payment_vpc.id]
                ),
                aws.ec2.GetRouteTablesFilterArgs(
                    name="tag:Name",
                    values=["*private*"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.east_provider)
        )

        # Add routes in payment VPC to analytics VPC
        self.payment_routes = []
        for idx, rt_id in enumerate(payment_route_tables.ids):
            route = aws.ec2.Route(
                f"payment-to-analytics-route-{idx}-{self.environment_suffix}",
                route_table_id=rt_id,
                destination_cidr_block="10.1.0.0/16",
                vpc_peering_connection_id=self.peering_connection.id,
                opts=ResourceOptions(
                    parent=self,
                    provider=self.east_provider,
                    depends_on=[self.peering_accepter]
                )
            )
            self.payment_routes.append(route)

        # Get route tables for analytics VPC (us-west-2)
        analytics_route_tables = aws.ec2.get_route_tables(
            filters=[
                aws.ec2.GetRouteTablesFilterArgs(
                    name="vpc-id",
                    values=[self.analytics_vpc.id]
                ),
                aws.ec2.GetRouteTablesFilterArgs(
                    name="tag:Name",
                    values=["*private*"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.west_provider)
        )

        # Add routes in analytics VPC to payment VPC
        self.analytics_routes = []
        for idx, rt_id in enumerate(analytics_route_tables.ids):
            route = aws.ec2.Route(
                f"analytics-to-payment-route-{idx}-{self.environment_suffix}",
                route_table_id=rt_id,
                destination_cidr_block="10.0.0.0/16",
                vpc_peering_connection_id=self.peering_connection.id,
                opts=ResourceOptions(
                    parent=self,
                    provider=self.west_provider,
                    depends_on=[self.peering_accepter]
                )
            )
            self.analytics_routes.append(route)

        # Create security group in payment VPC
        self.payment_sg = aws.ec2.SecurityGroup(
            f"payment-vpc-sg-{self.environment_suffix}",
            vpc_id=self.payment_vpc.id,
            description="Allow HTTPS to analytics VPC",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["10.1.2.0/24"],
                description="Allow HTTPS to analytics API endpoints"
            )],
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["10.1.2.0/24"],
                description="Allow return traffic from analytics VPC"
            )],
            tags={**self.tags, "Name": f"payment-vpc-sg-{self.environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                provider=self.east_provider
            )
        )

        # Create security group in analytics VPC
        self.analytics_sg = aws.ec2.SecurityGroup(
            f"analytics-vpc-sg-{self.environment_suffix}",
            vpc_id=self.analytics_vpc.id,
            description="Allow HTTPS from payment VPC",
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["10.0.1.0/24"],
                description="Allow HTTPS from payment app servers"
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["10.0.1.0/24"],
                description="Allow return traffic to payment VPC"
            )],
            tags={**self.tags, "Name": f"analytics-vpc-sg-{self.environment_suffix}"},
            opts=ResourceOptions(
                parent=self,
                provider=self.west_provider
            )
        )

        # Set outputs
        self.peering_connection_id = self.peering_connection.id
        self.peering_status = self.peering_connection.accept_status
        self.payment_vpc_id = Output.from_input(self.payment_vpc.id)
        self.analytics_vpc_id = Output.from_input(self.analytics_vpc.id)

        # Register outputs
        self.register_outputs({
            "peering_connection_id": self.peering_connection_id,
            "peering_status": self.peering_status,
            "payment_vpc_id": self.payment_vpc_id,
            "analytics_vpc_id": self.analytics_vpc_id
        })
```

## File: Pulumi.yaml

```yaml
name: vpc-peering
runtime: python
description: Cross-region VPC peering infrastructure

config:
  environment_suffix:
    description: Environment suffix for resource naming
    default: dev
```

## File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

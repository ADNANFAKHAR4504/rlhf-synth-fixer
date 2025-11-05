"""
Production-Ready VPC Infrastructure for Financial Services Trading Platform
Deploys a secure, isolated network environment with multi-AZ high availability
"""
import pulumi
from lib.tap_stack import TapStack

# Create the VPC infrastructure stack
stack = TapStack("trading-platform-vpc")

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("vpc_cidr", stack.vpc.cidr_block)
pulumi.export("public_subnet_ids", [subnet.id for subnet in stack.public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in stack.private_subnets])
pulumi.export("nat_gateway_ids", [nat.id for nat in stack.nat_gateways])
pulumi.export("s3_endpoint_id", stack.s3_endpoint.id)
pulumi.export("internet_gateway_id", stack.internet_gateway.id)
pulumi.export("flow_logs_group", stack.flow_logs_group.name)

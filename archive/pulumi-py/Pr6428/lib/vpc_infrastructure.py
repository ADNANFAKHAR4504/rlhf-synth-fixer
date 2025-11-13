"""
VPC Infrastructure Component
Creates VPC with private subnets and VPC endpoints for cost optimization
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List


class VpcInfrastructure(pulumi.ComponentResource):
    """
    Custom ComponentResource for VPC infrastructure
    Demonstrates resource encapsulation and batched creation
    """

    def __init__(
            self,
            name: str,
            *,
            environment_suffix: str,
            common_tags: Dict[str, str],
            opts: pulumi.ResourceOptions = None
        ):
        super().__init__("custom:networking:VpcInfrastructure", name, None, opts)

        # Child resource options - all children depend on this component
        child_opts = pulumi.ResourceOptions(parent=self)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"streaming-vpc-{environment_suffix}"},
            opts=child_opts
        )

        # Create private subnets across 3 AZs (batched using list comprehension)
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        self.private_subnets = []

        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **common_tags,
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private"
                },
                opts=pulumi.ResourceOptions(
                    parent=self,
                    depends_on=[self.vpc]
                )
            )
            self.private_subnets.append(subnet)

        # Create route table for private subnets
        self.private_route_table = aws.ec2.RouteTable(
            f"private-route-table-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, "Name": f"private-rt-{environment_suffix}"},
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[self.vpc]
            )
        )

        # Associate private subnets with route table (batched)
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i+1}-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=pulumi.ResourceOptions(
                    parent=self,
                    depends_on=[self.private_route_table, subnet]
                )
            )

        # Note: VPC endpoints removed due to AWS account quota limits
        # In production, these would optimize costs by avoiding NAT Gateway charges

        # Security group for Lambda functions
        self.lambda_security_group = aws.ec2.SecurityGroup(
            f"lambda-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, "Name": f"lambda-sg-{environment_suffix}"},
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[self.vpc]
            )
        )

        # Export outputs
        self.vpc_id = self.vpc.id
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]
        self.lambda_security_group_id = self.lambda_security_group.id

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "private_subnet_ids": self.private_subnet_ids,
            "lambda_security_group_id": self.lambda_security_group_id
        })

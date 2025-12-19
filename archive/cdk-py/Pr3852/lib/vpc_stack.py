from aws_cdk import aws_ec2 as ec2, NestedStack, CfnOutput
from constructs import Construct


class VpcStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with specified CIDR
        self.vpc = ec2.Vpc(
            self,
            "MarketplaceVPC",
            ip_addresses=ec2.IpAddresses.cidr("172.31.0.0/16"),
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        CfnOutput(self, "VPCId", value=self.vpc.vpc_id, export_name="MarketplaceVPCId")

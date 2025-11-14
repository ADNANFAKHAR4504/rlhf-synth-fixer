from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    Tags,
    CfnOutput
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with 3 AZs
        self.vpc = ec2.Vpc(
            self, f"PaymentVPC-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Cost optimization - 1 NAT per VPC
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
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # VPC endpoints removed due to account limit
        # Lambdas will use NAT Gateway for S3 and DynamoDB access

        Tags.of(self.vpc).add("Name", f"payment-vpc-{environment_suffix}")

        CfnOutput(self, "VpcId", value=self.vpc.vpc_id, export_name=f"vpc-id-{environment_suffix}")

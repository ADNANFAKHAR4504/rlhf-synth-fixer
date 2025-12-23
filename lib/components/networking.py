import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class NetworkSecurityInfrastructure(pulumi.ComponentResource):
    def __init__(self,
                 name: str,
                 region: str,
                 environment: str,
                 kms_key_arn: pulumi.Input[str],
                 tags: dict,
                 opts: ResourceOptions = None):

        super().__init__('custom:network:NetworkSecurityInfrastructure', name, {}, opts)

        self.name = name
        self.region = region
        self.environment = environment
        self.kms_key_arn = kms_key_arn
        self.tags = tags

        resource_opts = ResourceOptions(
            parent=self,
            custom_timeouts={"create": "5m", "update": "5m", "delete": "5m"}
        )

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"{name}-vpc"},
            opts=resource_opts
        )

        # Create Public Subnets
        self.public_subnet_1 = aws.ec2.Subnet(
            f"{name}-public-subnet-1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{region}a",
            tags={**tags, "Name": f"{name}-public-subnet-1"},
            opts=resource_opts
        )

        self.public_subnet_2 = aws.ec2.Subnet(
            f"{name}-public-subnet-2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{region}b",
            tags={**tags, "Name": f"{name}-public-subnet-2"},
            opts=resource_opts
        )

        # Create Private Subnets
        self.private_subnet_1 = aws.ec2.Subnet(
            f"{name}-private-subnet-1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=f"{region}a",
            tags={**tags, "Name": f"{name}-private-subnet-1"},
            opts=resource_opts
        )

        self.private_subnet_2 = aws.ec2.Subnet(
            f"{name}-private-subnet-2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.4.0/24",
            availability_zone=f"{region}b",
            tags={**tags, "Name": f"{name}-private-subnet-2"},
            opts=resource_opts
        )

        # Database Security Group
        self.database_security_group = aws.ec2.SecurityGroup(
            f"{name}-db-sg",
            vpc_id=self.vpc.id,
            description="Database security group",
            tags={**tags, "Name": f"{name}-db-sg"},
            opts=resource_opts
        )

        # Outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [self.public_subnet_1.id, self.public_subnet_2.id]
        self.private_subnet_ids = [self.private_subnet_1.id, self.private_subnet_2.id]
        self.database_security_group_id = self.database_security_group.id

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "database_security_group_id": self.database_security_group_id
        })
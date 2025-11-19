from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.ec2_transit_gateway import Ec2TransitGateway
from cdktf_cdktf_provider_aws.ec2_transit_gateway_vpc_attachment import Ec2TransitGatewayVpcAttachment
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from constructs import Construct

class NetworkingModule(Construct):
    def __init__(self, scope: Construct, id: str, primary_provider, secondary_provider,
                 environment_suffix: str, migration_phase: str):
        super().__init__(scope, id)

        # ISSUE: VPC names missing environmentSuffix
        # Primary VPC (us-east-1)
        self.primary_vpc = Vpc(self, "primary-vpc",
            provider=primary_provider,
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{migration_phase}-{environment_suffix}",  # Missing environmentSuffix
                "MigrationPhase": migration_phase
            }
        )

        # Secondary VPC (us-east-2)
        self.secondary_vpc = Vpc(self, "secondary-vpc",
            provider=secondary_provider,
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{migration_phase}-{environment_suffix}",  # Missing environmentSuffix
                "MigrationPhase": migration_phase
            }
        )

        # Primary subnets (3 AZs)
        self.primary_subnets = []
        azs_primary = ["us-east-1a", "us-east-1b", "us-east-1c"]
        for i, az in enumerate(azs_primary):
            subnet = Subnet(self, f"primary-subnet-{i}",
                provider=primary_provider,
                vpc_id=self.primary_vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-subnet-primary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.primary_subnets.append(subnet)

        # Secondary subnets (3 AZs)
        self.secondary_subnets = []
        azs_secondary = ["us-east-2a", "us-east-2b", "us-east-2c"]
        for i, az in enumerate(azs_secondary):
            subnet = Subnet(self, f"secondary-subnet-{i}",
                provider=secondary_provider,
                vpc_id=self.secondary_vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"payment-subnet-secondary-{i}-{environment_suffix}",
                    "MigrationPhase": migration_phase
                }
            )
            self.secondary_subnets.append(subnet)

        # Internet Gateways
        self.primary_igw = InternetGateway(self, "primary-igw",
            provider=primary_provider,
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-igw-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_igw = InternetGateway(self, "secondary-igw",
            provider=secondary_provider,
            vpc_id=self.secondary_vpc.id,
            tags={
                "Name": f"payment-igw-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Transit Gateway for inter-region connectivity
        self.transit_gateway = Ec2TransitGateway(self, "transit-gateway",
            provider=primary_provider,
            description="Transit Gateway for multi-region payment processing",
            amazon_side_asn=64512,
            default_route_table_association="enable",
            default_route_table_propagation="enable",
            tags={
                "Name": f"payment-tgw-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Transit Gateway VPC attachments
        self.primary_tgw_attachment = Ec2TransitGatewayVpcAttachment(self, "primary-tgw-attachment",
            provider=primary_provider,
            subnet_ids=[s.id for s in self.primary_subnets],
            transit_gateway_id=self.transit_gateway.id,
            vpc_id=self.primary_vpc.id,
            tags={
                "Name": f"payment-tgw-attach-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Security Groups
        self.primary_alb_sg = SecurityGroup(self, "primary-alb-sg",
            provider=primary_provider,
            name=f"payment-alb-sg-primary-{environment_suffix}",
            description="Security group for primary ALB",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-alb-sg-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.primary_ecs_sg = SecurityGroup(self, "primary-ecs-sg",
            provider=primary_provider,
            name=f"payment-ecs-sg-primary-{environment_suffix}",
            description="Security group for primary ECS tasks",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.primary_alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-ecs-sg-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # Secondary region security groups
        self.secondary_alb_sg = SecurityGroup(self, "secondary-alb-sg",
            provider=secondary_provider,
            name=f"payment-alb-sg-secondary-{environment_suffix}",
            description="Security group for secondary ALB",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-alb-sg-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_ecs_sg = SecurityGroup(self, "secondary-ecs-sg",
            provider=secondary_provider,
            name=f"payment-ecs-sg-secondary-{environment_suffix}",
            description="Security group for secondary ECS tasks",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.secondary_alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-ecs-sg-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        # FIXED: Added RDS security groups
        self.primary_rds_sg = SecurityGroup(self, "primary-rds-sg",
            provider=primary_provider,
            name=f"payment-rds-sg-primary-{environment_suffix}",
            description="Security group for primary Aurora cluster",
            vpc_id=self.primary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.primary_ecs_sg.id],
                    description="Allow PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-rds-sg-primary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

        self.secondary_rds_sg = SecurityGroup(self, "secondary-rds-sg",
            provider=secondary_provider,
            name=f"payment-rds-sg-secondary-{environment_suffix}",
            description="Security group for secondary Aurora cluster",
            vpc_id=self.secondary_vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.secondary_ecs_sg.id],
                    description="Allow PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={
                "Name": f"payment-rds-sg-secondary-{environment_suffix}",
                "MigrationPhase": migration_phase
            }
        )

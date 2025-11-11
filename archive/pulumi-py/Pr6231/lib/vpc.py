"""
VPC and Network Infrastructure
Creates VPC with public and private subnets across multiple AZs
"""

import pulumi
import pulumi_aws as aws

def create_vpc(environment_suffix: str, region: str):
    """
    Create VPC with 2 public and 2 private subnets across 2 AZs
    """

    # Create VPC
    vpc = aws.ec2.Vpc(
        f"vpc-{environment_suffix}",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"vpc-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"igw-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"igw-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Availability Zones
    azs = [f"{region}a", f"{region}b"]

    # Create public subnets
    public_subnet_1 = aws.ec2.Subnet(
        f"public-subnet-1-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.1.0/24",
        availability_zone=azs[0],
        map_public_ip_on_launch=True,
        tags={
            "Name": f"public-subnet-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Public"
        }
    )

    public_subnet_2 = aws.ec2.Subnet(
        f"public-subnet-2-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.2.0/24",
        availability_zone=azs[1],
        map_public_ip_on_launch=True,
        tags={
            "Name": f"public-subnet-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Public"
        }
    )

    # Create private subnets
    private_subnet_1 = aws.ec2.Subnet(
        f"private-subnet-1-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.3.0/24",
        availability_zone=azs[0],
        tags={
            "Name": f"private-subnet-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Private"
        }
    )

    private_subnet_2 = aws.ec2.Subnet(
        f"private-subnet-2-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block="10.0.4.0/24",
        availability_zone=azs[1],
        tags={
            "Name": f"private-subnet-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix,
            "Type": "Private"
        }
    )

    # Create Elastic IPs for NAT Gateways
    eip_1 = aws.ec2.Eip(
        f"nat-eip-1-{environment_suffix}",
        domain="vpc",
        tags={
            "Name": f"nat-eip-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    eip_2 = aws.ec2.Eip(
        f"nat-eip-2-{environment_suffix}",
        domain="vpc",
        tags={
            "Name": f"nat-eip-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create NAT Gateways
    nat_gateway_1 = aws.ec2.NatGateway(
        f"nat-gateway-1-{environment_suffix}",
        allocation_id=eip_1.id,
        subnet_id=public_subnet_1.id,
        tags={
            "Name": f"nat-gateway-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    nat_gateway_2 = aws.ec2.NatGateway(
        f"nat-gateway-2-{environment_suffix}",
        allocation_id=eip_2.id,
        subnet_id=public_subnet_2.id,
        tags={
            "Name": f"nat-gateway-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create public route table
    public_route_table = aws.ec2.RouteTable(
        f"public-rt-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"public-rt-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Add route to Internet Gateway
    public_route = aws.ec2.Route(
        f"public-route-{environment_suffix}",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id
    )

    # Associate public subnets with public route table
    public_rt_assoc_1 = aws.ec2.RouteTableAssociation(
        f"public-rt-assoc-1-{environment_suffix}",
        subnet_id=public_subnet_1.id,
        route_table_id=public_route_table.id
    )

    public_rt_assoc_2 = aws.ec2.RouteTableAssociation(
        f"public-rt-assoc-2-{environment_suffix}",
        subnet_id=public_subnet_2.id,
        route_table_id=public_route_table.id
    )

    # Create private route tables
    private_route_table_1 = aws.ec2.RouteTable(
        f"private-rt-1-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"private-rt-1-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    private_route_table_2 = aws.ec2.RouteTable(
        f"private-rt-2-{environment_suffix}",
        vpc_id=vpc.id,
        tags={
            "Name": f"private-rt-2-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Add routes to NAT Gateways
    private_route_1 = aws.ec2.Route(
        f"private-route-1-{environment_suffix}",
        route_table_id=private_route_table_1.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway_1.id
    )

    private_route_2 = aws.ec2.Route(
        f"private-route-2-{environment_suffix}",
        route_table_id=private_route_table_2.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway_2.id
    )

    # Associate private subnets with private route tables
    private_rt_assoc_1 = aws.ec2.RouteTableAssociation(
        f"private-rt-assoc-1-{environment_suffix}",
        subnet_id=private_subnet_1.id,
        route_table_id=private_route_table_1.id
    )

    private_rt_assoc_2 = aws.ec2.RouteTableAssociation(
        f"private-rt-assoc-2-{environment_suffix}",
        subnet_id=private_subnet_2.id,
        route_table_id=private_route_table_2.id
    )

    # Create security group for ALB
    alb_security_group = aws.ec2.SecurityGroup(
        f"alb-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for Application Load Balancer",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=80,
                to_port=80,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow HTTP from anywhere"
            ),
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow HTTPS from anywhere"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )
        ],
        tags={
            "Name": f"alb-sg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create security group for ECS tasks
    ecs_security_group = aws.ec2.SecurityGroup(
        f"ecs-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for ECS tasks",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5000,
                to_port=5000,
                security_groups=[alb_security_group.id],
                description="Allow traffic from ALB on port 5000"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )
        ],
        tags={
            "Name": f"ecs-sg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create security group for RDS
    database_security_group = aws.ec2.SecurityGroup(
        f"rds-sg-{environment_suffix}",
        vpc_id=vpc.id,
        description="Security group for RDS PostgreSQL",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=5432,
                to_port=5432,
                security_groups=[ecs_security_group.id],
                description="Allow PostgreSQL from ECS tasks"
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )
        ],
        tags={
            "Name": f"rds-sg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    return {
        "vpc": vpc,
        "public_subnets": [public_subnet_1, public_subnet_2],
        "private_subnets": [private_subnet_1, private_subnet_2],
        "alb_security_group": alb_security_group,
        "ecs_security_group": ecs_security_group,
        "database_security_group": database_security_group,
        "nat_gateways": [nat_gateway_1, nat_gateway_2]
    }

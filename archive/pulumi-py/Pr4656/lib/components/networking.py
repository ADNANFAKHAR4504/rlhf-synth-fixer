import pulumi
import pulumi_aws as aws
from pulumi import Output

class NetworkingStack:
    def __init__(self, name: str):
        self.name = name
        
        # Create VPC spanning 3 availability zones
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"{name}-vpc"}
        )
        
        # Get availability zones (first 3)
        azs = aws.get_availability_zones(state="available")
        self.availability_zones = azs.names[:3]
        
        # Create public subnets for ALB
        self.public_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={"Name": f"{name}-public-subnet-{i+1}"}
            )
            self.public_subnets.append(subnet)
        
        # Create private subnets for ECS tasks
        self.private_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={"Name": f"{name}-private-subnet-{i+1}"}
            )
            self.private_subnets.append(subnet)
        
        # Create database subnets
        self.db_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"{name}-db-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+20}.0/24",
                availability_zone=az,
                tags={"Name": f"{name}-db-subnet-{i+1}"}
            )
            self.db_subnets.append(subnet)
        
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"{name}-igw"}
        )
        
        # Elastic IPs for NAT Gateways
        self.eips = []
        for i in range(len(self.availability_zones)):
            eip = aws.ec2.Eip(
                f"{name}-eip-{i+1}",
                domain="vpc",
                tags={"Name": f"{name}-eip-{i+1}"}
            )
            self.eips.append(eip)
        
        # NAT Gateways (one per AZ for high availability)
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            nat = aws.ec2.NatGateway(
                f"{name}-nat-{i+1}",
                allocation_id=self.eips[i].id,
                subnet_id=subnet.id,
                tags={"Name": f"{name}-nat-{i+1}"}
            )
            self.nat_gateways.append(nat)
        
        # Route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            routes=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": self.igw.id
            }],
            tags={"Name": f"{name}-public-rt"}
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )
        
        # Route tables for private subnets (one per AZ)
        self.private_route_tables = []
        for i, nat in enumerate(self.nat_gateways):
            rt = aws.ec2.RouteTable(
                f"{name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                routes=[{
                    "cidr_block": "0.0.0.0/0",
                    "nat_gateway_id": nat.id
                }],
                tags={"Name": f"{name}-private-rt-{i+1}"}
            )
            self.private_route_tables.append(rt)
            
            # Associate with corresponding private subnet
            aws.ec2.RouteTableAssociation(
                f"{name}-private-rta-{i+1}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=rt.id
            )
        
        # DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{name}-db-subnet-group",
            subnet_ids=[s.id for s in self.db_subnets],
            tags={"Name": f"{name}-db-subnet-group"}
        )


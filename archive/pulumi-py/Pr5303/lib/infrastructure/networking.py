"""
Networking infrastructure module for VPC, subnets, gateways, and routing.

This module creates a multi-AZ VPC architecture with public and private subnets,
Internet Gateway for public access, and NAT Gateways for private subnet outbound traffic.
"""

from typing import List, Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class NetworkingStack:
    """
    Manages VPC networking infrastructure including subnets, gateways, and routing.
    
    Creates a VPC spanning multiple availability zones with:
    - Public subnets with Internet Gateway access
    - Private subnets with NAT Gateway access
    - Proper routing tables for each subnet type
    """
    
    def __init__(self, config: InfraConfig, parent: Optional[pulumi.Resource] = None):
        """
        Initialize the networking stack.
        
        Args:
            config: Infrastructure configuration
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.parent = parent
        
        # Get availability zones dynamically
        self.availability_zones = config.get_availability_zones(count=2)
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create Internet Gateway
        self.internet_gateway = self._create_internet_gateway()
        
        # Create subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()
        
        # Create NAT Gateways (one per AZ for high availability)
        self.nat_gateways = self._create_nat_gateways()
        
        # Create and configure routing tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()
    
    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create the VPC."""
        vpc_name = self.config.get_resource_name('vpc')
        
        vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags={
                **self.config.get_common_tags(),
                'Name': vpc_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return vpc
    
    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway for public subnet access."""
        igw_name = self.config.get_resource_name('igw')
        
        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': igw_name
            },
            opts=ResourceOptions(parent=self.vpc)
        )
        
        return igw
    
    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """Create public subnets in each availability zone."""
        public_subnets = []
        
        for i, az in enumerate(self.availability_zones):
            subnet_name = self.config.get_resource_name(f'public-subnet-{i+1}')
            # Public subnets use even indices: 0, 2, 4, ...
            subnet_cidr = self.config.calculate_subnet_cidr(self.config.vpc_cidr, i * 2)
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_common_tags(),
                    'Name': subnet_name,
                    'Type': 'Public',
                    'AZ': az
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            
            public_subnets.append(subnet)
        
        return public_subnets
    
    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """Create private subnets in each availability zone."""
        private_subnets = []
        
        for i, az in enumerate(self.availability_zones):
            subnet_name = self.config.get_resource_name(f'private-subnet-{i+1}')
            # Private subnets use odd indices: 1, 3, 5, ...
            subnet_cidr = self.config.calculate_subnet_cidr(self.config.vpc_cidr, i * 2 + 1)
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=subnet_cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.config.get_common_tags(),
                    'Name': subnet_name,
                    'Type': 'Private',
                    'AZ': az
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            
            private_subnets.append(subnet)
        
        return private_subnets
    
    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """Create NAT Gateways in each public subnet for high availability."""
        nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip_name = self.config.get_resource_name(f'nat-eip-{i+1}')
            eip = aws.ec2.Eip(
                eip_name,
                domain='vpc',
                tags={
                    **self.config.get_common_tags(),
                    'Name': eip_name
                },
                opts=ResourceOptions(parent=public_subnet)
            )
            
            # Create NAT Gateway
            nat_name = self.config.get_resource_name(f'nat-gateway-{i+1}')
            nat_gateway = aws.ec2.NatGateway(
                nat_name,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': nat_name
                },
                opts=ResourceOptions(parent=public_subnet, depends_on=[self.internet_gateway])
            )
            
            nat_gateways.append(nat_gateway)
        
        return nat_gateways
    
    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """Create route table for public subnets with IGW route."""
        rt_name = self.config.get_resource_name('public-rt')
        
        # Create route table
        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': rt_name,
                'Type': 'Public'
            },
            opts=ResourceOptions(parent=self.vpc)
        )
        
        # Add route to Internet Gateway
        route_name = self.config.get_resource_name('public-route-igw')
        aws.ec2.Route(
            route_name,
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(parent=route_table)
        )
        
        # Associate route table with public subnets
        for i, subnet in enumerate(self.public_subnets):
            assoc_name = self.config.get_resource_name(f'public-rt-assoc-{i+1}')
            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )
        
        return route_table
    
    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """Create route tables for private subnets with NAT Gateway routes."""
        route_tables = []
        
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt_name = self.config.get_resource_name(f'private-rt-{i+1}')
            
            # Create route table
            route_table = aws.ec2.RouteTable(
                rt_name,
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': rt_name,
                    'Type': 'Private'
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            
            # Add route to NAT Gateway
            route_name = self.config.get_resource_name(f'private-route-nat-{i+1}')
            aws.ec2.Route(
                route_name,
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=route_table)
            )
            
            # Associate route table with private subnet
            assoc_name = self.config.get_resource_name(f'private-rt-assoc-{i+1}')
            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )
            
            route_tables.append(route_table)
        
        return route_tables
    
    # Getter methods for outputs
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_vpc_cidr(self) -> Output[str]:
        """Get VPC CIDR block."""
        return self.vpc.cidr_block
    
    def get_public_subnet_ids(self) -> List[Output[str]]:
        """Get list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]
    
    def get_private_subnet_ids(self) -> List[Output[str]]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
    
    def get_internet_gateway_id(self) -> Output[str]:
        """Get Internet Gateway ID."""
        return self.internet_gateway.id
    
    def get_nat_gateway_ids(self) -> List[Output[str]]:
        """Get list of NAT Gateway IDs."""
        return [nat.id for nat in self.nat_gateways]
    
    def get_public_route_table_id(self) -> Output[str]:
        """Get public route table ID."""
        return self.public_route_table.id
    
    def get_private_route_table_ids(self) -> List[Output[str]]:
        """Get list of private route table IDs."""
        return [rt.id for rt in self.private_route_tables]


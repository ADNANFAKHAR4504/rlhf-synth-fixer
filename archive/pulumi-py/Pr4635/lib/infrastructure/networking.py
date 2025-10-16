"""
VPC and networking configuration.

This module creates or uses existing VPC and subnets for the infrastructure.
Addresses the resource scoping requirement by avoiding hardcoded default VPC.
"""

from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class NetworkingStack:
    """
    Manages VPC and networking resources.
    
    Can create new VPC or use existing one based on configuration.
    """
    
    def __init__(self, config: Config, use_default_vpc: bool = True):
        """
        Initialize networking stack.
        
        Args:
            config: Configuration object
            use_default_vpc: If True, use default VPC; otherwise create new VPC
        """
        self.config = config
        self.use_default_vpc = use_default_vpc
        
        if use_default_vpc:
            self._use_default_vpc()
        else:
            self._create_vpc()
    
    def _use_default_vpc(self):
        """Use existing default VPC."""
        # Get default VPC
        vpc = aws.ec2.get_vpc(default=True)
        self.vpc_id = vpc.id
        
        # Get available AZs (exclude us-east-1e which often lacks capacity for t3)
        available_azs = aws.get_availability_zones(
            state='available',
            filters=[
                aws.GetAvailabilityZonesFilterArgs(
                    name='zone-name',
                    values=['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1f']
                )
            ]
        )
        
        # Get subnets in default VPC in available AZs
        subnets = aws.ec2.get_subnets(
            filters=[
                aws.ec2.GetSubnetsFilterArgs(
                    name='vpc-id',
                    values=[vpc.id]
                ),
                aws.ec2.GetSubnetsFilterArgs(
                    name='availability-zone',
                    values=available_azs.names[:2]  # Use first 2 available AZs
                )
            ]
        )
        
        self.subnet_ids = subnets.ids
        
        # Get first two subnets for redundancy
        self.primary_subnet_ids = subnets.ids[:2] if len(subnets.ids) >= 2 else subnets.ids
    
    def _create_vpc(self):
        """Create new VPC with public and private subnets."""
        vpc_name = self.config.get_resource_name('vpc')
        
        # Create VPC
        vpc = aws.ec2.Vpc(
            'main-vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=self.config.get_tags({
                'Name': vpc_name
            })
        )
        
        self.vpc_id = vpc.id
        
        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            'main-igw',
            vpc_id=vpc.id,
            tags=self.config.get_tags({
                'Name': f"{vpc_name}-igw"
            })
        )
        
        # Create public subnets in two AZs
        availability_zones = aws.get_availability_zones(state='available')
        
        public_subnets = []
        for i, az in enumerate(availability_zones.names[:2]):
            subnet = aws.ec2.Subnet(
                f'public-subnet-{i}',
                vpc_id=vpc.id,
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self.config.get_tags({
                    'Name': f"{vpc_name}-public-{i}",
                    'Type': 'Public'
                })
            )
            public_subnets.append(subnet)
        
        # Create route table for public subnets
        public_route_table = aws.ec2.RouteTable(
            'public-route-table',
            vpc_id=vpc.id,
            tags=self.config.get_tags({
                'Name': f"{vpc_name}-public-rt"
            })
        )
        
        # Add route to Internet Gateway
        aws.ec2.Route(
            'public-internet-route',
            route_table_id=public_route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=igw.id
        )
        
        # Associate route table with public subnets
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rta-{i}',
                subnet_id=subnet.id,
                route_table_id=public_route_table.id
            )
        
        self.subnet_ids = [s.id for s in public_subnets]
        self.primary_subnet_ids = self.subnet_ids
    
    def get_vpc_id(self) -> str:
        """
        Get VPC ID.
        
        Returns:
            VPC ID
        """
        return self.vpc_id
    
    def get_subnet_ids(self) -> List[str]:
        """
        Get all subnet IDs.
        
        Returns:
            List of subnet IDs
        """
        return self.subnet_ids
    
    def get_primary_subnet_ids(self) -> List[str]:
        """
        Get primary subnet IDs (for resource placement).
        
        Returns:
            List of primary subnet IDs
        """
        return self.primary_subnet_ids


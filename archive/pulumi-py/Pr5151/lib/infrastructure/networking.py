"""
Networking infrastructure module.

This module creates VPC, subnets, internet gateway, and route tables
for the EC2 infrastructure.
"""
from typing import List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class NetworkingStack:
    """
    Creates and manages VPC and networking resources.
    
    Creates:
    - VPC with DNS support
    - Public subnets across multiple availability zones
    - Internet Gateway
    - Route tables and associations
    """
    
    def __init__(
        self,
        config: InfraConfig,
        aws_provider: aws.Provider,
        parent: pulumi.ComponentResource = None
    ):
        """
        Initialize the networking stack.
        
        Args:
            config: Infrastructure configuration
            aws_provider: AWS provider instance
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.aws_provider = aws_provider
        self.parent = parent
        
        # Get available availability zones
        self.availability_zones = self._get_availability_zones()
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create Internet Gateway
        self.internet_gateway = self._create_internet_gateway()
        
        # Create public subnets
        self.public_subnets = self._create_public_subnets()
        
        # Create route table
        self.route_table = self._create_route_table()
        
        # Associate subnets with route table
        self.route_table_associations = self._create_route_table_associations()
    
    def _get_availability_zones(self):
        """
        Get available availability zones in the region.
        
        Returns:
            Availability zones data
        """
        azs = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.aws_provider)
        )
        return azs
    
    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC.
        
        Returns:
            VPC resource
        """
        vpc_name = self.config.get_resource_name('vpc', include_region=False)
        
        vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags=self.config.get_tags_for_resource('VPC', Name=vpc_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent
            )
        )
        
        return vpc
    
    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway for VPC.
        
        Returns:
            Internet Gateway resource
        """
        igw_name = self.config.get_resource_name('igw', include_region=False)
        
        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('InternetGateway', Name=igw_name),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.vpc]
            )
        )
        
        return igw
    
    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets across availability zones.
        
        Returns:
            List of subnet resources
        """
        subnets = []
        
        # Use first 2 AZs for cost efficiency (t2.micro budget-conscious)
        az_count = min(2, len(self.availability_zones.names))
        
        for i in range(az_count):
            subnet_name = self.config.get_resource_name(
                'subnet-public',
                suffix=f"az{i+1}",
                include_region=False
            )
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=self.config.public_subnet_cidrs[i],
                availability_zone=self.availability_zones.names[i],
                map_public_ip_on_launch=True,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=subnet_name,
                    Type='Public',
                    AZ=self.availability_zones.names[i]
                ),
                opts=ResourceOptions(
                    provider=self.aws_provider,
                    parent=self.parent,
                    depends_on=[self.vpc]
                )
            )
            
            subnets.append(subnet)
        
        return subnets
    
    def _create_route_table(self) -> aws.ec2.RouteTable:
        """
        Create route table for public subnets.
        
        Returns:
            Route table resource
        """
        rt_name = self.config.get_resource_name('rt-public', include_region=False)
        
        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.internet_gateway.id
                )
            ],
            tags=self.config.get_tags_for_resource('RouteTable', Name=rt_name, Type='Public'),
            opts=ResourceOptions(
                provider=self.aws_provider,
                parent=self.parent,
                depends_on=[self.vpc, self.internet_gateway]
            )
        )
        
        return route_table
    
    def _create_route_table_associations(self) -> List[aws.ec2.RouteTableAssociation]:
        """
        Associate public subnets with route table.
        
        Returns:
            List of route table association resources
        """
        associations = []
        
        for i, subnet in enumerate(self.public_subnets):
            assoc_name = self.config.get_resource_name(
                'rta-public',
                suffix=f"az{i+1}",
                include_region=False
            )
            
            association = aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=subnet.id,
                route_table_id=self.route_table.id,
                opts=ResourceOptions(
                    provider=self.aws_provider,
                    parent=self.parent,
                    depends_on=[subnet, self.route_table]
                )
            )
            
            associations.append(association)
        
        return associations
    
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_subnet_ids(self) -> Output[List[str]]:
        """Get list of public subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.public_subnets])

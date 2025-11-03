"""
VPC module for Lambda functions.

This module creates VPC resources including subnets, security groups,
NAT gateways, and VPC endpoints for secure Lambda deployment.
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class VPCStack:
    """
    Manages VPC resources for Lambda functions.
    
    Creates VPC with public and private subnets, NAT gateways,
    and VPC endpoints for S3 and other AWS services.
    """
    
    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the VPC stack.
        
        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc = None
        self.public_subnets: List[aws.ec2.Subnet] = []
        self.private_subnets: List[aws.ec2.Subnet] = []
        self.private_route_tables: List[aws.ec2.RouteTable] = []
        self.security_groups: Dict[str, aws.ec2.SecurityGroup] = {}
        self.vpc_endpoints: Dict[str, aws.ec2.VpcEndpoint] = {}
        
        self._create_vpc()
        self._create_subnets()
        self._create_internet_gateway()
        self._create_nat_gateways()
        self._create_route_tables()
        self._create_security_groups()
        self._create_vpc_endpoints()
    
    def _create_vpc(self):
        """Create VPC."""
        resource_name = self.config.get_resource_name('vpc')
        
        self.vpc = aws.ec2.Vpc(
            'vpc',
            cidr_block=self.config.vpc_cidr,
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_subnets(self):
        """Create public and private subnets across availability zones."""
        azs_output = aws.get_availability_zones(state='available')
        azs = azs_output.names[:self.config.vpc_availability_zones]
        
        for i, az in enumerate(azs):
            public_subnet_name = self.config.get_resource_name(f'public-subnet-{i+1}')
            private_subnet_name = self.config.get_resource_name(f'private-subnet-{i+1}')
            
            public_subnet = aws.ec2.Subnet(
                f'public-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i*2}.0/24',
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_common_tags(),
                    'Name': public_subnet_name,
                    'Type': 'Public'
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.public_subnets.append(public_subnet)
            
            private_subnet = aws.ec2.Subnet(
                f'private-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i*2+1}.0/24',
                availability_zone=az,
                tags={
                    **self.config.get_common_tags(),
                    'Name': private_subnet_name,
                    'Type': 'Private'
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.private_subnets.append(private_subnet)
    
    def _create_internet_gateway(self):
        """Create Internet Gateway for public subnets."""
        resource_name = self.config.get_resource_name('igw')
        
        self.igw = aws.ec2.InternetGateway(
            'igw',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_nat_gateways(self):
        """Create NAT Gateways for private subnets."""
        self.nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            eip_name = self.config.get_resource_name(f'nat-eip-{i+1}')
            nat_name = self.config.get_resource_name(f'nat-{i+1}')
            
            eip = aws.ec2.Eip(
                f'nat-eip-{i}',
                domain='vpc',
                tags={
                    **self.config.get_common_tags(),
                    'Name': eip_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            nat = aws.ec2.NatGateway(
                f'nat-{i}',
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': nat_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.nat_gateways.append(nat)
    
    def _create_route_tables(self):
        """Create route tables for public and private subnets."""
        public_rt_name = self.config.get_resource_name('public-rt')
        
        public_rt = aws.ec2.RouteTable(
            'public-rt',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': public_rt_name,
                'Type': 'Public'
            },
            opts=self.provider_manager.get_resource_options()
        )
        
        aws.ec2.Route(
            'public-route',
            route_table_id=public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=self.provider_manager.get_resource_options()
        )
        
        for i, public_subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rt-assoc-{i}',
                subnet_id=public_subnet.id,
                route_table_id=public_rt.id,
                opts=self.provider_manager.get_resource_options()
            )
        
        for i, (private_subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt_name = self.config.get_resource_name(f'private-rt-{i+1}')
            
            private_rt = aws.ec2.RouteTable(
                f'private-rt-{i}',
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': private_rt_name,
                    'Type': 'Private'
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.private_route_tables.append(private_rt)
            
            aws.ec2.Route(
                f'private-route-{i}',
                route_table_id=private_rt.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat.id,
                opts=self.provider_manager.get_resource_options()
            )
            
            aws.ec2.RouteTableAssociation(
                f'private-rt-assoc-{i}',
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
                opts=self.provider_manager.get_resource_options()
            )
    
    def _create_security_groups(self):
        """Create security groups for Lambda functions."""
        lambda_sg_name = self.config.get_resource_name('lambda-sg')
        
        lambda_sg = aws.ec2.SecurityGroup(
            'lambda-sg',
            vpc_id=self.vpc.id,
            description='Security group for Lambda functions',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0'],
                description='Allow all outbound traffic'
            )],
            tags={
                **self.config.get_common_tags(),
                'Name': lambda_sg_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        self.security_groups['lambda'] = lambda_sg
    
    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services."""
        s3_endpoint_name = self.config.get_resource_name('s3-endpoint')
        
        s3_endpoint = aws.ec2.VpcEndpoint(
            's3-endpoint',
            vpc_id=self.vpc.id,
            service_name=f'com.amazonaws.{self.config.primary_region}.s3',
            vpc_endpoint_type='Gateway',
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.config.get_common_tags(),
                'Name': s3_endpoint_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        self.vpc_endpoints['s3'] = s3_endpoint
    
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_private_subnet_ids(self) -> Output[List[str]]:
        """Get private subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.private_subnets])
    
    def get_lambda_security_group_id(self) -> Output[str]:
        """Get Lambda security group ID."""
        return self.security_groups['lambda'].id


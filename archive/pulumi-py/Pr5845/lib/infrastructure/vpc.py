"""
VPC module for network infrastructure.

This module creates and manages VPC, subnets, NAT gateways, security groups,
and VPC endpoints for Lambda functions.
"""

from typing import List

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class VPCStack:
    """Manages VPC and networking resources for Lambda functions."""
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the VPC stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        
        self._create_vpc()
        self._create_subnets()
        self._create_internet_gateway()
        self._create_nat_gateways()
        self._create_route_tables()
        self._create_security_groups()
        self._create_vpc_endpoints()
    
    def _create_vpc(self):
        """Create VPC."""
        vpc_name = self.config.get_resource_name('vpc')
        
        self.vpc = aws.ec2.Vpc(
            'vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.get_common_tags(),
                'Name': vpc_name
            },
            opts=self.provider_manager.get_resource_options()
        )
    
    def _create_subnets(self):
        """Create public and private subnets across availability zones."""
        self.public_subnets = []
        self.private_subnets = []
        
        azs = ['a', 'b']
        
        for i, az in enumerate(azs):
            public_subnet = aws.ec2.Subnet(
                f'public-subnet-{az}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=f'{self.config.primary_region}{az}',
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'public-subnet-{az}'),
                    'Type': 'Public'
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
            )
            self.public_subnets.append(public_subnet)
            
            private_subnet = aws.ec2.Subnet(
                f'private-subnet-{az}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i+10}.0/24',
                availability_zone=f'{self.config.primary_region}{az}',
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'private-subnet-{az}'),
                    'Type': 'Private'
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
            )
            self.private_subnets.append(private_subnet)
    
    def _create_internet_gateway(self):
        """Create Internet Gateway."""
        self.igw = aws.ec2.InternetGateway(
            'igw',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('igw')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
        )
    
    def _create_nat_gateways(self):
        """Create NAT Gateways for private subnets."""
        self.nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            eip = aws.ec2.Eip(
                f'nat-eip-{i}',
                domain='vpc',
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'nat-eip-{i}')
                },
                opts=self.provider_manager.get_resource_options()
            )
            
            nat = aws.ec2.NatGateway(
                f'nat-gateway-{i}',
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'nat-gateway-{i}')
                },
                opts=self.provider_manager.get_resource_options(depends_on=[eip, public_subnet])
            )
            self.nat_gateways.append(nat)
    
    def _create_route_tables(self):
        """Create route tables for public and private subnets."""
        public_rt = aws.ec2.RouteTable(
            'public-rt',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('public-rt')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
        )
        
        aws.ec2.Route(
            'public-route',
            route_table_id=public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=self.provider_manager.get_resource_options(depends_on=[public_rt, self.igw])
        )
        
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rta-{i}',
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=self.provider_manager.get_resource_options(depends_on=[public_rt, subnet])
            )
        
        self.private_route_tables = []
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f'private-rt-{i}',
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'private-rt-{i}')
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
            )
            
            aws.ec2.Route(
                f'private-route-{i}',
                route_table_id=private_rt.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat.id,
                opts=self.provider_manager.get_resource_options(depends_on=[private_rt, nat])
            )
            
            aws.ec2.RouteTableAssociation(
                f'private-rta-{i}',
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=self.provider_manager.get_resource_options(depends_on=[private_rt, subnet])
            )
            
            self.private_route_tables.append(private_rt)
    
    def _create_security_groups(self):
        """Create security groups for Lambda functions."""
        self.lambda_sg = aws.ec2.SecurityGroup(
            'lambda-sg',
            vpc_id=self.vpc.id,
            description='Security group for Lambda functions',
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('lambda-sg')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
        )
    
    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services."""
        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            'dynamodb-endpoint',
            vpc_id=self.vpc.id,
            service_name=f'com.amazonaws.{self.config.primary_region}.dynamodb',
            vpc_endpoint_type='Gateway',
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-endpoint')
            },
            opts=self.provider_manager.get_resource_options(depends_on=self.private_route_tables)
        )
        
        self.s3_endpoint = aws.ec2.VpcEndpoint(
            's3-endpoint',
            vpc_id=self.vpc.id,
            service_name=f'com.amazonaws.{self.config.primary_region}.s3',
            vpc_endpoint_type='Gateway',
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('s3-endpoint')
            },
            opts=self.provider_manager.get_resource_options(depends_on=self.private_route_tables)
        )
    
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_private_subnet_ids(self) -> List[Output[str]]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
    
    def get_lambda_security_group_id(self) -> Output[str]:
        """Get Lambda security group ID."""
        return self.lambda_sg.id
    
    def get_dynamodb_endpoint_id(self) -> Output[str]:
        """Get DynamoDB VPC endpoint ID."""
        return self.dynamodb_endpoint.id


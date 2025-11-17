"""
VPC module for network infrastructure.

This module creates VPC with DynamoDB VPC endpoint for private access
to DynamoDB without going through the internet.
"""

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class VPCStack:
    """
    Manages VPC and VPC endpoints.
    
    Creates VPC with DynamoDB VPC endpoint to enable private access
    and prevent public data access.
    """
    
    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the VPC stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc = None
        self.subnets = []
        self.route_table = None
        self.dynamodb_endpoint = None
        
        self._create_vpc()
        self._create_subnets()
        self._create_route_table()
        self._create_dynamodb_endpoint()
    
    def _create_vpc(self):
        """Create VPC."""
        vpc_name = self.config.get_resource_name('vpc', include_region=False)
        opts = self.provider_manager.get_resource_options()
        
        self.vpc = aws.ec2.Vpc(
            'main-vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.get_common_tags(),
                'Name': vpc_name
            },
            opts=opts
        )
    
    def _create_subnets(self):
        """Create subnets in the VPC."""
        opts = self.provider_manager.get_resource_options()
        
        subnet1 = aws.ec2.Subnet(
            'subnet-1',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone=f"{self.config.primary_region}a",
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('subnet-1', include_region=False)}"
            },
            opts=opts
        )
        
        subnet2 = aws.ec2.Subnet(
            'subnet-2',
            vpc_id=self.vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone=f"{self.config.primary_region}b",
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('subnet-2', include_region=False)}"
            },
            opts=opts
        )
        
        self.subnets = [subnet1, subnet2]
    
    def _create_route_table(self):
        """Create route table for the VPC."""
        opts = self.provider_manager.get_resource_options()
        
        self.route_table = aws.ec2.RouteTable(
            'main-route-table',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('route-table', include_region=False)}"
            },
            opts=opts
        )
        
        for i, subnet in enumerate(self.subnets):
            aws.ec2.RouteTableAssociation(
                f'route-table-association-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.route_table.id,
                opts=opts
            )
    
    def _create_dynamodb_endpoint(self):
        """Create VPC endpoint for DynamoDB."""
        opts = self.provider_manager.get_resource_options()
        
        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            'dynamodb-endpoint',
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{self.config.primary_region}.dynamodb",
            vpc_endpoint_type='Gateway',
            route_table_ids=[self.route_table.id],
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('dynamodb-endpoint', include_region=False)}"
            },
            opts=opts
        )
    
    def get_vpc_id(self) -> pulumi.Output[str]:
        """
        Get the VPC ID.
        
        Returns:
            VPC ID as Output
        """
        return self.vpc.id if self.vpc else None
    
    def get_subnet_ids(self) -> list:
        """
        Get the subnet IDs.
        
        Returns:
            List of subnet IDs as Outputs
        """
        return [subnet.id for subnet in self.subnets]
    
    def get_dynamodb_endpoint_id(self) -> pulumi.Output[str]:
        """
        Get the DynamoDB VPC endpoint ID.
        
        Returns:
            VPC endpoint ID as Output
        """
        return self.dynamodb_endpoint.id if self.dynamodb_endpoint else None


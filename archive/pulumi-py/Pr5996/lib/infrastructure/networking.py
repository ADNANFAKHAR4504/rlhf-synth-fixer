"""
Networking infrastructure module.

This module creates VPC, subnets, NAT gateways, Internet Gateway,
route tables, VPC Flow Logs, and all networking components.
"""

import json
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class NetworkingStack:
    """
    Networking stack that creates VPC and all networking components.
    
    Creates:
    - VPC with DNS support
    - Public and private subnets across multiple AZs
    - Internet Gateway
    - NAT Gateways (one per AZ for HA)
    - Route tables and associations
    - VPC Flow Logs with KMS encryption
    - Network ACLs
    """
    
    def __init__(self, config, provider_manager, parent=None):
        """
        Initialize the networking stack.
        
        Args:
            config: InfraConfig instance
            provider_manager: AWSProviderManager instance
            parent: Optional parent resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        
        # Get available AZs dynamically - fixes hardcoded AZ failure
        self.availability_zones = aws.get_availability_zones(
            state='available',
            opts=pulumi.InvokeOptions(provider=provider_manager.get_provider())
        )
        
        # Limit to 2 AZs for this deployment (can be parameterized)
        self.az_names = self.availability_zones.names[:2]
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create Internet Gateway
        self.igw = self._create_internet_gateway()
        
        # Create subnets
        self.public_subnets, self.private_subnets = self._create_subnets()
        
        # Create NAT Gateways (one per AZ for HA)
        self.nat_gateways = self._create_nat_gateways()
        
        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()
        
        # Create VPC Flow Logs with KMS encryption
        self.kms_key, self.flow_logs_log_group, self.flow_logs = self._create_flow_logs()
    
    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC with DNS support.
        
        Returns:
            VPC resource
        """
        vpc = aws.ec2.Vpc(
            'vpc',
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags=self.config.get_tags_for_resource(
                'VPC',
                Name=self.config.get_resource_name('vpc')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        return vpc
    
    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway attached to VPC.
        
        Returns:
            Internet Gateway resource
        """
        igw = aws.ec2.InternetGateway(
            'igw',
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource(
                'InternetGateway',
                Name=self.config.get_resource_name('igw')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.vpc],
                parent=self.parent
            )
        )
        
        return igw
    
    def _create_subnets(self):
        """
        Create public and private subnets across multiple AZs.
        
        Fixes:
        - Dynamic AZ usage
        - Proper CIDR allocation
        - Explicit Tier tagging
        
        Returns:
            Tuple of (public_subnets, private_subnets)
        """
        public_subnets = []
        private_subnets = []
        
        az_count = len(self.az_names)
        public_cidrs = self.config.get_subnet_cidrs_for_azs(az_count, 'public')
        private_cidrs = self.config.get_subnet_cidrs_for_azs(az_count, 'private')
        
        for i, az in enumerate(self.az_names):
            # Create public subnet
            public_subnet = aws.ec2.Subnet(
                f'public-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=public_cidrs[i],
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=self.config.get_resource_name('public-subnet', str(i)),
                    Tier='Public',
                    Type='Public'
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.vpc],
                    parent=self.parent
                )
            )
            public_subnets.append(public_subnet)
            
            # Create private subnet
            private_subnet = aws.ec2.Subnet(
                f'private-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=private_cidrs[i],
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=self.config.get_resource_name('private-subnet', str(i)),
                    Tier='Private',
                    Type='Private'
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.vpc],
                    parent=self.parent
                )
            )
            private_subnets.append(private_subnet)
        
        return public_subnets, private_subnets
    
    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways (one per AZ for high availability).
        
        Fixes the single NAT Gateway failure by creating one per AZ.
        
        Returns:
            List of NAT Gateway resources
        """
        nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f'nat-eip-{i}',
                domain='vpc',
                tags=self.config.get_tags_for_resource(
                    'EIP',
                    Name=self.config.get_resource_name('nat-eip', str(i))
                ),
                opts=self.provider_manager.get_resource_options(parent=self.parent)
            )
            
            # Create NAT Gateway
            nat_gateway = aws.ec2.NatGateway(
                f'nat-gateway-{i}',
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=self.config.get_tags_for_resource(
                    'NATGateway',
                    Name=self.config.get_resource_name('nat-gateway', str(i))
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[eip, public_subnet, self.igw],
                    parent=self.parent
                )
            )
            
            nat_gateways.append(nat_gateway)
        
        return nat_gateways
    
    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create public route table with route to Internet Gateway.
        
        Returns:
            Route table resource
        """
        route_table = aws.ec2.RouteTable(
            'public-route-table',
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource(
                'RouteTable',
                Name=self.config.get_resource_name('public-rt'),
                Type='Public'
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.vpc],
                parent=self.parent
            )
        )
        
        # Create route to Internet Gateway
        route = aws.ec2.Route(
            'public-internet-route',
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=self.provider_manager.get_resource_options(
                depends_on=[route_table, self.igw],
                parent=self.parent
            )
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-subnet-{i}-association',
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[route_table, subnet],
                    parent=self.parent
                )
            )
        
        return route_table
    
    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create private route tables (one per AZ) with routes to NAT Gateways.
        
        Each private subnet gets its own route table pointing to its AZ's NAT Gateway
        for high availability.
        
        Returns:
            List of route table resources
        """
        route_tables = []
        
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            # Create private route table
            route_table = aws.ec2.RouteTable(
                f'private-route-table-{i}',
                vpc_id=self.vpc.id,
                tags=self.config.get_tags_for_resource(
                    'RouteTable',
                    Name=self.config.get_resource_name('private-rt', str(i)),
                    Type='Private'
                ),
                opts=self.provider_manager.get_resource_options(
                    depends_on=[self.vpc],
                    parent=self.parent
                )
            )
            
            # Create route to NAT Gateway
            route = aws.ec2.Route(
                f'private-nat-route-{i}',
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[route_table, nat_gateway],
                    parent=self.parent
                )
            )
            
            # Associate private subnet with its route table
            aws.ec2.RouteTableAssociation(
                f'private-subnet-{i}-association',
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=self.provider_manager.get_resource_options(
                    depends_on=[route_table, private_subnet],
                    parent=self.parent
                )
            )
            
            route_tables.append(route_table)
        
        return route_tables
    
    def _create_flow_logs(self):
        """
        Create VPC Flow Logs with KMS encryption and proper IAM role.
        
        Fixes:
        - Adds KMS encryption for logs
        - Creates scoped IAM trust policy
        - Sets log retention policy
        
        Returns:
            Tuple of (kms_key, log_group, flow_log)
        """
        # Create KMS key for CloudWatch Logs encryption
        kms_key = aws.kms.Key(
            'flow-logs-kms-key',
            description=f'KMS key for VPC Flow Logs encryption - {self.config.environment_suffix}',
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=self.config.get_tags_for_resource(
                'KMSKey',
                Name=self.config.get_resource_name('flow-logs-kms')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        # Create KMS key alias
        kms_alias = aws.kms.Alias(
            'flow-logs-kms-alias',
            name=f'alias/{self.config.get_resource_name("flow-logs")}',
            target_key_id=kms_key.id,
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key],
                parent=self.parent
            )
        )
        
        # Create KMS key policy to allow CloudWatch Logs to use the key
        kms_key_policy = aws.kms.KeyPolicy(
            'flow-logs-kms-key-policy',
            key_id=kms_key.id,
            policy=Output.all(kms_key.arn).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'Enable IAM User Permissions',
                        'Effect': 'Allow',
                        'Principal': {
                            'AWS': f'arn:aws:iam::{aws.get_caller_identity().account_id}:root'
                        },
                        'Action': 'kms:*',
                        'Resource': '*'
                    },
                    {
                        'Sid': 'Allow CloudWatch Logs',
                        'Effect': 'Allow',
                        'Principal': {
                            'Service': f'logs.{self.config.primary_region}.amazonaws.com'
                        },
                        'Action': [
                            'kms:Encrypt',
                            'kms:Decrypt',
                            'kms:ReEncrypt*',
                            'kms:GenerateDataKey*',
                            'kms:CreateGrant',
                            'kms:DescribeKey'
                        ],
                        'Resource': '*',
                        'Condition': {
                            'ArnLike': {
                                'kms:EncryptionContext:aws:logs:arn': f'arn:aws:logs:{self.config.primary_region}:{aws.get_caller_identity().account_id}:log-group:*'
                            }
                        }
                    }
                ]
            })),
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key],
                parent=self.parent
            )
        )
        
        # Create CloudWatch Log Group with KMS encryption
        log_group = aws.cloudwatch.LogGroup(
            'vpc-flow-logs-group',
            name=f'/aws/vpc/flow-logs/{self.config.get_resource_name("vpc")}',
            retention_in_days=self.config.log_retention_days,
            kms_key_id=kms_key.arn,
            tags=self.config.get_tags_for_resource(
                'LogGroup',
                Name=self.config.get_resource_name('flow-logs-group')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[kms_key, kms_key_policy],
                parent=self.parent
            )
        )
        
        # Create IAM role for VPC Flow Logs with scoped trust policy
        flow_logs_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'vpc-flow-logs.amazonaws.com'
                },
                'Action': 'sts:AssumeRole',
                'Condition': {
                    'StringEquals': {
                        'aws:SourceAccount': aws.get_caller_identity().account_id
                    }
                }
            }]
        }
        
        flow_logs_role = aws.iam.Role(
            'vpc-flow-logs-role',
            assume_role_policy=json.dumps(flow_logs_role_policy),
            tags=self.config.get_tags_for_resource(
                'IAMRole',
                Name=self.config.get_resource_name('flow-logs-role')
            ),
            opts=self.provider_manager.get_resource_options(parent=self.parent)
        )
        
        # Create IAM policy for VPC Flow Logs with scoped permissions
        flow_logs_policy = aws.iam.RolePolicy(
            'vpc-flow-logs-policy',
            role=flow_logs_role.id,
            policy=Output.all(log_group.arn).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogGroups',
                        'logs:DescribeLogStreams'
                    ],
                    'Resource': f'{args[0]}:*'
                }]
            })),
            opts=self.provider_manager.get_resource_options(
                depends_on=[flow_logs_role, log_group],
                parent=self.parent
            )
        )
        
        # Enable VPC Flow Logs
        flow_log = aws.ec2.FlowLog(
            'vpc-flow-log',
            iam_role_arn=flow_logs_role.arn,
            log_destination=log_group.arn,
            traffic_type='ALL',
            vpc_id=self.vpc.id,
            log_destination_type='cloud-watch-logs',
            tags=self.config.get_tags_for_resource(
                'FlowLog',
                Name=self.config.get_resource_name('vpc-flow-log')
            ),
            opts=self.provider_manager.get_resource_options(
                depends_on=[self.vpc, log_group, flow_logs_role, flow_logs_policy],
                parent=self.parent
            )
        )
        
        return kms_key, log_group, flow_log
    
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_public_subnet_ids(self) -> List[Output[str]]:
        """Get list of public subnet IDs."""
        return [subnet.id for subnet in self.public_subnets]
    
    def get_private_subnet_ids(self) -> List[Output[str]]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]
    
    def get_nat_gateway_ids(self) -> List[Output[str]]:
        """Get list of NAT Gateway IDs."""
        return [nat.id for nat in self.nat_gateways]


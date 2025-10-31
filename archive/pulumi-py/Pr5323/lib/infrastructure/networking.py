"""
Networking infrastructure module.

This module creates VPC, subnets, internet gateway, NAT gateways,
route tables, network ACLs, and VPC Flow Logs for a highly-available multi-AZ setup.
"""
from typing import List

import pulumi
import pulumi_aws as aws
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class NetworkingStack:
    """
    Creates and manages networking infrastructure including VPC, subnets,
    gateways, and routing for high availability across multiple AZs.
    """
    
    def __init__(
        self,
        config: InfraConfig,
        provider_manager: AWSProviderManager,
        parent: pulumi.ComponentResource
    ):
        """
        Initialize the networking stack.
        
        Args:
            config: Infrastructure configuration
            provider_manager: AWS provider manager
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.provider_manager = provider_manager
        self.parent = parent
        
        # Dynamically fetch available AZs for the configured region
        self.available_azs = self._get_available_azs()
        
        # Update config with actual AZs
        self.config.set_availability_zones(self.available_azs)
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create VPC Flow Logs
        self.flow_log_group = self._create_flow_log_group()
        self.flow_log_role = self._create_flow_log_role()
        self.flow_log = self._create_flow_log()
        
        # Create Internet Gateway
        self.internet_gateway = self._create_internet_gateway()
        
        # Create subnets
        self.public_subnets = self._create_public_subnets()
        self.private_subnets = self._create_private_subnets()
        
        # Create NAT Gateways (one per AZ for HA)
        self.nat_gateways = self._create_nat_gateways()
        
        # Create route tables
        self.public_route_table = self._create_public_route_table()
        self.private_route_tables = self._create_private_route_tables()
        
        # Create Network ACLs
        self.public_nacl = self._create_public_nacl()
        self.private_nacl = self._create_private_nacl()
    
    def _get_available_azs(self) -> List[str]:
        """
        Dynamically fetch available AZs for the configured region.
        
        This ensures that subnets are only created in AZs that actually exist
        in the target region, making the code truly region-agnostic.
        
        Returns:
            List of available AZ names (e.g., ['us-east-1a', 'us-east-1b'])
        """
        # Use Pulumi AWS SDK with explicit region
        azs_data = aws.get_availability_zones(
            state='available',
            opts=pulumi.InvokeOptions(provider=self.provider_manager.get_provider())
        )
        
        available_az_names = azs_data.names
        
        # Ensure we have at least 2 AZs for HA
        if len(available_az_names) < 2:
            raise ValueError(
                f"Region {self.config.primary_region} has fewer than 2 AZs. "
                "Cannot create HA infrastructure."
            )
        
        # Use up to 2 AZs for optimal cost/redundancy balance
        return available_az_names[:min(2, len(available_az_names))]
    
    def _create_vpc(self) -> aws.ec2.Vpc:
        """
        Create VPC with DNS support enabled.
        
        Returns:
            VPC resource
        """
        vpc_name = self.config.get_resource_name('vpc')
        
        vpc = aws.ec2.Vpc(
            vpc_name,
            cidr_block=self.config.vpc_cidr,
            enable_dns_hostnames=self.config.enable_dns_hostnames,
            enable_dns_support=self.config.enable_dns_support,
            tags={
                **self.config.get_tags_for_resource('VPC'),
                'Name': vpc_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.parent
            )
        )
        
        return vpc
    
    def _create_flow_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for VPC Flow Logs.
        
        Returns:
            CloudWatch Log Group
        """
        log_group_name = self.config.get_resource_name('vpc-flow-logs')
        
        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=f"/aws/vpc/{log_group_name}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_tags_for_resource('CloudWatch-LogGroup'),
                'Name': log_group_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )
        
        return log_group
    
    def _create_flow_log_role(self) -> aws.iam.Role:
        """
        Create IAM role for VPC Flow Logs.
        
        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('vpc-flow-logs-role')
        
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "vpc-flow-logs.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }
        
        role = aws.iam.Role(
            role_name,
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags={
                **self.config.get_tags_for_resource('IAM-Role'),
                'Name': role_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )
        
        # Attach policy to allow writing to CloudWatch Logs
        policy_name = self.config.get_resource_name('vpc-flow-logs-policy')
        
        # Use Output.all to properly handle the log group ARN
        policy_document = Output.all(self.flow_log_group.arn).apply(
            lambda args: pulumi.Output.json_dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": args[0]
                }]
            })
        )
        
        policy = aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        
        return role
    
    def _create_flow_log(self) -> aws.ec2.FlowLog:
        """
        Create VPC Flow Log.
        
        Returns:
            VPC Flow Log
        """
        flow_log_name = self.config.get_resource_name('vpc-flow-log')
        
        flow_log = aws.ec2.FlowLog(
            flow_log_name,
            vpc_id=self.vpc.id,
            traffic_type='ALL',
            log_destination_type='cloud-watch-logs',
            log_destination=self.flow_log_group.arn,
            iam_role_arn=self.flow_log_role.arn,
            tags={
                **self.config.get_tags_for_resource('VPC-FlowLog'),
                'Name': flow_log_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc,
                depends_on=[self.flow_log_group, self.flow_log_role]
            )
        )
        
        return flow_log
    
    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway for public subnet access.
        
        Returns:
            Internet Gateway
        """
        igw_name = self.config.get_resource_name('igw')
        
        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('InternetGateway'),
                'Name': igw_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )
        
        return igw
    
    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets in each availability zone.
        
        Returns:
            List of public subnets
        """
        public_subnets = []
        subnet_cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'public')
        
        for i, (az, cidr) in enumerate(zip(self.available_azs, subnet_cidrs)):
            subnet_name = self.config.get_resource_name('public-subnet', str(i + 1))
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_tags_for_resource('Subnet'),
                    'Name': subnet_name,
                    'Type': 'Public',
                    'AZ': az
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=self.vpc
                )
            )
            
            public_subnets.append(subnet)
        
        return public_subnets
    
    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create private subnets in each availability zone.
        
        Returns:
            List of private subnets
        """
        private_subnets = []
        subnet_cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'private')
        
        for i, (az, cidr) in enumerate(zip(self.available_azs, subnet_cidrs)):
            subnet_name = self.config.get_resource_name('private-subnet', str(i + 1))
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    **self.config.get_tags_for_resource('Subnet'),
                    'Name': subnet_name,
                    'Type': 'Private',
                    'AZ': az
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=self.vpc
                )
            )
            
            private_subnets.append(subnet)
        
        return private_subnets
    
    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways (one per AZ for high availability).
        
        Returns:
            List of NAT Gateways
        """
        nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip_name = self.config.get_resource_name('nat-eip', str(i + 1))
            
            eip = aws.ec2.Eip(
                eip_name,
                domain='vpc',
                tags={
                    **self.config.get_tags_for_resource('EIP'),
                    'Name': eip_name
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=public_subnet
                )
            )
            
            # Create NAT Gateway
            nat_name = self.config.get_resource_name('nat-gateway', str(i + 1))
            
            nat = aws.ec2.NatGateway(
                nat_name,
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.config.get_tags_for_resource('NATGateway'),
                    'Name': nat_name
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=public_subnet,
                    depends_on=[eip]
                )
            )
            
            nat_gateways.append(nat)
        
        return nat_gateways
    
    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create route table for public subnets.
        
        Returns:
            Public route table
        """
        rt_name = self.config.get_resource_name('public-rt')
        
        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('RouteTable'),
                'Name': rt_name,
                'Type': 'Public'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )
        
        # Create route to Internet Gateway
        route_name = self.config.get_resource_name('public-route-igw')
        
        aws.ec2.Route(
            route_name,
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=route_table,
                depends_on=[self.internet_gateway]
            )
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            assoc_name = self.config.get_resource_name('public-rt-assoc', str(i + 1))
            
            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=route_table
                )
            )
        
        return route_table
    
    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create route tables for private subnets (one per AZ for NAT Gateway).
        
        Returns:
            List of private route tables
        """
        private_route_tables = []
        
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt_name = self.config.get_resource_name('private-rt', str(i + 1))
            
            route_table = aws.ec2.RouteTable(
                rt_name,
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_tags_for_resource('RouteTable'),
                    'Name': rt_name,
                    'Type': 'Private'
                },
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=self.vpc
                )
            )
            
            # Create route to NAT Gateway
            route_name = self.config.get_resource_name('private-route-nat', str(i + 1))
            
            aws.ec2.Route(
                route_name,
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=route_table,
                    depends_on=[nat_gateway]
                )
            )
            
            # Associate private subnet with private route table
            assoc_name = self.config.get_resource_name('private-rt-assoc', str(i + 1))
            
            aws.ec2.RouteTableAssociation(
                assoc_name,
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    parent=route_table
                )
            )
            
            private_route_tables.append(route_table)
        
        return private_route_tables
    
    def _create_public_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for public subnets.
        
        Returns:
            Public Network ACL
        """
        nacl_name = self.config.get_resource_name('public-nacl')
        
        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('NetworkACL'),
                'Name': nacl_name,
                'Type': 'Public'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )
        
        # Ingress rule: Allow all inbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=False,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )
        
        # Egress rule: Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )
        
        return nacl
    
    def _create_private_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for private subnets.
        
        Returns:
            Private Network ACL
        """
        nacl_name = self.config.get_resource_name('private-nacl')
        
        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_tags_for_resource('NetworkACL'),
                'Name': nacl_name,
                'Type': 'Private'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.vpc
            )
        )
        
        # Ingress rule: Allow all inbound traffic from VPC
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block=self.config.vpc_cidr,
            egress=False,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )
        
        # Egress rule: Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=nacl
            )
        )
        
        return nacl
    
    # Getter methods for outputs
    
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_vpc_cidr(self) -> str:
        """Get VPC CIDR block."""
        return self.config.vpc_cidr
    
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
    
    def get_flow_log_group_name(self) -> Output[str]:
        """Get VPC Flow Log CloudWatch Log Group name."""
        return self.flow_log_group.name

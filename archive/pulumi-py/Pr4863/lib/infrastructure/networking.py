"""
Networking infrastructure module.

This module creates VPC, subnets, internet gateway, NAT gateways,
route tables, and network ACLs for a highly-available multi-AZ setup.
"""
from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import InfraConfig


class NetworkingStack:
    """
    Creates and manages networking infrastructure including VPC, subnets,
    gateways, and routing for high availability across multiple AZs.
    """
    
    def __init__(self, config: InfraConfig, parent: pulumi.ComponentResource):
        """
        Initialize the networking stack.
        
        Args:
            config: Infrastructure configuration
            parent: Parent Pulumi component resource
        """
        self.config = config
        self.parent = parent
        
        # Dynamically fetch available AZs for the configured region
        self.available_azs = self._get_available_azs()
        
        # Update config with actual AZs
        self.config.set_availability_zones(self.available_azs)
        
        # Create VPC
        self.vpc = self._create_vpc()
        
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
        
        # Create VPC Flow Logs
        self.flow_log_group = self._create_flow_log_group()
        self.flow_log_role = self._create_flow_log_role()
        self.flow_log = self._create_flow_log()
    
    def _get_available_azs(self) -> List[str]:
        """
        Dynamically fetch available AZs for the configured region.
        
        This ensures that subnets are only created in AZs that actually exist
        in the target region, making the code truly region-agnostic.
        
        Returns:
            List of available AZ names (e.g., ['us-west-1a', 'us-west-1b'])
        """
        # Query AWS for available AZs in the current region
        # Note: The region is automatically inherited from the AWS provider configuration
        azs_data = aws.get_availability_zones(state='available')
        
        # Return the AZ names (e.g., ['us-west-1a', 'us-west-1b'])
        # Use at least 2 AZs for HA, and up to 3 for optimal redundancy
        available_az_names = azs_data.names
        
        # Ensure we have at least 2 AZs for HA
        if len(available_az_names) < 2:
            raise Exception(f"Region {self.config.primary_region} has fewer than 2 AZs. Cannot create HA infrastructure.")
        
        # Use up to 3 AZs for optimal cost/redundancy balance
        return available_az_names[:min(3, len(available_az_names))]
    
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
            tags=self.config.get_tags_for_resource('VPC', Name=vpc_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return vpc
    
    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """
        Create Internet Gateway for public subnet internet access.
        
        Returns:
            Internet Gateway resource
        """
        igw_name = self.config.get_resource_name('igw')
        
        igw = aws.ec2.InternetGateway(
            igw_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('InternetGateway', Name=igw_name),
            opts=ResourceOptions(parent=self.vpc)
        )
        
        return igw
    
    def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create public subnets across multiple AZs.
        Dynamically uses the AZs available in the configured region.
        
        Returns:
            List of public subnet resources
        """
        subnets = []
        
        # Get CIDRs based on actual AZ count
        cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'public')
        
        for i, (az_name, cidr) in enumerate(zip(self.available_azs, cidrs)):
            # Extract AZ suffix (last character, e.g., 'a' from 'us-west-1a')
            az_suffix = az_name[-1]
            subnet_name = self.config.get_resource_name('subnet-public', az_suffix)
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,  # Use full AZ name from AWS
                map_public_ip_on_launch=True,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=subnet_name,
                    Type='Public',
                    AZ=az_name
                ),
                opts=ResourceOptions(parent=self.vpc)
            )
            
            subnets.append(subnet)
        
        return subnets
    
    def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
        """
        Create private subnets across multiple AZs.
        Dynamically uses the AZs available in the configured region.
        
        Returns:
            List of private subnet resources
        """
        subnets = []
        
        # Get CIDRs based on actual AZ count
        cidrs = self.config.get_subnet_cidrs_for_azs(len(self.available_azs), 'private')
        
        for i, (az_name, cidr) in enumerate(zip(self.available_azs, cidrs)):
            # Extract AZ suffix (last character, e.g., 'a' from 'us-west-1a')
            az_suffix = az_name[-1]
            subnet_name = self.config.get_resource_name('subnet-private', az_suffix)
            
            subnet = aws.ec2.Subnet(
                subnet_name,
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=az_name,  # Use full AZ name from AWS
                map_public_ip_on_launch=False,
                tags=self.config.get_tags_for_resource(
                    'Subnet',
                    Name=subnet_name,
                    Type='Private',
                    AZ=az_name
                ),
                opts=ResourceOptions(parent=self.vpc)
            )
            
            subnets.append(subnet)
        
        return subnets
    
    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """
        Create NAT Gateways (one per AZ for high availability).
        Dynamically creates one NAT gateway per available AZ.
        
        Returns:
            List of NAT Gateway resources
        """
        nat_gateways = []
        
        for i, (public_subnet, az_name) in enumerate(zip(
            self.public_subnets,
            self.available_azs
        )):
            # Extract AZ suffix for naming
            az_suffix = az_name[-1]
            
            # Create Elastic IP for NAT Gateway
            eip_name = self.config.get_resource_name('eip-nat', az_suffix)
            eip = aws.ec2.Eip(
                eip_name,
                domain='vpc',
                tags=self.config.get_tags_for_resource('EIP', Name=eip_name),
                opts=ResourceOptions(parent=public_subnet)
            )
            
            # Create NAT Gateway
            nat_name = self.config.get_resource_name('nat', az_suffix)
            nat_gateway = aws.ec2.NatGateway(
                nat_name,
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags=self.config.get_tags_for_resource('NatGateway', Name=nat_name),
                opts=ResourceOptions(parent=public_subnet, depends_on=[eip])
            )
            
            nat_gateways.append(nat_gateway)
        
        return nat_gateways
    
    def _create_public_route_table(self) -> aws.ec2.RouteTable:
        """
        Create route table for public subnets with route to Internet Gateway.
        
        Returns:
            Route table resource
        """
        rt_name = self.config.get_resource_name('rt-public')
        
        route_table = aws.ec2.RouteTable(
            rt_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('RouteTable', Name=rt_name, Type='Public'),
            opts=ResourceOptions(parent=self.vpc)
        )
        
        # Add route to Internet Gateway
        aws.ec2.Route(
            f"{rt_name}-igw-route",
            route_table_id=route_table.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.internet_gateway.id,
            opts=ResourceOptions(parent=route_table)
        )
        
        # Associate with public subnets
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{rt_name}-association-{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )
        
        return route_table
    
    def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
        """
        Create route tables for private subnets with routes to NAT Gateways.
        Each private subnet gets its own route table pointing to its AZ's NAT Gateway.
        Dynamically adapts to the number of available AZs.
        
        Returns:
            List of route table resources
        """
        route_tables = []
        
        for i, (subnet, nat_gateway, az_name) in enumerate(zip(
            self.private_subnets,
            self.nat_gateways,
            self.available_azs
        )):
            # Extract AZ suffix for naming
            az_suffix = az_name[-1]
            rt_name = self.config.get_resource_name('rt-private', az_suffix)
            
            route_table = aws.ec2.RouteTable(
                rt_name,
                vpc_id=self.vpc.id,
                tags=self.config.get_tags_for_resource(
                    'RouteTable',
                    Name=rt_name,
                    Type='Private',
                    AZ=az_name
                ),
                opts=ResourceOptions(parent=self.vpc)
            )
            
            # Add route to NAT Gateway
            aws.ec2.Route(
                f"{rt_name}-nat-route",
                route_table_id=route_table.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=route_table)
            )
            
            # Associate with private subnet
            aws.ec2.RouteTableAssociation(
                f"{rt_name}-association",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )
            
            route_tables.append(route_table)
        
        return route_tables
    
    def _create_public_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for public subnets.
        
        Returns:
            Network ACL resource
        """
        nacl_name = self.config.get_resource_name('nacl-public')
        
        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('NetworkAcl', Name=nacl_name, Type='Public'),
            opts=ResourceOptions(parent=self.vpc)
        )
        
        # Inbound rules
        # Allow HTTP
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-http",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=80,
            to_port=80,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Allow HTTPS
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-https",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=443,
            to_port=443,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Allow ephemeral ports for return traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-ephemeral",
            network_acl_id=nacl.id,
            rule_number=120,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=1024,
            to_port=65535,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Outbound rules
        # Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress-all",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Associate with public subnets
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.NetworkAclAssociation(
                f"{nacl_name}-association-{i}",
                network_acl_id=nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=nacl)
            )
        
        return nacl
    
    def _create_private_nacl(self) -> aws.ec2.NetworkAcl:
        """
        Create Network ACL for private subnets.
        
        Returns:
            Network ACL resource
        """
        nacl_name = self.config.get_resource_name('nacl-private')
        
        nacl = aws.ec2.NetworkAcl(
            nacl_name,
            vpc_id=self.vpc.id,
            tags=self.config.get_tags_for_resource('NetworkAcl', Name=nacl_name, Type='Private'),
            opts=ResourceOptions(parent=self.vpc)
        )
        
        # Inbound rules
        # Allow traffic from VPC CIDR
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-vpc",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block=self.config.vpc_cidr,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Allow ephemeral ports for return traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-ingress-ephemeral",
            network_acl_id=nacl.id,
            rule_number=110,
            protocol='tcp',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            from_port=1024,
            to_port=65535,
            egress=False,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Outbound rules
        # Allow all outbound traffic
        aws.ec2.NetworkAclRule(
            f"{nacl_name}-egress-all",
            network_acl_id=nacl.id,
            rule_number=100,
            protocol='-1',
            rule_action='allow',
            cidr_block='0.0.0.0/0',
            egress=True,
            opts=ResourceOptions(parent=nacl)
        )
        
        # Associate with private subnets
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.NetworkAclAssociation(
                f"{nacl_name}-association-{i}",
                network_acl_id=nacl.id,
                subnet_id=subnet.id,
                opts=ResourceOptions(parent=nacl)
            )
        
        return nacl
    
    def _create_flow_log_group(self) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for VPC Flow Logs.
        
        Returns:
            Log Group resource
        """
        log_group_name = self.config.get_resource_name('log-group-vpc-flow')
        
        log_group = aws.cloudwatch.LogGroup(
            log_group_name,
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags_for_resource('LogGroup', Name=log_group_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        return log_group
    
    def _create_flow_log_role(self) -> aws.iam.Role:
        """
        Create IAM role for VPC Flow Logs.
        
        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('role-vpc-flow-logs')
        
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
            tags=self.config.get_tags_for_resource('IAMRole', Name=role_name),
            opts=ResourceOptions(parent=self.parent)
        )
        
        # Attach policy for CloudWatch Logs
        policy_name = self.config.get_resource_name('policy-vpc-flow-logs')
        
        policy_document = self.flow_log_group.arn.apply(lambda arn: {
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
                "Resource": arn
            }]
        })
        
        aws.iam.RolePolicy(
            policy_name,
            name=policy_name,
            role=role.id,
            policy=policy_document.apply(lambda doc: pulumi.Output.json_dumps(doc)),
            opts=ResourceOptions(parent=role)
        )
        
        return role
    
    def _create_flow_log(self) -> aws.ec2.FlowLog:
        """
        Create VPC Flow Log.
        
        Returns:
            Flow Log resource
        """
        if not self.config.enable_flow_logs:
            return None
        
        flow_log_name = self.config.get_resource_name('flow-log-vpc')
        
        flow_log = aws.ec2.FlowLog(
            flow_log_name,
            vpc_id=self.vpc.id,
            traffic_type='ALL',
            iam_role_arn=self.flow_log_role.arn,
            log_destination_type='cloud-watch-logs',
            log_destination=self.flow_log_group.arn,
            tags=self.config.get_tags_for_resource('FlowLog', Name=flow_log_name),
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.flow_log_role])
        )
        
        return flow_log
    
    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id
    
    def get_public_subnet_ids(self) -> Output[List[str]]:
        """Get list of public subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.public_subnets])
    
    def get_private_subnet_ids(self) -> Output[List[str]]:
        """Get list of private subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.private_subnets])


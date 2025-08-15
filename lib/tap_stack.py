"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Example usage of suffix and tags
        # You would replace this with instantiation of imported components like DynamoDBStack
        
        # s3.Bucket(f"tap-bucket-{self.environment_suffix}",
        #           tags=self.tags,
        #           opts=ResourceOptions(parent=self))

        # self.table = dynamodb_stack.table if you instantiate one

        # Register outputs if needed
        self.register_outputs({})
        """
AWS Multi-Region VPC Infrastructure with Pulumi

This script provisions secure VPC architecture across multiple AWS regions with:
- VPCs with public/private subnets across multiple AZs
- Internet and NAT Gateways for proper routing
- Restrictive security groups
- Comprehensive tagging strategy
- Cost-conscious defaults

Usage: pulumi up
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any

# Configuration setup
config = pulumi.Config()

# Get target regions from config, default to us-east-1 and us-west-2
regions = config.get_object("regions") or ["us-east-1", "us-west-2"]

# Base tags from configuration with sensible defaults
base_tags = config.get_object("base_tags") or {
    "Environment": "development",
    "Team": "platform",
    "Project": "multi-region-vpc"
}

# High availability NAT Gateway option (default: false for cost optimization)
enable_ha_nat = config.get_bool("enable_ha_nat") or False

# CIDR blocks for each region (non-overlapping)
region_cidrs = {
    "us-east-1": "10.0.0.0/16",
    "us-west-2": "10.1.0.0/16",
    "us-east-2": "10.2.0.0/16",
    "us-west-1": "10.3.0.0/16",
    "eu-west-1": "10.4.0.0/16",
    "eu-central-1": "10.5.0.0/16",
    "ap-southeast-1": "10.6.0.0/16",
    "ap-northeast-1": "10.7.0.0/16"
}

def get_availability_zones(provider: aws.Provider) -> List[str]:
    """Get available AZs for the provider's region"""
    azs = aws.get_availability_zones(
        state="available",
        opts=pulumi.InvokeOptions(provider=provider)
    )
    return azs.names[:4]  # Limit to first 4 AZs

def calculate_subnet_cidrs(vpc_cidr: str, num_subnets: int) -> List[str]:
    """Calculate subnet CIDR blocks from VPC CIDR"""
    import ipaddress
    
    vpc_network = ipaddress.IPv4Network(vpc_cidr)
    # Use /24 subnets (256 IPs each)
    subnet_size = 24
    subnets = list(vpc_network.subnets(new_prefix=subnet_size))
    
    return [str(subnet) for subnet in subnets[:num_subnets]]

def create_vpc_infrastructure(region: str) -> Dict[str, Any]:
    """Create complete VPC infrastructure for a region"""
    
    # Create AWS provider for this region
    provider = aws.Provider(
        f"aws-{region}",
        region=region,
        default_tags=aws.ProviderDefaultTagsArgs(
            tags=base_tags
        )
    )
    
    # Get VPC CIDR for this region
    vpc_cidr = region_cidrs.get(region, f"10.{hash(region) % 200 + 10}.0.0/16")
    
    # Create VPC
    vpc = aws.ec2.Vpc(
        f"vpc-{region}",
        cidr_block=vpc_cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            "Name": f"vpc-{region}",
            "Region": region
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Get availability zones
    azs = get_availability_zones(provider)
    
    # Calculate subnet CIDRs (2 public + 2 private per AZ, minimum 2 AZs)
    num_azs = max(2, min(len(azs), 2))  # Use exactly 2 AZs for cost optimization
    total_subnets = num_azs * 4  # 2 public + 2 private per AZ
    subnet_cidrs = calculate_subnet_cidrs(vpc_cidr, total_subnets)
    
    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"igw-{region}",
        vpc_id=vpc.id,
        tags={
            "Name": f"igw-{region}",
            "Region": region
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Create public and private subnets
    public_subnets = []
    private_subnets = []
    
    # Create 2 public and 2 private subnets per AZ
    for i in range(num_azs):
        az = azs[i]
        
        # Public subnets (2 per AZ)
        for j in range(2):
            subnet_idx = i * 4 + j
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{region}-{i+1}-{j+1}",
                vpc_id=vpc.id,
                cidr_block=subnet_cidrs[subnet_idx],
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{region}-{i+1}-{j+1}",
                    "Type": "public",
                    "Region": region,
                    "AZ": az
                },
                opts=pulumi.ResourceOptions(provider=provider)
            )
            public_subnets.append(public_subnet)
        
        # Private subnets (2 per AZ)
        for j in range(2):
            subnet_idx = i * 4 + j + 2
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{region}-{i+1}-{j+1}",
                vpc_id=vpc.id,
                cidr_block=subnet_cidrs[subnet_idx],
                availability_zone=az,
                map_public_ip_on_launch=False,  # Ensure no public IPs
                tags={
                    "Name": f"private-subnet-{region}-{i+1}-{j+1}",
                    "Type": "private",
                    "Region": region,
                    "AZ": az
                },
                opts=pulumi.ResourceOptions(provider=provider)
            )
            private_subnets.append(private_subnet)
    
    # Create Elastic IPs for NAT Gateways
    nat_eips = []
    if enable_ha_nat:
        # One NAT Gateway per AZ for high availability
        for i in range(num_azs):
            eip = aws.ec2.Eip(
                f"nat-eip-{region}-{i+1}",
                domain="vpc",
                tags={
                    "Name": f"nat-eip-{region}-{i+1}",
                    "Region": region
                },
                opts=pulumi.ResourceOptions(
                    provider=provider,
                    depends_on=[igw]
                )
            )
            nat_eips.append(eip)
    else:
        # Single NAT Gateway for cost optimization
        eip = aws.ec2.Eip(
            f"nat-eip-{region}",
            domain="vpc",
            tags={
                "Name": f"nat-eip-{region}",
                "Region": region
            },
            opts=pulumi.ResourceOptions(
                provider=provider,
                depends_on=[igw]
            )
        )
        nat_eips.append(eip)
    
    # Create NAT Gateways
    nat_gateways = []
    if enable_ha_nat:
        # One NAT Gateway per AZ
        for i in range(num_azs):
            nat_gw = aws.ec2.NatGateway(
                f"nat-gw-{region}-{i+1}",
                allocation_id=nat_eips[i].id,
                subnet_id=public_subnets[i * 2].id,  # Use first public subnet of each AZ
                tags={
                    "Name": f"nat-gw-{region}-{i+1}",
                    "Region": region
                },
                opts=pulumi.ResourceOptions(provider=provider)
            )
            nat_gateways.append(nat_gw)
    else:
        # Single NAT Gateway in first AZ
        nat_gw = aws.ec2.NatGateway(
            f"nat-gw-{region}",
            allocation_id=nat_eips[0].id,
            subnet_id=public_subnets[0].id,
            tags={
                "Name": f"nat-gw-{region}",
                "Region": region
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )
        nat_gateways.append(nat_gw)
    
    # Create route tables
    
    # Public route table
    public_rt = aws.ec2.RouteTable(
        f"public-rt-{region}",
        vpc_id=vpc.id,
        tags={
            "Name": f"public-rt-{region}",
            "Type": "public",
            "Region": region
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Public route to Internet Gateway
    aws.ec2.Route(
        f"public-route-{region}",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Associate public subnets with public route table
    for i, subnet in enumerate(public_subnets):
        aws.ec2.RouteTableAssociation(
            f"public-rta-{region}-{i+1}",
            subnet_id=subnet.id,
            route_table_id=public_rt.id,
            opts=pulumi.ResourceOptions(provider=provider)
        )
    
    # Private route tables
    private_rts = []
    if enable_ha_nat:
        # One route table per AZ for HA NAT
        for i in range(num_azs):
            private_rt = aws.ec2.RouteTable(
                f"private-rt-{region}-{i+1}",
                vpc_id=vpc.id,
                tags={
                    "Name": f"private-rt-{region}-{i+1}",
                    "Type": "private",
                    "Region": region,
                    "AZ": azs[i]
                },
                opts=pulumi.ResourceOptions(provider=provider)
            )
            private_rts.append(private_rt)
            
            # Route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{region}-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateways[i].id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Associate private subnets in this AZ
            for j in range(2):  # 2 private subnets per AZ
                subnet_idx = i * 2 + j
                aws.ec2.RouteTableAssociation(
                    f"private-rta-{region}-{i+1}-{j+1}",
                    subnet_id=private_subnets[subnet_idx].id,
                    route_table_id=private_rt.id,
                    opts=pulumi.ResourceOptions(provider=provider)
                )
    else:
        # Single private route table for all private subnets
        private_rt = aws.ec2.RouteTable(
            f"private-rt-{region}",
            vpc_id=vpc.id,
            tags={
                "Name": f"private-rt-{region}",
                "Type": "private",
                "Region": region
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )
        private_rts.append(private_rt)
        
        # Route to NAT Gateway
        aws.ec2.Route(
            f"private-route-{region}",
            route_table_id=private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateways[0].id,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Associate all private subnets
        for i, subnet in enumerate(private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{region}-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
    
    # Create Security Groups
    
    # Web tier security group (public)
    web_sg = aws.ec2.SecurityGroup(
        f"web-sg-{region}",
        name_prefix=f"web-sg-{region}-",
        description="Security group for web tier - allows HTTP/HTTPS inbound",
        vpc_id=vpc.id,
        ingress=[
            # HTTP from anywhere
            aws.ec2.SecurityGroupIngressArgs(
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP from internet"
            ),
            # HTTPS from anywhere
            aws.ec2.SecurityGroupIngressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS from internet"
            ),
            # SSH from VPC only
            aws.ec2.SecurityGroupIngressArgs(
                from_port=22,
                to_port=22,
                protocol="tcp",
                cidr_blocks=[vpc_cidr],
                description="SSH from VPC"
            )
        ],
        egress=[
            # Minimal egress - only HTTPS for updates and HTTP for health checks
            aws.ec2.SecurityGroupEgressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS outbound"
            ),
            aws.ec2.SecurityGroupEgressArgs(
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP outbound"
            ),
            # DNS
            aws.ec2.SecurityGroupEgressArgs(
                from_port=53,
                to_port=53,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="DNS TCP"
            ),
            aws.ec2.SecurityGroupEgressArgs(
                from_port=53,
                to_port=53,
                protocol="udp",
                cidr_blocks=["0.0.0.0/0"],
                description="DNS UDP"
            )
        ],
        tags={
            "Name": f"web-sg-{region}",
            "Tier": "web",
            "Region": region
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Application tier security group (private)
    app_sg = aws.ec2.SecurityGroup(
        f"app-sg-{region}",
        name_prefix=f"app-sg-{region}-",
        description="Security group for application tier - restrictive access",
        vpc_id=vpc.id,
        ingress=[
            # Application port from web tier only
            aws.ec2.SecurityGroupIngressArgs(
                from_port=8080,
                to_port=8080,
                protocol="tcp",
                source_security_group_id=web_sg.id,
                description="App port from web tier"
            ),
            # SSH from VPC only
            aws.ec2.SecurityGroupIngressArgs(
                from_port=22,
                to_port=22,
                protocol="tcp",
                cidr_blocks=[vpc_cidr],
                description="SSH from VPC"
            )
        ],
        egress=[
            # Database access within VPC
            aws.ec2.SecurityGroupEgressArgs(
                from_port=3306,
                to_port=3306,
                protocol="tcp",
                cidr_blocks=[vpc_cidr],
                description="MySQL to database tier"
            ),
            aws.ec2.SecurityGroupEgressArgs(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=[vpc_cidr],
                description="PostgreSQL to database tier"
            ),
            # HTTPS for external APIs
            aws.ec2.SecurityGroupEgressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS for external APIs"
            ),
            # DNS
            aws.ec2.SecurityGroupEgressArgs(
                from_port=53,
                to_port=53,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="DNS TCP"
            ),
            aws.ec2.SecurityGroupEgressArgs(
                from_port=53,
                to_port=53,
                protocol="udp",
                cidr_blocks=["0.0.0.0/0"],
                description="DNS UDP"
            )
        ],
        tags={
            "Name": f"app-sg-{region}",
            "Tier": "application",
            "Region": region
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Database tier security group (private)
    db_sg = aws.ec2.SecurityGroup(
        f"db-sg-{region}",
        name_prefix=f"db-sg-{region}-",
        description="Security group for database tier - most restrictive",
        vpc_id=vpc.id,
        ingress=[
            # MySQL from app tier only
            aws.ec2.SecurityGroupIngressArgs(
                from_port=3306,
                to_port=3306,
                protocol="tcp",
                source_security_group_id=app_sg.id,
                description="MySQL from app tier"
            ),
            # PostgreSQL from app tier only
            aws.ec2.SecurityGroupIngressArgs(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                source_security_group_id=app_sg.id,
                description="PostgreSQL from app tier"
            ),
            # SSH from VPC only (for maintenance)
            aws.ec2.SecurityGroupIngressArgs(
                from_port=22,
                to_port=22,
                protocol="tcp",
                cidr_blocks=[vpc_cidr],
                description="SSH from VPC"
            )
        ],
        egress=[
            # Very minimal egress - only for updates via HTTPS
            aws.ec2.SecurityGroupEgressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS for updates only"
            ),
            # DNS
            aws.ec2.SecurityGroupEgressArgs(
                from_port=53,
                to_port=53,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="DNS TCP"
            ),
            aws.ec2.SecurityGroupEgressArgs(
                from_port=53,
                to_port=53,
                protocol="udp",
                cidr_blocks=["0.0.0.0/0"],
                description="DNS UDP"
            )
        ],
        tags={
            "Name": f"db-sg-{region}",
            "Tier": "database",
            "Region": region
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    return {
        "vpc": vpc,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "security_groups": {
            "web": web_sg,
            "app": app_sg,
            "db": db_sg
        },
        "internet_gateway": igw,
        "nat_gateways": nat_gateways,
        "region": region
    }

# Create infrastructure for all regions
regional_infrastructure = {}
for region in regions:
    regional_infrastructure[region] = create_vpc_infrastructure(region)

# Exports for verification and testing
exports = {}

# Export VPC information
for region, infra in regional_infrastructure.items():
    exports[f"vpc_{region.replace('-', '_')}_id"] = infra["vpc"].id
    exports[f"vpc_{region.replace('-', '_')}_cidr"] = infra["vpc"].cidr_block
    
    # Export subnet IDs
    exports[f"public_subnets_{region.replace('-', '_')}"] = [
        subnet.id for subnet in infra["public_subnets"]
    ]
    exports[f"private_subnets_{region.replace('-', '_')}"] = [
        subnet.id for subnet in infra["private_subnets"]
    ]
    
    # Export security group IDs
    exports[f"web_sg_{region.replace('-', '_')}_id"] = infra["security_groups"]["web"].id
    exports[f"app_sg_{region.replace('-', '_')}_id"] = infra["security_groups"]["app"].id
    exports[f"db_sg_{region.replace('-', '_')}_id"] = infra["security_groups"]["db"].id
    
    # Export NAT Gateway IDs
    exports[f"nat_gateways_{region.replace('-', '_')}"] = [
        nat_gw.id for nat_gw in infra["nat_gateways"]
    ]

# Export configuration for verification
exports["regions"] = regions
exports["base_tags"] = base_tags
exports["enable_ha_nat"] = enable_ha_nat

# Apply all exports
for key, value in exports.items():
    pulumi.export(key, value)

# Export summary information for easy verification
pulumi.export("infrastructure_summary", {
    "total_regions": len(regions),
    "total_vpcs": len(regional_infrastructure),
    "total_public_subnets": sum(len(infra["public_subnets"]) for infra in regional_infrastructure.values()),
    "total_private_subnets": sum(len(infra["private_subnets"]) for infra in regional_infrastructure.values()),
    "total_security_groups": sum(len(infra["security_groups"]) for infra in regional_infrastructure.values()),
    "ha_nat_enabled": enable_ha_nat
})

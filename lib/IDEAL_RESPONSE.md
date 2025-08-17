# Ideal Response for TapStack Implementation

The ideal response should be a complete, production-ready multi-region AWS VPC infrastructure using Pulumi with the following key features:

## High-Level Requirements:

1. **Multi-region support** with explicit AWS providers for each region
2. **Non-overlapping CIDR blocks** for each region (10.0.0.0/16, 10.1.0.0/16, etc.)
3. **VPC with DNS enabled** (hostnames and support)
4. **4 subnets per AZ** (2 public + 2 private) across 2 AZs
5. **Internet Gateway** for public subnets
6. **NAT Gateway** with Elastic IP for private subnets
7. **Route tables** with proper routing configuration
8. **Tiered security groups** (web, app, db) with environment-aware rules
9. **Environment-aware SSH access** (prod/staging: VPC CIDR only, dev: 0.0.0.0/0)
10. **Consistent tagging strategy** across all resources
11. **High availability NAT Gateway** option (configurable)
12. **Proper resource dependencies** and associations
13. **Comprehensive exports** for verification and testing
14. **Excellent code quality** with proper linting compliance
15. **Security validation** and production hardening
16. **Cost optimization** with configurable HA options

## Ideal Implementation Code Examples:

### 1. **Multi-Region Provider Configuration**
```python
# Create AWS provider for each region
provider = aws.Provider(
  f"aws-{region}",
  region=region,
  default_tags=aws.ProviderDefaultTagsArgs(
    tags={"Environment": environment, "Team": team, "Project": project}
  ),
)
```

### 2. **Environment-Aware SSH Security**
```python
# Security configuration - ENVIRONMENT-AWARE SSH ACCESS CONTROL
ssh_allowed_cidrs = config.get("ssh_allowed_cidrs")

if ssh_allowed_cidrs is None:
  default_cidrs = {
    "prod": ["10.0.0.0/16"],      # Production: VPC CIDR only
    "staging": ["10.0.0.0/16"],   # Staging: VPC CIDR only
  }
  ssh_allowed_cidrs = default_cidrs.get(environment, ["0.0.0.0/0"])

# Additional security check: Never allow 0.0.0.0/0 in production
if environment == "prod" and "0.0.0.0/0" in ssh_allowed_cidrs:
  ssh_allowed_cidrs = [
    cidr if cidr != "0.0.0.0/0" else "10.0.0.0/16" for cidr in ssh_allowed_cidrs
  ]
```

### 3. **Proper Subnet CIDR Calculation**
```python
def calculate_subnet_cidrs(vpc_cidr: str, num_subnets: int) -> List[str]:
  """Calculate subnet CIDR blocks from VPC CIDR"""
  vpc_network = ipaddress.IPv4Network(vpc_cidr)
  # Use /24 subnets (256 IPs each)
  subnet_size = 24
  subnets = list(vpc_network.subnets(new_prefix=subnet_size))
  return [str(subnet) for subnet in subnets[:num_subnets]]
```

### 4. **Configurable HA NAT Gateway**
```python
def create_nat_gateways(region: str, num_azs: int, public_subnets: List, provider: aws.Provider) -> List:
  """Create NAT Gateways based on HA configuration"""
  nat_eips = []
  nat_gateways = []
  
  if enable_ha_nat:
    # One NAT Gateway per AZ for high availability
    for i in range(num_azs):
      eip = ec2.Eip(
        f"nat-eip-{region}-{i + 1}-{environment}",
        vpc=True,
        tags={
          "Environment": environment,
          "Team": team,
          "Project": project,
          "Name": f"nat-eip-{region}-{i + 1}-{environment}",
          "Region": region,
        },
        opts=pulumi.ResourceOptions(provider=provider),
      )
      nat_eips.append(eip)
      
      nat_gw = ec2.NatGateway(
        f"nat-gw-{region}-{i + 1}-{environment}",
        allocation_id=eip.id,
        subnet_id=public_subnets[i * 2].id,
        tags={
          "Environment": environment,
          "Team": team,
          "Project": project,
          "Name": f"nat-gw-{region}-{i + 1}-{environment}",
          "Region": region,
        },
        opts=pulumi.ResourceOptions(provider=provider),
      )
      nat_gateways.append(nat_gw)
  else:
    # Single NAT Gateway for cost optimization
    eip = ec2.Eip(
      f"nat-eip-{region}-{environment}",
      vpc=True,
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"nat-eip-{region}-{environment}",
        "Region": region,
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )
    nat_eips.append(eip)
    
    nat_gw = ec2.NatGateway(
      f"nat-gw-{region}-{environment}",
      allocation_id=eip.id,
      subnet_id=public_subnets[0].id,
      tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"nat-gw-{region}-{environment}",
        "Region": region,
      },
      opts=pulumi.ResourceOptions(provider=provider),
    )
    nat_gateways.append(nat_gw)
  
  return nat_gateways
```

### 5. **Tiered Security Groups with Proper Restrictions**
```python
# Web tier security group (public) - allows HTTP/HTTPS from internet
web_sg = ec2.SecurityGroup(
  f"web-sg-{region}-{environment}",
  description="Security group for web tier - allows HTTP/HTTPS inbound",
  vpc_id=vpc.id,
  ingress=[
    ec2.SecurityGroupIngressArgs(
      description="HTTP from internet",
      from_port=80,
      to_port=80,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    ec2.SecurityGroupIngressArgs(
      description="HTTPS from internet",
      from_port=443,
      to_port=443,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    ec2.SecurityGroupIngressArgs(
      description="SSH - Environment-aware access control",
      from_port=22,
      to_port=22,
      protocol="tcp",
      cidr_blocks=ssh_allowed_cidrs,
    ),
  ],
  egress=[
    # Minimal egress - only HTTPS for updates and HTTP for health checks
    ec2.SecurityGroupEgressArgs(
      description="HTTPS outbound",
      from_port=443,
      to_port=443,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    ec2.SecurityGroupEgressArgs(
      description="HTTP outbound",
      from_port=80,
      to_port=80,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    # DNS
    ec2.SecurityGroupEgressArgs(
      description="DNS TCP",
      from_port=53,
      to_port=53,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    ec2.SecurityGroupEgressArgs(
      description="DNS UDP",
      from_port=53,
      to_port=53,
      protocol="udp",
      cidr_blocks=["0.0.0.0/0"],
    ),
  ],
  tags={
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"web-sg-{region}-{environment}",
    "Tier": "web",
    "Region": region,
    "SecurityLevel": "Public",
  },
  opts=pulumi.ResourceOptions(provider=provider),
)

# Application tier security group (private)
app_sg = ec2.SecurityGroup(
  f"app-sg-{region}-{environment}",
  description="Security group for application tier - restrictive access",
  vpc_id=vpc.id,
  ingress=[
    # Application port from web tier only (using CIDR for now)
    ec2.SecurityGroupIngressArgs(
      description="App port from web tier",
      from_port=8080,
      to_port=8080,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
    # SSH from VPC only
    ec2.SecurityGroupIngressArgs(
      description="SSH from VPC",
      from_port=22,
      to_port=22,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
  ],
  egress=[
    # Database access within VPC
    ec2.SecurityGroupEgressArgs(
      description="MySQL to database tier",
      from_port=3306,
      to_port=3306,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
    ec2.SecurityGroupEgressArgs(
      description="PostgreSQL to database tier",
      from_port=5432,
      to_port=5432,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
    # HTTPS for external APIs
    ec2.SecurityGroupEgressArgs(
      description="HTTPS for external APIs",
      from_port=443,
      to_port=443,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    # DNS
    ec2.SecurityGroupEgressArgs(
      description="DNS TCP",
      from_port=53,
      to_port=53,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    ec2.SecurityGroupEgressArgs(
      description="DNS UDP",
      from_port=53,
      to_port=53,
      protocol="udp",
      cidr_blocks=["0.0.0.0/0"],
    ),
  ],
  tags={
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"app-sg-{region}-{environment}",
    "Tier": "application",
    "Region": region,
    "SecurityLevel": "Private",
  },
  opts=pulumi.ResourceOptions(provider=provider),
)

# Database tier security group (private) - MOST RESTRICTIVE
db_sg = ec2.SecurityGroup(
  f"db-sg-{region}-{environment}",
  description="Security group for database tier - most restrictive",
  vpc_id=vpc.id,
  ingress=[
    # MySQL from app tier only (using CIDR for now)
    ec2.SecurityGroupIngressArgs(
      description="MySQL from app tier",
      from_port=3306,
      to_port=3306,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
    # PostgreSQL from app tier only (using CIDR for now)
    ec2.SecurityGroupIngressArgs(
      description="PostgreSQL from app tier",
      from_port=5432,
      to_port=5432,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
    # SSH from VPC only (for maintenance)
    ec2.SecurityGroupIngressArgs(
      description="SSH from VPC",
      from_port=22,
      to_port=22,
      protocol="tcp",
      cidr_blocks=[vpc_cidr],
    ),
  ],
  egress=[
    # Very minimal egress - only for updates via HTTPS
    ec2.SecurityGroupEgressArgs(
      description="HTTPS for updates only",
      from_port=443,
      to_port=443,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    # DNS
    ec2.SecurityGroupEgressArgs(
      description="DNS TCP",
      from_port=53,
      to_port=53,
      protocol="tcp",
      cidr_blocks=["0.0.0.0/0"],
    ),
    ec2.SecurityGroupEgressArgs(
      description="DNS UDP",
      from_port=53,
      to_port=53,
      protocol="udp",
      cidr_blocks=["0.0.0.0/0"],
    ),
  ],
  tags={
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"db-sg-{region}-{environment}",
    "Tier": "database",
    "Region": region,
    "SecurityLevel": "Restricted",
  },
  opts=pulumi.ResourceOptions(provider=provider),
)
```

### 6. **Conditional Output Exports**
```python
# Outputs (only when running in Pulumi context)
if export_outputs:
  # Export VPC information for all regions
  for region, infra in regional_infrastructure.items():
    region_key = region.replace("-", "_")
    pulumi.export(f"vpc_{region_key}_id", infra["vpc"].id)
    pulumi.export(f"vpc_{region_key}_cidr", infra["vpc"].cidr_block)

    # Export subnet IDs
    pulumi.export(
      f"public_subnets_{region_key}", [subnet.id for subnet in infra["public_subnets"]]
    )
    pulumi.export(
      f"private_subnets_{region_key}", [subnet.id for subnet in infra["private_subnets"]]
    )

    # Export security group IDs
    pulumi.export(f"web_sg_{region_key}_id", infra["security_groups"]["web"].id)
    pulumi.export(f"app_sg_{region_key}_id", infra["security_groups"]["app"].id)
    pulumi.export(f"db_sg_{region_key}_id", infra["security_groups"]["db"].id)

    # Export NAT Gateway IDs
    pulumi.export(
      f"nat_gateways_{region_key}", [nat_gw.id for nat_gw in infra["nat_gateways"]]
    )

  # Export configuration for verification
  pulumi.export("regions", regions)
  pulumi.export("environment", environment)
  pulumi.export("enable_ha_nat", enable_ha_nat)

  # Export summary information for easy verification
  pulumi.export(
    "infrastructure_summary",
    {
      "total_regions": len(regions),
      "total_vpcs": len(regional_infrastructure),
      "total_public_subnets": sum(
        len(infra["public_subnets"]) for infra in regional_infrastructure.values()
      ),
      "total_private_subnets": sum(
        len(infra["private_subnets"]) for infra in regional_infrastructure.values()
      ),
      "total_security_groups": sum(
        len(infra["security_groups"]) for infra in regional_infrastructure.values()
      ),
      "ha_nat_enabled": enable_ha_nat,
    },
  )
```

### 7. **Proper Resource Dependencies and Provider Usage**
```python
# Always pass provider to resources in multi-region setup
vpc = ec2.Vpc(
  f"vpc-{region}-{environment}",
  cidr_block=vpc_cidr,
  enable_dns_hostnames=True,
  enable_dns_support=True,
  tags={
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"vpc-{region}-{environment}",
    "Region": region,
  },
  opts=pulumi.ResourceOptions(provider=provider),  # Critical for multi-region
)

# Internet Gateway
igw = ec2.InternetGateway(
  f"igw-{region}-{environment}",
  vpc_id=vpc.id,
  tags={
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"igw-{region}-{environment}",
    "Region": region,
  },
  opts=pulumi.ResourceOptions(provider=provider),
)
```

### 8. **Comprehensive Tagging Strategy**
```python
# Common tags for all resources
common_tags = {
  "Environment": environment,
  "Team": team,
  "Project": project,
  "Region": region,
}

# Resource-specific tags
resource_tags = {
  **common_tags,
  "Name": f"resource-name-{region}-{environment}",
  "Type": "public|private",
  "Tier": "web|application|database",
  "SecurityLevel": "Public|Private|Restricted",
  "AZ": az,  # For subnet resources
}
```

### 9. **Regional Infrastructure Organization**
```python
def create_vpc_infrastructure(region: str) -> Dict[str, Any]:
  """Create complete VPC infrastructure for a region"""
  
  # Create AWS provider for this region
  provider = aws.Provider(
    f"aws-{region}",
    region=region,
    default_tags=aws.ProviderDefaultTagsArgs(
      tags={"Environment": environment, "Team": team, "Project": project}
    ),
  )

  # Get VPC CIDR for this region
  vpc_cidr = region_cidrs.get(region, f"10.{hash(region) % 200 + 10}.0.0/16")

  # Get availability zones
  azs = get_availability_zones(
    state="available", opts=pulumi.InvokeOptions(provider=provider)
  )

  # Use exactly 2 AZs for cost optimization
  num_azs = max(2, min(len(azs.names), 2))
  total_subnets = num_azs * 4  # 2 public + 2 private per AZ
  subnet_cidrs = calculate_subnet_cidrs(vpc_cidr, total_subnets)

  # Create all infrastructure components...
  # [VPC, IGW, Subnets, NAT Gateways, Route Tables, Security Groups]

  return {
    "vpc": vpc,
    "igw": igw,
    "public_subnets": public_subnets,
    "private_subnets": private_subnets,
    "nat_gateways": nat_gateways,
    "security_groups": {"web": web_sg, "app": app_sg, "db": db_sg},
    "region": region,
  }

# Create infrastructure for all regions
regional_infrastructure = {}
for region in regions:
  regional_infrastructure[region] = create_vpc_infrastructure(region)
```

The implementation should follow the exact structure and patterns shown in the current tap_stack.py file, with proper error handling, validation, and production-ready architecture. These code examples demonstrate the ideal patterns for implementing a robust, secure, and scalable multi-region AWS VPC infrastructure using Pulumi.
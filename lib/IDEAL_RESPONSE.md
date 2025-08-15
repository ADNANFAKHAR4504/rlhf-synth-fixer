# Ideal Response Example

This document shows what a perfect response to the PROMPT.md requirements should look like.

## Expected Code Structure

The ideal response should be a single Python file that:

```python
import pulumi
from pulumi import Config
from pulumi_aws import ec2, get_availability_zones

# Configuration
config = Config()
environment = config.get('environment') or 'dev'
team = config.get('team') or 'platform'
project = config.get('project') or 'tap'

# Get availability zones
azs = get_availability_zones(state="available")

# VPC
vpc = ec2.Vpc(f"vpc-{environment}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"vpc-{environment}"
    }
)

# Internet Gateway
igw = ec2.InternetGateway(f"igw-{environment}",
    vpc_id=vpc.id,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"igw-{environment}"
    }
)

# Public Subnets
public_subnet_1 = ec2.Subnet(f"public-subnet-1-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"public-subnet-1-{environment}"
    }
)

public_subnet_2 = ec2.Subnet(f"public-subnet-2-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=True,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"public-subnet-2-{environment}"
    }
)

# Private Subnets
private_subnet_1 = ec2.Subnet(f"private-subnet-1-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.3.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=False,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"private-subnet-1-{environment}"
    }
)

private_subnet_2 = ec2.Subnet(f"private-subnet-2-{environment}",
    vpc_id=vpc.id,
    cidr_block="10.0.4.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=False,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"private-subnet-2-{environment}"
    }
)

# Elastic IP for NAT Gateway
eip = ec2.Eip(f"nat-eip-{environment}",
    vpc=True,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"nat-eip-{environment}"
    }
)

# NAT Gateway
nat_gateway = ec2.NatGateway(f"nat-gateway-{environment}",
    allocation_id=eip.id,
    subnet_id=public_subnet_1.id,
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"nat-gateway-{environment}"
    }
)

# Route Tables
public_rt = ec2.RouteTable(f"public-rt-{environment}",
    vpc_id=vpc.id,
    routes=[
        ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
    ],
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"public-rt-{environment}"
    }
)

private_rt = ec2.RouteTable(f"private-rt-{environment}",
    vpc_id=vpc.id,
    routes=[
        ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
        )
    ],
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"private-rt-{environment}"
    }
)

# Route Table Associations
public_rta_1 = ec2.RouteTableAssociation(f"public-rta-1-{environment}",
    subnet_id=public_subnet_1.id,
    route_table_id=public_rt.id
)

public_rta_2 = ec2.RouteTableAssociation(f"public-rta-2-{environment}",
    subnet_id=public_subnet_2.id,
    route_table_id=public_rt.id
)

private_rta_1 = ec2.RouteTableAssociation(f"private-rta-1-{environment}",
    subnet_id=private_subnet_1.id,
    route_table_id=private_rt.id
)

private_rta_2 = ec2.RouteTableAssociation(f"private-rta-2-{environment}",
    subnet_id=private_subnet_2.id,
    route_table_id=private_rt.id
)

# Security Groups
public_sg = ec2.SecurityGroup(f"public-sg-{environment}",
    description="Security group for public subnets",
    vpc_id=vpc.id,
    ingress=[
        ec2.SecurityGroupIngressArgs(
            description="SSH",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        ec2.SecurityGroupIngressArgs(
            description="HTTP",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        ec2.SecurityGroupIngressArgs(
            description="HTTPS",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    egress=[
        ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"public-sg-{environment}"
    }
)

private_sg = ec2.SecurityGroup(f"private-sg-{environment}",
    description="Security group for private subnets",
    vpc_id=vpc.id,
    ingress=[
        ec2.SecurityGroupIngressArgs(
            description="All traffic from VPC",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=[vpc.cidr_block]
        )
    ],
    egress=[
        ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={
        "Environment": environment,
        "Team": team,
        "Project": project,
        "Name": f"private-sg-{environment}"
    }
)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_cidr", vpc.cidr_block)
pulumi.export("public_subnet_ids", [public_subnet_1.id, public_subnet_2.id])
pulumi.export("private_subnet_ids", [private_subnet_1.id, private_subnet_2.id])
pulumi.export("public_security_group_id", public_sg.id)
pulumi.export("private_security_group_id", private_sg.id)
pulumi.export("internet_gateway_id", igw.id)
pulumi.export("nat_gateway_id", nat_gateway.id)
pulumi.export("availability_zones", azs.names)
```

## Key Characteristics

1. **Single File**: Everything in one Python file
2. **Configuration**: Uses Pulumi Config for environment variables
3. **Proper Tagging**: Consistent tags on all resources
4. **Security**: Appropriate security group rules
5. **Outputs**: Exports all necessary resource IDs
6. **Comments**: Clear inline documentation
7. **Best Practices**: Follows AWS and Pulumi best practices

## Expected Behavior

When run with `pulumi up`, this should:
- Create a complete VPC infrastructure
- Set up proper networking between public and private subnets
- Configure security groups with appropriate rules
- Export all resource IDs for use by other systems
- Apply consistent tagging for cost management
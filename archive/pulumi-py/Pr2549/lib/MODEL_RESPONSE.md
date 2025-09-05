"""
Production-Ready AWS Infrastructure with Pulumi Python

This module creates a secure, scalable cloud infrastructure including:
- VPC with proper CIDR allocation
- Multi-AZ subnet distribution for high availability
- Internet Gateway and routing configuration
- EC2 instances with security groups
- AWS Systems Manager parameter integration
- Comprehensive tagging and documentation

Author: Infrastructure Team
Version: 1.0.0
"""

```python
import pulumi
import pulumi_aws as aws
from typing import Dict, Any

# Configuration and Parameters
config = pulumi.Config()

# Parameterized configuration with defaults
REGION = config.get("region") or "us-east-1"
VPC_CIDR = config.get("vpc_cidr") or "10.0.0.0/16"
SUBNET_1_CIDR = config.get("subnet_1_cidr") or "10.0.1.0/24"
SUBNET_2_CIDR = config.get("subnet_2_cidr") or "10.0.2.0/24"
INSTANCE_TYPE = config.get("instance_type") or "t2.micro"
PROJECT_NAME = config.get("project_name") or "secure-web-infrastructure"
ENVIRONMENT = config.get("environment") or "production"

# AMI ID parameter - can be overridden via Pulumi config or SSM parameter
AMI_ID = config.get("ami_id")

def get_latest_amazon_linux_ami() -> pulumi.Output[str]:
    """
    Retrieve the latest Amazon Linux 2 AMI ID dynamically.
    This ensures we always use the most up-to-date AMI.
    """
    return aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name",
                values=["amzn2-ami-hvm-*-x86_64-gp2"]
            ),
            aws.ec2.GetAmiFilterArgs(
                name="virtualization-type",
                values=["hvm"]
            )
        ]
    ).id

def create_common_tags(resource_name: str, additional_tags: Dict[str, str] = None) -> Dict[str, str]:
    """
    Generate standardized tags for all resources.
    
    Args:
        resource_name: Name of the resource
        additional_tags: Optional additional tags to merge
    
    Returns:
        Dictionary of tags following organizational standards
    """
    base_tags = {
        "Name": resource_name,
        "Project": PROJECT_NAME,
        "Environment": ENVIRONMENT,
        "ManagedBy": "Pulumi",
        "CreatedDate": "2024-01-01",  # You might want to use actual date
        "Owner": "Infrastructure-Team"
    }
    
    if additional_tags:
        base_tags.update(additional_tags)
    
    return base_tags

# Get availability zones for the specified region
availability_zones = aws.get_availability_zones(state="available")

# 1. VPC Creation
vpc = aws.ec2.Vpc(
    "main-vpc",
    cidr_block=VPC_CIDR,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags=create_common_tags("MainVPC", {
        "Description": "Main VPC for secure web infrastructure",
        "CIDR": VPC_CIDR
    })
)

# 2. Internet Gateway
internet_gateway = aws.ec2.InternetGateway(
    "main-igw",
    vpc_id=vpc.id,
    tags=create_common_tags("MainInternetGateway", {
        "Description": "Internet Gateway for external connectivity"
    })
)

# 3. Subnets in different Availability Zones
subnet_1 = aws.ec2.Subnet(
    "subnet-1",
    vpc_id=vpc.id,
    cidr_block=SUBNET_1_CIDR,
    availability_zone=availability_zones.names[0],
    map_public_ip_on_launch=True,
    tags=create_common_tags("PublicSubnet1", {
        "Description": "Public subnet in first AZ",
        "CIDR": SUBNET_1_CIDR,
        "AZ": availability_zones.names[0],
        "Type": "Public"
    })
)

subnet_2 = aws.ec2.Subnet(
    "subnet-2",
    vpc_id=vpc.id,
    cidr_block=SUBNET_2_CIDR,
    availability_zone=availability_zones.names[1],
    map_public_ip_on_launch=True,
    tags=create_common_tags("PublicSubnet2", {
        "Description": "Public subnet in second AZ",
        "CIDR": SUBNET_2_CIDR,
        "AZ": availability_zones.names[1],
        "Type": "Public"
    })
)

# 4. Route Table
route_table = aws.ec2.RouteTable(
    "main-route-table",
    vpc_id=vpc.id,
    tags=create_common_tags("MainRouteTable", {
        "Description": "Main route table for public subnets"
    })
)

# 5. Default Route to Internet Gateway
default_route = aws.ec2.Route(
    "default-route",
    route_table_id=route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=internet_gateway.id
)

# 6. Route Table Associations
route_table_association_1 = aws.ec2.RouteTableAssociation(
    "subnet-1-association",
    subnet_id=subnet_1.id,
    route_table_id=route_table.id
)

route_table_association_2 = aws.ec2.RouteTableAssociation(
    "subnet-2-association",
    subnet_id=subnet_2.id,
    route_table_id=route_table.id
)

# 7. Security Group
security_group = aws.ec2.SecurityGroup(
    "web-security-group",
    name=f"{PROJECT_NAME}-web-sg",
    description="Security group for web servers allowing SSH access",
    vpc_id=vpc.id,
    
    # Ingress rules
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="SSH access",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        # Additional rule for HTTP (optional, commented out for security)
        # aws.ec2.SecurityGroupIngressArgs(
        #     description="HTTP access",
        #     from_port=80,
        #     to_port=80,
        #     protocol="tcp",
        #     cidr_blocks=["0.0.0.0/0"]
        # )
    ],
    
    # Egress rules (allow all outbound traffic)
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="All outbound traffic",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    
    tags=create_common_tags("WebSecurityGroup", {
        "Description": "Security group for web servers",
        "Ports": "22 (SSH)"
    })
)

# 8. AWS Systems Manager Parameter for AMI ID (if not provided via config)
if not AMI_ID:
    ami_parameter = aws.ssm.Parameter(
        "ami-id-parameter",
        name=f"/{PROJECT_NAME}/ami-id",
        type="String",
        value=get_latest_amazon_linux_ami(),
        description="Latest Amazon Linux 2 AMI ID for web servers",
        tags=create_common_tags("AMI-Parameter")
    )
    ami_to_use = ami_parameter.value
else:
    ami_to_use = AMI_ID

# 9. EC2 Instances
# Instance 1 in Subnet 1
instance_1 = aws.ec2.Instance(
    "web-server-1",
    ami=ami_to_use,
    instance_type=INSTANCE_TYPE,
    subnet_id=subnet_1.id,
    vpc_security_group_ids=[security_group.id],
    associate_public_ip_address=True,
    
    # User data script for basic setup
    user_data="""#!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server 1 - $(hostname -f)</h1>" > /var/www/html/index.html
    """,
    
    tags=create_common_tags("WebServer1", {
        "Description": "Web server instance in first AZ",
        "Role": "WebServer",
        "AZ": availability_zones.names[0]
    })
)

# Instance 2 in Subnet 2
instance_2 = aws.ec2.Instance(
    "web-server-2",
    ami=ami_to_use,
    instance_type=INSTANCE_TYPE,
    subnet_id=subnet_2.id,
    vpc_security_group_ids=[security_group.id],
    associate_public_ip_address=True,
    
    # User data script for basic setup
    user_data="""#!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server 2 - $(hostname -f)</h1>" > /var/www/html/index.html
    """,
    
    tags=create_common_tags("WebServer2", {
        "Description": "Web server instance in second AZ",
        "Role": "WebServer",
        "AZ": availability_zones.names[1]
    })
)

# 10. Additional SSM Parameters for infrastructure documentation
infrastructure_params = [
    aws.ssm.Parameter(
        "vpc-id-parameter",
        name=f"/{PROJECT_NAME}/vpc-id",
        type="String",
        value=vpc.id,
        description="VPC ID for the infrastructure",
        tags=create_common_tags("VPC-ID-Parameter")
    ),
    aws.ssm.Parameter(
        "security-group-parameter",
        name=f"/{PROJECT_NAME}/security-group-id",
        type="String",
        value=security_group.id,
        description="Security Group ID for web servers",
        tags=create_common_tags("SG-ID-Parameter")
    )
]

# Export important values
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_cidr", vpc.cidr_block)
pulumi.export("internet_gateway_id", internet_gateway.id)
pulumi.export("subnet_1_id", subnet_1.id)
pulumi.export("subnet_2_id", subnet_2.id)
pulumi.export("route_table_id", route_table.id)
pulumi.export("security_group_id", security_group.id)
pulumi.export("instance_1_id", instance_1.id)
pulumi.export("instance_1_public_ip", instance_1.public_ip)
pulumi.export("instance_1_private_ip", instance_1.private_ip)
pulumi.export("instance_2_id", instance_2.id)
pulumi.export("instance_2_public_ip", instance_2.public_ip)
pulumi.export("instance_2_private_ip", instance_2.private_ip)
pulumi.export("availability_zones", availability_zones.names)

# Export connection information
pulumi.export("ssh_connection_commands", {
    "instance_1": instance_1.public_ip.apply(lambda ip: f"ssh -i your-key.pem ec2-user@{ip}"),
    "instance_2": instance_2.public_ip.apply(lambda ip: f"ssh -i your-key.pem ec2-user@{ip}")
})

# Export infrastructure summary
pulumi.export("infrastructure_summary", {
    "project_name": PROJECT_NAME,
    "environment": ENVIRONMENT,
    "region": REGION,
    "vpc_cidr": VPC_CIDR,
    "subnets": [SUBNET_1_CIDR, SUBNET_2_CIDR],
    "instance_type": INSTANCE_TYPE,
    "total_instances": 2
})
```

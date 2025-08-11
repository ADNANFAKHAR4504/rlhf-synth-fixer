import os

import pulumi
import pulumi_aws as aws

# Get environment suffix from environment variable or use default
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Create a VPC with both IPv4 and IPv6 CIDR blocks
vpc = aws.ec2.Vpc(f"ipv6-vpc-{environment_suffix}",
                  cidr_block="10.0.0.0/16",
                  enable_dns_support=True,
                  enable_dns_hostnames=True,
                  assign_generated_ipv6_cidr_block=True,
                  tags={
                      "Environment": "Production",
                      "Project": "IPv6StaticTest"
                  })

# Create an Internet Gateway
igw = aws.ec2.InternetGateway(f"igw-{environment_suffix}",
                               vpc_id=vpc.id,
                               tags={
                                   "Environment": "Production",
                                   "Project": "IPv6StaticTest"
                               })

# Helper function to derive IPv6 subnet CIDR from VPC CIDR
def derive_ipv6_subnet_cidr(vpc_cidr, subnet_number):
    """
    Derive a /64 subnet CIDR from a VPC /56 CIDR.
    
    Args:
        vpc_cidr: VPC IPv6 CIDR block (e.g., "2600:1f18:5b2:f600::/56")
        subnet_number: Subnet number (0, 1, 2, etc.)
    
    Returns:
        IPv6 subnet CIDR block (e.g., "2600:1f18:5b2:f600::/64")
    """
    # Remove the /56 suffix and split by ':'
    base_cidr = vpc_cidr.replace('/56', '')
    parts = base_cidr.split(':')
    
    # The last part before '::' contains the subnet space
    # For a /56, we have 8 bits for subnets (256 possible /64 subnets)
    if len(parts) >= 4 and parts[3]:
        # Convert the 4th part to int, add subnet number, convert back to hex
        base_value = int(parts[3], 16)
        new_value = base_value + subnet_number
        parts[3] = format(new_value, 'x')
        return ':'.join(parts) + '/64'
    else:
        # Handle case where the 4th part is empty or missing
        return base_cidr.replace('::', f':{subnet_number:x}::/64')

# Create a public subnet with IPv6 CIDR block
# Force replacement when IPv6 CIDR block changes (AWS doesn't allow in-place updates)
public_subnet = aws.ec2.Subnet(
    f"public-subnet-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.11.0/24",
    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
        lambda x: derive_ipv6_subnet_cidr(x, 1)),
    availability_zone=aws.get_availability_zones().names[0],
    assign_ipv6_address_on_creation=True,
    map_public_ip_on_launch=True,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    },
    opts=pulumi.ResourceOptions(
        replace_on_changes=["ipv6_cidr_block",
                             "assign_ipv6_address_on_creation"]
    ))

# Create a private subnet with IPv6 CIDR block
# Force replacement when IPv6 CIDR block changes (AWS doesn't allow in-place updates)
private_subnet = aws.ec2.Subnet(
    f"private-subnet-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.12.0/24",
    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(
        lambda x: derive_ipv6_subnet_cidr(x, 2)),
    availability_zone=aws.get_availability_zones().names[1],
    assign_ipv6_address_on_creation=True,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    },
    opts=pulumi.ResourceOptions(
        replace_on_changes=["ipv6_cidr_block",
                             "assign_ipv6_address_on_creation"]
    ))

# Create a route table for the public subnet
public_rt = aws.ec2.RouteTable(
    f"public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
        ),
        aws.ec2.RouteTableRouteArgs(
            ipv6_cidr_block="::/0",
            gateway_id=igw.id,
        )
    ],
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Associate the public route table with the public subnet
public_rta = aws.ec2.RouteTableAssociation(
    f"public-rta-{environment_suffix}",
    subnet_id=public_subnet.id,
    route_table_id=public_rt.id)

# Create a NAT Gateway for the private subnet
eip = aws.ec2.Eip(f"nat-eip-{environment_suffix}",
                  vpc=True,
                  tags={
                      "Environment": "Production",
                      "Project": "IPv6StaticTest"
                  })

nat_gateway = aws.ec2.NatGateway(
    f"nat-gateway-{environment_suffix}",
    allocation_id=eip.id,
    subnet_id=public_subnet.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create an Egress-Only Internet Gateway for private subnet IPv6 access
egress_igw = aws.ec2.EgressOnlyInternetGateway(
    f"egress-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create a route table for the private subnet
private_rt = aws.ec2.RouteTable(
    f"private-rt-{environment_suffix}",
    vpc_id=vpc.id,
    routes=[
        aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id,
        ),
        aws.ec2.RouteTableRouteArgs(
            ipv6_cidr_block="::/0",
            egress_only_gateway_id=egress_igw.id,
        )
    ],
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Associate the private route table with the private subnet
private_rta = aws.ec2.RouteTableAssociation(
    f"private-rta-{environment_suffix}",
    subnet_id=private_subnet.id,
    route_table_id=private_rt.id)

# Create a security group allowing SSH access from specific IPv6 range
security_group = aws.ec2.SecurityGroup(
    f"sec-group-{environment_suffix}",
    vpc_id=vpc.id,
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=22,
        to_port=22,
        ipv6_cidr_blocks=["2001:db8::/32"]  # Example IPv6 range
    )],
    egress=[aws.ec2.SecurityGroupEgressArgs(
        protocol="-1",
        from_port=0,
        to_port=0,
        cidr_blocks=["0.0.0.0/0"],
        ipv6_cidr_blocks=["::/0"]
    )],
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create a launch template for the auto-scaling group
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}])

user_data = """#!/bin/bash
echo "Hello, World!" > index.html
nohup python3 -m http.server 80 &
"""

launch_template = aws.ec2.LaunchTemplate(
    f"web-server-lt-{environment_suffix}",
    image_id=ami.id,
    instance_type="t3.micro",
    vpc_security_group_ids=[security_group.id],
    user_data=pulumi.Output.from_input(user_data).apply(
        lambda x: __import__('base64').b64encode(x.encode()).decode()),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={
                "Environment": "Production",
                "Project": "IPv6StaticTest"
            }
        )
    ],
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create EC2 instances with static IPv6 addresses in public subnet
# These will be automatically replaced when the subnet is replaced
instance1 = aws.ec2.Instance(
    f"web-server-1-{environment_suffix}",
    ami=ami.id,
    instance_type="t3.micro",
    subnet_id=public_subnet.id,
    vpc_security_group_ids=[security_group.id],
    user_data=user_data,
    ipv6_address_count=1,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest",
        "Name": f"web-server-1-{environment_suffix}"
    },
    opts=pulumi.ResourceOptions(
        replace_on_changes=["subnet_id", "ipv6_address_count"],
        depends_on=[public_subnet]
    ))

instance2 = aws.ec2.Instance(
    f"web-server-2-{environment_suffix}",
    ami=ami.id,
    instance_type="t3.micro",
    subnet_id=public_subnet.id,
    vpc_security_group_ids=[security_group.id],
    user_data=user_data,
    ipv6_address_count=1,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest",
        "Name": f"web-server-2-{environment_suffix}"
    },
    opts=pulumi.ResourceOptions(
        replace_on_changes=["subnet_id", "ipv6_address_count"],
        depends_on=[public_subnet]
    ))

# Create an auto-scaling group for the public subnet
# Force replacement when subnet changes (due to IPv6 CIDR changes)
asg = aws.autoscaling.Group(
    f"web-server-asg-{environment_suffix}",
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    min_size=1,
    max_size=2,
    desired_capacity=1,
    vpc_zone_identifiers=[public_subnet.id],
    tags=[{
        "key": "Environment",
        "value": "Production",
        "propagate_at_launch": True
    }, {
        "key": "Project",
        "value": "IPv6StaticTest",
        "propagate_at_launch": True
    }],
    opts=pulumi.ResourceOptions(
        replace_on_changes=["vpc_zone_identifiers"],
        depends_on=[public_subnet]
    ))

# Export key resource IDs and IPv6 information
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_ipv6_cidr_block", vpc.ipv6_cidr_block)
pulumi.export("public_subnet_id", public_subnet.id)
pulumi.export("public_subnet_ipv6_cidr_block", public_subnet.ipv6_cidr_block)
pulumi.export("private_subnet_id", private_subnet.id)
pulumi.export("private_subnet_ipv6_cidr_block", private_subnet.ipv6_cidr_block)
pulumi.export("security_group_id", security_group.id)
pulumi.export("instance1_id", instance1.id)
pulumi.export("instance1_ipv6_addresses", instance1.ipv6_addresses)
pulumi.export("instance2_id", instance2.id)
pulumi.export("instance2_ipv6_addresses", instance2.ipv6_addresses)
pulumi.export("nat_gateway_id", nat_gateway.id)
pulumi.export("egress_igw_id", egress_igw.id)

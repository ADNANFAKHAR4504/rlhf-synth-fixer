# Complete Working Pulumi Python Solution

## Installation Requirements

First install required packages:

```bash
pip install pulumi pulumi-aws
```

## AWS Configuration

Configure AWS credentials:

```bash
aws configure
# Enter your AWS access key, secret, and region
```

## Complete Fixed Code

```python
import pulumi
import pulumi_aws as aws

# Create VPC with IPv6 support
vpc = aws.ec2.Vpc("ipv6-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_support=True,
    enable_dns_hostnames=True,
    assign_generated_ipv6_cidr_block=True,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create Internet Gateway
igw = aws.ec2.InternetGateway("igw",
    vpc_id=vpc.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create public subnet with IPv6 CIDR
public_subnet = aws.ec2.Subnet("public-subnet",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(lambda cidr: f"{cidr[:-2]}01::/64"),
    assign_ipv6_address_on_creation=True,
    map_public_ip_on_launch=True,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create private subnet with IPv6 CIDR
private_subnet = aws.ec2.Subnet("private-subnet",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    ipv6_cidr_block=vpc.ipv6_cidr_block.apply(lambda cidr: f"{cidr[:-2]}02::/64"),
    assign_ipv6_address_on_creation=True,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create route table for public subnet
public_rt = aws.ec2.RouteTable("public-rt",
    vpc_id=vpc.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Add routes to public route table
public_ipv4_route = aws.ec2.Route("public-ipv4-route",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id)

public_ipv6_route = aws.ec2.Route("public-ipv6-route",
    route_table_id=public_rt.id,
    destination_ipv6_cidr_block="::/0",
    gateway_id=igw.id)

# Associate public route table
public_rta = aws.ec2.RouteTableAssociation("public-rta",
    subnet_id=public_subnet.id,
    route_table_id=public_rt.id)

# Create EIP and NAT Gateway
eip = aws.ec2.Eip("nat-eip",
    domain="vpc",
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

nat_gateway = aws.ec2.NatGateway("nat-gateway",
    allocation_id=eip.id,
    subnet_id=public_subnet.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create Egress-Only Internet Gateway for IPv6
eigw = aws.ec2.EgressOnlyInternetGateway("eigw",
    vpc_id=vpc.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create private route table
private_rt = aws.ec2.RouteTable("private-rt",
    vpc_id=vpc.id,
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Add routes to private route table
private_ipv4_route = aws.ec2.Route("private-ipv4-route",
    route_table_id=private_rt.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id)

private_ipv6_route = aws.ec2.Route("private-ipv6-route",
    route_table_id=private_rt.id,
    destination_ipv6_cidr_block="::/0",
    egress_only_gateway_id=eigw.id)

# Associate private route table
private_rta = aws.ec2.RouteTableAssociation("private-rta",
    subnet_id=private_subnet.id,
    route_table_id=private_rt.id)

# Create security group
security_group = aws.ec2.SecurityGroup("sec-group",
    vpc_id=vpc.id,
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=22,
        to_port=22,
        ipv6_cidr_blocks=["2001:db8::/32"]
    )],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            ipv6_cidr_blocks=["::/0"]
        )
    ],
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Get AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[aws.ec2.GetAmiFilterArgs(
        name="name",
        values=["amzn2-ami-hvm-*-x86_64-gp2"]
    )])

# Create Launch Template (fixed)
launch_template = aws.ec2.LaunchTemplate("web-server-lt",
    image_id=ami.id,
    instance_type="t3.micro",
    vpc_security_group_ids=[security_group.id],
    user_data="IyEvYmluL2Jhc2gKeXVtIHVwZGF0ZSAteQp5dW0gaW5zdGFsbCAteSBodHRwZApzeXN0ZW1jdGwgc3RhcnQgaHR0cGQ=",
    tags={
        "Environment": "Production",
        "Project": "IPv6StaticTest"
    })

# Create Auto Scaling Group (fixed)
asg = aws.autoscaling.Group("web-server-asg",
    vpc_zone_identifiers=[public_subnet.id],
    min_size=1,
    max_size=3,
    desired_capacity=2,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Environment",
            value="Production",
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="Project",
            value="IPv6StaticTest",
            propagate_at_launch=True
        )
    ])

# Export values
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_id", public_subnet.id)
pulumi.export("private_subnet_id", private_subnet.id)
pulumi.export("security_group_id", security_group.id)
```

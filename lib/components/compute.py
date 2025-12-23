"""
VPC, EC2, LB Component - Creates isolated networking infrastructure
"""

import os
import ipaddress
import pulumi
import pulumi_aws as aws


class ComputeComponent(pulumi.ComponentResource):
    def __init__(
        self,
        name: str,
        environment: str,
        tags: dict,
        instance_profile: str,
        opts=None,
    ):
        super().__init__("custom:aws:Compute", name, None, opts)

        if environment == "dev":
            vpc_cidr = "10.1.0.0/16"
        elif environment == "prod":
            vpc_cidr = "10.4.0.0/16"
        elif environment == "test":
            vpc_cidr = "10.3.0.0/16"
        elif environment == "staging":
            vpc_cidr = "10.2.0.0/16"
        else:
            vpc_cidr = "10.5.0.0/16"

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"{environment}-vpc"},
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{environment}-igw"},
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets (2 for high availability)
        self.public_subnets = []
        self.public_subnet_ids = []
        # Create subnet cidrs
        network = ipaddress.ip_network(vpc_cidr)
        subnet_cidrs = list(network.subnets(new_prefix=24))

        for i in range(min(2, len(azs.names))):
            subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i + 1}",
                vpc_id=self.vpc.id,
                # cidr_block=f"{cidr_block[:-4]}{i+1}.0/24",
                cidr_block=str(subnet_cidrs[i]),
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    **tags,
                    "Name": f"{environment}-public-subnet-{i + 1}",
                    "Type": "Public",
                },
                opts=pulumi.ResourceOptions(parent=self),
            )
            self.public_subnets.append(subnet)
            self.public_subnet_ids.append(subnet.id)

        # Create private subnets (2 for high availability)
        self.private_subnets = []
        self.private_subnet_ids = []

        for i in range(min(2, len(azs.names))):
            subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i + 1}",
                vpc_id=self.vpc.id,
                # cidr_block=f"{cidr_block[:-4]}{i+10}.0/24",
                cidr_block=str(subnet_cidrs[i + 2]),
                availability_zone=azs.names[i],
                tags={
                    **tags,
                    "Name": f"{environment}-private-subnet-{i + 1}",
                    "Type": "Private",
                },
                opts=pulumi.ResourceOptions(parent=self),
            )
            self.private_subnets.append(subnet)
            self.private_subnet_ids.append(subnet.id)

        # Create NAT Gateways for private subnets
        self.nat_gateways = []
        for i, private_subnet in enumerate(self.private_subnets):
            # Allocate Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{name}-nat-eip-{i + 1}",
                domain="vpc",
                tags={**tags, "Name": f"{environment}-nat-eip-{i + 1}"},
                opts=pulumi.ResourceOptions(parent=self),
            )

            # Create NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{name}-nat-gw-{i + 1}",
                allocation_id=eip.id,
                subnet_id=private_subnet.id,
                tags={**tags, "Name": f"{environment}-nat-gw-{i + 1}"},
                opts=pulumi.ResourceOptions(parent=self),
            )
            self.nat_gateways.append(nat_gw)

        # Create route tables
        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"{environment}-public-rt"},
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Public route to Internet Gateway
        aws.ec2.Route(
            f"{name}-public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i + 1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=pulumi.ResourceOptions(parent=self),
            )

        # Private route tables (one per AZ for high availability)
        self.private_route_tables = []
        for i, (private_subnet, nat_gw) in enumerate(
            zip(self.private_subnets, self.nat_gateways)
        ):
            rt = aws.ec2.RouteTable(
                f"{name}-private-rt-{i + 1}",
                vpc_id=self.vpc.id,
                tags={**tags, "Name": f"{environment}-private-rt-{i + 1}"},
                opts=pulumi.ResourceOptions(parent=self),
            )

            # Route to NAT Gateway
            aws.ec2.Route(
                f"{name}-private-route-{i + 1}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id,
                opts=pulumi.ResourceOptions(parent=self),
            )

            # Associate private subnet with route table
            aws.ec2.RouteTableAssociation(
                f"{name}-private-rta-{i + 1}",
                subnet_id=private_subnet.id,
                route_table_id=rt.id,
                opts=pulumi.ResourceOptions(parent=self),
            )

            self.private_route_tables.append(rt)

        # Security Groups

        # ALB Security Group
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"{name}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"])],
            tags={
                **tags,
                "Name": f"{environment}-alb-sg"},
            opts=pulumi.ResourceOptions(
                parent=self),
        )

        # EC2 Security Group
        self.security_group = aws.ec2.SecurityGroup(
            f"{name}-ec2-sg",
            description="Security group for EC2 instances",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[
                        self.alb_security_group.id],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=[vpc_cidr],
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"])],
            tags={
                **tags,
                "Name": f"{environment}-ec2-sg"},
            opts=pulumi.ResourceOptions(
                parent=self),
        )

        # Create instsances
        self.ec2_instances = []

        # Check if running in LocalStack
        is_localstack = os.getenv('PROVIDER', '').lower() == 'localstack'

        # LocalStack-compatible: Use static AMI ID instead of dynamic lookup
        # In production AWS, this would use aws.ec2.get_ami() to find the latest Ubuntu AMI
        # For LocalStack testing, we use a LocalStack-specific AMI ID
        if is_localstack:
            # LocalStack accepts this generic AMI ID
            ubuntu_ami_id = "ami-ff0fea8310f3"
        else:
            # AWS AMI ID for Ubuntu (us-east-1)
            ubuntu_ami_id = "ami-0c55b159cbfafe1f0"

        # Loop through 2 public subnets (max) and create EC2 instances
        for i, subnet in enumerate(self.public_subnets):
            instance = aws.ec2.Instance(
                f"{name}-ec2-{i + 1}",
                # Using static AMI ID for LocalStack/AWS compatibility
                ami=ubuntu_ami_id,
                instance_type="t2.micro",  # Use t2.micro for LocalStack compatibility
                subnet_id=subnet.id,
                associate_public_ip_address=True,
                vpc_security_group_ids=[self.security_group.id],
                tags={**tags, "Name": f"{environment}-ec2-{i + 1}"},
                iam_instance_profile=instance_profile,
                opts=pulumi.ResourceOptions(parent=self),
            )
            self.ec2_instances.append(instance)

        self.alb = aws.lb.LoadBalancer(
            f"{name}-alb",
            security_groups=[self.alb_security_group.id],
            subnets=self.public_subnet_ids,
            load_balancer_type="application",
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.target_group = aws.lb.TargetGroup(
            f"{name}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Attach instance to ALB target group
        for i, instance in enumerate(self.ec2_instances):
            aws.lb.TargetGroupAttachment(
                f"{name}-tga-{i + 1}",
                target_group_arn=self.target_group.arn,
                target_id=instance.id,
                port=80,
                opts=pulumi.ResourceOptions(parent=self),
            )

        self.listener = aws.lb.Listener(
            f"{name}-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward", target_group_arn=self.target_group.arn
                )
            ],
            opts=pulumi.ResourceOptions(parent=self),
        )

        self.register_outputs(
            {
                "vpc_id": self.vpc.id,
                "public_subnet_ids": self.public_subnet_ids,
                "private_subnet_ids": self.private_subnet_ids,
                "security_group_id": self.security_group.id,
                "alb_security_group_id": self.alb_security_group.id,
                "alb_dns_name": self.alb.dns_name,
                "ec2_instance_ids": [
                    instance.id for instance in self.ec2_instances],
            })

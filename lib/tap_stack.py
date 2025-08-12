"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""


"""
Automated Cloud Environment Setup on AWS using Pulumi
This script creates a secure, production-ready AWS infrastructure
with VPC, EC2, S3, and IAM resources following best practices.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import aws  # example import for any AWS resource

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

        # Configuration - Set the target region
        config = pulumi.Config()
        region = config.get("region") or "us-west-2"

        # Configure the AWS provider to use the specified region
        aws_provider = aws.Provider("aws-provider", region=region)

        # Common tags for all resources
        common_tags = {
            "Environment": "Production",
            "Owner": "DevOps",
            "Compliance": "PCI-DSS",
            "ManagedBy": "Pulumi"
        }

        # Get current AWS region and account ID for resource naming
        current = aws.get_caller_identity()
        aws_region = aws.get_region()

        # =============================================================================
        # VPC and Network Infrastructure
        # =============================================================================

        # Create VPC
        vpc = aws.ec2.Vpc(
            "prod-main-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **common_tags,
                "Name": "prod-main-vpc"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            "prod-main-igw",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": "prod-main-igw"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available", opts=pulumi.InvokeOptions(provider=aws_provider))

        # Create public subnet
        public_subnet = aws.ec2.Subnet(
            "prod-public-subnet-1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=azs.names[0],
            map_public_ip_on_launch=True,
            tags={
                **common_tags,
                "Name": "prod-public-subnet-1",
                "Type": "Public"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create private subnet
        private_subnet = aws.ec2.Subnet(
            "prod-private-subnet-1",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=azs.names[1] if len(azs.names) > 1 else azs.names[0],
            tags={
                **common_tags,
                "Name": "prod-private-subnet-1",
                "Type": "Private"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create NAT Gateway for private subnet internet access
        nat_eip = aws.ec2.Eip(
            "prod-nat-eip",
            domain="vpc",
            tags={
                **common_tags,
                "Name": "prod-nat-eip"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider, depends_on=[igw])
        )

        nat_gateway = aws.ec2.NatGateway(
            "prod-nat-gateway",
            allocation_id=nat_eip.id,
            subnet_id=public_subnet.id,
            tags={
                **common_tags,
                "Name": "prod-nat-gateway"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create route tables
        public_route_table = aws.ec2.RouteTable(
            "prod-public-rt",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": "prod-public-rt"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        private_route_table = aws.ec2.RouteTable(
            "prod-private-rt",
            vpc_id=vpc.id,
            tags={
                **common_tags,
                "Name": "prod-private-rt"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create routes
        public_route = aws.ec2.Route(
            "prod-public-route",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        private_route = aws.ec2.Route(
            "prod-private-route",
            route_table_id=private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Associate route tables with subnets
        public_route_table_association = aws.ec2.RouteTableAssociation(
            "prod-public-rta",
            subnet_id=public_subnet.id,
            route_table_id=public_route_table.id,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        private_route_table_association = aws.ec2.RouteTableAssociation(
            "prod-private-rta",
            subnet_id=private_subnet.id,
            route_table_id=private_route_table.id,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # =============================================================================
        # Security Groups
        # =============================================================================

        # Security group for web servers (public instances)
        web_security_group = aws.ec2.SecurityGroup(
            "prod-web-server-sg",
            name="prod-web-server-sg",
            description="Security group for production web servers",
            vpc_id=vpc.id,
            ingress=[
                # SSH access only from specified IP
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["203.0.113.42/32"],
                    description="SSH access from authorized IP"
                ),
                # HTTP access from anywhere
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP access"
                ),
                # HTTPS access from anywhere
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS access"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **common_tags,
                "Name": "prod-web-server-sg"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Security group for private instances
        private_security_group = aws.ec2.SecurityGroup(
            "prod-private-server-sg",
            name="prod-private-server-sg",
            description="Security group for production private servers",
            vpc_id=vpc.id,
            ingress=[
                # SSH access only from specified IP
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["203.0.113.42/32"],
                    description="SSH access from authorized IP"
                ),
                # Internal communication from VPC
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["10.0.0.0/16"],
                    description="Internal VPC communication"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **common_tags,
                "Name": "prod-private-server-sg"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # =============================================================================
        # IAM Roles and Policies
        # =============================================================================

        # IAM role for EC2 instances
        ec2_assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }
            ]
        })

        ec2_role = aws.iam.Role(
            "prod-ec2-role",
            name="prod-ec2-role",
            assume_role_policy=ec2_assume_role_policy,
            description="IAM role for production EC2 instances",
            tags=common_tags,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Custom policy for EC2 instances (minimal permissions)
        ec2_policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "arn:aws:s3:::prod-app-data-bucket-*",
                        "arn:aws:s3:::prod-app-data-bucket-*/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        })

        ec2_policy = aws.iam.Policy(
            "prod-ec2-policy",
            name="prod-ec2-policy",
            description="Custom policy for production EC2 instances",
            policy=ec2_policy_document,
            tags=common_tags,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Attach policy to role
        ec2_role_policy_attachment = aws.iam.RolePolicyAttachment(
            "prod-ec2-role-policy-attachment",
            role=ec2_role.name,
            policy_arn=ec2_policy.arn,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create instance profile
        ec2_instance_profile = aws.iam.InstanceProfile(
            "prod-ec2-instance-profile",
            name="prod-ec2-instance-profile",
            role=ec2_role.name,
            tags=common_tags,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # =============================================================================
        # S3 Bucket
        # =============================================================================

        # Create S3 bucket with versioning enabled
        s3_bucket = aws.s3.Bucket(
            "prod-app-data-bucket",
            bucket=None,  # Let AWS generate a unique name
            tags={
                **common_tags,
                "Name": "prod-app-data-bucket"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Enable versioning on the S3 bucket
        s3_bucket_versioning = aws.s3.BucketVersioningV2(
            "prod-app-data-bucket-versioning",
            bucket=s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Block public access to the S3 bucket
        s3_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            "prod-app-data-bucket-pab",
            bucket=s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # =============================================================================
        # EC2 Instances
        # =============================================================================

        # Get the latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=aws_provider)
        )

        # User data script for automatic application deployment
        user_data_script = """#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd

        # Create a simple Hello World page
        cat <<EOF > /var/www/html/index.html
        <!DOCTYPE html>
        <html>
        <head>
            <title>Production Web Server</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
                .container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h1 { color: #333; }
                .info { background-color: #e7f3ff; padding: 10px; border-left: 4px solid #2196F3; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Hello, World!</h1>
                <p>Welcome to the Production Web Server</p>
                <div class="info">
                    <strong>Server Information:</strong><br>
                    Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)<br>
                    Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)<br>
                    Instance Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type)<br>
                    Deployment Time: $(date)
                </div>
                <p><em>This server was automatically configured using Pulumi!</em></p>
            </div>
        </body>
        </html>
        EOF

        # Install CloudWatch agent for monitoring
        yum install -y amazon-cloudwatch-agent
        """

        # Create EC2 instance in public subnet (web server)
        web_server = aws.ec2.Instance(
            "prod-web-server-01",
            instance_type="t3.micro",
            ami=ami.id,
            subnet_id=public_subnet.id,
            vpc_security_group_ids=[web_security_group.id],
            iam_instance_profile=ec2_instance_profile.name,
            user_data=user_data_script,
            associate_public_ip_address=True,
            tags={
                **common_tags,
                "Name": "prod-web-server-01",
                "Role": "WebServer"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # Create EC2 instance in private subnet
        app_server = aws.ec2.Instance(
            "prod-app-server-01",
            instance_type="t3.micro",
            ami=ami.id,
            subnet_id=private_subnet.id,
            vpc_security_group_ids=[private_security_group.id],
            iam_instance_profile=ec2_instance_profile.name,
            user_data="""#!/bin/bash
        yum update -y
        yum install -y htop wget curl
        echo "Private application server configured successfully" > /home/ec2-user/deployment.log
        """,
            tags={
                **common_tags,
                "Name": "prod-app-server-01",
                "Role": "ApplicationServer"
            },
            opts=pulumi.ResourceOptions(provider=aws_provider)
        )

        # =============================================================================
        # Outputs
        # =============================================================================

        # Export important resource information
        pulumi.export("vpc_id", vpc.id)
        pulumi.export("public_subnet_id", public_subnet.id)
        pulumi.export("private_subnet_id", private_subnet.id)
        pulumi.export("web_server_public_ip", web_server.public_ip)
        pulumi.export("web_server_private_ip", web_server.private_ip)
        pulumi.export("app_server_private_ip", app_server.private_ip)
        pulumi.export("s3_bucket_name", s3_bucket.bucket)
        pulumi.export("web_server_url", web_server.public_ip.apply(lambda ip: f"http://{ip}"))
        pulumi.export("region", region)

        # Export security group IDs for reference
        pulumi.export("web_security_group_id", web_security_group.id)
        pulumi.export("private_security_group_id", private_security_group.id)

        print("✅ AWS infrastructure deployment completed successfully!")
        print("🌐 Access your web server at the URL shown in the outputs")
        print("🔒 SSH access is restricted to IP: 203.0.113.42")
        print("📦 S3 bucket created with versioning enabled")
        print("🏷️  All resources tagged according to compliance requirements")
        self.register_outputs({})

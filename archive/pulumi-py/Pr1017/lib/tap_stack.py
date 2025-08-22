"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""



import base64
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the
        deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific
  components and manages the environment suffix used for naming and
  configuration.

  Note:
      - DO NOT create resources directly here unless they are truly global.
      - Use other components (e.g., DynamoDBStack) for AWS resource
        definitions.

  Args:
      name (str): The logical name of this Pulumi component.
      args (TapStackArgs): Configuration arguments including environment
          suffix and tags.
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

    # Configuration - Set the AWS region explicitly
    aws_region = "us-west-2"

    # Configure the AWS provider with the specific region
    aws_provider = aws.Provider("aws-provider", region=aws_region)

    # Common tags for all resources
    common_tags = {
        "Environment": "Production",
        "Owner": "DevOps",
        "Compliance": "PCI-DSS"
    }

    # Get current AWS account ID and region for resource naming
    current = aws.get_caller_identity()
    account_id = current.account_id

    # ========================================================================
    # VPC and Networking Components
    # ========================================================================

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

    # Create public subnet
    public_subnet = aws.ec2.Subnet(
        "prod-public-subnet",
        vpc_id=vpc.id,
        cidr_block="10.0.1.0/24",
        availability_zone=f"{aws_region}a",
        map_public_ip_on_launch=True,
        tags={
            **common_tags,
            "Name": "prod-public-subnet",
            "Type": "Public"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create private subnet
    private_subnet = aws.ec2.Subnet(
        "prod-private-subnet",
        vpc_id=vpc.id,
        cidr_block="10.0.2.0/24",
        availability_zone=f"{aws_region}b",
        tags={
            **common_tags,
            "Name": "prod-private-subnet",
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
        opts=pulumi.ResourceOptions(provider=aws_provider)
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

    # Create route table for public subnet
    public_route_table = aws.ec2.RouteTable(
        "prod-public-rt",
        vpc_id=vpc.id,
        tags={
            **common_tags,
            "Name": "prod-public-rt"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create route for public subnet to internet gateway
    aws.ec2.Route(
        "prod-public-route",
        route_table_id=public_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Associate public subnet with public route table
    aws.ec2.RouteTableAssociation(
        "prod-public-rta",
        subnet_id=public_subnet.id,
        route_table_id=public_route_table.id,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create route table for private subnet
    private_route_table = aws.ec2.RouteTable(
        "prod-private-rt",
        vpc_id=vpc.id,
        tags={
            **common_tags,
            "Name": "prod-private-rt"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create route for private subnet to NAT gateway
    aws.ec2.Route(
        "prod-private-route",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gateway.id,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Associate private subnet with private route table
    aws.ec2.RouteTableAssociation(
        "prod-private-rta",
        subnet_id=private_subnet.id,
        route_table_id=private_route_table.id,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # ============================================================================
    # Security Groups
    # ============================================================================

    # Security group for web servers (public subnet)
    web_security_group = aws.ec2.SecurityGroup(
        "prod-web-server-sg",
        name="prod-web-server-sg",
        description="Security group for web servers with restricted SSH access",
        vpc_id=vpc.id,
        ingress=[
                # SSH access only from specified IP
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH access from specific IP",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    cidr_blocks=["203.0.113.42/32"]
            ),
                # HTTP access from anywhere
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTP access",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
            ),
                # HTTPS access from anywhere
                aws.ec2.SecurityGroupIngressArgs(
                    description="HTTPS access",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
            )
            ],
        egress=[
                # Allow all outbound traffic
                aws.ec2.SecurityGroupEgressArgs(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
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
        "prod-private-sg",
        name="prod-private-sg",
        description="Security group for private subnet instances",
        vpc_id=vpc.id,
        ingress=[
                # SSH access only from web security group
                aws.ec2.SecurityGroupIngressArgs(
                    description="SSH from web servers",
                    from_port=22,
                    to_port=22,
                    protocol="tcp",
                    security_groups=[web_security_group.id]
            ),
                # Database access from web servers
                aws.ec2.SecurityGroupIngressArgs(
                    description="Database access from web servers",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[web_security_group.id]
            )
            ],
        egress=[
                # Allow all outbound traffic
                aws.ec2.SecurityGroupEgressArgs(
                    description="All outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
            )
            ],
        tags={
            **common_tags,
                "Name": "prod-private-sg"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # ============================================================================
    # S3 Bucket with Versioning
    # ============================================================================

    # Create S3 bucket
    s3_bucket = aws.s3.Bucket(
        "prod-data-bucket",
        bucket=f"prod-data-bucket-{account_id}-{aws_region}",
        tags={
            **common_tags,
            "Name": f"prod-data-bucket-{account_id}-{aws_region}"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Enable versioning on S3 bucket
    aws.s3.BucketVersioningV2(
        "prod-data-bucket-versioning",
        bucket=s3_bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"
        ),
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Block public access to S3 bucket
    aws.s3.BucketPublicAccessBlock(
        "prod-data-bucket-pab",
        bucket=s3_bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # ============================================================================
    # IAM Roles and Policies
    # ============================================================================

    # IAM role for EC2 instances
    ec2_role = aws.iam.Role(
        "prod-ec2-role",
        name="prod-ec2-role",
        assume_role_policy="""{
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
            }""",
        tags={
            **common_tags,
                "Name": "prod-ec2-role"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # IAM policy for S3 access (least privilege)
    s3_policy = aws.iam.Policy(
        "prod-s3-access-policy",
        name="prod-s3-access-policy",
        description="Policy for EC2 instances to access S3 bucket",
        policy=s3_bucket.arn.apply(lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": "{arn}/*"
                    }},
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": "{arn}"
                    }}
                ]
            }}"""),
        tags={
            **common_tags,
                "Name": "prod-s3-access-policy"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Attach policy to role
    aws.iam.RolePolicyAttachment(
        "prod-ec2-s3-policy-attachment",
        role=ec2_role.name,
        policy_arn=s3_policy.arn,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create instance profile for EC2
    instance_profile = aws.iam.InstanceProfile(
        "prod-ec2-instance-profile",
        name="prod-ec2-instance-profile",
        role=ec2_role.name,
        tags={
            **common_tags,
                "Name": "prod-ec2-instance-profile"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # ============================================================================
    # EC2 Instances with User Data
    # ============================================================================

    # Get the latest Amazon Linux 2023 AMI
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["al2023-ami-*-x86_64"]
            )
            ],
        opts=pulumi.InvokeOptions(provider=aws_provider)
    )

    # User data script for web server setup
    user_data_script = """#!/bin/bash
        dnf update -y
        dnf install -y httpd
        systemctl start httpd
        systemctl enable httpd

        # Create a simple Hello World page
        cat <<EOF > /var/www/html/index.html
        <!DOCTYPE html>
        <html>
        <head>
            <title>Production Web Server</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 800px; margin: 0 auto; }
                .header { background-color: #232f3e; color: white; padding: 20px; border-radius: 5px; }
                .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Production Web Server</h1>
                    <p>Deployed with Pulumi on AWS</p>
                </div>
                <div class="content">
                    <h2>Hello, World!</h2>
                    <p>This web server was automatically deployed using Pulumi infrastructure as code.</p>
                    <p><strong>Environment:</strong> Production</p>
                    <p><strong>Region:</strong> us-west-2</p>
                    <p><strong>Compliance:</strong> PCI-DSS</p>
                    <hr>
                    <p><em>Server started at: $(date)</em></p>
                </div>
            </div>
        </body>
        </html>
        EOF

        # Set proper permissions
        chown apache:apache /var/www/html/index.html
        chmod 644 /var/www/html/index.html
        """

    # Create EC2 instance in public subnet (web server)
    web_instance = aws.ec2.Instance(
        "prod-web-server",
        ami=ami.id,
        instance_type="t3.micro",
        vpc_security_group_ids=[web_security_group.id],
        subnet_id=public_subnet.id,
        iam_instance_profile=instance_profile.name,
        user_data=base64.b64encode(user_data_script.encode()).decode(),
        tags={
            **common_tags,
                "Name": "prod-web-server",
                "Type": "WebServer"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # Create EC2 instance in private subnet
    private_instance = aws.ec2.Instance(
        "prod-private-server",
        ami=ami.id,
        instance_type="t3.micro",
        vpc_security_group_ids=[private_security_group.id],
        subnet_id=private_subnet.id,
        iam_instance_profile=instance_profile.name,
        user_data=base64.b64encode("""#!/bin/bash
        dnf update -y
        dnf install -y htop
        echo "Private server initialized at $(date)" > /home/ec2-user/server-info.txt
        """.encode()).decode(),
        tags={
            **common_tags,
                "Name": "prod-private-server",
                "Type": "PrivateServer"
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

    # ============================================================================
    # Outputs
    # ============================================================================

    pulumi.export("vpc_id", vpc.id)
    pulumi.export("public_subnet_id", public_subnet.id)
    pulumi.export("private_subnet_id", private_subnet.id)
    pulumi.export("web_instance_public_ip", web_instance.public_ip)
    pulumi.export("web_instance_private_ip", web_instance.private_ip)
    pulumi.export("private_instance_private_ip", private_instance.private_ip)
    pulumi.export("s3_bucket_name", s3_bucket.bucket)
    pulumi.export("web_server_url", web_instance.public_ip.apply(lambda ip: f"http://{ip}"))
    pulumi.export("region", aws_region)
    self.register_outputs({})

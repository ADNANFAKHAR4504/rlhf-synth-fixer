"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the Banking Portal infrastructure project.

It creates a three-tier web application infrastructure including:
- VPC with public, private, and database subnets across multiple AZs
- RDS PostgreSQL Multi-AZ database with encryption
- Auto Scaling Group with Launch Template for application servers
- Application Load Balancer with HTTP listeners
- S3 buckets for static assets and logs
- CloudFront distribution for content delivery
- IAM roles with least privilege access
- CloudWatch monitoring and SNS alerting
"""

import json
import os
from typing import List, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the Banking Portal infrastructure.

    This component creates a secure, scalable three-tier web application infrastructure
    designed for financial services with high availability and strict security controls.

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
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Get availability zones for the region
        azs = aws.get_availability_zones(state="available")
        
        # Take first 3 AZs for high availability
        self.availability_zones = azs.names[:3]

        # Create VPC and networking components
        self._create_vpc()
        
        # Create KMS key for encryption
        self._create_kms_key()
        
        # Create IAM roles
        self._create_iam_roles()
        
        # Create security groups
        self._create_security_groups()
        
        # Create RDS database
        self._create_rds_database()
        
        # Create S3 buckets
        self._create_s3_buckets()
        
        # Create Application Load Balancer
        self._create_alb()
        
        # Create Launch Template and Auto Scaling Group
        self._create_auto_scaling_group()
        
        # Create CloudFront distribution
        self._create_cloudfront()
        
        # Create CloudWatch log group
        self._create_cloudwatch_log_group()
        
        # Create CloudWatch monitoring
        self._create_cloudwatch_monitoring()
        
        # Create SNS alerting
        self._create_sns_alerting()

        # Register outputs with parent component
        self.register_outputs({
            'cloudfront_distribution_url': self.cloudfront_distribution.domain_name,
            'alb_dns_name': self.alb.dns_name,
            'rds_endpoint': self.rds_instance.endpoint,
            'vpc_id': self.vpc.id,
            'static_assets_bucket': self.static_assets_bucket.bucket,
            'logs_bucket': self.logs_bucket.bucket,
            'cloudwatch_log_group_name': self.cloudwatch_log_group.name
        })

    def _create_vpc(self):
        """Create VPC with public, private, and database subnets across 3 AZs."""
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"banking-portal-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"banking-portal-vpc-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"banking-portal-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"banking-portal-igw-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{self.environment_suffix}",
                    "Type": "Public",
                    **self.tags
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets
        self.private_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+11}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"private-subnet-{i+1}-{self.environment_suffix}",
                    "Type": "Private",
                    **self.tags
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create database subnets
        self.database_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = aws.ec2.Subnet(
                f"database-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+21}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"database-subnet-{i+1}-{self.environment_suffix}",
                    "Type": "Database",
                    **self.tags
                },
                opts=ResourceOptions(parent=self)
            )
            self.database_subnets.append(subnet)

        # Create NAT Gateways for private subnets
        self.nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Create Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"nat-gateway-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"nat-gateway-eip-{i+1}-{self.environment_suffix}",
                    **self.tags
                },
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )

            # Create NAT Gateway
            nat_gateway = aws.ec2.NatGateway(
                f"nat-gateway-{i+1}-{self.environment_suffix}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"nat-gateway-{i+1}-{self.environment_suffix}",
                    **self.tags
                },
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gateway)

        # Create route tables
        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-route-table-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"public-route-table-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Public route to internet gateway
        aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-route-table-association-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Private route tables (one per AZ for high availability)
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            route_table = aws.ec2.RouteTable(
                f"private-route-table-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"private-route-table-{i+1}-{self.environment_suffix}",
                    **self.tags
                },
                opts=ResourceOptions(parent=self)
            )

            # Route to NAT Gateway
            aws.ec2.Route(
                f"private-route-{i+1}-{self.environment_suffix}",
                route_table_id=route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=self)
            )

            # Associate private subnet with route table
            aws.ec2.RouteTableAssociation(
                f"private-route-table-association-{i+1}-{self.environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Database subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"database-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.database_subnets],
            tags={
                "Name": f"database-subnet-group-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_kms_key(self):
        """Create KMS key for encryption at rest."""
        
        self.kms_key = aws.kms.Key(
            f"banking-portal-kms-key-{self.environment_suffix}",
            description=f"KMS key for banking portal encryption - {self.environment_suffix}",
            tags={
                "Name": f"banking-portal-kms-key-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        self.kms_key_alias = aws.kms.Alias(
            f"banking-portal-kms-alias-{self.environment_suffix}",
            name=f"alias/banking-portal-{self.environment_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege access."""
        
        # EC2 instance role for application servers
        self.ec2_role = aws.iam.Role(
            f"banking-portal-ec2-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"banking-portal-ec2-role-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach necessary policies for EC2 role
        aws.iam.RolePolicyAttachment(
            f"ec2-ssm-policy-{self.environment_suffix}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"ec2-cloudwatch-policy-{self.environment_suffix}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=ResourceOptions(parent=self)
        )

        # EC2 Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"banking-portal-instance-profile-{self.environment_suffix}",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self)
        )

        # S3 access policy for application servers
        s3_policy = aws.iam.Policy(
            f"banking-portal-s3-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                static_bucket=pulumi.Output.concat("arn:aws:s3:::banking-portal-static-", self.environment_suffix, "/*"),
                logs_bucket=pulumi.Output.concat("arn:aws:s3:::banking-portal-logs-", self.environment_suffix, "/*")
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject"
                        ],
                        "Resource": [
                            args["static_bucket"]
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        "Resource": [
                            args["logs_bucket"]
                        ]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"ec2-s3-policy-attachment-{self.environment_suffix}",
            role=self.ec2_role.name,
            policy_arn=s3_policy.arn,
            opts=ResourceOptions(parent=self)
        )

    def _create_security_groups(self):
        """Create security groups with least privilege access."""
        
        # ALB Security Group
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"banking-portal-alb-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=65535,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            tags={
                "Name": f"banking-portal-alb-sg-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # EC2 Security Group
        self.ec2_security_group = aws.ec2.SecurityGroup(
            f"banking-portal-ec2-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for EC2 instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_security_group.id]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[self.alb_security_group.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=65535,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"banking-portal-ec2-sg-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # RDS Security Group
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"banking-portal-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.ec2_security_group.id]
                )
            ],
            tags={
                "Name": f"banking-portal-rds-sg-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_rds_database(self):
        """Create RDS PostgreSQL Multi-AZ instance with encryption."""
        
        # Generate random password for RDS
        self.db_password = random.RandomPassword(
            f"rds-password-{self.environment_suffix}",
            length=16,
            special=True,
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance
        self.rds_instance = aws.rds.Instance(
            f"banking-portal-db-{self.environment_suffix}",
            identifier=f"banking-portal-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.7",
            instance_class="db.t3.medium",
            allocated_storage=100,
            max_allocated_storage=1000,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            multi_az=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            username="bankingadmin",
            password=self.db_password.result,
            skip_final_snapshot=True,  # Set to False in production
            deletion_protection=False,  # Set to True in production
            enabled_cloudwatch_logs_exports=["postgresql"],
            tags={
                "Name": f"banking-portal-db-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_s3_buckets(self):
        """Create S3 buckets for static assets and logs with encryption."""
        
        # Static assets bucket
        self.static_assets_bucket = aws.s3.Bucket(
            f"banking-portal-static-{self.environment_suffix}",
            bucket=f"banking-portal-static-{self.environment_suffix}",
            tags={
                "Name": f"banking-portal-static-{self.environment_suffix}",
                "Purpose": "Static Assets",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure encryption for static assets bucket
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"static-bucket-encryption-{self.environment_suffix}",
            bucket=self.static_assets_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self.static_assets_bucket)
        )

        # Block public access for static assets bucket
        aws.s3.BucketPublicAccessBlock(
            f"static-bucket-pab-{self.environment_suffix}",
            bucket=self.static_assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.static_assets_bucket)
        )

        # Logs bucket
        self.logs_bucket = aws.s3.Bucket(
            f"banking-portal-logs-{self.environment_suffix}",
            bucket=f"banking-portal-logs-{self.environment_suffix}",
            tags={
                "Name": f"banking-portal-logs-{self.environment_suffix}",
                "Purpose": "Application Logs",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Configure encryption for logs bucket
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"logs-bucket-encryption-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Block public access for logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"logs-bucket-pab-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Configure lifecycle policy for logs bucket
        aws.s3.BucketLifecycleConfiguration(
            f"logs-bucket-lifecycle-{self.environment_suffix}",
            bucket=self.logs_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="log_retention",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=365,
                            storage_class="DEEP_ARCHIVE"
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=2555  # 7 years retention for banking compliance
                    )
                )
            ],
            opts=ResourceOptions(parent=self.logs_bucket)
        )

    def _create_alb(self):
        """Create Application Load Balancer with HTTPS listeners."""
        
        # Create ALB
        self.alb = aws.lb.LoadBalancer(
            f"banking-portal-alb-{self.environment_suffix}",
            name=f"banking-portal-alb-{self.environment_suffix}",
            load_balancer_type="application",
            internal=False,  # False = internet-facing, True = internal
            security_groups=[self.alb_security_group.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,  # Set to True in production
            # ALB access logs disabled to avoid S3 permission conflicts
            # Application logs will be handled by CloudWatch and application-level logging
            tags={
                "Name": f"banking-portal-alb-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"banking-portal-tg-{self.environment_suffix}",
            name=f"banking-portal-tg-{self.environment_suffix}",
            port=80,
            protocol="HTTP",
            target_type="instance",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/health",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={
                "Name": f"banking-portal-tg-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # HTTP listener (redirect to HTTPS only if SSL cert is available)
        # For now, serving HTTP traffic directly since no SSL cert
        aws.lb.Listener(
            f"alb-http-redirect-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=8080,  # Alternative port for redirect behavior
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="redirect",
                    redirect=aws.lb.ListenerDefaultActionRedirectArgs(
                        port="80",
                        protocol="HTTP",
                        status_code="HTTP_301"
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # HTTP listener for application traffic (since no SSL cert available)
        aws.lb.Listener(
            f"alb-app-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Note: In production, you would create an SSL certificate and HTTPS listener
        # For demo purposes, using HTTP until SSL certificate is configured
        # self.ssl_certificate = aws.acm.Certificate(...)
        # aws.lb.Listener(...) for HTTPS

    def _create_auto_scaling_group(self):
        """Create Launch Template and Auto Scaling Group for EC2 instances."""
        
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
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
        )

        # User data script for EC2 instances
        user_data_script = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:AmazonCloudWatch-linux -s

# Create a simple health check endpoint
echo "OK" > /var/www/html/health

# Configure httpd for banking application
systemctl restart httpd
"""

        # Create Launch Template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"banking-portal-lt-{self.environment_suffix}",
            name=f"banking-portal-lt-{self.environment_suffix}",
            image_id=ami.id,
            instance_type="t3.medium",
            key_name=None,  # Configure as needed
            vpc_security_group_ids=[self.ec2_security_group.id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile.name
            ),
            user_data=pulumi.Output.from_input(user_data_script).apply(
                lambda script: base64.b64encode(script.encode()).decode()
            ),
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_type="gp3",
                        volume_size=20,
                        encrypted=True,
                        kms_key_id=self.kms_key.arn
                    )
                )
            ],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1
            ),
            tags={
                "Name": f"banking-portal-lt-{self.environment_suffix}",
                **self.tags
            },
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        "Name": f"banking-portal-instance-{self.environment_suffix}",
                        **self.tags
                    }
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Create Auto Scaling Group
        self.auto_scaling_group = aws.autoscaling.Group(
            f"banking-portal-asg-{self.environment_suffix}",
            name=f"banking-portal-asg-{self.environment_suffix}",
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=2,
            max_size=10,
            desired_capacity=3,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"banking-portal-asg-{self.environment_suffix}",
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.environment_suffix,
                    propagate_at_launch=True
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Auto Scaling Policies
        # Scale Up Policy
        scale_up_policy = aws.autoscaling.Policy(
            f"banking-portal-scale-up-{self.environment_suffix}",
            name=f"banking-portal-scale-up-{self.environment_suffix}",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.auto_scaling_group.name,
            policy_type="SimpleScaling",
            opts=ResourceOptions(parent=self)
        )

        # Scale Down Policy
        scale_down_policy = aws.autoscaling.Policy(
            f"banking-portal-scale-down-{self.environment_suffix}",
            name=f"banking-portal-scale-down-{self.environment_suffix}",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.auto_scaling_group.name,
            policy_type="SimpleScaling",
            opts=ResourceOptions(parent=self)
        )

        # Store policies for CloudWatch alarms
        self.scale_up_policy = scale_up_policy
        self.scale_down_policy = scale_down_policy

    def _create_cloudfront(self):
        """Create CloudFront distribution for content delivery."""
        
        # Origin Access Control for S3
        self.oac = aws.cloudfront.OriginAccessControl(
            f"banking-portal-oac-{self.environment_suffix}",
            name=f"banking-portal-oac-{self.environment_suffix}",
            description="OAC for Banking Portal static assets",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4",
            opts=ResourceOptions(parent=self)
        )

        # Create CloudFront distribution
        self.cloudfront_distribution = aws.cloudfront.Distribution(
            f"banking-portal-cf-{self.environment_suffix}",
            origins=[
                # ALB origin for dynamic content (HTTP since no SSL cert)
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.alb.dns_name,
                    origin_id=f"ALB-{self.environment_suffix}",
                    custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                        http_port=80,
                        https_port=443,
                        origin_protocol_policy="http-only",  # Changed to http-only since no SSL cert
                        origin_ssl_protocols=["TLSv1.2"]
                    )
                ),
                # S3 origin for static content
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=self.static_assets_bucket.bucket_domain_name,
                    origin_id=f"S3-{self.environment_suffix}",
                    origin_access_control_id=self.oac.id
                )
            ],
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"Banking Portal CloudFront Distribution - {self.environment_suffix}",
            default_root_object="index.html",
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"ALB-{self.environment_suffix}",
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=True,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward="all"
                    ),
                    headers=["*"]
                ),
                viewer_protocol_policy="redirect-to-https",
                min_ttl=0,
                default_ttl=86400,
                max_ttl=31536000,
                compress=True
            ),
            ordered_cache_behaviors=[
                # Static assets cache behavior
                aws.cloudfront.DistributionOrderedCacheBehaviorArgs(
                    path_pattern="/static/*",
                    allowed_methods=["GET", "HEAD"],
                    cached_methods=["GET", "HEAD"],
                    target_origin_id=f"S3-{self.environment_suffix}",
                    forwarded_values=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                        query_string=False,
                        cookies=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                            forward="none"
                        )
                    ),
                    viewer_protocol_policy="redirect-to-https",
                    min_ttl=0,
                    default_ttl=86400,
                    max_ttl=31536000,
                    compress=True
                )
            ],
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type="none"
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True  # Using CloudFront default cert for HTTPS at edge
            ),
            tags={
                "Name": f"banking-portal-cf-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Update S3 bucket policy to allow CloudFront access
        s3_policy = pulumi.Output.all(
            bucket_arn=self.static_assets_bucket.arn,
            cf_arn=self.cloudfront_distribution.arn
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudfront.amazonaws.com"
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"{args['bucket_arn']}/*",
                    "Condition": {
                        "StringEquals": {
                            "AWS:SourceArn": args['cf_arn']
                        }
                    }
                }
            ]
        }))

        aws.s3.BucketPolicy(
            f"static-bucket-cf-policy-{self.environment_suffix}",
            bucket=self.static_assets_bucket.id,
            policy=s3_policy,
            opts=ResourceOptions(parent=self.static_assets_bucket)
        )

    def _create_cloudwatch_log_group(self):
        """Create CloudWatch log group for application logging."""
        
        self.cloudwatch_log_group = aws.cloudwatch.LogGroup(
            f"banking-portal-app-logs-{self.environment_suffix}",
            name=f"/aws/ec2/banking-portal-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                "Name": f"banking-portal-app-logs-{self.environment_suffix}",
                "Purpose": "Application Logs",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_cloudwatch_monitoring(self):
        """Create CloudWatch alarms for monitoring."""
        
        # Create SNS topic for alerts first (needed for alarms)
        self.alert_topic = aws.sns.Topic(
            f"banking-portal-alerts-{self.environment_suffix}",
            name=f"banking-portal-alerts-{self.environment_suffix}",
            tags={
                "Name": f"banking-portal-alerts-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )
        
        # CPU Utilization Alarm - Scale Up
        self.cpu_high_alarm = aws.cloudwatch.MetricAlarm(
            f"banking-portal-cpu-high-{self.environment_suffix}",
            name=f"banking-portal-cpu-high-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="2",
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period="120",
            statistic="Average",
            threshold="70",
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[self.scale_up_policy.arn, self.alert_topic.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags={
                "Name": f"banking-portal-cpu-high-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # CPU Utilization Alarm - Scale Down
        self.cpu_low_alarm = aws.cloudwatch.MetricAlarm(
            f"banking-portal-cpu-low-{self.environment_suffix}",
            name=f"banking-portal-cpu-low-{self.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods="2",
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period="120",
            statistic="Average",
            threshold="30",
            alarm_description="This metric monitors ec2 cpu utilization for scale down",
            alarm_actions=[self.scale_down_policy.arn, self.alert_topic.arn],
            dimensions={
                "AutoScalingGroupName": self.auto_scaling_group.name
            },
            tags={
                "Name": f"banking-portal-cpu-low-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

        # Database Connection Count Alarm
        self.db_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"banking-portal-db-connections-{self.environment_suffix}",
            name=f"banking-portal-db-connections-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="2",
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period="300",
            statistic="Average",
            threshold="80",
            alarm_description="This metric monitors RDS database connections",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.id
            },
            tags={
                "Name": f"banking-portal-db-connections-{self.environment_suffix}",
                **self.tags
            },
            opts=ResourceOptions(parent=self)
        )

    def _create_sns_alerting(self):
        """Create SNS topics for alerting."""
        
        # SNS topic is already created in _create_cloudwatch_monitoring
        # This method can be used for additional SNS configuration like subscriptions
        
        # Note: In production, you would add email subscriptions
        # aws.sns.TopicSubscription(
        #     f"banking-portal-email-subscription-{self.environment_suffix}",
        #     topic_arn=self.alert_topic.arn,
        #     protocol="email",
        #     endpoint="admin@yourbank.com",
        #     opts=ResourceOptions(parent=self)
        # )
        pass




# Additional imports needed
import base64

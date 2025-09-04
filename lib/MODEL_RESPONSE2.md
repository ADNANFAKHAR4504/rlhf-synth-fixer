### Reasoning Trace
---

The error is showing that the import for `AwsProvider` is failing from `cdktf_cdktf_provider_aws`. This suggests that either:

1. The import path is wrong
2. The provider package isn't properly installed
3. The import names have changed

Looking at the error, it seems like the imports from `cdktf_cdktf_provider_aws` are not correct. In CDKTF, the AWS provider imports are typically structured differently.

Let me check what the correct import structure should be for CDKTF with AWS provider. The typical structure for CDKTF AWS provider imports is usually:

```python
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
# etc.
```

Or sometimes it's:
```python
from cdktf_cdktf_provider_aws import provider, vpc, internet_gateway, etc.
```

The error suggests that the imports are not structured correctly. Let me fix the imports in the tap_stack.py file.
### Answer 
---

The error indicates that the imports from `cdktf_cdktf_provider_aws` are incorrect. In CDKTF, the AWS provider constructs are imported from specific modules. Let me fix the import structure:

```python
# lib/tap_stack.py
#!/usr/bin/env python

from cdktf import TerraformStack, TerraformOutput, S3Backend
from constructs import Construct

# Correct CDKTF AWS provider imports
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_logging import S3BucketLogging
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.cloudfront_distribution import CloudfrontDistribution
from cdktf_cdktf_provider_aws.cloudfront_origin_access_control import CloudfrontOriginAccessControl
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_parameter_group import DbParameterGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.autoscaling_attachment import AutoscalingAttachment
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json
import base64


class TapStack(TerraformStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        state_bucket: str,
        state_bucket_region: str,
        aws_region: str,
        default_tags: dict,
    ):
        super().__init__(scope, construct_id)

        # Configure remote state
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"tap-stack-{environment_suffix}.tfstate",
            region=state_bucket_region,
        )

        # Configure AWS Provider
        self.provider = AwsProvider(
            self,
            "AWS",
            region=aws_region,
            default_tags=[default_tags]
        )

        # Store configuration
        self.environment_suffix = environment_suffix
        self.aws_region = aws_region
        self.resource_prefix = "prod-349081"
        
        # Get availability zones
        self.azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create all infrastructure components
        self._create_kms_key()
        self._create_vpc_and_networking()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_s3_bucket()
        self._create_cloudfront()
        self._create_rds()
        self._create_compute()
        self._create_load_balancer()
        self._create_route53()
        self._create_monitoring()

    def _create_kms_key(self):
        """Create KMS key for encryption"""
        self.kms_key = KmsKey(
            self,
            "kms_key",
            description=f"{self.resource_prefix} KMS key for encryption",
            deletion_window_in_days=7,
            tags={
                "Name": f"{self.resource_prefix}-kms-key"
            }
        )

        self.kms_alias = KmsAlias(
            self,
            "kms_alias",
            name=f"alias/{self.resource_prefix}-key",
            target_key_id=self.kms_key.key_id
        )

    def _create_vpc_and_networking(self):
        """Create VPC and networking components"""
        # VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{self.resource_prefix}-vpc"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.resource_prefix}-igw"
            }
        )

        # Public Subnets
        self.public_subnets = []
        self.private_subnets = []
        
        for i in range(2):  # Create 2 subnets for HA
            # Public subnet
            public_subnet = Subnet(
                self,
                f"public_subnet_{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"{self.aws_region}{chr(97+i)}",  # us-west-2a, us-west-2b
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.resource_prefix}-public-subnet-{i+1}",
                    "Type": "Public"
                }
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(
                self,
                f"private_subnet_{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"{self.aws_region}{chr(97+i)}",
                tags={
                    "Name": f"{self.resource_prefix}-private-subnet-{i+1}",
                    "Type": "Private"
                }
            )
            self.private_subnets.append(private_subnet)

        # Elastic IP for NAT Gateway
        self.nat_eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            depends_on=[self.igw],
            tags={
                "Name": f"{self.resource_prefix}-nat-eip"
            }
        )

        # NAT Gateway
        self.nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                "Name": f"{self.resource_prefix}-nat-gateway"
            }
        )

        # Route Tables
        # Public Route Table
        self.public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.resource_prefix}-public-rt"
            }
        )

        Route(
            self,
            "public_route",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

        # Private Route Table
        self.private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.resource_prefix}-private-rt"
            }
        )

        Route(
            self,
            "private_route",
            route_table_id=self.private_rt.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id
            )

    def _create_security_groups(self):
        """Create security groups"""
        # ALB Security Group
        self.alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"{self.resource_prefix}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.resource_prefix}-alb-sg"
            }
        )

        # ALB Security Group Rules
        SecurityGroupRule(
            self,
            "alb_http_inbound",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id
        )

        SecurityGroupRule(
            self,
            "alb_https_inbound",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id
        )

        SecurityGroupRule(
            self,
            "alb_outbound",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id
        )

        # Web Server Security Group
        self.web_sg = SecurityGroup(
            self,
            "web_sg",
            name=f"{self.resource_prefix}-web-sg",
            description="Security group for web servers",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.resource_prefix}-web-sg"
            }
        )

        SecurityGroupRule(
            self,
            "web_http_from_alb",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            source_security_group_id=self.alb_sg.id,
            security_group_id=self.web_sg.id
        )

        SecurityGroupRule(
            self,
            "web_ssh",
            type="ingress",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=self.web_sg.id
        )

        SecurityGroupRule(
            self,
            "web_outbound",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.web_sg.id
        )

        # Database Security Group
        self.db_sg = SecurityGroup(
            self,
            "db_sg",
            name=f"{self.resource_prefix}-db-sg",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.resource_prefix}-db-sg"
            }
        )

        SecurityGroupRule(
            self,
            "db_mysql_from_web",
            type="ingress",
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            source_security_group_id=self.web_sg.id,
            security_group_id=self.db_sg.id
        )

    def _create_iam_roles(self):
        """Create IAM roles and policies"""
        # EC2 Instance Role
        ec2_assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "ec2_assume_role_policy",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["ec2.amazonaws.com"]
                }]
            }]
        )

        self.ec2_role = IamRole(
            self,
            "ec2_role",
            name=f"{self.resource_prefix}-ec2-role",
            assume_role_policy=ec2_assume_role_policy.json,
            tags={
                "Name": f"{self.resource_prefix}-ec2-role"
            }
        )

        # Custom policy for S3 and CloudWatch access
        ec2_custom_policy = DataAwsIamPolicyDocument(
            self,
            "ec2_custom_policy",
            statement=[
                {
                    "effect": "Allow",
                    "actions": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "resources": ["*"]
                },
                {
                    "effect": "Allow",
                    "actions": [
                        "cloudwatch:PutMetricData",
                        "ec2:DescribeVolumes",
                        "ec2:DescribeTags",
                        "logs:PutLogEvents",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream"
                    ],
                    "resources": ["*"]
                }
            ]
        )

        self.ec2_custom_policy_resource = IamPolicy(
            self,
            "ec2_custom_policy_resource",
            name=f"{self.resource_prefix}-ec2-custom-policy",
            policy=ec2_custom_policy.json
        )

        # Attach policies to role
        IamRolePolicyAttachment(
            self,
            "ec2_ssm_attachment",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        IamRolePolicyAttachment(
            self,
            "ec2_custom_attachment",
            role=self.ec2_role.name,
            policy_arn=self.ec2_custom_policy_resource.arn
        )

        # Instance Profile
        self.instance_profile = IamInstanceProfile(
            self,
            "instance_profile",
            name=f"{self.resource_prefix}-instance-profile",
            role=self.ec2_role.name
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for static assets"""
        self.s3_bucket = S3Bucket(
            self,
            "static_assets_bucket",
            bucket=f"{self.resource_prefix}-static-assets-{self.environment_suffix}",
            tags={
                "Name": f"{self.resource_prefix}-static-assets"
            }
        )

        # Enable versioning
        S3BucketVersioning(
            self,
            "bucket_versioning",
            bucket=self.s3_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Create logging bucket
        self.s3_logging_bucket = S3Bucket(
            self,
            "access_logs_bucket",
            bucket=f"{self.resource_prefix}-access-logs-{self.environment_suffix}",
            tags={
                "Name": f"{self.resource_prefix}-access-logs"
            }
        )

        # Configure access logging
        S3BucketLogging(
            self,
            "bucket_logging",
            bucket=self.s3_bucket.id,
            target_bucket=self.s3_logging_bucket.bucket,
            target_prefix="access-logs/"
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "bucket_pab",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

    def _create_cloudfront(self):
        """Create CloudFront distribution"""
        # Origin Access Control
        self.oac = CloudfrontOriginAccessControl(
            self,
            "s3_oac",
            name=f"{self.resource_prefix}-s3-oac",
            description="OAC for S3 bucket",
            origin_access_control_origin_type="s3",
            signing_behavior="always",
            signing_protocol="sigv4"
        )

        # CloudFront Distribution
        self.cloudfront = CloudfrontDistribution(
            self,
            "cloudfront_distribution",
            comment=f"{self.resource_prefix} CloudFront Distribution",
            default_root_object="index.html",
            enabled=True,
            is_ipv6_enabled=True,
            price_class="PriceClass_100",
            
            origin=[{
                "domain_name": self.s3_bucket.bucket_regional_domain_name,
                "origin_id": "S3-Origin",
                "origin_access_control_id": self.oac.id
            }],
            
            default_cache_behavior={
                "allowed_methods": ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                "cached_methods": ["GET", "HEAD"],
                "target_origin_id": "S3-Origin",
                "compress": True,
                "viewer_protocol_policy": "redirect-to-https",
                "forwarded_values": {
                    "query_string": False,
                    "cookies": {"forward": "none"}
                }
            },
            
            restrictions={
                "geo_restriction": {
                    "restriction_type": "none"
                }
            },
            
            viewer_certificate={
                "cloudfront_default_certificate": True
            },
            
            tags={
                "Name": f"{self.resource_prefix}-cloudfront"
            }
        )

    def _create_rds(self):
        """Create RDS MySQL instance"""
        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"{self.resource_prefix}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                "Name": f"{self.resource_prefix}-db-subnet-group"
            }
        )

        # DB Parameter Group for query logging
        self.db_parameter_group = DbParameterGroup(
            self,
            "db_parameter_group",
            family="mysql8.0",
            name=f"{self.resource_prefix}-db-params",
            description="Parameter group for MySQL with query logging",
            parameter=[
                {
                    "name": "general_log",
                    "value": "1"
                },
                {
                    "name": "slow_query_log",
                    "value": "1"
                },
                {
                    "name": "log_queries_not_using_indexes",
                    "value": "1"
                }
            ],
            tags={
                "Name": f"{self.resource_prefix}-db-params"
            }
        )

        # RDS Instance
        self.rds_instance = DbInstance(
            self,
            "mysql_database",
            identifier=f"{self.resource_prefix}-mysql-db",
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            
            db_name="webapp",
            username="admin",
            manage_master_user_password=True,
            
            vpc_security_group_ids=[self.db_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            parameter_group_name=self.db_parameter_group.name,
            
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            
            enabled_cloudwatch_logs_exports=["error", "general", "slow"],
            
            skip_final_snapshot=True,
            deletion_protection=False,
            
            tags={
                "Name": f"{self.resource_prefix}-mysql-db"
            }
        )

    def _create_compute(self):
        """Create Auto Scaling Group and Launch Template"""
        # Get latest Amazon Linux 2 AMI
        self.ami = DataAwsAmi(
            self,
            "amazon_linux",
            most_recent=True,
            owners=["amazon"],
            filter=[
                {
                    "name": "name",
                    "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                },
                {
                    "name": "virtualization-type",
                    "values": ["hvm"]
                }
            ]
        )

        # User data script for web server setup
        user_data_script = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create a simple web page
cat <<'EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Production Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .status { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Production Web Application</h1>
            <p class="status">✅ Application is running successfully!</p>
            <p>Environment: Production</p>
            <p>Region: us-west-2</p>
        </div>
        <h2>Features Deployed:</h2>
        <ul>
            <li>✅ Auto Scaling Group with Health Checks</li>
            <li>✅ Application Load Balancer</li>
            <li>✅ RDS MySQL Database with Encryption</li>
            <li>✅ CloudFront CDN</li>
            <li>✅ S3 Static Assets with Versioning</li>
            <li>✅ VPC with Public/Private Subnets</li>
            <li>✅ CloudWatch Monitoring</li>
            <li>✅ Security Groups & IAM Roles</li>
        </ul>
    </div>
</body>
</html>
EOF

# Configure CloudWatch agent
cat <<'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/httpd/access",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/httpd/error",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
"""

        user_data_base64 = base64.b64encode(user_data_script.encode('utf-8')).decode('utf-8')

        # Launch Template
        self.launch_template = LaunchTemplate(
            self,
            "web_launch_template",
            name=f"{self.resource_prefix}-web-lt",
            description="Launch template for web servers",
            image_id=self.ami.id,
            instance_type="t3.micro",
            
            vpc_security_group_ids=[self.web_sg.id],
            
            user_data=user_data_base64,
            
            iam_instance_profile={
                "name": self.instance_profile.name
            },
            
            block_device_mappings=[{
                "device_name": "/dev/xvda",
                "ebs": {
                    "volume_type": "gp3",
                    "volume_size": 20,
                    "encrypted": True,
                    "kms_key_id": self.kms_key.arn,
                    "delete_on_termination": True
                }
            }],
            
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",
                "http_put_response_hop_limit": 2
            },
            
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {
                    "Name": f"{self.resource_prefix}-web-server"
                }
            }]
        )

        # Auto Scaling Group
        self.asg = AutoscalingGroup(
            self,
            "web_asg",
            name=f"{self.resource_prefix}-web-asg",
            min_size=2,
            max_size=6,
            desired_capacity=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            
            vpc_zone_identifier=[subnet.id for subnet in self.private_subnets],
            
            launch_template={
                "id": self.launch_template.id,
                "version": "$Latest"
            },
            
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances"
            ],
            
            tag=[{
                "key": "Name",
                "value": f"{self.resource_prefix}-asg-instance",
                "propagate_at_launch": True
            }]
        )

    def _create_load_balancer(self):
        """Create Application Load Balancer"""
        # Application Load Balancer
        self.alb = Lb(
            self,
            "application_lb",
            name=f"{self.resource_prefix}-alb",
            load_balancer_type="application",
            scheme="internet-facing",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=False,
            
            access_logs={
                "bucket": self.s3_logging_bucket.bucket,
                "prefix": "alb-access-logs",
                "enabled": True
            },
            
            tags={
                "Name": f"{self.resource_prefix}-alb"
            }
        )

        # Target Group
        self.target_group = LbTargetGroup(
            self,
            "web_target_group",
            name=f"{self.resource_prefix}-web-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="instance",
            
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "interval": 30,
                "matcher": "200",
                "path": "/",
                "port": "traffic-port",
                "protocol": "HTTP",
                "timeout": 5,
                "unhealthy_threshold": 2
            },
            
            tags={
                "Name": f"{self.resource_prefix}-web-tg"
            }
        )

        # Listener
        LbListener(
            self,
            "web_listener",
            load_balancer_arn=self.alb.arn,
            port="80",
            protocol="HTTP",
            
            default_action=[{
                "type": "forward",
                "target_group_arn": self.target_group.arn
            }]
        )

        # Attach Auto Scaling Group to Target Group
        AutoscalingAttachment(
            self,
            "asg_attachment",
            autoscaling_group_name=self.asg.id,
            lb_target_group_arn=self.target_group.arn
        )

    def _create_route53(self):
        """Create Route53 hosted zone and records"""
        # For this example, we'll create a hosted zone
        # In production, you'd use an existing domain
        self.hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"{self.resource_prefix}.internal",
            comment=f"Hosted zone for {self.resource_prefix}",
            
            tags={
                "Name": f"{self.resource_prefix}-hosted-zone"
            }
        )

        # A record pointing to the ALB
        Route53Record(
            self,
            "web_record",
            zone_id=self.hosted_zone.zone_id,
            name=f"www.{self.resource_prefix}.internal",
            type="A",
            
            alias={
                "name": self.alb.dns_name,
                "zone_id": self.alb.zone_id,
                "evaluate_target_health": True
            }
        )

        # CNAME for CloudFront
        Route53Record(
            self,
            "cdn_record",
            zone_id=self.hosted_zone.zone_id,
            name=f"cdn.{self.resource_prefix}.internal",
            type="CNAME",
            ttl=300,
            records=[self.cloudfront.domain_name]
        )

    def _create_monitoring(self):
        """Create CloudWatch monitoring and log groups"""
        # Log Groups
        self.web_access_log_group = CloudwatchLogGroup(
            self,
            "web_access_logs",
            name="/aws/ec2/httpd/access",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            
            tags={
                "Name": f"{self.resource_prefix}-web-access-logs"
            }
        )

        self.web_error_log_group = CloudwatchLogGroup(
            self,
            "web_error_logs",
            name="/aws/ec2/httpd/error",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            
            tags={
                "Name": f"{self.resource_prefix}-web-error-logs"
            }
        )

        # Output important values
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=self.alb.dns_name,
            description="Application Load Balancer DNS Name"
        )

        TerraformOutput(
            self,
            "cloudfront_domain_name",
            value=self.cloudfront.domain_name,
            description="CloudFront Distribution Domain Name"
        )

        TerraformOutput(
            self,
            "s3_bucket_name",
            value=self.s3_bucket.bucket,
            description="S3 Bucket Name for Static Assets"
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=self.rds_instance.endpoint,
            description="RDS Database Endpoint"
        )

        TerraformOutput(
            self,
            "hosted_zone_name_servers",
            value=self.hosted_zone.name_servers,
            description="Route53 Hosted Zone Name Servers"
        )
```

The main changes I made:

1. **Fixed all imports** - Changed from bulk import to individual module imports (e.g., `from cdktf_cdktf_provider_aws.provider import AwsProvider`)
2. **Fixed naming conflict** - Renamed `ec2_custom_policy` resource to `ec2_custom_policy_resource` to avoid naming conflicts
3. **Fixed user data encoding** - Added proper base64 encoding for the user data script
4. **Fixed target_bucket reference** - Used `.bucket` instead of `.id` for S3BucketLogging
5. **Fixed default_action structure** - Corrected the LbListener default_action structure

Now try running `./scripts/synth.sh` again. The import errors should be resolved!
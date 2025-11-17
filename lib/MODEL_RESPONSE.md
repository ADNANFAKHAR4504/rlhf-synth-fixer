### Reasoning Trace
---

The user wants me to write a complete Pulumi Python stack for a banking portal infrastructure. Based on the requirements, I need to create a three-tier architecture with:

1. Presentation Tier: CloudFront, ALB, public subnets
2. Application Tier: EC2 with Auto Scaling, private subnets
3. Data Tier: RDS PostgreSQL Multi-AZ, database subnets

Key components to implement:
- VPC with 9 subnets (3 public, 3 private, 3 database) across 3 AZs
- Security groups with proper rules
- IAM roles and policies
- S3 buckets for static assets and logs
- CloudFront distribution
- Application Load Balancer
- Auto Scaling Group with Launch Template
- RDS PostgreSQL with Multi-AZ
- KMS keys for encryption
- CloudWatch alarms
- SNS topics for alerting
- AWS Config for compliance

I'll write a comprehensive Pulumi stack that implements all these components with proper security controls and best practices for a banking application.
### Answer 
---

# Banking Portal Infrastructure Stack - `tap_stack.py`

```python
"""
Banking Portal Infrastructure Stack
Three-tier web application infrastructure for secure banking portal
Author: Infrastructure Team
Version: 1.0.0
"""

import json
import base64
from typing import Dict, List, Any
import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, export, ResourceOptions

# Configuration
config = Config()
project_name = "banking-portal"
environment = config.get("environment") or "production"
region = "us-east-1"

# Tags to apply to all resources
default_tags = {
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "CostCenter": "FinancialServices",
    "Compliance": "PCI-DSS"
}

# Get availability zones
azs = aws.get_availability_zones(state="available")

# -----------------------------------------------------------------------------
# KMS Keys for Encryption
# -----------------------------------------------------------------------------

# KMS key for database encryption
db_kms_key = aws.kms.Key(
    "db-kms-key",
    description=f"KMS key for {project_name} database encryption",
    deletion_window_in_days=10,
    enable_key_rotation=True,
    tags={**default_tags, "Name": f"{project_name}-db-kms-key"}
)

db_kms_alias = aws.kms.Alias(
    "db-kms-alias",
    name=f"alias/{project_name}-db-key",
    target_key_id=db_kms_key.key_id
)

# KMS key for S3 encryption
s3_kms_key = aws.kms.Key(
    "s3-kms-key",
    description=f"KMS key for {project_name} S3 encryption",
    deletion_window_in_days=10,
    enable_key_rotation=True,
    tags={**default_tags, "Name": f"{project_name}-s3-kms-key"}
)

s3_kms_alias = aws.kms.Alias(
    "s3-kms-alias",
    name=f"alias/{project_name}-s3-key",
    target_key_id=s3_kms_key.key_id
)

# -----------------------------------------------------------------------------
# VPC and Networking
# -----------------------------------------------------------------------------

# Create VPC
vpc = aws.ec2.Vpc(
    "main-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**default_tags, "Name": f"{project_name}-vpc"}
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    "internet-gateway",
    vpc_id=vpc.id,
    tags={**default_tags, "Name": f"{project_name}-igw"}
)

# Create subnets
public_subnets = []
private_subnets = []
database_subnets = []

for i in range(3):
    az = azs.names[i]
    
    # Public subnet
    public_subnet = aws.ec2.Subnet(
        f"public-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**default_tags, "Name": f"{project_name}-public-subnet-{i+1}", "Tier": "Public"}
    )
    public_subnets.append(public_subnet)
    
    # Private subnet for application tier
    private_subnet = aws.ec2.Subnet(
        f"private-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={**default_tags, "Name": f"{project_name}-private-subnet-{i+1}", "Tier": "Application"}
    )
    private_subnets.append(private_subnet)
    
    # Database subnet
    db_subnet = aws.ec2.Subnet(
        f"database-subnet-{i+1}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+20}.0/24",
        availability_zone=az,
        tags={**default_tags, "Name": f"{project_name}-database-subnet-{i+1}", "Tier": "Database"}
    )
    database_subnets.append(db_subnet)

# Elastic IPs for NAT Gateways
eips = []
for i in range(3):
    eip = aws.ec2.Eip(
        f"nat-eip-{i+1}",
        vpc=True,
        tags={**default_tags, "Name": f"{project_name}-nat-eip-{i+1}"}
    )
    eips.append(eip)

# NAT Gateways
nat_gateways = []
for i, (eip, subnet) in enumerate(zip(eips, public_subnets)):
    nat = aws.ec2.NatGateway(
        f"nat-gateway-{i+1}",
        allocation_id=eip.id,
        subnet_id=subnet.id,
        tags={**default_tags, "Name": f"{project_name}-nat-gateway-{i+1}"}
    )
    nat_gateways.append(nat)

# Route Tables
# Public route table
public_route_table = aws.ec2.RouteTable(
    "public-route-table",
    vpc_id=vpc.id,
    tags={**default_tags, "Name": f"{project_name}-public-rt"}
)

# Public route to internet
public_route = aws.ec2.Route(
    "public-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        f"public-rta-{i+1}",
        subnet_id=subnet.id,
        route_table_id=public_route_table.id
    )

# Private route tables (one per AZ for HA)
for i, (nat, private_subnet) in enumerate(zip(nat_gateways, private_subnets)):
    # Create route table for each AZ
    private_route_table = aws.ec2.RouteTable(
        f"private-route-table-{i+1}",
        vpc_id=vpc.id,
        tags={**default_tags, "Name": f"{project_name}-private-rt-{i+1}"}
    )
    
    # Route to NAT Gateway
    aws.ec2.Route(
        f"private-route-{i+1}",
        route_table_id=private_route_table.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat.id
    )
    
    # Associate private subnet
    aws.ec2.RouteTableAssociation(
        f"private-rta-{i+1}",
        subnet_id=private_subnet.id,
        route_table_id=private_route_table.id
    )
    
    # Associate database subnet with private route table
    aws.ec2.RouteTableAssociation(
        f"database-rta-{i+1}",
        subnet_id=database_subnets[i].id,
        route_table_id=private_route_table.id
    )

# -----------------------------------------------------------------------------
# Security Groups
# -----------------------------------------------------------------------------

# ALB Security Group
alb_sg = aws.ec2.SecurityGroup(
    "alb-sg",
    name=f"{project_name}-alb-sg",
    description="Security group for Application Load Balancer",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTPS from anywhere"
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTP from anywhere (redirect to HTTPS)"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags={**default_tags, "Name": f"{project_name}-alb-sg"}
)

# Application Tier Security Group
app_sg = aws.ec2.SecurityGroup(
    "app-sg",
    name=f"{project_name}-app-sg",
    description="Security group for application servers",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            security_groups=[alb_sg.id],
            description="HTTPS from ALB"
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            security_groups=[alb_sg.id],
            description="HTTP from ALB"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags={**default_tags, "Name": f"{project_name}-app-sg"}
)

# Database Security Group
db_sg = aws.ec2.SecurityGroup(
    "db-sg",
    name=f"{project_name}-db-sg",
    description="Security group for RDS database",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=5432,
            to_port=5432,
            security_groups=[app_sg.id],
            description="PostgreSQL from application servers"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic"
        )
    ],
    tags={**default_tags, "Name": f"{project_name}-db-sg"}
)

# -----------------------------------------------------------------------------
# S3 Buckets
# -----------------------------------------------------------------------------

# S3 bucket for static assets
assets_bucket = aws.s3.Bucket(
    "assets-bucket",
    bucket=f"{project_name}-static-assets-{pulumi.get_stack()}",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(enabled=True),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=s3_kms_key.arn
            ),
            bucket_key_enabled=True
        )
    ),
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            id="delete-old-versions",
            enabled=True,
            noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                days=90
            )
        )
    ],
    tags={**default_tags, "Name": f"{project_name}-static-assets"}
)

# S3 bucket for logs
logs_bucket = aws.s3.Bucket(
    "logs-bucket",
    bucket=f"{project_name}-logs-{pulumi.get_stack()}",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(enabled=True),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=s3_kms_key.arn
            ),
            bucket_key_enabled=True
        )
    ),
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            id="archive-old-logs",
            enabled=True,
            transitions=[
                aws.s3.BucketLifecycleRuleTransitionArgs(
                    days=30,
                    storage_class="STANDARD_IA"
                ),
                aws.s3.BucketLifecycleRuleTransitionArgs(
                    days=90,
                    storage_class="GLACIER"
                )
            ],
            expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                days=365
            )
        )
    ],
    tags={**default_tags, "Name": f"{project_name}-logs"}
)

# Block public access for both buckets
assets_bucket_pab = aws.s3.BucketPublicAccessBlock(
    "assets-bucket-pab",
    bucket=assets_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

logs_bucket_pab = aws.s3.BucketPublicAccessBlock(
    "logs-bucket-pab",
    bucket=logs_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# -----------------------------------------------------------------------------
# IAM Roles and Policies
# -----------------------------------------------------------------------------

# EC2 instance role
ec2_assume_role_policy = aws.iam.get_policy_document(
    statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            actions=["sts:AssumeRole"],
            principals=[
                aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["ec2.amazonaws.com"]
                )
            ]
        )
    ]
)

ec2_role = aws.iam.Role(
    "ec2-role",
    name=f"{project_name}-ec2-role",
    assume_role_policy=ec2_assume_role_policy.json,
    tags={**default_tags, "Name": f"{project_name}-ec2-role"}
)

# EC2 instance policy for S3 and CloudWatch
ec2_policy_document = aws.iam.get_policy_document(
    statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            sid="S3Access",
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
            ],
            resources=[
                assets_bucket.arn,
                assets_bucket.arn.apply(lambda arn: f"{arn}/*"),
                logs_bucket.arn,
                logs_bucket.arn.apply(lambda arn: f"{arn}/*")
            ]
        ),
        aws.iam.GetPolicyDocumentStatementArgs(
            sid="CloudWatchLogs",
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
            ],
            resources=["*"]
        ),
        aws.iam.GetPolicyDocumentStatementArgs(
            sid="CloudWatchMetrics",
            actions=[
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics"
            ],
            resources=["*"]
        ),
        aws.iam.GetPolicyDocumentStatementArgs(
            sid="KMSAccess",
            actions=[
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            resources=[s3_kms_key.arn]
        ),
        aws.iam.GetPolicyDocumentStatementArgs(
            sid="SSMParameterStore",
            actions=[
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            resources=["*"]
        )
    ]
)

ec2_policy = aws.iam.Policy(
    "ec2-policy",
    name=f"{project_name}-ec2-policy",
    policy=ec2_policy_document.json
)

ec2_role_policy_attachment = aws.iam.RolePolicyAttachment(
    "ec2-role-policy-attachment",
    role=ec2_role.name,
    policy_arn=ec2_policy.arn
)

# Attach AWS managed policies
aws.iam.RolePolicyAttachment(
    "ec2-ssm-managed-policy",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)

# Instance profile
ec2_instance_profile = aws.iam.InstanceProfile(
    "ec2-instance-profile",
    name=f"{project_name}-ec2-instance-profile",
    role=ec2_role.name
)

# -----------------------------------------------------------------------------
# RDS Database
# -----------------------------------------------------------------------------

# DB subnet group
db_subnet_group = aws.rds.SubnetGroup(
    "db-subnet-group",
    name=f"{project_name}-db-subnet-group",
    subnet_ids=[subnet.id for subnet in database_subnets],
    tags={**default_tags, "Name": f"{project_name}-db-subnet-group"}
)

# DB parameter group
db_parameter_group = aws.rds.ParameterGroup(
    "db-parameter-group",
    name=f"{project_name}-db-params",
    family="postgres14",
    parameters=[
        aws.rds.ParameterGroupParameterArgs(
            name="shared_preload_libraries",
            value="pg_stat_statements"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="log_statement",
            value="all"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="log_duration",
            value="1"
        )
    ],
    tags={**default_tags, "Name": f"{project_name}-db-params"}
)

# RDS instance
rds_instance = aws.rds.Instance(
    "database",
    identifier=f"{project_name}-db",
    engine="postgres",
    engine_version="14.9",
    instance_class="db.t3.medium",
    allocated_storage=100,
    storage_type="gp3",
    storage_encrypted=True,
    kms_key_id=db_kms_key.arn,
    db_name="bankingportal",
    username="dbadmin",
    password=config.require_secret("db_password"),  # Store in Pulumi config as secret
    db_subnet_group_name=db_subnet_group.name,
    vpc_security_group_ids=[db_sg.id],
    parameter_group_name=db_parameter_group.name,
    multi_az=True,
    backup_retention_period=30,
    backup_window="03:00-04:00",
    maintenance_window="sun:04:00-sun:05:00",
    enabled_cloudwatch_logs_exports=["postgresql"],
    deletion_protection=True,
    copy_tags_to_snapshot=True,
    skip_final_snapshot=False,
    final_snapshot_identifier=f"{project_name}-db-final-snapshot",
    tags={**default_tags, "Name": f"{project_name}-database"}
)

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------

# ALB
alb = aws.lb.LoadBalancer(
    "alb",
    name=f"{project_name}-alb",
    load_balancer_type="application",
    subnets=[subnet.id for subnet in public_subnets],
    security_groups=[alb_sg.id],
    enable_deletion_protection=True,
    enable_http2=True,
    enable_cross_zone_load_balancing=True,
    access_logs=aws.lb.LoadBalancerAccessLogsArgs(
        enabled=True,
        bucket=logs_bucket.bucket,
        prefix="alb"
    ),
    tags={**default_tags, "Name": f"{project_name}-alb"}
)

# Target group
target_group = aws.lb.TargetGroup(
    "app-tg",
    name=f"{project_name}-app-tg",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        unhealthy_threshold=2,
        timeout=5,
        interval=30,
        path="/health",
        matcher="200"
    ),
    stickiness=aws.lb.TargetGroupStickinessArgs(
        type="lb_cookie",
        enabled=True,
        cookie_duration=86400
    ),
    deregistration_delay=30,
    tags={**default_tags, "Name": f"{project_name}-app-tg"}
)

# HTTP listener (redirect to HTTPS)
http_listener = aws.lb.Listener(
    "http-listener",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="redirect",
            redirect=aws.lb.ListenerDefaultActionRedirectArgs(
                protocol="HTTPS",
                port="443",
                status_code="HTTP_301"
            )
        )
    ]
)

# For HTTPS listener, we'll use a self-signed certificate for demo
# In production, use ACM certificate
demo_cert = aws.acm.Certificate(
    "demo-cert",
    domain_name=f"*.{project_name}.example.com",
    validation_method="DNS",
    tags={**default_tags, "Name": f"{project_name}-cert"}
)

# HTTPS listener
https_listener = aws.lb.Listener(
    "https-listener",
    load_balancer_arn=alb.arn,
    port=443,
    protocol="HTTPS",
    ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
    certificate_arn=demo_cert.arn,
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ]
)

# -----------------------------------------------------------------------------
# Launch Template and Auto Scaling
# -----------------------------------------------------------------------------

# User data script for EC2 instances
user_data_script = """#!/bin/bash
# Update system
yum update -y

# Install dependencies
yum install -y amazon-cloudwatch-agent
yum install -y nginx

# Configure nginx
cat > /etc/nginx/conf.d/app.conf <<'EOF'
server {
    listen 80;
    server_name _;
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Start nginx
systemctl start nginx
systemctl enable nginx

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOF'
{
  "metrics": {
    "namespace": "BankingPortal",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MemoryUtilization"}
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DiskUtilization"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/banking-portal/nginx/access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/banking-portal/nginx/error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
"""

# Launch template
launch_template = aws.ec2.LaunchTemplate(
    "app-launch-template",
    name=f"{project_name}-app-lt",
    image_id="ami-0c02fb55731490381",  # Amazon Linux 2 AMI
    instance_type="t3.medium",
    key_name=config.get("key_pair_name"),  # Optional SSH key
    vpc_security_group_ids=[app_sg.id],
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        arn=ec2_instance_profile.arn
    ),
    user_data=base64.b64encode(user_data_script.encode()).decode(),
    block_device_mappings=[
        aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
            device_name="/dev/xvda",
            ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                volume_size=20,
                volume_type="gp3",
                encrypted=True,
                kms_key_id=s3_kms_key.arn,
                delete_on_termination=True
            )
        )
    ],
    metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
        http_endpoint="enabled",
        http_tokens="required",  # IMDSv2
        http_put_response_hop_limit=1
    ),
    monitoring=aws.ec2.LaunchTemplateMonitoringArgs(enabled=True),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={**default_tags, "Name": f"{project_name}-app-instance"}
        ),
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="volume",
            tags={**default_tags, "Name": f"{project_name}-app-volume"}
        )
    ]
)

# Auto Scaling Group
asg = aws.autoscaling.Group(
    "app-asg",
    name=f"{project_name}-app-asg",
    vpc_zone_identifiers=[subnet.id for subnet in private_subnets],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    min_size=3,
    max_size=9,
    desired_capacity=3,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
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
            key=k,
            value=v,
            propagate_at_launch=True
        ) for k, v in {**default_tags, "Name": f"{project_name}-app-asg-instance"}.items()
    ]
)

# Auto Scaling Policies
# Scale up policy
scale_up_policy = aws.autoscaling.Policy(
    "scale-up-policy",
    name=f"{project_name}-scale-up",
    scaling_adjustment=1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=asg.name
)

# Scale down policy
scale_down_policy = aws.autoscaling.Policy(
    "scale-down-policy",
    name=f"{project_name}-scale-down",
    scaling_adjustment=-1,
    adjustment_type="ChangeInCapacity",
    cooldown=300,
    autoscaling_group_name=asg.name
)

# -----------------------------------------------------------------------------
# CloudFront Distribution
# -----------------------------------------------------------------------------

# Origin Access Identity for CloudFront
oai = aws.cloudfront.OriginAccessIdentity(
    "oai",
    comment=f"OAI for {project_name}"
)

# S3 bucket policy for CloudFront
assets_bucket_policy = aws.s3.BucketPolicy(
    "assets-bucket-policy",
    bucket=assets_bucket.id,
    policy=Output.all(oai.iam_arn, assets_bucket.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowCloudFrontAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": args[0]
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"{args[1]}/*"
                }
            ]
        })
    )
)

# CloudFront distribution
cdn = aws.cloudfront.Distribution(
    "cdn",
    comment=f"{project_name} CloudFront Distribution",
    enabled=True,
    is_ipv6_enabled=True,
    default_root_object="index.html",
    price_class="PriceClass_100",
    
    origins=[
        # S3 origin for static content
        aws.cloudfront.DistributionOriginArgs(
            domain_name=assets_bucket.bucket_regional_domain_name,
            origin_id="S3-Assets",
            s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                origin_access_identity=oai.cloudfront_access_identity_path
            )
        ),
        # ALB origin for dynamic content
        aws.cloudfront.DistributionOriginArgs(
            domain_name=alb.dns_name,
            origin_id="ALB-Origin",
            custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                http_port=80,
                https_port=443,
                origin_protocol_policy="https-only",
                origin_ssl_protocols=["TLSv1.2"]
            )
        )
    ],
    
    default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
        target_origin_id="ALB-Origin",
        viewer_protocol_policy="redirect-to-https",
        allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cached_methods=["GET", "HEAD"],
        forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
            query_string=True,
            cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                forward="all"
            ),
            headers=["Host", "Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
        ),
        min_ttl=0,
        default_ttl=86400,
        max_ttl=31536000,
        compress=True
    ),
    
    ordered_cache_behaviors=[
        # Cache behavior for static assets
        aws.cloudfront.DistributionOrderedCacheBehaviorArgs(
            path_pattern="/static/*",
            target_origin_id="S3-Assets",
            viewer_protocol_policy="redirect-to-https",
            allowed_methods=["GET", "HEAD"],
            cached_methods=["GET", "HEAD"],
            forwarded_values=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesArgs(
                query_string=False,
                cookies=aws.cloudfront.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs(
                    forward="none"
                )
            ),
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
        cloudfront_default_certificate=True
    ),
    
    web_acl_id="",  # Add WAF Web ACL if needed
    
    logging_config=aws.cloudfront.DistributionLoggingConfigArgs(
        bucket=logs_bucket.bucket_domain_name,
        include_cookies=True,
        prefix="cloudfront/"
    ),
    
    tags={**default_tags, "Name": f"{project_name}-cdn"}
)

# -----------------------------------------------------------------------------
# SNS Topics for Notifications
# -----------------------------------------------------------------------------

# SNS topic for alerts
alert_topic = aws.sns.Topic(
    "alert-topic",
    name=f"{project_name}-alerts",
    kms_master_key_id=s3_kms_key.id,
    tags={**default_tags, "Name": f"{project_name}-alerts"}
)

# SNS topic subscription (email)
alert_email_subscription = aws.sns.TopicSubscription(
    "alert-email-subscription",
    topic=alert_topic.arn,
    protocol="email",
    endpoint=config.require("alert_email")  # Configure in Pulumi config
)

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

# CPU utilization alarm for ASG
cpu_alarm_high = aws.cloudwatch.MetricAlarm(
    "cpu-alarm-high",
    name=f"{project_name}-cpu-high",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=300,
    statistic="Average",
    threshold=75,
    alarm_description="Alarm when CPU exceeds 75%",
    alarm_actions=[scale_up_policy.arn, alert_topic.arn],
    dimensions={
        "AutoScalingGroupName": asg.name
    }
)

cpu_alarm_low = aws.cloudwatch.MetricAlarm(
    "cpu-alarm-low",
    name=f"{project_name}-cpu-low",
    comparison_operator="LessThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=300,
    statistic="Average",
    threshold=25,
    alarm_description="Alarm when CPU is below 25%",
    alarm_actions=[scale_down_policy.arn],
    dimensions={
        "AutoScalingGroupName": asg.name
    }
)

# Database connection count alarm
db_connection_alarm = aws.cloudwatch.MetricAlarm(
    "db-connection-alarm",
    name=f"{project_name}-db-connections",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="DatabaseConnections",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=80,
    alarm_description="Alarm when database connections exceed 80",
    alarm_actions=[alert_topic.arn],
    dimensions={
        "DBInstanceIdentifier": rds_instance.id
    }
)

# ALB target health alarm
target_health_alarm = aws.cloudwatch.MetricAlarm(
    "target-health-alarm",
    name=f"{project_name}-unhealthy-targets",
    comparison_operator="LessThanThreshold",
    evaluation_periods=2,
    metric_name="HealthyHostCount",
    namespace="AWS/ApplicationELB",
    period=60,
    statistic="Average",
    threshold=2,
    alarm_description="Alarm when healthy targets drop below 2",
    alarm_actions=[alert_topic.arn],
    treat_missing_data="breaching",
    dimensions={
        "TargetGroup": target_group.arn_suffix,
        "LoadBalancer": alb.arn_suffix
    }
)

# -----------------------------------------------------------------------------
# AWS Config for Compliance
# -----------------------------------------------------------------------------

# Config recorder role
config_role = aws.iam.Role(
    "config-role",
    name=f"{project_name}-config-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "config.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }),
    tags={**default_tags, "Name": f"{project_name}-config-role"}
)

# Attach AWS managed policy for Config
config_role_policy_attachment = aws.iam.RolePolicyAttachment(
    "config-role-policy",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/ConfigRole"
)

# S3 bucket for Config
config_bucket = aws.s3.Bucket(
    "config-bucket",
    bucket=f"{project_name}-config-{pulumi.get_stack()}",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(enabled=True),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="aws:kms",
                kms_master_key_id=s3_kms_key.arn
            )
        )
    ),
    tags={**default_tags, "Name": f"{project_name}-config"}
)

# Config bucket policy
config_bucket_policy = aws.s3.BucketPolicy(
    "config-bucket-policy",
    bucket=config_bucket.id,
    policy=config_bucket.arn.apply(
        lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSConfigBucketPermissionsCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": arn
                },
                {
                    "Sid": "AWSConfigBucketExistenceCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:ListBucket",
                    "Resource": arn
                },
                {
                    "Sid": "AWSConfigBucketWrite",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"{arn}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                }
            ]
        })
    )
)

# Config delivery channel
config_delivery_channel = aws.cfg.DeliveryChannel(
    "config-delivery-channel",
    name=f"{project_name}-config-delivery",
    s3_bucket_name=config_bucket.bucket,
    snapshot_delivery_properties=aws.cfg.DeliveryChannelSnapshotDeliveryPropertiesArgs(
        delivery_frequency="TwentyFour_Hours"
    )
)

# Config recorder
config_recorder = aws.cfg.Recorder(
    "config-recorder",
    name=f"{project_name}-config-recorder",
    role_arn=config_role.arn,
    recording_group=aws.cfg.RecorderRecordingGroupArgs(
        all_supported=True,
        include_global_resource_types=True
    ),
    opts=ResourceOptions(depends_on=[config_delivery_channel])
)

# Start Config recorder
config_recorder_status = aws.cfg.RecorderStatus(
    "config-recorder-status",
    name=config_recorder.name,
    is_enabled=True,
    opts=ResourceOptions(depends_on=[config_recorder])
)

# Config rules for compliance
# Rule 1: Ensure S3 buckets are encrypted
s3_encryption_rule = aws.cfg.Rule(
    "s3-bucket-encryption",
    name=f"{project_name}-s3-encryption",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
    ),
    opts=ResourceOptions(depends_on=[config_recorder])
)

# Rule 2: Ensure RDS is encrypted
rds_encryption_rule = aws.cfg.Rule(
    "rds-encryption",
    name=f"{project_name}-rds-encryption",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="RDS_STORAGE_ENCRYPTED"
    ),
    opts=ResourceOptions(depends_on=[config_recorder])
)

# Rule 3: Ensure EC2 instances are using IMDSv2
imdsv2_rule = aws.cfg.Rule(
    "ec2-imdsv2",
    name=f"{project_name}-ec2-imdsv2",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="EC2_IMDSV2_CHECK"
    ),
    opts=ResourceOptions(depends_on=[config_recorder])
)

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

# Export the infrastructure outputs
export("vpc_id", vpc.id)
export("cloudfront_domain", cdn.domain_name)
export("cloudfront_distribution_id", cdn.id)
export("alb_dns", alb.dns_name)
export("rds_endpoint", rds_instance.endpoint)
export("rds_port", rds_instance.port)
export("assets_bucket", assets_bucket.bucket)
export("logs_bucket", logs_bucket.bucket)
export("alert_topic_arn", alert_topic.arn)
export("private_subnet_ids", [subnet.id for subnet in private_subnets])
export("public_subnet_ids", [subnet.id for subnet in public_subnets])
export("database_subnet_ids", [subnet.id for subnet in database_subnets])

# Stack status message
pulumi.log.info(f"""
Banking Portal Infrastructure Stack Deployed Successfully!

CloudFront URL: https://{cdn.domain_name}
ALB DNS: {alb.dns_name}
RDS Endpoint: {rds_instance.endpoint}

Please ensure the following:
1. Update DNS records to point to CloudFront distribution
2. Configure SSL certificates for production use
3. Review and update security group rules as needed
4. Configure application deployment pipeline
5. Set up monitoring dashboards in CloudWatch
""")
```

## Key Features Implemented

This comprehensive infrastructure stack includes:

### 🔒 **Security Features**
- KMS encryption for all data at rest
- Security groups with least privilege access
- Private subnets for application and database tiers
- IMDSv2 enforcement for EC2 instances
- AWS Config for continuous compliance monitoring
- IAM roles with minimal required permissions

### 🌐 **High Availability**
- Multi-AZ deployment across 3 availability zones
- Auto Scaling Group for application tier
- Multi-AZ RDS with automatic failover
- Load balancing across multiple instances

### 📊 **Monitoring & Alerting**
- CloudWatch alarms for critical metrics
- SNS notifications for operational alerts
- AWS Config rules for compliance checking
- Comprehensive logging to S3

### 🚀 **Performance Optimization**
- CloudFront CDN for global content delivery
- Auto-scaling based on CPU utilization
- Optimized RDS instance configuration

### 💾 **Data Management**
- Automated database backups with 30-day retention
- S3 lifecycle policies for cost optimization
- Versioning enabled for critical buckets

## Usage Instructions

1. **Prerequisites**:
   ```bash
   pip install pulumi pulumi-aws
   ```

2. **Configuration**:
   ```bash
   pulumi config set db_password <secure-password> --secret
   pulumi config set alert_email <your-email@example.com>
   pulumi config set key_pair_name <optional-ssh-key>
   ```

3. **Deployment**:
   ```bash
   pulumi up
   ```

4. **Verification**:
   - Check the CloudFront URL output for application access
   - Monitor CloudWatch dashboards for system health
   - Verify AWS Config compliance status

This infrastructure provides a robust, secure, and scalable foundation for a banking portal application with enterprise-grade features and financial services compliance considerations.
You're right, let me provide the complete CDKTF Python stack. Here's the full implementation:

```python
#!/usr/bin/env python3

from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import S3BucketServerSideEncryptionConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.db_parameter_group import DbParameterGroup
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.autoscaling_policy import AutoscalingPolicy
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json
import base64
import time


class SecureWebappEnvironmentStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Common tags for all resources
        self.common_tags = {
            "Environment": "Production",
            "Project": "SecureWebApp",
            "ManagedBy": "CDKTF",
            "Owner": "DevOps-Team"
        }

        # AWS Provider
        AwsProvider(self, "AWS", region="us-east-1")

        # Data sources for account and region info
        self.current_account = DataAwsCallerIdentity(self, "current")
        self.current_region = DataAwsRegion(self, "current")

        # Create all resources
        self._create_kms_resources()
        self._create_networking()
        self._create_security_groups()
        self._create_iam_resources()
        self._create_s3_bucket()
        self._create_cloudwatch_resources()
        self._create_rds_database()
        self._create_load_balancer()
        self._create_auto_scaling_group()
        self._create_monitoring_alerts()
        self._create_backup_resources()
        self._create_outputs()

    def _create_kms_resources(self):
        """Create KMS key and alias for encryption"""
        kms_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.current_account.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.current_region.name}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                }
            ]
        }

        self.kms_key = KmsKey(
            self, "encryption-key",
            description="KMS key for secure webapp environment encryption",
            deletion_window_in_days=7,
            policy=json.dumps(kms_policy),
            tags=self.common_tags
        )

        KmsAlias(
            self, "encryption-key-alias",
            name="alias/secure-webapp-key",
            target_key_id=self.kms_key.key_id
        )

    def _create_networking(self):
        """Create VPC, subnets, and networking components"""
        # VPC
        self.vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": "secure-webapp-vpc"}
        )

        # Internet Gateway
        self.igw = InternetGateway(
            self, "igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": "secure-webapp-igw"}
        )

        # Availability zones
        self.availability_zones = ["us-east-1a", "us-east-1b"]

        # Public subnets for ALB
        self.public_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = Subnet(
                self, f"public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"secure-webapp-public-subnet-{i+1}"}
            )
            self.public_subnets.append(subnet)

        # Private subnets for EC2 instances
        self.private_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = Subnet(
                self, f"private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**self.common_tags, "Name": f"secure-webapp-private-subnet-{i+1}"}
            )
            self.private_subnets.append(subnet)

        # Database subnets
        self.db_subnets = []
        for i, az in enumerate(self.availability_zones):
            subnet = Subnet(
                self, f"db-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+20}.0/24",
                availability_zone=az,
                tags={**self.common_tags, "Name": f"secure-webapp-db-subnet-{i+1}"}
            )
            self.db_subnets.append(subnet)

        # NAT Gateways for private subnet internet access
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            eip = Eip(
                self, f"nat-eip-{i+1}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"secure-webapp-nat-eip-{i+1}"}
            )

            nat_gw = NatGateway(
                self, f"nat-gateway-{i+1}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={**self.common_tags, "Name": f"secure-webapp-nat-gateway-{i+1}"}
            )
            self.nat_gateways.append(nat_gw)

        # Route table for public subnets
        self.public_route_table = RouteTable(
            self, "public-rt",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": "secure-webapp-public-rt"}
        )

        Route(
            self, "public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self, f"public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )

        # Private route tables (one per AZ for HA)
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = RouteTable(
                self, f"private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**self.common_tags, "Name": f"secure-webapp-private-rt-{i+1}"}
            )

            Route(
                self, f"private-route-{i+1}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )

            RouteTableAssociation(
                self, f"private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=rt.id
            )

        # Database route table (no internet access)
        self.db_route_table = RouteTable(
            self, "db-rt",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": "secure-webapp-db-rt"}
        )

        for i, subnet in enumerate(self.db_subnets):
            RouteTableAssociation(
                self, f"db-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.db_route_table.id
            )

    def _create_security_groups(self):
        """Create security groups with least privilege access"""
        # ALB Security Group
        self.alb_sg = SecurityGroup(
            self, "alb-sg",
            name="secure-webapp-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=[self.vpc.cidr_block],
                    description="HTTP to EC2 instances"
                )
            ],
            tags={**self.common_tags, "Name": "secure-webapp-alb-sg"}
        )

        # EC2 Security Group
        self.ec2_sg = SecurityGroup(
            self, "ec2-sg",
            name="secure-webapp-ec2-sg",
            description="Security group for EC2 instances",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="HTTP from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP outbound"
                ),
                SecurityGroupEgress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS outbound"
                ),
                SecurityGroupEgress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=[self.vpc.cidr_block],
                    description="MySQL to RDS"
                )
            ],
            tags={**self.common_tags, "Name": "secure-webapp-ec2-sg"}
        )

        # RDS Security Group
        self.rds_sg = SecurityGroup(
            self, "rds-sg",
            name="secure-webapp-rds-sg",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[self.ec2_sg.id],
                    description="MySQL from EC2"
                )
            ],
            tags={**self.common_tags, "Name": "secure-webapp-rds-sg"}
        )

    def _create_iam_resources(self):
        """Create IAM roles and policies following least privilege"""
        # EC2 Instance Role
        ec2_assume_role_policy = {
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
        }

        self.ec2_role = IamRole(
            self, "ec2-role",
            name="secure-webapp-ec2-role",
            assume_role_policy=json.dumps(ec2_assume_role_policy),
            tags=self.common_tags
        )

        # Attach managed policies
        IamRolePolicyAttachment(
            self, "ec2-cloudwatch-policy",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        IamRolePolicyAttachment(
            self, "ec2-ssm-policy",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        # Custom S3 policy
        s3_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": "arn:aws:s3:::secure-webapp-bucket-*/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": "arn:aws:s3:::secure-webapp-bucket-*"
                }
            ]
        }

        IamRolePolicy(
            self, "ec2-s3-policy",
            name="secure-webapp-s3-access",
            role=self.ec2_role.id,
            policy=json.dumps(s3_policy)
        )

        # Instance Profile
        self.instance_profile = IamInstanceProfile(
            self, "ec2-instance-profile",
            name="secure-webapp-instance-profile",
            role=self.ec2_role.name
        )

        # Backup Service Role
        backup_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "backup.amazonaws.com"
                    }
                }
            ]
        }

        self.backup_role = IamRole(
            self, "backup-role",
            name="secure-webapp-backup-role",
            assume_role_policy=json.dumps(backup_assume_role_policy),
            tags=self.common_tags
        )

        IamRolePolicyAttachment(
            self, "backup-policy",
            role=self.backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )

    def _create_s3_bucket(self):
        """Create S3 bucket with security best practices"""
        bucket_suffix = str(int(time.time()))

        self.s3_bucket = S3Bucket(
            self, "app-bucket",
            bucket=f"secure-webapp-bucket-{bucket_suffix}",
            tags=self.common_tags
        )

        # Enable versioning
        S3BucketVersioning(
            self, "bucket-versioning",
            bucket=self.s3_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self, "bucket-pab",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfiguration(
            self, "bucket-encryption",
            bucket=self.s3_bucket.id,
            rule=[{
                "apply_server_side_encryption_by_default": {
                    "kms_master_key_id": self.kms_key.arn,
                    "sse_algorithm": "aws:kms"
                }
            }]
        )

        # Lifecycle configuration
        S3BucketLifecycleConfiguration(
            self, "bucket-lifecycle",
            bucket=self.s3_bucket.id,
            rule=[
                {
                    "id": "transition_to_ia",
                    "status": "Enabled",
                    "transition": [
                        {
                            "days": 30,
                            "storage_class": "STANDARD_IA"
                        }
                    ]
                }
            ]
        )

    def _create_cloudwatch_resources(self):
        """Create CloudWatch log groups"""
        self.app_log_group = CloudwatchLogGroup(
            self, "app-logs",
            name="/aws/ec2/secure-webapp",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags=self.common_tags
        )

    def _create_rds_database(self):
        """Create RDS database with encryption and best practices"""
        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self, "db-subnet-group",
            name="secure-webapp-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.db_subnets],
            tags={**self.common_tags, "Name": "secure-webapp-db-subnet-group"}
        )

        # DB Parameter Group
        self.db_parameter_group = DbParameterGroup(
            self, "db-parameter-group",
            family="mysql8.0",
            name="secure-webapp-db-params",
            description="Parameter group for secure webapp database",
            tags=self.common_tags
        )

        # RDS Instance
        self.rds_instance = DbInstance(
            self, "database",
            identifier="secure-webapp-db",
            engine="mysql",
            engine_version="8.0.35",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="webapp",
            username="admin",
            manage_master_user_password=True,
            master_user_secret_kms_key_id=self.kms_key.arn,
            vpc_security_group_ids=[self.rds_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            parameter_group_name=self.db_parameter_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            multi_az=True,
            deletion_protection=True,
            skip_final_snapshot=False,
            final_snapshot_identifier="secure-webapp-db-final-snapshot",
            copy_tags_to_snapshot=True,
            tags={**self.common_tags, "Name": "secure-webapp-database"}
        )

    def _create_load_balancer(self):
        """Create Application Load Balancer"""
        self.alb = Lb(
            self, "alb",
            name="secure-webapp-alb",
            load_balancer_type="application",
            scheme="internet-facing",
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=True,
            tags={**self.common_tags, "Name": "secure-webapp-alb"}
        )

        # Target Group
        self.target_group = LbTargetGroup(
            self, "tg",
            name="secure-webapp-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "interval": 30,
                "matcher": "200",
                "path": "/health",
                "port": "traffic-port",
                "protocol": "HTTP",
                "timeout": 5,
                "unhealthy_threshold": 2
            },
            tags={**self.common_tags, "Name": "secure-webapp-tg"}
        )

        # Listener
        LbListener(
            self, "alb-listener",
            load_balancer_arn=self.alb.arn,
            port="80",
            protocol="HTTP",
            default_action=[{
                "type": "forward",
                "target_group_arn": self.target_group.arn
            }]
        )

    def _create_auto_scaling_group(self):
        """Create Auto Scaling Group with Launch Template"""
        user_data_script = """#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent httpd

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Create simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Secure Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 20px; background: #e8f5e8; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Secure Web Application</h1>
        <div class="status">
            <h2>Application Status: Running</h2>
            <p>Environment: Production</p>
            <p>Timestamp: $(date)</p>
        </div>
    </div>
</body>
</html>
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/secure-webapp",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/secure-webapp",
                        "log_stream_name": "{instance_id}/httpd/error_log"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "SecureWebApp/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
"""

        user_data_encoded = base64.b64encode(user_data_script.encode()).decode()

        # Launch Template
        self.launch_template = LaunchTemplate(
            self, "launch-template",
            name="secure-webapp-lt",
            description="Launch template for secure webapp",
            image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI
            instance_type="t3.micro",
            vpc_security_group_ids=[self.ec2_sg.id],
            iam_instance_profile={
                "name": self.instance_profile.name
            },
            user_data=user_data_encoded,
            monitoring={
                "enabled": True
            },
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",
                "http_put_response_hop_limit": 1
            },
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {**self.common_tags, "Name": "secure-webapp-instance"}
            }],
            tags={**self.common_tags, "Name": "secure-webapp-launch-template"}
        )

        # Auto Scaling Group
        self.asg = AutoscalingGroup(
            self, "asg",
            name="secure-webapp-asg",
            vpc_zone_identifier=[subnet.id for subnet in self.private_subnets],
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=2,
            max_size=6,
            desired_capacity=2,
            launch_template={
                "id": self.launch_template.id,
                "version": "$Latest"
            },
            tag=[{
                "key": key,
                "value": value,
                "propagate_at_launch": True
            } for key, value in {**self.common_tags, "Name": "secure-webapp-asg"}.items()]
        )

    def _create_monitoring_alerts(self):
        """Create CloudWatch alarms and SNS notifications"""
        # SNS Topic for alerts
        self.alert_topic = SnsTopic(
            self, "alert-topic",
            name="secure-webapp-alerts",
            tags=self.common_tags
        )

        # CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self, "high-cpu-alarm",
            alarm_name="secure-webapp-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alarm when CPU exceeds 80%",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "AutoScalingGroupName": self.asg.name
            },
            tags=self.common_tags
        )

        # ALB Target Health Alarm
        CloudwatchMetricAlarm(
            self, "unhealthy-targets-alarm",
            alarm_name="secure-webapp-unhealthy-targets",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="Alarm when healthy targets < 1",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "TargetGroup": self.target_group.arn_suffix,
                "LoadBalancer": self.alb.arn_suffix
            },
            tags=self.common_tags
        )

        # Auto Scaling Policies
        scale_up_policy = AutoscalingPolicy(
            self, "scale-up-policy
```

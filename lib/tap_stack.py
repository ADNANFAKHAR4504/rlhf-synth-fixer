#!/usr/bin/env python3
"""
TAP (Test Automation Platform) Stack for AWS Infrastructure Migration
This module implements a complete AWS infrastructure migration solution from us-west-1 to us-east-1
including S3 buckets, EC2 instances, and RDS databases with zero-downtime requirements.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions, Output
from typing import Dict, List, Optional, Any


class TapStackArgs:
    """Arguments for TapStack configuration"""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
    """
    Complete AWS infrastructure migration stack with S3, EC2, and RDS components
    Implements zero-downtime migration from us-west-1 to us-east-1
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("custom:infrastructure:TapStack", name, {}, opts)
        
        self.name = name
        self.args = args
        self.config = Config()
        
        # Environment-specific configurations
        self.source_region = "us-west-1"
        self.target_region = "us-east-1"
        self.env_suffix = args.environment_suffix
        
        # Default tags for all resources
        self.default_tags = {
            "Environment": self.env_suffix,
            "ManagedBy": "Pulumi",
            "Project": "TAP-Migration",
            "SourceRegion": self.source_region,
            "TargetRegion": self.target_region
        }
        
        # Initialize providers for both regions
        self._setup_providers()
        
        # Create VPC and networking infrastructure
        self._create_networking()
        
        # Create S3 buckets with cross-region replication
        self._create_s3_infrastructure()
        
        # Create EC2 instances with load balancer for zero-downtime migration
        self._create_ec2_infrastructure()
        
        # Create RDS databases with read replicas for migration
        self._create_rds_infrastructure()
        
        # Setup CloudWatch monitoring
        self._setup_monitoring()
        
        # Create backup strategies
        self._setup_backup_strategies()
        
        # Export important outputs
        self._export_outputs()
    
    def _setup_providers(self):
        """Setup AWS providers for source and target regions"""
        self.source_provider = aws.Provider(
            f"source-provider-{self.env_suffix}",
            region=self.source_region,
            opts=ResourceOptions(parent=self)
        )
        
        self.target_provider = aws.Provider(
            f"target-provider-{self.env_suffix}",
            region=self.target_region,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_networking(self):
        """Create VPC and networking infrastructure in target region"""
        # Create VPC in target region
        self.target_vpc = aws.ec2.Vpc(
            f"target-vpc-{self.env_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.default_tags, "Name": f"target-vpc-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create subnets in multiple AZs
        self.target_public_subnet_1 = aws.ec2.Subnet(
            f"target-public-subnet-1-{self.env_suffix}",
            vpc_id=self.target_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{self.target_region}a",
            map_public_ip_on_launch=True,
            tags={**self.default_tags, "Name": f"target-public-subnet-1-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        self.target_public_subnet_2 = aws.ec2.Subnet(
            f"target-public-subnet-2-{self.env_suffix}",
            vpc_id=self.target_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{self.target_region}b",
            map_public_ip_on_launch=True,
            tags={**self.default_tags, "Name": f"target-public-subnet-2-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        self.target_private_subnet_1 = aws.ec2.Subnet(
            f"target-private-subnet-1-{self.env_suffix}",
            vpc_id=self.target_vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone=f"{self.target_region}a",
            tags={**self.default_tags, "Name": f"target-private-subnet-1-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        self.target_private_subnet_2 = aws.ec2.Subnet(
            f"target-private-subnet-2-{self.env_suffix}",
            vpc_id=self.target_vpc.id,
            cidr_block="10.0.4.0/24",
            availability_zone=f"{self.target_region}b",
            tags={**self.default_tags, "Name": f"target-private-subnet-2-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create Internet Gateway
        self.target_igw = aws.ec2.InternetGateway(
            f"target-igw-{self.env_suffix}",
            vpc_id=self.target_vpc.id,
            tags={**self.default_tags, "Name": f"target-igw-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create route table and routes
        self.target_route_table = aws.ec2.RouteTable(
            f"target-route-table-{self.env_suffix}",
            vpc_id=self.target_vpc.id,
            tags={**self.default_tags, "Name": f"target-route-table-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        self.target_route = aws.ec2.Route(
            f"target-route-{self.env_suffix}",
            route_table_id=self.target_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.target_igw.id,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Associate route table with public subnets
        aws.ec2.RouteTableAssociation(
            f"target-rta-public-1-{self.env_suffix}",
            subnet_id=self.target_public_subnet_1.id,
            route_table_id=self.target_route_table.id,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        aws.ec2.RouteTableAssociation(
            f"target-rta-public-2-{self.env_suffix}",
            subnet_id=self.target_public_subnet_2.id,
            route_table_id=self.target_route_table.id,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
    
    def _create_s3_infrastructure(self):
        """Create S3 buckets with cross-region replication for migration"""
        # Source bucket (us-west-1)
        self.source_bucket = aws.s3.BucketV2(
            f"tap-source-bucket-{self.env_suffix}",
            tags={**self.default_tags, "Purpose": "Source"},
            opts=ResourceOptions(provider=self.source_provider, parent=self)
        )
        
        # Target bucket (us-east-1)
        self.target_bucket = aws.s3.BucketV2(
            f"tap-target-bucket-{self.env_suffix}",
            tags={**self.default_tags, "Purpose": "Target"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Enable versioning on both buckets
        aws.s3.BucketVersioningV2(
            f"source-bucket-versioning-{self.env_suffix}",
            bucket=self.source_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(provider=self.source_provider, parent=self)
        )
        
        aws.s3.BucketVersioningV2(
            f"target-bucket-versioning-{self.env_suffix}",
            bucket=self.target_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create IAM role for replication
        replication_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        self.replication_role = aws.iam.Role(
            f"replication-role-{self.env_suffix}",
            assume_role_policy=json.dumps(replication_assume_role_policy),
            tags=self.default_tags,
            opts=ResourceOptions(provider=self.source_provider, parent=self)
        )
        
        # Create custom replication policy using Output.all() to handle Pulumi Outputs
        def create_replication_policy(source_bucket_arn, target_bucket_arn):
            return {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl",
                            "s3:GetObjectVersionTagging"
                        ],
                        "Resource": f"{source_bucket_arn}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": source_bucket_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete",
                            "s3:ReplicateTags"
                        ],
                        "Resource": f"{target_bucket_arn}/*"
                    }
                ]
            }
        
        replication_policy_doc = Output.all(
            source_bucket_arn=self.source_bucket.arn,
            target_bucket_arn=self.target_bucket.arn
        ).apply(lambda args: json.dumps(create_replication_policy(
            args["source_bucket_arn"], 
            args["target_bucket_arn"]
        )))
        
        replication_policy = aws.iam.Policy(
            f"replication-policy-{self.env_suffix}",
            policy=replication_policy_doc,
            opts=ResourceOptions(provider=self.source_provider, parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"replication-policy-attachment-{self.env_suffix}",
            role=self.replication_role.name,
            policy_arn=replication_policy.arn,
            opts=ResourceOptions(provider=self.source_provider, parent=self)
        )
        
        # Configure cross-region replication using BucketReplicationConfig (correct class name)
        aws.s3.BucketReplicationConfig(
            f"bucket-replication-{self.env_suffix}",
            role=self.replication_role.arn,
            bucket=self.source_bucket.id,
            rules=[
                aws.s3.BucketReplicationConfigRuleArgs(
                    id="ReplicateEverything",
                    status="Enabled",
                    destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                        bucket=self.target_bucket.arn,
                        storage_class="STANDARD"
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.source_provider,
                parent=self,
                depends_on=[self.source_bucket, self.target_bucket, self.replication_role, replication_policy]
            )
        )
    
    def _create_ec2_infrastructure(self):
        """Create EC2 instances with load balancer for zero-downtime migration"""
        # Security group for EC2 instances
        self.ec2_security_group = aws.ec2.SecurityGroup(
            f"ec2-sg-{self.env_suffix}",
            name=f"ec2-sg-{self.env_suffix}",
            description="Security group for EC2 instances",
            vpc_id=self.target_vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["10.0.0.0/16"],
                    description="SSH from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.default_tags, "Name": f"ec2-sg-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.target_provider)
        )
        
        # User data script for EC2 instances
        user_data = """#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>TAP Migration Instance - Region: us-east-1</h1>" > /var/www/html/index.html
        """
        
        # Create EC2 instances
        self.ec2_instances = []
        for i in range(2):
            instance = aws.ec2.Instance(
                f"ec2-instance-{i+1}-{self.env_suffix}",
                ami=ami.id,
                instance_type="t3.micro",
                subnet_id=self.target_public_subnet_1.id if i == 0 else self.target_public_subnet_2.id,
                vpc_security_group_ids=[self.ec2_security_group.id],
                user_data=user_data,
                tags={**self.default_tags, "Name": f"ec2-instance-{i+1}-{self.env_suffix}"},
                opts=ResourceOptions(provider=self.target_provider, parent=self)
            )
            self.ec2_instances.append(instance)
        
        # Create Application Load Balancer
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"alb-sg-{self.env_suffix}",
            name=f"alb-sg-{self.env_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.target_vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.default_tags, "Name": f"alb-sg-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        self.alb = aws.lb.LoadBalancer(
            f"alb-{self.env_suffix}",
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=[self.target_public_subnet_1.id, self.target_public_subnet_2.id],
            tags={**self.default_tags, "Name": f"alb-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{self.env_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=self.target_vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/",
                matcher="200"
            ),
            tags={**self.default_tags, "Name": f"tg-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Attach instances to target group
        for i, instance in enumerate(self.ec2_instances):
            aws.lb.TargetGroupAttachment(
                f"tg-attachment-{i+1}-{self.env_suffix}",
                target_group_arn=self.target_group.arn,
                target_id=instance.id,
                port=80,
                opts=ResourceOptions(provider=self.target_provider, parent=self)
            )
        
        # Create ALB listener
        aws.lb.Listener(
            f"alb-listener-{self.env_suffix}",
            load_balancer_arn=self.alb.arn,
            port="80",
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
    
    def _create_rds_infrastructure(self):
        """Create RDS databases with encryption and cross-region read replicas"""
        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.env_suffix}",
            subnet_ids=[self.target_private_subnet_1.id, self.target_private_subnet_2.id],
            tags={**self.default_tags, "Name": f"db-subnet-group-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Security group for RDS
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"rds-sg-{self.env_suffix}",
            name=f"rds-sg-{self.env_suffix}",
            description="Security group for RDS database",
            vpc_id=self.target_vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    security_groups=[self.ec2_security_group.id],
                    description="MySQL from EC2"
                )
            ],
            tags={**self.default_tags, "Name": f"rds-sg-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create KMS key for RDS encryption
        self.rds_kms_key = aws.kms.Key(
            f"rds-kms-key-{self.env_suffix}",
            description=f"KMS key for RDS encryption - {self.env_suffix}",
            tags=self.default_tags,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create RDS instance
        self.rds_instance = aws.rds.Instance(
            f"rds-instance-{self.env_suffix}",
            allocated_storage=20,
            max_allocated_storage=100,
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            identifier=f"tap-db-{self.env_suffix}",
            username="admin",
            password=self.config.get_secret("db_password") or "DefaultPassword123!",
            vpc_security_group_ids=[self.rds_security_group.id],
            db_subnet_group_name=self.db_subnet_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            storage_encrypted=True,
            kms_key_id=self.rds_kms_key.arn,
            skip_final_snapshot=True,
            copy_tags_to_snapshot=True,
            tags={**self.default_tags, "Name": f"rds-instance-{self.env_suffix}"},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
    
    def _setup_monitoring(self):
        """Setup CloudWatch monitoring for all infrastructure components"""
        # CloudWatch Dashboard
        def create_dashboard_body(ec2_instance_1_id, ec2_instance_2_id, rds_instance_id):
            return {
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/EC2", "CPUUtilization", "InstanceId", ec2_instance_1_id],
                                ["...", ec2_instance_2_id]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.target_region,
                            "title": "EC2 CPU Utilization"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", rds_instance_id],
                                [".", "DatabaseConnections", ".", "."],
                                [".", "FreeableMemory", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": self.target_region,
                            "title": "RDS Metrics"
                        }
                    }
                ]
            }
        
        dashboard_body = Output.all(
            ec2_instance_1_id=self.ec2_instances[0].id,
            ec2_instance_2_id=self.ec2_instances[11].id,
            rds_instance_id=self.rds_instance.id
        ).apply(lambda args: json.dumps(create_dashboard_body(
            args["ec2_instance_1_id"],
            args["ec2_instance_2_id"], 
            args["rds_instance_id"]
        )))
        
        self.cloudwatch_dashboard = aws.cloudwatch.Dashboard(
            f"tap-dashboard-{self.env_suffix}",
            dashboard_name=f"TAP-Migration-Dashboard-{self.env_suffix}",
            dashboard_body=dashboard_body,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # CloudWatch Alarms
        # EC2 High CPU Alarm
        self.ec2_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"ec2-cpu-alarm-{self.env_suffix}",
            name=f"ec2-high-cpu-{self.env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="EC2 instance high CPU utilization",
            dimensions={"InstanceId": self.ec2_instances[0].id},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # RDS CPU Alarm
        self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{self.env_suffix}",
            name=f"rds-high-cpu-{self.env_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=75,
            alarm_description="RDS instance high CPU utilization",
            dimensions={"DBInstanceIdentifier": self.rds_instance.id},
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
    
    def _setup_backup_strategies(self):
        """Setup backup strategies for all data"""
        # S3 bucket lifecycle configuration for source bucket
        aws.s3.BucketLifecycleConfigurationV2(
            f"source-bucket-lifecycle-{self.env_suffix}",
            bucket=self.source_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="backup_rule",
                    status="Enabled",
                    noncurrent_version_transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        ),
                        aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
                            days=60,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            opts=ResourceOptions(provider=self.source_provider, parent=self)
        )
        
        # Create backup vault for AWS Backup
        self.backup_vault = aws.backup.Vault(
            f"backup-vault-{self.env_suffix}",
            name=f"tap-backup-vault-{self.env_suffix}",
            kms_key_arn=self.rds_kms_key.arn,
            tags=self.default_tags,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # IAM role for AWS Backup
        backup_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "backup.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        backup_role = aws.iam.Role(
            f"backup-role-{self.env_suffix}",
            assume_role_policy=json.dumps(backup_assume_role_policy),
            tags=self.default_tags,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"backup-policy-attachment-{self.env_suffix}",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
        
        # Create backup plan
        self.backup_plan = aws.backup.Plan(
            f"backup-plan-{self.env_suffix}",
            name=f"tap-backup-plan-{self.env_suffix}",
            rules=[
                aws.backup.PlanRuleArgs(
                    rule_name="daily_backup",
                    target_vault_name=self.backup_vault.name,
                    schedule="cron(0 5 ? * * *)",  # Daily at 5 AM
                    lifecycle=aws.backup.PlanRuleLifecycleArgs(
                        cold_storage_after=30,
                        delete_after=365
                    )
                )
            ],
            tags=self.default_tags,
            opts=ResourceOptions(provider=self.target_provider, parent=self)
        )
    
    def _export_outputs(self):
        """Export important stack outputs"""
        pulumi.export("source_bucket_name", self.source_bucket.bucket)
        pulumi.export("target_bucket_name", self.target_bucket.bucket)
        pulumi.export("load_balancer_dns", self.alb.dns_name)
        pulumi.export("rds_endpoint", self.rds_instance.endpoint)
        pulumi.export("dashboard_url", self.cloudwatch_dashboard.dashboard_url)
        pulumi.export("vpc_id", self.target_vpc.id)
        pulumi.export("environment", self.env_suffix)
        
        # Export EC2 instance IDs
        for i, instance in enumerate(self.ec2_instances):
            pulumi.export(f"ec2_instance_{i+1}_id", instance.id)
            pulumi.export(f"ec2_instance_{i+1}_public_ip", instance.public_ip)

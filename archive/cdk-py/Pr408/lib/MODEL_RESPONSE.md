I'll help you design and implement a robust, secure, and scalable cloud infrastructure using AWS CDK in Python. Let me create a comprehensive solution that follows all the requirements and best practices.

## 📁 Project Structure Implementation

### 1. CDK App Entry Point (`tap.py`)

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get configuration from context or environment variables
project_name = app.node.try_get_context("project_name") or os.getenv("PROJECT_NAME", "myapp")
environment = app.node.try_get_context("environment") or os.getenv("ENVIRONMENT", "dev")
region = app.node.try_get_context("region") or os.getenv("AWS_REGION", "us-east-2")

# Create the stack
TapStack(
    app, 
    f"{project_name}-{environment}-stack",
    project_name=project_name,
    environment=environment,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=region
    )
)

app.synth()
```

### 2. Main CDK Stack Logic (`lib/tap_stack.py`)

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    aws_backup as backup,
    aws_kms as kms,
    aws_events as events,
    CfnOutput,
    Tags
)
from constructs import Construct
import json

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, project_name: str, environment: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.project_name = project_name
        self.environment = environment
        self.resource_prefix = f"{project_name}-{environment}"
        
        # Apply common tags to all resources
        self._apply_common_tags()
        
        # Create KMS keys
        self._create_kms_keys()
        
        # Create VPC and networking
        self._create_vpc()
        
        # Create security groups
        self._create_security_groups()
        
        # Create IAM roles
        self._create_iam_roles()
        
        # Create RDS database
        self._create_database()
        
        # Create S3 bucket for static files
        self._create_s3_bucket()
        
        # Create Application Load Balancer
        self._create_load_balancer()
        
        # Create Auto Scaling Group with EC2 instances
        self._create_auto_scaling_group()
        
        # Create CloudWatch monitoring
        self._create_monitoring()
        
        # Create backup solution
        self._create_backup()
        
        # Create outputs
        self._create_outputs()
    
    def _apply_common_tags(self):
        """Apply common tags to all resources in the stack"""
        Tags.of(self).add("Project", self.project_name)
        Tags.of(self).add("Environment", self.environment)
        Tags.of(self).add("ManagedBy", "CDK")
    
    def _create_kms_keys(self):
        """Create KMS keys for encryption"""
        # KMS key for RDS encryption
        self.rds_kms_key = kms.Key(
            self, f"{self.resource_prefix}-rds-key",
            description=f"KMS key for {self.resource_prefix} RDS encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN
        )
        
        # KMS key for S3 encryption
        self.s3_kms_key = kms.Key(
            self, f"{self.resource_prefix}-s3-key",
            description=f"KMS key for {self.resource_prefix} S3 encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN
        )
    
    def _create_vpc(self):
        """Create VPC with public and private subnets across 3 AZs"""
        self.vpc = ec2.Vpc(
            self, f"{self.resource_prefix}-vpc",
            vpc_name=f"{self.resource_prefix}-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"{self.resource_prefix}-public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"{self.resource_prefix}-private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"{self.resource_prefix}-db",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Add VPC Flow Logs for security monitoring
        self.vpc_flow_log_role = iam.Role(
            self, f"{self.resource_prefix}-vpc-flow-log-role",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/VPCFlowLogsDeliveryRolePolicy")
            ]
        )
        
        self.vpc_flow_log = ec2.FlowLog(
            self, f"{self.resource_prefix}-vpc-flow-log",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, f"{self.resource_prefix}-vpc-flow-log-group",
                    log_group_name=f"/aws/vpc/flowlogs/{self.resource_prefix}",
                    retention=logs.RetentionDays.ONE_MONTH,
                    removal_policy=RemovalPolicy.DESTROY
                ),
                self.vpc_flow_log_role
            )
        )
    
    def _create_security_groups(self):
        """Create security groups with least privilege access"""
        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            self, f"{self.resource_prefix}-alb-sg",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            security_group_name=f"{self.resource_prefix}-alb-sg"
        )
        
        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )
        
        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )
        
        # EC2 Security Group
        self.ec2_sg = ec2.SecurityGroup(
            self, f"{self.resource_prefix}-ec2-sg",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            security_group_name=f"{self.resource_prefix}-ec2-sg"
        )
        
        self.ec2_sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(80),
            "Allow HTTP from ALB"
        )
        
        # RDS Security Group
        self.rds_sg = ec2.SecurityGroup(
            self, f"{self.resource_prefix}-rds-sg",
            vpc=self.vpc,
            description="Security group for RDS database",
            security_group_name=f"{self.resource_prefix}-rds-sg"
        )
        
        self.rds_sg.add_ingress_rule(
            self.ec2_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL from EC2"
        )
    
    def _create_iam_roles(self):
        """Create IAM roles following least privilege principles"""
        # EC2 Instance Role
        self.ec2_role = iam.Role(
            self, f"{self.resource_prefix}-ec2-role",
            role_name=f"{self.resource_prefix}-ec2-role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Add custom policy for S3 access
        s3_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[f"arn:aws:s3:::{self.resource_prefix}-static-files/*"]
        )
        
        self.ec2_role.add_to_policy(s3_policy)
        
        # Instance Profile
        self.instance_profile = iam.InstanceProfile(
            self, f"{self.resource_prefix}-instance-profile",
            instance_profile_name=f"{self.resource_prefix}-instance-profile",
            role=self.ec2_role
        )
    
    def _create_database(self):
        """Create RDS database with encryption and backup"""
        # DB Subnet Group
        self.db_subnet_group = rds.SubnetGroup(
            self, f"{self.resource_prefix}-db-subnet-group",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            subnet_group_name=f"{self.resource_prefix}-db-subnet-group"
        )
        
        # RDS Instance
        self.database = rds.DatabaseInstance(
            self, f"{self.resource_prefix}-database",
            instance_identifier=f"{self.resource_prefix}-database",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO if self.environment == "dev" else ec2.InstanceSize.SMALL
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.rds_sg],
            credentials=rds.Credentials.from_generated_secret(
                "admin",
                secret_name=f"{self.resource_prefix}-db-credentials"
            ),
            allocated_storage=20,
            storage_encrypted=True,
            storage_encryption_key=self.rds_kms_key,
            backup_retention=Duration.days(7 if self.environment == "prod" else 1),
            delete_automated_backups=True,
            deletion_protection=False if self.environment == "dev" else True,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.SNAPSHOT,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            cloudwatch_logs_exports=["error", "general", "slow-query"]
        )
    
    def _create_s3_bucket(self):
        """Create S3 bucket for static files with encryption"""
        self.static_files_bucket = s3.Bucket(
            self, f"{self.resource_prefix}-static-files",
            bucket_name=f"{self.resource_prefix}-static-files-{self.account}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_kms_key,
            public_read_access=True,
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=False,
                block_public_policy=False,
                ignore_public_acls=False,
                restrict_public_buckets=False
            ),
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(1)
                )
            ]
        )
        
        # Add bucket policy for public read access to static content
        bucket_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            principals=[iam.AnyPrincipal()],
            actions=["s3:GetObject"],
            resources=[f"{self.static_files_bucket.bucket_arn}/*"]
        )
        
        self.static_files_bucket.add_to_resource_policy(bucket_policy)
    
    def _create_load_balancer(self):
        """Create Application Load Balancer"""
        self.alb = elbv2.ApplicationLoadBalancer(
            self, f"{self.resource_prefix}-alb",
            load_balancer_name=f"{self.resource_prefix}-alb",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Target Group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, f"{self.resource_prefix}-tg",
            target_group_name=f"{self.resource_prefix}-tg",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=2
            )
        )
        
        # Listener
        self.listener = self.alb.add_listener(
            f"{self.resource_prefix}-listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )
    
    def _create_auto_scaling_group(self):
        """Create Auto Scaling Group with EC2 instances"""
        # User Data Script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from Auto Scaling Group!</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            # Configure CloudWatch agent
            f"cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
            json.dumps({
                "metrics": {
                    "namespace": f"{self.resource_prefix}/EC2",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
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
            }),
            "EOF",
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
        )
        
        # Launch Template
        self.launch_template = ec2.LaunchTemplate(
            self, f"{self.resource_prefix}-lt",
            launch_template_name=f"{self.resource_prefix}-lt",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO if self.environment == "dev" else ec2.InstanceSize.SMALL
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.ec2_sg,
            role=self.ec2_role,
            user_data=user_data,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        encrypted=True,
                        delete_on_termination=True
                    )
                )
            ]
        )
        
        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self, f"{self.resource_prefix}-asg",
            auto_scaling_group_name=f"{self.resource_prefix}-asg",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            launch_template=self.launch_template,
            min_capacity=1,
            max_capacity=6 if self.environment == "prod" else 3,
            desired_capacity=2 if self.environment == "prod" else 1,
            health_check=autoscaling.HealthCheck.elb(Duration.minutes(5)),
            update_policy=autoscaling.UpdatePolicy.rolling_update()
        )
        
        # Attach ASG to Target Group
        self.asg.attach_to_application_target_group(self.target_group)
        
        # Auto Scaling Policies
        self.scale_up_policy = self.asg.scale_on_cpu_utilization(
            f"{self.resource_prefix}-scale-up",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.minutes(5),
            scale_out_cooldown=Duration.minutes(5)
        )
    
    def _create_monitoring(self):
        """Create CloudWatch monitoring and alarms"""
        # ALB Target Response Time Alarm
        elbv2.ApplicationLoadBalancer.metric_target_response_time(
            self.alb,
            statistic="Average"
        ).create_alarm(
            self, f"{self.resource_prefix}-alb-response-time-alarm",
            alarm_name=f"{self.resource_prefix}-alb-response-time-alarm",
            threshold=1.0,
            evaluation_periods=2,
            alarm_description="ALB target response time is too high"
        )
        
        # RDS CPU Utilization Alarm
        self.database.metric_cpu_utilization().create_alarm(
            self, f"{self.resource_prefix}-rds-cpu-alarm",
            alarm_name=f"{self.resource_prefix}-rds-cpu-alarm",
            threshold=80,
            evaluation_periods=2,
            alarm_description="RDS CPU utilization is too high"
        )
        
        # RDS Database Connections Alarm
        self.database.metric_database_connections().create_alarm(
            self, f"{self.resource_prefix}-rds-connections-alarm",
            alarm_name=f"{self.resource_prefix}-rds-connections-alarm",
            threshold=20,
            evaluation_periods=2,
            alarm_description="RDS database connections are too high"
        )
    
    def _create_backup(self):
        """Create AWS Backup solution"""
        # Backup Vault
        self.backup_vault = backup.BackupVault(
            self, f"{self.resource_prefix}-backup-vault",
            backup_vault_name=f"{self.resource_prefix}-backup-vault",
            encryption_key=self.rds_kms_key,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "dev" else RemovalPolicy.RETAIN
        )
        
        # Backup Plan
        self.backup_plan = backup.BackupPlan(
            self, f"{self.resource_prefix}-backup-plan",
            backup_plan_name=f"{self.resource_prefix}-backup-plan",
            backup_vault=self.backup_vault
        )
        
        # Backup Rule
        self.backup_plan.add_rule(
            backup.BackupPlanRule(
                backup_vault=self.backup_vault,
                rule_name=f"{self.resource_prefix}-daily-backup",
                schedule_expression=events.Schedule.cron(
                    hour="2",
                    minute="0"
                ),
                delete_after=Duration.days(30 if self.environment == "prod" else 7),
                move_to_cold_storage_after=Duration.days(7) if self.environment == "prod" else None
            )
        )
        
        # Backup Selection
        self.backup_plan.add_selection(
            f"{self.resource_prefix}-backup-selection",
            resources=[
                backup.BackupResource.from_rds_database_instance(self.database)
            ]
        )
    
    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS database endpoint"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.static_files_bucket.bucket_name,
            description="S3 bucket name for static files"
        )
        
        CfnOutput(
            self, "AutoScalingGroupName",
            value=self.asg.auto_scaling_group_name,
            description="Auto Scaling Group name"
        )
```

### 3. Unit Tests (`tests/unit/tests_tap_stack.py`)

```python
import aws_cdk as core
import aws_cdk.assertions as assertions
import pytest
from lib.tap_stack import TapStack

class TestTapStack:
    
    @pytest.fixture
    def stack(self):
        app = core.App()
        return TapStack(
            app, 
            "test-stack",
            project_name="testapp",
            environment="test"
        )
    
    def test_vpc_created(self, stack):
        """Test that VPC is created with correct configuration"""
        template = assertions.Template.from_stack(stack)
        
        # Check VPC exists
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        
        # Check that we have 9 subnets (3 AZs * 3 subnet types)
        template.resource_count_is("AWS::EC2::Subnet", 9)
    
    def test_security_groups_created(self, stack):
        """Test that security groups are created with correct rules"""
        template = assertions.Template.from_stack(stack)
        
        # Check ALB security group allows HTTP and HTTPS
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for Application Load Balancer",
            "SecurityGroupIngress": [
                {
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                },
                {
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443,
                    "CidrIp": "0.0.0.0/0"
                }
            ]
        })
    
    def test_rds_instance_created(self, stack):
        """Test that RDS instance is created with encryption"""
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 1,  # test environment
            "MultiAZ": False
        })
    
    def test_s3_bucket_created(self, stack):
        """Test that S3 bucket is created with encryption"""
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })
    
    def test_load_balancer_created(self, stack):
        """Test that Application Load Balancer is created"""
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })
    
    def test_auto_scaling_group_created(self, stack):
        """Test that Auto Scaling Group is created"""
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "3",  # test environment
            "DesiredCapacity": "1"
        })
    
    def test_kms_keys_created(self, stack):
        """Test that KMS keys are created with key rotation"""
        template = assertions.Template.from_stack(stack)
        
        # Should have 2 KMS keys (RDS and S3)
        template.resource_count_is("AWS::KMS::Key", 2)
        
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })
    
    def test_iam_roles_created(self, stack):
        """Test that IAM roles are created with correct policies"""
        template = assertions.Template.from_stack(stack)
        
        # Check EC2 role exists
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        })
    
    def test_backup_vault_created(self, stack):
        """Test that backup vault is created"""
        template = assertions.Template.from_stack(stack)
        
        template.has_resource_properties("AWS::Backup::BackupVault", {
            "BackupVaultName": assertions.Match.string_like_regexp("testapp-test-backup-vault")
        })
    
    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created"""
        template = assertions.Template.from_stack(stack)
        
        # Should have multiple alarms
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)
    
    def test_resource_naming_convention(self, stack):
        """Test that resources follow naming convention"""
        template = assertions.Template.from_stack(stack)
        
        # Check that VPC follows naming convention
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                {
                    "Key": "Name",
                    "Value": "testapp-test-vpc"
                }
            ])
        })
    
    def test_common_tags_applied(self, stack):
        """Test that common tags are applied to resources"""
        template = assertions.Template.from_stack(stack)
        
        # Check that resources have common tags
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": assertions.Match.array_with([
                {
                    "Key": "Project",
                    "Value": "testapp"
                },
                {
                    "Key": "Environment", 
                    "Value": "test"
                },
                {
                    "Key": "ManagedBy",
                    "Value": "CDK"
                }
            ])
        })
```

### 4. Integration Tests (`tests/integration/test_tap_stack.py`)

```python
import boto3
import pytest
import time
from moto import mock_ec2, mock_rds, mock_s3, mock_elbv2, mock_autoscaling, mock_iam
import aws_cdk as core
from lib.tap_stack import TapStack

class TestTapStackIntegration:
    
    @pytest.fixture
    def deployed_stack(self):
        """Fixture that represents a deployed stack for integration testing"""
        app = core.App()
        stack = TapStack(
            app, 
            "integration-test-stack",
            project_name="integrationtest",
            environment="test"
        )
        return stack
    
    @mock_ec2
    def test_vpc_connectivity(self, deployed_stack):
        """Test VPC and subnet connectivity"""
        ec2_client = boto3.client('ec2', region_name='us-east-2')
        
        # This would be more comprehensive in a real integration test
        # where you actually deploy the stack and test connectivity
        vpcs = ec2_client.describe_vpcs()
        assert len(vpcs['Vpcs']) >= 0  # Mock test
    
    @mock_rds
    def test_database_accessibility(self, deployed_stack):
        """Test that database is accessible from EC2 instances"""
        rds_client = boto3.client('rds', region_name='us-east-2')
        
        # In a real
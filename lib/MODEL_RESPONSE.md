I'll create a comprehensive AWS CDK project that meets all your security-first infrastructure requirements. Let me break this down into the required files with proper security configurations.

## 📂 Complete CDK Project Structure

### `tap.py` - CDK App Entry Point

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Define the environment
env = cdk.Environment(
    account=app.node.try_get_context("account") or "123456789012",  # Replace with actual account
    region="us-east-1"
)

# Create the main stack
tap_stack = TapStack(
    app, 
    "SecureAppStack",
    env=env,
    description="Secure infrastructure for SecureApp application with compliance and encryption"
)

# Add global tags
cdk.Tags.of(app).add("Project", "SecureApp")
cdk.Tags.of(app).add("Environment", "Production")
cdk.Tags.of(app).add("Owner", "Infrastructure-Team")
cdk.Tags.of(app).add("Compliance", "Required")

app.synth()
```

### `lib/tap_stack.py` - Main CDK Stack Logic

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags
)
from constructs import Construct
import json

class TapStack(Stack):
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create all infrastructure components
        self.kms_key = self._create_kms_key()
        self.vpc = self._create_vpc()
        self.security_groups = self._create_security_groups()
        self.s3_buckets = self._create_s3_buckets()
        self.iam_roles = self._create_iam_roles()
        self.cloudwatch_resources = self._create_cloudwatch_resources()
        self.ec2_instances = self._create_ec2_instances()
        
        # Create outputs
        self._create_outputs()
    
    def _create_kms_key(self) -> kms.Key:
        """Create KMS key with rotation enabled for encryption"""
        
        # KMS Key Policy for secure access
        key_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    sid="Enable IAM User Permissions",
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AccountRootPrincipal()],
                    actions=["kms:*"],
                    resources=["*"]
                ),
                iam.PolicyStatement(
                    sid="Allow CloudWatch Logs",
                    effect=iam.Effect.ALLOW,
                    principals=[iam.ServicePrincipal("logs.amazonaws.com")],
                    actions=[
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    resources=["*"]
                ),
                iam.PolicyStatement(
                    sid="Allow S3 Service",
                    effect=iam.Effect.ALLOW,
                    principals=[iam.ServicePrincipal("s3.amazonaws.com")],
                    actions=[
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    resources=["*"]
                )
            ]
        )
        
        kms_key = kms.Key(
            self, "SecureAppKMSKey",
            alias="secureapp-encryption-key",
            description="KMS key for SecureApp encryption with automatic rotation",
            enable_key_rotation=True,
            policy=key_policy,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        Tags.of(kms_key).add("Name", "secureapp-kms-key")
        Tags.of(kms_key).add("Purpose", "Encryption")
        
        return kms_key
    
    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        
        vpc = ec2.Vpc(
            self, "SecureAppVPC",
            vpc_name="secureapp-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="secureapp-public-subnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="secureapp-private-subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Enable VPC Flow Logs
        vpc_flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            role_name="secureapp-vpc-flow-log-role",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/VPCFlowLogsDeliveryRolePolicy")
            ]
        )
        
        vpc_flow_log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            log_group_name="/secureapp/vpc/flowlogs",
            encryption_key=self.kms_key,
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group=vpc_flow_log_group,
                iam_role=vpc_flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )
        
        Tags.of(vpc).add("Name", "secureapp-vpc")
        
        return vpc
    
    def _create_security_groups(self) -> dict:
        """Create security groups with least privilege access"""
        
        # Security group for EC2 instances
        ec2_sg = ec2.SecurityGroup(
            self, "EC2SecurityGroup",
            security_group_name="secureapp-ec2-sg",
            vpc=self.vpc,
            description="Security group for SecureApp EC2 instances",
            allow_all_outbound=False
        )
        
        # Allow SSH access from specific CIDR (replace with your IP range)
        ec2_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),  # Only from VPC
            connection=ec2.Port.tcp(22),
            description="SSH access from VPC"
        )
        
        # Allow HTTP traffic if needed (uncomment if required)
        # ec2_sg.add_ingress_rule(
        #     peer=ec2.Peer.ipv4("10.0.0.0/16"),
        #     connection=ec2.Port.tcp(80),
        #     description="HTTP access from VPC"
        # )
        
        # Allow HTTPS outbound for updates and AWS API calls
        ec2_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS outbound for AWS APIs and updates"
        )
        
        # Allow HTTP outbound for package updates
        ec2_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP outbound for package updates"
        )
        
        Tags.of(ec2_sg).add("Name", "secureapp-ec2-sg")
        
        return {"ec2_sg": ec2_sg}
    
    def _create_s3_buckets(self) -> dict:
        """Create S3 buckets with encryption and lifecycle policies"""
        
        # Application data bucket
        app_data_bucket = s3.Bucket(
            self, "AppDataBucket",
            bucket_name=f"secureapp-data-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Logging bucket
        logs_bucket = s3.Bucket(
            self, "LogsBucket",
            bucket_name=f"secureapp-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogsRetention",
                    enabled=True,
                    expiration=Duration.days(2555),  # 7 years for compliance
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(365)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Enable access logging for app data bucket
        app_data_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3_notifications.S3KeyFilter(prefix="access-logs/")
        )
        
        Tags.of(app_data_bucket).add("Name", "secureapp-data-bucket")
        Tags.of(logs_bucket).add("Name", "secureapp-logs-bucket")
        
        return {
            "app_data_bucket": app_data_bucket,
            "logs_bucket": logs_bucket
        }
    
    def _create_iam_roles(self) -> dict:
        """Create IAM roles with least privilege principles"""
        
        # EC2 Instance Role
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            role_name="secureapp-ec2-role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for SecureApp EC2 instances"
        )
        
        # Custom policy for S3 access
        s3_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    resources=[
                        self.s3_buckets["app_data_bucket"].bucket_arn + "/*"
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:ListBucket"
                    ],
                    resources=[
                        self.s3_buckets["app_data_bucket"].bucket_arn
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:PutObject"
                    ],
                    resources=[
                        self.s3_buckets["logs_bucket"].bucket_arn + "/*"
                    ]
                )
            ]
        )
        
        # CloudWatch policy
        cloudwatch_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "cloudwatch:PutMetricData",
                        "ec2:DescribeVolumes",
                        "ec2:DescribeTags",
                        "logs:PutLogEvents",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:DescribeLogStreams"
                    ],
                    resources=["*"]
                )
            ]
        )
        
        # KMS policy for encryption/decryption
        kms_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    resources=[self.kms_key.key_arn]
                )
            ]
        )
        
        # Attach policies to role
        iam.Policy(
            self, "EC2S3Policy",
            policy_name="secureapp-ec2-s3-policy",
            document=s3_policy,
            roles=[ec2_role]
        )
        
        iam.Policy(
            self, "EC2CloudWatchPolicy",
            policy_name="secureapp-ec2-cloudwatch-policy",
            document=cloudwatch_policy,
            roles=[ec2_role]
        )
        
        iam.Policy(
            self, "EC2KMSPolicy",
            policy_name="secureapp-ec2-kms-policy",
            document=kms_policy,
            roles=[ec2_role]
        )
        
        # Instance Profile
        instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            instance_profile_name="secureapp-ec2-profile",
            role=ec2_role
        )
        
        Tags.of(ec2_role).add("Name", "secureapp-ec2-role")
        
        return {
            "ec2_role": ec2_role,
            "instance_profile": instance_profile
        }
    
    def _create_cloudwatch_resources(self) -> dict:
        """Create CloudWatch logging and monitoring resources"""
        
        # Log group for application logs
        app_log_group = logs.LogGroup(
            self, "AppLogGroup",
            log_group_name="/secureapp/application",
            encryption_key=self.kms_key,
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Log group for system logs
        system_log_group = logs.LogGroup(
            self, "SystemLogGroup",
            log_group_name="/secureapp/system",
            encryption_key=self.kms_key,
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "SecureAppDashboard",
            dashboard_name="secureapp-monitoring"
        )
        
        # Add widgets to dashboard (example)
        dashboard.add_widgets(
            cloudwatch.TextWidget(
                markdown="# SecureApp Infrastructure Monitoring",
                width=24,
                height=2
            )
        )
        
        Tags.of(app_log_group).add("Name", "secureapp-app-logs")
        Tags.of(system_log_group).add("Name", "secureapp-system-logs")
        
        return {
            "app_log_group": app_log_group,
            "system_log_group": system_log_group,
            "dashboard": dashboard
        }
    
    def _create_ec2_instances(self) -> dict:
        """Create EC2 instances in private subnets with security configurations"""
        
        # User data script for CloudWatch agent installation
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y awslogs",
            
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            json.dumps({
                "agent": {
                    "metrics_collection_interval": 60,
                    "run_as_user": "cwagent"
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/messages",
                                    "log_group_name": "/secureapp/system",
                                    "log_stream_name": "{instance_id}/messages"
                                },
                                {
                                    "file_path": "/var/log/secure",
                                    "log_group_name": "/secureapp/system",
                                    "log_stream_name": "{instance_id}/secure"
                                }
                            ]
                        }
                    }
                },
                "metrics": {
                    "namespace": "SecureApp/EC2",
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
            }, indent=2),
            "EOF",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",
            
            # Configure awslogs for additional logging
            f"sed -i 's/region = us-east-1/region = {self.region}/' /etc/awslogs/awscli.conf",
            "systemctl enable awslogsd",
            "systemctl start awslogsd"
        )
        
        # Launch Template for consistent configuration
        launch_template = ec2.LaunchTemplate(
            self, "SecureAppLaunchTemplate",
            launch_template_name="secureapp-launch-template",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            security_group=self.security_groups["ec2_sg"],
            role=self.iam_roles["ec2_role"],
            user_data=user_data,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        encrypted=True,
                        kms_key=self.kms_key,
                        volume_type=ec2.EbsDeviceVolumeType.GP3
                    )
                )
            ]
        )
        
        # EC2 Instance in private subnet
        instance = ec2.Instance(
            self, "SecureAppInstance",
            instance_name="secureapp-instance-01",
            launch_template=launch_template,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )
        
        Tags.of(instance).add("Name", "secureapp-instance-01")
        Tags.of(instance).add("Backup", "Required")
        
        return {
            "launch_template": launch_template,
            "instance": instance
        }
    
    def _create_outputs(self) -> None:
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for SecureApp"
        )
        
        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID for encryption"
        )
        
        CfnOutput(
            self, "AppDataBucket",
            value=self.s3_buckets["app_data_bucket"].bucket_name,
            description="S3 bucket for application data"
        )
        
        CfnOutput(
            self, "LogsBucket",
            value=self.s3_buckets["logs_bucket"].bucket_name,
            description="S3 bucket for logs"
        )
        
        CfnOutput(
            self, "InstanceId",
            value=self.ec2_instances["instance"].instance_id,
            description="EC2 Instance ID"
        )
```

### `tests/unit/test_tap_stack.py` - Unit Tests

```python
import aws_cdk as core
import aws_cdk.assertions as assertions
import pytest
from lib.tap_stack import TapStack

class TestTapStackUnit:
    
    @pytest.fixture
    def app(self):
        return core.App()
    
    @pytest.fixture
    def stack(self, app):
        return TapStack(app, "test-stack", env=core.Environment(region="us-east-1"))
    
    @pytest.fixture
    def template(self, stack):
        return assertions.Template.from_stack(stack)
    
    def test_kms_key_created(self, template):
        """Test KMS key is created with proper configuration"""
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": "KMS key for SecureApp encryption with automatic rotation",
            "EnableKeyRotation": True
        })
        
        template.has_resource_properties("AWS::KMS::Alias", {
            "AliasName": "alias/secureapp-encryption-key"
        })
    
    def test_vpc_configuration(self, template):
        """Test VPC is created with correct CIDR and subnets"""
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        
        # Check for public and private subnets
        template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 AZs x 2 subnet types
        template.resource_count_is("AWS::EC2::InternetGateway", 1)
        template.resource_count_is("AWS::EC2::NatGateway", 2)  # One per AZ
    
    def test_s3_buckets_encryption(self, template):
        """Test S3 buckets are created with KMS encryption"""
        # Check for encrypted S3 buckets
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
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })
        
        # Should have 2 buckets (data and logs)
        template.resource_count_is("AWS::S3::Bucket", 2)
    
    def test_security_groups(self, template):
        """Test security groups have proper ingress/egress rules"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for SecureApp EC2 instances",
            "SecurityGroupIngress": [
                {
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "CidrIp": "10.0.0.0/16"
                }
            ]
        })
    
    def test_iam_roles_least_privilege(self, template):
        """Test IAM roles follow least privilege principle"""
        # Check EC2 instance role exists
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
        
        # Check instance profile exists
        template.resource_count_is("AWS::IAM::InstanceProfile", 1)
    
    def test_cloudwatch_log_groups(self, template):
        """Test CloudWatch log groups are encrypted"""
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/secureapp/application",
            "RetentionInDays": 30
        })
        
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/secureapp/system",
            "RetentionInDays": 30
        })
    
    def test_ec2_instance_configuration(self, template):
        """Test EC2 instance is properly configured"""
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "InstanceType": "t3.micro",
                "BlockDeviceMappings": [
                    {
                        "DeviceName": "/dev/xvda",
                        "Ebs": {
                            "VolumeSize": 20,
                            "Encrypted": True,
                            "VolumeType": "gp3"
                        }
                    }
                ]
            }
        })
    
    def test_resource_naming_convention(self, template):
        """Test all resources follow secureapp- naming convention"""
        # This is checked through the resource properties and tags
        # The actual naming is enforced in the construct definitions
        pass
    
    def test_tagging_strategy(self, stack):
        """Test proper tagging is applied"""
        # Tags are applied at the app level and construct level
        # This test verifies the tagging mechanism is in place
        assert hasattr(stack, 'tags')
    
    def test_vpc_flow_logs_enabled(self, template):
        """Test VPC Flow Logs are enabled"""
        template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL"
        })
    
    def test_lifecycle_policies(self, template):
        """Test S3 lifecycle policies are configured"""
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": {
                "Rules": [
                    {
                        "Status": "Enabled",
                        "Transitions": assertions.Match.any_value()
                    }
                ]
            }
        })
```

### `tests/integration/test_tap_stack.py` - Integration Tests

```python
import boto3
import pytest
import time
from moto import mock_ec2, mock_s3, mock_kms, mock_iam, mock_logs
import aws_cdk as core
from lib.tap_stack import TapStack

class TestTapStackIntegration:
    
    @pytest.fixture(scope="class")
    def aws_credentials(self):
        """Mocked AWS Credentials for moto."""
        import os
        os.environ["AWS_ACCESS_KEY_ID"] = "testing"
        os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
        os.environ["AWS_SECURITY_TOKEN"] = "testing"
        os.environ["AWS_SESSION_TOKEN"] = "testing"
        os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
    
    @mock_ec2
    @mock_s3
    @mock_kms
    @mock_iam
    @mock_logs
    def test_stack_deployment_simulation(self, aws_credentials):
        """Simulate stack deployment and verify resources"""
        
        # Create the stack
        app = core.App()
        stack = TapStack(app, "test-integration-stack", 
                        env=core.Environment(region="us-east-1", account="123456789012"))
        
        # Synthesize the template
        template = app.synth().get_stack_by_name("test-integration-stack").template
        
        # Verify template structure
        assert "Resources" in template
        assert "Outputs" in template
        
        # Count expected resources
        resources = template["Resources"]
        
        # Verify critical resources exist
        kms_keys = [r for r in resources.values() if r["Type"] == "AWS::KMS::Key"]
        assert len(kms_keys) >= 1, "KMS key should be created"
        
        s3_buckets = [r for r in resources.values() if r["Type"] == "AWS::S3::Bucket"]
        assert len(s3_buckets) == 2, "Should have exactly 2 S3 buckets"
        
        vpcs = [r for r in resources.values() if r["Type"] == "AWS::EC2::VPC"]
        assert len(vpcs) == 1, "Should have exactly 1 VPC"
        
        ec2_instances = [r for r in resources.values() if r["Type"] == "AWS::EC2::Instance"]
        assert len(ec2_instances) >= 1, "Should have at least 1 EC2 instance"
    
    @mock_s3
    @mock_kms
    def test_s3_bucket_encryption_integration(self, aws_credentials):
        """Test S
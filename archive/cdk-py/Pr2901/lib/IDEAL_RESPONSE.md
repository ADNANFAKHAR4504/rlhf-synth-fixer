``````python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import time

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    NestedStack,
    Duration,
    CfnOutput,
    RemovalPolicy,
    Tags,
    aws_iam as iam,
    aws_kms as kms,
    aws_ssm as ssm,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subs,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudtrail as cloudtrail,
    aws_config as config
)
from constructs import Construct

# Configuration constants
REGION = "us-west-2"

COMMON_TAGS = {
    "Environment": "prod",
    "Owner": "security-team",
    "CostCenter": "tap",
    "CreatedDate": "2024-01-15",
    "ManagedBy": "turing-iac"
}

# NIST Compliance mapping
NIST_CONTROLS = {
    "AC-2": "Account Management",
    "AC-3": "Access Enforcement",
    "AC-6": "Least Privilege",
    "AU-2": "Event Logging",
    "AU-12": "Audit Generation",
    "CA-7": "Continuous Monitoring",
    "CM-2": "Baseline Configuration",
    "IA-2": "Identification and Authentication",
    "IA-5": "Authenticator Management",
    "SC-7": "Boundary Protection",
    "SC-8": "Transmission Confidentiality",
    "SC-28": "Protection of Information at Rest",
    "SI-4": "Information System Monitoring"
}

# Password policy configuration
PASSWORD_POLICY = {
    "minimum_password_length": 14,
    "require_uppercase_characters": True,
    "require_lowercase_characters": True,
    "require_numbers": True,
    "require_symbols": True,
    "allow_users_to_change_password": True,
    "max_password_age": 90,
    "password_reuse_prevention": 12,
    "hard_expiry": False
}


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        unique_suffix (str): Timestamp-based unique suffix for resource naming.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Generate unique suffix using timestamp
        self.unique_suffix = str(int(time.time()))[-8:]  # Use last 8 digits of timestamp

        # Create separate stacks for each resource type
        # Create the DynamoDB stack as a nested stack

        # ! DO not create resources directly in this stack.
        # ! Instead, instantiate separate stacks for each resource type.

        # ===================== SECURITY STACK RESOURCES =====================
        self.create_kms_keys()
        self.create_iam_resources()
        self.set_password_policy()
        self.create_secure_parameters()
        
        # ===================== NETWORK STACK RESOURCES =====================
        self.create_vpc()
        self.create_security_groups()
        self.enable_vpc_flow_logs()
        self.create_vpc_endpoints()
        
        # ===================== COMPUTE STACK RESOURCES =====================
        self.create_secure_s3_bucket()
        self.create_lambda_functions()
        self.create_ec2_instances()
        self.setup_automated_patching()
        
        # ===================== MONITORING STACK RESOURCES =====================
        self.create_notification_topics()
        self.create_security_alarms()
        self.create_security_dashboard()
        # self.setup_custom_monitoring()
        
        # ===================== COMPLIANCE STACK RESOURCES =====================
        self.enable_cloudtrail()
        # GuardDuty removed - detector already exists in account
        # self.setup_config_rules()
        self.setup_compliance_reporting()
        self.setup_custom_monitoring()
        
        # ===================== OUTPUTS =====================
        self.create_outputs()
        
        # Apply consistent tagging to all resources
        for key, value in COMMON_TAGS.items():
            Tags.of(self).add(key, value)

    def create_kms_keys(self):
        """Create KMS keys with automatic rotation for different data types"""
        
        # Database encryption key
        self.db_kms_key = kms.Key(
            self, "DatabaseKMSKey",
            description="KMS key for database encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias="database-encryption-key"
        )
        
        # Application data encryption key
        self.app_kms_key = kms.Key(
            self, "ApplicationKMSKey", 
            description="KMS key for application data encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias="application-encryption-key"
        )
        
        # Lambda environment variables encryption key
        self.lambda_kms_key = kms.Key(
            self, "LambdaKMSKey",
            description="KMS key for Lambda environment variables",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias="lambda-encryption-key"
        )
        
        # CloudWatch Logs encryption key
        self.logs_kms_key = kms.Key(
            self, "LogsKMSKey",
            description="KMS key for CloudWatch Logs encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias="logs-encryption-key"
        )

        self.logs_kms_key.grant_encrypt_decrypt(
            iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
        )
    
        # Also grant CloudWatch Logs permission to use the lambda KMS key
        self.lambda_kms_key.grant_encrypt_decrypt(
            iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
        )

        self.logs_kms_key.grant_encrypt_decrypt(
            iam.ServicePrincipal("cloudtrail.amazonaws.com")
        )

    def create_iam_resources(self):
        """Create least-privilege IAM roles and policies"""
        
        # Lambda execution role with minimal permissions
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Least privilege role for Lambda functions",
            max_session_duration=Duration.hours(1),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"  # Add this line
                )
            ]
        )
        
        # Add KMS permissions to Lambda role
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                resources=[self.lambda_kms_key.key_arn]
            )
        )
        
        # EC2 instance role with Session Manager access
        self.ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="Least privilege role for EC2 instances",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                )
            ]
        )
        
        # Instance profile for EC2
        self.ec2_instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            role=self.ec2_role
        )
        
        # Parameter Store access policy for applications
        self.parameter_store_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ],
                    resources=[
                        f"arn:aws:ssm:{self.region}:{self.account}:parameter/app/prod/*"
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Decrypt"
                    ],
                    resources=[self.app_kms_key.key_arn]
                )
            ]
        )

    def set_password_policy(self):
        """Configure IAM password policy according to security standards"""
        
        # Note: Account password policy is an account-level setting
        # In CDK v2, this needs to be set using a custom resource or manually
        # For now, we'll create a managed policy that enforces MFA
        self.mfa_policy = iam.ManagedPolicy(
            self, "RequireMFAPolicy",
            managed_policy_name="RequireMFAPolicy",
            description="Policy requiring MFA for sensitive operations",
            statements=[
                iam.PolicyStatement(
                    sid="DenyAllExceptListedIfNoMFA",
                    effect=iam.Effect.DENY,
                    not_actions=[
                        "iam:CreateVirtualMFADevice",
                        "iam:EnableMFADevice",
                        "iam:GetUser",
                        "iam:ListMFADevices",
                        "iam:ListVirtualMFADevices",
                        "iam:ResyncMFADevice",
                        "sts:GetSessionToken"
                    ],
                    resources=["*"],
                    conditions={
                        "BoolIfExists": {
                            "aws:MultiFactorAuthPresent": "false"
                        }
                    }
                )
            ]
        )

    def create_secure_parameters(self):
        """Create hierarchical secure parameters in Parameter Store"""
        
        # Database connection parameters
        self.db_password_param = ssm.StringParameter(
            self, "DBPasswordParam",
            parameter_name=f"/tap/{self.unique_suffix}/prod/db/password",
            description="Database password for production environment",
            string_value="app_user",  # Should be generated/rotated
        )
        
        self.db_username_param = ssm.StringParameter(
            self, "DBUsernameParam", 
            parameter_name=f"/tap/{self.unique_suffix}/prod/db/username",
            description="Database username for production environment",
            string_value="app_user",
        )
        
        # Application configuration
        self.api_key_param = ssm.StringParameter(
            self, "APIKeyParam",
            parameter_name=f"/tap/{self.unique_suffix}/prod/api/key",
            description="External API key for production environment",
            string_value="secret-api-key-value",  # Should be generated
        )
        
        # JWT secret
        self.jwt_secret_param = ssm.StringParameter(
            self, "JWTSecretParam",
            parameter_name=f"/tap/{self.unique_suffix}/prod/auth/jwt-secret", 
            description="JWT signing secret for production environment",
            string_value="super-secret-jwt-key",  # Should be generated
        )

    def create_vpc(self):
        """Create VPC with three-tier architecture"""
        
        self.vpc = ec2.Vpc(
            self, "SecureVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=2,  # For high availability
            subnet_configuration=[
                # Web tier - public subnets
                ec2.SubnetConfiguration(
                    name="WebTier",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Application tier - private subnets with NAT
                ec2.SubnetConfiguration(
                    name="AppTier", 
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                # Database tier - isolated subnets
                ec2.SubnetConfiguration(
                    name="DatabaseTier",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

    def create_security_groups(self):
        """Create minimal security groups for each tier"""
        
        # Create all security groups first
        self.web_sg = ec2.SecurityGroup(
            self, "WebTierSG",
            vpc=self.vpc,
            description="Security group for web tier (ALB)",
            allow_all_outbound=False
        )
        
        self.app_sg = ec2.SecurityGroup(
            self, "AppTierSG",
            vpc=self.vpc,
            description="Security group for application tier", 
            allow_all_outbound=False
        )
        
        self.db_sg = ec2.SecurityGroup(
            self, "DatabaseTierSG",
            vpc=self.vpc,
            description="Security group for database tier",
            allow_all_outbound=False
        )
        
        self.lambda_sg = ec2.SecurityGroup(
            self, "LambdaSG", 
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=False
        )
        
        # Now add rules with proper references
        # Web tier rules
        self.web_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS inbound"
        )
        
        self.web_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP for redirect to HTTPS"
        )
        
        # Allow web tier to connect to app tier
        self.web_sg.add_egress_rule(
            self.app_sg,  # Use the actual security group object
            ec2.Port.tcp(8080),
            "Allow outbound to app tier"
        )
        
        # App tier rules
        self.app_sg.add_ingress_rule(
            self.web_sg,  # Use the actual security group object
            ec2.Port.tcp(8080),
            "Allow inbound from web tier"
        )
        
        # Allow app tier to connect to database tier
        self.app_sg.add_egress_rule(
            self.db_sg,  # Use the actual security group object
            ec2.Port.tcp(5432),
            "Allow outbound to database tier"
        )
        
        self.app_sg.add_egress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS outbound for external APIs"
        )
        
        # Database tier rules
        self.db_sg.add_ingress_rule(
            self.app_sg,  # Use the actual security group object
            ec2.Port.tcp(5432),
            "Allow inbound from app tier"
        )
        
        # Lambda rules
        self.lambda_sg.add_egress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS outbound"
        )

    def enable_vpc_flow_logs(self):
        """Enable VPC Flow Logs for network monitoring"""
        
        # Create CloudWatch Log Group for VPC Flow Logs with timestamp-based naming
        self.flow_logs_group = logs.LogGroup(
            self, "VPCFlowLogsGroup",
            log_group_name=f"/tap/network/vpc-flow-logs-{self.account}-{self.unique_suffix}",
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.logs_kms_key
        )
        
        # Enable VPC Flow Logs
        self.vpc_flow_logs = ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                self.flow_logs_group
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

    def create_vpc_endpoints(self):
        """Create VPC endpoints for secure access to AWS services"""
        
        # Create security group for VPC endpoints
        self.endpoint_sg = ec2.SecurityGroup(
            self, "VPCEndpointSG",
            vpc=self.vpc,
            description="Security group for VPC endpoints",
            allow_all_outbound=False
        )
        
        # Allow HTTPS from private subnets
        self.endpoint_sg.add_ingress_rule(
            ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            ec2.Port.tcp(443),
            "Allow HTTPS from VPC"
        )
        
        # S3 Gateway endpoint
        self.s3_endpoint = self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
            ]
        )
        
        # Systems Manager endpoints for Session Manager
        self.ssm_endpoint = self.vpc.add_interface_endpoint(
            "SSMEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.SSM,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.endpoint_sg]
        )
        
        self.ssm_messages_endpoint = self.vpc.add_interface_endpoint(
            "SSMMessagesEndpoint", 
            service=ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.endpoint_sg]
        )
        
        self.ec2_messages_endpoint = self.vpc.add_interface_endpoint(
            "EC2MessagesEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.endpoint_sg]
        )

    def create_secure_s3_bucket(self):
        """Create S3 bucket with all security best practices"""
        
        # Create access logs bucket first
        self.access_logs_bucket = s3.Bucket(
            self, "AccessLogsBucket",
            bucket_name=f"tap-access-logs-{self.account}-{self.unique_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.app_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(365)
                )
            ]
        )
        
        self.secure_bucket = s3.Bucket(
            self, "SecureApplicationBucket",
            bucket_name=f"tap-secure-app-{self.account}-{self.unique_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.app_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            server_access_logs_bucket=self.access_logs_bucket,
            server_access_logs_prefix="access-logs/",
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
                ),
                s3.LifecycleRule(
                    id="DeleteIncompleteUploads",
                    enabled=True,
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

    def create_lambda_functions(self):
        """Create secure Lambda functions with proper configuration"""
        
        # Create log group first for Lambda
        self.security_lambda_log_group = logs.LogGroup(
            self, f"security-processorLogGroup",
            log_group_name=f"/aws/lambda/security-processor-{self.unique_suffix}",
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.lambda_kms_key
        )
        
        # Security processing Lambda
        self.security_lambda = lambda_.Function(
            self, f"security-processorFunction",
            function_name=f"security-processor-{self.unique_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="lambda_function.lambda_handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import logging
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all AWS SDK calls for X-Ray tracing
patch_all()

logger = logging.getLogger()
logger.setLevel(logging.INFO)

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    logger.info('Processing security event: %s', json.dumps(event))
    
    # Process security event
    try:
        # Your security processing logic here
        result = {
            'statusCode': 200,
            'body': json.dumps('Security event processed successfully')
        }
        
        logger.info('Security event processed successfully')
        return result
        
    except Exception as e:
        logger.error('Error processing security event: %s', str(e))
        raise
            """),
            environment={
                "ENVIRONMENT": "prod",
                "LOG_LEVEL": "INFO",
                "BUCKET_NAME": self.secure_bucket.bucket_name,
                "AWS_LAMBDA_EXEC_WRAPPER": "/opt/otel-instrument",
                "LAMBDA_LOG_LEVEL": "INFO"
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.lambda_sg],
            role=self.lambda_role,
            environment_encryption=self.lambda_kms_key,
            timeout=Duration.seconds(30),
            memory_size=256,
            # reserved_concurrent_executions=10,
            tracing=lambda_.Tracing.ACTIVE,
            log_group=self.security_lambda_log_group,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )
        
        # Grant S3 permissions to Lambda
        self.secure_bucket.grant_read_write(self.security_lambda)
        
        # Add S3 event notification
        self.secure_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.security_lambda)
        )

    def create_ec2_instances(self):
        """Create secure EC2 instances with hardened configuration"""
        
        # Enhanced user data for security
        user_data = ec2.UserData.for_linux()
        
        # Add security hardening to user data
        user_data.add_commands(
            "# Security hardening",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            
            # Configure CloudWatch agent
            "cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
            """{
                "agent": {
                    "metrics_collection_interval": 60,
                    "run_as_user": "cwagent"
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/secure",
                                    "log_group_name": "/aws/ec2/security",
                                    "log_stream_name": "{instance_id}/secure"
                                },
                                {
                                    "file_path": "/var/log/messages",
                                    "log_group_name": "/aws/ec2/messages", 
                                    "log_stream_name": "{instance_id}/messages"
                                }
                            ]
                        }
                    }
                },
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
                }
            }""",
            "EOF",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json",
            
            # Additional security configurations
            "echo 'net.ipv4.ip_forward = 0' >> /etc/sysctl.conf",
            "echo 'net.ipv4.conf.all.send_redirects = 0' >> /etc/sysctl.conf",
            "echo 'net.ipv4.conf.default.send_redirects = 0' >> /etc/sysctl.conf",
            "sysctl -p",
            
            # Set up log rotation
            "cat << 'EOF' > /etc/logrotate.d/security-logs",
            "/var/log/secure {",
            "    daily",
            "    rotate 30",
            "    compress",
            "    delaycompress", 
            "    missingok",
            "    notifempty",
            "}",
            "EOF"
        )
        
        # Application server in private subnet
        self.app_server = ec2.Instance(
            self, f"AppServerInstance",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=self.app_sg,
            role=self.ec2_role,
            key_name=None,  # No SSH keys - use Session Manager
            user_data=user_data,
            require_imdsv2=True,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                        encrypted=True,
                        kms_key=self.app_kms_key,
                        delete_on_termination=True
                    )
                )
            ]
        )
        
        # Add tags for patch management
        Tags.of(self.app_server).add("PatchGroup", "Production")
        Tags.of(self.app_server).add("MaintenanceWindow", "ProductionMaintenanceWindow")
        Tags.of(self.app_server).add("Environment", "prod")

    def create_maintenance_role(self):
        """Create IAM role for maintenance window tasks"""
        
        maintenance_role = iam.Role(
            self, "MaintenanceRole",
            assumed_by=iam.ServicePrincipal("ssm.amazonaws.com"),
            description="Role for Systems Manager maintenance window tasks",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonSSMMaintenanceWindowRole"
                )
            ]
        )
        
        return maintenance_role

    def setup_automated_patching(self):
        """Configure AWS Systems Manager Patch Manager for automated patching"""
        
        # Create maintenance role first
        self.maintenance_role = self.create_maintenance_role()
        
        # Create patch baseline for Amazon Linux
        self.patch_baseline = ssm.CfnPatchBaseline(
            self, "PatchBaseline",
            name=f"tap-patch-baseline-{self.unique_suffix}",
            description="Patch baseline for secure application servers",
            operating_system="AMAZON_LINUX_2",
            patch_groups=["Production"],
            approval_rules=ssm.CfnPatchBaseline.RuleGroupProperty(
                patch_rules=[
                    ssm.CfnPatchBaseline.RuleProperty(
                        approve_after_days=7,
                        compliance_level="HIGH",
                        patch_filter_group=ssm.CfnPatchBaseline.PatchFilterGroupProperty(
                            patch_filters=[
                                ssm.CfnPatchBaseline.PatchFilterProperty(
                                    key="CLASSIFICATION",
                                    values=["Security", "Bugfix"]
                                )
                            ]
                        )
                    )
                ]
            )
        )
        
        # Create maintenance window
        self.maintenance_window = ssm.CfnMaintenanceWindow(
            self, "MaintenanceWindow",
            name=f"tap-maintenance-window-{self.unique_suffix}", 
            description="Maintenance window for production servers",
            duration=4,
            cutoff=1,
            schedule="cron(0 2 ? * SUN *)",  # Every Sunday at 2 AM
            schedule_timezone="US/Pacific",
            allow_unassociated_targets=False
        )
        
        # Register patch targets
        self.patch_target = ssm.CfnMaintenanceWindowTarget(
            self, "PatchTarget",
            window_id=self.maintenance_window.ref,
            resource_type="INSTANCE",
            targets=[
                ssm.CfnMaintenanceWindowTarget.TargetsProperty(
                    key="tag:PatchGroup",
                    values=["Production"]
                )
            ]
        )
        
        # Create patch task
        self.patch_task = ssm.CfnMaintenanceWindowTask(
            self, "PatchTask",
            window_id=self.maintenance_window.ref,
            targets=[
                ssm.CfnMaintenanceWindowTask.TargetProperty(
                    key="WindowTargetIds",
                    values=[self.patch_target.ref]
                )
            ],
            task_type="RUN_COMMAND",
            task_arn="AWS-RunPatchBaseline",
            priority=1,
            service_role_arn=self.maintenance_role.role_arn,
            max_concurrency="50%",  # Add this - run on 50% of targets at once
            max_errors="10%",  # Add this - stop if more than 10% fail
            task_parameters={
                "Operation": {
                    "Values": ["Install"]
                }
            }
        )

    def create_notification_topics(self):
        """Create SNS topics for different types of security alerts"""
        
        # Critical security alerts
        self.critical_alerts_topic = sns.Topic(
            self, "CriticalSecurityAlerts",
            topic_name="critical-security-alerts",
            display_name="Critical Security Alerts",
            master_key=self.app_kms_key
        )
        
        # Add email subscription (replace with actual email)
        self.critical_alerts_topic.add_subscription(
            subs.EmailSubscription("security-team@company.com")
        )
        
        # Warning security alerts  
        self.warning_alerts_topic = sns.Topic(
            self, "WarningSecurityAlerts",
            topic_name="warning-security-alerts", 
            display_name="Warning Security Alerts",
            master_key=self.app_kms_key
        )
        
        # Add email subscription
        self.warning_alerts_topic.add_subscription(
            subs.EmailSubscription("security-ops@company.com")
        )

    def create_security_group_change_metric(self):
        """Create custom metric for security group changes"""
        
        return cloudwatch.Metric(
            namespace="SecurityCompliance",
            metric_name="SecurityGroupChanges",
            dimensions_map={
                "EventName": "AuthorizeSecurityGroupIngress"
            },
            statistic="Sum"
        )

    def create_iam_change_metric(self):
        """Create custom metric for IAM changes"""
        
        return cloudwatch.Metric(
            namespace="SecurityCompliance",
            metric_name="IAMChanges", 
            dimensions_map={
                "EventName": "PutUserPolicy"
            },
            statistic="Sum"
        )

    def create_kms_change_metric(self):
        """Create custom metric for KMS changes"""
        
        return cloudwatch.Metric(
            namespace="SecurityCompliance",
            metric_name="KMSChanges",
            dimensions_map={
                "EventName": "PutKeyPolicy"
            },
            statistic="Sum"
        )

    def create_security_alarms(self):
        """Create CloudWatch alarms for security events"""
        
        # Root account usage alarm (NIST AC-2, AU-2)
        root_usage_alarm = cloudwatch.Alarm(
            self, "RootAccountUsage",
            alarm_name="Root-Account-Usage",
            alarm_description="Alarm for root account usage",
            metric=cloudwatch.Metric(
                namespace="CloudWatchLogs",
                metric_name="IncomingLogEvents", 
                dimensions_map={
                    "LogGroupName": "/aws/cloudtrail"
                },
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        root_usage_alarm.add_alarm_action(
            cw_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # Failed authentication attempts (NIST IA-2, AU-12)
        failed_auth_alarm = cloudwatch.Alarm(
            self, "FailedAuthAttempts",
            alarm_name="Failed-Authentication-Attempts",
            alarm_description="High number of failed authentication attempts",
            metric=cloudwatch.Metric(
                namespace="AWS/CloudTrail",
                metric_name="ErrorCount",
                dimensions_map={
                    "EventName": "ConsoleLogin"
                },
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        failed_auth_alarm.add_alarm_action(
            cw_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # Unauthorized API calls (NIST AC-3, SI-4) 
        unauthorized_api_alarm = cloudwatch.Alarm(
            self, "UnauthorizedAPICalls",
            alarm_name="Unauthorized-API-Calls",
            alarm_description="Unauthorized API calls detected",
            metric=cloudwatch.Metric(
                namespace="AWS/CloudTrail", 
                metric_name="ErrorCount",
                dimensions_map={
                    "ErrorCode": "AccessDenied"
                },
                statistic="Sum"
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        unauthorized_api_alarm.add_alarm_action(
            cw_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # Security group changes (NIST SC-7, CM-2)
        sg_changes_alarm = cloudwatch.Alarm(
            self, "SecurityGroupChanges",
            alarm_name="Security-Group-Changes",
            alarm_description="Security group configuration changes",
            metric=self.create_security_group_change_metric(),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        sg_changes_alarm.add_alarm_action(
            cw_actions.SnsAction(self.warning_alerts_topic)
        )
        
        # IAM policy changes (NIST AC-6, CM-2)
        iam_changes_alarm = cloudwatch.Alarm(
            self, "IAMPolicyChanges",
            alarm_name="IAM-Policy-Changes", 
            alarm_description="IAM policy configuration changes",
            metric=self.create_iam_change_metric(),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        iam_changes_alarm.add_alarm_action(
            cw_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # KMS key changes (NIST SC-28, CM-2)
        kms_changes_alarm = cloudwatch.Alarm(
            self, "KMSKeyChanges",
            alarm_name="KMS-Key-Changes",
            alarm_description="KMS key configuration changes", 
            metric=self.create_kms_change_metric(),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        kms_changes_alarm.add_alarm_action(
            cw_actions.SnsAction(self.critical_alerts_topic)
        )
        
        # Lambda function errors (Application monitoring)
        lambda_errors_alarm = cloudwatch.Alarm(
            self, "LambdaErrors",
            alarm_name="Lambda-Function-Errors",
            alarm_description="Lambda function errors",
            metric=self.security_lambda.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        lambda_errors_alarm.add_alarm_action(
            cw_actions.SnsAction(self.warning_alerts_topic)
        )

    def create_security_dashboard(self):
        """Create CloudWatch dashboard for security monitoring"""
        
        self.security_dashboard = cloudwatch.Dashboard(
            self, "SecurityDashboard",
            dashboard_name="Security-Monitoring-Dashboard",
            widgets=[
                [
                    # Security events overview
                    cloudwatch.GraphWidget(
                        title="Security Events Overview",
                        left=[
                            cloudwatch.Metric(
                                namespace="AWS/CloudTrail",
                                metric_name="ErrorCount",
                                statistic="Sum"
                            )
                        ],
                        width=12,
                        height=6
                    )
                ],
                [
                    # Authentication metrics
                    cloudwatch.SingleValueWidget(
                        title="Failed Logins (24h)",
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/CloudTrail",
                                metric_name="ErrorCount",
                                dimensions_map={
                                    "EventName": "ConsoleLogin"
                                },
                                statistic="Sum"
                            )
                        ],
                        width=6,
                        height=4
                    ),
                    cloudwatch.SingleValueWidget(
                        title="Root Account Usage (24h)",
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/CloudTrail", 
                                metric_name="EventCount",
                                dimensions_map={
                                    "UserIdentityType": "Root"
                                },
                                statistic="Sum"
                            )
                        ],
                        width=6,
                        height=4
                    )
                ],
                [
                    # Lambda metrics
                    cloudwatch.GraphWidget(
                        title="Lambda Function Performance",
                        left=[
                            self.security_lambda.metric_errors(),
                            self.security_lambda.metric_duration(),
                            self.security_lambda.metric_invocations()
                        ],
                        width=12,
                        height=6
                    )
                ],
                [
                    # VPC Flow Logs
                    cloudwatch.LogQueryWidget(
                        title="Top 10 Source IPs (VPC Flow Logs)",
                        log_group_names=[self.flow_logs_group.log_group_name],
                        query_lines=[
                            "fields @timestamp, srcaddr, dstaddr, action",
                            "filter action = 'REJECT'",  
                            "stats count() by srcaddr",
                            "sort count desc",
                            "limit 10"
                        ],
                        width=12,
                        height=6
                    )
                ]
            ]
        )

    def create_log_metric_filters(self):
        """Create log metric filters for security events"""
        
        # Root account usage filter
        root_usage_filter = logs.MetricFilter(
            self, "RootUsageFilter",
            log_group=logs.LogGroup.from_log_group_name(
                self, "CloudTrailLogGroup",
                "/aws/cloudtrail"
            ),
            metric_namespace="SecurityCompliance",
            metric_name="RootAccountUsage",
            filter_pattern=logs.FilterPattern.literal(
                '[version, account, time, region, source, event_name="ConsoleLogin", ...rest]'
                ' | $.userIdentity.type = "Root"'
            ),
            metric_value="1"
        )
        
        # Failed authentication filter
        failed_auth_filter = logs.MetricFilter(
            self, "FailedAuthFilter", 
            log_group=logs.LogGroup.from_log_group_name(
                self, "CloudTrailLogGroup2",
                "/aws/cloudtrail"
            ),
            metric_namespace="SecurityCompliance",
            metric_name="FailedAuthentications",
            filter_pattern=logs.FilterPattern.literal(
                '[...] | $.errorCode = "SigninFailure"'
            ),
            metric_value="1"
        )

    def create_eventbridge_rules(self):
        """Create EventBridge rules for real-time security monitoring"""
        
        # Security group changes rule
        sg_change_rule = events.Rule(
            self, "SecurityGroupChangeRule",
            rule_name="SecurityGroupChanges",
            description="Detect security group changes",
            event_pattern=events.EventPattern(
                source=["aws.ec2"],
                detail_type=["AWS API Call via CloudTrail"],
                detail={
                    "eventSource": ["ec2.amazonaws.com"],
                    "eventName": [
                        "AuthorizeSecurityGroupIngress",
                        "RevokeSecurityGroupIngress",
                        "AuthorizeSecurityGroupEgress", 
                        "RevokeSecurityGroupEgress"
                    ]
                }
            )
        )
        
        sg_change_rule.add_target(
            targets.SnsTopic(self.warning_alerts_topic)
        )
        
        # IAM changes rule
        iam_change_rule = events.Rule(
            self, "IAMChangeRule",
            rule_name="IAMPolicyChanges",
            description="Detect IAM policy changes",
            event_pattern=events.EventPattern(
                source=["aws.iam"],
                detail_type=["AWS API Call via CloudTrail"],
                detail={
                    "eventSource": ["iam.amazonaws.com"],
                    "eventName": [
                        "PutUserPolicy",
                        "PutRolePolicy", 
                        "PutGroupPolicy",
                        "CreatePolicy",
                        "DeletePolicy"
                    ]
                }
            )
        )
        
        iam_change_rule.add_target(
            targets.SnsTopic(self.critical_alerts_topic)
        )

    def setup_custom_monitoring(self):
        """Set up custom monitoring and log analysis"""
        
        # Create log metric filters for security events
        # self.create_log_metric_filters()
        
        # Set up EventBridge rules for real-time monitoring
        self.create_eventbridge_rules()

    def enable_cloudtrail(self):
        """Enable AWS CloudTrail for audit logging (NIST AU-2, AU-12)"""
        
        # Create S3 bucket for CloudTrail logs
        self.cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            bucket_name=f"tap-cloudtrail-logs-{self.account}-{self.unique_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.logs_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="CloudTrailLogRetention",
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
                    ],
                    expiration=Duration.days(2557)  # 7 years retention
                )
            ]
        )

        self.logs_kms_key.grant_encrypt_decrypt(
        iam.ServicePrincipal("cloudtrail.amazonaws.com")
        )
        
        # Create CloudTrail
        self.trail = cloudtrail.Trail(
            self, "ComplianceTrail",
            trail_name=f"ComplianceAuditTrail-{self.unique_suffix}",
            bucket=self.cloudtrail_bucket,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            encryption_key=self.logs_kms_key,
            management_events=cloudtrail.ReadWriteType.ALL
        )

    def create_config_recorder(self):
        """Create AWS Config configuration recorder"""
        
        # Create service role for Config
        config_role = iam.Role(
            self, "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWS_ConfigRole"
                )
            ]
        )
        
        return config.CfnConfigurationRecorder(
            self, "ConfigRecorder",
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True
            )
        )

    def create_config_delivery_channel(self):
        """Create AWS Config delivery channel"""
        
        # Create S3 bucket for Config
        config_bucket = s3.Bucket(
            self, "ConfigBucket",
            bucket_name=f"tap-aws-config-{self.account}-{self.unique_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.logs_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True
        )

        # Add bucket policy to allow Config to write
        config_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[config_bucket.bucket_arn]
            )
        )
        
        config_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{config_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )
        
        config_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:ListBucket"],
                resources=[config_bucket.bucket_arn]
            )
        )
        
        return config.CfnDeliveryChannel(
            self, "ConfigDeliveryChannel",
            s3_bucket_name=config_bucket.bucket_name,
            config_snapshot_delivery_properties=config.CfnDeliveryChannel.ConfigSnapshotDeliveryPropertiesProperty(
                delivery_frequency="TwentyFour_Hours"
            )
        )

    def create_config_rule(self, rule_id: str, source_identifier: str, 
                          description: str, nist_controls: list):
        """Create a Config rule with NIST control mapping"""
        
        rule = config.CfnConfigRule(
            self, rule_id,
            config_rule_name=rule_id,
            description=f"{description} (Maps to: {', '.join(nist_controls)})",
            source=config.CfnConfigRule.SourceProperty(
                owner="AWS",
                source_identifier=source_identifier
            )
        )
        
        # Add dependency on config recorder
        rule.add_dependency(self.config_recorder)
        
        return rule

    def setup_compliance_reporting(self):
        """Set up compliance reporting and remediation"""
        
        # Create compliance dashboard
        self.compliance_dashboard = cloudwatch.Dashboard(
            self, "ComplianceDashboard",
            dashboard_name="NIST-Compliance-Dashboard",
            widgets=[
                [
                    cloudwatch.SingleValueWidget(
                        title="Config Rules Compliance",
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/Config",
                                metric_name="ComplianceByConfigRule",
                                statistic="Average"
                            )
                        ],
                        width=6,
                        height=4
                    ),
                    cloudwatch.SingleValueWidget(
                        title="CloudTrail Active",
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/CloudTrail",
                                metric_name="EventCount",
                                statistic="Sum"
                            )
                        ],
                        width=6,
                        height=4
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="Security Compliance Trends",
                        left=[
                            cloudwatch.Metric(
                                namespace="AWS/Config",
                                metric_name="ComplianceByConfigRule",
                                statistic="Average"
                            )
                        ],
                        width=12,
                        height=6
                    )
                ]
            ]
        )

    def create_outputs(self):
        """Create CloudFormation outputs for created resources"""
        
        # Security Stack Outputs
        CfnOutput(self, "DatabaseKMSKeyId", value=self.db_kms_key.key_id,
                 description="Database KMS Key ID")
        CfnOutput(self, "ApplicationKMSKeyId", value=self.app_kms_key.key_id,
                 description="Application KMS Key ID") 
        CfnOutput(self, "LambdaKMSKeyId", value=self.lambda_kms_key.key_id,
                 description="Lambda KMS Key ID")
        CfnOutput(self, "LogsKMSKeyId", value=self.logs_kms_key.key_id,
                 description="CloudWatch Logs KMS Key ID")
        CfnOutput(self, "LambdaRoleArn", value=self.lambda_role.role_arn,
                 description="Lambda Execution Role ARN")
        CfnOutput(self, "EC2RoleArn", value=self.ec2_role.role_arn,
                 description="EC2 Instance Role ARN")
        
        # Network Stack Outputs
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id,
                 description="VPC ID")
        CfnOutput(self, "WebSecurityGroupId", value=self.web_sg.security_group_id,
                 description="Web tier security group ID")
        CfnOutput(self, "AppSecurityGroupId", value=self.app_sg.security_group_id,
                 description="App tier security group ID")
        CfnOutput(self, "DatabaseSecurityGroupId", value=self.db_sg.security_group_id,
                 description="Database tier security group ID")
        CfnOutput(self, "LambdaSecurityGroupId", value=self.lambda_sg.security_group_id,
                 description="Lambda security group ID")
        
        # Compute Stack Outputs
        CfnOutput(self, "SecureBucketName", value=self.secure_bucket.bucket_name,
                 description="Secure S3 bucket name")
        CfnOutput(self, "SecurityLambdaArn", value=self.security_lambda.function_arn,
                 description="Security Lambda function ARN")
        CfnOutput(self, "AppServerInstanceId", value=self.app_server.instance_id,
                 description="Application server instance ID")
        CfnOutput(self, "MaintenanceWindowId", value=self.maintenance_window.ref,
                 description="Maintenance window ID for patching")
        
        # Monitoring Stack Outputs
        CfnOutput(self, "CriticalAlertsTopicArn", 
                 value=self.critical_alerts_topic.topic_arn,
                 description="Critical alerts SNS topic ARN")
        CfnOutput(self, "WarningAlertsTopicArn",
                 value=self.warning_alerts_topic.topic_arn, 
                 description="Warning alerts SNS topic ARN")
        CfnOutput(self, "SecurityDashboardUrl",
                 value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.security_dashboard.dashboard_name}",
                 description="Security monitoring dashboard URL")
        
        # Compliance Stack Outputs
        CfnOutput(self, "CloudTrailArn", value=self.trail.trail_arn,
                 description="CloudTrail ARN")
        CfnOutput(self, "CloudTrailBucketName", value=self.cloudtrail_bucket.bucket_name,
                 description="CloudTrail S3 Bucket Name")
        CfnOutput(self, "ComplianceDashboardUrl",
                 value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.compliance_dashboard.dashboard_name}",
                 description="NIST Compliance Dashboard URL")
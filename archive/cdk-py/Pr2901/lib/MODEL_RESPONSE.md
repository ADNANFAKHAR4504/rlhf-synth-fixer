`````python
"""
Main CDK App (app.py)
"""
#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.security_stack import SecurityStack
from stacks.network_stack import NetworkStack
from stacks.compute_stack import ComputeStack
from stacks.monitoring_stack import MonitoringStack
from stacks.compliance_stack import ComplianceStack
from constructs.tagging_aspect import TaggingAspect
from config.constants import COMMON_TAGS, REGION

app = cdk.App()

# Environment configuration
env = cdk.Environment(region=REGION)

# Core infrastructure stacks
security_stack = SecurityStack(app, "SecurityStack", env=env)
network_stack = NetworkStack(app, "NetworkStack", 
                           security_stack=security_stack, env=env)
compute_stack = ComputeStack(app, "ComputeStack", 
                           security_stack=security_stack,
                           network_stack=network_stack, env=env)
monitoring_stack = MonitoringStack(app, "MonitoringStack",
                                 security_stack=security_stack,
                                 network_stack=network_stack,
                                 compute_stack=compute_stack, env=env)
compliance_stack = ComplianceStack(app, "ComplianceStack",
                                 security_stack=security_stack, env=env)

# Apply consistent tagging to all resources
cdk.Aspects.of(app).add(TaggingAspect(COMMON_TAGS))

app.synth()

"""
Configuration (config/constants.py)
"""
REGION = "us-west-2"
ACCOUNT_ID = "123456789012"  # Replace with actual account ID

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

"""
Security Stack (stacks/security_stack.py)
"""
from aws_cdk import (
    Stack,
    aws_iam as iam,
    aws_kms as kms,
    aws_ssm as ssm,
    Duration,
    CfnOutput
)
from constructs import Construct
from config.constants import PASSWORD_POLICY, NIST_CONTROLS

class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create KMS keys for different data types
        self.create_kms_keys()
        
        # Set up IAM roles and policies
        self.create_iam_resources()
        
        # Configure password policy
        self.set_password_policy()
        
        # Create secure parameters
        self.create_secure_parameters()
        
        # Outputs
        self.create_outputs()

    def create_kms_keys(self):
        """Create KMS keys with automatic rotation for different data types"""
        
        # Database encryption key
        self.db_kms_key = kms.Key(
            self, "DatabaseKMSKey",
            description="KMS key for database encryption",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.RETAIN,
            alias="database-encryption-key"
        )
        
        # Application data encryption key
        self.app_kms_key = kms.Key(
            self, "ApplicationKMSKey", 
            description="KMS key for application data encryption",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.RETAIN,
            alias="application-encryption-key"
        )
        
        # Lambda environment variables encryption key
        self.lambda_kms_key = kms.Key(
            self, "LambdaKMSKey",
            description="KMS key for Lambda environment variables",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.RETAIN,
            alias="lambda-encryption-key"
        )
        
        # CloudWatch Logs encryption key
        self.logs_kms_key = kms.Key(
            self, "LogsKMSKey",
            description="KMS key for CloudWatch Logs encryption",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.RETAIN,
            alias="logs-encryption-key"
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
        
        self.password_policy = iam.CfnAccountPasswordPolicy(
            self, "PasswordPolicy",
            **PASSWORD_POLICY
        )

    def create_secure_parameters(self):
        """Create hierarchical secure parameters in Parameter Store"""
        
        # Database connection parameters
        self.db_password_param = ssm.StringParameter(
            self, "DBPasswordParam",
            parameter_name="/app/prod/db/password",
            description="Database password for production environment",
            string_value="ChangeMeInProduction!",  # Should be generated/rotated
            type=ssm.ParameterType.SECURE_STRING,
            tier=ssm.ParameterTier.STANDARD
        )
        
        self.db_username_param = ssm.StringParameter(
            self, "DBUsernameParam", 
            parameter_name="/app/prod/db/username",
            description="Database username for production environment",
            string_value="app_user",
            type=ssm.ParameterType.STRING
        )
        
        # Application configuration
        self.api_key_param = ssm.StringParameter(
            self, "APIKeyParam",
            parameter_name="/app/prod/api/key",
            description="External API key for production environment",
            string_value="secret-api-key-value",  # Should be generated
            type=ssm.ParameterType.SECURE_STRING
        )
        
        # JWT secret
        self.jwt_secret_param = ssm.StringParameter(
            self, "JWTSecretParam",
            parameter_name="/app/prod/auth/jwt-secret", 
            description="JWT signing secret for production environment",
            string_value="super-secret-jwt-key",  # Should be generated
            type=ssm.ParameterType.SECURE_STRING
        )

    def create_outputs(self):
        """Create CloudFormation outputs for created resources"""
        
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

"""
Network Stack (stacks/network_stack.py)
"""
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct
from stacks.security_stack import SecurityStack

class NetworkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 security_stack: SecurityStack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.security_stack = security_stack
        
        # Create VPC with proper network segmentation
        self.create_vpc()
        
        # Create security groups with minimal access
        self.create_security_groups()
        
        # Enable VPC Flow Logs
        self.enable_vpc_flow_logs()
        
        # Create VPC Endpoints for security
        self.create_vpc_endpoints()
        
        # Outputs
        self.create_outputs()

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
        
        # Web tier security group (ALB)
        self.web_sg = ec2.SecurityGroup(
            self, "WebTierSG",
            vpc=self.vpc,
            description="Security group for web tier (ALB)",
            allow_all_outbound=False
        )
        
        # Allow HTTPS inbound from internet
        self.web_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS inbound"
        )
        
        # Allow HTTP to redirect to HTTPS
        self.web_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP for redirect to HTTPS"
        )
        
        # Allow outbound to app tier only
        self.web_sg.add_egress_rule(
            ec2.Peer.security_group_id("${Token[TOKEN.123]}"),  # Will be replaced
            ec2.Port.tcp(8080),
            "Allow outbound to app tier"
        )
        
        # Application tier security group
        self.app_sg = ec2.SecurityGroup(
            self, "AppTierSG",
            vpc=self.vpc,
            description="Security group for application tier", 
            allow_all_outbound=False
        )
        
        # Allow inbound from web tier only
        self.app_sg.add_ingress_rule(
            ec2.Peer.security_group_id(self.web_sg.security_group_id),
            ec2.Port.tcp(8080),
            "Allow inbound from web tier"
        )
        
        # Allow outbound to database tier
        self.app_sg.add_egress_rule(
            ec2.Peer.security_group_id("${Token[TOKEN.456]}"),  # Will be replaced
            ec2.Port.tcp(5432),
            "Allow outbound to database tier"
        )
        
        # Allow outbound HTTPS for external API calls
        self.app_sg.add_egress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS outbound for external APIs"
        )
        
        # Database tier security group
        self.db_sg = ec2.SecurityGroup(
            self, "DatabaseTierSG",
            vpc=self.vpc,
            description="Security group for database tier",
            allow_all_outbound=False
        )
        
        # Allow inbound from app tier only
        self.db_sg.add_ingress_rule(
            ec2.Peer.security_group_id(self.app_sg.security_group_id),
            ec2.Port.tcp(5432),
            "Allow inbound from app tier"
        )
        
        # Lambda security group
        self.lambda_sg = ec2.SecurityGroup(
            self, "LambdaSG", 
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=False
        )
        
        # Allow outbound HTTPS only
        self.lambda_sg.add_egress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS outbound"
        )

    def enable_vpc_flow_logs(self):
        """Enable VPC Flow Logs for network monitoring"""
        
        # Create CloudWatch Log Group for VPC Flow Logs
        self.flow_logs_group = logs.LogGroup(
            self, "VPCFlowLogsGroup",
            log_group_name="/aws/vpc/flowlogs",
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.security_stack.logs_kms_key
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
            security_groups=[self.create_endpoint_sg()]
        )
        
        self.ssm_messages_endpoint = self.vpc.add_interface_endpoint(
            "SSMMessagesEndpoint", 
            service=ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.create_endpoint_sg()]
        )
        
        self.ec2_messages_endpoint = self.vpc.add_interface_endpoint(
            "EC2MessagesEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.create_endpoint_sg()]
        )

    def create_endpoint_sg(self):
        """Create security group for VPC endpoints"""
        
        endpoint_sg = ec2.SecurityGroup(
            self, "VPCEndpointSG",
            vpc=self.vpc,
            description="Security group for VPC endpoints",
            allow_all_outbound=False
        )
        
        # Allow HTTPS from private subnets
        endpoint_sg.add_ingress_rule(
            ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            ec2.Port.tcp(443),
            "Allow HTTPS from VPC"
        )
        
        return endpoint_sg

    def create_outputs(self):
        """Create outputs for network resources"""
        
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

"""
Compute Stack (stacks/compute_stack.py)
"""
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_ssm as ssm,
    Duration,
    CfnOutput
)
from constructs import Construct
from stacks.security_stack import SecurityStack
from stacks.network_stack import NetworkStack
from constructs.secure_lambda import SecureLambda
from constructs.secure_ec2 import SecureEC2

class ComputeStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 security_stack: SecurityStack, 
                 network_stack: NetworkStack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.security_stack = security_stack
        self.network_stack = network_stack
        
        # Create secure S3 bucket
        self.create_secure_s3_bucket()
        
        # Deploy secure Lambda functions
        self.create_lambda_functions()
        
        # Deploy secure EC2 instances
        self.create_ec2_instances()
        
        # Set up automated patching
        self.setup_automated_patching()
        
        # Outputs
        self.create_outputs()

    def create_secure_s3_bucket(self):
        """Create S3 bucket with all security best practices"""
        
        self.secure_bucket = s3.Bucket(
            self, "SecureApplicationBucket",
            bucket_name=f"secure-app-bucket-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.security_stack.app_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            server_access_logs_bucket=self.create_access_logs_bucket(),
            server_access_logs_prefix="access-logs/",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    status=s3.LifecycleRuleStatus.ENABLED,
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
                    status=s3.LifecycleRuleStatus.ENABLED,
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )
        
        # Add bucket notification configuration
        self.secure_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.security_lambda)  # Will be created below
        )

    def create_access_logs_bucket(self):
        """Create separate bucket for S3 access logs"""
        
        return s3.Bucket(
            self, "AccessLogsBucket",
            bucket_name=f"access-logs-bucket-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.security_stack.app_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    status=s3.LifecycleRuleStatus.ENABLED,
                    expiration=Duration.days(365)
                )
            ]
        )

    def create_lambda_functions(self):
        """Create secure Lambda functions with proper configuration"""
        
        # Security processing Lambda
        self.security_lambda = SecureLambda(
            self, "SecurityLambda",
            function_name="security-processor",
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
                "BUCKET_NAME": self.secure_bucket.bucket_name
            },
            vpc=self.network_stack.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.network_stack.lambda_sg],
            role=self.security_stack.lambda_role,
            kms_key=self.security_stack.lambda_kms_key,
            timeout=Duration.seconds(30),
            memory_size=256,
            reserved_concurrent_executions=10,
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_YEAR,
            log_retention_retry_options=logs.LogRetentionRetryOptions(
                base=Duration.milliseconds(200),
                max_retries=5
            )
        )
        
        # Grant S3 permissions to Lambda
        self.secure_bucket.grant_read_write(self.security_lambda.function)

    def create_ec2_instances(self):
        """Create secure EC2 instances with hardened configuration"""
        
        # Application server in private subnet
        self.app_server = SecureEC2(
            self, "AppServer",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(),
            vpc=self.network_stack.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=self.network_stack.app_sg,
            role=self.security_stack.ec2_role,
            key_name=None,  # No SSH keys - use Session Manager
            user_data=ec2.UserData.for_linux(),
            require_imdsv2=True,
            block_device_mappings=[
                ec2.BlockDeviceMapping(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDevice.ebs(
                        volume_size=20,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                        encrypted=True,
                        kms_key=self.security_stack.app_kms_key,
                        delete_on_termination=True
                    )
                )
            ]
        )

    def setup_automated_patching(self):
        """Configure AWS Systems Manager Patch Manager for automated patching"""
        
        # Create patch baseline for Amazon Linux
        self.patch_baseline = ssm.CfnPatchBaseline(
            self, "PatchBaseline",
            name="SecureApplicationPatchBaseline",
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
                                    values=["Security", "Bugfix", "Critical"]
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
            name="ProductionMaintenanceWindow", 
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
            service_role_arn=self.create_maintenance_role().role_arn,
            task_parameters={
                "Operation": {
                    "Values": ["Install"]
                }
            }
        )

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

    def create_outputs(self):
        """Create outputs for compute resources"""
        
        CfnOutput(self, "SecureBucketName", value=self.secure_bucket.bucket_name,
                 description="Secure S3 bucket name")
        CfnOutput(self, "SecurityLambdaArn", value=self.security_lambda.function_arn,
                 description="Security Lambda function ARN")
        CfnOutput(self, "AppServerInstanceId", value=self.app_server.instance_id,
                 description="Application server instance ID")



"""
Monitoring Stack (stacks/monitoring_stack.py)
"""
from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subs,
    aws_logs as logs,
    aws_events as events,
    aws_events_targets as targets,
    Duration,
    CfnOutput
)
from constructs import Construct
from stacks.security_stack import SecurityStack
from stacks.network_stack import NetworkStack
from stacks.compute_stack import ComputeStack
from config.constants import NIST_CONTROLS

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 security_stack: SecurityStack,
                 network_stack: NetworkStack, 
                 compute_stack: ComputeStack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.security_stack = security_stack
        self.network_stack = network_stack
        self.compute_stack = compute_stack
        
        # Create SNS topics for notifications
        self.create_notification_topics()
        
        # Set up CloudWatch alarms
        self.create_security_alarms()
        
        # Create security dashboard
        self.create_security_dashboard()
        
        # Set up custom metrics and logs monitoring
        self.setup_custom_monitoring()
        
        # Outputs
        self.create_outputs()

    def create_notification_topics(self):
        """Create SNS topics for different types of security alerts"""
        
        # Critical security alerts
        self.critical_alerts_topic = sns.Topic(
            self, "CriticalSecurityAlerts",
            topic_name="critical-security-alerts",
            display_name="Critical Security Alerts",
            kms_master_key=self.security_stack.app_kms_key
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
            kms_master_key=self.security_stack.app_kms_key
        )
        
        # Add email subscription
        self.warning_alerts_topic.add_subscription(
            subs.EmailSubscription("security-ops@company.com")
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
            metric=self.compute_stack.security_lambda.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        lambda_errors_alarm.add_alarm_action(
            cw_actions.SnsAction(self.warning_alerts_topic)
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
                            self.compute_stack.security_lambda.metric_errors(),
                            self.compute_stack.security_lambda.metric_duration(),
                            self.compute_stack.security_lambda.metric_invocations()
                        ],
                        width=12,
                        height=6
                    )
                ],
                [
                    # VPC Flow Logs
                    cloudwatch.LogQueryWidget(
                        title="Top 10 Source IPs (VPC Flow Logs)",
                        log_groups=[self.network_stack.flow_logs_group],
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

    def setup_custom_monitoring(self):
        """Set up custom monitoring and log analysis"""
        
        # Create log metric filters for security events
        self.create_log_metric_filters()
        
        # Set up EventBridge rules for real-time monitoring
        self.create_eventbridge_rules()

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

    def create_outputs(self):
        """Create outputs for monitoring resources"""
        
        CfnOutput(self, "CriticalAlertsTopicArn", 
                 value=self.critical_alerts_topic.topic_arn,
                 description="Critical alerts SNS topic ARN")
        CfnOutput(self, "WarningAlertsTopicArn",
                 value=self.warning_alerts_topic.topic_arn, 
                 description="Warning alerts SNS topic ARN")
        CfnOutput(self, "SecurityDashboardUrl",
                 value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.security_dashboard.dashboard_name}",
                 description="Security monitoring dashboard URL")

"""
7. Compliance Stack (stacks/compliance_stack.py)
"""
from aws_cdk import (
    Stack,
    aws_cloudtrail as cloudtrail,
    aws_guardduty as guardduty,
    aws_config as config,
    aws_s3 as s3,
    aws_iam as iam,
    CfnOutput
)
from constructs import Construct
from stacks.security_stack import SecurityStack
from config.constants import NIST_CONTROLS

class ComplianceStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 security_stack: SecurityStack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.security_stack = security_stack
        
        # Enable AWS CloudTrail
        self.enable_cloudtrail()
        
        # Enable AWS GuardDuty
        self.enable_guardduty()
        
        # Set up AWS Config rules
        self.setup_config_rules()
        
        # Create compliance reporting
        self.setup_compliance_reporting()
        
        # Outputs
        self.create_outputs()

    def enable_cloudtrail(self):
        """Enable AWS CloudTrail for audit logging (NIST AU-2, AU-12)"""
        
        # Create S3 bucket for CloudTrail logs
        self.cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            bucket_name=f"cloudtrail-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.security_stack.logs_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="CloudTrailLogRetention",
                    status=s3.LifecycleRuleStatus.ENABLED,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(90)
                        )
                    ],
                    expiration=cdk.Duration.days(2557)  # 7 years retention
                )
            ]
        )
        
        # Create CloudTrail
        self.trail = cloudtrail.Trail(
            self, "ComplianceTrail",
            trail_name="ComplianceAuditTrail",
            bucket=self.cloudtrail_bucket,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            kms_key=self.security_stack.logs_kms_key,
            management_events=cloudtrail.ReadWriteType.ALL,
            data_events=[
                cloudtrail.DataEvent(
                    resource=cloudtrail.DataResource.all_s3_objects(),
                    include_management_events=True,
                    read_write_type=cloudtrail.ReadWriteType.ALL
                )
            ]
        )

    def enable_guardduty(self):
        """Enable AWS GuardDuty for threat detection (NIST SI-4)"""
        
        self.guardduty_detector = guardduty.CfnDetector(
            self, "GuardDutyDetector",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES",
            data_sources=guardduty.CfnDetector.CFNDataSourceConfigurationsProperty(
                s3_logs=guardduty.CfnDetector.CFNS3LogsConfigurationProperty(
                    enable=True
                ),
                kubernetes=guardduty.CfnDetector.CFNKubernetesConfigurationProperty(
                    audit_logs=guardduty.CfnDetector.CFNKubernetesAuditLogsConfigurationProperty(
                        enable=True
                    )
                ),
                malware_protection=guardduty.CfnDetector.CFNMalwareProtectionConfigurationProperty(
                    scan_ec2_instance_with_findings=guardduty.CfnDetector.CFNScanEc2InstanceWithFindingsConfigurationProperty(
                        ebs_volumes=True
                    )
                )
            )
        )

    def setup_config_rules(self):
        """Set up AWS Config rules for compliance monitoring"""
        
        # Enable AWS Config
        self.config_recorder = self.create_config_recorder()
        self.config_delivery_channel = self.create_config_delivery_channel()
        
        # NIST AC-2: Account Management
        self.create_config_rule(
            "MFAEnabledForRoot",
            "mfa-enabled-for-iam-console-access",
            "Ensures MFA is enabled for root account",
            ["NIST-800-53-AC-2"]
        )
        
        # NIST AC-6: Least Privilege  
        self.create_config_rule(
            "UnusedIAMCredentials", 
            "iam-user-unused-credentials-check",
            "Checks for unused IAM credentials",
            ["NIST-800-53-AC-6"]
        )
        
        # NIST SC-7: Boundary Protection
        self.create_config_rule(
            "SecurityGroupSSHRestricted",
            "incoming-ssh-disabled", 
            "Checks that security groups don't allow unrestricted SSH",
            ["NIST-800-53-SC-7"]
        )
        
        self.create_config_rule(
            "SecurityGroupHTTPSOnly",
            "securitygroup-attached-to-eni",
            "Checks security group configurations",
            ["NIST-800-53-SC-7"]
        )
        
        # NIST SC-8: Transmission Confidentiality
        self.create_config_rule(
            "S3BucketSSLRequestsOnly",
            "s3-bucket-ssl-requests-only",
            "Checks that S3 buckets deny insecure requests",
            ["NIST-800-53-SC-8"]
        )
        
        # NIST SC-28: Protection of Information at Rest
        self.create_config_rule(
            "S3BucketServerSideEncryption",
            "s3-bucket-server-side-encryption-enabled",
            "Checks that S3 buckets have encryption enabled", 
            ["NIST-800-53-SC-28"]
        )
        
        self.create_config_rule(
            "EBSEncryptedVolumes",
            "encrypted-volumes",
            "Checks that EBS volumes are encrypted",
            ["NIST-800-53-SC-28"]
        )
        
        # NIST CM-2: Baseline Configuration
        self.create_config_rule(
            "EC2InstanceManagedBySSM",
            "ec2-managedinstance-association-compliance-status-check",
            "Checks EC2 instances are managed by Systems Manager",
            ["NIST-800-53-CM-2"]
        )

    def create_config_recorder(self):
        """Create AWS Config configuration recorder"""
        
        # Create service role for Config
        config_role = iam.Role(
            self, "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/ConfigRole"
                )
            ]
        )
        
        return config.CfnConfigurationRecorder(
            self, "ConfigRecorder",
            role_arn=config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True,
                include_global_resource_types=True,
                recording_mode=config.CfnConfigurationRecorder.RecordingModeProperty(
                    recording_frequency="CONTINUOUS"
                )
            )
        )

    def create_config_delivery_channel(self):
        """Create AWS Config delivery channel"""
        
        # Create S3 bucket for Config
        config_bucket = s3.Bucket(
            self, "ConfigBucket",
            bucket_name=f"aws-config-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.security_stack.logs_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True
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
        
        return config.CfnConfigRule(
            self, rule_id,
            config_rule_name=rule_id,
            description=f"{description} (Maps to: {', '.join(nist_controls)})",
            source=config.CfnConfigRule.SourceProperty(
                owner="AWS",
                source_identifier=source_identifier
            ),
            depends_on=[self.config_recorder]
        )

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
                        title="GuardDuty Findings (24h)",
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/GuardDuty",
                                metric_name="FindingCount",
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
        """Create outputs for compliance resources"""
        
        CfnOutput(self, "CloudTrailArn", value=self.trail.trail_arn,
                 description="CloudTrail ARN")
        CfnOutput(self, "GuardDutyDetectorId", value=self.guardduty_detector.ref,
                 description="GuardDuty Detector ID")
        CfnOutput(self, "ComplianceDashboardUrl",
                 value
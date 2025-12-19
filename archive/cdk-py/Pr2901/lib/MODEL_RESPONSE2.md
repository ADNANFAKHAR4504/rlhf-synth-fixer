``````python
"""
Compliance Stack Completion (stacks/compliance_stack.py)
"""

from aws_cdk import (
    Stack,
    aws_cloudtrail as cloudtrail,
    aws_guardduty as guardduty,
    aws_config as config,
    aws_cloudwatch as cloudwatch,
    aws_s3 as s3,
    aws_iam as iam,
    Duration,
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
                ]
            ]
        )

    def create_outputs(self):
        """Create outputs for compliance resources"""
        
        CfnOutput(self, "CloudTrailArn", value=self.trail.trail_arn,
                 description="CloudTrail ARN")
        CfnOutput(self, "CloudTrailBucketName", value=self.cloudtrail_bucket.bucket_name,
                 description="CloudTrail S3 Bucket Name")
        CfnOutput(self, "GuardDutyDetectorId", value=self.guardduty_detector.ref,
                 description="GuardDuty Detector ID")
        CfnOutput(self, "ComplianceDashboardUrl",
                 value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.compliance_dashboard.dashboard_name}",
                 description="NIST Compliance Dashboard URL")

"""
Tagging Aspect (constructs/tagging_aspect.py)
"""

from aws_cdk import IAspect, Tags
from constructs import IConstruct

class TaggingAspect(IAspect):
    """CDK Aspect for applying consistent tags to all resources"""
    
    def __init__(self, tags: dict):
        self.tags = tags
    
    def visit(self, node: IConstruct) -> None:
        """Apply tags to all taggable resources"""
        for key, value in self.tags.items():
            Tags.of(node).add(key, value)
        
        # Add resource-specific tags
        if hasattr(node, 'node'):
            resource_type = node.node.type_hint or "Unknown"
            Tags.of(node).add("ResourceType", resource_type)
            Tags.of(node).add("StackName", node.node.scope.stack_name if hasattr(node.node.scope, 'stack_name') else "Unknown")

"""
Secure Lambda Construct (constructs/secure_lambda.py)
"""

from aws_cdk import (
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_ec2 as ec2,
    aws_iam as iam,
    Duration
)
from constructs import Construct

class SecureLambda(Construct):
    """Secure Lambda function with enterprise security best practices"""
    
    def __init__(self, scope: Construct, construct_id: str, 
                 function_name: str,
                 runtime: lambda_.Runtime,
                 handler: str,
                 code: lambda_.Code,
                 environment: dict = None,
                 vpc: ec2.Vpc = None,
                 vpc_subnets: ec2.SubnetSelection = None,
                 security_groups: list = None,
                 role: iam.Role = None,
                 kms_key = None,
                 timeout: Duration = Duration.seconds(30),
                 memory_size: int = 128,
                 reserved_concurrent_executions: int = None,
                 tracing = lambda_.Tracing.ACTIVE,
                 log_retention = logs.RetentionDays.ONE_YEAR,
                 log_retention_retry_options = None,
                 **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create log group first
        self.log_group = logs.LogGroup(
            self, f"{function_name}LogGroup",
            log_group_name=f"/aws/lambda/{function_name}",
            retention=log_retention,
            encryption_key=kms_key,
            retry_options=log_retention_retry_options
        )
        
        # Create the Lambda function with security best practices
        self.function = lambda_.Function(
            self, f"{function_name}Function",
            function_name=function_name,
            runtime=runtime,
            handler=handler,
            code=code,
            environment=environment or {},
            vpc=vpc,
            vpc_subnets=vpc_subnets,
            security_groups=security_groups,
            role=role,
            environment_encryption=kms_key,
            timeout=timeout,
            memory_size=memory_size,
            reserved_concurrent_executions=reserved_concurrent_executions,
            tracing=tracing,
            log_group=self.log_group,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )
        
        # Add security-related environment variables
        self.function.add_environment("AWS_LAMBDA_EXEC_WRAPPER", "/opt/otel-instrument")
        self.function.add_environment("LAMBDA_LOG_LEVEL", "INFO")
        
    @property
    def function_arn(self) -> str:
        return self.function.function_arn
    
    @property  
    def function_name(self) -> str:
        return self.function.function_name
        
    def metric_errors(self):
        return self.function.metric_errors()
        
    def metric_duration(self):
        return self.function.metric_duration()
        
    def metric_invocations(self):
        return self.function.metric_invocations()


"""
 Secure EC2 Construct (constructs/secure_ec2.py)
"""
from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    Tags
)
from constructs import Construct

class SecureEC2(Construct):
    """Secure EC2 instance with enterprise security best practices"""
    
    def __init__(self, scope: Construct, construct_id: str,
                 instance_type: ec2.InstanceType,
                 machine_image: ec2.IMachineImage,
                 vpc: ec2.Vpc,
                 vpc_subnets: ec2.SubnetSelection,
                 security_group: ec2.SecurityGroup,
                 role: iam.Role,
                 key_name: str = None,
                 user_data: ec2.UserData = None,
                 require_imdsv2: bool = True,
                 block_device_mappings: list = None,
                 **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create enhanced user data for security
        if user_data is None:
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
        
        # Create the EC2 instance
        self.instance = ec2.Instance(
            self, f"{construct_id}Instance",
            instance_type=instance_type,
            machine_image=machine_image,
            vpc=vpc,
            vpc_subnets=vpc_subnets,
            security_group=security_group,
            role=role,
            key_name=key_name,
            user_data=user_data,
            require_imdsv2=require_imdsv2,
            block_device_mappings=block_device_mappings or []
        )
        
        # Add tags for patch management
        Tags.of(self.instance).add("PatchGroup", "Production")
        Tags.of(self.instance).add("MaintenanceWindow", "ProductionMaintenanceWindow")
        Tags.of(self.instance).add("Environment", "prod")
        
    @property
    def instance_id(self) -> str:
        return self.instance.instance_id
    
    @property
    def instance_private_ip(self) -> str:
        return self.instance.instance_private_ip

"""
Updated Compute Stack (stacks/compute_stack.py)
"""
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    aws_ssm as ssm,
    aws_iam as iam,
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
        
        # Create secure S3 bucket first
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
        
        # Create access logs bucket first
        self.access_logs_bucket = s3.Bucket(
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
        
        self.secure_bucket = s3.Bucket(
            self, "SecureApplicationBucket",
            bucket_name=f"secure-app-bucket-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.security_stack.app_kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            server_access_logs_bucket=self.access_logs_bucket,
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
        
        # Add S3 event notification
        self.secure_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.security_lambda.function)
        )

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
        
        # Create maintenance role first
        self.maintenance_role = iam.Role(
            self, "MaintenanceRole",
            assumed_by=iam.ServicePrincipal("ssm.amazonaws.com"),
            description="Role for Systems Manager maintenance window tasks",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonSSMMaintenanceWindowRole"
                )
            ]
        )
        
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
            service_role_arn=self.maintenance_role.role_arn,
            task_parameters={
                "Operation": {
                    "Values": ["Install"]
                }
            }
        )

    def create_outputs(self):
        """Create outputs for compute resources"""
        
        CfnOutput(self, "SecureBucketName", value=self.secure_bucket.bucket_name,
                 description="Secure S3 bucket name")
        CfnOutput(self, "SecurityLambdaArn", value=self.security_lambda.function_arn,
                 description="Security Lambda function ARN")
        CfnOutput(self, "AppServerInstanceId", value=self.app_server.instance_id,
                 description="Application server instance ID")
        CfnOutput(self, "MaintenanceWindowId", value=self.maintenance_window.ref,
                 description="Maintenance window ID for patching")
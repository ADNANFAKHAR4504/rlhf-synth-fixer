"""rds_high_availability_infra.py
This module defines the RDS High Availability Infrastructure stack with PostgreSQL,
S3 backups, monitoring, and security features.
"""

from typing import Optional, Dict
import aws_cdk as cdk
from aws_cdk import (
    aws_rds as rds,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_kms as kms,
    aws_ec2 as ec2,
    aws_backup as backup,
    aws_events as events,
    Duration,
    RemovalPolicy,
    CfnOutput,
)
from constructs import Construct


class RdsHighAvailabilityInfraProps:
    """
  Properties for the RDS High Availability Infrastructure stack.

  Attributes:
    environment_suffix (str): Environment suffix for resource naming
    vpc_id (Optional[str]): Existing VPC ID to use
    admin_email (str): Administrator email for notifications
    cost_center (str): Cost center tag value
    project (str): Project tag value
    is_localstack (bool): Whether deploying to LocalStack
  """

    def __init__(self,
                 environment_suffix: str,
                 vpc_id: Optional[str] = None,
                 admin_email: str = "admin@company.com",
                 cost_center: str = "engineering",
                 project: str = "tap",
                 is_localstack: bool = False):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.admin_email = admin_email
        self.cost_center = cost_center
        self.project = project
        self.is_localstack = is_localstack


class RdsHighAvailabilityInfra(cdk.NestedStack):
    """
  RDS High Availability Infrastructure stack implementing PostgreSQL with
  automatic backups, monitoring, and security features.

  This stack creates:
  - RDS PostgreSQL instance with Multi-AZ deployment
  - S3 bucket for backup storage with versioning and lifecycle policies
  - IAM roles with least privilege permissions
  - CloudWatch alarms for monitoring
  - SNS topic for notifications
  - KMS keys for encryption
  - AWS Backup for automated snapshots
  """

    def __init__(self, scope: Construct, construct_id: str,
                 props: RdsHighAvailabilityInfraProps, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        self.props = props
        self.common_tags = self._get_common_tags()

        # Apply tags to this nested stack - they will be inherited by the CloudFormation stack
        for key, value in self.common_tags.items():
            cdk.Tags.of(self).add(key, value)

        # Create KMS keys for encryption
        self._create_kms_keys()

        # Get or create VPC
        self._setup_vpc()

        # Create S3 bucket for backups
        self._create_backup_s3_bucket()

        # Create SNS topic for notifications
        self._create_sns_topic()

        # Create IAM roles
        self._create_iam_roles()

        # Create RDS subnet group
        self._create_db_subnet_group()

        # Create security groups
        self._create_security_groups()

        # Create RDS instance
        self._create_rds_instance()

        # Set up CloudWatch monitoring
        self._setup_cloudwatch_monitoring()

        # Set up AWS Backup (skip for LocalStack as it's not well supported)
        if not self.props.is_localstack:
            self._setup_aws_backup()

        # Create outputs
        self._create_outputs()

    def _get_common_tags(self) -> Dict[str, str]:
        """Generate common tags for all resources."""
        return {
            "CostCenter": self.props.cost_center,
            "Environment": self.props.environment_suffix,
            "Project": self.props.project,
            "ManagedBy": "CDK"
        }

    def _create_kms_keys(self):
        """Create KMS keys for RDS and S3 encryption."""
        # KMS key for RDS encryption
        self.rds_kms_key = kms.Key(
            self,
            "RdsKmsKey",
            description=
            f"KMS key for RDS encryption - {self.props.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Add tags to KMS key
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.rds_kms_key).add(key, value)

        # KMS key for S3 encryption
        self.s3_kms_key = kms.Key(
            self,
            "S3KmsKey",
            description=
            f"KMS key for S3 backup encryption - {self.props.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Add tags to KMS key
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.s3_kms_key).add(key, value)

    def _setup_vpc(self):
        """Set up VPC with private and public subnets."""
        if self.props.vpc_id:
            # Use existing VPC
            self.vpc = ec2.Vpc.from_lookup(self,
                                           "ExistingVpc",
                                           vpc_id=self.props.vpc_id)
        else:
            # Create new VPC with simplified configuration for LocalStack
            # LocalStack Community has limited NAT Gateway support
            max_azs = 2 if self.props.is_localstack else 3
            nat_gateways = 0 if self.props.is_localstack else 2

            # Simplified subnet configuration for LocalStack
            if self.props.is_localstack:
                # LocalStack: Use simpler configuration
                subnet_config = [
                    ec2.SubnetConfiguration(name="Public",
                                            subnet_type=ec2.SubnetType.PUBLIC,
                                            cidr_mask=24),
                    ec2.SubnetConfiguration(
                        name="Database",
                        subnet_type=ec2.SubnetType.PUBLIC,  # Use public for LocalStack compatibility
                        cidr_mask=24)
                ]
            else:
                # AWS: Full configuration with private subnets
                subnet_config = [
                    ec2.SubnetConfiguration(name="Public",
                                            subnet_type=ec2.SubnetType.PUBLIC,
                                            cidr_mask=24),
                    ec2.SubnetConfiguration(
                        name="Private",
                        subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                        cidr_mask=24),
                    ec2.SubnetConfiguration(
                        name="Database",
                        subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                        cidr_mask=24)
                ]

            self.vpc = ec2.Vpc(
                self,
                "RdsVpc",
                max_azs=max_azs,
                nat_gateways=nat_gateways,
                subnet_configuration=subnet_config)

            # Add tags to VPC
            for key, value in self.common_tags.items():
                cdk.Tags.of(self.vpc).add(key, value)

    def _create_backup_s3_bucket(self):
        """Create S3 bucket for database backups with versioning and lifecycle policies."""
        bucket_name = f"rds-backups-{self.props.project}-{self.props.environment_suffix}"

        self.backup_bucket = s3.Bucket(
            self,
            "BackupBucket",
            bucket_name=bucket_name,
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="BackupRetentionRule",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)),
                        s3.Transition(storage_class=s3.StorageClass.GLACIER,
                                      transition_after=Duration.days(90)),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=Duration.days(365))
                    ],
                    expiration=Duration.days(2555)  # 7 years retention
                )
            ])

        # Add tags to S3 bucket
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.backup_bucket).add(key, value)

    def _create_sns_topic(self):
        """Create SNS topic for notifications."""
        self.notification_topic = sns.Topic(
            self,
            "NotificationTopic",
            topic_name=f"rds-alerts-{self.props.environment_suffix}",
            display_name=f"RDS Alerts - {self.props.environment_suffix.upper()}"
        )

        # Ensure SNS topic is deleted with stack
        self.notification_topic.apply_removal_policy(RemovalPolicy.DESTROY)

        # Add email subscription
        self.notification_topic.add_subscription(
            sns_subscriptions.EmailSubscription(self.props.admin_email))

        # Add tags to SNS topic
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.notification_topic).add(key, value)

    def _create_iam_roles(self):
        """Create IAM roles with least privilege permissions."""
        # Role for RDS enhanced monitoring
        self.rds_monitoring_role = iam.Role(
            self,
            "RdsMonitoringRole",
            assumed_by=iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonRDSEnhancedMonitoringRole")
            ])
        self.rds_monitoring_role.apply_removal_policy(RemovalPolicy.DESTROY)

        # Role for AWS Backup
        self.backup_role = iam.Role(
            self,
            "BackupRole",
            assumed_by=iam.ServicePrincipal("backup.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSBackupServiceRolePolicyForBackup"),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSBackupServiceRolePolicyForRestores")
            ])
        self.backup_role.apply_removal_policy(RemovalPolicy.DESTROY)

        # Additional permissions for S3 backup access
        self.backup_role.add_to_policy(
            iam.PolicyStatement(effect=iam.Effect.ALLOW,
                                actions=[
                                    "s3:GetObject", "s3:PutObject",
                                    "s3:DeleteObject", "s3:ListBucket"
                                ],
                                resources=[
                                    self.backup_bucket.bucket_arn,
                                    f"{self.backup_bucket.bucket_arn}/*"
                                ]))

        # KMS permissions for backup role
        self.backup_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt", "kms:Encrypt", "kms:GenerateDataKey",
                    "kms:ReEncrypt*", "kms:CreateGrant"
                ],
                resources=[self.rds_kms_key.key_arn, self.s3_kms_key.key_arn]))

        # Add tags to IAM roles
        for role in [self.rds_monitoring_role, self.backup_role]:
            for key, value in self.common_tags.items():
                cdk.Tags.of(role).add(key, value)

    def _create_db_subnet_group(self):
        """Create RDS subnet group using private/isolated subnets."""
        # Use isolated subnets if available, otherwise private subnets
        # For LocalStack, use public subnets since we simplified the VPC
        if self.props.is_localstack:
            subnets = self.vpc.public_subnets
        else:
            subnets = self.vpc.isolated_subnets or self.vpc.private_subnets

        self.db_subnet_group = rds.SubnetGroup(
            self,
            "DbSubnetGroup",
            description=
            f"Subnet group for RDS - {self.props.environment_suffix}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnets=subnets))

        # Add tags to subnet group
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.db_subnet_group).add(key, value)

    def _create_security_groups(self):
        """Create security groups for RDS access."""
        self.db_security_group = ec2.SecurityGroup(
            self,
            "DbSecurityGroup",
            vpc=self.vpc,
            description=
            f"Security group for RDS PostgreSQL - {self.props.environment_suffix}",
            allow_all_outbound=False)

        # Allow PostgreSQL access from VPC subnets
        # For LocalStack, allow from all VPC; for AWS, restrict to private subnets
        if self.props.is_localstack:
            # LocalStack: Allow from entire VPC CIDR
            self.db_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
                connection=ec2.Port.tcp(5432),
                description="PostgreSQL access from VPC")
        else:
            # AWS: Allow from private subnets only
            for subnet in self.vpc.private_subnets:
                self.db_security_group.add_ingress_rule(
                    peer=ec2.Peer.ipv4(subnet.ipv4_cidr_block),
                    connection=ec2.Port.tcp(5432),
                    description="PostgreSQL access from private subnet")

        # Add tags to security group
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.db_security_group).add(key, value)

    def _create_rds_instance(self):
        """Create RDS PostgreSQL instance with Multi-AZ and auto-scaling."""
        # Parameter group for PostgreSQL optimization
        self.parameter_group = rds.ParameterGroup(
            self,
            "DbParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_7),
            parameters={
                "log_statement": "all",
                "log_min_duration_statement": "1000",
                "shared_preload_libraries": "pg_stat_statements",
                "track_activity_query_size": "2048"
            })

        # Create RDS instance
        # LocalStack doesn't support Multi-AZ and Performance Insights
        multi_az_enabled = not self.props.is_localstack
        performance_insights_enabled = not self.props.is_localstack

        self.db_instance = rds.DatabaseInstance(
            self,
            "PostgresInstance",
            instance_identifier=
            f"postgres-{self.props.project}-{self.props.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_7),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3,
                                              ec2.InstanceSize.MEDIUM),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.db_security_group],
            multi_az=multi_az_enabled,  # Enable Multi-AZ for high availability (disabled for LocalStack)
            storage_encrypted=True,
            storage_encryption_key=self.rds_kms_key,
            allocated_storage=100,
            max_allocated_storage=1000,  # Enable storage auto-scaling
            storage_type=rds.StorageType.GP2,
            backup_retention=Duration.days(35),  # Maximum backup retention
            preferred_backup_window="03:00-04:00",  # UTC backup window
            preferred_maintenance_window=
            "sun:04:00-sun:05:00",  # UTC maintenance window
            delete_automated_backups=False,
            deletion_protection=
            False,  # Changed to False to ensure destroyability
            parameter_group=self.parameter_group,
            monitoring_interval=Duration.seconds(60),  # Enhanced monitoring
            monitoring_role=self.rds_monitoring_role,
            enable_performance_insights=performance_insights_enabled,
            performance_insight_retention=rds.PerformanceInsightRetention.
            DEFAULT if performance_insights_enabled else None,
            performance_insight_encryption_key=self.rds_kms_key if performance_insights_enabled else None,
            cloudwatch_logs_exports=["postgresql"],
            auto_minor_version_upgrade=True,
            removal_policy=RemovalPolicy.
            DESTROY  # Changed to DESTROY for cleanup
        )

        # Add tags to RDS instance
        for key, value in self.common_tags.items():
            cdk.Tags.of(self.db_instance).add(key, value)

    def _setup_cloudwatch_monitoring(self):
        """Set up CloudWatch alarms for RDS monitoring."""
        # CPU Utilization alarm
        cpu_alarm = cloudwatch.Alarm(
            self,
            "CpuUtilizationAlarm",
            alarm_name=f"rds-cpu-{self.props.environment_suffix}",
            alarm_description="RDS CPU utilization is too high",
            metric=self.db_instance.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.
            GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING)
        cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic))

        # Free Storage Space alarm
        storage_alarm = cloudwatch.Alarm(
            self,
            "FreeStorageSpaceAlarm",
            alarm_name=f"rds-storage-{self.props.environment_suffix}",
            alarm_description="RDS free storage space is low",
            metric=self.db_instance.metric_free_storage_space(),
            threshold=2000000000,  # 2GB in bytes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.
            LESS_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING)
        storage_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic))

        # Database connections alarm
        connections_alarm = cloudwatch.Alarm(
            self,
            "DatabaseConnectionsAlarm",
            alarm_name=f"rds-connections-{self.props.environment_suffix}",
            alarm_description="RDS connection count is high",
            metric=self.db_instance.metric_database_connections(),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.
            GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING)
        connections_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic))

        # Add tags to alarms
        for alarm in [cpu_alarm, storage_alarm, connections_alarm]:
            for key, value in self.common_tags.items():
                cdk.Tags.of(alarm).add(key, value)

    def _setup_aws_backup(self):
        """Set up AWS Backup for automated snapshots with RPO < 5 minutes."""
        # Create backup vault
        self.backup_vault = backup.BackupVault(
            self,
            "BackupVault",
            backup_vault_name=
            f"rds-backup-vault-{self.props.environment_suffix}",
            encryption_key=self.rds_kms_key,
            removal_policy=RemovalPolicy.DESTROY)

        # Create backup plan with hourly backups (minimum AWS Backup interval)
        # LocalStack doesn't support continuous backups
        backup_rules = [
            backup.BackupPlanRule(
                backup_vault=self.backup_vault,
                rule_name="FrequentBackups",
                schedule_expression=events.Schedule.cron(
                    minute="0",  # Every hour (minimum allowed interval)
                    hour="*",
                    day="*",
                    month="*",
                    year="*"),
                delete_after=Duration.days(
                    7),  # Short retention for frequent backups
                enable_continuous_backup=not self.props.is_localstack,  # Disabled for LocalStack
                recovery_point_tags={
                    "BackupType": "Frequent",
                    **self.common_tags
                }),
            backup.BackupPlanRule(
                backup_vault=self.backup_vault,
                rule_name="DailyBackups",
                schedule_expression=events.Schedule.cron(
                    minute="0",
                    hour="2",  # 2 AM UTC
                    day="*",
                    month="*",
                    year="*"),
                delete_after=Duration.days(
                    35),  # Longer retention for daily backups
                recovery_point_tags={
                    "BackupType": "Daily",
                    **self.common_tags
                })
        ]

        self.backup_plan = backup.BackupPlan(
            self,
            "BackupPlan",
            backup_plan_name=f"rds-backup-plan-{self.props.environment_suffix}",
            backup_plan_rules=backup_rules)

        # Create backup selection
        backup.BackupSelection(
            self,
            "BackupSelection",
            backup_plan=self.backup_plan,
            resources=[
                backup.BackupResource.from_rds_database_instance(
                    self.db_instance)
            ],
            backup_selection_name=
            f"rds-selection-{self.props.environment_suffix}",
            role=self.backup_role)

        # Add tags to backup resources
        for resource in [self.backup_vault, self.backup_plan]:
            for key, value in self.common_tags.items():
                cdk.Tags.of(resource).add(key, value)

    def _create_outputs(self):
        """Create CloudFormation outputs."""
        # Don't use export_name in nested stacks as it can cause issues in LocalStack
        CfnOutput(self,
                  "RdsEndpoint",
                  value=self.db_instance.instance_endpoint.hostname,
                  description="RDS PostgreSQL endpoint")

        CfnOutput(self,
                  "RdsPort",
                  value=str(self.db_instance.instance_endpoint.port),
                  description="RDS PostgreSQL port")

        CfnOutput(
            self,
            "BackupBucketName",
            value=self.backup_bucket.bucket_name,
            description="S3 backup bucket name")

        CfnOutput(
            self,
            "NotificationTopicArn",
            value=self.notification_topic.topic_arn,
            description="SNS notification topic ARN"
        )

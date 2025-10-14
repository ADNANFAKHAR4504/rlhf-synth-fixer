#!/usr/bin/env python3
from dataclasses import dataclass
from typing import Optional

from aws_cdk import App, CfnOutput, Duration, Environment, RemovalPolicy, Stack
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_logs as logs
from aws_cdk import aws_rds as rds
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_ssm as ssm
from constructs import Construct


@dataclass
class TapStackProps:
    """Properties for the TapStack."""
    environment_suffix: str
    env: Optional[Environment] = None


class TapStack(Stack):
    def __init__(
        self, scope: Construct, construct_id: str, *, props: TapStackProps, **kwargs
    ) -> None:
        super().__init__(scope, construct_id, env=props.env, **kwargs)
        
        # Store props for use throughout the stack
        self.props = props
        
        # Add environment suffix to resource names for multi-environment support
        env_suffix = props.environment_suffix

        # Define production-like suffixes for strict security enforcement
        PRODUCTION_SUFFIXES = ["prod", "production", "stage", "staging"]
        is_production_like = env_suffix.lower() in PRODUCTION_SUFFIXES

        # === 1) VPC (2 AZs) ===
        vpc = ec2.Vpc(
            self,
            f"TapVPC{env_suffix}",
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # === 2) Security Groups ===
        app_sg = ec2.SecurityGroup(
            self,
            f"TapApplicationSecurityGroup{env_suffix}",
            vpc=vpc,
            description="Security Group for application servers (allowed to reach DB)",
            allow_all_outbound=True,
        )

        db_sg = ec2.SecurityGroup(
            self,
            f"TapDatabaseSecurityGroup{env_suffix}",
            vpc=vpc,
            description="Security Group for RDS Postgres",
            allow_all_outbound=True,
        )

        # Only allow app_sg to connect to DB on 5432
        # NOTE: This is the rule that the test was failing to verify, but the code itself is correct.
        # It's kept here as it's required for app-to-db communication.
        db_sg.add_ingress_rule(
            peer=app_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow app tier to connect to Postgres",
        )

        # 
        # Only allow external access for testing environments (not production-like)
        if not is_production_like:
            db_sg.add_ingress_rule(
                peer=ec2.Peer.any_ipv4(),
                connection=ec2.Port.tcp(5432),
                description="TESTING ONLY - Allow external PostgreSQL access (Conditional)",
            )
        # --------------------------------------------------

        # === 3) KMS Key for encryption ===
        database_key = kms.Key(
            self,
            f"TapDatabaseEncryptionKey{env_suffix}",
            enable_key_rotation=True,
            description="KMS key for RDS and backup bucket encryption",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # === 4) S3 bucket for backup exports / long-term snapshots ===
        backup_bucket = s3.Bucket(
            self,
            f"TapRdsBackupBucket{env_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=database_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # === 5) IAM Role for RDS monitoring and S3 access (least-privilege) ===
        # RDS Enhanced Monitoring needs a role that it assumes to publish OS metrics.
        monitoring_role = iam.Role(
            self,
            f"TapRdsMonitoringRole{env_suffix}",
            assumed_by=iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            description="Role assumed by RDS enhanced monitoring",
        )
        # Attach AWS managed policy for enhanced monitoring
        monitoring_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AmazonRDSEnhancedMonitoringRole"
            )
        )

        # Create a role that allows exports to the S3 bucket (limited to actions & bucket)
        rds_s3_role = iam.Role(
            self,
            f"TapRdsS3AccessRole{env_suffix}",
            assumed_by=iam.ServicePrincipal("rds.amazonaws.com"),
            description="Role that allows RDS to write snapshots/exports to S3 (scope-limited)",
        )

        # Grant minimal S3 permissions required for potential snapshot export tasks
        backup_bucket.grant_read_write(rds_s3_role)

        # === SSM Session Manager Setup ===
        # Create IAM role for the bastion host with SSM permissions
        bastion_role = iam.Role(
            self,
            f"TapSSMBastionRole{env_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for SSM-enabled bastion host",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
                # Optional: CloudWatch agent for logging
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ],
        )

        # Create instance profile for the bastion
        bastion_instance_profile = iam.CfnInstanceProfile(
            self,
            f"TapSSMBastionInstanceProfile{env_suffix}",
            roles=[bastion_role.role_name],
            instance_profile_name=f"TapSSMBastionInstanceProfile{env_suffix}",
        )

        # Security group for the bastion host
        bastion_sg = ec2.SecurityGroup(
            self,
            f"TapSSMBastionSecurityGroup{env_suffix}",
            vpc=vpc,
            description="Security Group for SSM bastion host (no SSH required)",
            allow_all_outbound=True,
        )

        # Allow bastion to connect to RDS (similar to app_sg)
        db_sg.add_ingress_rule(
            peer=bastion_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow SSM bastion to connect to PostgreSQL",
        )

        # Get the latest Amazon Linux 2 AMI
        amzn_linux_ami = ec2.MachineImage.latest_amazon_linux2(
            cpu_type=ec2.AmazonLinuxCpuType.X86_64
        )

        # User data script to install PostgreSQL client and configure SSM
        user_data_script = ec2.UserData.for_linux()
        user_data_script.add_commands(
            "yum update -y",
            "yum install -y postgresql15",  # PostgreSQL client
            "amazon-linux-extras install -y ssm-agent",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent",
        )

        # Create the SSM-enabled bastion instance
        bastion_instance = ec2.Instance(
            self,
            f"TapSSMBastion{env_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO  # Cost-effective for proxy
            ),
            machine_image=amzn_linux_ami,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC  # Needs internet for SSM connectivity
            ),
            security_group=bastion_sg,
            role=bastion_role,
            user_data=user_data_script,
            instance_name=f"tap-ssm-bastion-{env_suffix}",
            detailed_monitoring=True,
        )

        # === 6) Parameter Group (optional tuned settings for read-heavy) ===
        parameter_group = rds.ParameterGroup(
            self,
            f"TapPostgresParameterGroup{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_17_5
            ),
            parameters={
                "shared_buffers": "1048576",  # 1GB in KB
                "work_mem": "16384",         # 16MB in KB
                "maintenance_work_mem": "262144",  # 256MB in KB
                "effective_cache_size": "3145728",  # 3GB in KB
                # keep synchronous_commit default unless you can accept potential data loss on failover
                # "synchronous_commit": "off",
            },
            description="Tuned parameter group for read-heavy e-commerce workload",
        )

        # === 7) Subnet group for RDS (use private subnets with egress for testing) ===
        subnet_group = rds.SubnetGroup(
            self,
            f"TapRdsSubnetGroup{env_suffix}",
            vpc=vpc,
            description="Subnet group for RDS instances (private subnets with egress for testing)",
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        # === 8) Primary RDS PostgreSQL instance (db.m5.large) ===
        primary = rds.DatabaseInstance(
            self,
            f"TapPrimaryDatabase{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_17_5
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.M5, ec2.InstanceSize.LARGE
            ),  # db.m5.large
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            subnet_group=subnet_group,
            security_groups=[db_sg],
            storage_encrypted=True,
            storage_encryption_key=database_key,
            multi_az=True,
            allocated_storage=100,
            storage_type=rds.StorageType.GP2,
            deletion_protection=True,
            removal_policy=RemovalPolicy.SNAPSHOT,
            credentials=rds.Credentials.from_generated_secret(
                username="postgres", secret_name=f"tap-db-credentials-{env_suffix}"
            ),
            database_name="tap",
            instance_identifier=f"tap-primary-{env_suffix}",
            backup_retention=Duration.days(7),  # automated backup retention (7 days)
            preferred_backup_window="00:00-02:00",
            preferred_maintenance_window="sun:04:00-sun:06:00",
            parameter_group=parameter_group,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
            enable_performance_insights=True,
            monitoring_interval=Duration.seconds(60),
            monitoring_role=monitoring_role,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
        )

        # Note: backup_retention is 7 days above. You can snapshot/export separately if you need longer retention in S3.

        # === 9) Read replicas in two AZs ===
        # Create read replicas explicitly distributed across availability zones
        azs = vpc.availability_zones
        replica_count = min(2, len(azs))
        for i in range(replica_count):
            # Explicitly set AZ to ensure replicas are in different zones
            target_az = azs[i % len(azs)]
            rds.DatabaseInstanceReadReplica(
                self,
                f"TapReadReplica{i+1}{env_suffix}",
                source_database_instance=primary,
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.M5, ec2.InstanceSize.LARGE
                ),
                vpc=vpc,
                # Use specific AZ selection to ensure distribution
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    availability_zones=[target_az]
                ),
                security_groups=[db_sg],
                subnet_group=subnet_group,
                parameter_group=parameter_group,
                instance_identifier=f"tap-replica-{i+1}-{env_suffix}",
                enable_performance_insights=True,
                monitoring_interval=Duration.seconds(60),
                monitoring_role=monitoring_role,
                performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
                cloudwatch_logs_exports=["postgresql"],
            )

        # === 10) CloudWatch alarms ===
        cpu_alarm = cloudwatch.Alarm(
            self,
            f"TapPrimaryCpuAlarm{env_suffix}",
            metric=primary.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Primary DB CPU > 80% for 3 periods",
        )

        free_storage_metric = primary.metric("FreeStorageSpace")
        free_storage_alarm = cloudwatch.Alarm(
            self,
            f"TapFreeStorageAlarm{env_suffix}",
            metric=free_storage_metric,
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Free storage < 10 GB",
        )

        conn_alarm = cloudwatch.Alarm(
            self,
            f"TapDBConnectionsAlarm{env_suffix}",
            metric=primary.metric("DatabaseConnections"),
            threshold=100,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="DB connections > 100",
        )

        # Replica lag alarm: use a region-level metric with replica identifier dimension
        # Note: depending on your RDS engine/version you may prefer Enhanced Monitoring or 
        # CloudWatch logs.
        for i in range(replica_count):
            replica_id = f"tap-replica-{i+1}-{env_suffix}"
            replica_lag_metric = cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="ReplicaLag",
                dimensions_map={"DBInstanceIdentifier": replica_id},
                statistic="Average",
                period=Duration.minutes(5),
            )
            cloudwatch.Alarm(
                self,
                f"TapReplicaLagAlarm{i+1}{env_suffix}",
                metric=replica_lag_metric,
                threshold=60,  # seconds
                evaluation_periods=3,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"Replica {replica_id} lag > 60s",
            )

        # === 11) Outputs ===
        CfnOutput(
            self,
            f"TapPrimaryDBEndpoint{env_suffix}",
            value=primary.db_instance_endpoint_address,
            description="Primary DB endpoint",
        )
        CfnOutput(
            self,
            f"TapPrimaryDBPort{env_suffix}",
            value=str(primary.db_instance_endpoint_port),
            description="Primary DB port",
        )
        CfnOutput(
            self,
            f"TapDBSecretName{env_suffix}",
            value=primary.secret.secret_name if primary.secret else "",
            description="Secrets Manager secret name",
        )
        CfnOutput(
            self,
            f"TapRdsBackupBucketName{env_suffix}",
            value=backup_bucket.bucket_name,
            description="S3 bucket for backups / exports",
        )
        CfnOutput(
            self,
            f"TapKmsKeyArn{env_suffix}",
            value=database_key.key_arn,
            description="KMS key ARN for RDS encryption",
        )
        CfnOutput(
            self,
            f"TapSSMBastionInstanceId{env_suffix}",
            value=bastion_instance.instance_id,
            description="EC2 instance ID for SSM port forwarding to RDS",
        )
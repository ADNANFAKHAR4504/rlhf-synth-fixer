"""
RDS Stack for Disaster Recovery Infrastructure

This module creates a Multi-AZ RDS database:
- PostgreSQL RDS instance with Multi-AZ deployment
- Automatic failover capability
- KMS encryption at rest
- SSL/TLS encryption in transit
- Automated backups with point-in-time recovery
- CloudWatch monitoring and alarms
- Parameter and option groups for FedRAMP compliance
"""

from aws_cdk import (
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_logs as logs,
    CfnOutput,
    NestedStack,
    RemovalPolicy,
    Duration,
)
from constructs import Construct


class RDSStack(NestedStack):
    """
    Creates a Multi-AZ RDS database instance with disaster recovery capabilities
    """

    # pylint: disable=too-many-positional-arguments
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        db_secret: secretsmanager.Secret,
        kms_key: kms.Key,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create DB subnet group
        subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup-{environment_suffix}",
            description=f"Subnet group for Multi-AZ RDS - {environment_suffix}",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name=f"dr-db-subnet-group-{environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create parameter group with FedRAMP compliant settings
        parameter_group = rds.ParameterGroup(
            self,
            f"DBParameterGroup-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_14
            ),
            description=f"Parameter group for FedRAMP compliance - {environment_suffix}",
            parameters={
                "log_connections": "1",
                "log_disconnections": "1",
                "log_duration": "1",
                "log_statement": "all",
                "rds.force_ssl": "1",
                "shared_preload_libraries": "pg_stat_statements",
            },
        )

        # Create option group
        option_group = rds.OptionGroup(
            self,
            f"DBOptionGroup-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_14
            ),
            description=f"Option group for PostgreSQL - {environment_suffix}",
            configurations=[],  # PostgreSQL doesn't require specific options
        )

        # Create Multi-AZ RDS instance
        self.database = rds.DatabaseInstance(
            self,
            f"DisasterRecoveryDB-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_14
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=vpc,
            subnet_group=subnet_group,
            security_groups=[security_group],
            credentials=rds.Credentials.from_password(
                username="dbadmin",
                password=db_secret.secret_value_from_json("password"),
            ),
            database_name="citizendb",
            allocated_storage=100,
            max_allocated_storage=200,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            multi_az=True,  # Enable Multi-AZ for automatic failover
            auto_minor_version_upgrade=False,
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            copy_tags_to_snapshot=True,
            deletion_protection=False,  # Set to False for easy teardown in CI/CD
            delete_automated_backups=True,
            removal_policy=RemovalPolicy.DESTROY,
            parameter_group=parameter_group,
            option_group=option_group,
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            monitoring_interval=Duration.seconds(60),
            publicly_accessible=False,
        )

        # Attach the existing secret to the database instance for rotation support
        secretsmanager.SecretTargetAttachment(
            self,
            f"DBSecretAttachment-{environment_suffix}",
            secret=db_secret,
            target=self.database,
        )

        # Note: Automatic secret rotation via add_rotation_single_user() requires
        # Serverless Application Repository which is not available in eu-central-2.
        # For production, implement custom rotation Lambda or use a supported region.
        # Rotation schedule is managed via Secrets Manager configuration instead.

        # Create SNS topic for alarms
        alarm_topic = sns.Topic(
            self,
            f"DBAlarmTopic-{environment_suffix}",
            topic_name=f"dr-db-alarms-{environment_suffix}",
            display_name="Disaster Recovery Database Alarms",
        )

        # Create CloudWatch alarms for monitoring

        # CPU Utilization Alarm
        cpu_alarm = cloudwatch.Alarm(
            self,
            f"DBCPUAlarm-{environment_suffix}",
            alarm_name=f"dr-db-cpu-{environment_suffix}",
            alarm_description="Alert when database CPU exceeds 80%",
            metric=self.database.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        cpu_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Database Connections Alarm
        connections_alarm = cloudwatch.Alarm(
            self,
            f"DBConnectionsAlarm-{environment_suffix}",
            alarm_name=f"dr-db-connections-{environment_suffix}",
            alarm_description="Alert when database connections exceed 80% of max",
            metric=self.database.metric_database_connections(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        connections_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Free Storage Space Alarm
        storage_alarm = cloudwatch.Alarm(
            self,
            f"DBStorageAlarm-{environment_suffix}",
            alarm_name=f"dr-db-storage-{environment_suffix}",
            alarm_description="Alert when free storage space is below 10 GB",
            metric=self.database.metric_free_storage_space(),
            threshold=10 * 1024 * 1024 * 1024,  # 10 GB in bytes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
        )
        storage_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Read Latency Alarm
        read_latency_alarm = cloudwatch.Alarm(
            self,
            f"DBReadLatencyAlarm-{environment_suffix}",
            alarm_name=f"dr-db-read-latency-{environment_suffix}",
            alarm_description="Alert when read latency exceeds 100ms",
            metric=self.database.metric(
                "ReadLatency",
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=0.1,  # 100ms in seconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        read_latency_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Write Latency Alarm
        write_latency_alarm = cloudwatch.Alarm(
            self,
            f"DBWriteLatencyAlarm-{environment_suffix}",
            alarm_name=f"dr-db-write-latency-{environment_suffix}",
            alarm_description="Alert when write latency exceeds 100ms",
            metric=self.database.metric(
                "WriteLatency",
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=0.1,  # 100ms in seconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        write_latency_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Outputs
        CfnOutput(
            self,
            "DBInstanceId",
            value=self.database.instance_identifier,
            description="RDS Instance Identifier",
            export_name=f"rds-instance-id-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DBEndpoint",
            value=self.database.db_instance_endpoint_address,
            description="RDS Instance Endpoint Address",
            export_name=f"rds-endpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DBPort",
            value=str(self.database.db_instance_endpoint_port),
            description="RDS Instance Port",
            export_name=f"rds-port-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DBName",
            value="citizendb",
            description="Database Name",
            export_name=f"rds-db-name-{environment_suffix}",
        )

        CfnOutput(
            self,
            "AlarmTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS Topic ARN for database alarms",
            export_name=f"db-alarm-topic-arn-{environment_suffix}",
        )

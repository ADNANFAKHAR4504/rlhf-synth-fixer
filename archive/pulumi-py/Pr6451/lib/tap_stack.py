"""
Multi-Region Disaster Recovery Solution for PostgreSQL Database
Implements automatic failover between us-east-1 (primary) and us-west-2 (DR)
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
import json
from pulumi import ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        db_username (Optional[str]): Database username (defaults to 'dbadmin').
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        db_username: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.db_username = db_username or 'dbadmin'


class TapStack(pulumi.ComponentResource):
    """
    Multi-Region Disaster Recovery Solution for PostgreSQL Database.
    
    Implements automatic failover between us-east-1 (primary) and us-west-2 (DR).
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.db_username = args.db_username

        # Resource options for all child resources
        child_opts = ResourceOptions(parent=self)

        # AWS Providers for multi-region deployment
        self.primary_provider = aws.Provider(
            f"primary-provider-{self.environment_suffix}",
            region="us-east-1",
            opts=child_opts
        )
        self.dr_provider = aws.Provider(
            f"dr-provider-{self.environment_suffix}",
            region="us-west-2",
            opts=child_opts
        )

        # Primary region resources
        self._create_primary_region_resources(child_opts)

        # DR region resources
        self._create_dr_region_resources(child_opts)

        # Monitoring and alarms
        self._create_monitoring_and_alarms(child_opts)

        # Route 53 health checks and failover
        self._create_route53_failover(child_opts)

        # Cross-region snapshot automation
        self._create_snapshot_automation(child_opts)

        # Export outputs
        self._export_outputs()

    def _create_primary_region_resources(self, opts: ResourceOptions):
        """Create all resources in the primary region (us-east-1)."""
        # KMS Key for primary region encryption
        self.primary_kms = aws.kms.Key(
            f"primary-kms-{self.environment_suffix}",
            description=f"KMS key for RDS encryption in us-east-1 - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                "Name": f"rds-primary-kms-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-east-1",
                "Purpose": "RDS encryption"
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        self.primary_kms_alias = aws.kms.Alias(
            f"primary-kms-alias-{self.environment_suffix}",
            name=f"alias/rds-primary-{self.environment_suffix}",
            target_key_id=self.primary_kms.key_id,
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Create VPC in primary region
        self.primary_vpc = aws.ec2.Vpc(
            f"primary-vpc-{self.environment_suffix}",
            cidr_block="10.100.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"primary-db-vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-east-1"
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Get availability zones in primary region
        primary_azs = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.primary_provider)
        )

        # Create subnets in primary region
        self.primary_subnet_1 = aws.ec2.Subnet(
            f"primary-subnet-1-{self.environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.100.1.0/24",
            availability_zone=primary_azs.names[0],
            map_public_ip_on_launch=False,
            tags={
                "Name": f"primary-db-subnet-1-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        self.primary_subnet_2 = aws.ec2.Subnet(
            f"primary-subnet-2-{self.environment_suffix}",
            vpc_id=self.primary_vpc.id,
            cidr_block="10.100.2.0/24",
            availability_zone=primary_azs.names[1],
            map_public_ip_on_launch=False,
            tags={
                "Name": f"primary-db-subnet-2-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        primary_subnets = pulumi.Output.all(self.primary_subnet_1.id, self.primary_subnet_2.id)

        # DB Subnet Group
        self.primary_subnet_group = aws.rds.SubnetGroup(
            f"primary-subnet-group-{self.environment_suffix}",
            name=f"trading-db-primary-subnet-{self.environment_suffix}",
            subnet_ids=primary_subnets,
            description=f"Subnet group for primary RDS instance - {self.environment_suffix}",
            tags={
                "Name": f"primary-db-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-east-1"
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Security Group for primary RDS instance
        self.primary_sg = aws.ec2.SecurityGroup(
            f"primary-db-sg-{self.environment_suffix}",
            name=f"trading-db-primary-sg-{self.environment_suffix}",
            description=f"Security group for primary PostgreSQL database - {self.environment_suffix}",
            vpc_id=self.primary_vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL access from within VPC",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/8"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL replication from DR region",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["172.31.0.0/16"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"primary-db-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Enhanced Monitoring IAM Role
        self.monitoring_role = aws.iam.Role(
            f"rds-monitoring-role-{self.environment_suffix}",
            name=f"rds-enhanced-monitoring-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "monitoring.rds.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"rds-monitoring-role-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        self.monitoring_role_policy_attachment = aws.iam.RolePolicyAttachment(
            f"rds-monitoring-policy-{self.environment_suffix}",
            role=self.monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Database Parameter Group
        # Note: Use ignore_changes to prevent parameter updates after initial creation
        # This avoids conflicts when AWS detects static vs dynamic parameter mismatches
        self.parameter_group = aws.rds.ParameterGroup(
            f"postgres-params-{self.environment_suffix}",
            name=f"postgres15-replication-{self.environment_suffix}",
            family="postgres15",
            description=f"PostgreSQL 15 parameters optimized for replication - {self.environment_suffix}",
            parameters=[
                # Dynamic parameters - use immediate apply by default (no apply_method needed)
                aws.rds.ParameterGroupParameterArgs(
                    name="max_connections",
                    value="200"
                ),
                # Static parameter - requires reboot
                aws.rds.ParameterGroupParameterArgs(
                    name="shared_buffers",
                    value="{DBInstanceClassMemory/4096}",
                    apply_method="pending-reboot"
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="max_wal_senders",
                    value="10"
                ),
                # wal_keep_size may be static in PostgreSQL 15, set to pending-reboot to be safe
                aws.rds.ParameterGroupParameterArgs(
                    name="wal_keep_size",
                    value="1024",
                    apply_method="pending-reboot"
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="log_statement",
                    value="all"
                ),
                aws.rds.ParameterGroupParameterArgs(
                    name="log_min_duration_statement",
                    value="1000"
                )
            ],
            tags={
                "Name": f"postgres-params-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(
                provider=self.primary_provider,
                parent=self,
                ignore_changes=["parameters"]  # Prevent parameter updates after initial creation
            )
        )

        # Secrets Manager for database credentials
        self.db_secret = aws.secretsmanager.Secret(
            f"db-credentials-{self.environment_suffix}",
            name=f"trading-db-credentials-{self.environment_suffix}",
            description=f"Database credentials for trading DB - {self.environment_suffix}",
            kms_key_id=self.primary_kms.id,
            tags={
                "Name": f"db-credentials-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Generate secure random password
        self.db_password = aws.secretsmanager.SecretVersion(
            f"db-credentials-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=pulumi.Output.all().apply(
                lambda _: json.dumps({
                    "username": self.db_username,
                    "password": "CHANGE_ME_AFTER_DEPLOYMENT",
                    "engine": "postgres",
                    "host": "will-be-updated",
                    "port": 5432,
                    "dbname": "trading"
                })
            ),
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Primary RDS Instance with Multi-AZ
        self.primary_db = aws.rds.Instance(
            f"primary-db-{self.environment_suffix}",
            identifier=f"trading-db-primary-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.7",
            instance_class="db.t3.medium",
            allocated_storage=100,
            max_allocated_storage=500,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.primary_kms.arn,
            db_name="trading",
            username=self.db_username,
            password=self.db_password.secret_string.apply(
                lambda s: json.loads(s)["password"]
            ),
            db_subnet_group_name=self.primary_subnet_group.name,
            vpc_security_group_ids=[self.primary_sg.id],
            parameter_group_name=self.parameter_group.name,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            multi_az=True,
            publicly_accessible=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            monitoring_interval=60,
            monitoring_role_arn=self.monitoring_role.arn,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            performance_insights_kms_key_id=self.primary_kms.arn,
            auto_minor_version_upgrade=True,
            deletion_protection=False,
            skip_final_snapshot=True,
            apply_immediately=False,
            tags={
                "Name": f"trading-db-primary-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-east-1",
                "Role": "primary"
            },
            opts=ResourceOptions(
                provider=self.primary_provider,
                parent=self,
                depends_on=[self.monitoring_role_policy_attachment]
            )
        )

    def _create_dr_region_resources(self, opts: ResourceOptions):
        """Create all resources in the DR region (us-west-2)."""
        # KMS Key for DR region encryption
        self.dr_kms = aws.kms.Key(
            f"dr-kms-{self.environment_suffix}",
            description=f"KMS key for RDS encryption in us-west-2 - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                "Name": f"rds-dr-kms-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-west-2",
                "Purpose": "RDS encryption"
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        self.dr_kms_alias = aws.kms.Alias(
            f"dr-kms-alias-{self.environment_suffix}",
            name=f"alias/rds-dr-{self.environment_suffix}",
            target_key_id=self.dr_kms.key_id,
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        # Create VPC in DR region
        self.dr_vpc = aws.ec2.Vpc(
            f"dr-vpc-{self.environment_suffix}",
            cidr_block="10.200.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"dr-db-vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-west-2"
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        # Get availability zones in DR region
        dr_azs = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=self.dr_provider)
        )

        # Create subnets in DR region
        self.dr_subnet_1 = aws.ec2.Subnet(
            f"dr-subnet-1-{self.environment_suffix}",
            vpc_id=self.dr_vpc.id,
            cidr_block="10.200.1.0/24",
            availability_zone=dr_azs.names[0],
            map_public_ip_on_launch=False,
            tags={
                "Name": f"dr-db-subnet-1-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        self.dr_subnet_2 = aws.ec2.Subnet(
            f"dr-subnet-2-{self.environment_suffix}",
            vpc_id=self.dr_vpc.id,
            cidr_block="10.200.2.0/24",
            availability_zone=dr_azs.names[1],
            map_public_ip_on_launch=False,
            tags={
                "Name": f"dr-db-subnet-2-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        dr_subnets = pulumi.Output.all(self.dr_subnet_1.id, self.dr_subnet_2.id)

        # DB Subnet Group for DR region
        self.dr_subnet_group = aws.rds.SubnetGroup(
            f"dr-subnet-group-{self.environment_suffix}",
            name=f"trading-db-dr-subnet-{self.environment_suffix}",
            subnet_ids=dr_subnets,
            description=f"Subnet group for DR RDS instance - {self.environment_suffix}",
            tags={
                "Name": f"dr-db-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-west-2"
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        # Security Group for DR RDS instance
        self.dr_sg = aws.ec2.SecurityGroup(
            f"dr-db-sg-{self.environment_suffix}",
            name=f"trading-db-dr-sg-{self.environment_suffix}",
            description=f"Security group for DR PostgreSQL database - {self.environment_suffix}",
            vpc_id=self.dr_vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL access from within VPC",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/8"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    description="PostgreSQL replication from primary region",
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["172.31.0.0/16"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    description="Allow all outbound traffic",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"dr-db-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )

        # Read Replica in DR region for cross-region disaster recovery
        self.replica_db = aws.rds.Instance(
            f"replica-db-{self.environment_suffix}",
            identifier=f"trading-db-replica-{self.environment_suffix}",
            replicate_source_db=self.primary_db.arn,
            instance_class="db.t3.medium",
            storage_encrypted=True,
            kms_key_id=self.dr_kms.arn,
            db_subnet_group_name=self.dr_subnet_group.name,
            vpc_security_group_ids=[self.dr_sg.id],
            publicly_accessible=False,
            monitoring_interval=60,
            monitoring_role_arn=self.monitoring_role.arn,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            performance_insights_kms_key_id=self.dr_kms.arn,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            auto_minor_version_upgrade=True,
            deletion_protection=False,
            skip_final_snapshot=True,
            backup_retention_period=7,
            tags={
                "Name": f"trading-db-replica-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Region": "us-west-2",
                "Role": "replica"
            },
            opts=ResourceOptions(
                provider=self.dr_provider,
                parent=self,
                depends_on=[self.primary_db, self.dr_subnet_group]
            )
        )

    def _create_monitoring_and_alarms(self, opts: ResourceOptions):
        """Create monitoring and CloudWatch alarms."""
        # SNS Topic for database alerts
        self.alert_topic = aws.sns.Topic(
            f"db-alerts-{self.environment_suffix}",
            name=f"trading-db-alerts-{self.environment_suffix}",
            display_name=f"Trading DB Alerts - {self.environment_suffix}",
            tags={
                "Name": f"db-alerts-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # CloudWatch Alarm - Primary DB CPU Utilization
        self.primary_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"primary-cpu-alarm-{self.environment_suffix}",
            name=f"trading-db-primary-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when primary DB CPU exceeds 80%",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.primary_db.identifier
            },
            tags={
                "Name": f"primary-cpu-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # CloudWatch Alarm - Replication Lag
        # Note: This alarm monitors the replica DB in DR region, so it must use dr_provider
        # The alarm must be created in the same region as the metric (us-west-2)
        # Create a DR region SNS topic for this alarm to avoid cross-region issues
        dr_alert_topic = aws.sns.Topic(
            f"dr-db-alerts-{self.environment_suffix}",
            name=f"trading-db-dr-alerts-{self.environment_suffix}",
            display_name=f"Trading DB DR Alerts - {self.environment_suffix}",
            tags={
                "Name": f"dr-db-alerts-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.dr_provider, parent=self)
        )
        
        # Use a fresh ResourceOptions with only the provider to avoid any inheritance issues
        replication_alarm_opts = ResourceOptions(
            provider=self.dr_provider,
            depends_on=[self.replica_db]  # Ensure replica DB exists before creating alarm
        )
        self.replication_lag_alarm = aws.cloudwatch.MetricAlarm(
            f"replication-lag-alarm-{self.environment_suffix}",
            name=f"trading-db-replication-lag-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ReplicaLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=60,
            alarm_description="CRITICAL: Replication lag exceeds 60 seconds - RPO at risk",
            alarm_actions=[dr_alert_topic.arn],  # Use DR region SNS topic
            treat_missing_data="notBreaching",
            dimensions={
                "DBInstanceIdentifier": self.replica_db.identifier
            },
            tags={
                "Name": f"replication-lag-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Severity": "critical"
            },
            opts=replication_alarm_opts
        )

        # CloudWatch Alarm - Primary DB Storage Space
        self.primary_storage_alarm = aws.cloudwatch.MetricAlarm(
            f"primary-storage-alarm-{self.environment_suffix}",
            name=f"trading-db-primary-storage-{self.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=1,
            metric_name="FreeStorageSpace",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=10737418240,
            alarm_description="Alert when primary DB free storage falls below 10GB",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.primary_db.identifier
            },
            tags={
                "Name": f"primary-storage-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # CloudWatch Alarm - Database Connections
        self.primary_connections_alarm = aws.cloudwatch.MetricAlarm(
            f"primary-connections-alarm-{self.environment_suffix}",
            name=f"trading-db-primary-connections-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=180,
            alarm_description="Alert when database connections exceed 180 (90% of max)",
            alarm_actions=[self.alert_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.primary_db.identifier
            },
            tags={
                "Name": f"primary-connections-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

    def _create_route53_failover(self, opts: ResourceOptions):
        """Create Route 53 health checks and failover configuration."""
        # Route 53 Hosted Zone
        self.hosted_zone = aws.route53.Zone(
            f"db-zone-{self.environment_suffix}",
            name=f"trading-db-{self.environment_suffix}.internal",
            vpcs=[
                aws.route53.ZoneVpcArgs(
                    vpc_id=self.primary_vpc.id,
                    vpc_region="us-east-1"
                )
            ],
            tags={
                "Name": f"db-zone-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Route 53 Health Check for primary database
        self.primary_health_check = aws.route53.HealthCheck(
            f"primary-db-health-{self.environment_suffix}",
            type="CALCULATED",
            child_health_threshold=1,
            child_healthchecks=[],
            tags={
                "Name": f"primary-db-health-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Route 53 Record - Primary Database (with failover)
        self.primary_dns_record = aws.route53.Record(
            f"primary-db-record-{self.environment_suffix}",
            zone_id=self.hosted_zone.zone_id,
            name=f"db-primary.trading-db-{self.environment_suffix}.internal",
            type="CNAME",
            ttl=60,
            records=[self.primary_db.endpoint],
            set_identifier="primary",
            failover_routing_policies=[
                aws.route53.RecordFailoverRoutingPolicyArgs(
                    type="PRIMARY"
                )
            ],
            health_check_id=self.primary_health_check.id,
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Route 53 Record - DR Database (failover secondary)
        self.dr_dns_record = aws.route53.Record(
            f"dr-db-record-{self.environment_suffix}",
            zone_id=self.hosted_zone.zone_id,
            name=f"db-primary.trading-db-{self.environment_suffix}.internal",
            type="CNAME",
            ttl=60,
            records=[self.replica_db.endpoint],
            set_identifier="secondary",
            failover_routing_policies=[
                aws.route53.RecordFailoverRoutingPolicyArgs(
                    type="SECONDARY"
                )
            ],
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

    def _create_snapshot_automation(self, opts: ResourceOptions):
        """Create cross-region snapshot automation resources."""
        # IAM Role for Lambda snapshot copying
        self.snapshot_lambda_role = aws.iam.Role(
            f"snapshot-copy-role-{self.environment_suffix}",
            name=f"rds-snapshot-copy-lambda-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"snapshot-copy-role-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

        # Lambda execution policy
        self.snapshot_lambda_policy = aws.iam.RolePolicy(
            f"snapshot-copy-policy-{self.environment_suffix}",
            role=self.snapshot_lambda_role.id,
            policy=pulumi.Output.all(self.primary_kms.arn, self.dr_kms.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "rds:DescribeDBSnapshots",
                                "rds:CopyDBSnapshot",
                                "rds:DeleteDBSnapshot",
                                "rds:ListTagsForResource",
                                "rds:AddTagsToResource"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:CreateGrant",
                                "kms:DescribeKey",
                                "kms:Decrypt",
                                "kms:Encrypt"
                            ],
                            "Resource": [args[0], args[1]]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
                        }
                    ]
                })
            ),
            opts=ResourceOptions(provider=self.primary_provider, parent=self)
        )

    def _export_outputs(self):
        """Export all stack outputs."""
        pulumi.export("primary_endpoint", self.primary_db.endpoint)
        pulumi.export("primary_arn", self.primary_db.arn)
        pulumi.export("replica_endpoint", self.replica_db.endpoint)
        pulumi.export("replica_arn", self.replica_db.arn)
        pulumi.export("primary_kms_key_id", self.primary_kms.id)
        pulumi.export("dr_kms_key_id", self.dr_kms.id)
        pulumi.export("db_secret_arn", self.db_secret.arn)
        pulumi.export("hosted_zone_id", self.hosted_zone.zone_id)
        pulumi.export("hosted_zone_name", self.hosted_zone.name)
        pulumi.export("failover_dns_name", self.primary_dns_record.name)
        pulumi.export("alert_topic_arn", self.alert_topic.arn)
        pulumi.export("primary_security_group_id", self.primary_sg.id)
        pulumi.export("dr_security_group_id", self.dr_sg.id)
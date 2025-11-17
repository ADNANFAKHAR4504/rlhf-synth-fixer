"""
Pulumi Python stack for database migration infrastructure.
Creates RDS PostgreSQL instance with DMS replication for zero-downtime migration.
"""

import json

import pulumi
import pulumi_aws as aws


class TapStack:
    """
    Infrastructure stack for database migration using AWS RDS and DMS.
    If vpc_id is not provided in config, uses the default VPC.
    """

    def __init__(self, environment_suffix: str = "prod"):
        """
        Initialize the database migration infrastructure stack.

        Args:
            environment_suffix: Unique suffix for resource naming
        """
        self.environment_suffix = environment_suffix

        # Configuration - VPC and subnet IDs can be provided or default VPC will be used
        config = pulumi.Config()
        vpc_id_config = config.get("vpc_id")
        if vpc_id_config:
            self.vpc_id = vpc_id_config
            self.private_subnet_ids = config.require_object("private_subnet_ids")
        else:
            # Create a default VPC if no vpc_id provided
            vpc = aws.ec2.Vpc(
                f"tap-vpc-{self.environment_suffix}",
                cidr_block="10.0.0.0/16",
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags={
                    "Name": f"tap-vpc-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Purpose": "Test-Automation"
                }
            )
            self.vpc_id = vpc.id
            
            # Create subnets in the VPC
            subnet1 = aws.ec2.Subnet(
                f"tap-subnet-1-{self.environment_suffix}",
                vpc_id=self.vpc_id,
                cidr_block="10.0.1.0/24",
                availability_zone="us-east-1a",
                tags={
                    "Name": f"tap-subnet-1-{self.environment_suffix}",
                    "Environment": self.environment_suffix
                }
            )
            subnet2 = aws.ec2.Subnet(
                f"tap-subnet-2-{self.environment_suffix}",
                vpc_id=self.vpc_id,
                cidr_block="10.0.2.0/24",
                availability_zone="us-east-1b",
                tags={
                    "Name": f"tap-subnet-2-{self.environment_suffix}",
                    "Environment": self.environment_suffix
                }
            )
            self.private_subnet_ids = [subnet1.id, subnet2.id]
        self.app_security_group_id = config.get("app_security_group_id")
        if self.app_security_group_id and not self.app_security_group_id.startswith("sg-"):
            # If it's a name, get the security group
            app_sg = aws.ec2.get_security_group(name=self.app_security_group_id, vpc_id=self.vpc_id)
            self.app_security_group_id = app_sg.id
        self.onprem_db_host = config.get("onprem_db_host") or "10.0.1.50"
        self.onprem_db_port = config.get_int("onprem_db_port") or 5432
        self.onprem_db_name = config.get("onprem_db_name") or "payments"
        self.onprem_db_user = config.get("onprem_db_user") or "postgres"
        self.onprem_db_password = config.get_secret("onprem_db_password") or pulumi.Output.secret("ChangeMe123456")

        # Create resources
        self.kms_key = self._create_kms_key()
        self.db_credentials = self._create_db_credentials()
        self.db_subnet_group = self._create_db_subnet_group()
        self.rds_security_group = self._create_rds_security_group()
        self.rds_instance = self._create_rds_instance()
        self.dms_resources = self._create_dms_resources()
        self.cloudwatch_alarms = self._create_cloudwatch_alarms()

        # Export outputs
        self._export_outputs()

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for RDS encryption."""
        key = aws.kms.Key(
            f"rds-kms-key-{self.environment_suffix}",
            description=f"KMS key for RDS encryption - {self.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={
                "Name": f"rds-kms-key-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "RDS-Encryption"
            }
        )

        # Create alias for easier key identification
        aws.kms.Alias(
            f"rds-kms-alias-{self.environment_suffix}",
            name=f"alias/rds-{self.environment_suffix}",
            target_key_id=key.id
        )

        return key

    def _create_db_credentials(self) -> aws.secretsmanager.Secret:
        """Create Secrets Manager secret for database credentials."""
        # Generate random password
        db_password = aws.secretsmanager.get_random_password(
            password_length=32,
            exclude_punctuation=True,
            exclude_numbers=False,
            exclude_lowercase=False,
            exclude_uppercase=False
        )

        # Create secret
        secret = aws.secretsmanager.Secret(
            f"rds-db-credentials-{self.environment_suffix}",
            name=f"rds-db-credentials-{self.environment_suffix}",
            description=f"RDS PostgreSQL master credentials - {self.environment_suffix}",
            tags={
                "Name": f"rds-db-credentials-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "RDS-Credentials"
            }
        )

        # Store credentials
        db_username = "masteruser"
        secret_value = pulumi.Output.all(db_password.random_password).apply(
            lambda args: json.dumps({
                "username": db_username,
                "password": args[0],
                "engine": "postgres",
                "port": 5432
            })
        )

        aws.secretsmanager.SecretVersion(
            f"rds-db-credentials-version-{self.environment_suffix}",
            secret_id=secret.id,
            secret_string=secret_value
        )

        return secret

    def _create_db_subnet_group(self) -> aws.rds.SubnetGroup:
        """Create DB subnet group for RDS instance."""
        return aws.rds.SubnetGroup(
            f"rds-subnet-group-{self.environment_suffix}",
            name=f"rds-subnet-group-{self.environment_suffix}",
            subnet_ids=self.private_subnet_ids,
            description=f"RDS subnet group for database migration - {self.environment_suffix}",
            tags={
                "Name": f"rds-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

    def _create_rds_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for RDS instance."""
        sg = aws.ec2.SecurityGroup(
            f"rds-security-group-{self.environment_suffix}",
            name=f"rds-security-group-{self.environment_suffix}",
            description=f"Security group for RDS PostgreSQL - {self.environment_suffix}",
            vpc_id=self.vpc_id,
            tags={
                "Name": f"rds-security-group-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Allow inbound PostgreSQL traffic from application security group or CIDR
        if self.app_security_group_id:
            aws.ec2.SecurityGroupRule(
                f"rds-ingress-from-app-{self.environment_suffix}",
                type="ingress",
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                source_security_group_id=self.app_security_group_id,
                security_group_id=sg.id,
                description="Allow PostgreSQL from application servers"
            )
        else:
            # Fallback: allow from VPC CIDR if no app SG specified
            aws.ec2.SecurityGroupRule(
                f"rds-ingress-from-vpc-{self.environment_suffix}",
                type="ingress",
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=["10.0.0.0/16"],  # Adjust to your VPC CIDR
                security_group_id=sg.id,
                description="Allow PostgreSQL from VPC (fallback)"
            )

        # Allow egress for all traffic (needed for DMS)
        aws.ec2.SecurityGroupRule(
            f"rds-egress-all-{self.environment_suffix}",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=sg.id,
            description="Allow all outbound traffic"
        )

        return sg

    def _create_rds_instance(self) -> aws.rds.Instance:
        """Create RDS PostgreSQL instance."""
        return aws.rds.Instance(
            f"rds-postgres-{self.environment_suffix}",
            identifier=f"rds-postgres-{self.environment_suffix}",
            engine="postgres",
            instance_class="db.r5.xlarge",
            allocated_storage=100,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="payments",
            username=self.db_credentials.id.apply(
                lambda _: "masteruser"
            ),
            password=pulumi.Output.secret("TestPassword123456789012345678901234"),
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            multi_az=True,
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="Mon:04:00-Mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            auto_minor_version_upgrade=False,
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={
                "Name": f"rds-postgres-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Purpose": "Database-Migration"
            }
        )

    def _create_dms_resources(self) -> dict:
        """Create DMS resources for database migration."""
        # Create DMS subnet group
        dms_subnet_group = aws.dms.ReplicationSubnetGroup(
            f"dms-subnet-group-{self.environment_suffix}",
            replication_subnet_group_id=f"dms-subnet-group-{self.environment_suffix}",
            replication_subnet_group_description=f"DMS subnet group - {self.environment_suffix}",
            subnet_ids=self.private_subnet_ids,
            tags={
                "Name": f"dms-subnet-group-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Create DMS security group
        dms_security_group = aws.ec2.SecurityGroup(
            f"dms-security-group-{self.environment_suffix}",
            name=f"dms-security-group-{self.environment_suffix}",
            description=f"Security group for DMS replication instance - {self.environment_suffix}",
            vpc_id=self.vpc_id,
            tags={
                "Name": f"dms-security-group-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Allow DMS to connect to on-premises database
        aws.ec2.SecurityGroupRule(
            f"dms-egress-to-onprem-{self.environment_suffix}",
            type="egress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.0.1.0/24"],
            security_group_id=dms_security_group.id,
            description="Allow DMS to connect to on-premises database"
        )

        # Allow DMS to connect to RDS
        aws.ec2.SecurityGroupRule(
            f"rds-ingress-from-dms-{self.environment_suffix}",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=dms_security_group.id,
            security_group_id=self.rds_security_group.id,
            description="Allow DMS to connect to RDS"
        )

        # Create IAM role for DMS
        dms_assume_role = aws.iam.get_policy_document(
            statements=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["dms.amazonaws.com"]
                }]
            }]
        )

        dms_role = aws.iam.Role(
            f"dms-vpc-role-{self.environment_suffix}",
            name=f"dms-vpc-role-{self.environment_suffix}",
            assume_role_policy=dms_assume_role.json,
            tags={
                "Name": f"dms-vpc-role-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        aws.iam.RolePolicyAttachment(
            f"dms-vpc-policy-attachment-{self.environment_suffix}",
            role=dms_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
        )

        # Create DMS replication instance
        replication_instance = aws.dms.ReplicationInstance(
            f"dms-replication-instance-{self.environment_suffix}",
            replication_instance_id=f"dms-replication-{self.environment_suffix}",
            replication_instance_class="dms.c5.large",
            allocated_storage=100,
            vpc_security_group_ids=[dms_security_group.id],
            replication_subnet_group_id=dms_subnet_group.replication_subnet_group_id,
            publicly_accessible=False,
            multi_az=False,
            tags={
                "Name": f"dms-replication-instance-{self.environment_suffix}",
                "Environment": self.environment_suffix
            },
            opts=pulumi.ResourceOptions(depends_on=[dms_role])
        )

        # Create DMS source endpoint (on-premises)
        source_endpoint = aws.dms.Endpoint(
            f"dms-source-endpoint-{self.environment_suffix}",
            endpoint_id=f"dms-source-{self.environment_suffix}",
            endpoint_type="source",
            engine_name="postgres",
            server_name=self.onprem_db_host,
            port=self.onprem_db_port,
            database_name=self.onprem_db_name,
            username=self.onprem_db_user,
            password=self.onprem_db_password,
            ssl_mode="none",
            tags={
                "Name": f"dms-source-endpoint-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Create DMS target endpoint (RDS)
        target_endpoint = aws.dms.Endpoint(
            f"dms-target-endpoint-{self.environment_suffix}",
            endpoint_id=f"dms-target-{self.environment_suffix}",
            endpoint_type="target",
            engine_name="postgres",
            server_name=self.rds_instance.address,
            port=5432,
            database_name=self.rds_instance.db_name,
            username=self.db_credentials.id.apply(lambda _: "masteruser"),
            password=pulumi.Output.secret("TestPassword123456789012345678901234"),
            ssl_mode="none",
            tags={
                "Name": f"dms-target-endpoint-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Create DMS replication task
        table_mappings = json.dumps({
            "rules": [
                {
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "1",
                    "object-locator": {
                        "schema-name": "public",
                        "table-name": "%"
                    },
                    "rule-action": "include"
                }
            ]
        })

        replication_task = aws.dms.ReplicationTask(
            f"dms-replication-task-{self.environment_suffix}",
            replication_task_id=f"dms-task-{self.environment_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=replication_instance.replication_instance_arn,
            source_endpoint_arn=source_endpoint.endpoint_arn,
            target_endpoint_arn=target_endpoint.endpoint_arn,
            table_mappings=table_mappings,
            replication_task_settings=json.dumps({
                "TargetMetadata": {
                    "TargetSchema": "",
                    "SupportLobs": True,
                    "FullLobMode": False,
                    "LobChunkSize": 64,
                    "LimitedSizeLobMode": True,
                    "LobMaxSize": 32
                },
                "FullLoadSettings": {
                    "TargetTablePrepMode": "DO_NOTHING",
                    "CreatePkAfterFullLoad": False,
                    "StopTaskCachedChangesApplied": False,
                    "StopTaskCachedChangesNotApplied": False,
                    "MaxFullLoadSubTasks": 8,
                    "TransactionConsistencyTimeout": 600,
                    "CommitRate": 10000
                },
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [
                        {
                            "Id": "SOURCE_CAPTURE",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        },
                        {
                            "Id": "TARGET_APPLY",
                            "Severity": "LOGGER_SEVERITY_DEFAULT"
                        }
                    ]
                },
                "ChangeProcessingTuning": {
                    "BatchApplyPreserveTransaction": True,
                    "BatchApplyTimeoutMin": 1,
                    "BatchApplyTimeoutMax": 30,
                    "BatchApplyMemoryLimit": 500,
                    "BatchSplitSize": 0,
                    "MinTransactionSize": 1000,
                    "CommitTimeout": 1,
                    "MemoryLimitTotal": 1024,
                    "MemoryKeepTime": 60,
                    "StatementCacheSize": 50
                }
            }),
            tags={
                "Name": f"dms-replication-task-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        return {
            "replication_instance": replication_instance,
            "source_endpoint": source_endpoint,
            "target_endpoint": target_endpoint,
            "replication_task": replication_task
        }

    def _create_cloudwatch_alarms(self) -> dict:
        """Create CloudWatch alarms for RDS monitoring."""
        # Create SNS topic for alarm notifications (optional)
        sns_topic = aws.sns.Topic(
            f"rds-alarms-topic-{self.environment_suffix}",
            name=f"rds-alarms-{self.environment_suffix}",
            display_name=f"RDS Database Alarms - {self.environment_suffix}",
            tags={
                "Name": f"rds-alarms-topic-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # CPU Utilization Alarm (>80%)
        cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-cpu-alarm-{self.environment_suffix}",
            name=f"rds-cpu-high-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="RDS CPU utilization is above 80%",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.identifier
            },
            tags={
                "Name": f"rds-cpu-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Free Storage Space Alarm (<10GB)
        storage_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-storage-alarm-{self.environment_suffix}",
            name=f"rds-storage-low-{self.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=1,
            metric_name="FreeStorageSpace",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=10737418240,  # 10GB in bytes
            alarm_description="RDS free storage space is below 10GB",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.identifier
            },
            tags={
                "Name": f"rds-storage-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Read Latency Alarm (>200ms)
        read_latency_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-read-latency-alarm-{self.environment_suffix}",
            name=f"rds-read-latency-high-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ReadLatency",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=0.2,  # 200ms in seconds
            alarm_description="RDS read latency is above 200ms",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.identifier
            },
            tags={
                "Name": f"rds-read-latency-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Write Latency Alarm (>200ms)
        write_latency_alarm = aws.cloudwatch.MetricAlarm(
            f"rds-write-latency-alarm-{self.environment_suffix}",
            name=f"rds-write-latency-high-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="WriteLatency",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=0.2,  # 200ms in seconds
            alarm_description="RDS write latency is above 200ms",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.identifier
            },
            tags={
                "Name": f"rds-write-latency-alarm-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        return {
            "sns_topic": sns_topic,
            "cpu_alarm": cpu_alarm,
            "storage_alarm": storage_alarm,
            "read_latency_alarm": read_latency_alarm,
            "write_latency_alarm": write_latency_alarm
        }

    def _export_outputs(self):
        """Export stack outputs."""
        pulumi.export("rds_endpoint", self.rds_instance.endpoint)
        pulumi.export("rds_address", self.rds_instance.address)
        pulumi.export("rds_port", self.rds_instance.port)
        pulumi.export("rds_arn", self.rds_instance.arn)
        pulumi.export("rds_instance_id", self.rds_instance.identifier)
        pulumi.export("db_name", self.rds_instance.db_name)

        pulumi.export("secrets_manager_secret_arn", self.db_credentials.arn)
        pulumi.export("secrets_manager_secret_name", self.db_credentials.name)

        pulumi.export("dms_replication_instance_arn",
                     self.dms_resources["replication_instance"].replication_instance_arn)
        pulumi.export("dms_replication_instance_id",
                     self.dms_resources["replication_instance"].replication_instance_id)
        pulumi.export("dms_source_endpoint_arn",
                     self.dms_resources["source_endpoint"].endpoint_arn)
        pulumi.export("dms_target_endpoint_arn",
                     self.dms_resources["target_endpoint"].endpoint_arn)
        pulumi.export("dms_replication_task_arn",
                     self.dms_resources["replication_task"].replication_task_arn)

        pulumi.export("kms_key_id", self.kms_key.id)
        pulumi.export("kms_key_arn", self.kms_key.arn)

        pulumi.export("cloudwatch_sns_topic_arn",
                     self.cloudwatch_alarms["sns_topic"].arn)

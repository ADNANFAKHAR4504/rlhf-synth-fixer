from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dms as dms,
    aws_s3 as s3,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_route53 as route53,
    aws_cloudwatch as cloudwatch,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags,
    Aspects,
    IAspect,
)
from constructs import Construct, IConstruct
import jsii


@jsii.implements(IAspect)
class EncryptionAspect:
    """CDK Aspect to enforce encryption on resources"""

    def visit(self, node: IConstruct) -> None:
        if isinstance(node, s3.CfnBucket):
            if not node.bucket_encryption:
                node.bucket_encryption = s3.CfnBucket.BucketEncryptionProperty(
                    server_side_encryption_configuration=[
                        s3.CfnBucket.ServerSideEncryptionRuleProperty(
                            server_side_encryption_by_default=s3.CfnBucket.ServerSideEncryptionByDefaultProperty(
                                sse_algorithm="AES256"
                            )
                        )
                    ]
                )


class TapStack(Stack):
    """Main stack for payment processing migration infrastructure"""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Apply encryption aspect to all resources
        Aspects.of(self).add(EncryptionAspect())

        # Add common tags
        Tags.of(self).add("Environment", f"migration-{environment_suffix}")
        Tags.of(self).add("MigrationPhase", "setup")
        Tags.of(self).add("CostCenter", "payment-processing")

        # Create VPC for networking
        self.vpc = self._create_vpc()

        # Create security groups
        self.db_security_group = self._create_db_security_group()
        self.dms_security_group = self._create_dms_security_group()
        self.ecs_security_group = self._create_ecs_security_group()
        self.alb_security_group = self._create_alb_security_group()

        # Create database secrets
        self.source_db_secret = self._create_db_secret("source")
        self.target_db_secret = self._create_db_secret("target")

        # Create RDS instances
        self.source_db = self._create_rds_instance("source", self.source_db_secret)
        self.target_db = self._create_rds_instance("target", self.target_db_secret)

        # Create S3 buckets
        self.source_bucket = self._create_s3_bucket("source")
        self.target_bucket = self._create_s3_bucket("target")

        # Configure cross-region replication
        self._configure_s3_replication()

        # Create DMS replication infrastructure
        self.dms_replication_instance = self._create_dms_replication_instance()
        self.dms_source_endpoint = self._create_dms_endpoint("source", self.source_db, self.source_db_secret)
        self.dms_target_endpoint = self._create_dms_endpoint("target", self.target_db, self.target_db_secret)
        self.dms_replication_task = self._create_dms_replication_task()

        # Create ECS cluster and services
        self.ecs_cluster = self._create_ecs_cluster()
        self.alb = self._create_application_load_balancer()
        self.ecs_service = self._create_ecs_service()

        # Create CloudWatch monitoring
        self.dashboard = self._create_cloudwatch_dashboard()
        self._create_cloudwatch_alarms()

        # Create CloudFormation outputs for migration runbook
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets"""
        vpc = ec2.Vpc(
            self,
            f"vpc-{self.environment_suffix}",
            vpc_name=f"payment-vpc-{self.environment_suffix}",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )
        return vpc

    def _create_db_security_group(self) -> ec2.SecurityGroup:
        """Create security group for RDS instances"""
        sg = ec2.SecurityGroup(
            self,
            f"db-sg-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for RDS PostgreSQL - {self.environment_suffix}",
            security_group_name=f"rds-sg-{self.environment_suffix}",
            allow_all_outbound=True,
        )
        return sg

    def _create_dms_security_group(self) -> ec2.SecurityGroup:
        """Create security group for DMS replication instance"""
        sg = ec2.SecurityGroup(
            self,
            f"dms-sg-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for DMS replication - {self.environment_suffix}",
            security_group_name=f"dms-sg-{self.environment_suffix}",
            allow_all_outbound=True,
        )

        # Allow DMS to connect to RDS
        self.db_security_group.add_ingress_rule(
            peer=sg,
            connection=ec2.Port.tcp(5432),
            description="Allow DMS to connect to PostgreSQL",
        )

        return sg

    def _create_ecs_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ECS tasks"""
        sg = ec2.SecurityGroup(
            self,
            f"ecs-sg-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for ECS tasks - {self.environment_suffix}",
            security_group_name=f"ecs-sg-{self.environment_suffix}",
            allow_all_outbound=True,
        )

        # Allow ECS to connect to RDS
        self.db_security_group.add_ingress_rule(
            peer=sg,
            connection=ec2.Port.tcp(5432),
            description="Allow ECS tasks to connect to PostgreSQL",
        )

        return sg

    def _create_alb_security_group(self) -> ec2.SecurityGroup:
        """Create security group for Application Load Balancer"""
        sg = ec2.SecurityGroup(
            self,
            f"alb-sg-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for ALB - {self.environment_suffix}",
            security_group_name=f"alb-sg-{self.environment_suffix}",
            allow_all_outbound=True,
        )

        # Allow HTTP traffic from internet
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic",
        )

        # Allow HTTPS traffic from internet
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic",
        )

        # Allow ALB to connect to ECS tasks
        self.ecs_security_group.add_ingress_rule(
            peer=sg,
            connection=ec2.Port.tcp(8080),
            description="Allow ALB to connect to ECS tasks",
        )

        return sg

    def _create_db_secret(self, environment: str) -> secretsmanager.Secret:
        """Create Secrets Manager secret for database credentials"""
        secret = secretsmanager.Secret(
            self,
            f"db-secret-{environment}-{self.environment_suffix}",
            secret_name=f"payment-db-{environment}-{self.environment_suffix}",
            description=f"Database credentials for {environment} RDS instance",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "dbadmin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32,
                exclude_characters='"@/\\',
            ),
        )

        # Note: Automatic rotation requires rotationLambda or hostedRotation configuration
        # For production use, configure rotation using:
        # secret.add_rotation_schedule(
        #     f"rotation-{environment}-{self.environment_suffix}",
        #     automatically_after=Duration.days(30),
        #     hosted_rotation=secretsmanager.HostedRotation.postgresql_single_user()
        # )

        return secret

    def _create_rds_instance(self, environment: str, secret: secretsmanager.Secret) -> rds.DatabaseInstance:
        """Create RDS PostgreSQL instance"""
        # Create subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self,
            f"db-subnet-{environment}-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Subnet group for {environment} RDS instance",
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            subnet_group_name=f"rds-subnet-{environment}-{self.environment_suffix}",
        )

        # Create parameter group
        parameter_group = rds.ParameterGroup(
            self,
            f"db-params-{environment}-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14
            ),
            description=f"Parameter group for {environment} PostgreSQL",
            parameters={
                "rds.logical_replication": "1",
                "max_replication_slots": "10",
                "max_wal_senders": "10",
            },
        )

        # Create RDS instance
        db_instance = rds.DatabaseInstance(
            self,
            f"rds-{environment}-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_14
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.MEMORY5,
                ec2.InstanceSize.LARGE,
            ),
            allocated_storage=100,
            storage_type=rds.StorageType.GP2,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.db_security_group],
            subnet_group=subnet_group,
            parameter_group=parameter_group,
            credentials=rds.Credentials.from_secret(secret),
            database_name="paymentdb",
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            storage_encrypted=True,
            multi_az=False,
            publicly_accessible=False,
            instance_identifier=f"payment-db-{environment}-{self.environment_suffix}",
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
        )

        return db_instance

    def _create_s3_bucket(self, environment: str) -> s3.Bucket:
        """Create S3 bucket with encryption and versioning"""
        bucket = s3.Bucket(
            self,
            f"s3-{environment}-{self.environment_suffix}",
            bucket_name=f"payment-logs-{environment}-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="archive-old-versions",
                    noncurrent_version_transitions=[
                        s3.NoncurrentVersionTransition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90),
                        )
                    ],
                    noncurrent_version_expiration=Duration.days(365),
                )
            ],
        )

        return bucket

    def _configure_s3_replication(self) -> None:
        """Configure cross-region replication between S3 buckets"""
        # Create IAM role for replication
        replication_role = iam.Role(
            self,
            f"s3-replication-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
            description="Role for S3 cross-region replication",
        )

        # Grant permissions to source bucket
        self.source_bucket.grant_read(replication_role)

        # Grant permissions to target bucket
        self.target_bucket.grant_write(replication_role)

        # Configure replication on source bucket
        cfn_source = self.source_bucket.node.default_child
        cfn_source.replication_configuration = s3.CfnBucket.ReplicationConfigurationProperty(
            role=replication_role.role_arn,
            rules=[
                s3.CfnBucket.ReplicationRuleProperty(
                    id=f"replicate-all-{self.environment_suffix}",
                    status="Enabled",
                    priority=1,
                    destination=s3.CfnBucket.ReplicationDestinationProperty(
                        bucket=self.target_bucket.bucket_arn,
                        replication_time=s3.CfnBucket.ReplicationTimeProperty(
                            status="Enabled",
                            time=s3.CfnBucket.ReplicationTimeValueProperty(
                                minutes=15
                            ),
                        ),
                        metrics=s3.CfnBucket.MetricsProperty(
                            status="Enabled",
                            event_threshold=s3.CfnBucket.ReplicationTimeValueProperty(
                                minutes=15
                            ),
                        ),
                    ),
                    filter=s3.CfnBucket.ReplicationRuleFilterProperty(
                        prefix="",
                    ),
                    delete_marker_replication=s3.CfnBucket.DeleteMarkerReplicationProperty(
                        status="Enabled"
                    ),
                )
            ],
        )

    def _create_dms_replication_instance(self) -> dms.CfnReplicationInstance:
        """Create DMS replication instance"""
        # Create subnet group for DMS
        subnet_ids = [subnet.subnet_id for subnet in self.vpc.select_subnets(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        ).subnets]

        dms_subnet_group = dms.CfnReplicationSubnetGroup(
            self,
            f"dms-subnet-{self.environment_suffix}",
            replication_subnet_group_description=f"DMS subnet group - {self.environment_suffix}",
            subnet_ids=subnet_ids,
            replication_subnet_group_identifier=f"dms-subnet-{self.environment_suffix}",
        )

        # Create replication instance
        replication_instance = dms.CfnReplicationInstance(
            self,
            f"dms-instance-{self.environment_suffix}",
            replication_instance_class="dms.c5.large",
            replication_instance_identifier=f"payment-dms-{self.environment_suffix}",
            allocated_storage=100,
            engine_version="3.5.2",
            multi_az=False,
            publicly_accessible=False,
            replication_subnet_group_identifier=dms_subnet_group.replication_subnet_group_identifier,
            vpc_security_group_ids=[self.dms_security_group.security_group_id],
        )

        replication_instance.add_dependency(dms_subnet_group)

        return replication_instance

    def _create_dms_endpoint(
        self, environment: str, db_instance: rds.DatabaseInstance, secret: secretsmanager.Secret
    ) -> dms.CfnEndpoint:
        """Create DMS endpoint using Secrets Manager"""
        endpoint_type = "source" if environment == "source" else "target"

        # Create IAM role for DMS to access Secrets Manager
        dms_secrets_role = iam.Role(
            self,
            f"dms-secrets-role-{environment}-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("dms.amazonaws.com"),
            description=f"Role for DMS to access Secrets Manager for {environment} endpoint",
        )

        # Grant the role permission to read the secret
        secret.grant_read(dms_secrets_role)

        endpoint = dms.CfnEndpoint(
            self,
            f"dms-endpoint-{environment}-{self.environment_suffix}",
            endpoint_type=endpoint_type,
            endpoint_identifier=f"payment-{environment}-{self.environment_suffix}",
            engine_name="postgres",
            server_name=db_instance.db_instance_endpoint_address,
            port=5432,
            database_name="paymentdb",
            postgre_sql_settings=dms.CfnEndpoint.PostgreSqlSettingsProperty(
                secrets_manager_secret_id=secret.secret_arn,
                secrets_manager_access_role_arn=dms_secrets_role.role_arn,
            ),
        )

        endpoint.add_dependency(self.dms_replication_instance)

        return endpoint

    def _create_dms_replication_task(self) -> dms.CfnReplicationTask:
        """Create DMS replication task for continuous data sync"""
        # Table mappings for payment-related tables
        table_mappings = {
            "rules": [
                {
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "include-payment-tables",
                    "object-locator": {
                        "schema-name": "public",
                        "table-name": "%",
                    },
                    "rule-action": "include",
                }
            ]
        }

        # Replication task settings
        task_settings = {
            "Logging": {
                "EnableLogging": True,
                "LogComponents": [
                    {
                        "Id": "SOURCE_CAPTURE",
                        "Severity": "LOGGER_SEVERITY_INFO",
                    },
                    {
                        "Id": "TARGET_APPLY",
                        "Severity": "LOGGER_SEVERITY_INFO",
                    },
                ],
            },
            "ControlTablesSettings": {
                "ControlSchema": "dms_control",
                "HistoryTimeslotInMinutes": 5,
            },
            "FullLoadSettings": {
                "TargetTablePrepMode": "DROP_AND_CREATE",
                "MaxFullLoadSubTasks": 8,
            },
            "ChangeProcessingTuning": {
                "BatchApplyTimeoutMin": 1,
                "BatchApplyTimeoutMax": 30,
                "MinTransactionSize": 1000,
                "CommitTimeout": 1,
                "MemoryLimitTotal": 1024,
                "MemoryKeepTime": 60,
            },
        }

        replication_task = dms.CfnReplicationTask(
            self,
            f"dms-task-{self.environment_suffix}",
            replication_task_identifier=f"payment-replication-{self.environment_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=self.dms_replication_instance.ref,
            source_endpoint_arn=self.dms_source_endpoint.ref,
            target_endpoint_arn=self.dms_target_endpoint.ref,
            table_mappings=str(table_mappings).replace("'", '"'),
            replication_task_settings=str(task_settings).replace("'", '"'),
        )

        replication_task.add_dependency(self.dms_source_endpoint)
        replication_task.add_dependency(self.dms_target_endpoint)

        return replication_task

    def _create_ecs_cluster(self) -> ecs.Cluster:
        """Create ECS cluster for payment processing services"""
        cluster = ecs.Cluster(
            self,
            f"ecs-cluster-{self.environment_suffix}",
            cluster_name=f"payment-cluster-{self.environment_suffix}",
            vpc=self.vpc,
            container_insights=True,
        )

        return cluster

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer"""
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"alb-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name=f"payment-alb-{self.environment_suffix}",
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        return alb

    def _create_ecs_service(self) -> ecs.FargateService:
        """Create ECS Fargate service"""
        # Create task execution role
        execution_role = iam.Role(
            self,
            f"ecs-execution-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        # Create task role with access to secrets and RDS
        task_role = iam.Role(
            self,
            f"ecs-task-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )

        # Grant access to database secrets
        self.source_db_secret.grant_read(task_role)
        self.target_db_secret.grant_read(task_role)

        # Grant access to S3 buckets
        self.source_bucket.grant_read_write(task_role)
        self.target_bucket.grant_read_write(task_role)

        # Create CloudWatch log group
        log_group = logs.LogGroup(
            self,
            f"ecs-logs-{self.environment_suffix}",
            log_group_name=f"/ecs/payment-service-{self.environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK,
        )

        # Create task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"ecs-task-{self.environment_suffix}",
            family=f"payment-task-{self.environment_suffix}",
            cpu=512,
            memory_limit_mib=1024,
            execution_role=execution_role,
            task_role=task_role,
        )

        # Add container to task definition
        container = task_definition.add_container(
            f"payment-container-{self.environment_suffix}",
            image=ecs.ContainerImage.from_registry("nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="payment-service",
                log_group=log_group,
            ),
            environment={
                "ENVIRONMENT": self.environment_suffix,
                "DB_SECRET_ARN": self.source_db_secret.secret_arn,
            },
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=8080, protocol=ecs.Protocol.TCP)
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"ecs-target-{self.environment_suffix}",
            vpc=self.vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(30),
            target_group_name=f"payment-tg-{self.environment_suffix}",
        )

        # Add listener to ALB
        listener = self.alb.add_listener(
            f"alb-listener-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group],
        )

        # Create Fargate service
        service = ecs.FargateService(
            self,
            f"ecs-service-{self.environment_suffix}",
            cluster=self.ecs_cluster,
            task_definition=task_definition,
            service_name=f"payment-service-{self.environment_suffix}",
            desired_count=2,
            security_groups=[self.ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            assign_public_ip=False,
            health_check_grace_period=Duration.seconds(60),
        )

        # Attach service to target group
        service.attach_to_application_target_group(target_group)

        # Enable auto-scaling
        scaling = service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10,
        )

        scaling.scale_on_cpu_utilization(
            f"cpu-scaling-{self.environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        scaling.scale_on_memory_utilization(
            f"memory-scaling-{self.environment_suffix}",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        return service

    def _create_cloudwatch_dashboard(self) -> cloudwatch.Dashboard:
        """Create CloudWatch dashboard for monitoring"""
        dashboard = cloudwatch.Dashboard(
            self,
            f"dashboard-{self.environment_suffix}",
            dashboard_name=f"payment-migration-{self.environment_suffix}",
        )

        # DMS replication lag widget
        dms_lag_widget = cloudwatch.GraphWidget(
            title="DMS Replication Lag",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/DMS",
                    metric_name="CDCLatencySource",
                    dimensions_map={
                        "ReplicationInstanceIdentifier": f"payment-dms-{self.environment_suffix}",
                        "ReplicationTaskIdentifier": f"payment-replication-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(1),
                )
            ],
        )

        # Database CPU widget
        db_cpu_widget = cloudwatch.GraphWidget(
            title="Database CPU Utilization",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "DBInstanceIdentifier": f"payment-db-source-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                    label="Source DB",
                ),
                cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "DBInstanceIdentifier": f"payment-db-target-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                    label="Target DB",
                ),
            ],
        )

        # Database connections widget
        db_connections_widget = cloudwatch.GraphWidget(
            title="Database Connections",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="DatabaseConnections",
                    dimensions_map={
                        "DBInstanceIdentifier": f"payment-db-source-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                    label="Source DB",
                ),
                cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="DatabaseConnections",
                    dimensions_map={
                        "DBInstanceIdentifier": f"payment-db-target-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                    label="Target DB",
                ),
            ],
        )

        # ECS service health widget
        ecs_health_widget = cloudwatch.GraphWidget(
            title="ECS Service Health",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ECS",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "ServiceName": f"payment-service-{self.environment_suffix}",
                        "ClusterName": f"payment-cluster-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                    label="CPU",
                ),
                cloudwatch.Metric(
                    namespace="AWS/ECS",
                    metric_name="MemoryUtilization",
                    dimensions_map={
                        "ServiceName": f"payment-service-{self.environment_suffix}",
                        "ClusterName": f"payment-cluster-{self.environment_suffix}",
                    },
                    statistic="Average",
                    period=Duration.minutes(5),
                    label="Memory",
                ),
            ],
        )

        # ALB request count widget
        alb_requests_widget = cloudwatch.GraphWidget(
            title="ALB Request Count",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ApplicationELB",
                    metric_name="RequestCount",
                    dimensions_map={
                        "LoadBalancer": self.alb.load_balancer_full_name,
                    },
                    statistic="Sum",
                    period=Duration.minutes(5),
                )
            ],
        )

        # ALB target health widget
        alb_health_widget = cloudwatch.GraphWidget(
            title="ALB Target Health",
            left=[
                cloudwatch.Metric(
                    namespace="AWS/ApplicationELB",
                    metric_name="HealthyHostCount",
                    dimensions_map={
                        "TargetGroup": f"targetgroup/payment-tg-{self.environment_suffix}",
                        "LoadBalancer": self.alb.load_balancer_full_name,
                    },
                    statistic="Average",
                    period=Duration.minutes(1),
                    label="Healthy",
                ),
                cloudwatch.Metric(
                    namespace="AWS/ApplicationELB",
                    metric_name="UnHealthyHostCount",
                    dimensions_map={
                        "TargetGroup": f"targetgroup/payment-tg-{self.environment_suffix}",
                        "LoadBalancer": self.alb.load_balancer_full_name,
                    },
                    statistic="Average",
                    period=Duration.minutes(1),
                    label="Unhealthy",
                ),
            ],
        )

        # Add widgets to dashboard
        dashboard.add_widgets(dms_lag_widget, db_cpu_widget)
        dashboard.add_widgets(db_connections_widget, ecs_health_widget)
        dashboard.add_widgets(alb_requests_widget, alb_health_widget)

        return dashboard

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for critical metrics"""
        # DMS replication lag alarm
        dms_lag_alarm = cloudwatch.Alarm(
            self,
            f"dms-lag-alarm-{self.environment_suffix}",
            alarm_name=f"DMS-Replication-Lag-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/DMS",
                metric_name="CDCLatencySource",
                dimensions_map={
                    "ReplicationInstanceIdentifier": f"payment-dms-{self.environment_suffix}",
                    "ReplicationTaskIdentifier": f"payment-replication-{self.environment_suffix}",
                },
                statistic="Average",
                period=Duration.minutes(1),
            ),
            threshold=60,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="DMS replication lag exceeds 60 seconds",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Database CPU alarm
        db_cpu_alarm = cloudwatch.Alarm(
            self,
            f"db-cpu-alarm-{self.environment_suffix}",
            alarm_name=f"Database-High-CPU-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": f"payment-db-source-{self.environment_suffix}",
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Database CPU utilization exceeds 80%",
        )

        # ECS unhealthy tasks alarm
        ecs_unhealthy_alarm = cloudwatch.Alarm(
            self,
            f"ecs-unhealthy-alarm-{self.environment_suffix}",
            alarm_name=f"ECS-Unhealthy-Tasks-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "TargetGroup": f"targetgroup/payment-tg-{self.environment_suffix}",
                    "LoadBalancer": self.alb.load_balancer_full_name,
                },
                statistic="Average",
                period=Duration.minutes(1),
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="One or more ECS tasks are unhealthy",
        )

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for migration runbook"""
        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID for migration infrastructure",
            export_name=f"VpcId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SourceDatabaseEndpoint",
            value=self.source_db.db_instance_endpoint_address,
            description="Source database endpoint",
            export_name=f"SourceDbEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "TargetDatabaseEndpoint",
            value=self.target_db.db_instance_endpoint_address,
            description="Target database endpoint",
            export_name=f"TargetDbEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DMSReplicationTaskArn",
            value=self.dms_replication_task.ref,
            description="DMS replication task ARN for monitoring",
            export_name=f"DmsTaskArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SourceBucketName",
            value=self.source_bucket.bucket_name,
            description="Source S3 bucket name",
            export_name=f"SourceBucket-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "TargetBucketName",
            value=self.target_bucket.bucket_name,
            description="Target S3 bucket name",
            export_name=f"TargetBucket-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
            export_name=f"AlbDns-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSClusterName",
            value=self.ecs_cluster.cluster_name,
            description="ECS cluster name",
            export_name=f"EcsCluster-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "CloudWatchDashboard",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=payment-migration-{self.environment_suffix}",
            description="CloudWatch dashboard URL",
        )

        CfnOutput(
            self,
            "MigrationRunbook",
            value=f"1. Monitor DMS replication lag in CloudWatch\n2. Verify data consistency between source and target\n3. Update Route 53 to shift traffic gradually\n4. Monitor ALB and ECS service health\n5. Rollback: Shift Route 53 back to 100% source",
            description="Step-by-step migration runbook",
        )

# Payment Processing Infrastructure Migration - CDK Python Implementation

## File: lib/tap_stack.py

```python
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
)
from constructs import Construct, IConstruct
import jsii


@jsii.implements(ec2.IAspect)
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

        # Enable automatic rotation every 30 days
        secret.add_rotation_schedule(
            f"rotation-{environment}-{self.environment_suffix}",
            automatically_after=Duration.days(30),
        )

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
            engine_version="3.4.7",
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

        endpoint = dms.CfnEndpoint(
            self,
            f"dms-endpoint-{environment}-{self.environment_suffix}",
            endpoint_type=endpoint_type,
            endpoint_identifier=f"payment-{environment}-{self.environment_suffix}",
            engine_name="postgres",
            server_name=db_instance.db_instance_endpoint_address,
            port=5432,
            database_name="paymentdb",
            secrets_manager_secret_id=secret.secret_arn,
            ssl_mode="require",
        )

        # Grant DMS access to read the secret
        secret.grant_read(iam.ServicePrincipal("dms.amazonaws.com"))

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
```

## File: lib/route53_stack.py

```python
from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_elasticloadbalancingv2 as elbv2,
    CfnOutput,
    Duration,
)
from constructs import Construct


class Route53Stack(Stack):
    """Stack for Route 53 weighted routing configuration"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        source_alb: elbv2.ApplicationLoadBalancer,
        target_alb: elbv2.ApplicationLoadBalancer,
        environment_suffix: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Create hosted zone (or import existing)
        self.hosted_zone = route53.HostedZone(
            self,
            f"hosted-zone-{environment_suffix}",
            zone_name=f"payment-migration-{environment_suffix}.example.com",
            comment=f"Hosted zone for payment processing migration - {environment_suffix}",
        )

        # Create health check for source ALB
        source_health_check = route53.CfnHealthCheck(
            self,
            f"source-health-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=source_alb.load_balancer_dns_name,
                port=443,
                request_interval=30,
                failure_threshold=3,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"source-alb-health-{environment_suffix}",
                )
            ],
        )

        # Create health check for target ALB
        target_health_check = route53.CfnHealthCheck(
            self,
            f"target-health-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=target_alb.load_balancer_dns_name,
                port=443,
                request_interval=30,
                failure_threshold=3,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"target-alb-health-{environment_suffix}",
                )
            ],
        )

        # Create weighted routing records
        # Source environment - 100% initially
        source_record = route53.ARecord(
            self,
            f"source-record-{environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"api.payment-migration-{environment_suffix}.example.com",
            target=route53.RecordTarget.from_alias(
                route53.targets.LoadBalancerTarget(source_alb)
            ),
            weight=100,
            set_identifier=f"source-{environment_suffix}",
            ttl=Duration.seconds(60),
        )

        # Target environment - 0% initially
        target_record = route53.ARecord(
            self,
            f"target-record-{environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"api.payment-migration-{environment_suffix}.example.com",
            target=route53.RecordTarget.from_alias(
                route53.targets.LoadBalancerTarget(target_alb)
            ),
            weight=0,
            set_identifier=f"target-{environment_suffix}",
            ttl=Duration.seconds(60),
        )

        # Outputs
        CfnOutput(
            self,
            "HostedZoneId",
            value=self.hosted_zone.hosted_zone_id,
            description="Route 53 hosted zone ID",
            export_name=f"HostedZoneId-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DomainName",
            value=f"api.payment-migration-{environment_suffix}.example.com",
            description="API domain name for traffic routing",
        )

        CfnOutput(
            self,
            "TrafficShiftCommand",
            value=f"aws route53 change-resource-record-sets --hosted-zone-id {self.hosted_zone.hosted_zone_id} --change-batch file://traffic-shift.json",
            description="Command to shift traffic between environments",
        )

        CfnOutput(
            self,
            "SourceHealthCheckId",
            value=source_health_check.attr_health_check_id,
            description="Health check ID for source ALB",
        )

        CfnOutput(
            self,
            "TargetHealthCheckId",
            value=target_health_check.attr_health_check_id,
            description="Health check ID for target ALB",
        )
```

## File: lib/__init__.py

```python
"""Payment processing migration infrastructure package"""
```

## File: requirements.txt

```
aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
```

## File: app.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack
from lib.route53_stack import Route53Stack

# Environment configuration
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1"),
)

app = cdk.App()

# Get environment suffix from context or use default
environment_suffix = app.node.try_get_context("environmentSuffix") or "dev-001"

# Create source stack
source_stack = TapStack(
    app,
    f"PaymentMigrationSourceStack-{environment_suffix}",
    environment_suffix=f"source-{environment_suffix}",
    env=env,
    description="Source environment for payment processing migration",
)

# Create target stack
target_stack = TapStack(
    app,
    f"PaymentMigrationTargetStack-{environment_suffix}",
    environment_suffix=f"target-{environment_suffix}",
    env=env,
    description="Target environment for payment processing migration",
)

# Create Route 53 stack for traffic management
route53_stack = Route53Stack(
    app,
    f"PaymentMigrationRoute53Stack-{environment_suffix}",
    source_alb=source_stack.alb,
    target_alb=target_stack.alb,
    environment_suffix=environment_suffix,
    env=env,
    description="Route 53 weighted routing for migration",
)

# Add dependencies
route53_stack.add_dependency(source_stack)
route53_stack.add_dependency(target_stack)

app.synth()
```

## File: cdk.json

```json
{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "**/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "environmentSuffix": "dev-001"
  }
}
```

## File: lib/README.md

```markdown
# Payment Processing Infrastructure Migration

This CDK Python project implements a comprehensive migration solution for payment processing infrastructure with database replication, service migration, and traffic routing capabilities.

## Architecture Overview

The solution creates:
- **Multi-stack architecture** with separate source and target environments
- **RDS PostgreSQL** instances (db.r5.large, 100GB) with encryption and Secrets Manager integration
- **AWS DMS** for continuous database replication with CDC
- **S3 buckets** with cross-region replication for transaction logs
- **ECS Fargate** services behind Application Load Balancers
- **Route 53** weighted routing for gradual traffic shifting
- **CloudWatch** dashboard with comprehensive monitoring and alarms

## Security Features

- **No hardcoded passwords** - all credentials managed via AWS Secrets Manager
- DMS endpoints use `secrets_manager_secret_id` parameter for authentication
- Automatic credential rotation every 30 days
- Encryption at rest for all data (RDS, S3)
- Encryption in transit with SSL/TLS
- Security groups with least privilege access
- Task-level IAM roles for ECS containers
- CDK Aspects for encryption enforcement

## Project Structure

```
.
├── app.py                      # CDK app entry point
├── cdk.json                    # CDK configuration
├── requirements.txt            # Python dependencies
└── lib/
    ├── __init__.py
    ├── tap_stack.py           # Main infrastructure stack
    ├── route53_stack.py       # DNS routing stack
    └── README.md              # This file
```

## Prerequisites

- Python 3.8 or later
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Docker installed (for asset bundling)

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

## Deployment

### Deploy All Stacks

```bash
# Deploy with default environment suffix
cdk deploy --all

# Deploy with custom environment suffix
cdk deploy --all -c environmentSuffix=prod-001
```

### Deploy Individual Stacks

```bash
# Deploy source environment only
cdk deploy PaymentMigrationSourceStack-dev-001

# Deploy target environment only
cdk deploy PaymentMigrationTargetStack-dev-001

# Deploy Route 53 routing (requires source and target)
cdk deploy PaymentMigrationRoute53Stack-dev-001
```

## Configuration

### Environment Suffix

The `environmentSuffix` parameter ensures unique resource names. Set it via:

1. CDK context in cdk.json (default: "dev-001")
2. Command line: `cdk deploy -c environmentSuffix=custom-001`
3. App context: Update `environment_suffix` in app.py

### Region Configuration

Set the target region via environment variable:
```bash
export CDK_DEFAULT_REGION=us-east-1
```

## Migration Runbook

### Phase 1: Infrastructure Setup

1. Deploy source and target stacks:
```bash
cdk deploy PaymentMigrationSourceStack-dev-001 PaymentMigrationTargetStack-dev-001
```

2. Verify database connectivity and DMS endpoints

3. Start DMS replication task:
```bash
aws dms start-replication-task \
  --replication-task-arn <DMS_TASK_ARN> \
  --start-replication-task-type start-replication
```

### Phase 2: Data Replication Monitoring

1. Monitor DMS replication lag in CloudWatch dashboard
2. Verify replication lag stays under 60 seconds
3. Check database metrics (CPU, connections, IOPS)
4. Validate data consistency between source and target

### Phase 3: Service Deployment

1. Deploy ECS services in both environments
2. Verify ALB health checks pass
3. Test application endpoints
4. Monitor ECS task health and auto-scaling

### Phase 4: Traffic Migration

1. Deploy Route 53 stack:
```bash
cdk deploy PaymentMigrationRoute53Stack-dev-001
```

2. Initial state: 100% traffic to source, 0% to target

3. Gradual traffic shift (example: 10% increments):
```bash
# Create traffic-shift.json with updated weights
# Source: 90, Target: 10
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch file://traffic-shift.json
```

4. Monitor key metrics after each shift:
   - DMS replication lag
   - Database performance
   - ALB request rates and errors
   - ECS service health

5. Continue shifting traffic until 100% on target

### Phase 5: Validation and Cleanup

1. Validate all traffic on target environment
2. Monitor for 24-48 hours
3. Keep source environment for rollback capability
4. After validation period, decommission source stack

## Rollback Procedure

If issues occur during migration:

1. **Immediate rollback** - Route 53 traffic shift:
```bash
# Shift 100% traffic back to source
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch file://rollback.json
```

2. **Monitor** source environment health
3. **Investigate** target environment issues
4. **Fix** problems before retry

## CloudWatch Dashboard

Access the migration dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=payment-migration-dev-001
```

Key metrics monitored:
- DMS replication lag (alert at 60 seconds)
- Database CPU utilization (alert at 80%)
- Database connections
- ECS service CPU and memory
- ALB request count and errors
- Target health (healthy vs unhealthy hosts)

## Testing

### Synthesize CloudFormation Templates

```bash
cdk synth
```

### View Differences

```bash
cdk diff
```

### Validate Changes

```bash
cdk deploy --require-approval never --dry-run
```

## Cost Optimization

This solution uses:
- **RDS db.r5.large**: ~$0.35/hour per instance
- **DMS c5.large**: ~$0.17/hour
- **ECS Fargate**: Pay per vCPU/memory per second
- **NAT Gateway**: $0.045/hour + data transfer
- **S3**: Storage + replication costs

**Optimization tips**:
- Use smaller instance types for dev/test
- Stop DMS replication when not needed
- Reduce ECS task count for non-production
- Use S3 lifecycle policies for old data

## Cleanup

To destroy all resources:

```bash
# Delete all stacks
cdk destroy --all

# Or delete individually (reverse order of dependencies)
cdk destroy PaymentMigrationRoute53Stack-dev-001
cdk destroy PaymentMigrationTargetStack-dev-001
cdk destroy PaymentMigrationSourceStack-dev-001
```

**Note**: Some resources may require manual deletion:
- Secrets Manager secrets (30-day recovery window)
- RDS snapshots (if retention enabled)
- S3 bucket versions (if versioning enabled)

## Troubleshooting

### DMS Replication Issues

1. Check CloudWatch logs for DMS task
2. Verify security group rules allow connectivity
3. Validate Secrets Manager secret format
4. Ensure RDS parameter group has logical replication enabled

### ECS Service Not Starting

1. Check task definition configuration
2. Verify IAM role permissions
3. Review CloudWatch logs for container errors
4. Validate security group rules

### Route 53 Health Checks Failing

1. Verify ALB health check endpoint exists
2. Check ALB target group health
3. Review security group rules for health check traffic
4. Validate DNS resolution

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS DMS Best Practices](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_BestPractices.html)
- [RDS PostgreSQL Replication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PostgreSQL.Replication.html)
- [ECS Fargate Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)

## Support

For issues or questions:
1. Check CloudWatch logs and dashboard
2. Review CloudFormation stack events
3. Validate IAM permissions
4. Check AWS service quotas
```

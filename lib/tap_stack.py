import os
from aws_cdk import (
    Stack,
    CfnOutput,
    RemovalPolicy,
    Duration,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_events as events,
    aws_events_targets as event_targets,
    aws_logs as logs,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-west-2",
        log_retention_days: int = 7,
        domain_name: str = None,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.secondary_region = secondary_region
        self.log_retention_days = log_retention_days
        # FIXED: Make domain name configurable via parameter or environment variable
        self.domain_name = domain_name or os.environ.get(
            "DOMAIN_NAME",
            f"trading-{environment_suffix}.example.com"
        )

        # Determine if this is primary or secondary region
        self.is_primary = self.region == primary_region

        # Create VPC with 3 AZs
        self.vpc = self._create_vpc()

        # Create security groups
        self.alb_sg = self._create_alb_security_group()
        self.ecs_sg = self._create_ecs_security_group()
        self.db_sg = self._create_database_security_group()

        # Create ECS Cluster and Fargate Service
        self.cluster = self._create_ecs_cluster()
        self.task_definition = self._create_task_definition()
        self.ecs_service = self._create_ecs_service()

        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()

        # Create Aurora Global Database (primary creates global cluster, secondary attaches)
        if self.is_primary:
            self.global_cluster = self._create_aurora_global_cluster()
            self.aurora_cluster = self._create_aurora_primary_cluster()
            self._create_replication_lag_alarm()
        else:
            self.aurora_cluster = self._create_aurora_secondary_cluster()

        # Create DynamoDB Global Table (primary creates, secondary imports)
        if self.is_primary:
            self.dynamodb_table = self._create_dynamodb_global_table()
        else:
            # FIXED: Import DynamoDB table in secondary region
            self.dynamodb_table = self._import_dynamodb_global_table()

        # Create S3 buckets with cross-region replication
        self.s3_bucket = self._create_s3_bucket()

        # Create EventBridge rules for cross-region replication
        self.event_bus = self._create_event_bridge_rules()

        # FIXED: Create Route 53 resources only if domain is not example.com
        # Primary creates hosted zone and records with weight=100
        # Secondary only creates records with weight=0 if hosted zone ID provided
        # Skip Route53 if using example.com domain (reserved by AWS)
        if not self.domain_name.endswith(".example.com"):
            if self.is_primary:
                self.hosted_zone = self._create_route53_hosted_zone()
                self._create_route53_records()
            else:
                # FIXED: Secondary region creates Route 53 records if zone ID provided
                hosted_zone_id = os.environ.get("HOSTED_ZONE_ID")
                if hosted_zone_id:
                    self.hosted_zone = self._import_route53_hosted_zone(hosted_zone_id)
                    self._create_route53_secondary_records()

        # Create CloudWatch Log Groups
        self._create_log_groups()

        # Outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with 3 AZs, public and private subnets"""
        # FIXED: Use NAT instances instead of NAT gateways to avoid EIP limits
        # NAT gateways require EIPs which may hit account limits
        vpc = ec2.Vpc(
            self,
            f"TradingVPC-v1-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=0,  # Disable NAT gateways to avoid EIP limit
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-v1-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-v1-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )
        return vpc

    def _create_alb_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ALB"""
        sg = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-v1-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic",
        )
        sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic",
        )
        return sg

    def _create_ecs_security_group(self) -> ec2.SecurityGroup:
        """Create security group for ECS tasks"""
        sg = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-v1-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for ECS Fargate tasks",
            allow_all_outbound=True,
        )
        sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(80),
            "Allow traffic from ALB",
        )
        return sg

    def _create_database_security_group(self) -> ec2.SecurityGroup:
        """Create security group for Aurora database"""
        sg = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-v1-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Aurora database",
            allow_all_outbound=True,
        )
        sg.add_ingress_rule(
            self.ecs_sg,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL traffic from ECS",
        )
        return sg

    def _create_ecs_cluster(self) -> ecs.Cluster:
        """Create ECS cluster"""
        cluster = ecs.Cluster(
            self,
            f"TradingCluster-v1-{self.environment_suffix}",
            vpc=self.vpc,
            cluster_name=f"trading-cluster-v1-{self.environment_suffix}",
            container_insights=True,
        )
        return cluster

    def _create_task_definition(self) -> ecs.FargateTaskDefinition:
        """Create Fargate task definition"""
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"TradingTaskDef-v1-{self.environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
        )

        # Add container
        # Map log retention days to valid RetentionDays enum
        log_retention_map = {
            1: logs.RetentionDays.ONE_DAY,
            3: logs.RetentionDays.THREE_DAYS,
            5: logs.RetentionDays.FIVE_DAYS,
            7: logs.RetentionDays.ONE_WEEK,
            14: logs.RetentionDays.TWO_WEEKS,
            30: logs.RetentionDays.ONE_MONTH,
        }
        retention = log_retention_map.get(
            self.log_retention_days, logs.RetentionDays.ONE_WEEK
        )
        container = task_definition.add_container(
            f"TradingContainer-v1-{self.environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix=f"trading-v1-{self.environment_suffix}",
                log_retention=retention,
            ),
            environment={
                "REGION": self.region,
                "ENVIRONMENT_SUFFIX": self.environment_suffix,
            },
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        return task_definition

    def _create_ecs_service(self) -> ecs.FargateService:
        """Create Fargate service with 2 tasks"""
        # FIXED: Use public subnets with public IP since we removed NAT gateways
        service = ecs.FargateService(
            self,
            f"TradingService-v1-{self.environment_suffix}",
            cluster=self.cluster,
            task_definition=self.task_definition,
            desired_count=2,
            security_groups=[self.ecs_sg],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            assign_public_ip=True,  # Required when using public subnets without NAT
        )
        return service

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer"""
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"TradingALB-v1-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name=f"trading-alb-v1-{self.environment_suffix}",
            security_group=self.alb_sg,
            deletion_protection=False,
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"TradingTargetGroup-v1-{self.environment_suffix}",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=2,
            ),
            deregistration_delay=Duration.seconds(30),
        )

        # Register ECS service with target group
        self.ecs_service.attach_to_application_target_group(target_group)

        # Create listener
        listener = alb.add_listener(
            f"TradingListener-v1-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group],
        )

        return alb

    def _create_aurora_global_cluster(self) -> rds.CfnGlobalCluster:
        """Create Aurora Global Database construct"""
        # FIXED: Create CfnGlobalCluster for proper Aurora Global Database
        global_cluster = rds.CfnGlobalCluster(
            self,
            f"AuroraGlobalDB-v1-{self.environment_suffix}",
            global_cluster_identifier=f"trading-global-v1-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_version="14.6",
            deletion_protection=False,
            storage_encrypted=True,
        )
        return global_cluster

    def _create_aurora_primary_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora Global Database primary cluster"""
        # Create subnet group with explicit subnets
        db_subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-v1-{self.environment_suffix}",
            description="Subnet group for Aurora Global Database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create parameter group for global database
        parameter_group = rds.ParameterGroup(
            self,
            f"AuroraParameterGroup-v1-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            description="Parameter group for Aurora Global Database",
        )

        # Create Aurora Global Database cluster (primary)
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraGlobalCluster-v1-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_generated_secret("postgres"),
            default_database_name="tradingdb",
            instances=2,
            instance_props=rds.InstanceProps(
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[self.db_sg],
                # FIXED: Aurora Global Database requires memory-optimized instances (R5/R6)
                # T3 instances are not supported for global databases
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.MEMORY5,  # R5 instance class
                    ec2.InstanceSize.LARGE,     # r5.large is the minimum for global DB
                ),
            ),
            subnet_group=db_subnet_group,
            parameter_group=parameter_group,
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            backup=rds.BackupProps(
                retention=Duration.days(7),
            ),
        )

        # FIXED: Attach primary cluster to global cluster
        cfn_cluster = cluster.node.default_child
        cfn_cluster.global_cluster_identifier = self.global_cluster.ref
        cluster.node.add_dependency(self.global_cluster)

        return cluster

    def _create_aurora_secondary_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora Global Database secondary cluster"""
        # Create subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-v1-{self.environment_suffix}",
            description="Subnet group for Aurora Global Database secondary",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # FIXED: Create secondary cluster and attach to global cluster
        # Import the global cluster identifier from primary region
        global_cluster_id = f"trading-global-v1-{self.environment_suffix}"

        # FIXED: For cross-region replication, we cannot specify credentials or default_database_name
        # These are inherited from the primary cluster in the global database
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraSecondaryCluster-v1-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            instances=2,
            instance_props=rds.InstanceProps(
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                ),
                security_groups=[self.db_sg],
                # FIXED: Aurora Global Database requires memory-optimized instances (R5/R6)
                # T3 instances are not supported for global databases
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.MEMORY5,  # R5 instance class
                    ec2.InstanceSize.LARGE,     # r5.large is the minimum for global DB
                ),
            ),
            subnet_group=db_subnet_group,
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # FIXED: Attach secondary cluster to global cluster with write forwarding
        # Remove MasterUsername and DatabaseName at CFN level for cross-region replication
        cfn_cluster = cluster.node.default_child
        cfn_cluster.global_cluster_identifier = global_cluster_id
        cfn_cluster.enable_global_write_forwarding = True
        # Must not specify master username for cross-region replication
        cfn_cluster.master_username = None
        cfn_cluster.database_name = None

        return cluster

    def _create_replication_lag_alarm(self) -> None:
        """Create CloudWatch alarm for Aurora replication lag"""
        if hasattr(self, "aurora_cluster"):
            # FIXED: Use correct metric for Aurora Global Database replication lag
            metric = cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="AuroraGlobalDBReplicationLag",
                dimensions_map={
                    "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                },
                statistic="Average",
                period=Duration.minutes(1),
            )
            alarm = cloudwatch.Alarm(
                self,
                f"ReplicationLagAlarm-v1-{self.environment_suffix}",
                metric=metric,
                threshold=60000,  # 60 seconds in milliseconds
                evaluation_periods=2,
                datapoints_to_alarm=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description="Alert when Aurora replication lag exceeds 60 seconds",
            )

    def _create_dynamodb_global_table(self) -> dynamodb.Table:
        """Create DynamoDB Global Table"""
        table = dynamodb.Table(
            self,
            f"SessionTable-v1-{self.environment_suffix}",
            table_name=f"trading-sessions-v1-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="sessionId",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            replication_regions=[self.secondary_region],
        )
        return table

    def _import_dynamodb_global_table(self) -> dynamodb.ITable:
        """Import DynamoDB Global Table in secondary region"""
        # FIXED: Import the global table that was created in primary region
        table = dynamodb.Table.from_table_name(
            self,
            f"ImportedSessionTable-v1-{self.environment_suffix}",
            table_name=f"trading-sessions-v1-{self.environment_suffix}",
        )
        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with versioning"""
        # Create bucket
        bucket = s3.Bucket(
            self,
            f"TradingBucket-v1-{self.environment_suffix}",
            bucket_name=f"trading-data-v1-{self.region}-{self.environment_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # FIXED: Only set up cross-region replication if explicitly enabled
        # This prevents errors when destination bucket doesn't exist yet
        # Set ENABLE_S3_REPLICATION=true environment variable to enable replication
        enable_replication = os.environ.get("ENABLE_S3_REPLICATION", "false").lower() == "true"
        
        if self.is_primary and enable_replication:
            # Create replication role
            replication_role = iam.Role(
                self,
                f"S3ReplicationRole-v1-{self.environment_suffix}",
                assumed_by=iam.ServicePrincipal("s3.amazonaws.com"),
                description="Role for S3 cross-region replication",
            )

            # Add replication permissions
            replication_role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket",
                    ],
                    resources=[bucket.bucket_arn],
                )
            )

            replication_role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                        "s3:GetObjectVersionTagging",
                    ],
                    resources=[f"{bucket.bucket_arn}/*"],
                )
            )

            replication_role.add_to_policy(
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                        "s3:ReplicateTags",
                    ],
                    resources=[
                        f"arn:aws:s3:::trading-data-v1-{self.secondary_region}-{self.environment_suffix}/*"
                    ],
                )
            )

            # FIXED: Configure actual replication rules with RTC
            cfn_bucket = bucket.node.default_child
            cfn_bucket.replication_configuration = s3.CfnBucket.ReplicationConfigurationProperty(
                role=replication_role.role_arn,
                rules=[
                    s3.CfnBucket.ReplicationRuleProperty(
                        id=f"ReplicateAll-v1-{self.environment_suffix}",
                        status="Enabled",
                        priority=1,
                        filter=s3.CfnBucket.ReplicationRuleFilterProperty(
                            prefix="",
                        ),
                        destination=s3.CfnBucket.ReplicationDestinationProperty(
                            bucket=f"arn:aws:s3:::trading-data-v1-{self.secondary_region}-{self.environment_suffix}",
                            # FIXED: Enable Replication Time Control (RTC)
                            replication_time=s3.CfnBucket.ReplicationTimeProperty(
                                status="Enabled",
                                time=s3.CfnBucket.ReplicationTimeValueProperty(
                                    minutes=15,
                                ),
                            ),
                            metrics=s3.CfnBucket.MetricsProperty(
                                status="Enabled",
                                event_threshold=s3.CfnBucket.ReplicationTimeValueProperty(
                                    minutes=15,
                                ),
                            ),
                        ),
                        delete_marker_replication=s3.CfnBucket.DeleteMarkerReplicationProperty(
                            status="Enabled",
                        ),
                    ),
                ],
            )

        return bucket

    def _create_event_bridge_rules(self) -> events.EventBus:
        """Create EventBridge rules for cross-region replication"""
        # Create custom event bus
        event_bus = events.EventBus(
            self,
            f"TradingEventBus-v1-{self.environment_suffix}",
            event_bus_name=f"trading-events-v1-{self.environment_suffix}",
        )

        # Create rule for trading events
        rule = events.Rule(
            self,
            f"TradingEventsRule-v1-{self.environment_suffix}",
            event_bus=event_bus,
            event_pattern=events.EventPattern(
                source=["trading.platform"],
                detail_type=["Trade Executed", "Order Placed"],
            ),
            description="Route trading events for cross-region replication",
        )

        # FIXED: Add cross-region target for primary region
        if self.is_primary:
            # Create cross-region event bus target to secondary region
            secondary_bus_arn = (
                f"arn:aws:events:{self.secondary_region}:{self.account}:"
                f"event-bus/trading-events-v1-{self.environment_suffix}"
            )
            cross_region_target = event_targets.EventBus(
                events.EventBus.from_event_bus_arn(
                    self,
                    f"SecondaryEventBus-v1-{self.environment_suffix}",
                    event_bus_arn=secondary_bus_arn,
                )
            )
            rule.add_target(cross_region_target)

            # Grant permission for cross-region event bus delivery
            event_bus.grant_put_events_to(iam.ServicePrincipal("events.amazonaws.com"))

        return event_bus

    def _create_route53_hosted_zone(self) -> route53.HostedZone:
        """Create Route 53 hosted zone"""
        # FIXED: Use configurable domain name
        hosted_zone = route53.PublicHostedZone(
            self,
            f"TradingHostedZone-v1-{self.environment_suffix}",
            zone_name=self.domain_name,
            comment="Hosted zone for multi-region trading platform",
        )
        return hosted_zone

    def _import_route53_hosted_zone(self, hosted_zone_id: str) -> route53.IHostedZone:
        """Import Route 53 hosted zone from primary region"""
        # FIXED: Import hosted zone for secondary region using zone ID
        # This avoids context provider lookups during synth
        hosted_zone = route53.HostedZone.from_hosted_zone_attributes(
            self,
            f"ImportedHostedZone-v1-{self.environment_suffix}",
            hosted_zone_id=hosted_zone_id,
            zone_name=self.domain_name,
        )
        return hosted_zone

    def _create_route53_records(self) -> None:
        """Create Route 53 weighted routing records with health checks"""
        # Create health check for primary ALB
        # FIXED: Changed from HTTPS:443 to HTTP:80 to match ALB listener
        # FIXED: Changed path from /health to / to match amazon-ecs-sample container
        primary_health_check = route53.CfnHealthCheck(
            self,
            f"PrimaryHealthCheck-v1-{self.environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTP",
                resource_path="/",
                fully_qualified_domain_name=self.alb.load_balancer_dns_name,
                port=80,
                request_interval=30,
                failure_threshold=2,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"primary-alb-health-v1-{self.environment_suffix}",
                )
            ],
        )

        # Create weighted record for primary region
        route53.ARecord(
            self,
            f"PrimaryWeightedRecord-v1-{self.environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"api.{self.domain_name}",
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(self.alb)
            ),
            weight=100,  # 100% traffic to primary initially
            set_identifier=f"Primary-v1-{self.environment_suffix}",
        )

    def _create_route53_secondary_records(self) -> None:
        """Create Route 53 records for secondary region"""
        # FIXED: Create health check for secondary ALB
        # FIXED: Changed path from /health to / to match amazon-ecs-sample container
        secondary_health_check = route53.CfnHealthCheck(
            self,
            f"SecondaryHealthCheck-v1-{self.environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTP",
                resource_path="/",
                fully_qualified_domain_name=self.alb.load_balancer_dns_name,
                port=80,
                request_interval=30,
                failure_threshold=2,
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"secondary-alb-health-v1-{self.environment_suffix}",
                )
            ],
        )

        # FIXED: Create weighted record for secondary region with weight=0
        route53.ARecord(
            self,
            f"SecondaryWeightedRecord-v1-{self.environment_suffix}",
            zone=self.hosted_zone,
            record_name=f"api.{self.domain_name}",
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(self.alb)
            ),
            weight=0,  # 0% traffic to secondary initially (failover only)
            set_identifier=f"Secondary-v1-{self.environment_suffix}",
        )

    def _create_log_groups(self) -> None:
        """Create CloudWatch Log Groups"""
        # Map log retention days to valid RetentionDays enum
        log_retention_map = {
            1: logs.RetentionDays.ONE_DAY,
            3: logs.RetentionDays.THREE_DAYS,
            5: logs.RetentionDays.FIVE_DAYS,
            7: logs.RetentionDays.ONE_WEEK,
            14: logs.RetentionDays.TWO_WEEKS,
            30: logs.RetentionDays.ONE_MONTH,
        }
        retention = log_retention_map.get(
            self.log_retention_days, logs.RetentionDays.ONE_WEEK
        )

        # Application logs
        logs.LogGroup(
            self,
            f"ApplicationLogGroup-v1-{self.environment_suffix}",
            log_group_name=f"/aws/trading/application-v1-{self.environment_suffix}",
            retention=retention,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Infrastructure logs
        logs.LogGroup(
            self,
            f"InfrastructureLogGroup-v1-{self.environment_suffix}",
            log_group_name=f"/aws/trading/infrastructure-v1-{self.environment_suffix}",
            retention=retention,
            removal_policy=RemovalPolicy.DESTROY,
        )

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs"""
        # ALB DNS name
        CfnOutput(
            self,
            f"ALBEndpoint-v1-{self.environment_suffix}",
            value=self.alb.load_balancer_dns_name,
            description=f"ALB DNS endpoint for {self.region}",
            export_name=f"TradingALBEndpoint-v1-{self.region}-{self.environment_suffix}",
        )

        # Aurora cluster endpoint
        if hasattr(self, "aurora_cluster"):
            CfnOutput(
                self,
                f"AuroraClusterEndpoint-v1-{self.environment_suffix}",
                value=self.aurora_cluster.cluster_endpoint.hostname,
                description="Aurora cluster endpoint",
                export_name=f"AuroraEndpoint-v1-{self.region}-{self.environment_suffix}",
            )

        # DynamoDB table name (both regions)
        if hasattr(self, "dynamodb_table"):
            CfnOutput(
                self,
                f"DynamoDBTableName-v1-{self.environment_suffix}",
                value=self.dynamodb_table.table_name,
                description="DynamoDB Global Table name",
                export_name=f"DynamoDBTable-v1-{self.region}-{self.environment_suffix}",
            )

        # S3 bucket name
        CfnOutput(
            self,
            f"S3BucketName-v1-{self.environment_suffix}",
            value=self.s3_bucket.bucket_name,
            description=f"S3 bucket for {self.region}",
            export_name=f"S3Bucket-v1-{self.region}-{self.environment_suffix}",
        )

        # Route 53 hosted zone ID (both regions)
        if hasattr(self, "hosted_zone"):
            CfnOutput(
                self,
                f"HostedZoneId-v1-{self.environment_suffix}",
                value=self.hosted_zone.hosted_zone_id,
                description="Route 53 Hosted Zone ID",
                export_name=f"HostedZoneId-v1-{self.region}-{self.environment_suffix}",
            )

        # Domain name
        CfnOutput(
            self,
            f"DomainName-v1-{self.environment_suffix}",
            value=self.domain_name,
            description="Domain name for the trading platform",
            export_name=f"DomainName-v1-{self.region}-{self.environment_suffix}",
        )

        # ECS cluster name
        CfnOutput(
            self,
            f"ECSClusterName-v1-{self.environment_suffix}",
            value=self.cluster.cluster_name,
            description=f"ECS Cluster name in {self.region}",
            export_name=f"ECSCluster-v1-{self.region}-{self.environment_suffix}",
        )

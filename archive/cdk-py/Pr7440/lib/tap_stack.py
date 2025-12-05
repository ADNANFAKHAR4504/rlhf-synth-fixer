"""
Production-grade multi-tenant SaaS infrastructure stack for AWS
Designed for 10k tenants with current load of 2.5k tenants

This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Tenant Application Platform) project.
"""

import json
from typing import Dict, Optional

from aws_cdk import (CfnDeletionPolicy, CfnOutput, Duration, RemovalPolicy,
                     Stack, Tags)
from aws_cdk import aws_autoscaling as autoscaling
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_elasticache as elasticache
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_logs as logs
from aws_cdk import aws_rds as rds
from aws_cdk import aws_secretsmanager as secretsmanager
from constructs import Construct


class TapStackProps:
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        env: CDK Environment with account and region information.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        env: The CDK environment configuration.
    """

    def __init__(self, environment_suffix: Optional[str] = None, env=None, **kwargs):
        self.environment_suffix = environment_suffix
        self.env = env


class TapStack(Stack):
    """
    Main infrastructure stack for the TAP (Tenant Application Platform) environment

    This stack orchestrates the instantiation of all resource-specific components
    including VPC, databases, caching, load balancing, and auto-scaling infrastructure.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        vpc (ec2.Vpc): The VPC for the infrastructure.
        security_groups (Dict[str, ec2.SecurityGroup]): Security groups for different layers.
        kms_key (kms.Key): KMS key for encryption.
        aurora_cluster (rds.DatabaseCluster): Aurora database cluster.
        dynamodb_tables (Dict[str, dynamodb.Table]): DynamoDB tables.
        redis_cluster (elasticache.CfnReplicationGroup): Redis cluster.
        alb (elbv2.ApplicationLoadBalancer): Application load balancer.
        asg (autoscaling.AutoScalingGroup): Auto scaling group.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ) -> None:
        # Extract env from props if available and merge with kwargs
        if props and props.env:
            kwargs['env'] = props.env

        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props and props.environment_suffix else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Environment configuration
        self.region_name = self.region or "us-east-1"

        # Add global tags
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Platform", "TAP")
        Tags.of(self).add("Phase", "1")

        # Create KMS keys for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC and networking resources
        self.vpc = self._create_vpc()

        # Create security groups
        self.security_groups = self._create_security_groups()

        # Create Aurora Global Database
        self.aurora_cluster = self._create_aurora_cluster()

        # Create DynamoDB tables
        self.dynamodb_tables = self._create_dynamodb_tables()

        # Create ElastiCache Redis cluster
        self.redis_cluster = self._create_redis_cluster()

        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()

        # Create Auto Scaling Group
        self.asg = self._create_auto_scaling_group()

        # Create target groups and attach to ALB
        self.target_groups = self._configure_alb_target_groups()

        # Create CloudWatch dashboards
        self._create_monitoring_dashboards()

        # Output important resource identifiers
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS Customer Managed Key for encryption"""
        return kms.Key(
            self, "TapKmsKey",
            description="KMS key for TAP platform encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            alias=f"tap-{self.environment_suffix}-key",
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        principals=[iam.AccountRootPrincipal()],
                        actions=["kms:*"],
                        resources=["*"]
                    ),
                    iam.PolicyStatement(
                        principals=[iam.ServicePrincipal("logs.amazonaws.com")],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        resources=["*"],
                        conditions={
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:*"
                            }
                        }
                    )
                ]
            )
        )

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets across 3 AZs"""
        vpc = ec2.Vpc(
            self, "TapVpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="Public",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="Private",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    name="Database",
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Enable VPC Flow Logs
        log_group = logs.LogGroup(
            self, "VpcFlowLogs",
            retention=logs.RetentionDays.THREE_MONTHS,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        flow_log_role = iam.Role(
            self, "FlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            inline_policies={
                "CloudWatchLogPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            resources=[
                                log_group.log_group_arn,
                                f"{log_group.log_group_arn}:*"
                            ]
                        )
                    ]
                )
            }
        )

        ec2.FlowLog(
            self, "TapVpcFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group=log_group,
                iam_role=flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        return vpc

    def _create_security_groups(self) -> Dict[str, ec2.SecurityGroup]:
        """Create security groups for different layers"""
        security_groups = {}

        # ALB Security Group
        security_groups['alb'] = ec2.SecurityGroup(
            self, "AlbSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=False
        )
        security_groups['alb'].add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from internet"
        )
        security_groups['alb'].add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from internet (redirect to HTTPS)"
        )

        # EC2 Security Group
        security_groups['ec2'] = ec2.SecurityGroup(
            self, "Ec2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=False
        )
        security_groups['ec2'].add_ingress_rule(
            peer=security_groups['alb'],
            connection=ec2.Port.tcp_range(8080, 8090),
            description="Allow traffic from ALB"
        )

        # Database Security Group
        security_groups['database'] = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for Aurora database",
            allow_all_outbound=False
        )
        security_groups['database'].add_ingress_rule(
            peer=security_groups['ec2'],
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL from EC2 instances"
        )

        # Redis Security Group
        security_groups['redis'] = ec2.SecurityGroup(
            self, "RedisSecurityGroup",
            vpc=self.vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False
        )
        security_groups['redis'].add_ingress_rule(
            peer=security_groups['ec2'],
            connection=ec2.Port.tcp(6379),
            description="Allow Redis from EC2 instances"
        )

        # Add egress rules for ALB
        security_groups['alb'].add_egress_rule(
            peer=security_groups['ec2'],
            connection=ec2.Port.tcp_range(8080, 8090),
            description="Allow traffic to EC2 instances"
        )

        # Add specific egress rules for EC2 (least privilege)
        # Allow EC2 to access RDS
        security_groups['ec2'].add_egress_rule(
            peer=security_groups['database'],
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL access to Aurora"
        )

        # Allow EC2 to access Redis
        security_groups['ec2'].add_egress_rule(
            peer=security_groups['redis'],
            connection=ec2.Port.tcp(6379),
            description="Allow Redis access"
        )

        # Allow EC2 to access HTTPS for package downloads and AWS API calls
        security_groups['ec2'].add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS for AWS API and package downloads"
        )

        # Allow EC2 to access HTTP for package downloads
        security_groups['ec2'].add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP for package downloads"
        )

        # Allow EC2 DNS queries
        security_groups['ec2'].add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.udp(53),
            description="Allow DNS queries"
        )

        return security_groups

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora MySQL Global Database cluster"""

        # Create subnet group
        subnet_group = rds.SubnetGroup(
            self, "AuroraSubnetGroup",
            description="Subnet group for Aurora cluster",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create parameter group for Aurora MySQL 8.0
        parameter_group = rds.ParameterGroup(
            self, "AuroraParameterGroup",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_3_04_0
            ),
            description="Custom parameter group for Aurora MySQL",
            parameters={
                "slow_query_log": "1",
                "long_query_time": "2",
                "general_log": "0",
                "max_connections": "10000",
                "performance_schema": "1",
                "log_queries_not_using_indexes": "0"
            }
        )

        # Create monitoring role
        monitoring_role = iam.Role(
            self, "AuroraMonitoringRole",
            assumed_by=iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonRDSEnhancedMonitoringRole"
                )
            ]
        )

        # Create Aurora cluster
        cluster = rds.DatabaseCluster(
            self, "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_mysql(
                version=rds.AuroraMysqlEngineVersion.VER_3_04_0
            ),
            credentials=rds.Credentials.from_generated_secret(
                "tap_admin",
                secret_name=f"tap/{self.environment_suffix}/aurora/master"
            ),
            writer=rds.ClusterInstance.provisioned(
                "Writer",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.R6G,
                    ec2.InstanceSize.XLARGE4
                ),
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.LONG_TERM,
                publicly_accessible=False
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    f"Reader{i}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.R6G,
                        ec2.InstanceSize.XLARGE4
                    ),
                    enable_performance_insights=True,
                    performance_insight_retention=rds.PerformanceInsightRetention.LONG_TERM,
                    publicly_accessible=False
                ) for i in range(1, 3)
            ],
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[self.security_groups['database']],
            subnet_group=subnet_group,
            parameter_group=parameter_group,
            backup=rds.BackupProps(
                retention=Duration.days(30),
                preferred_window="03:00-04:00"
            ),
            preferred_maintenance_window="sun:04:00-sun:05:00",
            deletion_protection=(self.environment_suffix == 'prod'),
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            cloudwatch_logs_exports=["error", "general", "slowquery"],
            cloudwatch_logs_retention=logs.RetentionDays.THREE_MONTHS,
            monitoring_interval=Duration.seconds(30),
            monitoring_role=monitoring_role,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add CloudWatch alarms
        cloudwatch.Alarm(
            self, "AuroraCpuAlarm",
            metric=cluster.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description="Alert when Aurora CPU utilization exceeds 80%"
        )

        cloudwatch.Alarm(
            self, "AuroraConnectionsAlarm",
            metric=cluster.metric_database_connections(),
            threshold=8000,
            evaluation_periods=1,
            alarm_description="Alert when Aurora connections exceed 8000"
        )

        return cluster

    def _create_dynamodb_tables(self) -> Dict[str, dynamodb.Table]:
        """Create DynamoDB tables with GSIs and streams"""
        tables = {}

        # Define table configurations
        table_configs = {
            'tenants': {
                'partition_key': 'tenant_id',
                'sort_key': 'created_at',
                'gsis': [
                    ('ByStatus', 'status', 'tenant_id'),
                    ('ByPlan', 'plan_type', 'tenant_id'),
                    ('ByDomain', 'domain', 'tenant_id'),
                    ('ByOwner', 'owner_id', 'tenant_id')
                ]
            },
            'users': {
                'partition_key': 'user_id',
                'sort_key': 'tenant_id',
                'gsis': [
                    ('ByEmail', 'email', 'user_id'),
                    ('ByTenant', 'tenant_id', 'created_at'),
                    ('ByRole', 'role', 'user_id'),
                    ('ByStatus', 'status', 'last_login')
                ]
            },
            'audit_logs': {
                'partition_key': 'log_id',
                'sort_key': 'timestamp',
                'gsis': [
                    ('ByTenant', 'tenant_id', 'timestamp'),
                    ('ByUser', 'user_id', 'timestamp'),
                    ('ByAction', 'action_type', 'timestamp'),
                    ('BySeverity', 'severity', 'timestamp')
                ]
            }
        }

        for table_name, config in table_configs.items():
            table = dynamodb.Table(
                self, f"Table{table_name.title()}",
                table_name=f"tap-{self.environment_suffix}-{table_name}",
                partition_key=dynamodb.Attribute(
                    name=config['partition_key'],
                    type=dynamodb.AttributeType.STRING
                ),
                sort_key=dynamodb.Attribute(
                    name=config['sort_key'],
                    type=dynamodb.AttributeType.STRING
                ),
                billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
                encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
                encryption_key=self.kms_key,
                point_in_time_recovery=True,
                stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
                removal_policy=RemovalPolicy.DESTROY
            )

            # Add GSIs
            for gsi_name, pk, sk in config['gsis']:
                table.add_global_secondary_index(
                    index_name=gsi_name,
                    partition_key=dynamodb.Attribute(
                        name=pk,
                        type=dynamodb.AttributeType.STRING
                    ),
                    sort_key=dynamodb.Attribute(
                        name=sk,
                        type=dynamodb.AttributeType.STRING
                    )
                )

            # Add tags
            Tags.of(table).add("TableType", table_name)
            Tags.of(table).add("DataClassification", "Sensitive")

            tables[table_name] = table

        return tables

    def _create_redis_cluster(self) -> elasticache.CfnReplicationGroup:
        """Create ElastiCache Redis cluster with cluster mode enabled"""

        # Create Redis authentication token secret
        redis_auth_secret = secretsmanager.Secret(
            self, "RedisAuthToken",
            description="Authentication token for Redis cluster",
            secret_name=f"tap/{self.environment_suffix}/redis/auth-token",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                exclude_punctuation=True,
                password_length=32,
                require_each_included_type=False
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create subnet group
        subnet_group = elasticache.CfnSubnetGroup(
            self, "RedisSubnetGroup",
            description="Subnet group for Redis cluster",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets],
            cache_subnet_group_name=f"tap-{self.environment_suffix}-redis-subnet"
        )

        # Create parameter group for Redis 7.0
        # Note: Only use valid Redis 7 parameters
        parameter_group = elasticache.CfnParameterGroup(
            self, "RedisParameterGroup",
            cache_parameter_group_family="redis7",
            description="Custom parameter group for Redis cluster",
            properties={
                "timeout": "300",
                "tcp-keepalive": "300",
                "maxmemory-policy": "allkeys-lru",
                "notify-keyspace-events": "Ex",
                "maxmemory-samples": "5",
                "cluster-enabled": "yes"
            }
        )

        # Create Redis replication group with cluster mode
        redis_cluster = elasticache.CfnReplicationGroup(
            self, "RedisCluster",
            replication_group_description="TAP Redis cluster for caching",
            replication_group_id=f"tap-{self.environment_suffix}-redis",
            cache_node_type="cache.r6g.4xlarge",
            engine="redis",
            engine_version="7.0",
            num_node_groups=4,
            replicas_per_node_group=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=subnet_group.cache_subnet_group_name,
            cache_parameter_group_name=parameter_group.ref,
            security_group_ids=[self.security_groups['redis'].security_group_id],
            at_rest_encryption_enabled=True,
            kms_key_id=self.kms_key.key_arn,
            transit_encryption_enabled=True,
            auth_token=redis_auth_secret.secret_value.unsafe_unwrap(),
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            preferred_maintenance_window="sun:05:00-sun:07:00",
            notification_topic_arn=None,
            auto_minor_version_upgrade=True,
            tags=[
                {
                    "key": "Name",
                    "value": f"tap-{self.environment_suffix}-redis"
                },
                {
                    "key": "Environment",
                    "value": self.environment_suffix
                }
            ]
        )

        # Set deletion and update policies to handle state transitions gracefully
        redis_cluster.cfn_options.deletion_policy = (
            CfnDeletionPolicy.SNAPSHOT if self.environment_suffix == 'prod'
            else CfnDeletionPolicy.DELETE
        )
        redis_cluster.cfn_options.update_replace_policy = (
            CfnDeletionPolicy.SNAPSHOT if self.environment_suffix == 'prod'
            else CfnDeletionPolicy.DELETE
        )

        redis_cluster.add_dependency(subnet_group)
        redis_cluster.add_dependency(parameter_group)

        # Store secret for later use
        self.redis_auth_secret = redis_auth_secret

        return redis_cluster

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer with SSL termination"""

        # Create ALB
        alb = elbv2.ApplicationLoadBalancer(
            self, "TapAlb",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups['alb'],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            deletion_protection=(self.environment_suffix == 'prod'),
            http2_enabled=True,
            idle_timeout=Duration.seconds(300)
        )

        # Enable access logs (requires S3 bucket setup in production)
        # alb.log_access_logs(bucket=logs_bucket, prefix="alb-logs")

        # Add CloudWatch alarms
        cloudwatch.Alarm(
            self, "AlbTargetResponseTime",
            metric=alb.metrics.target_response_time(),
            threshold=2,
            evaluation_periods=2,
            alarm_description="Alert when ALB target response time exceeds 2 seconds"
        )

        # Note: Unhealthy host count is tracked per target group, not at ALB level
        # We'll add alarms for target groups in _configure_alb_target_groups()

        return alb

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group for EC2 instances"""

        # Create IAM role for EC2 instances
        instance_role = iam.Role(
            self, "Ec2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ],
            inline_policies={
                "TapInstancePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:BatchGetItem",
                                "dynamodb:BatchWriteItem"
                            ],
                            resources=[
                                table.table_arn for table in self.dynamodb_tables.values()
                            ] + [
                                f"{table.table_arn}/index/*" for table in self.dynamodb_tables.values()
                            ]
                        ),
                        iam.PolicyStatement(
                            actions=[
                                "secretsmanager:GetSecretValue",
                                "secretsmanager:DescribeSecret"
                            ],
                            resources=[
                                self.aurora_cluster.secret.secret_arn,
                                self.redis_auth_secret.secret_arn
                            ]
                        ),
                        iam.PolicyStatement(
                            actions=[
                                "elasticache:DescribeCacheClusters",
                                "elasticache:DescribeReplicationGroups"
                            ],
                            resources=[
                                f"arn:aws:elasticache:{self.region}:{self.account}:replicationgroup/{self.redis_cluster.ref}"
                            ]
                        ),
                        iam.PolicyStatement(
                            actions=[
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            resources=[self.kms_key.key_arn]
                        )
                    ]
                )
            }
        )

        # Create launch template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y aws-cli",
            # Install application dependencies - Node.js 20 LTS
            "curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -",
            "yum install -y nodejs",
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF",
            json.dumps({
                "metrics": {
                    "namespace": "TAP/EC2",
                    "metrics_collected": {
                        "mem": {
                            "measurement": [
                                {"name": "mem_used_percent", "rename": "MemoryUtilization"}
                            ],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": [
                                {"name": "used_percent", "rename": "DiskUtilization"}
                            ],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        }
                    }
                }
            }),
            "EOF",
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\",
            "  -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",
            # Application startup (placeholder)
            "echo 'Application deployment would go here'",
        )

        # Create Auto Scaling Group
        # Use SSM parameter for AMI to avoid credential issues during synthesis
        asg = autoscaling.AutoScalingGroup(
            self, "TapAutoScalingGroup",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            instance_type=ec2.InstanceType("m5.4xlarge"),
            machine_image=ec2.MachineImage.generic_linux({
                # Amazon Linux 2 AMI IDs (x86_64) - update with latest as needed
                "eu-west-2": "ami-0b9932f4918a00c4f",      # London
                "eu-central-1": "ami-0084a47cc718c111a",   # Frankfurt
                "ap-southeast-1": "ami-0dc2d3e4c0f9ebd18",  # Singapore
                "us-west-2": "ami-0c2ab3b8efb09f272",      # Oregon
                "us-east-1": "ami-0cff7528ff583bf9a",      # N. Virginia
            }),
            role=instance_role,
            security_group=self.security_groups['ec2'],
            user_data=user_data,
            desired_capacity=15,
            min_capacity=12,
            max_capacity=25,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=2,
                min_instances_in_service=12,
                pause_time=Duration.minutes(5)
            ),
            termination_policies=[
                autoscaling.TerminationPolicy.OLDEST_INSTANCE
            ],
            cooldown=Duration.seconds(300),
            group_metrics=[autoscaling.GroupMetrics.all()],
            notifications=[],  # Add SNS topic for notifications in production
        )

        # Add scaling policies
        asg.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70
        )

        asg.scale_on_metric(
            "RequestCountScaling",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="RequestCountPerTarget",
                dimensions_map={
                    "TargetGroup": f"targetgroup/tap-{self.environment_suffix}-tg/*"
                }
            ),
            scaling_steps=[
                autoscaling.ScalingInterval(change=1, lower=1000),
                autoscaling.ScalingInterval(change=2, lower=2000),
                autoscaling.ScalingInterval(change=3, lower=3000)
            ],
            adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY
        )

        # Tag instances
        Tags.of(asg).add("Name", f"tap-{self.environment_suffix}-instance")
        Tags.of(asg).add("AutoScalingGroup", "TapASG")

        return asg

    def _configure_alb_target_groups(self) -> Dict[str, elbv2.ApplicationTargetGroup]:
        """Configure ALB target groups and listeners with path-based routing"""

        # Create multiple target groups for different services
        target_groups = {}

        # API target group
        target_groups['api'] = elbv2.ApplicationTargetGroup(
            self, "ApiTargetGroup",
            vpc=self.vpc,
            port=8080,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[self.asg],
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(10),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(300),
            stickiness_cookie_duration=Duration.hours(1),
            target_group_name=f"tap-{self.environment_suffix}-api-tg"
        )

        # Admin target group
        target_groups['admin'] = elbv2.ApplicationTargetGroup(
            self, "AdminTargetGroup",
            vpc=self.vpc,
            port=8081,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[self.asg],
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/admin/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(10),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(300),
            target_group_name=f"tap-{self.environment_suffix}-admin-tg"
        )

        # Metrics target group
        target_groups['metrics'] = elbv2.ApplicationTargetGroup(
            self, "MetricsTargetGroup",
            vpc=self.vpc,
            port=8082,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[self.asg],
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/metrics",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(10),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(300),
            target_group_name=f"tap-{self.environment_suffix}-metrics-tg"
        )

        # Create HTTP listener (forward to target groups)
        http_listener = self.alb.add_listener(
            "HttpListener",
            port=80,
            default_target_groups=[target_groups['api']]
        )

        # Add path-based routing rules to HTTP listener
        http_listener.add_target_groups(
            "AdminPath",
            priority=10,
            conditions=[
                elbv2.ListenerCondition.path_patterns(["/admin/*"])
            ],
            target_groups=[target_groups['admin']]
        )

        http_listener.add_target_groups(
            "MetricsPath",
            priority=20,
            conditions=[
                elbv2.ListenerCondition.path_patterns(["/metrics", "/metrics/*"])
            ],
            target_groups=[target_groups['metrics']]
        )

        # Add header-based routing for API versions
        http_listener.add_target_groups(
            "ApiV2",
            priority=30,
            conditions=[
                elbv2.ListenerCondition.http_header(
                    name="X-API-Version",
                    values=["v2"]
                )
            ],
            target_groups=[target_groups['api']]
        )

        # Create HTTPS listener (requires certificate)
        # Note: In production, uncomment and add ACM certificate
        # certificate = acm.Certificate.from_certificate_arn(
        #     self, "Certificate",
        #     certificate_arn="arn:aws:acm:region:account:certificate/xxx"
        # )
        #
        # https_listener = self.alb.add_listener(
        #     "HttpsListener",
        #     port=443,
        #     certificates=[certificate],
        #     default_target_groups=[target_groups['api']],
        #     ssl_policy=elbv2.SslPolicy.TLS13_RES
        # )
        #
        # # Add routing rules for HTTPS listener
        # https_listener.add_target_groups(
        #     "AdminPathHttps",
        #     priority=10,
        #     conditions=[elbv2.ListenerCondition.path_patterns(["/admin/*"])],
        #     target_groups=[target_groups['admin']]
        # )

        return target_groups

    def _create_monitoring_dashboards(self) -> None:
        """Create CloudWatch dashboards for monitoring"""

        dashboard = cloudwatch.Dashboard(
            self, "TapDashboard",
            dashboard_name=f"tap-{self.environment_suffix}-overview",
            period_override=cloudwatch.PeriodOverride.INHERIT
        )

        # Add widgets for different components
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[self.alb.metrics.request_count()],
                right=[self.alb.metrics.target_response_time()]
            ),
            cloudwatch.GraphWidget(
                title="EC2 Auto Scaling",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="CPUUtilization",
                        dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name}
                    ),
                    cloudwatch.Metric(
                        namespace="TAP/EC2",
                        metric_name="MemoryUtilization",
                        dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name}
                    )
                ]
            ),
            cloudwatch.GraphWidget(
                title="Aurora Performance",
                left=[
                    self.aurora_cluster.metric_cpu_utilization(),
                    self.aurora_cluster.metric_database_connections()
                ]
            ),
            cloudwatch.SingleValueWidget(
                title="DynamoDB Consumed Capacity",
                metrics=[
                    table.metric_consumed_read_capacity_units()
                    for table in self.dynamodb_tables.values()
                ]
            )
        )

    def _create_outputs(self) -> None:
        """Create stack outputs for important resource identifiers"""

        # VPC Outputs
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"tap-{self.environment_suffix}-vpc-id"
        )

        CfnOutput(
            self, "VpcCidr",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR block",
            export_name=f"tap-{self.environment_suffix}-vpc-cidr"
        )

        # Subnet Outputs
        CfnOutput(
            self, "PublicSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Public subnet IDs",
            export_name=f"tap-{self.environment_suffix}-public-subnet-ids"
        )

        CfnOutput(
            self, "PrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="Private subnet IDs",
            export_name=f"tap-{self.environment_suffix}-private-subnet-ids"
        )

        CfnOutput(
            self, "IsolatedSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.isolated_subnets]),
            description="Isolated subnet IDs",
            export_name=f"tap-{self.environment_suffix}-isolated-subnet-ids"
        )

        # Security Group Outputs
        CfnOutput(
            self, "AlbSecurityGroupId",
            value=self.security_groups['alb'].security_group_id,
            description="ALB Security Group ID",
            export_name=f"tap-{self.environment_suffix}-alb-sg-id"
        )

        CfnOutput(
            self, "Ec2SecurityGroupId",
            value=self.security_groups['ec2'].security_group_id,
            description="EC2 Security Group ID",
            export_name=f"tap-{self.environment_suffix}-ec2-sg-id"
        )

        CfnOutput(
            self, "DatabaseSecurityGroupId",
            value=self.security_groups['database'].security_group_id,
            description="Database Security Group ID",
            export_name=f"tap-{self.environment_suffix}-db-sg-id"
        )

        CfnOutput(
            self, "RedisSecurityGroupId",
            value=self.security_groups['redis'].security_group_id,
            description="Redis Security Group ID",
            export_name=f"tap-{self.environment_suffix}-redis-sg-id"
        )

        # ALB Outputs
        CfnOutput(
            self, "AlbDnsName",
            value=self.alb.load_balancer_dns_name,
            description="ALB DNS name",
            export_name=f"tap-{self.environment_suffix}-alb-dns"
        )

        CfnOutput(
            self, "AlbArn",
            value=self.alb.load_balancer_arn,
            description="ALB ARN",
            export_name=f"tap-{self.environment_suffix}-alb-arn"
        )

        CfnOutput(
            self, "AlbFullName",
            value=self.alb.load_balancer_full_name,
            description="ALB full name",
            export_name=f"tap-{self.environment_suffix}-alb-full-name"
        )

        # Target Group Outputs
        for tg_name, tg in self.target_groups.items():
            CfnOutput(
                self, f"TargetGroup{tg_name.title()}Arn",
                value=tg.target_group_arn,
                description=f"{tg_name.title()} target group ARN",
                export_name=f"tap-{self.environment_suffix}-tg-{tg_name}-arn"
            )

        # Aurora Outputs
        CfnOutput(
            self, "AuroraClusterEndpoint",
            value=self.aurora_cluster.cluster_endpoint.hostname,
            description="Aurora cluster endpoint",
            export_name=f"tap-{self.environment_suffix}-aurora-endpoint"
        )

        CfnOutput(
            self, "AuroraReaderEndpoint",
            value=self.aurora_cluster.cluster_read_endpoint.hostname,
            description="Aurora reader endpoint",
            export_name=f"tap-{self.environment_suffix}-aurora-reader-endpoint"
        )

        CfnOutput(
            self, "AuroraClusterArn",
            value=self.aurora_cluster.cluster_arn,
            description="Aurora cluster ARN",
            export_name=f"tap-{self.environment_suffix}-aurora-arn"
        )

        CfnOutput(
            self, "AuroraSecretArn",
            value=self.aurora_cluster.secret.secret_arn,
            description="Aurora master credentials secret ARN",
            export_name=f"tap-{self.environment_suffix}-aurora-secret-arn"
        )

        CfnOutput(
            self, "AuroraClusterIdentifier",
            value=self.aurora_cluster.cluster_identifier,
            description="Aurora cluster identifier",
            export_name=f"tap-{self.environment_suffix}-aurora-id"
        )

        # Redis Outputs
        CfnOutput(
            self, "RedisClusterId",
            value=self.redis_cluster.ref,
            description="Redis cluster ID",
            export_name=f"tap-{self.environment_suffix}-redis-id"
        )

        CfnOutput(
            self, "RedisConfigurationEndpoint",
            value=self.redis_cluster.attr_configuration_end_point_address,
            description="Redis configuration endpoint address",
            export_name=f"tap-{self.environment_suffix}-redis-config-endpoint"
        )

        CfnOutput(
            self, "RedisConfigurationEndpointPort",
            value=self.redis_cluster.attr_configuration_end_point_port,
            description="Redis configuration endpoint port",
            export_name=f"tap-{self.environment_suffix}-redis-config-port"
        )

        CfnOutput(
            self, "RedisAuthSecretArn",
            value=self.redis_auth_secret.secret_arn,
            description="Redis authentication token secret ARN",
            export_name=f"tap-{self.environment_suffix}-redis-auth-secret-arn"
        )

        # DynamoDB Outputs
        for name, table in self.dynamodb_tables.items():
            # Replace underscores with hyphens for export names
            export_name_safe = name.replace('_', '-')

            CfnOutput(
                self, f"DynamoTable{name.title()}Name",
                value=table.table_name,
                description=f"DynamoDB {name} table name",
                export_name=f"tap-{self.environment_suffix}-ddb-{export_name_safe}-name"
            )

            CfnOutput(
                self, f"DynamoTable{name.title()}Arn",
                value=table.table_arn,
                description=f"DynamoDB {name} table ARN",
                export_name=f"tap-{self.environment_suffix}-ddb-{export_name_safe}-arn"
            )

            CfnOutput(
                self, f"DynamoTable{name.title()}StreamArn",
                value=table.table_stream_arn,
                description=f"DynamoDB {name} table stream ARN",
                export_name=f"tap-{self.environment_suffix}-ddb-{export_name_safe}-stream-arn"
            )

        # KMS Outputs
        CfnOutput(
            self, "KmsKeyArn",
            value=self.kms_key.key_arn,
            description="KMS key ARN for encryption",
            export_name=f"tap-{self.environment_suffix}-kms-arn"
        )

        CfnOutput(
            self, "KmsKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID",
            export_name=f"tap-{self.environment_suffix}-kms-id"
        )

        # Auto Scaling Group Outputs
        CfnOutput(
            self, "AutoScalingGroupName",
            value=self.asg.auto_scaling_group_name,
            description="Auto Scaling Group name",
            export_name=f"tap-{self.environment_suffix}-asg-name"
        )

        CfnOutput(
            self, "AutoScalingGroupArn",
            value=self.asg.auto_scaling_group_arn,
            description="Auto Scaling Group ARN",
            export_name=f"tap-{self.environment_suffix}-asg-arn"
        )

        # IAM Role Outputs
        CfnOutput(
            self, "Ec2InstanceRoleArn",
            value=self.asg.role.role_arn,
            description="EC2 instance IAM role ARN",
            export_name=f"tap-{self.environment_suffix}-ec2-role-arn"
        )

        # CloudWatch Dashboard Output
        CfnOutput(
            self, "DashboardName",
            value=f"tap-{self.environment_suffix}-overview",
            description="CloudWatch Dashboard name",
            export_name=f"tap-{self.environment_suffix}-dashboard-name"
        )

        # Region Output
        CfnOutput(
            self, "StackRegion",
            value=self.region,
            description="Stack deployment region",
            export_name=f"tap-{self.environment_suffix}-region"
        )

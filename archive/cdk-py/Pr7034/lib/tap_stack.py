"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.

Also includes the TradingAnalyticsPlatformStack for high-frequency trading infrastructure.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import CfnOutput, Duration, RemovalPolicy
from aws_cdk import aws_autoscaling as autoscaling
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_dax as dax
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_elasticache as elasticache
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_logs as logs
from aws_cdk import aws_rds as rds
from aws_cdk import aws_xray as xray
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # KMS key for encryption at rest
        self.kms_key = kms.Key(
            self, "TAPEncryptionKey",
            description="Trading Analytics Platform master encryption key",
            enable_key_rotation=True,
            pending_window=Duration.days(7),
            removal_policy=RemovalPolicy.DESTROY,
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        sid="Enable IAM User Permissions",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AccountRootPrincipal()],
                        actions=["kms:*"],
                        resources=["*"],
                    ),
                    iam.PolicyStatement(
                        sid="Allow EC2 service for EBS encryption",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.ServicePrincipal("ec2.amazonaws.com")],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:CreateGrant",
                            "kms:RetireGrant",
                        ],
                        resources=["*"],
                        conditions={
                            "StringEquals": {
                                "kms:ViaService": f"ec2.{self.region}.amazonaws.com"
                            }
                        }
                    ),
                    iam.PolicyStatement(
                        sid="Allow RDS service for database encryption",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.ServicePrincipal("rds.amazonaws.com")],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:CreateGrant",
                            "kms:RetireGrant",
                        ],
                        resources=["*"],
                        conditions={
                            "StringEquals": {
                                "kms:ViaService": f"rds.{self.region}.amazonaws.com"
                            }
                        }
                    ),
                    iam.PolicyStatement(
                        sid="Allow ElastiCache service for Redis encryption",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.ServicePrincipal("elasticache.amazonaws.com")],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:CreateGrant",
                            "kms:RetireGrant",
                        ],
                        resources=["*"],
                        conditions={
                            "StringEquals": {
                                "kms:ViaService": f"elasticache.{self.region}.amazonaws.com"
                            }
                        }
                    ),
                    iam.PolicyStatement(
                        sid="Allow DynamoDB service for table encryption",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.ServicePrincipal("dynamodb.amazonaws.com")],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:CreateGrant",
                            "kms:RetireGrant",
                        ],
                        resources=["*"],
                        conditions={
                            "StringEquals": {
                                "kms:ViaService": f"dynamodb.{self.region}.amazonaws.com"
                            }
                        }
                    ),
                ]
            ),
        )

        # Create dedicated VPC for trading platform
        self.vpc = self._create_trading_vpc()

        # Deploy Aurora PostgreSQL cluster
        self.aurora_cluster = self._create_aurora_cluster()

        # Setup EC2 Auto Scaling Group with placement groups
        self.asg = self._create_compute_cluster()

        # Allow compute instances to connect to Aurora
        self.aurora_cluster.connections.allow_from(
            self.asg.connections,
            ec2.Port.tcp(5432),
            "Allow compute instances to connect to Aurora PostgreSQL"
        )

        # Deploy ElastiCache Redis cluster-mode
        self.redis_cluster = self._create_redis_cluster()

        # Create DynamoDB tables with DAX
        self.dynamo_tables = self._create_dynamodb_infrastructure()

        # Setup monitoring and observability
        self._setup_observability()

        # Output critical endpoints
        self._generate_outputs()

    def _create_trading_vpc(self) -> ec2.Vpc:
        """Create multi-AZ VPC with optimal network configuration"""

        vpc = ec2.Vpc(
            self, "TradingVPC",
            max_azs=3,
            cidr="10.0.0.0/16",
            nat_gateways=3,  # One per AZ for redundancy
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
                    cidr_mask=22,
                ),
                ec2.SubnetConfiguration(
                    name="Database",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_support=True,
            enable_dns_hostnames=True,
        )

        # Simulate Direct Connect with Site-to-Site VPN
        vpn_gateway = ec2.CfnVPNGateway(
            self, "TradingVPNGateway",
            type="ipsec.1",
            amazon_side_asn=65000,
        )

        ec2.CfnVPCGatewayAttachment(
            self, "VPNGatewayAttachment",
            vpc_id=vpc.vpc_id,
            vpn_gateway_id=vpn_gateway.ref,
        )

        # Enable VPC Flow Logs for security and compliance
        vpc.add_flow_log(
            "TradingVPCFlowLogs",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group=logs.LogGroup(
                    self, "VPCFlowLogGroup",
                    retention=logs.RetentionDays.THREE_MONTHS,
                    removal_policy=RemovalPolicy.DESTROY,
                )
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        return vpc

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        """Deploy Aurora PostgreSQL cluster for trading data"""

        # Aurora subnet group
        db_subnet_group = rds.SubnetGroup(
            self, "AuroraSubnetGroup",
            description="Trading Aurora DB subnet group",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
        )

        # Parameter group for performance optimization
        param_group = rds.ParameterGroup(
            self, "AuroraParamGroup",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            description="Optimized for high-frequency trading workloads",
            parameters={
                "shared_preload_libraries": "pg_stat_statements",
                "log_statement": "ddl",
                "log_connections": "1",
                "log_disconnections": "1",
            },
        )

        cluster = rds.DatabaseCluster(
            self, "TradingAuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            default_database_name="trading",
            credentials=rds.Credentials.from_generated_secret(
                "tradingadmin",
                secret_name=f"tap/aurora/master-{self.environment_suffix}",
            ),
            writer=rds.ClusterInstance.provisioned(
                "Writer",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.R6G,
                    ec2.InstanceSize.XLARGE8
                ),
                enable_performance_insights=True,
                performance_insight_retention=rds.PerformanceInsightRetention.MONTHS_3,
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    f"Reader{i}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.R6G,
                        ec2.InstanceSize.XLARGE8
                    ),
                    enable_performance_insights=True,
                    performance_insight_retention=rds.PerformanceInsightRetention.MONTHS_3,
                )
                for i in range(1, 5)
            ],
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group=db_subnet_group,
            parameter_group=param_group,
            backup=rds.BackupProps(
                retention=Duration.days(35),
                preferred_window="03:00-04:00",
            ),
            preferred_maintenance_window="sun:04:00-sun:05:00",
            deletion_protection=False,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.THREE_MONTHS,
            iam_authentication=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # CloudWatch alarm for connection count
        cloudwatch.Alarm(
            self, "AuroraConnectionAlarm",
            metric=cluster.metric_database_connections(),
            threshold=4000,
            evaluation_periods=2,
            datapoints_to_alarm=2,
        )

        return cluster

    def _create_compute_cluster(self) -> autoscaling.AutoScalingGroup:
        """Create EC2 Auto Scaling Group with placement groups"""

        # Create placement group for low latency
        placement_group = ec2.CfnPlacementGroup(
            self, "TradingPlacementGroup",
            strategy="cluster",
            # Note: group_name removed to avoid conflicts on redeployment
        )

        # Security group for compute instances
        compute_sg = ec2.SecurityGroup(
            self, "ComputeSecurityGroup",
            vpc=self.vpc,
            description="Trading compute cluster security group",
            allow_all_outbound=True,
        )

        # Allow internal communication
        compute_sg.add_ingress_rule(
            peer=compute_sg,
            connection=ec2.Port.all_traffic(),
            description="Allow internal cluster communication",
        )

        # Launch template with enhanced networking
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y aws-xray-daemon",
            # Install trading software dependencies
            "amazon-linux-extras install epel -y",
            "yum install -y python3 python3-pip",
            "pip3 install boto3 psycopg2-binary redis pymongo",
            # Configure X-Ray
            (
                "curl https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/"
                "xray-daemon/aws-xray-daemon-linux-3.x.zip -o /tmp/xray.zip"
            ),
            "unzip /tmp/xray.zip -d /tmp/",
            "sudo cp /tmp/xray /usr/bin/xray",
            "sudo chmod +x /usr/bin/xray",
            # Start X-Ray daemon with dynamic region
            f"xray -o -n ${{AWS_REGION:-{self.region}}} &",
            # Configure CloudWatch agent
            'cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/config.json',
            '{',
            '  "metrics": {',
            '    "namespace": "TradingPlatform",',
            '    "metrics_collected": {',
            (
                '      "cpu": {"measurement": [{"name": "cpu_usage_idle", '
                '"rename": "CPU_IDLE", "unit": "Percent"}], '
                '"metrics_collection_interval": 60},'
            ),
            (
                '      "disk": {"measurement": [{"name": "used_percent", '
                '"rename": "DISK_USED", "unit": "Percent"}], '
                '"metrics_collection_interval": 60, "resources": ["*"]},'
            ),
            (
                '      "mem": {"measurement": [{"name": "mem_used_percent", '
                '"rename": "MEM_USED", "unit": "Percent"}], '
                '"metrics_collection_interval": 60},'
            ),
            (
                '      "net": {"measurement": [{"name": "bytes_sent", '
                '"rename": "NET_SENT", "unit": "Bytes"}, '
                '{"name": "bytes_recv", "rename": "NET_RECV", "unit": "Bytes"}], '
                '"metrics_collection_interval": 60}'
            ),
            '    }',
            '  }',
            '}',
            'EOF',
            (
                "/opt/aws/amazon-cloudwatch-agent/bin/"
                "amazon-cloudwatch-agent-ctl -a start -c file:/opt/aws/"
                "amazon-cloudwatch-agent/etc/config.json"
            ),
        )

        # Create launch template
        launch_template = ec2.LaunchTemplate(
            self, "TradingLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.C6I,
                ec2.InstanceSize.XLARGE8
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            user_data=user_data,
            security_group=compute_sg,
            role=iam.Role(
                self, "ComputeInstanceRole",
                assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                    iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),  # Required for SSM connectivity
                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),  # Required for DynamoDB operations
                ],
            ),
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=500,
                        volume_type=ec2.EbsDeviceVolumeType.IO2,
                        iops=10000,
                        encrypted=True,
                        # Use default AWS managed key for EBS instead of custom key
                        delete_on_termination=True,
                    ),
                ),
            ],
            nitro_enclave_enabled=True,
            require_imdsv2=True,
        )

        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "TradingASG",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT
            ),
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=1,
            desired_capacity=1,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(10)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=1,
                min_instances_in_service=0,  # Must be 0 when max_capacity=1 to allow rolling updates
                pause_time=Duration.minutes(5),
            ),
        )

        # Add placement group configuration
        cfn_asg = asg.node.default_child
        cfn_asg.placement_group = placement_group.ref

        # Configure scaling policies
        asg.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70,
            cooldown=Duration.minutes(5),
            disable_scale_in=False,
        )

        # Custom metric scaling for trading volume
        trading_volume_metric = cloudwatch.Metric(
            namespace="TradingPlatform",
            metric_name="TradingVolume",
            statistic="Average",
        )

        asg.scale_on_metric(
            "TradingVolumeScaling",
            metric=trading_volume_metric,
            scaling_steps=[
                autoscaling.ScalingInterval(change=2, lower=1000, upper=5000),
                autoscaling.ScalingInterval(change=5, lower=5000, upper=10000),
                autoscaling.ScalingInterval(change=10, lower=10000),
            ],
            adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        )

        return asg

    def _create_redis_cluster(self) -> elasticache.CfnReplicationGroup:
        """Deploy ElastiCache Redis with cluster mode enabled"""

        # Redis subnet group
        redis_subnet_group = elasticache.CfnSubnetGroup(
            self, "RedisSubnetGroup",
            description="Trading Redis cluster subnet group",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets],
        )

        # Security group for Redis
        redis_sg = ec2.SecurityGroup(
            self, "RedisSecurityGroup",
            vpc=self.vpc,
            description="ElastiCache Redis security group",
            allow_all_outbound=True,
        )

        # Allow inbound from VPC on port 6379
        redis_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(6379),
            description="Allow Redis access from VPC",
        )

        # Parameter group for optimization (cluster mode enabled)
        redis_param_group = elasticache.CfnParameterGroup(
            self, "RedisParamGroup",
            cache_parameter_group_family="redis7",
            description="Optimized for trading workloads",
            properties={
                "cluster-enabled": "yes",
                "maxmemory-policy": "allkeys-lru",
                "timeout": "300",
                "tcp-keepalive": "60",
                "slowlog-log-slower-than": "10000",
                "slowlog-max-len": "512",
                "notify-keyspace-events": "Ex",
            },
        )

        redis_cluster = elasticache.CfnReplicationGroup(
            self, "TradingRedisCluster",
            replication_group_description="High-performance Redis cluster for trading cache",
            cache_node_type="cache.r6g.8xlarge",
            engine="redis",
            engine_version="7.0",
            num_node_groups=15,  # Original: 15 shards
            replicas_per_node_group=2,  # Original: 2 replicas per shard
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_parameter_group_name=redis_param_group.ref,
            cache_subnet_group_name=redis_subnet_group.ref,
            security_group_ids=[redis_sg.security_group_id],
            at_rest_encryption_enabled=True,  # Re-enable encryption
            transit_encryption_enabled=True,  # Re-enable encryption
            snapshot_retention_limit=7,
            snapshot_window="03:00-05:00",
            preferred_maintenance_window="sun:05:00-sun:07:00",
            notification_topic_arn=None,  # Add SNS topic if needed
            auto_minor_version_upgrade=False,
            # data_tiering_enabled requires r6gd instance types
            log_delivery_configurations=[
                {
                    "destinationType": "cloudwatch-logs",
                    "destinationDetails": {
                        "cloudWatchLogsDetails": {
                            "logGroup": logs.LogGroup(
                                self, "RedisSlowLog",
                                log_group_name=f"/aws/elasticache/tap-redis-slow-{self.environment_suffix}",
                                retention=logs.RetentionDays.ONE_MONTH,
                                removal_policy=RemovalPolicy.DESTROY,
                            ).log_group_name
                        }
                    },
                    "logFormat": "json",
                    "logType": "slow-log",
                },
            ],
            tags=[
                {"key": "Environment", "value": "Production"},
                {"key": "Platform", "value": "Trading"},
                {"key": "CostCenter", "value": "TradingOps"},
            ],
        )

        return redis_cluster

    def _create_dynamodb_infrastructure(self) -> dict:
        """Create DynamoDB tables with DAX acceleration"""

        tables = {}

        # Common table properties
        common_props = {
            "billing_mode": dynamodb.BillingMode.PROVISIONED,
            "read_capacity": 5000,
            "write_capacity": 5000,
            "removal_policy": RemovalPolicy.DESTROY,
            "encryption": dynamodb.TableEncryption.CUSTOMER_MANAGED,
            "encryption_key": self.kms_key,
            "point_in_time_recovery": True,
            "stream": dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            "contributor_insights_enabled": True,
        }

        # Trades table
        tables["trades"] = dynamodb.Table(
            self, "TradesTable",
            table_name=f"tap-trades-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="trade_id",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER,
            ),
            **common_props,
        )

        # Add GSIs to trades table
        tables["trades"].add_global_secondary_index(
            index_name="symbol-timestamp-index",
            partition_key=dynamodb.Attribute(name="symbol", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.NUMBER),
            read_capacity=2000,
            write_capacity=1000,
        )

        tables["trades"].add_global_secondary_index(
            index_name="account-timestamp-index",
            partition_key=dynamodb.Attribute(name="account_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.NUMBER),
            read_capacity=2000,
            write_capacity=1000,
        )

        tables["trades"].add_global_secondary_index(
            index_name="status-timestamp-index",
            partition_key=dynamodb.Attribute(name="status", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="timestamp", type=dynamodb.AttributeType.NUMBER),
            read_capacity=1000,
            write_capacity=500,
        )

        # Orders table
        tables["orders"] = dynamodb.Table(
            self, "OrdersTable",
            table_name=f"tap-orders-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="order_id",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.NUMBER,
            ),
            **common_props,
        )

        # Add GSIs to orders table
        tables["orders"].add_global_secondary_index(
            index_name="symbol-created-index",
            partition_key=dynamodb.Attribute(name="symbol", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="created_at", type=dynamodb.AttributeType.NUMBER),
            read_capacity=2000,
            write_capacity=1000,
        )

        tables["orders"].add_global_secondary_index(
            index_name="account-status-index",
            partition_key=dynamodb.Attribute(name="account_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="order_status", type=dynamodb.AttributeType.STRING),
            read_capacity=2000,
            write_capacity=1000,
        )

        tables["orders"].add_global_secondary_index(
            index_name="type-created-index",
            partition_key=dynamodb.Attribute(name="order_type", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="created_at", type=dynamodb.AttributeType.NUMBER),
            read_capacity=1000,
            write_capacity=500,
        )

        # Positions table
        tables["positions"] = dynamodb.Table(
            self, "PositionsTable",
            table_name=f"tap-positions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="account_id",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="symbol",
                type=dynamodb.AttributeType.STRING,
            ),
            **common_props,
        )

        # Add GSIs to positions table
        tables["positions"].add_global_secondary_index(
            index_name="symbol-value-index",
            partition_key=dynamodb.Attribute(name="symbol", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="market_value", type=dynamodb.AttributeType.NUMBER),
            read_capacity=2000,
            write_capacity=1000,
        )

        tables["positions"].add_global_secondary_index(
            index_name="pnl-index",
            partition_key=dynamodb.Attribute(name="account_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="unrealized_pnl", type=dynamodb.AttributeType.NUMBER),
            read_capacity=1500,
            write_capacity=750,
        )

        tables["positions"].add_global_secondary_index(
            index_name="updated-index",
            partition_key=dynamodb.Attribute(name="symbol", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="last_updated", type=dynamodb.AttributeType.NUMBER),
            read_capacity=1000,
            write_capacity=500,
        )

        # Create DAX cluster
        dax_subnet_group = dax.CfnSubnetGroup(
            self, "DaxSubnetGroup",
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.private_subnets],
            description="DAX cluster subnet group",
        )

        # Security group for DAX
        dax_sg = ec2.SecurityGroup(
            self, "DaxSecurityGroup",
            vpc=self.vpc,
            description="DAX cluster security group",
            allow_all_outbound=True,
        )

        # Allow inbound from VPC on port 8111
        dax_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(8111),
            description="Allow DAX access from VPC",
        )

        dax_role = iam.Role(
            self, "DaxRole",
            assumed_by=iam.ServicePrincipal("dax.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonDynamoDBFullAccess"),
            ],
        )

        dax_param_group = dax.CfnParameterGroup(
            self, "DaxParamGroup",
            parameter_group_name=f"tap-dax-params-{self.environment_suffix}",
            description="Optimized DAX parameters for trading",
            parameter_name_values={
                "query-ttl-millis": "600000",  # 10 minutes
                "record-ttl-millis": "300000",  # 5 minutes
            },
        )

        dax_cluster = dax.CfnCluster(
            self, "TradingDaxCluster",
            cluster_name=f"tap-dax-{self.environment_suffix}",
            description="DAX cluster for ultra-low latency DynamoDB access",
            iam_role_arn=dax_role.role_arn,
            node_type="dax.r4.8xlarge",
            replication_factor=6,  # 6 nodes as requested
            subnet_group_name=dax_subnet_group.ref,
            security_group_ids=[dax_sg.security_group_id],
            parameter_group_name=dax_param_group.ref,
            sse_specification={"SSEEnabled": True},
            cluster_endpoint_encryption_type="TLS",
            tags={
                "Environment": "Production",
                "Platform": "Trading",
            },
        )

        tables["dax_cluster"] = dax_cluster

        # Auto-scaling for DynamoDB tables
        for table_name, table in tables.items():
            if table_name != "dax_cluster":
                # Read capacity auto-scaling
                read_scaling = table.auto_scale_read_capacity(
                    min_capacity=1000,
                    max_capacity=10000,
                )
                read_scaling.scale_on_utilization(
                    target_utilization_percent=70,
                    scale_in_cooldown=Duration.minutes(5),
                    scale_out_cooldown=Duration.minutes(1),
                )

                # Write capacity auto-scaling
                write_scaling = table.auto_scale_write_capacity(
                    min_capacity=1000,
                    max_capacity=10000,
                )
                write_scaling.scale_on_utilization(
                    target_utilization_percent=70,
                    scale_in_cooldown=Duration.minutes(5),
                    scale_out_cooldown=Duration.minutes(1),
                )

        return tables

    def _setup_observability(self) -> None:
        """Configure comprehensive monitoring and observability"""

        # Create CloudWatch dashboard
        dashboard = cloudwatch.Dashboard(
            self, "TradingDashboard",
            dashboard_name=f"TAP-Trading-Metrics-{self.environment_suffix}",
            period_override=cloudwatch.PeriodOverride.AUTO,
        )

        # Add widgets for Aurora metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Aurora Performance",
                left=[
                    self.aurora_cluster.metric_cpu_utilization(),
                    self.aurora_cluster.metric_database_connections(),
                ],
                right=[
                    self.aurora_cluster.metric("ReadLatency"),
                    self.aurora_cluster.metric("WriteLatency"),
                ],
                period=Duration.minutes(1),
            ),
            cloudwatch.GraphWidget(
                title="Aurora IOPS",
                left=[
                    self.aurora_cluster.metric("ReadIOPS"),
                    self.aurora_cluster.metric("WriteIOPS"),
                ],
                period=Duration.minutes(1),
            ),
        )

        # Add widgets for EC2 ASG metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Compute Cluster Performance",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="CPUUtilization",
                        dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name},
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="NetworkIn",
                        dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name},
                    ),
                ],
                right=[
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="NetworkOut",
                        dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name},
                    ),
                ],
                period=Duration.minutes(1),
            ),
        )

        # Create Log Insights query for order latency
        order_latency_query = logs.QueryDefinition(
            self, "OrderLatencyQuery",
            query_definition_name=f"TAP-Order-Latency-Analysis-{self.environment_suffix}",
            query_string=logs.QueryString(
                fields=["@timestamp", "latency", "order_id", "symbol", "order_type"],
                filter_statements=["@message like /ORDER_EXECUTED/"],
                stats="avg(latency) as avg_latency, percentile(latency, 50) as p50, percentile(latency, 95) as p95, percentile(latency, 99) as p99, max(latency) as max_latency, count() as order_count by bin(@timestamp, 1m)",
            ),
        )

        # X-Ray service map configuration
        xray_service_map = {
            "version": 1,
            "default": {
                "fixed_target": 10,
                "rate": 0.1,
            },
            "rules": [
                {
                    "description": "Trading critical path",
                    "service_name": "TradingEngine",
                    "http_method": "*",
                    "url_path": "/api/v1/orders/*",
                    "fixed_target": 20,
                    "rate": 0.2,
                },
            ],
        }

        # Create X-Ray sampling rule
        xray.CfnSamplingRule(
            self, "TradingSamplingRule",
            sampling_rule=xray.CfnSamplingRule.SamplingRuleProperty(
                rule_name=f"TradingCriticalPath-{self.environment_suffix}",
                priority=1,
                reservoir_size=20,
                fixed_rate=0.2,
                service_name="TradingEngine",
                service_type="*",
                host="*",
                http_method="*",
                url_path="/api/v1/orders/*",
                resource_arn="*",
                version=1,
            )
        )

        # Create composite alarms for SLA monitoring
        sla_alarm = cloudwatch.CompositeAlarm(
            self, "TradingSLAAlarm",
            composite_alarm_name=f"TAP-SLA-Breach-{self.environment_suffix}",
            alarm_description="Trading platform SLA breach detected",
            alarm_rule=cloudwatch.AlarmRule.any_of(
                cloudwatch.Alarm(
                    self, "HighLatencyAlarm",
                    metric=cloudwatch.Metric(
                        namespace="TradingPlatform",
                        metric_name="OrderLatencyP95",
                        statistic="Maximum",
                    ),
                    threshold=10,  # 10ms threshold
                    evaluation_periods=2,
                    datapoints_to_alarm=2,
                ),
                cloudwatch.Alarm(
                    self, "HighErrorRateAlarm",
                    metric=cloudwatch.Metric(
                        namespace="TradingPlatform",
                        metric_name="OrderErrorRate",
                        statistic="Average",
                    ),
                    threshold=1,  # 1% error rate
                    evaluation_periods=2,
                    datapoints_to_alarm=2,
                ),
            ),
        )

    def _generate_outputs(self) -> None:
        """Generate stack outputs for reference"""

        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="Trading VPC ID",
            export_name=f"TAP-VPC-ID-{self.environment_suffix}",
        )

        CfnOutput(
            self, "AuroraClusterEndpoint",
            value=self.aurora_cluster.cluster_endpoint.hostname,
            description="Aurora cluster writer endpoint",
            export_name=f"TAP-Aurora-Writer-{self.environment_suffix}",
        )

        CfnOutput(
            self, "AuroraReaderEndpoint",
            value=self.aurora_cluster.cluster_read_endpoint.hostname,
            description="Aurora cluster reader endpoint",
            export_name=f"TAP-Aurora-Reader-{self.environment_suffix}",
        )

        CfnOutput(
            self, "RedisClusterEndpoint",
            value=self.redis_cluster.attr_configuration_end_point_address,
            description="Redis cluster configuration endpoint",
            export_name=f"TAP-Redis-Endpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self, "DaxClusterEndpoint",
            value=self.dynamo_tables["dax_cluster"].attr_cluster_discovery_endpoint_url,
            description="DAX cluster endpoint",
            export_name=f"TAP-DAX-Endpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self, "ASGName",
            value=self.asg.auto_scaling_group_name,
            description="Trading compute ASG name",
            export_name=f"TAP-ASG-Name-{self.environment_suffix}",
        )

        # DynamoDB Table Names
        CfnOutput(
            self, "TradesTableName",
            value=self.dynamo_tables["trades"].table_name,
            description="DynamoDB Trades table name",
            export_name=f"TAP-Trades-Table-{self.environment_suffix}",
        )

        CfnOutput(
            self, "OrdersTableName",
            value=self.dynamo_tables["orders"].table_name,
            description="DynamoDB Orders table name",
            export_name=f"TAP-Orders-Table-{self.environment_suffix}",
        )

        CfnOutput(
            self, "PositionsTableName",
            value=self.dynamo_tables["positions"].table_name,
            description="DynamoDB Positions table name",
            export_name=f"TAP-Positions-Table-{self.environment_suffix}",
        )

        # Aurora Database Name
        CfnOutput(
            self, "AuroraDBName",
            value="tradingdb",
            description="Aurora database name",
            export_name=f"TAP-Aurora-DBName-{self.environment_suffix}",
        )

        # Aurora Port
        CfnOutput(
            self, "AuroraPort",
            value="5432",
            description="Aurora database port",
            export_name=f"TAP-Aurora-Port-{self.environment_suffix}",
        )

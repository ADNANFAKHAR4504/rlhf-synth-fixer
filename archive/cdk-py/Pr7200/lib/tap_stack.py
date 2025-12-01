"""tap_stack.py
This module defines the TapStack class for the TAP (Transaction Processing) project.
Production-ready stack for transaction processing platform with multi-region support.
"""

from typing import List, Optional

from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_autoscaling as autoscaling
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_elasticache as elasticache
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_rds as rds
from constructs import Construct


class TapStackProps:
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        env: CDK Environment configuration (account, region)

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        env: CDK Environment configuration
    """

    def __init__(self, environment_suffix: Optional[str] = None, env=None):
        self.environment_suffix = environment_suffix
        self.env = env


class TapStack(Stack):
    """
    Production-ready stack for transaction processing platform.
    Designed for multi-region deployment with comprehensive monitoring.
    All resources configured with RemovalPolicy.DESTROY for complete cleanup.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming.
        vpc (ec2.Vpc): VPC infrastructure
        database (rds.DatabaseInstance): RDS PostgreSQL primary instance
        redis (elasticache.CfnReplicationGroup): Redis cluster
        compute_tier (dict): Compute resources (ASG, NLB, etc.)
        lambda_functions (List): Lambda function list
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ) -> None:
        # Extract env from props if provided, otherwise use from kwargs
        if props and props.env and 'env' not in kwargs:
            kwargs['env'] = props.env

        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props and props.environment_suffix else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create VPC infrastructure
        self.vpc = self._create_vpc()

        # Create security groups
        self.security_groups = self._create_security_groups()

        # Create VPC endpoints for AWS services
        self._create_vpc_endpoints()

        # Create RDS PostgreSQL cluster
        self.database = self._create_rds_cluster()

        # Create ElastiCache Redis cluster
        self.redis = self._create_redis_cluster()

        # Create compute tier with Auto Scaling
        self.compute_tier = self._create_compute_tier()

        # Create Lambda functions for order workflows
        self.lambda_functions = self._create_lambda_functions()

        # Create CloudWatch dashboards and alarms
        self._create_monitoring()

        # Output important resource identifiers
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with 3 AZs, private subnets, and NAT gateways."""
        vpc = ec2.Vpc(
            self, "TapVpc",
            max_azs=3,
            cidr="10.0.0.0/16",
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private-App",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private-Data",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT,
                    cidr_mask=24
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Add VPC flow logs with complete cleanup
        vpc.add_flow_log(
            "VpcFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group=logs.LogGroup(
                    self, "VpcFlowLogGroup",
                    retention=logs.RetentionDays.ONE_MONTH,
                    removal_policy=RemovalPolicy.DESTROY
                )
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        return vpc

    def _create_security_groups(self) -> dict:
        """Create security groups with least-privilege access patterns."""
        sgs = {}

        # Database security group
        sgs['database'] = ec2.SecurityGroup(
            self, "DatabaseSG",
            vpc=self.vpc,
            description="Security group for RDS PostgreSQL",
            allow_all_outbound=False
        )

        # Redis security group
        sgs['redis'] = ec2.SecurityGroup(
            self, "RedisSG",
            vpc=self.vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False
        )

        # Compute tier security group
        sgs['compute'] = ec2.SecurityGroup(
            self, "ComputeSG",
            vpc=self.vpc,
            description="Security group for EC2 compute instances",
            allow_all_outbound=True
        )

        # Lambda security group
        sgs['lambda'] = ec2.SecurityGroup(
            self, "LambdaSG",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        # NLB security group
        sgs['nlb'] = ec2.SecurityGroup(
            self, "NlbSG",
            vpc=self.vpc,
            description="Security group for Network Load Balancer",
            allow_all_outbound=False
        )

        # Configure security group rules
        # Database accepts connections from compute and lambda
        sgs['database'].add_ingress_rule(
            peer=sgs['compute'],
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from compute tier"
        )
        sgs['database'].add_ingress_rule(
            peer=sgs['lambda'],
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from Lambda functions"
        )

        # Redis accepts connections from compute and lambda
        sgs['redis'].add_ingress_rule(
            peer=sgs['compute'],
            connection=ec2.Port.tcp(6379),
            description="Allow Redis from compute tier"
        )
        sgs['redis'].add_ingress_rule(
            peer=sgs['lambda'],
            connection=ec2.Port.tcp(6379),
            description="Allow Redis from Lambda functions"
        )

        # Compute accepts connections from NLB
        sgs['compute'].add_ingress_rule(
            peer=sgs['nlb'],
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from NLB"
        )

        # NLB accepts external traffic
        sgs['nlb'].add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from internet"
        )

        return sgs

    def _create_vpc_endpoints(self):
        """Create VPC endpoints for DynamoDB and S3."""
        # DynamoDB endpoint
        self.dynamodb_endpoint = self.vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT
            )]
        )

        # S3 endpoint
        self.s3_endpoint = self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_NAT
            )]
        )

    def _create_rds_cluster(self) -> rds.DatabaseInstance:
        """Create Multi-AZ RDS PostgreSQL with read replica."""
        # Create parameter group
        parameter_group = rds.ParameterGroup(
            self, "PostgresParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            parameters={
                "shared_preload_libraries": "pg_stat_statements",
                "log_statement": "all",
                "log_min_duration_statement": "1000",  # Log queries taking > 1 second
                "max_connections": "500",
                "random_page_cost": "1.1",
                "effective_cache_size": "5898240"  # 45GB in 8kB pages
            }
        )

        # Create subnet group for private data subnets
        subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS instances",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_group_name="Private-Data"
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create primary instance with full cleanup
        primary = rds.DatabaseInstance(
            self, "PostgresPrimary",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_16
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.R6G,
                ec2.InstanceSize.XLARGE2
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_group_name="Private-Data"
            ),
            multi_az=True,
            allocated_storage=1000,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret(
                "postgres",
                secret_name=f"tap/{self.region}/rds/master-{self.environment_suffix}"
            ),
            parameter_group=parameter_group,
            subnet_group=subnet_group,
            security_groups=[self.security_groups['database']],
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            deletion_protection=False,  # Allow deletion for cleanup
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            cloudwatch_logs_exports=["postgresql"],
            auto_minor_version_upgrade=False,
            removal_policy=RemovalPolicy.DESTROY  # Complete cleanup
        )

        # Create read replica with cleanup
        self.read_replica = rds.DatabaseInstanceReadReplica(
            self, "PostgresReadReplica",
            source_database_instance=primary,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.R6G,
                ec2.InstanceSize.XLARGE2
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_group_name="Private-Data"
            ),
            security_groups=[self.security_groups['database']],
            storage_encrypted=True,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            auto_minor_version_upgrade=False,
            removal_policy=RemovalPolicy.DESTROY  # Complete cleanup
        )

        return primary

    def _create_redis_cluster(self) -> elasticache.CfnReplicationGroup:
        """Create ElastiCache Redis cluster with 6 shards and 2 replicas."""
        # Create subnet group
        subnet_group = elasticache.CfnSubnetGroup(
            self, "RedisSubnetGroup",
            description="Subnet group for Redis cluster",
            subnet_ids=[
                subnet.subnet_id
                for subnet in self.vpc.select_subnets(
                    subnet_group_name="Private-Data"
                ).subnets
            ]
        )

        # Create parameter group for cluster mode
        parameter_group = elasticache.CfnParameterGroup(
            self, "RedisParameterGroup",
            cache_parameter_group_family="redis7",
            description="Redis 7 cluster mode parameters",
            properties={
                "cluster-enabled": "yes",
                "timeout": "300",
                "tcp-keepalive": "300",
                "maxmemory-policy": "volatile-lru"
            }
        )

        # Create Redis replication group with complete cleanup
        redis_cluster = elasticache.CfnReplicationGroup(
            self, "RedisCluster",
            replication_group_description="Redis cluster for session and cache",
            cache_node_type="cache.r6g.2xlarge",
            engine="redis",
            engine_version="7.0",
            num_node_groups=6,
            replicas_per_node_group=2,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=subnet_group.ref,
            cache_parameter_group_name=parameter_group.ref,
            security_group_ids=[self.security_groups['redis'].security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            snapshot_retention_limit=0,  # No snapshots for easier cleanup
            snapshot_window="03:00-05:00",
            preferred_maintenance_window="sun:05:00-sun:06:00",
            log_delivery_configurations=[
                {
                    "destinationDetails": {
                        "cloudWatchLogsDetails": {
                            "logGroup": logs.LogGroup(
                                self, "RedisSlowLog",
                                log_group_name=f"/aws/elasticache/redis/{self.stack_name}-{self.environment_suffix}",
                                retention=logs.RetentionDays.ONE_WEEK,
                                removal_policy=RemovalPolicy.DESTROY
                            ).log_group_name
                        }
                    },
                    "destinationType": "cloudwatch-logs",
                    "logFormat": "json",
                    "logType": "slow-log"
                }
            ],
            tags=[{
                "key": "Name",
                "value": f"{self.stack_name}-redis-cluster-{self.environment_suffix}"
            }]
        )

        return redis_cluster

    def _create_compute_tier(self) -> dict:
        """Create EC2 Auto Scaling Group with Network Load Balancer."""
        # Create launch template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent postgresql15",
            "amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s",
            "echo 'Application deployment placeholder'"
        )

        # IAM role for instances
        instance_role = iam.Role(
            self, "ComputeInstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # Add S3 read permissions for VPC endpoint testing
        instance_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket",
                    "s3:ListAllMyBuckets",
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                resources=["*"]
            )
        )

        # Launch template
        launch_template = ec2.LaunchTemplate(
            self, "ComputeLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.C5,
                ec2.InstanceSize.XLARGE4
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            user_data=user_data,
            role=instance_role,
            security_group=self.security_groups['compute'],
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        100,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                        encrypted=True,
                        delete_on_termination=True,
                        iops=3000,
                        throughput=125
                    )
                )
            ],
            require_imdsv2=True
        )

        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "ComputeASG",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_group_name="Private-App"
            ),
            launch_template=launch_template,
            min_capacity=8,
            max_capacity=15,
            desired_capacity=10,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.seconds(300)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=2,
                min_instances_in_service=6,
                pause_time=Duration.seconds(300)
            ),
            termination_policies=[
                autoscaling.TerminationPolicy.OLDEST_INSTANCE
            ]
        )

        # Add scaling policies
        asg.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            cooldown=Duration.seconds(300)
        )

        # Create Network Load Balancer
        nlb = elbv2.NetworkLoadBalancer(
            self, "ComputeNLB",
            vpc=self.vpc,
            internet_facing=True,
            cross_zone_enabled=True,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_groups=[self.security_groups['nlb']]
        )

        # Add target group and listener
        listener = nlb.add_listener(
            "HttpsListener",
            port=443,
            protocol=elbv2.Protocol.TCP
        )

        target_group = listener.add_targets(
            "ComputeTargets",
            port=443,
            protocol=elbv2.Protocol.TCP,
            targets=[asg],
            health_check=elbv2.HealthCheck(
                interval=Duration.seconds(30),
                protocol=elbv2.Protocol.TCP,
                healthy_threshold_count=3,
                unhealthy_threshold_count=3
            ),
            deregistration_delay=Duration.seconds(30)
        )

        return {
            "asg": asg,
            "nlb": nlb,
            "launch_template": launch_template,
            "listener": listener,
            "target_group": target_group
        }

    def _create_lambda_functions(self) -> List[lambda_.Function]:
        """Create Lambda functions for order workflows."""
        functions = []

        # Lambda execution role
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Add permissions for RDS and Redis access
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "rds:DescribeDBInstances",
                    "elasticache:DescribeReplicationGroups",
                    "secretsmanager:GetSecretValue",
                    "kms:Decrypt"
                ],
                resources=["*"]
            )
        )

        # Function names and configurations
        function_configs = [
            "OrderValidation",
            "PaymentProcessing",
            "InventoryUpdate",
            "NotificationDispatch",
            "OrderFulfillment"
        ]

        for func_name in function_configs:
            # Create log group with cleanup
            log_group = logs.LogGroup(
                self, f"{func_name}LogGroup",
                log_group_name=f"/aws/lambda/{self.stack_name}-{func_name}-{self.environment_suffix}",
                retention=logs.RetentionDays.TWO_WEEKS,
                removal_policy=RemovalPolicy.DESTROY
            )

            # Create Lambda function
            func = lambda_.Function(
                self, func_name,
                function_name=f"{self.stack_name}-{func_name}-{self.environment_suffix}",
                runtime=lambda_.Runtime.PYTHON_3_10,
                handler="index.handler",
                code=lambda_.Code.from_inline(f"""
import json
import os

def handler(event, context):
    # Placeholder for {func_name} logic
    return {{
        'statusCode': 200,
        'body': json.dumps('{func_name} executed successfully')
    }}
                """),
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_group_name="Private-App"
                ),
                security_groups=[self.security_groups['lambda']],
                timeout=Duration.seconds(900),
                memory_size=3008,
                role=lambda_role,
                environment={
                    "DB_SECRET_ARN": self.database.secret.secret_arn,
                    "REDIS_ENDPOINT": self.redis.attr_configuration_end_point_address,
                    "REGION": self.region,
                    "ENVIRONMENT": self.environment_suffix
                },
                tracing=lambda_.Tracing.ACTIVE,
                log_retention=logs.RetentionDays.TWO_WEEKS,
                architecture=lambda_.Architecture.ARM_64
            )

            # Add provisioned concurrency
            version = func.current_version
            alias = lambda_.Alias(
                self, f"{func_name}LiveAlias",
                alias_name="live",
                version=version,
                provisioned_concurrent_executions=50
            )

            # Add auto-scaling for provisioned concurrency
            target = alias.add_auto_scaling(
                min_capacity=50,
                max_capacity=100
            )

            target.scale_on_utilization(
                utilization_target=0.7
            )

            functions.append(func)

        return functions

    def _create_monitoring(self):
        """Create CloudWatch dashboards and alarms."""
        self.dashboard = cloudwatch.Dashboard(
            self, "TapDashboard",
            dashboard_name=f"{self.stack_name}-operations-{self.environment_suffix}"
        )

        # Add widgets for each service
        # RDS metrics
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS Performance",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBInstanceIdentifier": self.database.instance_identifier
                        }
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBInstanceIdentifier": self.database.instance_identifier
                        }
                    )
                ]
            )
        )

        # Create alarms for critical metrics
        self.db_cpu_alarm = cloudwatch.Alarm(
            self, "HighDatabaseCPU",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": self.database.instance_identifier
                }
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2
        )

    def _create_outputs(self):
        """Create comprehensive stack outputs for reference."""
        # VPC outputs
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"{self.stack_name}-vpc-id-{self.environment_suffix}"
        )

        CfnOutput(
            self, "VpcCidr",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR block",
            export_name=f"{self.stack_name}-vpc-cidr-{self.environment_suffix}"
        )

        # Subnet outputs
        for idx, subnet in enumerate(self.vpc.public_subnets):
            CfnOutput(
                self, f"PublicSubnet{idx}",
                value=subnet.subnet_id,
                description=f"Public subnet {idx} ID",
                export_name=f"{self.stack_name}-public-subnet-{idx}-{self.environment_suffix}"
            )

        for idx, subnet in enumerate(self.vpc.private_subnets):
            CfnOutput(
                self, f"PrivateSubnet{idx}",
                value=subnet.subnet_id,
                description=f"Private subnet {idx} ID",
                export_name=f"{self.stack_name}-private-subnet-{idx}-{self.environment_suffix}"
            )

        # Security group outputs
        CfnOutput(
            self, "DatabaseSecurityGroupId",
            value=self.security_groups['database'].security_group_id,
            description="Database security group ID",
            export_name=f"{self.stack_name}-db-sg-{self.environment_suffix}"
        )

        CfnOutput(
            self, "RedisSecurityGroupId",
            value=self.security_groups['redis'].security_group_id,
            description="Redis security group ID",
            export_name=f"{self.stack_name}-redis-sg-{self.environment_suffix}"
        )

        CfnOutput(
            self, "ComputeSecurityGroupId",
            value=self.security_groups['compute'].security_group_id,
            description="Compute security group ID",
            export_name=f"{self.stack_name}-compute-sg-{self.environment_suffix}"
        )

        # Database outputs
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS primary endpoint",
            export_name=f"{self.stack_name}-db-endpoint-{self.environment_suffix}"
        )

        CfnOutput(
            self, "DatabasePort",
            value=str(self.database.instance_endpoint.port),
            description="RDS port",
            export_name=f"{self.stack_name}-db-port-{self.environment_suffix}"
        )

        CfnOutput(
            self, "DatabaseName",
            value="tapdb",
            description="Database name",
            export_name=f"{self.stack_name}-db-name-{self.environment_suffix}"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.database.secret.secret_arn,
            description="Database master password secret ARN",
            export_name=f"{self.stack_name}-db-secret-arn-{self.environment_suffix}"
        )

        CfnOutput(
            self, "ReadReplicaEndpoint",
            value=self.read_replica.instance_endpoint.hostname,
            description="RDS read replica endpoint",
            export_name=f"{self.stack_name}-read-replica-endpoint-{self.environment_suffix}"
        )

        # Redis outputs
        CfnOutput(
            self, "RedisEndpoint",
            value=self.redis.attr_configuration_end_point_address,
            description="Redis cluster endpoint",
            export_name=f"{self.stack_name}-redis-endpoint-{self.environment_suffix}"
        )

        CfnOutput(
            self, "RedisPort",
            value=self.redis.attr_configuration_end_point_port,
            description="Redis port",
            export_name=f"{self.stack_name}-redis-port-{self.environment_suffix}"
        )

        CfnOutput(
            self, "RedisClusterId",
            value=self.redis.ref,
            description="Redis replication group ID",
            export_name=f"{self.stack_name}-redis-cluster-id-{self.environment_suffix}"
        )

        # Load balancer outputs
        CfnOutput(
            self, "NlbDnsName",
            value=self.compute_tier['nlb'].load_balancer_dns_name,
            description="Network Load Balancer DNS",
            export_name=f"{self.stack_name}-nlb-dns-{self.environment_suffix}"
        )

        CfnOutput(
            self, "NlbArn",
            value=self.compute_tier['nlb'].load_balancer_arn,
            description="Network Load Balancer ARN",
            export_name=f"{self.stack_name}-nlb-arn-{self.environment_suffix}"
        )

        # ASG outputs
        CfnOutput(
            self, "AsgName",
            value=self.compute_tier['asg'].auto_scaling_group_name,
            description="Auto Scaling Group name",
            export_name=f"{self.stack_name}-asg-name-{self.environment_suffix}"
        )

        CfnOutput(
            self, "AsgArn",
            value=self.compute_tier['asg'].auto_scaling_group_arn,
            description="Auto Scaling Group ARN",
            export_name=f"{self.stack_name}-asg-arn-{self.environment_suffix}"
        )

        # Lambda outputs
        for idx, func in enumerate(self.lambda_functions):
            CfnOutput(
                self, f"LambdaFunction{idx}Arn",
                value=func.function_arn,
                description=f"Lambda function {idx} ARN",
                export_name=f"{self.stack_name}-lambda-{idx}-arn-{self.environment_suffix}"
            )

        # VPC endpoint outputs
        CfnOutput(
            self, "DynamoDBEndpointId",
            value=self.dynamodb_endpoint.vpc_endpoint_id,
            description="DynamoDB VPC endpoint ID",
            export_name=f"{self.stack_name}-dynamodb-endpoint-{self.environment_suffix}"
        )

        CfnOutput(
            self, "S3EndpointId",
            value=self.s3_endpoint.vpc_endpoint_id,
            description="S3 VPC endpoint ID",
            export_name=f"{self.stack_name}-s3-endpoint-{self.environment_suffix}"
        )

        # Monitoring outputs
        CfnOutput(
            self, "DashboardName",
            value=self.dashboard.dashboard_name,
            description="CloudWatch dashboard name",
            export_name=f"{self.stack_name}-dashboard-{self.environment_suffix}"
        )

        # Region and account outputs
        CfnOutput(
            self, "Region",
            value=self.region,
            description="AWS region",
            export_name=f"{self.stack_name}-region-{self.environment_suffix}"
        )

        CfnOutput(
            self, "AccountId",
            value=self.account,
            description="AWS account ID",
            export_name=f"{self.stack_name}-account-{self.environment_suffix}"
        )

        CfnOutput(
            self, "StackName",
            value=self.stack_name,
            description="Stack name",
            export_name=f"{self.stack_name}-name-{self.environment_suffix}"
        )

        CfnOutput(
            self, "EnvironmentSuffix",
            value=self.environment_suffix,
            description="Environment suffix",
            export_name=f"{self.stack_name}-env-suffix-{self.environment_suffix}"
        )

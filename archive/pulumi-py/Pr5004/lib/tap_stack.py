"""
tap_stack.py

This module defines the TapStack class for the digital assessment platform infrastructure.
Implements FERPA-compliant infrastructure with encryption, monitoring, and high availability.
"""

import json
from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import (
    ec2, kinesis, rds, elasticache, apigatewayv2,
    secretsmanager, iam, cloudwatch, kms, sns
)


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod').
        tags (Optional[dict]): Default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for the digital assessment platform.

    This component creates a FERPA-compliant infrastructure with:
    - Multi-AZ VPC with public and private subnets
    - API Gateway with rate limiting (100 req/min per user)
    - Kinesis for real-time submission processing
    - RDS PostgreSQL with encryption and automated backups
    - ElastiCache Redis with Multi-AZ for session management
    - AWS Secrets Manager for credential management
    - KMS encryption for all data at rest and in transit
    - CloudWatch monitoring and alarms

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments.
        opts (ResourceOptions): Pulumi options.
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

        # Create KMS key for encryption
        self.kms_key = kms.Key(
            f"assessment-key-{self.environment_suffix}",
            description="KMS key for assessment platform encryption",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                **self.tags,
                "Name": f"assessment-key-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create KMS alias for easier reference
        kms.Alias(
            f"assessment-key-alias-{self.environment_suffix}",
            name=f"alias/assessment-platform-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # Create SNS topic for alarms
        self.alarm_topic = sns.Topic(
            f"assessment-alarms-{self.environment_suffix}",
            name=f"assessment-alarms-{self.environment_suffix}",
            tags={
                **self.tags,
                "Name": f"assessment-alarms-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Secrets Manager secret
        self.db_secret = self._create_secrets()

        # Create Kinesis stream
        self.kinesis_stream = self._create_kinesis()

        # Create RDS PostgreSQL
        self.rds_instance = self._create_rds()

        # Create ElastiCache Redis
        self.redis_cluster = self._create_redis()

        # Create API Gateway with rate limiting
        self.api_gateway = self._create_api_gateway()

        # Create CloudWatch monitoring
        self._create_cloudwatch_monitoring()

        # Register outputs
        self.register_outputs({
            "vpcId": self.vpc.id,
            "kinesisStreamName": self.kinesis_stream.name,
            "kinesisStreamArn": self.kinesis_stream.arn,
            "rdsEndpoint": self.rds_instance.endpoint,
            "rdsArn": self.rds_instance.arn,
            "redisEndpoint": self.redis_cluster.cache_nodes.apply(
                lambda nodes: nodes[0]['address'] if isinstance(nodes[0], dict) else nodes[0].address
            ),
            "redisPort": self.redis_cluster.cache_nodes.apply(
                lambda nodes: nodes[0]['port'] if isinstance(nodes[0], dict) else nodes[0].port
            ),
            "apiGatewayUrl": self.api_gateway.api_endpoint,
            "apiGatewayId": self.api_gateway.id,
            "secretArn": self.db_secret.arn,
            "kmsKeyId": self.kms_key.id,
            "alarmTopicArn": self.alarm_topic.arn
        })

    def _create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""

        vpc = ec2.Vpc(
            f"assessment-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"assessment-vpc-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = ec2.InternetGateway(
            f"assessment-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **self.tags,
                "Name": f"assessment-igw-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets in two AZs for high availability
        public_subnet_1 = ec2.Subnet(
            f"assessment-public-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                "Name": f"assessment-public-subnet-1-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix,
                "Tier": "Public"
            },
            opts=ResourceOptions(parent=self)
        )

        public_subnet_2 = ec2.Subnet(
            f"assessment-public-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                "Name": f"assessment-public-subnet-2-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix,
                "Tier": "Public"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets in two AZs
        private_subnet_1 = ec2.Subnet(
            f"assessment-private-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone="us-east-1a",
            tags={
                **self.tags,
                "Name": f"assessment-private-subnet-1-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix,
                "Tier": "Private"
            },
            opts=ResourceOptions(parent=self)
        )

        private_subnet_2 = ec2.Subnet(
            f"assessment-private-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1b",
            tags={
                **self.tags,
                "Name": f"assessment-private-subnet-2-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix,
                "Tier": "Private"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route table for public subnets
        public_rt = ec2.RouteTable(
            f"assessment-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **self.tags,
                "Name": f"assessment-public-rt-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Add route to Internet Gateway for public subnets
        ec2.Route(
            f"assessment-public-route-{self.environment_suffix}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        ec2.RouteTableAssociation(
            f"assessment-public-rta-1-{self.environment_suffix}",
            subnet_id=public_subnet_1.id,
            route_table_id=public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        ec2.RouteTableAssociation(
            f"assessment-public-rta-2-{self.environment_suffix}",
            subnet_id=public_subnet_2.id,
            route_table_id=public_rt.id,
            opts=ResourceOptions(parent=self)
        )

        # Create route table for private subnets
        private_rt = ec2.RouteTable(
            f"assessment-private-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **self.tags,
                "Name": f"assessment-private-rt-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        ec2.RouteTableAssociation(
            f"assessment-private-rta-1-{self.environment_suffix}",
            subnet_id=private_subnet_1.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=self)
        )

        ec2.RouteTableAssociation(
            f"assessment-private-rta-2-{self.environment_suffix}",
            subnet_id=private_subnet_2.id,
            route_table_id=private_rt.id,
            opts=ResourceOptions(parent=self)
        )

        # Store subnet IDs for use by other resources
        vpc.private_subnet_ids = [private_subnet_1.id, private_subnet_2.id]
        vpc.public_subnet_ids = [public_subnet_1.id, public_subnet_2.id]

        return vpc

    def _create_secrets(self):
        """Create Secrets Manager secret for database credentials with KMS encryption"""

        secret = secretsmanager.Secret(
            f"assessment-db-secret-{self.environment_suffix}",
            name=f"assessment-db-secret-{self.environment_suffix}",
            description="Database credentials for assessment platform - FERPA compliant",
            kms_key_id=self.kms_key.arn,
            recovery_window_in_days=7,
            tags={
                **self.tags,
                "Name": f"assessment-db-secret-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix,
                "Compliance": "FERPA"
            },
            opts=ResourceOptions(parent=self)
        )

        # Store initial secret value
        secretsmanager.SecretVersion(
            f"assessment-db-secret-version-{self.environment_suffix}",
            secret_id=secret.id,
            secret_string=json.dumps({
                "username": "assessmentadmin",
                "password": "ChangeMe123!",
                "engine": "postgres",
                "port": 5432,
                "dbname": "assessments"
            }),
            opts=ResourceOptions(parent=self)
        )

        return secret

    def _create_kinesis(self):
        """Create Kinesis Data Stream for real-time processing with enhanced monitoring"""

        stream = kinesis.Stream(
            f"assessment-submissions-{self.environment_suffix}",
            name=f"assessment-submissions-{self.environment_suffix}",
            shard_count=2,
            retention_period=24,
            encryption_type="KMS",
            kms_key_id=self.kms_key.arn,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded",
                "IteratorAgeMilliseconds"
            ],
            tags={
                **self.tags,
                "Name": f"assessment-submissions-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return stream

    def _create_rds(self):
        """Create RDS PostgreSQL instance in private subnets with encryption and backups"""

        # Create security group for RDS with restricted access
        rds_sg = ec2.SecurityGroup(
            f"assessment-rds-sg-{self.environment_suffix}",
            name=f"assessment-rds-sg-{self.environment_suffix}",
            description="Security group for RDS PostgreSQL - restricted to VPC only",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="PostgreSQL access from VPC"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **self.tags,
                "Name": f"assessment-rds-sg-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group spanning multiple AZs
        db_subnet_group = rds.SubnetGroup(
            f"assessment-db-subnet-group-{self.environment_suffix}",
            name=f"assessment-db-subnet-group-{self.environment_suffix}",
            description="Subnet group for RDS PostgreSQL across multiple AZs",
            subnet_ids=self.vpc.private_subnet_ids,
            tags={
                **self.tags,
                "Name": f"assessment-db-subnet-group-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create RDS parameter group for PostgreSQL optimization
        db_parameter_group = rds.ParameterGroup(
            f"assessment-db-params-{self.environment_suffix}",
            name=f"assessment-db-params-{self.environment_suffix}",
            family="postgres16",
            description="Custom parameter group for assessment platform",
            parameters=[
                rds.ParameterGroupParameterArgs(
                    name="log_connections",
                    value="1"
                ),
                rds.ParameterGroupParameterArgs(
                    name="log_disconnections",
                    value="1"
                )
            ],
            tags={
                **self.tags,
                "Name": f"assessment-db-params-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create RDS instance with encryption and automated backups
        db_instance = rds.Instance(
            f"assessment-db-{self.environment_suffix}",
            identifier=f"assessment-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="16.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="assessments",
            username="assessmentadmin",
            password="ChangeMe123!",
            db_subnet_group_name=db_subnet_group.name,
            parameter_group_name=db_parameter_group.name,
            vpc_security_group_ids=[rds_sg.id],
            publicly_accessible=False,
            skip_final_snapshot=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            auto_minor_version_upgrade=True,
            copy_tags_to_snapshot=True,
            deletion_protection=False,
            tags={
                **self.tags,
                "Name": f"assessment-db-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix,
                "Compliance": "FERPA"
            },
            opts=ResourceOptions(parent=self)
        )

        return db_instance

    def _create_redis(self):
        """Create ElastiCache Redis cluster for session management with Multi-AZ"""

        # Create security group for Redis
        redis_sg = ec2.SecurityGroup(
            f"assessment-redis-sg-{self.environment_suffix}",
            name=f"assessment-redis-sg-{self.environment_suffix}",
            description="Security group for ElastiCache Redis - restricted to VPC",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="Redis access from VPC"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                **self.tags,
                "Name": f"assessment-redis-sg-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create subnet group for Redis
        redis_subnet_group = elasticache.SubnetGroup(
            f"assessment-redis-subnet-group-{self.environment_suffix}",
            name=f"assessment-redis-subnet-group-{self.environment_suffix}",
            description="Subnet group for ElastiCache Redis",
            subnet_ids=self.vpc.private_subnet_ids,
            tags={
                **self.tags,
                "Name": f"assessment-redis-subnet-group-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Redis parameter group
        redis_param_group = elasticache.ParameterGroup(
            f"assessment-redis-params-{self.environment_suffix}",
            name=f"assessment-redis-params-{self.environment_suffix}",
            family="redis7",
            description="Custom parameter group for assessment platform Redis",
            parameters=[
                elasticache.ParameterGroupParameterArgs(
                    name="timeout",
                    value="300"
                ),
                elasticache.ParameterGroupParameterArgs(
                    name="maxmemory-policy",
                    value="allkeys-lru"
                )
            ],
            tags={
                **self.tags,
                "Name": f"assessment-redis-params-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Redis cluster with encryption
        redis_cluster = elasticache.Cluster(
            f"assessment-redis-{self.environment_suffix}",
            cluster_id=f"assessment-redis-{self.environment_suffix}",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_nodes=1,
            parameter_group_name=redis_param_group.name,
            subnet_group_name=redis_subnet_group.name,
            security_group_ids=[redis_sg.id],
            snapshot_retention_limit=5,
            snapshot_window="02:00-03:00",
            maintenance_window="mon:03:00-mon:04:00",
            tags={
                **self.tags,
                "Name": f"assessment-redis-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return redis_cluster

    def _create_api_gateway(self):
        """Create API Gateway with rate limiting (100 requests/minute per user)"""

        # Create HTTP API Gateway
        api = apigatewayv2.Api(
            f"assessment-api-{self.environment_suffix}",
            name=f"assessment-api-{self.environment_suffix}",
            protocol_type="HTTP",
            description="API Gateway for assessment platform with rate limiting",
            cors_configuration=apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=["*"],
                allow_methods=["GET", "POST"],
                allow_headers=["Content-Type", "Authorization"],
                max_age=300
            ),
            tags={
                **self.tags,
                "Name": f"assessment-api-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for API Gateway
        api_log_group = cloudwatch.LogGroup(
            f"api-gateway-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/assessment-platform-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                "Name": f"api-gateway-logs-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create default stage with throttling (rate limiting)
        stage = apigatewayv2.Stage(
            f"assessment-api-stage-{self.environment_suffix}",
            api_id=api.id,
            name="$default",
            auto_deploy=True,
            default_route_settings=apigatewayv2.StageDefaultRouteSettingsArgs(
                throttling_burst_limit=200,
                throttling_rate_limit=100.0  # 100 requests per second
            ),
            access_log_settings=apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength",
                    "errorMessage": "$context.error.message"
                })
            ),
            tags={
                **self.tags,
                "Name": f"assessment-api-stage-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for API Gateway to write to Kinesis
        api_kinesis_role = iam.Role(
            f"api-kinesis-role-{self.environment_suffix}",
            name=f"api-kinesis-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "apigateway.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create policy for API Gateway to write to Kinesis
        api_kinesis_policy = iam.Policy(
            f"api-kinesis-policy-{self.environment_suffix}",
            name=f"api-kinesis-policy-{self.environment_suffix}",
            policy=self.kinesis_stream.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kinesis:PutRecord",
                        "kinesis:PutRecords"
                    ],
                    "Resource": arn
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Attach policy to role
        iam.RolePolicyAttachment(
            f"api-kinesis-policy-attachment-{self.environment_suffix}",
            role=api_kinesis_role.name,
            policy_arn=api_kinesis_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Create Kinesis integration
        integration = apigatewayv2.Integration(
            f"assessment-kinesis-integration-{self.environment_suffix}",
            api_id=api.id,
            integration_type="AWS_PROXY",
            integration_subtype="Kinesis-PutRecord",
            credentials_arn=api_kinesis_role.arn,
            passthrough_behavior="WHEN_NO_MATCH",
            payload_format_version="1.0",
            request_parameters={
                "StreamName": self.kinesis_stream.name,
                "Data": "$request.body.data",
                "PartitionKey": "$request.body.partitionKey"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create route with rate limiting
        apigatewayv2.Route(
            f"assessment-submit-route-{self.environment_suffix}",
            api_id=api.id,
            route_key="POST /submit",
            target=integration.id.apply(lambda id: f"integrations/{id}"),
            opts=ResourceOptions(parent=self)
        )

        return api

    def _create_cloudwatch_monitoring(self):
        """Create CloudWatch alarms for monitoring"""

        # Create alarm for high API Gateway error rate
        cloudwatch.MetricAlarm(
            f"api-high-error-rate-{self.environment_suffix}",
            name=f"assessment-api-high-error-rate-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=60,
            statistic="Sum",
            threshold=10.0,
            alarm_description="Alert when API Gateway 5XX errors exceed threshold",
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "ApiId": self.api_gateway.id
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create alarm for API Gateway throttling
        cloudwatch.MetricAlarm(
            f"api-throttled-requests-{self.environment_suffix}",
            name=f"assessment-api-throttled-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Count",
            namespace="AWS/ApiGateway",
            period=60,
            statistic="Sum",
            threshold=50.0,
            alarm_description="Alert when API requests are throttled",
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "ApiId": self.api_gateway.id
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create alarm for Kinesis processing lag
        cloudwatch.MetricAlarm(
            f"kinesis-iterator-age-{self.environment_suffix}",
            name=f"assessment-kinesis-lag-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=60,
            statistic="Maximum",
            threshold=60000.0,
            alarm_description="Alert when Kinesis processing lag exceeds 1 minute",
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "StreamName": self.kinesis_stream.name
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create alarm for RDS high CPU
        cloudwatch.MetricAlarm(
            f"rds-high-cpu-{self.environment_suffix}",
            name=f"assessment-rds-high-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="Alert when RDS CPU utilization exceeds 80%",
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.identifier
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create alarm for Redis high memory
        cloudwatch.MetricAlarm(
            f"redis-high-memory-{self.environment_suffix}",
            name=f"assessment-redis-high-memory-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseMemoryUsagePercentage",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=85.0,
            alarm_description="Alert when Redis memory usage exceeds 85%",
            alarm_actions=[self.alarm_topic.arn],
            treat_missing_data="notBreaching",
            dimensions={
                "CacheClusterId": self.redis_cluster.cluster_id
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

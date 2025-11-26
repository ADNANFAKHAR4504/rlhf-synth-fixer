from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_backup as backup,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Create VPC with Multi-AZ subnets
        self.vpc = self._create_vpc()

        # Create KMS keys for encryption
        self.aurora_key = self._create_kms_key("aurora")
        self.s3_key = self._create_kms_key("s3")

        # Create Aurora PostgreSQL Multi-AZ cluster
        self.aurora_cluster = self._create_aurora_cluster()

        # Create DynamoDB table with PITR
        self.dynamodb_table = self._create_dynamodb_table()

        # Create S3 bucket with versioning
        self.s3_bucket = self._create_s3_bucket()

        # Create Lambda function in VPC
        self.lambda_function = self._create_lambda_function()

        # Create SNS topic for notifications
        self.sns_topic = self._create_sns_topic()

        # Create AWS Backup configuration
        self._create_backup_plan()

        # Create CloudWatch monitoring
        self._create_cloudwatch_dashboard()
        self._create_cloudwatch_alarms()

        # Create EventBridge rules for backup monitoring
        self._create_eventbridge_rules()

        # Create CloudFormation outputs for all resources
        self._create_outputs()

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for all resources"""
        # VPC outputs
        CfnOutput(self, "VpcId", value=self.vpc.vpc_id,
                  description="VPC ID")
        CfnOutput(self, "VpcCidr", value=self.vpc.vpc_cidr_block,
                  description="VPC CIDR block")

        # KMS key outputs
        CfnOutput(self, "AuroraKmsKeyArn", value=self.aurora_key.key_arn,
                  description="Aurora KMS key ARN")
        CfnOutput(self, "S3KmsKeyArn", value=self.s3_key.key_arn,
                  description="S3 KMS key ARN")

        # Aurora outputs
        CfnOutput(self, "AuroraClusterIdentifier",
                  value=self.aurora_cluster.cluster_identifier,
                  description="Aurora cluster identifier")
        CfnOutput(self, "AuroraClusterEndpoint",
                  value=self.aurora_cluster.cluster_endpoint.hostname,
                  description="Aurora cluster endpoint")
        CfnOutput(self, "AuroraClusterReaderEndpoint",
                  value=self.aurora_cluster.cluster_read_endpoint.hostname,
                  description="Aurora cluster reader endpoint")
        CfnOutput(self, "AuroraSecretArn",
                  value=self.aurora_cluster.secret.secret_arn,
                  description="Aurora secret ARN")

        # DynamoDB outputs
        CfnOutput(self, "DynamoDBTableName",
                  value=self.dynamodb_table.table_name,
                  description="DynamoDB table name")
        CfnOutput(self, "DynamoDBTableArn",
                  value=self.dynamodb_table.table_arn,
                  description="DynamoDB table ARN")

        # S3 outputs
        CfnOutput(self, "S3BucketName",
                  value=self.s3_bucket.bucket_name,
                  description="S3 bucket name")
        CfnOutput(self, "S3BucketArn",
                  value=self.s3_bucket.bucket_arn,
                  description="S3 bucket ARN")

        # Lambda outputs
        CfnOutput(self, "LambdaFunctionName",
                  value=self.lambda_function.function_name,
                  description="Lambda function name")
        CfnOutput(self, "LambdaFunctionArn",
                  value=self.lambda_function.function_arn,
                  description="Lambda function ARN")

        # SNS outputs
        CfnOutput(self, "SnsTopicArn",
                  value=self.sns_topic.topic_arn,
                  description="SNS topic ARN")
        CfnOutput(self, "SnsTopicName",
                  value=self.sns_topic.topic_name,
                  description="SNS topic name")

        # Region output
        CfnOutput(self, "Region",
                  value=self.region,
                  description="Deployment region")

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with Multi-AZ subnets across 3 availability zones"""
        vpc = ec2.Vpc(
            self,
            f"VPC-{self.environment_suffix}",
            vpc_name=f"dr-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=0,  # Cost optimization - use VPC endpoints instead
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
            ],
        )

        # Add VPC endpoints for S3 and DynamoDB
        vpc.add_gateway_endpoint(
            f"S3Endpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        return vpc

    def _create_kms_key(self, purpose: str) -> kms.Key:
        """Create KMS key with automatic rotation"""
        key = kms.Key(
            self,
            f"KMSKey-{purpose}-{self.environment_suffix}",
            description=f"KMS key for {purpose} encryption in DR solution",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        key.add_alias(f"alias/dr-{purpose}-{self.environment_suffix}")

        return key

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora PostgreSQL Multi-AZ cluster"""
        # Security group for Aurora
        aurora_sg = ec2.SecurityGroup(
            self,
            f"AuroraSG-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Aurora PostgreSQL cluster",
            allow_all_outbound=True,
        )

        aurora_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from VPC",
        )

        # Create subnet group for Aurora
        subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-{self.environment_suffix}",
            description="Subnet group for Aurora cluster",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Aurora cluster
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_8
            ),
            writer=rds.ClusterInstance.provisioned(
                f"Writer-{self.environment_suffix}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE4_GRAVITON,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    f"Reader1-{self.environment_suffix}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.BURSTABLE4_GRAVITON,
                        ec2.InstanceSize.MEDIUM,
                    ),
                ),
            ],
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[aurora_sg],
            subnet_group=subnet_group,
            storage_encrypted=True,
            storage_encryption_key=self.aurora_key,
            backup=rds.BackupProps(
                retention=Duration.days(7),
            ),
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
        )

        return cluster

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with PITR enabled"""
        table = dynamodb.Table(
            self,
            f"DynamoDBTable-{self.environment_suffix}",
            table_name=f"dr-table-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with versioning and encryption"""
        bucket = s3.Bucket(
            self,
            f"S3Bucket-{self.environment_suffix}",
            bucket_name=f"dr-backup-bucket-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    noncurrent_version_transitions=[
                        s3.NoncurrentVersionTransition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30),
                        ),
                    ],
                    noncurrent_version_expiration=Duration.days(90),
                ),
            ],
        )

        return bucket

    def _create_lambda_function(self) -> lambda_.Function:
        """Create Lambda function in VPC"""
        # Security group for Lambda
        lambda_sg = ec2.SecurityGroup(
            self,
            f"LambdaSG-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Lambda function",
            allow_all_outbound=True,
        )

        # Lambda execution role
        lambda_role = iam.Role(
            self,
            f"LambdaRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        # Grant Lambda access to Aurora, DynamoDB, and S3
        self.aurora_cluster.secret.grant_read(lambda_role)
        self.dynamodb_table.grant_read_write_data(lambda_role)
        self.s3_bucket.grant_read_write(lambda_role)

        # Create Lambda function
        function = lambda_.Function(
            self,
            f"LambdaFunction-{self.environment_suffix}",
            function_name=f"dr-function-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            role=lambda_role,
            timeout=Duration.seconds(60),
            environment={
                "DB_SECRET_ARN": self.aurora_cluster.secret.secret_arn,
                "DB_CLUSTER_ARN": self.aurora_cluster.cluster_arn,
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.s3_bucket.bucket_name,
            },
        )

        return function

    def _create_sns_topic(self) -> sns.Topic:
        """Create SNS topic for notifications"""
        topic = sns.Topic(
            self,
            f"SNSTopic-{self.environment_suffix}",
            topic_name=f"dr-notifications-{self.environment_suffix}",
            display_name="DR Notifications",
        )

        return topic

    def _create_backup_plan(self) -> None:
        """Create AWS Backup plan with hourly schedule"""
        # Create backup vault
        vault = backup.BackupVault(
            self,
            f"BackupVault-{self.environment_suffix}",
            backup_vault_name=f"dr-vault-{self.environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create backup plan
        plan = backup.BackupPlan(
            self,
            f"BackupPlan-{self.environment_suffix}",
            backup_plan_name=f"dr-backup-plan-{self.environment_suffix}",
            backup_vault=vault,
        )

        # Add hourly backup rule
        plan.add_rule(
            backup.BackupPlanRule(
                rule_name=f"HourlyBackup-{self.environment_suffix}",
                schedule_expression=events.Schedule.cron(
                    minute="0",
                    hour="*",
                    month="*",
                    week_day="*",
                    year="*",
                ),
                delete_after=Duration.days(7),
                enable_continuous_backup=True,
            )
        )

        # Add selection for Aurora cluster
        plan.add_selection(
            f"AuroraSelection-{self.environment_suffix}",
            resources=[
                backup.BackupResource.from_rds_database_cluster(self.aurora_cluster),
            ],
        )

        # Add selection for DynamoDB table
        plan.add_selection(
            f"DynamoDBSelection-{self.environment_suffix}",
            resources=[
                backup.BackupResource.from_dynamo_db_table(self.dynamodb_table),
            ],
        )

    def _create_cloudwatch_dashboard(self) -> None:
        """Create CloudWatch dashboard for monitoring"""
        dashboard = cloudwatch.Dashboard(
            self,
            f"Dashboard-{self.environment_suffix}",
            dashboard_name=f"DR-Dashboard-{self.environment_suffix}",
        )

        # Aurora metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Aurora CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Aurora Database Connections",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
            ),
        )

        # DynamoDB metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Read/Write Capacity",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedReadCapacityUnits",
                        dimensions_map={
                            "TableName": self.dynamodb_table.table_name,
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedWriteCapacityUnits",
                        dimensions_map={
                            "TableName": self.dynamodb_table.table_name,
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
            )
        )

        # Lambda metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Function Metrics",
                left=[
                    self.lambda_function.metric_invocations(),
                    self.lambda_function.metric_errors(),
                    self.lambda_function.metric_duration(),
                ],
            )
        )

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for critical metrics"""
        # Aurora CPU alarm
        aurora_cpu_alarm = cloudwatch.Alarm(
            self,
            f"AuroraCPUAlarm-{self.environment_suffix}",
            alarm_name=f"Aurora-High-CPU-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        aurora_cpu_alarm.add_alarm_action(cw_actions.SnsAction(self.sns_topic))

        # DynamoDB throttle alarm
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            f"DynamoDBThrottleAlarm-{self.environment_suffix}",
            alarm_name=f"DynamoDB-Throttled-Requests-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="UserErrors",
                dimensions_map={
                    "TableName": self.dynamodb_table.table_name,
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        dynamodb_throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.sns_topic))

        # Lambda error alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.environment_suffix}",
            alarm_name=f"Lambda-Errors-{self.environment_suffix}",
            metric=self.lambda_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(self.sns_topic))

    def _create_eventbridge_rules(self) -> None:
        """Create EventBridge rules for backup monitoring"""
        # Rule for backup job state changes
        backup_rule = events.Rule(
            self,
            f"BackupJobRule-{self.environment_suffix}",
            rule_name=f"backup-job-state-change-{self.environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.backup"],
                detail_type=["Backup Job State Change"],
                detail={
                    "state": ["COMPLETED", "FAILED", "ABORTED"],
                },
            ),
        )

        backup_rule.add_target(targets.SnsTopic(self.sns_topic))

        # Rule for restore job state changes
        restore_rule = events.Rule(
            self,
            f"RestoreJobRule-{self.environment_suffix}",
            rule_name=f"restore-job-state-change-{self.environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.backup"],
                detail_type=["Restore Job State Change"],
                detail={
                    "state": ["COMPLETED", "FAILED", "ABORTED"],
                },
            ),
        )

        restore_rule.add_target(targets.SnsTopic(self.sns_topic))

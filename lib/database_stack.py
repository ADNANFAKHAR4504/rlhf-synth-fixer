"""
Multi-region PostgreSQL database disaster recovery infrastructure.
"""
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_route53 as route53,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    CfnOutput,
)
from constructs import Construct
import json


class DatabaseStackProps:
    """Properties for DatabaseStack"""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class DatabaseStack(Construct):
    """Multi-region database disaster recovery stack"""

    def __init__(self, scope: Construct, construct_id: str, props: DatabaseStackProps):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Create VPCs for both regions
        self.primary_vpc = ec2.Vpc(
            self, f"PrimaryVpc-{env_suffix}",
            vpc_name=f"primary-vpc-{env_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"private-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"public-{env_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Security group for primary database
        self.primary_db_sg = ec2.SecurityGroup(
            self, f"PrimaryDbSg-{env_suffix}",
            security_group_name=f"primary-db-sg-{env_suffix}",
            vpc=self.primary_vpc,
            description="Security group for primary PostgreSQL database",
            allow_all_outbound=True
        )

        # Allow PostgreSQL access within VPC
        self.primary_db_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.primary_vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from VPC"
        )

        # Create database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self, f"DbSecret-{env_suffix}",
            secret_name=f"db-credentials-{env_suffix}",
            description="PostgreSQL database master credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "dbadmin"}),
                generate_string_key="password",
                exclude_characters="/@\" '\\",
                password_length=32
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create subnet group for primary database
        self.primary_subnet_group = rds.SubnetGroup(
            self, f"PrimarySubnetGroup-{env_suffix}",
            subnet_group_name=f"primary-subnet-group-{env_suffix}",
            description="Subnet group for primary PostgreSQL database",
            vpc=self.primary_vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create parameter group with audit logging
        self.parameter_group = rds.ParameterGroup(
            self, f"DbParameterGroup-{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            parameters={
                "log_statement": "all",
                "rds.force_ssl": "0"
            },
            description="Parameter group with audit logging enabled"
        )

        # Create primary RDS PostgreSQL instance
        self.primary_db = rds.DatabaseInstance(
            self, f"PrimaryDatabase-{env_suffix}",
            instance_identifier=f"primary-db-{env_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.MEMORY6_GRAVITON,
                ec2.InstanceSize.LARGE
            ),
            vpc=self.primary_vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.primary_db_sg],
            subnet_group=self.primary_subnet_group,
            credentials=rds.Credentials.from_secret(self.db_secret),
            multi_az=True,
            allocated_storage=100,
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            parameter_group=self.parameter_group,
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention=logs.RetentionDays.ONE_WEEK,
            auto_minor_version_upgrade=False,
            delete_automated_backups=True
        )

        # Create SNS topic for CloudWatch alarms
        self.alarm_topic = sns.Topic(
            self, f"DbAlarmTopic-{env_suffix}",
            topic_name=f"db-alarm-topic-{env_suffix}",
            display_name="Database Replication Alarms"
        )

        # Create CloudWatch alarm for replication lag
        self.replication_lag_alarm = cloudwatch.Alarm(
            self, f"ReplicationLagAlarm-{env_suffix}",
            alarm_name=f"replication-lag-alarm-{env_suffix}",
            alarm_description="Alert when replication lag exceeds 60 seconds",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="ReplicaLag",
                dimensions_map={
                    "DBInstanceIdentifier": self.primary_db.instance_identifier
                },
                statistic="Average",
                period=Duration.minutes(1)
            ),
            threshold=60,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.replication_lag_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Create private hosted zone for database endpoints
        self.hosted_zone = route53.PrivateHostedZone(
            self, f"DbHostedZone-{env_suffix}",
            zone_name=f"db-{env_suffix}.internal",
            vpc=self.primary_vpc
        )

        # Create Lambda execution role
        self.failover_role = iam.Role(
            self, f"FailoverLambdaRole-{env_suffix}",
            role_name=f"failover-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add permissions for RDS and Route53
        self.failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "rds:PromoteReadReplica",
                    "rds:DescribeDBInstances",
                    "rds:ModifyDBInstance"
                ],
                resources=["*"]
            )
        )

        self.failover_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetChange",
                    "route53:ListResourceRecordSets"
                ],
                resources=["*"]
            )
        )

        # Create Lambda function for failover automation
        self.failover_function = lambda_.Function(
            self, f"FailoverFunction-{env_suffix}",
            function_name=f"failover-function-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/failover"),
            timeout=Duration.seconds(300),
            role=self.failover_role,
            environment={
                "PRIMARY_DB_INSTANCE": self.primary_db.instance_identifier,
                "REPLICA_DB_INSTANCE": f"replica-db-{env_suffix}",
                "REPLICA_REGION": "eu-west-1",
                "HOSTED_ZONE_ID": self.hosted_zone.hosted_zone_id,
                "ENVIRONMENT_SUFFIX": env_suffix
            },
            description="Automates database failover by promoting replica and updating Route53"
        )

        # Create CloudWatch alarm for database availability monitoring
        self.db_connection_alarm = cloudwatch.Alarm(
            self, f"DbConnectionAlarm-{env_suffix}",
            alarm_name=f"db-connection-alarm-{env_suffix}",
            alarm_description="Alert when database connections fail",
            metric=self.primary_db.metric_database_connections(
                statistic="Average",
                period=Duration.minutes(1)
            ),
            threshold=0,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING
        )

        # Create CloudWatch alarm-based Route53 health check
        self.health_check = route53.CfnHealthCheck(
            self, f"PrimaryDbHealthCheck-{env_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="CLOUDWATCH_METRIC",
                alarm_identifier=route53.CfnHealthCheck.AlarmIdentifierProperty(
                    name=self.db_connection_alarm.alarm_name,
                    region=Stack.of(self).region
                ),
                insufficient_data_health_status="Unhealthy"
            ),
            health_check_tags=[
                route53.CfnHealthCheck.HealthCheckTagProperty(
                    key="Name",
                    value=f"primary-db-health-{env_suffix}"
                )
            ]
        )

        # Create weighted routing record for primary
        self.primary_record = route53.CfnRecordSet(
            self, f"PrimaryDbRecord-{env_suffix}",
            hosted_zone_id=self.hosted_zone.hosted_zone_id,
            name=f"db.{self.hosted_zone.zone_name}",
            type="CNAME",
            ttl="60",
            resource_records=[self.primary_db.db_instance_endpoint_address],
            set_identifier=f"primary-{env_suffix}",
            weight=100
        )

        # Store primary DB ARN for replica creation
        self.primary_db_arn = f"arn:aws:rds:us-east-1:{Stack.of(self).account}:db:{self.primary_db.instance_identifier}"

        # Outputs
        CfnOutput(
            self, "PrimaryDatabaseEndpoint",
            value=self.primary_db.db_instance_endpoint_address,
            description="Primary database endpoint in us-east-1",
            export_name=f"PrimaryDbEndpoint-{env_suffix}"
        )

        CfnOutput(
            self, "PrimaryDatabaseArn",
            value=self.primary_db_arn,
            description="ARN of the primary database for replica creation",
            export_name=f"PrimaryDbArn-{env_suffix}"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"DbSecretArn-{env_suffix}"
        )

        CfnOutput(
            self, "Route53HostedZoneId",
            value=self.hosted_zone.hosted_zone_id,
            description="Route53 private hosted zone ID",
            export_name=f"DbHostedZoneId-{env_suffix}"
        )

        CfnOutput(
            self, "DatabaseCname",
            value=f"db.{self.hosted_zone.zone_name}",
            description="Database CNAME for application connection",
            export_name=f"DbCname-{env_suffix}"
        )

        CfnOutput(
            self, "FailoverFunctionArn",
            value=self.failover_function.function_arn,
            description="ARN of the failover Lambda function",
            export_name=f"FailoverFunctionArn-{env_suffix}"
        )

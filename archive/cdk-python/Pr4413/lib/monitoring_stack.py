"""monitoring_stack.py
Core monitoring infrastructure including RDS, ECS, ElastiCache, API Gateway, and logging.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_ecs as ecs,
    aws_elasticache as elasticache,
    aws_apigateway as apigw,
    aws_kinesis as kinesis,
    aws_kms as kms,
    aws_logs as logs,
    aws_iam as iam,
    aws_wafv2 as wafv2,
    aws_secretsmanager as secretsmanager,
)
from constructs import Construct


class MonitoringStackProps:
    """Properties for MonitoringStack"""

    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class MonitoringStack(Construct):
    """
    FedRAMP-compliant monitoring infrastructure construct.

    Creates all necessary resources for monitoring database activities,
    container workloads, and API access patterns with proper encryption
    and audit logging.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: MonitoringStackProps
    ):
        super().__init__(scope, construct_id)

        env_suffix = props.environment_suffix

        # Create KMS key for encryption at rest
        self.kms_key = kms.Key(
            self,
            "EncryptionKey",
            description=f"KMS key for monitoring infrastructure - {env_suffix}",
            enable_key_rotation=True,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Grant CloudWatch Logs permission to use the KMS key
        self.kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal(f"logs.{cdk.Aws.REGION}.amazonaws.com")
                ],
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
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{cdk.Aws.REGION}:{cdk.Aws.ACCOUNT_ID}:*"
                    }
                }
            )
        )

        # Create VPC for the monitoring infrastructure
        self.vpc = ec2.Vpc(
            self,
            "MonitoringVPC",
            vpc_name=f"monitoring-vpc-{env_suffix}",
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"public-{env_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"private-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Add VPC endpoints for AWS services
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        # CloudWatch log group with 365-day retention
        self.log_group = logs.LogGroup(
            self,
            "MonitoringLogs",
            log_group_name=f"/aws/monitoring/{env_suffix}",
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.kms_key,
            removal_policy=cdk.RemovalPolicy.DESTROY
        )

        # Kinesis Data Stream for log aggregation
        self.kinesis_stream = kinesis.Stream(
            self,
            "LogAggregationStream",
            stream_name=f"monitoring-logss-{env_suffix}",
            encryption=kinesis.StreamEncryption.KMS,
            encryption_key=self.kms_key,
            retention_period=cdk.Duration.days(7)
        )

        # Security group for RDS
        self.db_security_group = ec2.SecurityGroup(
            self,
            "DatabaseSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"rds-sg-{env_suffix}",
            description="Security group for RDS database",
            allow_all_outbound=False
        )

        # Security group for ECS
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            "ECSSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"ecs-sg-{env_suffix}",
            description="Security group for ECS tasks",
            allow_all_outbound=True
        )

        # Allow ECS to connect to RDS
        self.db_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow ECS tasks to connect to RDS"
        )

        # RDS subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            "DatabaseSubnetGroup",
            vpc=self.vpc,
            description=f"Subnet group for monitoring database - {env_suffix}",
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name=f"rds-subnet-group-{env_suffix}"
        )

        # RDS PostgreSQL with enhanced monitoring (credentials auto-generated)
        self.database = rds.DatabaseInstance(
            self,
            "MonitoringDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_8
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.SMALL
            ),
            credentials=rds.Credentials.from_generated_secret("dbadmin"),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[self.db_security_group],
            subnet_group=db_subnet_group,
            database_name="monitoring",
            allocated_storage=20,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=cdk.Duration.days(7),
            delete_automated_backups=True,
            deletion_protection=False,
            removal_policy=cdk.RemovalPolicy.DESTROY,
            cloudwatch_logs_exports=["postgresql"],
            monitoring_interval=cdk.Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_encryption_key=self.kms_key,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            instance_identifier=f"monitoring-db-{env_suffix}"
        )

        # Security group for ElastiCache
        self.redis_security_group = ec2.SecurityGroup(
            self,
            "RedisSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"redis-sg-{env_suffix}",
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False
        )

        # Allow ECS to connect to Redis
        self.redis_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow ECS tasks to connect to Redis"
        )

        # ElastiCache subnet group
        redis_subnet_group = elasticache.CfnSubnetGroup(
            self,
            "RedisSubnetGroup",
            description=f"Subnet group for Redis cluster - {env_suffix}",
            subnet_ids=self.vpc.select_subnets(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ).subnet_ids,
            cache_subnet_group_name=f"monitoring-redis-subnet-{env_suffix}"
        )
        # ElastiCache Redis cluster
        self.redis_cluster = elasticache.CfnReplicationGroup(
            self,
            "RedisCluster",
            replication_group_description=f"Redis cluster for metric aggregation - {env_suffix}",
            replication_group_id=f"monitoring-redis-{env_suffix}",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.t3.micro",
            num_cache_clusters=2,
            automatic_failover_enabled=True,
            at_rest_encryption_enabled=True,
            kms_key_id=self.kms_key.key_id,
            transit_encryption_enabled=True,
            cache_subnet_group_name=redis_subnet_group.cache_subnet_group_name,
            security_group_ids=[self.redis_security_group.security_group_id],
            snapshot_retention_limit=5,
            log_delivery_configurations=[
                elasticache.CfnReplicationGroup.LogDeliveryConfigurationRequestProperty(
                    destination_details=(
                        elasticache.CfnReplicationGroup.DestinationDetailsProperty(
                            cloud_watch_logs_details=(
                                elasticache.CfnReplicationGroup.
                                CloudWatchLogsDestinationDetailsProperty(
                                    log_group=self.log_group.log_group_name
                                )
                            )
                        )
                    ),
                    destination_type="cloudwatch-logs",
                    log_format="json",
                    log_type="slow-log"
                )
            ]
        )

        self.redis_cluster.add_dependency(redis_subnet_group)

        # ECS Cluster
        self.ecs_cluster = ecs.Cluster(
            self,
            "MonitoringCluster",
            cluster_name=f"monitoring-cluster-{env_suffix}",
            vpc=self.vpc,
            container_insights=True
        )

        # Task execution role for ECS
        task_execution_role = iam.Role(
            self,
            "ECSTaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            role_name=f"ecs-task-execution-role-{env_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Allow task execution role to read secrets and decrypt KMS
        self.database.secret.grant_read(task_execution_role)
        self.kms_key.grant_decrypt(task_execution_role)

        # Task role for ECS tasks
        task_role = iam.Role(
            self,
            "ECSTaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            role_name=f"ecs-task-role-{env_suffix}"
        )

        # Grant task role access to resources
        self.kinesis_stream.grant_write(task_role)
        self.kms_key.grant_encrypt_decrypt(task_role)

        # ECS Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            "MonitoringTaskDef",
            family=f"monitoring-task-{env_suffix}",
            cpu=256,
            memory_limit_mib=512,
            execution_role=task_execution_role,
            task_role=task_role
        )

        # Add container to task definition
        container = task_definition.add_container(
            "MonitoringContainer",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="monitoring",
                log_group=self.log_group
            ),
            environment={
                "ENVIRONMENT": env_suffix,
                "KINESIS_STREAM": self.kinesis_stream.stream_name,
                "DB_HOST": self.database.db_instance_endpoint_address,
                "DB_NAME": "monitoring"
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # ECS Fargate Service
        self.ecs_service = ecs.FargateService(
            self,
            "MonitoringService",
            cluster=self.ecs_cluster,
            task_definition=task_definition,
            service_name=f"monitoring-service-{env_suffix}",
            desired_count=2,
            security_groups=[self.ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            assign_public_ip=True
        )

        # API Gateway REST API
        self.api_gateway = apigw.RestApi(
            self,
            "MonitoringAPI",
            rest_api_name=f"monitoring-api-{env_suffix}",
            description="FedRAMP-compliant monitoring API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigw.LogGroupLogDestination(
                    self.log_group
                )
            ),
            cloud_watch_role=True
        )

        # Create WAF Web ACL for API Gateway
        waf_web_acl = wafv2.CfnWebACL(
            self,
            "APIGatewayWAF",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(
                allow={}
            ),
            scope="REGIONAL",
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"monitoring-api-waf-{env_suffix}",
                sampled_requests_enabled=True
            ),
            name=f"monitoring-api-waf-{env_suffix}",
            rules=[
                # AWS Managed Rules - Core Rule Set
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet"
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSet",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Rules - Known Bad Inputs
                wafv2.CfnWebACL.RuleProperty(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(none={}),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet"
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="AWSManagedRulesKnownBadInputsRuleSet",
                        sampled_requests_enabled=True
                    )
                ),
                # Rate limiting rule
                wafv2.CfnWebACL.RuleProperty(
                    name="RateLimitRule",
                    priority=3,
                    action=wafv2.CfnWebACL.RuleActionProperty(
                        block={}
                    ),
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            aggregate_key_type="IP",
                            limit=2000
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                )
            ]
        )

        # Associate WAF with API Gateway
        wafv2.CfnWebACLAssociation(
            self,
            "APIGatewayWAFAssociation",
            resource_arn=self.api_gateway.deployment_stage.stage_arn,
            web_acl_arn=waf_web_acl.attr_arn
        )

        # Lambda function for API backend
        api_lambda_role = iam.Role(
            self,
            "APILambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"api-lambda-role-{env_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        self.kinesis_stream.grant_write(api_lambda_role)
        self.log_group.grant_write(api_lambda_role)

        api_lambda = cdk.aws_lambda.Function(
            self,
            "APILambdaHandler",
            function_name=f"monitoring-api-handler-{env_suffix}",
            runtime=cdk.aws_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=cdk.aws_lambda.Code.from_inline("""
import json
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Monitoring API - FedRAMP Compliant',
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        })
    }
"""),
            environment={
                "ENVIRONMENT": env_suffix,
                "KINESIS_STREAM": self.kinesis_stream.stream_name,
                "LOG_GROUP": self.log_group.log_group_name
            },
            role=api_lambda_role,
            timeout=cdk.Duration.seconds(30)
        )

        # Add API resource and method
        metrics_resource = self.api_gateway.root.add_resource("metrics")
        metrics_resource.add_method(
            "GET",
            apigw.LambdaIntegration(api_lambda)
        )

        # Tag all resources for FedRAMP compliance
        cdk.Tags.of(self).add("Compliance", "FedRAMP-Moderate")
        cdk.Tags.of(self).add("Environment", env_suffix)
        cdk.Tags.of(self).add("DataClassification", "SBU")

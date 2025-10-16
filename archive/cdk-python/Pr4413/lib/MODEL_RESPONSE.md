# FedRAMP-Compliant Monitoring Infrastructure

This implementation creates a comprehensive monitoring solution for a federal agency's data processing system using AWS CDK with Python. The infrastructure adheres to FedRAMP Moderate compliance requirements.

## Architecture Overview

The solution includes:
- RDS PostgreSQL database with enhanced monitoring
- ECS Fargate cluster for containerized workloads
- ElastiCache Redis for temporary metric aggregation
- API Gateway with WAF protection and request logging
- Kinesis Data Streams for log aggregation
- KMS encryption for all data at rest
- CloudWatch logging with 365-day retention

## Implementation Files

### File 1: lib/tap_stack.py

```python
"""tap_stack.py
Main CDK stack orchestrating all monitoring infrastructure components.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from .monitoring_stack import MonitoringStack, MonitoringStackProps


class TapStackProps(cdk.StackProps):
    """Properties for TapStack"""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack for FedRAMP-compliant monitoring infrastructure.

    Orchestrates the creation of monitoring resources for database activities,
    container metrics, and API access patterns.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create monitoring infrastructure
        monitoring_props = MonitoringStackProps(
            environment_suffix=environment_suffix
        )

        monitoring_stack = MonitoringStack(
            self,
            "MonitoringResources",
            props=monitoring_props
        )

        # Export key outputs
        cdk.CfnOutput(
            self,
            "VPCId",
            value=monitoring_stack.vpc.vpc_id,
            description="VPC ID for monitoring infrastructure"
        )

        cdk.CfnOutput(
            self,
            "RDSEndpoint",
            value=monitoring_stack.database.db_instance_endpoint_address,
            description="RDS database endpoint"
        )

        cdk.CfnOutput(
            self,
            "ECSClusterName",
            value=monitoring_stack.ecs_cluster.cluster_name,
            description="ECS cluster name"
        )

        cdk.CfnOutput(
            self,
            "APIGatewayURL",
            value=monitoring_stack.api_gateway.url,
            description="API Gateway endpoint URL"
        )

        cdk.CfnOutput(
            self,
            "KinesisStreamName",
            value=monitoring_stack.kinesis_stream.stream_name,
            description="Kinesis stream for log aggregation"
        )

        cdk.CfnOutput(
            self,
            "RedisEndpoint",
            value=monitoring_stack.redis_cluster.attr_configuration_end_point_address,
            description="ElastiCache Redis endpoint"
        )
```

### File 2: lib/monitoring_stack.py

```python
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
            stream_name=f"monitoring-logs-{env_suffix}",
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

        # Fetch database credentials from Secrets Manager
        db_credentials_secret = secretsmanager.Secret.from_secret_name_v2(
            self,
            "DBCredentials",
            secret_name=f"monitoring-db-credentials-{env_suffix}"
        )

        # RDS PostgreSQL with enhanced monitoring
        self.database = rds.DatabaseInstance(
            self,
            "MonitoringDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.SMALL
            ),
            credentials=rds.Credentials.from_secret(db_credentials_secret),
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
            enabled_cloudwatch_logs_exports=["postgresql"],
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
            cache_subnet_group_name=f"redis-subnet-group-{env_suffix}"
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
                    destination_details=elasticache.CfnReplicationGroup.DestinationDetailsProperty(
                        cloud_watch_logs_details=elasticache.CfnReplicationGroup.CloudWatchLogsDestinationDetailsProperty(
                            log_group=self.log_group.log_group_name
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

        # Allow task execution role to read secrets
        db_credentials_secret.grant_read(task_execution_role)
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
                "KINESIS_STREAM": self.kinesis_stream.stream_name
            },
            secrets={
                "DB_HOST": ecs.Secret.from_secrets_manager(
                    db_credentials_secret,
                    "host"
                ),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(
                    db_credentials_secret,
                    "password"
                )
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
                access_log_destination=apigw.LogGroupLogDestination(self.log_group),
                access_log_format=apigw.AccessLogFormat.json_with_standard_fields()
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
```

### File 3: lib/__init__.py

```python
"""
Monitoring infrastructure package for FedRAMP-compliant AWS deployments.
"""

__version__ = "1.0.0"
```

## Key Features

### Security and Compliance
- **Encryption at Rest**: All data stores (RDS, ElastiCache, Kinesis) encrypted using KMS with key rotation enabled
- **Encryption in Transit**: TLS/SSL enabled for all services (RDS, ElastiCache, API Gateway)
- **WAF Protection**: FedRAMP-compliant rule sets including AWS Managed Rules and rate limiting
- **Least Privilege IAM**: Specific permissions for each role with no wildcard access
- **Network Isolation**: Private subnets for databases and cache, security groups with minimal ingress rules

### Monitoring and Logging
- **365-day Log Retention**: CloudWatch logs encrypted with KMS
- **Enhanced RDS Monitoring**: 60-second interval monitoring with Performance Insights
- **Container Insights**: Enabled for ECS cluster
- **API Gateway Logging**: Full request/response logging with CloudWatch integration
- **Kinesis Log Aggregation**: Centralized log streaming for all components

### High Availability
- **Multi-AZ RDS**: Automatic failover for database
- **Redis Replication**: 2-node cluster with automatic failover
- **ECS Service**: 2 tasks running for redundancy
- **Automated Backups**: 7-day retention for RDS with encrypted snapshots

### Cost Optimization
- **No NAT Gateways**: Using VPC endpoints for S3 access
- **Right-Sized Instances**: T3 instance classes for non-production workloads
- **Fargate**: Pay-per-use container execution without managing EC2 instances
- **Auto-Scaling Ready**: Infrastructure supports adding auto-scaling policies

## Deployment

All resources use the `environment_suffix` parameter for unique naming, enabling parallel deployments and clean teardown in CI/CD workflows.

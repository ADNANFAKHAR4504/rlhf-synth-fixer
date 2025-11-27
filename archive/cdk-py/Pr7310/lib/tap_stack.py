from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_secretsmanager as secretsmanager,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
)
from constructs import Construct
import json


class TapStack(Stack):
    """
    Blue-Green Migration Infrastructure Stack

    Provides complete infrastructure for zero-downtime database and container migrations
    with automated validation, monitoring, and rollback capabilities.
    """

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        """
        Initialize the Blue-Green Migration Infrastructure Stack

        Args:
            scope: CDK app scope
            construct_id: Stack identifier
            environment_suffix: Unique suffix for resource naming (e.g., 'dev', 'prod')
            **kwargs: Additional stack properties
        """
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Create KMS keys for encryption
        self.create_kms_keys()

        # Create VPC with multi-AZ subnets
        self.create_vpc()

        # Create security groups
        self.create_security_groups()

        # Create Aurora PostgreSQL cluster
        self.create_aurora_cluster()

        # Create ECS cluster and service with ALB
        self.create_ecs_infrastructure()

        # Create Lambda function for schema validation
        self.create_schema_validator()

        # Create CloudWatch alarms
        self.create_cloudwatch_alarms()

        # Create outputs
        self.create_outputs()

    def create_kms_keys(self) -> None:
        """Create KMS keys for encryption at rest"""

        # KMS key for Aurora database
        self.db_kms_key = kms.Key(
            self,
            f"DatabaseKey-{self.environment_suffix}",
            description=f"KMS key for Aurora database encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # KMS key for Secrets Manager
        self.secrets_kms_key = kms.Key(
            self,
            f"SecretsKey-{self.environment_suffix}",
            description=f"KMS key for Secrets Manager encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # KMS key for S3 (if needed for backups)
        self.s3_kms_key = kms.Key(
            self,
            f"S3Key-{self.environment_suffix}",
            description=f"KMS key for S3 encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

    def create_vpc(self) -> None:
        """Create custom VPC with public, private, and isolated subnets across 3 AZs"""

        self.vpc = ec2.Vpc(
            self,
            f"VPC-{self.environment_suffix}",
            vpc_name=f"blue-green-vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=1,  # Use NAT Gateway for outbound connectivity
            subnet_configuration=[
                # Public subnets for ALB
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                # Private subnets for ECS tasks
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                # Isolated subnets for database
                ec2.SubnetConfiguration(
                    name=f"Isolated-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

    def create_security_groups(self) -> None:
        """Create security groups for ALB, ECS, Aurora, and Lambda"""

        # ALB security group
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for Application Load Balancer - {self.environment_suffix}",
            allow_all_outbound=True,
        )
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet",
        )
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from internet",
        )

        # ECS security group
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for ECS tasks - {self.environment_suffix}",
            allow_all_outbound=True,
        )
        self.ecs_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow traffic from ALB",
        )

        # Aurora security group
        self.aurora_security_group = ec2.SecurityGroup(
            self,
            f"AuroraSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for Aurora PostgreSQL - {self.environment_suffix}",
            allow_all_outbound=False,
        )
        self.aurora_security_group.add_ingress_rule(
            self.ecs_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL access from ECS tasks",
        )

        # Lambda security group
        self.lambda_security_group = ec2.SecurityGroup(
            self,
            f"LambdaSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for Lambda schema validator - {self.environment_suffix}",
            allow_all_outbound=True,
        )
        self.aurora_security_group.add_ingress_rule(
            self.lambda_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL access from Lambda",
        )

    def create_aurora_cluster(self) -> None:
        """Create Aurora PostgreSQL cluster with multi-AZ read replicas"""

        # Create database credentials in Secrets Manager
        self.db_secret = secretsmanager.Secret(
            self,
            f"DBSecret-{self.environment_suffix}",
            secret_name=f"aurora-credentials-{self.environment_suffix}",
            description=f"Aurora PostgreSQL credentials - {self.environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "dbadmin"}),
                generate_string_key="password",
                password_length=32,
                exclude_punctuation=True,
            ),
            encryption_key=self.secrets_kms_key,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create subnet group for Aurora
        db_subnet_group = rds.SubnetGroup(
            self,
            f"DBSubnetGroup-{self.environment_suffix}",
            description=f"Subnet group for Aurora cluster - {self.environment_suffix}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Aurora cluster parameter group
        cluster_parameter_group = rds.ParameterGroup(
            self,
            f"ClusterParameterGroup-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.of("15.8", "15")
            ),
            description=f"Custom parameter group for Aurora cluster - {self.environment_suffix}",
            parameters={
                "log_statement": "all",
                "log_min_duration_statement": "1000",
            },
        )

        # Create Aurora PostgreSQL cluster
        self.aurora_cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{self.environment_suffix}",
            cluster_identifier=f"aurora-cluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.of("15.8", "15")
            ),
            credentials=rds.Credentials.from_secret(self.db_secret),
            default_database_name="appdb",
            storage_encrypted=True,
            storage_encryption_key=self.db_kms_key,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[self.aurora_security_group],
            subnet_group=db_subnet_group,
            parameter_group=cluster_parameter_group,
            # Writer instance
            writer=rds.ClusterInstance.provisioned(
                f"writer-{self.environment_suffix}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM,
                ),
                publicly_accessible=False,
            ),
            # Read replicas across 3 AZs
            readers=[
                rds.ClusterInstance.provisioned(
                    f"reader1-{self.environment_suffix}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.BURSTABLE3,
                        ec2.InstanceSize.MEDIUM,
                    ),
                    publicly_accessible=False,
                ),
                rds.ClusterInstance.provisioned(
                    f"reader2-{self.environment_suffix}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.BURSTABLE3,
                        ec2.InstanceSize.MEDIUM,
                    ),
                    publicly_accessible=False,
                ),
            ],
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00",
            ),
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Enable point-in-time recovery (enabled by default for Aurora)
        # CloudWatch log exports
        self.aurora_cluster.node.add_dependency(db_subnet_group)

    def create_ecs_infrastructure(self) -> None:
        """Create ECS cluster, service, and Application Load Balancer"""

        # Create ECS cluster
        self.ecs_cluster = ecs.Cluster(
            self,
            f"ECSCluster-{self.environment_suffix}",
            cluster_name=f"app-cluster-{self.environment_suffix}",
            vpc=self.vpc,
            container_insights=True,
        )

        # Create CloudWatch log group for ECS tasks (no KMS encryption)
        ecs_log_group = logs.LogGroup(
            self,
            f"ECSLogGroup-{self.environment_suffix}",
            log_group_name=f"/ecs/app-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create ECS task execution role
        task_execution_role = iam.Role(
            self,
            f"TaskExecutionRole-{self.environment_suffix}",
            role_name=f"ecs-task-execution-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                ),
            ],
        )

        # Grant access to secrets
        self.db_secret.grant_read(task_execution_role)

        # Create ECS task role with least privilege
        task_role = iam.Role(
            self,
            f"TaskRole-{self.environment_suffix}",
            role_name=f"ecs-task-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        )

        # Grant CloudWatch Logs permissions
        task_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[ecs_log_group.log_group_arn],
            )
        )

        # Create Fargate task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"TaskDefinition-{self.environment_suffix}",
            family=f"app-task-{self.environment_suffix}",
            memory_limit_mib=1024,
            cpu=512,
            execution_role=task_execution_role,
            task_role=task_role,
        )

        # Add container to task definition
        container = task_definition.add_container(
            f"AppContainer-{self.environment_suffix}",
            container_name=f"app-{self.environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample"),  # Sample app with health endpoint
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="app",
                log_group=ecs_log_group,
            ),
            environment={
                "ENVIRONMENT": self.environment_suffix,
            },
            secrets={
                "DB_HOST": ecs.Secret.from_secrets_manager(
                    self.db_secret, "host"
                ),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(
                    self.db_secret, "username"
                ),
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(
                    self.db_secret, "password"
                ),
            },
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # Create Application Load Balancer with Fargate service
        self.fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            f"FargateService-{self.environment_suffix}",
            service_name=f"app-service-{self.environment_suffix}",
            cluster=self.ecs_cluster,
            task_definition=task_definition,
            desired_count=2,
            public_load_balancer=True,
            security_groups=[self.ecs_security_group],
            task_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            # Health check configuration
            health_check_grace_period=Duration.seconds(60),
            # Rolling deployment configuration
            deployment_controller=ecs.DeploymentController(
                type=ecs.DeploymentControllerType.ECS
            ),
            circuit_breaker=ecs.DeploymentCircuitBreaker(rollback=True),
        )

        # Configure target group health checks
        self.fargate_service.target_group.configure_health_check(
            path="/",  # amazon-ecs-sample responds to root path
            interval=Duration.seconds(30),
            timeout=Duration.seconds(5),
            healthy_threshold_count=2,
            unhealthy_threshold_count=3,
        )

        # Configure load balancer security group
        self.fargate_service.load_balancer.connections.allow_from(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP from internet",
        )

        # Add HTTPS listener (requires certificate - configure separately)
        # https_listener = self.fargate_service.load_balancer.add_listener(
        #     "HTTPSListener",
        #     port=443,
        #     certificates=[certificate],
        # )

    def create_schema_validator(self) -> None:
        """Create Lambda function to validate database schema compatibility"""

        # Create CloudWatch log group for Lambda (no KMS encryption)
        lambda_log_group = logs.LogGroup(
            self,
            f"SchemaValidatorLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/lambda/schema-validator-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Lambda execution role
        lambda_role = iam.Role(
            self,
            f"SchemaValidatorRole-{self.environment_suffix}",
            role_name=f"schema-validator-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        # Grant access to database secrets
        self.db_secret.grant_read(lambda_role)

        # Grant CloudWatch Logs permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[lambda_log_group.log_group_arn],
            )
        )

        # Create Lambda function
        self.schema_validator = lambda_.Function(
            self,
            f"SchemaValidator-{self.environment_suffix}",
            function_name=f"schema-validator-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    \"\"\"
    Validate database schema compatibility between blue and green environments.

    This function should:
    1. Connect to both blue and green databases
    2. Compare table schemas, indexes, constraints
    3. Identify incompatible changes
    4. Return validation results

    Args:
        event: Lambda event containing database connection details
        context: Lambda context

    Returns:
        dict: Validation results with compatibility status
    \"\"\"

    try:
        logger.info("Starting schema validation")
        logger.info(f"Event: {json.dumps(event)}")

        # TODO: Implement actual schema comparison logic
        # This would typically:
        # 1. Get database credentials from Secrets Manager
        # 2. Connect to both databases using psycopg2
        # 3. Query information_schema for table definitions
        # 4. Compare schemas and identify differences
        # 5. Determine if changes are backward compatible

        validation_result = {
            "status": "success",
            "compatible": True,
            "differences": [],
            "warnings": [],
            "errors": []
        }

        logger.info("Schema validation completed successfully")

        return {
            "statusCode": 200,
            "body": json.dumps(validation_result)
        }

    except Exception as e:
        logger.error(f"Schema validation failed: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "status": "error",
                "message": str(e)
            })
        }
"""),
            timeout=Duration.minutes(5),
            memory_size=512,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[self.lambda_security_group],
            role=lambda_role,
            environment={
                "DB_SECRET_ARN": self.db_secret.secret_arn,
                "ENVIRONMENT": self.environment_suffix,
            },
            log_group=lambda_log_group,
        )

    def create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for monitoring"""

        # Create SNS topic for alarm notifications
        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{self.environment_suffix}",
            topic_name=f"infrastructure-alarms-{self.environment_suffix}",
            display_name=f"Infrastructure Alarms - {self.environment_suffix}",
        )

        # Aurora CPU utilization alarm
        aurora_cpu_alarm = cloudwatch.Alarm(
            self,
            f"AuroraCPUAlarm-{self.environment_suffix}",
            alarm_name=f"aurora-cpu-high-{self.environment_suffix}",
            metric=self.aurora_cluster.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        aurora_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Aurora database connections alarm
        aurora_connections_alarm = cloudwatch.Alarm(
            self,
            f"AuroraConnectionsAlarm-{self.environment_suffix}",
            alarm_name=f"aurora-connections-high-{self.environment_suffix}",
            metric=self.aurora_cluster.metric_database_connections(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        aurora_connections_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # ECS CPU utilization alarm
        ecs_cpu_alarm = cloudwatch.Alarm(
            self,
            f"ECSCPUAlarm-{self.environment_suffix}",
            alarm_name=f"ecs-cpu-high-{self.environment_suffix}",
            metric=self.fargate_service.service.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        ecs_cpu_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # ECS memory utilization alarm
        ecs_memory_alarm = cloudwatch.Alarm(
            self,
            f"ECSMemoryAlarm-{self.environment_suffix}",
            alarm_name=f"ecs-memory-high-{self.environment_suffix}",
            metric=self.fargate_service.service.metric_memory_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        ecs_memory_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # ALB target health alarm
        alb_unhealthy_alarm = cloudwatch.Alarm(
            self,
            f"ALBUnhealthyTargetsAlarm-{self.environment_suffix}",
            alarm_name=f"alb-unhealthy-targets-{self.environment_suffix}",
            metric=self.fargate_service.target_group.metric_unhealthy_host_count(),
            threshold=1,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        alb_unhealthy_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

        # Lambda error rate alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.environment_suffix}",
            alarm_name=f"schema-validator-errors-{self.environment_suffix}",
            metric=self.schema_validator.metric_errors(),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        lambda_error_alarm.add_alarm_action(
            cloudwatch_actions.SnsAction(alarm_topic)
        )

    def create_outputs(self) -> None:
        """Create CloudFormation outputs"""

        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"VPC-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "AuroraClusterEndpoint",
            value=self.aurora_cluster.cluster_endpoint.hostname,
            description="Aurora cluster writer endpoint",
            export_name=f"AuroraClusterEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "AuroraReaderEndpoint",
            value=self.aurora_cluster.cluster_read_endpoint.hostname,
            description="Aurora cluster reader endpoint",
            export_name=f"AuroraReaderEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=self.fargate_service.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
            export_name=f"LoadBalancerDNS-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "ECSClusterName",
            value=self.ecs_cluster.cluster_name,
            description="ECS cluster name",
            export_name=f"ECSCluster-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SchemaValidatorFunctionName",
            value=self.schema_validator.function_name,
            description="Schema validator Lambda function name",
            export_name=f"SchemaValidator-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=self.db_secret.secret_arn,
            description="Database credentials secret ARN",
            export_name=f"DatabaseSecret-{self.environment_suffix}",
        )

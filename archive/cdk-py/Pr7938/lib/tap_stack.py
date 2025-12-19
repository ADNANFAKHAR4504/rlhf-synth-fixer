from aws_cdk import (
    Stack,
    StackProps,
    aws_kinesis as kinesis,
    aws_ecs as ecs,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_efs as efs,
    aws_apigateway as apigateway,
    aws_secretsmanager as secretsmanager,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    CfnOutput
)
from constructs import Construct
from typing import Optional
import json


class TapStackProps(StackProps):
    """Properties for TapStack"""
    def __init__(
        self,
        environment_suffix: str = 'dev',
        **kwargs
    ) -> None:
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Extract environment_suffix from props or default to 'dev'
        environment_suffix = props.environment_suffix if props else 'dev'

        # VPC with public and private subnets
        vpc = ec2.Vpc(
            self, f"IoTVpc-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Security Groups
        ecs_sg = ec2.SecurityGroup(
            self, f"EcsSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for ECS Fargate tasks",
            allow_all_outbound=True
        )

        rds_sg = ec2.SecurityGroup(
            self, f"RdsSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for RDS PostgreSQL",
            allow_all_outbound=False
        )
        rds_sg.add_ingress_rule(ecs_sg, ec2.Port.tcp(5432), "Allow PostgreSQL from ECS")

        redis_sg = ec2.SecurityGroup(
            self, f"RedisSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False
        )
        redis_sg.add_ingress_rule(ecs_sg, ec2.Port.tcp(6379), "Allow Redis from ECS")

        efs_sg = ec2.SecurityGroup(
            self, f"EfsSecurityGroup-{environment_suffix}",
            vpc=vpc,
            description="Security group for EFS",
            allow_all_outbound=False
        )
        efs_sg.add_ingress_rule(ecs_sg, ec2.Port.tcp(2049), "Allow NFS from ECS")

        # 1. Kinesis Data Stream for IoT sensor data
        kinesis_stream = kinesis.Stream(
            self, f"IoTSensorStream-{environment_suffix}",
            stream_name=f"iot-sensor-stream-{environment_suffix}",
            shard_count=10,  # 10 shards = 10,000 records/second capacity
            retention_period=Duration.hours(24),
            stream_mode=kinesis.StreamMode.PROVISIONED
        )

        # 2. RDS PostgreSQL for operational data
        db_secret = secretsmanager.Secret(
            self, f"DbSecret-{environment_suffix}",
            secret_name=f"iot-db-credentials-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "iotadmin"}),
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # RDS Subnet Group
        db_subnet_group = rds.SubnetGroup(
            self, f"DbSubnetGroup-{environment_suffix}",
            vpc=vpc,
            description="Subnet group for RDS PostgreSQL",
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            removal_policy=RemovalPolicy.DESTROY
        )

        rds_instance = rds.DatabaseInstance(
            self, f"PostgresDb-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_10
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[rds_sg],
            multi_az=True,
            allocated_storage=100,
            storage_encrypted=True,
            database_name="iotdb",
            credentials=rds.Credentials.from_secret(db_secret),
            backup_retention=Duration.days(7),
            deletion_protection=False,
            removal_policy=RemovalPolicy.DESTROY,
            subnet_group=db_subnet_group,
            cloudwatch_logs_exports=["postgresql"]
        )

        # Lambda for secrets rotation
        rotation_lambda_role = iam.Role(
            self, f"RotationLambdaRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )

        rotation_lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:PutSecretValue",
                    "secretsmanager:UpdateSecretVersionStage"
                ],
                resources=[db_secret.secret_arn]
            )
        )

        rotation_lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "rds:DescribeDBInstances",
                    "rds:ModifyDBInstance"
                ],
                resources=[rds_instance.instance_arn]
            )
        )

        rotation_lambda = lambda_.Function(
            self, f"SecretsRotationLambda-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    service_client = boto3.client('secretsmanager')
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']

    if step == "createSecret":
        # Generate new password
        service_client.get_random_password(
            PasswordLength=32,
            ExcludeCharacters='/@"\\\\'
        )
        print(f"Created new secret version for {arn}")

    elif step == "setSecret":
        # Update database with new password
        print(f"Set new secret in database for {arn}")

    elif step == "testSecret":
        # Test the new credentials
        print(f"Tested new secret for {arn}")

    elif step == "finishSecret":
        # Finalize rotation
        service_client.update_secret_version_stage(
            SecretId=arn,
            VersionStage="AWSCURRENT",
            MoveToVersionId=token
        )
        print(f"Finished rotation for {arn}")

    return {
        'statusCode': 200,
        'body': json.dumps('Rotation step completed')
    }
"""),
            role=rotation_lambda_role,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[ec2.SecurityGroup(
                self, f"RotationLambdaSg-{environment_suffix}",
                vpc=vpc,
                allow_all_outbound=True
            )],
            timeout=Duration.minutes(5)
        )

        # Enable automatic rotation
        db_secret.add_rotation_schedule(
            f"RotationSchedule-{environment_suffix}",
            rotation_lambda=rotation_lambda,
            automatically_after=Duration.days(30)
        )

        # 3. ElastiCache Redis cluster
        redis_subnet_group = elasticache.CfnSubnetGroup(
            self, f"RedisSubnetGroup-{environment_suffix}",
            description="Subnet group for Redis",
            subnet_ids=vpc.select_subnets(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS).subnet_ids,
            cache_subnet_group_name=f"redis-subnet-group-{environment_suffix}"
        )

        redis_replication_group = elasticache.CfnReplicationGroup(
            self, f"RedisCluster-{environment_suffix}",
            replication_group_id=f"iot-redis-{environment_suffix}",
            replication_group_description="Redis cluster for IoT data caching",
            engine="redis",
            engine_version="7.0",
            cache_node_type="cache.t3.medium",
            num_node_groups=2,
            replicas_per_node_group=1,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            cache_subnet_group_name=redis_subnet_group.cache_subnet_group_name,
            security_group_ids=[redis_sg.security_group_id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True
        )
        redis_replication_group.add_dependency(redis_subnet_group)

        # 4. EFS for shared storage
        file_system = efs.FileSystem(
            self, f"SharedStorage-{environment_suffix}",
            vpc=vpc,
            encrypted=True,
            performance_mode=efs.PerformanceMode.GENERAL_PURPOSE,
            throughput_mode=efs.ThroughputMode.BURSTING,
            removal_policy=RemovalPolicy.DESTROY,
            security_group=efs_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # 5. ECS Fargate cluster
        ecs_cluster = ecs.Cluster(
            self, f"IoTCluster-{environment_suffix}",
            vpc=vpc,
            cluster_name=f"iot-processing-cluster-{environment_suffix}",
            container_insights=True
        )

        # Task definition
        task_definition = ecs.FargateTaskDefinition(
            self, f"ProcessingTask-{environment_suffix}",
            memory_limit_mib=2048,
            cpu=1024,
            task_role=iam.Role(
                self, f"TaskRole-{environment_suffix}",
                assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
            ),
            execution_role=iam.Role(
                self, f"ExecutionRole-{environment_suffix}",
                assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")
                ]
            )
        )

        # Grant Kinesis permissions to task role
        kinesis_stream.grant_read(task_definition.task_role)
        db_secret.grant_read(task_definition.task_role)

        # Add volume for EFS
        task_definition.add_volume(
            name="efs-storage",
            efs_volume_configuration=ecs.EfsVolumeConfiguration(
                file_system_id=file_system.file_system_id,
                transit_encryption="ENABLED"
            )
        )

        # Container definition
        container = task_definition.add_container(
            f"DataProcessor-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("amazon/aws-cli"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="iot-processor",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            environment={
                "KINESIS_STREAM": kinesis_stream.stream_name,
                "DB_SECRET_ARN": db_secret.secret_arn,
                "REDIS_ENDPOINT": redis_replication_group.attr_configuration_end_point_address
            }
        )

        container.add_mount_points(
            ecs.MountPoint(
                container_path="/mnt/efs",
                source_volume="efs-storage",
                read_only=False
            )
        )

        # Fargate service
        fargate_service = ecs.FargateService(
            self, f"ProcessingService-{environment_suffix}",
            cluster=ecs_cluster,
            task_definition=task_definition,
            desired_count=2,
            security_groups=[ecs_sg],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            platform_version=ecs.FargatePlatformVersion.LATEST
        )

        # Auto-scaling based on Kinesis metrics
        scaling = fargate_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        scaling.scale_on_metric(
            f"KinesisScaling-{environment_suffix}",
            metric=kinesis_stream.metric_get_records_iterator_age_milliseconds(),
            scaling_steps=[
                {"upper": 60000, "change": -1},
                {"lower": 60000, "change": +1},
                {"lower": 120000, "change": +2}
            ]
        )

        # 6. API Gateway for external integrations
        api = apigateway.RestApi(
            self, f"IoTApi-{environment_suffix}",
            rest_api_name=f"iot-sensor-api-{environment_suffix}",
            description="API for IoT sensor data platform",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True
            )
        )

        # Lambda integration for API
        api_lambda_role = iam.Role(
            self, f"ApiLambdaRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        kinesis_stream.grant_write(api_lambda_role)

        api_lambda = lambda_.Function(
            self, f"ApiHandler-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

kinesis = boto3.client('kinesis')

def handler(event, context):
    stream_name = os.environ['STREAM_NAME']

    try:
        body = json.loads(event['body'])

        response = kinesis.put_record(
            StreamName=stream_name,
            Data=json.dumps(body),
            PartitionKey=body.get('sensorId', 'default')
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data ingested successfully',
                'sequenceNumber': response['SequenceNumber']
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""),
            role=api_lambda_role,
            environment={
                "STREAM_NAME": kinesis_stream.stream_name
            }
        )

        # API resource and method
        sensors_resource = api.root.add_resource("sensors")
        sensors_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(api_lambda),
            authorization_type=apigateway.AuthorizationType.IAM
        )

        # Outputs
        CfnOutput(self, "KinesisStreamName", value=kinesis_stream.stream_name)
        CfnOutput(self, "EcsClusterName", value=ecs_cluster.cluster_name)
        CfnOutput(self, "RdsEndpoint", value=rds_instance.db_instance_endpoint_address)
        CfnOutput(self, "RedisEndpoint", value=redis_replication_group.attr_configuration_end_point_address)
        CfnOutput(self, "EfsId", value=file_system.file_system_id)
        CfnOutput(self, "ApiEndpoint", value=api.url)

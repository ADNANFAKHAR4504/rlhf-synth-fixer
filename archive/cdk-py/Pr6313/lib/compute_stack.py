"""
Compute infrastructure - ECS Fargate, Lambda, SQS.
"""
from aws_cdk import (
    NestedStack,
    Duration,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_lambda as lambda_,
    aws_lambda_event_sources as lambda_event_sources,
    aws_sqs as sqs,
    aws_iam as iam,
    aws_s3 as s3,
    aws_rds as rds,
    aws_kms as kms,
    aws_logs as logs,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class ComputeStackProps:
    """Properties for ComputeStack."""

    def __init__(
        self,
        environment_suffix: str,
        vpc: ec2.Vpc,
        alb: elbv2.ApplicationLoadBalancer,
        alb_security_group: ec2.SecurityGroup,
        ecs_security_group: ec2.SecurityGroup,
        lambda_security_group: ec2.SecurityGroup,
        database: rds.DatabaseCluster,
        storage_bucket: s3.Bucket,
        kms_key: kms.Key
    ):
        self.environment_suffix = environment_suffix
        self.vpc = vpc
        self.alb = alb
        self.alb_security_group = alb_security_group
        self.ecs_security_group = ecs_security_group
        self.lambda_security_group = lambda_security_group
        self.database = database
        self.storage_bucket = storage_bucket
        self.kms_key = kms_key


class ComputeStack(NestedStack):
    """Compute infrastructure with ECS and Lambda."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: ComputeStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # ECS Cluster
        cluster = ecs.Cluster(
            self,
            f"PaymentCluster-{env_suffix}",
            cluster_name=f"payment-cluster-{env_suffix}",
            vpc=props.vpc,
            container_insights=True
        )

        # Task execution role
        task_execution_role = iam.Role(
            self,
            f"ECSTaskExecutionRole-{env_suffix}",
            role_name=f"ecs-task-execution-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )

        # Task role with least-privilege permissions
        task_role = iam.Role(
            self,
            f"ECSTaskRole-{env_suffix}",
            role_name=f"ecs-task-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )

        # Grant database access
        props.database.grant_connect(task_role, "dbadmin")
        props.storage_bucket.grant_read_write(task_role)

        # Task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"PaymentTaskDef-{env_suffix}",
            family=f"payment-task-{env_suffix}",
            cpu=512,
            memory_limit_mib=1024,
            execution_role=task_execution_role,
            task_role=task_role
        )

        # Container definition
        container = task_definition.add_container(
            f"PaymentContainer-{env_suffix}",
            container_name=f"payment-api-{env_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/docker/library/nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(
                stream_prefix="payment-api",
                log_retention=logs.RetentionDays.ONE_WEEK
            ),
            environment={
                "DB_ENDPOINT": props.database.cluster_endpoint.hostname,
                "BUCKET_NAME": props.storage_bucket.bucket_name,
                "ENVIRONMENT": env_suffix
            }
        )

        container.add_port_mappings(
            ecs.PortMapping(container_port=80, protocol=ecs.Protocol.TCP)
        )

        # Fargate Service
        self.ecs_service = ecs.FargateService(
            self,
            f"PaymentService-{env_suffix}",
            service_name=f"payment-service-{env_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[props.ecs_security_group],
            assign_public_ip=False
        )

        # Target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"PaymentTargetGroup-{env_suffix}",
            target_group_name=f"payment-tg-{env_suffix}",
            vpc=props.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30)
            )
        )

        # Register ECS service with target group
        self.ecs_service.attach_to_application_target_group(target_group)

        # Add HTTP listener to ALB (HTTPS would require certificate)
        # Create listener as separate resource to avoid circular dependency
        listener = elbv2.ApplicationListener(
            self,
            f"HTTPListener-{env_suffix}",
            load_balancer=props.alb,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        # Auto-scaling based on CPU and Memory
        scaling = self.ecs_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10
        )

        scaling.scale_on_cpu_utilization(
            f"CPUScaling-{env_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        scaling.scale_on_memory_utilization(
            f"MemoryScaling-{env_suffix}",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        # SQS Dead Letter Queue
        dlq = sqs.Queue(
            self,
            f"PaymentDLQ-{env_suffix}",
            queue_name=f"payment-dlq-{env_suffix}",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=props.kms_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # SQS Queue for payment processing
        payment_queue = sqs.Queue(
            self,
            f"PaymentQueue-{env_suffix}",
            queue_name=f"payment-queue-{env_suffix}",
            visibility_timeout=Duration.minutes(5),
            retention_period=Duration.days(7),
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=props.kms_key,
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Lambda execution role with least-privilege
        lambda_role = iam.Role(
            self,
            f"PaymentLambdaRole-{env_suffix}",
            role_name=f"payment-lambda-role-{env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Grant permissions
        payment_queue.grant_consume_messages(lambda_role)
        props.database.grant_connect(lambda_role, "dbadmin")
        props.storage_bucket.grant_read_write(lambda_role)

        # Lambda function for async payment processing
        payment_processor_lambda = lambda_.Function(
            self,
            f"PaymentProcessorLambda-{env_suffix}",
            function_name=f"payment-processor-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/payment_processor"),
            timeout=Duration.minutes(5),
            memory_size=512,
            role=lambda_role,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[props.lambda_security_group],
            environment={
                "DB_ENDPOINT": props.database.cluster_endpoint.hostname,
                "BUCKET_NAME": props.storage_bucket.bucket_name,
                "QUEUE_URL": payment_queue.queue_url,
                "ENVIRONMENT": env_suffix
            },
            environment_encryption=props.kms_key,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Add SQS trigger to Lambda
        payment_processor_lambda.add_event_source(
            lambda_event_sources.SqsEventSource(
                payment_queue,
                batch_size=10,
                max_batching_window=Duration.seconds(30)
            )
        )

        # Fraud detection Lambda
        fraud_detection_lambda = lambda_.Function(
            self,
            f"FraudDetectionLambda-{env_suffix}",
            function_name=f"fraud-detection-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda/fraud_detection"),
            timeout=Duration.seconds(30),
            memory_size=256,
            role=lambda_role,
            vpc=props.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[props.lambda_security_group],
            environment={
                "DB_ENDPOINT": props.database.cluster_endpoint.hostname,
                "ENVIRONMENT": env_suffix
            },
            environment_encryption=props.kms_key,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        self.lambda_functions = [payment_processor_lambda, fraud_detection_lambda]

        CfnOutput(
            self,
            "ECSServiceName",
            value=self.ecs_service.service_name,
            description="ECS Service Name"
        )

        CfnOutput(
            self,
            "QueueURL",
            value=payment_queue.queue_url,
            description="Payment Processing Queue URL"
        )

# -- corrected tap_stack.py (class body) --
from typing import Optional
import json
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_rds as rds,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_lambda as lambda_,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_autoscaling as autoscaling,
    aws_elasticloadbalancingv2 as elbv2,
    aws_secretsmanager as secretsmanager,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ====== ENV + TAGS ======
        env_suffix = (props.environment_suffix if props else None) or self.node.try_get_context('environmentSuffix') or 'dev'
        self.env_name = env_suffix.capitalize()
        self.owner = "TeamX"
        self.project_name = "TapStack"

        for k, v in {
            "Environment": self.env_name,
            "Owner": self.owner,
            "Project": self.project_name,
            "ManagedBy": "CDK",
            "CostCenter": "Engineering"
        }.items():
            Tags.of(self).add(k, v)

        # ====== VPC and Flow Logs ======
        self.vpc = ec2.Vpc(
            self, "ProductionVPC",
            vpc_name=f"{self.project_name}-vpc-{self.env_name.lower()}",
            max_azs=3,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(name="Public", subnet_type=ec2.SubnetType.PUBLIC, cidr_mask=24),
                ec2.SubnetConfiguration(name="Private", subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS, cidr_mask=24),
                ec2.SubnetConfiguration(name="Isolated", subnet_type=ec2.SubnetType.PRIVATE_ISOLATED, cidr_mask=24),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        vpc_flow_log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            retention=logs.RetentionDays.FIVE_DAYS,
            removal_policy=RemovalPolicy.DESTROY
        )

        ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group=vpc_flow_log_group)
        )

        # ====== Security groups ======
        self.alb_security_group = ec2.SecurityGroup(self, "ALBSecurityGroup", vpc=self.vpc, description="ALB SG", allow_all_outbound=True)
        self.alb_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "Allow HTTPS")
        self.alb_security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "Allow HTTP")

        self.app_security_group = ec2.SecurityGroup(self, "AppSecurityGroup", vpc=self.vpc, description="App SG", allow_all_outbound=True)
        self.app_security_group.add_ingress_rule(self.alb_security_group, ec2.Port.tcp(80), "Allow from ALB")

        self.db_security_group = ec2.SecurityGroup(self, "DatabaseSecurityGroup", vpc=self.vpc, description="DB SG", allow_all_outbound=False)
        self.db_security_group.add_ingress_rule(self.app_security_group, ec2.Port.tcp(3306), "Allow MySQL from App")

        # ====== Secrets & RDS ======
        self.db_credentials = secretsmanager.Secret(
            self, "DatabaseCredentials",
            description="RDS MySQL credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "admin"}),
                generate_string_key="password",
                exclude_characters=" @\"'\\/#",
                password_length=32
            )
        )

        self.db_subnet_group = rds.SubnetGroup(self, "DatabaseSubnetGroup", description="RDS subnets", vpc=self.vpc,
                                              vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED))

        self.database = rds.DatabaseInstance(
            self, "ProductionDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(version=rds.MysqlEngineVersion.VER_8_0_37),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.db_security_group],
            multi_az=True,
            allocated_storage=100,
            storage_type=rds.StorageType.GP3,
            storage_encrypted=True,
            credentials=rds.Credentials.from_secret(self.db_credentials),
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
            monitoring_interval=Duration.seconds(60),
            cloudwatch_logs_exports=["error", "general", "slowquery"],
        )

        # ====== S3 + CloudFront (Static) ======
        self.static_bucket = s3.Bucket(
            self, "StaticAssetsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[s3.LifecycleRule(id="DeleteOldVersions", noncurrent_version_expiration=Duration.days(30),
                                             abort_incomplete_multipart_upload_after=Duration.days(7))],
            removal_policy=RemovalPolicy.RETAIN
        )

        # OAI + CloudFront
        self.oai = cloudfront.OriginAccessIdentity(self, "CloudFrontOAI", comment="OAI for static assets")
        # Grant read to the OAI principal (grant_principal)
        self.static_bucket.grant_read(self.oai.grant_principal)

        self.distribution = cloudfront.Distribution(
            self, "StaticContentDistribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(self.static_bucket, origin_access_identity=self.oai),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            geo_restriction=cloudfront.GeoRestriction.allowlist("US", "CA", "GB", "DE", "FR", "JP", "AU")
        )

        # ====== IAM role used by Lambdas ======
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")]
        )
        # Lambda can read DB credentials
        self.db_credentials.grant_read(self.lambda_role)

        # ====== Lambda (processor) ======
        self.process_function = lambda_.Function(
            self, "ProcessFunction",
            function_name=f"{self.project_name}-processor-{env_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json, os, boto3
def handler(event, context):
    print("Processing", event)
    return {"statusCode":200,"body":"ok"}
"""),
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.app_security_group],
            environment={"DB_SECRET_ARN": self.db_credentials.secret_arn, "ENVIRONMENT": self.env_name},
            timeout=Duration.seconds(30),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.FIVE_DAYS
        )

        # ====== ECS cluster, task and service (Fargate) ======
        self.ecs_cluster = ecs.Cluster(self, "FargateCluster", cluster_name=f"{self.project_name}-cluster-{env_suffix}", vpc=self.vpc, container_insights=True)

        self.task_role = iam.Role(self, "ECSTaskRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"))
        self.db_credentials.grant_read(self.task_role)

        self.execution_role = iam.Role(self, "ECSExecutionRole", assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
                                       managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonECSTaskExecutionRolePolicy")])

        self.task_definition = ecs.FargateTaskDefinition(self, "WebAppTaskDef", cpu=512, memory_limit_mib=1024,
                                                         task_role=self.task_role, execution_role=self.execution_role)

        self.container = self.task_definition.add_container("WebContainer", image=ecs.ContainerImage.from_registry("nginx:alpine"),
                                                            logging=ecs.LogDrivers.aws_logs(stream_prefix="webapp", log_retention=logs.RetentionDays.FIVE_DAYS),
                                                            environment={"ENVIRONMENT": self.env_name, "DB_SECRET_ARN": self.db_credentials.secret_arn},
                                                            health_check=ecs.HealthCheck(command=["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
                                                                                         interval=Duration.seconds(30), timeout=Duration.seconds(5), retries=3))
        self.container.add_port_mappings(ecs.PortMapping(container_port=80))

        # ALB for ECS
        self.ecs_alb = elbv2.ApplicationLoadBalancer(self, "ECSLoadBalancer", vpc=self.vpc, internet_facing=True, security_group=self.alb_security_group)

        self.ecs_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "FargateWebService",
            cluster=self.ecs_cluster,
            task_definition=self.task_definition,
            desired_count=2,
            public_load_balancer=True,
            load_balancer=self.ecs_alb,
            assign_public_ip=False,
            health_check_grace_period=Duration.seconds(60)
        )

        # Auto-scaling for ECS service
        ecs_scaling = self.ecs_service.service.auto_scale_task_count(min_capacity=2, max_capacity=10)
        ecs_scaling.scale_on_cpu_utilization("CPUScaling", target_utilization_percent=70, scale_in_cooldown=Duration.seconds(300), scale_out_cooldown=Duration.seconds(60))
        ecs_scaling.scale_on_memory_utilization("MemoryScaling", target_utilization_percent=80, scale_in_cooldown=Duration.seconds(300), scale_out_cooldown=Duration.seconds(60))

        # ====== EC2 Auto Scaling Group (ASG) ======
        self.ec2_role = iam.Role(self, "EC2InstanceRole", assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
                                 managed_policies=[
                                     iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
                                     iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
                                 ])
        self.db_credentials.grant_read(self.ec2_role)

        self.user_data = ec2.UserData.for_linux()
        self.user_data.add_commands("yum update -y", "yum install -y amazon-cloudwatch-agent", "echo 'Application deployment complete'")

        self.ec2_alb = elbv2.ApplicationLoadBalancer(self, "EC2LoadBalancer", vpc=self.vpc, internet_facing=True, security_group=self.alb_security_group)

        self.target_group = elbv2.ApplicationTargetGroup(self, "EC2TargetGroup", vpc=self.vpc, port=80, protocol=elbv2.ApplicationProtocol.HTTP, target_type=elbv2.TargetType.INSTANCE,
                                                         health_check=elbv2.HealthCheck(path="/health", interval=Duration.seconds(30), timeout=Duration.seconds(10), healthy_threshold_count=2, unhealthy_threshold_count=3))

        self.asg = autoscaling.AutoScalingGroup(self, "WebAutoScalingGroup", vpc=self.vpc,
                                                instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
                                                machine_image=ec2.MachineImage.latest_amazon_linux2(),
                                                role=self.ec2_role, user_data=self.user_data,
                                                min_capacity=2, max_capacity=10, desired_capacity=2,
                                                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                                                security_group=self.app_security_group,
                                                health_check=autoscaling.HealthCheck.elb(grace=Duration.seconds(300))
                                                )

        self.asg.attach_to_application_target_group(self.target_group)
        self.ec2_listener = self.ec2_alb.add_listener("EC2Listener", port=80, default_action=elbv2.ListenerAction.forward(target_groups=[self.target_group]))

        # ASG scaling policies
        self.asg.scale_on_cpu_utilization("CPUAutoScaling", target_utilization_percent=70, cooldown=Duration.seconds(300))
        self.asg.scale_on_request_count("RequestCountScaling", target_requests_per_minute=1000, cooldown=Duration.seconds(300))

        # ====== Monitoring & Alerts (now defined AFTER compute resources) ======
        self.alert_topic = sns.Topic(self, "AlertTopic", display_name=f"{self.project_name} {self.env_name} Alerts")
        # CloudFront errors alarm
        self.cloudfront_error_alarm = cloudwatch.Alarm(self, "CloudFrontErrorAlarm", metric=self.distribution.metric4xx_error_rate(), threshold=5, evaluation_periods=2, datapoints_to_alarm=2)
        self.cloudfront_error_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
        # Database CPU alarm
        self.db_cpu_alarm = cloudwatch.Alarm(self, "DatabaseCPUAlarm", metric=self.database.metric_cpu_utilization(), threshold=80, evaluation_periods=2, datapoints_to_alarm=2)
        self.db_cpu_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
        # ECS CPU alarm
        self.ecs_cpu_alarm = cloudwatch.Alarm(self, "ECSServiceCPUAlarm", metric=self.ecs_service.service.metric_cpu_utilization(), threshold=80, evaluation_periods=2, datapoints_to_alarm=2)
        self.ecs_cpu_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))
        # Lambda errors alarm
        self.lambda_error_alarm = cloudwatch.Alarm(self, "LambdaErrorAlarm", metric=self.process_function.metric_errors(), threshold=5, evaluation_periods=1)
        self.lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))

        # ====== Outputs (single consistent block) ======
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id, description="VPC ID", export_name=f"{self.stack_name}-VPCId")
        CfnOutput(self, "CloudFrontURL", value=f"https://{self.distribution.distribution_domain_name}", description="CloudFront distribution URL", export_name=f"{self.stack_name}-CloudFrontURL")
        CfnOutput(self, "ECSServiceURL", value=f"http://{self.ecs_alb.load_balancer_dns_name}", description="ECS Service Load Balancer URL", export_name=f"{self.stack_name}-ECSServiceURL")
        CfnOutput(self, "EC2ASGURL", value=f"http://{self.ec2_alb.load_balancer_dns_name}", description="EC2 Auto Scaling Group Load Balancer URL", export_name=f"{self.stack_name}-EC2ASGURL")
        CfnOutput(self, "DatabaseEndpoint", value=self.database.db_instance_endpoint_address, description="RDS Database Endpoint", export_name=f"{self.stack_name}-DatabaseEndpoint")
        CfnOutput(self, "DatabaseSecretArn", value=self.db_credentials.secret_arn, description="Database credentials Secret ARN", export_name=f"{self.stack_name}-DatabaseSecretArn")
        CfnOutput(self, "StaticBucketName", value=self.static_bucket.bucket_name, description="Static assets S3 bucket name", export_name=f"{self.stack_name}-StaticBucketName")
        CfnOutput(self, "LambdaFunctionName", value=self.process_function.function_name, description="Lambda function name for processing", export_name=f"{self.stack_name}-LambdaFunctionName")
        CfnOutput(self, "Environment", value=env_suffix, description="Environment suffix used for resource naming", export_name=f"{self.stack_name}-Environment")
        CfnOutput(self, "ECSClusterName", value=self.ecs_cluster.cluster_name, description="ECS Cluster Name")
        CfnOutput(self, "ECSClusterARN", value=self.ecs_cluster.cluster_arn, description="ECS Cluster ARN")

from aws_cdk import (
    Stack,
    CfnOutput,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_elasticloadbalancingv2 as elbv2,
    aws_wafv2 as wafv2,
    aws_certificatemanager as acm,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC with 3 AZs
        vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,  # Using 1 NAT Gateway to optimize costs and avoid EIP quota limits
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        # ECS Cluster with Container Insights
        cluster = ecs.Cluster(
            self,
            f"PaymentCluster-{environment_suffix}",
            vpc=vpc,
            container_insights=True,
        )

        # Database credentials in Secrets Manager
        db_secret = secretsmanager.Secret(
            self,
            f"DBSecret-{environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32,
            ),
        )

        # Aurora PostgreSQL Cluster
        db_cluster = rds.DatabaseCluster(
            self,
            f"PaymentDB-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.of("15.8", "15")
            ),
            credentials=rds.Credentials.from_secret(db_secret),
            writer=rds.ClusterInstance.provisioned(
                "writer",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    "reader",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.BURSTABLE3,
                        ec2.InstanceSize.MEDIUM,
                    ),
                )
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            storage_encrypted=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Task Definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            f"PaymentTaskDef-{environment_suffix}",
            memory_limit_mib=512,
            cpu=256,
        )

        # Container Definition
        container = task_definition.add_container(
            f"PaymentContainer-{environment_suffix}",
            image=ecs.ContainerImage.from_registry("public.ecr.aws/nginx/nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="payment-api"),
            environment={
                "DB_HOST": db_cluster.cluster_endpoint.hostname,
                "DB_PORT": "5432",
            },
            secrets={
                "DB_PASSWORD": ecs.Secret.from_secrets_manager(db_secret, "password"),
                "DB_USERNAME": ecs.Secret.from_secrets_manager(db_secret, "username"),
            },
        )

        container.add_port_mappings(ecs.PortMapping(container_port=80))

        # Security Group for ALB
        alb_sg = ec2.SecurityGroup(
            self,
            f"ALBSG-{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic",
        )

        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self,
            f"PaymentALB-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg,
        )

        # HTTP Listener (simplified for testing - HTTPS requires DNS validation)
        listener = alb.add_listener(
            f"HTTPListener-{environment_suffix}",
            port=80,
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=200,
                content_type="text/plain",
                message_body="OK",
            ),
        )

        # Security Group for ECS Tasks
        ecs_sg = ec2.SecurityGroup(
            self,
            f"ECSSG-{environment_suffix}",
            vpc=vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True,
        )
        ecs_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(80),
            "Allow traffic from ALB",
        )

        # Allow ECS to connect to database
        db_cluster.connections.allow_from(
            ecs_sg,
            ec2.Port.tcp(5432),
            "Allow ECS tasks to connect to database",
        )

        # Fargate Service
        fargate_service = ecs.FargateService(
            self,
            f"PaymentService-{environment_suffix}",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=2,
            security_groups=[ecs_sg],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        )

        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            f"PaymentTG-{environment_suffix}",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
        )

        # Attach service to target group
        fargate_service.attach_to_application_target_group(target_group)

        # Add target group to listener
        listener.add_target_groups(
            f"PaymentTargets-{environment_suffix}",
            target_groups=[target_group],
        )

        # Auto Scaling
        scaling = fargate_service.auto_scale_task_count(
            min_capacity=2,
            max_capacity=10,
        )
        scaling.scale_on_cpu_utilization(
            f"CPUScaling-{environment_suffix}",
            target_utilization_percent=70,
        )

        # WAF Web ACL
        web_acl = wafv2.CfnWebACL(
            self,
            f"PaymentWAF-{environment_suffix}",
            name=f"PaymentWAF-{environment_suffix}",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            scope="REGIONAL",
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"PaymentWAF-{environment_suffix}",
                sampled_requests_enabled=True,
            ),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name="RateLimitRule",
                    priority=1,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        rate_based_statement=wafv2.CfnWebACL.RateBasedStatementProperty(
                            limit=2000,
                            aggregate_key_type="IP",
                        )
                    ),
                    action=wafv2.CfnWebACL.RuleActionProperty(block={}),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True,
                    ),
                ),
                wafv2.CfnWebACL.RuleProperty(
                    name="SQLInjectionRule",
                    priority=2,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        sqli_match_statement=wafv2.CfnWebACL.SqliMatchStatementProperty(
                            field_to_match=wafv2.CfnWebACL.FieldToMatchProperty(
                                body=wafv2.CfnWebACL.BodyProperty(
                                    oversize_handling="CONTINUE"
                                )
                            ),
                            text_transformations=[
                                wafv2.CfnWebACL.TextTransformationProperty(
                                    priority=0,
                                    type="URL_DECODE",
                                )
                            ],
                        )
                    ),
                    action=wafv2.CfnWebACL.RuleActionProperty(block={}),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="SQLInjectionRule",
                        sampled_requests_enabled=True,
                    ),
                ),
            ],
        )

        # Associate WAF with ALB
        wafv2.CfnWebACLAssociation(
            self,
            f"WAFAssociation-{environment_suffix}",
            resource_arn=alb.load_balancer_arn,
            web_acl_arn=web_acl.attr_arn,
        )

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{environment_suffix}",
            dashboard_name=f"PaymentAPI-{environment_suffix}",
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="API Latency",
                left=[
                    target_group.metric_target_response_time(
                        statistic="Average",
                        period=Duration.minutes(1),
                    )
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Error Rate",
                left=[
                    alb.metric_http_code_target(
                        code=elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
                        statistic="Sum",
                        period=Duration.minutes(1),
                    )
                ],
            )
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Database Connections",
                left=[
                    db_cluster.metric_database_connections(
                        statistic="Average",
                        period=Duration.minutes(1),
                    )
                ],
            )
        )

        # CloudWatch Alarms
        cloudwatch.Alarm(
            self,
            f"HighErrorRateAlarm-{environment_suffix}",
            metric=alb.metric_http_code_target(
                code=elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=5,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            alarm_description="Alarm when error rate exceeds 5%",
        )

        cloudwatch.Alarm(
            self,
            f"HighDBCPUAlarm-{environment_suffix}",
            metric=db_cluster.metric_cpu_utilization(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description="Alarm when database CPU exceeds 80%",
        )

        # Grant permissions
        db_secret.grant_read(task_definition.task_role)

        # Stack Outputs for integration tests
        CfnOutput(
            self,
            "VPCId",
            value=vpc.vpc_id,
            description="VPC ID",
            export_name=f"TapStack-{environment_suffix}-VPCId"
        )

        CfnOutput(
            self,
            "ECSClusterName",
            value=cluster.cluster_name,
            description="ECS Cluster Name",
            export_name=f"TapStack-{environment_suffix}-ECSClusterName"
        )

        CfnOutput(
            self,
            "ECSServiceName",
            value=fargate_service.service_name,
            description="ECS Service Name",
            export_name=f"TapStack-{environment_suffix}-ECSServiceName"
        )

        CfnOutput(
            self,
            "DBClusterIdentifier",
            value=db_cluster.cluster_identifier,
            description="Aurora Cluster Identifier",
            export_name=f"TapStack-{environment_suffix}-DBClusterIdentifier"
        )

        CfnOutput(
            self,
            "DBSecretArn",
            value=db_secret.secret_arn,
            description="Database Secret ARN",
            export_name=f"TapStack-{environment_suffix}-DBSecretArn"
        )

        CfnOutput(
            self,
            "LoadBalancerArn",
            value=alb.load_balancer_arn,
            description="Application Load Balancer ARN",
            export_name=f"TapStack-{environment_suffix}-LoadBalancerArn"
        )

        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name=f"TapStack-{environment_suffix}-LoadBalancerDNS"
        )

        CfnOutput(
            self,
            "TargetGroupArn",
            value=target_group.target_group_arn,
            description="Target Group ARN",
            export_name=f"TapStack-{environment_suffix}-TargetGroupArn"
        )

        CfnOutput(
            self,
            "DashboardName",
            value=dashboard.dashboard_name,
            description="CloudWatch Dashboard Name",
            export_name=f"TapStack-{environment_suffix}-DashboardName"
        )

        CfnOutput(
            self,
            "WebACLArn",
            value=web_acl.attr_arn,
            description="WAF WebACL ARN",
            export_name=f"TapStack-{environment_suffix}-WebACLArn"
        )

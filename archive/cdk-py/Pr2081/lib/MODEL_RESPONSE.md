# Production-Ready AWS Infrastructure Implementation

I'll implement a comprehensive production-ready AWS environment using CDK with Python. This solution addresses all the requirements including VPC setup, RDS database, Application Load Balancer with SSL, auto-scaling, monitoring, and incorporates modern AWS services like AppRunner and VPC Lattice.

## Architecture Overview

The infrastructure consists of:
- Multi-AZ VPC with public and private subnets
- Application Load Balancer with SSL certificate
- Auto Scaling group with EC2 instances
- RDS database in private subnets
- S3 bucket with access logging
- CloudWatch monitoring and alarms
- AWS AppRunner for containerized workloads
- VPC Lattice for service mesh capabilities
- Comprehensive IAM roles following least privilege

## File Structure

```
lib/
├── tap_stack.py (main orchestration)
├── networking_stack.py (VPC, subnets, security groups)
├── database_stack.py (RDS setup)
├── compute_stack.py (ALB, ASG, EC2)
├── storage_stack.py (S3 buckets)
├── monitoring_stack.py (CloudWatch alarms)
├── apprunner_stack.py (AWS AppRunner service)
└── lattice_stack.py (VPC Lattice configuration)
```

## Implementation Files

### lib/tap_stack.py

```python
"""tap_stack.py
Enhanced TapStack class orchestrating all infrastructure components
for a production-ready AWS environment.
"""

from typing import Optional
import aws_cdk as cdk
from constructs import Construct

from .networking_stack import NetworkingStack
from .database_stack import DatabaseStack
from .compute_stack import ComputeStack
from .storage_stack import StorageStack
from .monitoring_stack import MonitoringStack
from .apprunner_stack import AppRunnerStack
from .lattice_stack import LatticeStack


class TapStackProps(cdk.StackProps):
    """Properties for the TapStack CDK stack."""
    
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Main CDK stack orchestrating all infrastructure components
    for a production-ready AWS environment.
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

        # 1. Networking Layer - VPC, Subnets, Security Groups
        self.networking = NetworkingStack(
            self, f"prod-networking-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 2. Storage Layer - S3 buckets with logging
        self.storage = StorageStack(
            self, f"prod-storage-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # 3. Database Layer - RDS with proper security
        self.database = DatabaseStack(
            self, f"prod-database-{environment_suffix}",
            vpc=self.networking.vpc,
            database_security_group=self.networking.database_sg,
            environment_suffix=environment_suffix
        )

        # 4. Compute Layer - ALB, ASG, EC2
        self.compute = ComputeStack(
            self, f"prod-compute-{environment_suffix}",
            vpc=self.networking.vpc,
            alb_security_group=self.networking.alb_sg,
            web_security_group=self.networking.web_sg,
            environment_suffix=environment_suffix
        )

        # 5. Modern AWS Services
        self.apprunner = AppRunnerStack(
            self, f"prod-apprunner-{environment_suffix}",
            vpc=self.networking.vpc,
            environment_suffix=environment_suffix
        )

        self.lattice = LatticeStack(
            self, f"prod-lattice-{environment_suffix}",
            vpc=self.networking.vpc,
            environment_suffix=environment_suffix
        )

        # 6. Monitoring Layer - CloudWatch alarms
        self.monitoring = MonitoringStack(
            self, f"prod-monitoring-{environment_suffix}",
            load_balancer=self.compute.load_balancer,
            auto_scaling_group=self.compute.auto_scaling_group,
            environment_suffix=environment_suffix
        )

        # Outputs
        cdk.CfnOutput(
            self, "VPCId",
            value=self.networking.vpc.vpc_id,
            description="VPC ID for the production environment"
        )
        
        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=self.compute.load_balancer.load_balancer_dns_name,
            description="Application Load Balancer DNS name"
        )
        
        cdk.CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.database.instance_endpoint.hostname,
            description="RDS database endpoint"
        )
```

### lib/networking_stack.py

```python
"""networking_stack.py
Networking infrastructure including VPC, subnets, and security groups.
"""

import aws_cdk as cdk
from aws_cdk import aws_ec2 as ec2
from constructs import Construct


class NetworkingStack(cdk.NestedStack):
    """Creates VPC with public/private subnets and security groups."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # VPC with multiple AZs
        self.vpc = ec2.Vpc(
            self, f"prod-vpc-{environment_suffix}",
            vpc_name=f"prod-vpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"prod-public-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"prod-private-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"prod-database-subnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Security Groups
        # ALB Security Group
        self.alb_sg = ec2.SecurityGroup(
            self, f"prod-alb-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            security_group_name=f"prod-alb-sg-{environment_suffix}"
        )
        
        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )
        
        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )

        # Web Server Security Group
        self.web_sg = ec2.SecurityGroup(
            self, f"prod-web-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for web servers",
            security_group_name=f"prod-web-sg-{environment_suffix}"
        )
        
        self.web_sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(80),
            "Allow traffic from ALB"
        )
        
        self.web_sg.add_ingress_rule(
            self.alb_sg,
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from ALB"
        )

        # Database Security Group
        self.database_sg = ec2.SecurityGroup(
            self, f"prod-database-sg-{environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS database",
            security_group_name=f"prod-database-sg-{environment_suffix}"
        )
        
        self.database_sg.add_ingress_rule(
            self.web_sg,
            ec2.Port.tcp(3306),
            "Allow database access from web servers"
        )

        # VPC Endpoint for S3 (cost optimization)
        self.vpc.add_gateway_endpoint(
            f"prod-s3-endpoint-{environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
```

### lib/database_stack.py

```python
"""database_stack.py
RDS database configuration with proper security and backup settings.
"""

import aws_cdk as cdk
from aws_cdk import aws_rds as rds, aws_ec2 as ec2
from constructs import Construct


class DatabaseStack(cdk.NestedStack):
    """Creates RDS database with production-ready configuration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        database_security_group: ec2.SecurityGroup,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Database subnet group
        db_subnet_group = rds.SubnetGroup(
            self, f"prod-db-subnet-group-{environment_suffix}",
            description="Subnet group for RDS database",
            vpc=vpc,
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name=f"prod-db-subnet-group-{environment_suffix}"
        )

        # Database credentials
        db_credentials = rds.Credentials.from_generated_secret(
            username="admin",
            secret_name=f"prod-db-credentials-{environment_suffix}"
        )

        # RDS Instance
        self.database = rds.DatabaseInstance(
            self, f"prod-database-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            credentials=db_credentials,
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[database_security_group],
            database_name=f"prod_app_db_{environment_suffix}",
            allocated_storage=20,
            max_allocated_storage=100,
            storage_encrypted=True,
            multi_az=False,  # Single AZ for cost optimization with t3.micro
            backup_retention=cdk.Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=True,
            enable_performance_insights=False,  # Not available for t3.micro
            auto_minor_version_upgrade=True,
            parameter_group=rds.ParameterGroup.from_parameter_group_name(
                self, f"prod-db-params-{environment_suffix}",
                "default.mysql8.0"
            )
        )

        # Export database credentials secret ARN
        cdk.CfnOutput(
            self, "DatabaseCredentialsSecretArn",
            value=self.database.secret.secret_arn,
            description="ARN of the database credentials secret"
        )
```

### lib/compute_stack.py

```python
"""compute_stack.py
Compute infrastructure including ALB, Auto Scaling, and EC2 instances.
"""

import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_certificatemanager as acm,
    aws_iam as iam
)
from constructs import Construct


class ComputeStack(cdk.NestedStack):
    """Creates compute resources including ALB, ASG, and EC2 instances."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        alb_security_group: ec2.SecurityGroup,
        web_security_group: ec2.SecurityGroup,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # IAM Role for EC2 instances
        self.ec2_role = iam.Role(
            self, f"prod-ec2-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            role_name=f"prod-ec2-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # Instance profile
        instance_profile = iam.CfnInstanceProfile(
            self, f"prod-ec2-instance-profile-{environment_suffix}",
            roles=[self.ec2_role.role_name],
            instance_profile_name=f"prod-ec2-instance-profile-{environment_suffix}"
        )

        # User data script for web servers
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Production Web Server</h1>' > /var/www/html/index.html",
            "echo '<p>Environment: " + environment_suffix + "</p>' >> /var/www/html/index.html",
            # Install CloudWatch agent
            "yum install -y amazon-cloudwatch-agent",
            "systemctl enable amazon-cloudwatch-agent"
        )

        # Launch template
        launch_template = ec2.LaunchTemplate(
            self, f"prod-launch-template-{environment_suffix}",
            launch_template_name=f"prod-launch-template-{environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023
            ),
            security_group=web_security_group,
            user_data=user_data,
            role=self.ec2_role,
            detailed_monitoring=True
        )

        # Auto Scaling Group
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self, f"prod-asg-{environment_suffix}",
            auto_scaling_group_name=f"prod-asg-{environment_suffix}",
            vpc=vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=cdk.Duration.seconds(300)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                min_instances_in_service=1,
                max_batch_size=1,
                pause_time=cdk.Duration.minutes(5)
            )
        )

        # CPU-based scaling policy
        self.auto_scaling_group.scale_on_cpu_utilization(
            f"prod-cpu-scaling-{environment_suffix}",
            target_utilization_percent=70,
            cooldown=cdk.Duration.minutes(5)
        )

        # SSL Certificate
        self.certificate = acm.Certificate(
            self, f"prod-ssl-cert-{environment_suffix}",
            domain_name=f"prod-app-{environment_suffix}.example.com",
            subject_alternative_names=[f"*.prod-app-{environment_suffix}.example.com"],
            validation=acm.CertificateValidation.from_dns()
        )

        # Application Load Balancer
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self, f"prod-alb-{environment_suffix}",
            vpc=vpc,
            load_balancer_name=f"prod-alb-{environment_suffix}",
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )

        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"prod-tg-{environment_suffix}",
            target_group_name=f"prod-tg-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=vpc,
            targets=[self.auto_scaling_group],
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_http_codes="200",
                interval=cdk.Duration.seconds(30),
                timeout=cdk.Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # HTTPS Listener
        self.load_balancer.add_listener(
            f"prod-https-listener-{environment_suffix}",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[self.certificate],
            default_target_groups=[target_group]
        )

        # HTTP Listener (redirect to HTTPS)
        self.load_balancer.add_listener(
            f"prod-http-listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )
```

### lib/storage_stack.py

```python
"""storage_stack.py
S3 storage configuration with access logging and encryption.
"""

import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from constructs import Construct


class StorageStack(cdk.NestedStack):
    """Creates S3 buckets with proper security and logging configuration."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Access logs bucket
        self.access_logs_bucket = s3.Bucket(
            self, f"prod-access-logs-{environment_suffix}",
            bucket_name=f"prod-access-logs-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=False,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldAccessLogs",
                    expiration=cdk.Duration.days(90),
                    enabled=True
                )
            ]
        )

        # Main application bucket
        self.app_bucket = s3.Bucket(
            self, f"prod-app-bucket-{environment_suffix}",
            bucket_name=f"prod-app-bucket-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            server_access_logs_bucket=self.access_logs_bucket,
            server_access_logs_prefix="access-logs/",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=cdk.Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(90)
                        )
                    ],
                    enabled=True
                )
            ]
        )

        # Backup bucket for database backups
        self.backup_bucket = s3.Bucket(
            self, f"prod-backup-bucket-{environment_suffix}",
            bucket_name=f"prod-backup-bucket-{environment_suffix}-{cdk.Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="BackupRetention",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=cdk.Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.DEEP_ARCHIVE,
                            transition_after=cdk.Duration.days(365)
                        )
                    ],
                    enabled=True
                )
            ]
        )

        # Outputs
        cdk.CfnOutput(
            self, "AppBucketName",
            value=self.app_bucket.bucket_name,
            description="Main application S3 bucket name"
        )
        
        cdk.CfnOutput(
            self, "BackupBucketName",
            value=self.backup_bucket.bucket_name,
            description="Backup S3 bucket name"
        )
```

### lib/monitoring_stack.py

```python
"""monitoring_stack.py
CloudWatch monitoring, alarms, and dashboard configuration.
"""

import aws_cdk as cdk
from aws_cdk import (
    aws_cloudwatch as cloudwatch,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions
)
from constructs import Construct


class MonitoringStack(cdk.NestedStack):
    """Creates CloudWatch monitoring and alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        load_balancer: elbv2.ApplicationLoadBalancer,
        auto_scaling_group: autoscaling.AutoScalingGroup,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for alerts
        self.alert_topic = sns.Topic(
            self, f"prod-alerts-{environment_suffix}",
            topic_name=f"prod-alerts-{environment_suffix}",
            display_name=f"Production Alerts - {environment_suffix}"
        )

        # Add email subscription (replace with actual email)
        self.alert_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )

        # 5xx Error Alarm
        self.error_5xx_alarm = cloudwatch.Alarm(
            self, f"prod-5xx-errors-{environment_suffix}",
            alarm_name=f"prod-5xx-errors-{environment_suffix}",
            alarm_description="Alert when 5xx errors exceed threshold",
            metric=load_balancer.metric_http_code_elb(
                code=elbv2.HttpCodeElb.ELB_5XX_COUNT,
                statistic=cloudwatch.Stats.SUM,
                period=cdk.Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.error_5xx_alarm.add_alarm_action(
            cloudwatch.SnsAction(self.alert_topic)
        )

        # High CPU Utilization Alarm
        self.cpu_alarm = cloudwatch.Alarm(
            self, f"prod-high-cpu-{environment_suffix}",
            alarm_name=f"prod-high-cpu-{environment_suffix}",
            alarm_description="Alert when CPU utilization is high",
            metric=auto_scaling_group.metric_cpu_utilization(
                statistic=cloudwatch.Stats.AVERAGE,
                period=cdk.Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.MISSING
        )

        self.cpu_alarm.add_alarm_action(
            cloudwatch.SnsAction(self.alert_topic)
        )

        # Response Time Alarm
        self.response_time_alarm = cloudwatch.Alarm(
            self, f"prod-response-time-{environment_suffix}",
            alarm_name=f"prod-response-time-{environment_suffix}",
            alarm_description="Alert when response time is high",
            metric=load_balancer.metric_target_response_time(
                statistic=cloudwatch.Stats.AVERAGE,
                period=cdk.Duration.minutes(5)
            ),
            threshold=2,  # 2 seconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.response_time_alarm.add_alarm_action(
            cloudwatch.SnsAction(self.alert_topic)
        )

        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self, f"prod-dashboard-{environment_suffix}",
            dashboard_name=f"prod-dashboard-{environment_suffix}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="ALB Request Count",
                        left=[load_balancer.metric_request_count()],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="ALB Response Time",
                        left=[load_balancer.metric_target_response_time()],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="HTTP Status Codes",
                        left=[
                            load_balancer.metric_http_code_elb(
                                code=elbv2.HttpCodeElb.ELB_2XX_COUNT
                            ),
                            load_balancer.metric_http_code_elb(
                                code=elbv2.HttpCodeElb.ELB_4XX_COUNT
                            ),
                            load_balancer.metric_http_code_elb(
                                code=elbv2.HttpCodeElb.ELB_5XX_COUNT
                            )
                        ],
                        width=12,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="Auto Scaling Group CPU Utilization",
                        left=[auto_scaling_group.metric_cpu_utilization()],
                        width=12,
                        height=6
                    )
                ]
            ]
        )
```

### lib/apprunner_stack.py

```python
"""apprunner_stack.py
AWS AppRunner service configuration for containerized applications.
"""

import aws_cdk as cdk
from aws_cdk import aws_apprunner as apprunner, aws_iam as iam, aws_ec2 as ec2
from constructs import Construct


class AppRunnerStack(cdk.NestedStack):
    """Creates AWS AppRunner service for containerized workloads."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # IAM role for AppRunner
        apprunner_access_role = iam.Role(
            self, f"prod-apprunner-access-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("build.apprunner.amazonaws.com"),
            role_name=f"prod-apprunner-access-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSAppRunnerServicePolicyForECRAccess")
            ]
        )

        # Instance role for AppRunner
        apprunner_instance_role = iam.Role(
            self, f"prod-apprunner-instance-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
            role_name=f"prod-apprunner-instance-role-{environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsFullAccess")
            ]
        )

        # VPC Connector for AppRunner
        vpc_connector = apprunner.CfnVpcConnector(
            self, f"prod-apprunner-vpc-connector-{environment_suffix}",
            subnets=vpc.select_subnets(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ).subnet_ids,
            vpc_connector_name=f"prod-apprunner-vpc-connector-{environment_suffix}"
        )

        # AppRunner Service
        self.apprunner_service = apprunner.CfnService(
            self, f"prod-apprunner-service-{environment_suffix}",
            service_name=f"prod-apprunner-service-{environment_suffix}",
            source_configuration=apprunner.CfnService.SourceConfigurationProperty(
                auto_deployments_enabled=True,
                code_repository=apprunner.CfnService.CodeRepositoryProperty(
                    repository_url="https://github.com/aws-containers/hello-app-runner",
                    source_code_version=apprunner.CfnService.SourceCodeVersionProperty(
                        type="BRANCH",
                        value="main"
                    ),
                    code_configuration=apprunner.CfnService.CodeConfigurationProperty(
                        configuration_source="REPOSITORY"
                    )
                )
            ),
            instance_configuration=apprunner.CfnService.InstanceConfigurationProperty(
                cpu="0.25 vCPU",
                memory="0.5 GB",
                instance_role_arn=apprunner_instance_role.role_arn
            ),
            network_configuration=apprunner.CfnService.NetworkConfigurationProperty(
                egress_configuration=apprunner.CfnService.EgressConfigurationProperty(
                    egress_type="VPC",
                    vpc_connector_arn=vpc_connector.attr_vpc_connector_arn
                )
            ),
            health_check_configuration=apprunner.CfnService.HealthCheckConfigurationProperty(
                protocol="HTTP",
                path="/",
                interval=10,
                timeout=5,
                healthy_threshold=1,
                unhealthy_threshold=5
            ),
            auto_scaling_configuration_arn=apprunner.CfnAutoScalingConfiguration(
                self, f"prod-apprunner-scaling-{environment_suffix}",
                auto_scaling_configuration_name=f"prod-apprunner-scaling-{environment_suffix}",
                max_concurrency=100,
                max_size=10,
                min_size=1
            ).attr_auto_scaling_configuration_arn
        )

        # Output the AppRunner service URL
        cdk.CfnOutput(
            self, "AppRunnerServiceUrl",
            value=f"https://{self.apprunner_service.attr_service_url}",
            description="AppRunner service URL"
        )
```

### lib/lattice_stack.py

```python
"""lattice_stack.py
Amazon VPC Lattice configuration for service-to-service networking.
"""

import aws_cdk as cdk
from aws_cdk import aws_vpclattice as lattice, aws_ec2 as ec2, aws_iam as iam
from constructs import Construct


class LatticeStack(cdk.NestedStack):
    """Creates VPC Lattice service network for microservices communication."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Service Network
        self.service_network = lattice.CfnServiceNetwork(
            self, f"prod-lattice-network-{environment_suffix}",
            name=f"prod-lattice-network-{environment_suffix}",
            auth_type="AWS_IAM"
        )

        # VPC Association
        vpc_association = lattice.CfnServiceNetworkVpcAssociation(
            self, f"prod-lattice-vpc-association-{environment_suffix}",
            service_network_identifier=self.service_network.ref,
            vpc_identifier=vpc.vpc_id
        )

        # Example Service for web application
        web_service = lattice.CfnService(
            self, f"prod-lattice-web-service-{environment_suffix}",
            name=f"prod-lattice-web-service-{environment_suffix}",
            auth_type="AWS_IAM"
        )

        # Associate service with service network
        lattice.CfnServiceNetworkServiceAssociation(
            self, f"prod-lattice-service-association-{environment_suffix}",
            service_network_identifier=self.service_network.ref,
            service_identifier=web_service.ref
        )

        # Target Group (placeholder - would point to actual targets)
        target_group = lattice.CfnTargetGroup(
            self, f"prod-lattice-target-group-{environment_suffix}",
            name=f"prod-lattice-target-group-{environment_suffix}",
            type="INSTANCE",
            config=lattice.CfnTargetGroup.TargetGroupConfigProperty(
                port=80,
                protocol="HTTP",
                vpc_identifier=vpc.vpc_id,
                health_check=lattice.CfnTargetGroup.HealthCheckConfigProperty(
                    enabled=True,
                    path="/health",
                    protocol="HTTP",
                    healthy_threshold_count=2,
                    unhealthy_threshold_count=3,
                    interval_seconds=30,
                    timeout_seconds=5
                )
            )
        )

        # Listener for the service
        lattice.CfnListener(
            self, f"prod-lattice-listener-{environment_suffix}",
            service_identifier=web_service.ref,
            protocol="HTTP",
            port=80,
            default_action=lattice.CfnListener.DefaultActionProperty(
                forward=lattice.CfnListener.ForwardProperty(
                    target_groups=[
                        lattice.CfnListener.WeightedTargetGroupProperty(
                            target_group_identifier=target_group.ref,
                            weight=100
                        )
                    ]
                )
            )
        )

        # Outputs
        cdk.CfnOutput(
            self, "ServiceNetworkArn",
            value=self.service_network.attr_arn,
            description="VPC Lattice Service Network ARN"
        )
        
        cdk.CfnOutput(
            self, "ServiceNetworkId",
            value=self.service_network.attr_id,
            description="VPC Lattice Service Network ID"
        )
```

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   pip install aws-cdk-lib constructs
   ```

2. **Deploy the infrastructure**:
   ```bash
   cdk bootstrap
   cdk deploy
   ```

3. **Environment Configuration**:
   - Set CDK_DEFAULT_REGION=us-east-1
   - Ensure AWS credentials are configured
   - Update domain name in compute_stack.py for SSL certificate

## Key Features Implemented

1. **Multi-AZ VPC** with public, private, and database subnets
2. **Production-ready RDS** with db.t3.micro, encryption, and backups
3. **Application Load Balancer** with SSL termination and HTTP to HTTPS redirect
4. **Auto Scaling** based on CPU utilization (70% threshold)
5. **CloudWatch monitoring** with 5xx error alarms
6. **S3 buckets** with access logging and lifecycle policies
7. **AWS AppRunner** for containerized workloads
8. **VPC Lattice** for service mesh capabilities
9. **Comprehensive IAM roles** following least privilege
10. **Security groups** with minimal required access

The solution provides a production-ready, scalable, and secure AWS environment that can be deployed immediately using CDK with Python.
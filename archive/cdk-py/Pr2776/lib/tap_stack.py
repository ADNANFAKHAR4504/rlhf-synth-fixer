"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_s3 as s3,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.
    
    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Apply environment-specific tags to all resources in the stack
        Tags.of(self).add("Environment", self.environment_suffix.title())
        Tags.of(self).add("Project", "TAP-WebApplicationInfrastructure")
        Tags.of(self).add("ManagedBy", "CDK")

        # Create all infrastructure resources
        # 1. Networking Layer
        self.vpc = self._create_networking_layer()
        
        # 2. Security Groups
        self.alb_sg, self.ec2_sg, self.rds_sg = self._create_security_groups()
        
        # 3. Compute Layer (ALB + ASG)
        self.alb, self.asg = self._create_compute_layer()
        
        # 4. Database Layer
        self.rds_instance = self._create_database_layer()
        
        # 5. Monitoring and Logging
        self.logging_bucket = self._create_monitoring_and_logging()
        
        # 6. Create CloudFormation Outputs
        self._create_outputs()

    def _create_networking_layer(self) -> ec2.Vpc:
        """
        Creates VPC with 2 public and 2 private subnets across 2 AZs
        CDK automatically creates Internet Gateway and manages routing
        """
        vpc = ec2.Vpc(
            self, f"TapVPC-{self.environment_suffix}",
            vpc_name=f"tap-vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Deploy across 2 availability zones
            restrict_default_security_group=False,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="Public",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="Private",
                    cidr_mask=24
                )
            ],
            # CDK automatically creates NAT gateways (one per AZ) for private subnets
            nat_gateways=2 if self.environment_suffix == 'prod' else 1,  # Save costs in dev
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        return vpc

    def _create_security_groups(self) -> tuple:
        """
        Creates security groups for ALB, EC2, and RDS layers
        """
        # Application Load Balancer Security Group
        alb_sg = ec2.SecurityGroup(
            self, f"ALBSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for Application Load Balancer - {self.environment_suffix}",
            security_group_name=f"tap-alb-sg-{self.environment_suffix}",
            allow_all_outbound=True
        )

        # Allow HTTP and HTTPS traffic from internet
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )

        # EC2 Instances Security Group
        ec2_sg = ec2.SecurityGroup(
            self, f"EC2SecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for EC2 instances - {self.environment_suffix}",
            security_group_name=f"tap-ec2-sg-{self.environment_suffix}",
            allow_all_outbound=True
        )

        # Allow traffic from ALB to EC2 instances on port 80
        ec2_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB"
        )

        # Allow SSH access for management (restrict in production)
        ssh_peer = ec2.Peer.any_ipv4() if self.environment_suffix == 'dev' else ec2.Peer.ipv4("10.0.0.0/8")
        ec2_sg.add_ingress_rule(
            peer=ssh_peer,
            connection=ec2.Port.tcp(22),
            description="Allow SSH access"
        )

        # RDS Security Group
        rds_sg = ec2.SecurityGroup(
            self, f"RDSSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for RDS database - {self.environment_suffix}",
            security_group_name=f"tap-rds-sg-{self.environment_suffix}",
            allow_all_outbound=False
        )

        # Allow database access only from EC2 instances
        rds_sg.add_ingress_rule(
            peer=ec2_sg,
            connection=ec2.Port.tcp(3306),  # MySQL/Aurora port
            description="Allow database access from EC2 instances"
        )

        return alb_sg, ec2_sg, rds_sg

    def _create_compute_layer(self) -> tuple:
        """
        Creates Application Load Balancer and Auto Scaling Group
        """
        # Create IAM role for EC2 instances
        ec2_role = iam.Role(
            self, f"EC2Role-{self.environment_suffix}",
            role_name=f"tap-ec2-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, f"TapALB-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name=f"tap-alb-{self.environment_suffix}",
            security_group=self.alb_sg
        )

        # Create Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"EC2TargetGroup-{self.environment_suffix}",
            vpc=self.vpc,
            target_group_name=f"tap-ec2-tg-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                interval=Duration.seconds(30),
                path="/health",
                port="80",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )

        # Create ALB Listener
        alb.add_listener(
            "ALBListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([target_group])
        )

        # User data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            f"echo '<h1>TAP {self.environment_suffix.upper()} Web Server</h1><p>Instance ID: ' > /var/www/html/index.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
            "echo '</p>' >> /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health"
        )

        # Determine instance type based on environment
        instance_type = ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM if self.environment_suffix == 'prod' else ec2.InstanceSize.MICRO
        )

        # Create Launch Template
        launch_template = ec2.LaunchTemplate(
            self, f"EC2LaunchTemplate-{self.environment_suffix}",
            launch_template_name=f"tap-launch-template-{self.environment_suffix}",
            instance_type=instance_type,
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.ec2_sg,
            user_data=user_data,
            role=ec2_role
        )

        # Environment-specific capacity settings
        if self.environment_suffix == 'prod':
            min_capacity = 2
            max_capacity = 10
            desired_capacity = 3
        else:  # dev/staging
            min_capacity = 1
            max_capacity = 3
            desired_capacity = 1

        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, f"TapASG-{self.environment_suffix}",
            auto_scaling_group_name=f"tap-asg-{self.environment_suffix}",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=min_capacity,
            max_capacity=max_capacity,
            desired_capacity=desired_capacity,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update()
        )

        # Attach ASG to Target Group
        asg.attach_to_application_target_group(target_group)

        # Add auto-scaling based on CPU utilization
        asg.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70
        )

        return alb, asg

    def _create_database_layer(self) -> rds.DatabaseInstance:
        """
        Creates RDS instance with automated backups in private subnets
        """
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, f"DatabaseSubnetGroup-{self.environment_suffix}",
            description=f"Subnet group for RDS database - {self.environment_suffix}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            subnet_group_name=f"tap-db-subnet-{self.environment_suffix}"
        )

        # Environment-specific database configuration
        if self.environment_suffix == 'prod':
            instance_type = ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.SMALL
            )
            multi_az = True
            deletion_protection = True
            backup_retention = Duration.days(7)
            allocated_storage = 100
        else:  # dev/staging
            instance_type = ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            )
            multi_az = False
            deletion_protection = False
            backup_retention = Duration.days(1)
            allocated_storage = 20

        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self, f"TapDatabase-{self.environment_suffix}",
            instance_identifier=f"tap-db-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=instance_type,
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.rds_sg],
            database_name=f"tap{self.environment_suffix}db",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name=f"tap-db-credentials-{self.environment_suffix}"
            ),
            # Automated backups configuration
            backup_retention=backup_retention,
            delete_automated_backups=False,
            deletion_protection=deletion_protection,
            # Multi-AZ deployment
            multi_az=multi_az,
            # Storage configuration
            allocated_storage=allocated_storage,
            storage_type=rds.StorageType.GP2,
            storage_encrypted=True,
            # Monitoring
            monitoring_interval=Duration.seconds(60) if self.environment_suffix == 'prod' else Duration.seconds(0),
            enable_performance_insights=self.environment_suffix == 'prod',
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT if self.environment_suffix == 'prod' else None,
            # Maintenance window
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            # Remove instance on stack deletion (be careful in production)
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix != 'prod' else RemovalPolicy.SNAPSHOT
        )

        return rds_instance

    def _create_monitoring_and_logging(self) -> s3.Bucket:
        """
        Creates CloudWatch Alarms and S3 bucket for centralized logging
        """
        # Create S3 bucket for centralized logging
        logging_bucket = s3.Bucket(
            self, f"CentralizedLoggingBucket-{self.environment_suffix}",
            bucket_name=f"tap-logs-{self.environment_suffix}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90 if self.environment_suffix == 'prod' else 30)
                )
            ],
            removal_policy=RemovalPolicy.RETAIN,
        )

        # Add bucket policy for secure access
        bucket_policy_statement = iam.PolicyStatement(
            sid="DenyInsecureConnections",
            effect=iam.Effect.DENY,
            principals=[iam.AnyPrincipal()],
            actions=["s3:*"],
            resources=[
                logging_bucket.bucket_arn,
                f"{logging_bucket.bucket_arn}/*"
            ],
            conditions={
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        )
        logging_bucket.add_to_resource_policy(bucket_policy_statement)

        # Create CloudWatch Log Group
        log_group = logs.LogGroup(
            self, f"ApplicationLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/ec2/tap/{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH if self.environment_suffix == 'prod' else logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"TapDashboard-{self.environment_suffix}",
            dashboard_name=f"TAP-{self.environment_suffix}-Dashboard"
        )

        # Create CloudWatch Alarms for Auto Scaling Group CPU utilization
        cpu_alarm = cloudwatch.Alarm(
            self, f"HighCPUAlarm-{self.environment_suffix}",
            alarm_name=f"TAP-{self.environment_suffix}-High-CPU-Utilization",
            alarm_description=f"Alarm when CPU exceeds 70% in {self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": self.asg.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=70,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Create CloudWatch Alarm for RDS CPU utilization
        rds_cpu_alarm = cloudwatch.Alarm(
            self, f"RDSHighCPUAlarm-{self.environment_suffix}",
            alarm_name=f"TAP-{self.environment_suffix}-RDS-High-CPU",
            alarm_description=f"Alarm when RDS CPU exceeds 70% in {self.environment_suffix}",
            metric=self.rds_instance.metric_cpu_utilization(
                period=Duration.minutes(5)
            ),
            threshold=70,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Create CloudWatch Alarm for ALB target health
        alb_unhealthy_targets = cloudwatch.Alarm(
            self, f"ALBUnhealthyTargets-{self.environment_suffix}",
            alarm_name=f"TAP-{self.environment_suffix}-ALB-Unhealthy-Targets",
            alarm_description=f"Alarm when ALB has unhealthy targets in {self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name
                },
                statistic="Average",
                period=Duration.minutes(1)
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )

        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="EC2 CPU Utilization",
                left=[cloudwatch.Metric(
                    namespace="AWS/EC2",
                    metric_name="CPUUtilization",
                    dimensions_map={
                        "AutoScalingGroupName": self.asg.auto_scaling_group_name
                    },
                    statistic="Average",
                    period=Duration.minutes(5)
                )]
            ),
            cloudwatch.GraphWidget(
                title="RDS CPU Utilization",
                left=[self.rds_instance.metric_cpu_utilization(
                    period=Duration.minutes(5)
                )]
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[cloudwatch.Metric(
                    namespace="AWS/ApplicationELB",
                    metric_name="RequestCount",
                    dimensions_map={
                        "LoadBalancer": self.alb.load_balancer_full_name
                    },
                    statistic="Sum",
                    period=Duration.minutes(5)
                )]
            )
        )

        return logging_bucket

    def _create_outputs(self):
        """
        Creates CloudFormation outputs for key resources
        """
        # VPC Outputs
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"TAP-{self.environment_suffix}-VPC-ID"
        )

        CfnOutput(
            self, "VPCCidr",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR Block",
            export_name=f"TAP-{self.environment_suffix}-VPC-CIDR"
        )

        # Subnet Outputs
        CfnOutput(
            self, "PublicSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]),
            description="Public Subnet IDs",
            export_name=f"TAP-{self.environment_suffix}-Public-Subnet-IDs"
        )

        CfnOutput(
            self, "PrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="Private Subnet IDs",
            export_name=f"TAP-{self.environment_suffix}-Private-Subnet-IDs"
        )

        # ALB Outputs
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name=f"TAP-{self.environment_suffix}-ALB-DNS"
        )

        CfnOutput(
            self, "LoadBalancerURL",
            value=f"http://{self.alb.load_balancer_dns_name}",
            description="Application URL",
            export_name=f"TAP-{self.environment_suffix}-App-URL"
        )

        CfnOutput(
            self, "LoadBalancerArn",
            value=self.alb.load_balancer_arn,
            description="Application Load Balancer ARN",
            export_name=f"TAP-{self.environment_suffix}-ALB-ARN"
        )

        # RDS Outputs
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS Database Endpoint",
            export_name=f"TAP-{self.environment_suffix}-DB-Endpoint"
        )

        CfnOutput(
            self, "DatabasePort",
            value=str(self.rds_instance.instance_endpoint.port),
            description="RDS Database Port",
            export_name=f"TAP-{self.environment_suffix}-DB-Port"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.rds_instance.secret.secret_arn,
            description="RDS Database Credentials Secret ARN",
            export_name=f"TAP-{self.environment_suffix}-DB-Secret-ARN"
        )

        # S3 Outputs
        CfnOutput(
            self, "LoggingBucketName",
            value=self.logging_bucket.bucket_name,
            description="Centralized Logging S3 Bucket",
            export_name=f"TAP-{self.environment_suffix}-Logging-Bucket"
        )

        CfnOutput(
            self, "LoggingBucketArn",
            value=self.logging_bucket.bucket_arn,
            description="Centralized Logging S3 Bucket ARN",
            export_name=f"TAP-{self.environment_suffix}-Logging-Bucket-ARN"
        )

        # Auto Scaling Group Outputs
        CfnOutput(
            self, "AutoScalingGroupName",
            value=self.asg.auto_scaling_group_name,
            description="Auto Scaling Group Name",
            export_name=f"TAP-{self.environment_suffix}-ASG-Name"
        )

        CfnOutput(
            self, "AutoScalingGroupArn",
            value=self.asg.auto_scaling_group_arn,
            description="Auto Scaling Group ARN",
            export_name=f"TAP-{self.environment_suffix}-ASG-ARN"
        )

        # Security Group Outputs
        CfnOutput(
            self, "ALBSecurityGroupId",
            value=self.alb_sg.security_group_id,
            description="ALB Security Group ID",
            export_name=f"TAP-{self.environment_suffix}-ALB-SG-ID"
        )

        CfnOutput(
            self, "EC2SecurityGroupId",
            value=self.ec2_sg.security_group_id,
            description="EC2 Security Group ID",
            export_name=f"TAP-{self.environment_suffix}-EC2-SG-ID"
        )

        CfnOutput(
            self, "RDSSecurityGroupId",
            value=self.rds_sg.security_group_id,
            description="RDS Security Group ID",
            export_name=f"TAP-{self.environment_suffix}-RDS-SG-ID"
        )

        # Environment Output
        CfnOutput(
            self, "Environment",
            value=self.environment_suffix,
            description="Deployment Environment",
            export_name=f"TAP-{self.environment_suffix}-Environment"
        )
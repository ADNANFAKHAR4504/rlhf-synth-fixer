``````python
#!/usr/bin/env python3

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
    RemovalPolicy
)
from constructs import Construct

class ProductionInfrastructureStack(Stack):
    """
    Production-ready AWS Infrastructure Stack
    Implements a complete multi-tier architecture with networking, compute, database, and monitoring
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Apply production tags to all resources in the stack
        cdk.Tags.of(self).add("Environment", "Production")
        cdk.Tags.of(self).add("Project", "WebApplicationInfrastructure")
        cdk.Tags.of(self).add("ManagedBy", "CDK")

        # Create networking layer
        self.vpc = self._create_networking_layer()
        
        # Create security groups
        self.alb_sg, self.ec2_sg, self.rds_sg = self._create_security_groups()
        
        # Create compute layer
        self.alb, self.asg = self._create_compute_layer()
        
        # Create database layer
        self.rds_instance = self._create_database_layer()
        
        # Create monitoring and logging
        self._create_monitoring_and_logging()
        
        # Create outputs
        self._create_outputs()

    def _create_networking_layer(self) -> ec2.Vpc:
        """
        Creates VPC with 2 public and 2 private subnets across 2 AZs
        CDK automatically creates Internet Gateway and manages routing
        """
        vpc = ec2.Vpc(
            self, "ProductionVPC",
            vpc_name="production-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Deploy across 2 availability zones
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
            nat_gateways=2,
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
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
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
            self, "EC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )

        # Allow traffic from ALB to EC2 instances on port 80
        ec2_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB"
        )

        # Allow SSH access for management (consider restricting to specific IPs in production)
        ec2_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access"
        )

        # RDS Security Group
        rds_sg = ec2.SecurityGroup(
            self, "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
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
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # Create instance profile
        instance_profile = iam.CfnInstanceProfile(
            self, "EC2InstanceProfile",
            roles=[ec2_role.role_name]
        )

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, "ProductionALB",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name="production-alb",
            security_group=self.alb_sg
        )

        # Create Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, "EC2TargetGroup",
            vpc=self.vpc,
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
            "echo '<h1>Production Web Server</h1><p>Instance ID: ' > /var/www/html/index.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
            "echo '</p>' >> /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health"
        )

        # Create Launch Template
        launch_template = ec2.LaunchTemplate(
            self, "EC2LaunchTemplate",
            launch_template_name="production-launch-template",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.ec2_sg,
            user_data=user_data,
            role=ec2_role
        )

        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "ProductionASG",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=3,
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

        return alb, asg

    def _create_database_layer(self) -> rds.DatabaseInstance:
        """
        Creates RDS instance with automated backups in private subnets
        """
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self, "ProductionDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.rds_sg],
            database_name="productiondb",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="production-db-credentials"
            ),
            # Automated backups configuration
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=True,
            # Multi-AZ deployment for production
            multi_az=True,
            # Storage configuration
            allocated_storage=20,
            storage_type=rds.StorageType.GP2,
            storage_encrypted=True,
            # Monitoring
            monitoring_interval=Duration.minutes(1),
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            # Maintenance window
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            # Remove instance on stack deletion (change for production)
            removal_policy=RemovalPolicy.DESTROY
        )

        return rds_instance

    def _create_monitoring_and_logging(self):
        """
        Creates CloudWatch Alarms and S3 bucket for centralized logging
        """
        # Create S3 bucket for centralized logging
        self.logging_bucket = s3.Bucket(
            self, "CentralizedLoggingBucket",
            bucket_name=f"production-logs-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Add bucket policy for secure access
        bucket_policy_statement = iam.PolicyStatement(
            sid="DenyInsecureConnections",
            effect=iam.Effect.DENY,
            principals=[iam.AnyPrincipal()],
            actions=["s3:*"],
            resources=[
                self.logging_bucket.bucket_arn,
                f"{self.logging_bucket.bucket_arn}/*"
            ],
            conditions={
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        )
        self.logging_bucket.add_to_resource_policy(bucket_policy_statement)

        # Create CloudWatch Log Group
        log_group = logs.LogGroup(
            self, "ApplicationLogGroup",
            log_group_name="/aws/ec2/production",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create CloudWatch Alarms for Auto Scaling Group CPU utilization
        cpu_alarm = cloudwatch.Alarm(
            self, "HighCPUAlarm",
            alarm_name="Production-High-CPU-Utilization",
            alarm_description="Alarm when CPU exceeds 70%",
            metric=self.asg.metric_cpu_utilization(),
            threshold=70,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Create CloudWatch Alarm for RDS CPU utilization
        rds_cpu_alarm = cloudwatch.Alarm(
            self, "RDSHighCPUAlarm",
            alarm_name="Production-RDS-High-CPU",
            alarm_description="Alarm when RDS CPU exceeds 70%",
            metric=self.rds_instance.metric_cpu_utilization(),
            threshold=70,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Create CloudWatch Alarm for ALB target health
        alb_unhealthy_targets = cloudwatch.Alarm(
            self, "ALBUnhealthyTargets",
            alarm_name="Production-ALB-Unhealthy-Targets",
            alarm_description="Alarm when ALB has unhealthy targets",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name
                },
                statistic="Average"
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )

    def _create_outputs(self):
        """
        Creates CloudFormation outputs for key resources
        """
        # VPC Outputs
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name="Production-VPC-ID"
        )

        CfnOutput(
            self, "VPCCidr",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR Block",
            export_name="Production-VPC-CIDR"
        )

        # ALB Outputs
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name",
            export_name="Production-ALB-DNS"
        )

        CfnOutput(
            self, "LoadBalancerURL",
            value=f"http://{self.alb.load_balancer_dns_name}",
            description="Application URL",
            export_name="Production-App-URL"
        )

        # RDS Outputs
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS Database Endpoint",
            export_name="Production-DB-Endpoint"
        )

        # S3 Outputs
        CfnOutput(
            self, "LoggingBucketName",
            value=self.logging_bucket.bucket_name,
            description="Centralized Logging S3 Bucket",
            export_name="Production-Logging-Bucket"
        )

        # Auto Scaling Group Output
        CfnOutput(
            self, "AutoScalingGroupName",
            value=self.asg.auto_scaling_group_name,
            description="Auto Scaling Group Name",
            export_name="Production-ASG-Name"
        )


class ProductionInfrastructureApp(cdk.App):
    """
    Main CDK Application
    """
    def __init__(self):
        super().__init__()

        # Deploy the production infrastructure stack
        ProductionInfrastructureStack(
            self, "ProductionInfrastructureStack",
            env=cdk.Environment(
                account=self.node.try_get_context("account"),
                region="us-east-1"  # Deploy to us-east-1 as specified
            ),
            description="Production-ready multi-tier AWS infrastructure"
        )


def main():
    """
    Main deployment function
    """
    app = ProductionInfrastructureApp()
    
    # Add global tags
    cdk.Tags.of(app).add("CreatedBy", "CDK-Python")
    cdk.Tags.of(app).add("Purpose", "Production-Infrastructure")
    
    app.synth()
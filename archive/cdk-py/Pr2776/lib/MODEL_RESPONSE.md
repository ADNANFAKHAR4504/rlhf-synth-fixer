``````python
#!/usr/bin/env python3

"""
AWS CDK Infrastructure Deployment Script
Deploys a production-ready multi-tier web application infrastructure
"""

from aws_cdk import (
    App,
    Stack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct
import os


class ProductionInfrastructureStack(Stack):
    """
    Main infrastructure stack containing all production resources
    """
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply production tags to all resources in this stack
        self.apply_common_tags()
        
        # 1. Networking Layer
        self.vpc = self.create_networking_layer()
        
        # 2. Security Groups
        self.security_groups = self.create_security_groups()
        
        # 3. Compute Layer
        self.alb, self.asg = self.create_compute_layer()
        
        # 4. Database Layer
        self.database = self.create_database_layer()
        
        # 5. Monitoring & Logging
        self.create_monitoring_and_logging()
        
        # 6. Outputs
        self.create_outputs()
    
    def apply_common_tags(self):
        """Apply common tags to all resources"""
        from aws_cdk import Tags
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Project", "WebApp-Infrastructure")
        Tags.of(self).add("ManagedBy", "CDK")
    
    def create_networking_layer(self):
        """
        Create VPC with public and private subnets across two AZs
        """
        vpc = ec2.Vpc(
            self, "ProductionVPC",
            vpc_name="production-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Deploy across 2 availability zones
            subnet_configuration=[
                # Public subnets for load balancers and NAT gateways
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Private subnets for application servers
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                # Isolated subnets for database
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            # CDK automatically creates Internet Gateway and NAT Gateways
            nat_gateways=2,  # One NAT gateway per AZ for high availability
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        return vpc
    
    def create_security_groups(self):
        """
        Create security groups for different tiers
        """
        # ALB Security Group - allows HTTP/HTTPS from internet
        alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            security_group_name="production-alb-sg"
        )
        
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet"
        )
        
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from internet"
        )
        
        # Application Security Group - allows traffic from ALB
        app_sg = ec2.SecurityGroup(
            self, "ApplicationSecurityGroup",
            vpc=self.vpc,
            description="Security group for application servers",
            security_group_name="production-app-sg"
        )
        
        app_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(80),
            "Allow HTTP traffic from ALB"
        )
        
        # Database Security Group - allows traffic from application tier only
        db_sg = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            security_group_name="production-db-sg"
        )
        
        db_sg.add_ingress_rule(
            app_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL traffic from application tier"
        )
        
        return {
            'alb': alb_sg,
            'application': app_sg,
            'database': db_sg
        }
    
    def create_compute_layer(self):
        """
        Create Application Load Balancer and Auto Scaling Group
        """
        # Create IAM role for EC2 instances
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Create instance profile
        instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            role=ec2_role
        )
        
        # User data script to install and configure web server
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Production Web Server - $(hostname -f)</h1>' > /var/www/html/index.html",
            "yum install -y amazon-cloudwatch-agent",
            "systemctl enable amazon-cloudwatch-agent"
        )
        
        # Launch Template
        launch_template = ec2.LaunchTemplate(
            self, "WebServerLaunchTemplate",
            launch_template_name="production-web-server-template",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.security_groups['application'],
            user_data=user_data,
            role=ec2_role
        )
        
        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "WebServerAutoScalingGroup",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            auto_scaling_group_name="production-web-servers-asg"
        )
        
        # Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, "ApplicationLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name="production-alb",
            security_group=self.security_groups['alb'],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )
        
        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, "WebServerTargetGroup",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_group_name="production-web-servers-tg",
            targets=[asg],
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/",
                timeout=Duration.seconds(10)
            )
        )
        
        # Listener
        listener = alb.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # Auto Scaling Policies
        asg.scale_on_cpu_utilization(
            "CPUScalingPolicy",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.minutes(5),
            scale_out_cooldown=Duration.minutes(5)
        )
        
        return alb, asg
    
    def create_database_layer(self):
        """
        Create RDS MySQL instance in private subnets
        """
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            subnet_group_name="production-db-subnet-group"
        )
        
        # Create RDS instance
        database = rds.DatabaseInstance(
            self, "ProductionDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.security_groups['database']],
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name="production-db-credentials"
            ),
            database_name="productiondb",
            backup_retention=Duration.days(7),  # 7 days backup retention
            delete_automated_backups=False,
            deletion_protection=True,
            instance_identifier="production-mysql-db",
            allocated_storage=20,
            storage_encrypted=True,
            multi_az=False,  # Set to True for production HA
            auto_minor_version_upgrade=True,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        return database
    
    def create_monitoring_and_logging(self):
        """
        Create CloudWatch alarms and S3 bucket for logging
        """
        # S3 bucket for centralized logging
        log_bucket = s3.Bucket(
            self, "CentralizedLogsBucket",
            bucket_name=f"production-logs-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogRetentionRule",
                    enabled=True,
                    expiration=Duration.days(365),  # Keep logs for 1 year
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )
        
        # Bucket policy for ALB access logs
        log_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSLogDeliveryWrite",
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal("delivery.logs.amazonaws.com")
                ],
                actions=["s3:PutObject"],
                resources=[f"{log_bucket.bucket_arn}/*"]
            )
        )
        
        # CloudWatch Log Group for application logs
        log_group = logs.LogGroup(
            self, "ApplicationLogGroup",
            log_group_name="/aws/production/webapp",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # CloudWatch Alarms for Auto Scaling Group
        cpu_alarm = cloudwatch.Alarm(
            self, "HighCPUAlarm",
            alarm_name="Production-High-CPU-Utilization",
            alarm_description="Alarm when CPU exceeds 70%",
            metric=self.asg.metric_cpu_utilization(),
            threshold=70,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Database CPU alarm
        db_cpu_alarm = cloudwatch.Alarm(
            self, "DatabaseHighCPUAlarm",
            alarm_name="Production-Database-High-CPU",
            alarm_description="Database CPU utilization is high",
            metric=self.database.metric_cpu_utilization(),
            threshold=70,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        # ALB target health alarm
        target_health_alarm = cloudwatch.Alarm(
            self, "UnhealthyTargetsAlarm",
            alarm_name="Production-Unhealthy-Targets",
            alarm_description="ALB has unhealthy targets",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name
                }
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        return {
            'log_bucket': log_bucket,
            'log_group': log_group,
            'alarms': [cpu_alarm, db_cpu_alarm, target_health_alarm]
        }
    
    def create_outputs(self):
        """
        Create CloudFormation outputs for important resources
        """
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for the production environment",
            export_name="Production-VPC-ID"
        )
        
        CfnOutput(
            self, "LoadBalancerURL",
            value=f"http://{self.alb.load_balancer_dns_name}",
            description="URL of the Application Load Balancer",
            export_name="Production-ALB-URL"
        )
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name="Production-ALB-DNS"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS database endpoint",
            export_name="Production-DB-Endpoint"
        )
        
        CfnOutput(
            self, "AutoScalingGroupName",
            value=self.asg.auto_scaling_group_name,
            description="Auto Scaling Group name",
            export_name="Production-ASG-Name"
        )


def main():
    """
    Main function to deploy the infrastructure
    """
    # Create CDK app
    app = App()
    
    # Deploy to us-east-1 region
    env = {
        'region': 'us-east-1',
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT')
    }
    
    # Create the infrastructure stack
    ProductionInfrastructureStack(
        app, 
        "ProductionInfrastructureStack",
        env=env,
        description="Production-ready multi-tier web application infrastructure"
    )
    
    # Synthesize the CloudFormation template
    app.synth()
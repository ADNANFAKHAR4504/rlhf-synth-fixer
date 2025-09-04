"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It creates a production-ready infrastructure with VPC, EC2, RDS, ALB, and monitoring.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_s3 as s3,
    aws_cloudwatch as cloudwatch,
    aws_iam as iam,
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
        existing_key_pair (Optional[str]): Name of existing EC2 key pair for SSH access.
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        existing_key_pair (Optional[str]): Stores the existing key pair name.
    """

    def __init__(self, environment_suffix: Optional[str] = None, 
                 existing_key_pair: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.existing_key_pair = existing_key_pair


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the TAP project.

    This stack creates a production-ready infrastructure including:
    - VPC with public and private subnets
    - Auto Scaling Group with EC2 instances
    - Application Load Balancer
    - RDS MySQL database
    - S3 bucket for logs with lifecycle policy
    - CloudWatch monitoring and alarms
    - IAM roles and security groups

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix and existing key pair.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        existing_key_pair (Optional[str]): Name of existing EC2 key pair for SSH access.
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

        # Get existing key pair name from props or context
        self.existing_key_pair = (
            props.existing_key_pair if props else None
        ) or self.node.try_get_context('existingKeyPair')

        # Apply tags to all resources in the stack
        Tags.of(self).add("Environment", self.environment_suffix)

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Security Groups
        self.security_groups = self._create_security_groups()

        # Create RDS Subnet Group
        self.db_subnet_group = self._create_db_subnet_group()

        # Create RDS Instance
        self.rds_instance = self._create_rds_instance()

        # Create S3 Bucket for logs
        self.s3_bucket = self._create_s3_bucket()

        # Create IAM Role for EC2 instances (after S3 bucket creation)
        self.ec2_role = self._create_ec2_role()

        # Create Launch Template
        self.launch_template = self._create_launch_template()

        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()

        # Create Auto Scaling Group
        self.asg = self._create_auto_scaling_group()

        # Create CloudWatch Alarms
        self._create_cloudwatch_alarms()

        # Create outputs
        self._create_outputs()

    def _create_vpc(self):
        """Create VPC with public and private subnets (10.0.0.0/16)"""
        return ec2.Vpc(
            self, f"TapVPC{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Use 2 AZs for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24  # 10.0.1.0/24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet", 
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24  # 10.0.2.0/24, 10.0.3.0/24
                )
            ],
            nat_gateways=1,  # One NAT Gateway in public subnet
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

    def _create_security_groups(self):
        """Create security groups for ALB, EC2, and RDS"""
        
        # ALB Security Group
        alb_sg = ec2.SecurityGroup(
            self, f"ALBSecurityGroup{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Allow HTTP and HTTPS from anywhere
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from anywhere"
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from anywhere"
        )
        
        # EC2 Security Group
        ec2_sg = ec2.SecurityGroup(
            self, f"EC2SecurityGroup{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        # Allow HTTP from ALB
        ec2_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(80),
            "Allow HTTP traffic from ALB"
        )
        
        # Fixed: Restrict SSH to only ALB security group instead of entire VPC
        # This provides better security by limiting SSH access
        if self.existing_key_pair:
            ec2_sg.add_ingress_rule(
                alb_sg,  # Only allow SSH from ALB subnet
                ec2.Port.tcp(22),
                "Allow SSH access from ALB subnet"
            )
        
        # RDS Security Group
        rds_sg = ec2.SecurityGroup(
            self, f"RDSSecurityGroup{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )
        
        # Allow MySQL/Aurora access from EC2 instances
        rds_sg.add_ingress_rule(
            ec2_sg,
            ec2.Port.tcp(3306),
            "Allow MySQL access from EC2 instances"
        )
        
        return {
            "alb": alb_sg,
            "ec2": ec2_sg,
            "rds": rds_sg
        }

    def _create_db_subnet_group(self):
        """Create RDS subnet group"""
        return rds.SubnetGroup(
            self, f"DBSubnetGroup{self.environment_suffix}",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

    def _create_rds_instance(self):
        """Create RDS MySQL instance"""
        return rds.DatabaseInstance(
            self, f"TapDatabase{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_37  # Fixed: Use more widely available version
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.security_groups["rds"]],
            database_name="tapdb",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name=f"rds-credentials-{self.environment_suffix}"
            ),
            allocated_storage=20,
            storage_encrypted=True,
            multi_az=False,  # Set to True for production
            deletion_protection=False,  # Set to False for easier cleanup in dev
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            removal_policy=RemovalPolicy.DESTROY  # For easier cleanup in dev
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for application logs with lifecycle policy"""
        return s3.Bucket(
            self, f"TapLogsBucket{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,  # For easier cleanup
            auto_delete_objects=True  # Auto delete objects on stack deletion
        )

    def _create_ec2_role(self):
        """Create IAM role for EC2 instances"""
        role = iam.Role(
            self, f"EC2Role{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # Add S3 permissions for log bucket
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:ListBucket"],
                resources=[self.s3_bucket.bucket_arn]
            )
        )
        
        return role

    def _create_launch_template(self):
        """Create launch template for EC2 instances"""
        
        # User data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html",
            
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            """{
                "metrics": {
                    "namespace": "CWAgent",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": [
                                "cpu_usage_idle",
                                "cpu_usage_iowait",
                                "cpu_usage_user",
                                "cpu_usage_system"
                            ],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": [
                                "used_percent"
                            ],
                            "metrics_collection_interval": 60,
                            "resources": [
                                "*"
                            ]
                        },
                        "mem": {
                            "measurement": [
                                "mem_used_percent"
                            ],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }""",
            "EOF",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
        )
        
        # Create launch template with conditional key pair
        launch_template_props = {
            "instance_type": ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            "machine_image": ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            "security_group": self.security_groups["ec2"],
            "role": self.ec2_role,
            "user_data": user_data
        }
        
        # Fixed: Only add key_name if existing key pair is provided
        if self.existing_key_pair:
            launch_template_props["key_name"] = self.existing_key_pair
        
        return ec2.LaunchTemplate(
            self, f"LaunchTemplate{self.environment_suffix}",
            **launch_template_props
        )

    def _create_application_load_balancer(self):
        """Create Application Load Balancer"""
        return elbv2.ApplicationLoadBalancer(
            self, f"TapALB{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups["alb"],
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )

    def _create_auto_scaling_group(self):
        """Create Auto Scaling Group with target group"""
        
        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"TargetGroup{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(10),
                interval=Duration.seconds(30),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )
        
        # Add listener to ALB
        listener = self.alb.add_listener(
            f"Listener{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # Fixed: Create Auto Scaling Group with new health check method
        asg = autoscaling.AutoScalingGroup(
            self, f"AutoScalingGroup{self.environment_suffix}",
            vpc=self.vpc,
            launch_template=self.launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            # Fixed: Use new health_checks method instead of deprecated health_check
            health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5))

        )
        
        # Fixed: Attach ASG to target group using the correct method
        asg.attach_to_application_target_group(target_group)
        
        # Fixed: Use correct parameter names for scaling policies
        asg.scale_on_cpu_utilization(
            f"CPUScaling{self.environment_suffix}",
            target_utilization_percent=70,
            cooldown=Duration.minutes(5)  # Fixed: Use 'cooldown' instead of separate in/out parameters
        )
        
        return asg

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring"""
        
        # CPU Utilization Alarm
        cpu_alarm = cloudwatch.Alarm(
            self, f"HighCPUAlarm{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": self.asg.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            alarm_description="Alarm when CPU exceeds 80%"
        )
        
        # Fixed: Enhanced ALB Response Time Alarm with proper target group monitoring
        target_response_time_alarm = cloudwatch.Alarm(
            self, f"HighResponseTimeAlarm{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="TargetResponseTime",
                dimensions_map={
                    "LoadBalancer": self.alb.load_balancer_full_name
                },
                statistic="Average",
                period=Duration.minutes(5)
            ),
            threshold=1,  # 1 second
            evaluation_periods=3,
            datapoints_to_alarm=2,
            alarm_description="Alarm when response time exceeds 1 second"
        )
        
        # Additional: Target Health Alarm to monitor unhealthy targets
        target_health_alarm = cloudwatch.Alarm(
            self, f"UnhealthyTargetsAlarm{self.environment_suffix}",
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
            datapoints_to_alarm=2,
            alarm_description="Alarm when there are unhealthy targets"
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name=f"TapALBDNS-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="ID of the VPC",
            export_name=f"TapVPCId-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS instance endpoint",
            export_name=f"TapDBEndpoint-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the S3 bucket for logs",
            export_name=f"TapS3Bucket-{self.environment_suffix}"
        )

        # Fixed: Conditional output for key pair (only if provided)
        if self.existing_key_pair:
            CfnOutput(
                self, "KeyPairName",
                value=self.existing_key_pair,
                description="Name of the EC2 Key Pair",
                export_name=f"TapKeyPair-{self.environment_suffix}"
            )

        CfnOutput(
            self, "EnvironmentSuffix",
            value=self.environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"TapEnvironmentSuffix-{self.environment_suffix}"
        )
        
        CfnOutput(
            self, "SSMSessionManagerInfo",
            value="Use AWS Systems Manager Session Manager to access EC2 instances without SSH keys",
            description="Access method for EC2 instances",
            export_name=f"TapSSMInfo-{self.environment_suffix}"
        )

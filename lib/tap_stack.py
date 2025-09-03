"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the Web Application Infrastructure project.
It creates a comprehensive production-ready web application with VPC, EC2 instances,
PostgreSQL database, and proper security configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    Environment
)
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_rds as rds
from aws_cdk import aws_iam as iam
from aws_cdk import aws_logs as logs
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_autoscaling as autoscaling
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

    def __init__(self, environment_suffix: Optional[str] = None, env: Optional[cdk.Environment] = None, **kwargs):
        super().__init__(env=env, **kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """
    Comprehensive web application infrastructure stack.
    
    Creates a production-ready web application infrastructure with:
    - VPC with public and private subnets across multiple AZs
    - EC2 instances with Apache HTTP server in public subnets
    - Application Load Balancer for high availability
    - PostgreSQL database in private subnet with backup
    - Proper security groups and IAM roles
    - NAT Gateway for outbound internet access from private resources
    - Comprehensive tagging and monitoring setup
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create VPC with proper subnet configuration
        self.vpc = self._create_vpc()
        
        # Create security groups
        self.web_security_group = self._create_web_security_group()
        self.database_security_group = self._create_database_security_group()
        
        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        
        # Create RDS subnet group and database
        self.db_subnet_group = self._create_db_subnet_group()
        self.database = self._create_database()
        
        # Create Application Load Balancer
        self.load_balancer = self._create_load_balancer()
        
        # Create Auto Scaling Group with EC2 instances
        self.auto_scaling_group = self._create_auto_scaling_group()
        
        # Apply comprehensive tagging
        self._apply_tags()
        
        # Create stack outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets across multiple AZs."""
        vpc = ec2.Vpc(
            self,
            "WebAppVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            subnet_configuration=[
                # Public subnets for web servers and load balancer (will create one per AZ)
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                # Private subnets for database (will create one per AZ)
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                )
            ],
            nat_gateways=1  # NAT Gateway for outbound access from private subnet
        )
        
        # Enable VPC Flow Logs for security monitoring
        flow_log_role = iam.Role(
            self,
            "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com")
        )
        
        # Add custom policy for VPC Flow Logs permissions
        flow_log_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:*"
                ]
            )
        )
        
        log_group = logs.LogGroup(
            self,
            "VPCFlowLogGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self,
            "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group, flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )
        
        return vpc

    def _create_web_security_group(self) -> ec2.SecurityGroup:
        """Create security group for web servers allowing HTTP and SSH access."""
        security_group = ec2.SecurityGroup(
            self,
            "WebSecurityGroup",
            vpc=self.vpc,
            description="Security group for web servers - HTTP and SSH access",
            allow_all_outbound=True
        )
        
        # Allow HTTP access from anywhere
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP access from internet"
        )
        
        # Allow SSH access from anywhere (restrict to office IP in production)
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access from internet"
        )
        
        return security_group

    def _create_database_security_group(self) -> ec2.SecurityGroup:
        """Create security group for database allowing access only from web servers."""
        security_group = ec2.SecurityGroup(
            self,
            "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for PostgreSQL database",
            allow_all_outbound=False
        )
        
        # Allow PostgreSQL access only from web security group
        security_group.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.web_security_group.security_group_id),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from web servers only"
        )
        
        return security_group

    def _create_ec2_role(self) -> iam.Role:
        """Create IAM role for EC2 instances with necessary permissions."""
        role = iam.Role(
            self,
            "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 web server instances",
            managed_policies=[
                # Basic permissions for CloudWatch monitoring
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                ),
                # Systems Manager for maintenance and patching
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                )
            ]
        )
        
        # Add custom policy for application-specific permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/ec2/*"
                ]
            )
        )
        
        return role

    def _create_db_subnet_group(self) -> rds.SubnetGroup:
        """Create DB subnet group for RDS instance."""
        return rds.SubnetGroup(
            self,
            "DatabaseSubnetGroup",
            description="Subnet group for PostgreSQL database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

    def _create_database(self) -> rds.DatabaseInstance:
        """Create PostgreSQL database instance with backup and security."""
        # Create parameter group for PostgreSQL optimization
        parameter_group = rds.ParameterGroup(
            self,
            "PostgreSQLParameterGroup",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_7
            ),
            description="Parameter group for PostgreSQL 15.7"
        )
        
        database = rds.DatabaseInstance(
            self,
            "PostgreSQLDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_7
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=self.db_subnet_group,
            security_groups=[self.database_security_group],
            database_name="webapp",
            credentials=rds.Credentials.from_generated_secret(
                "dbadmin",
                secret_name=f"webapp-db-credentials-{self.environment_suffix}"
            ),
            allocated_storage=20,
            storage_type=rds.StorageType.GP2,
            storage_encrypted=True,
            parameter_group=parameter_group,
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="Mon:04:00-Mon:05:00",
            deletion_protection=False,  # Set to True for production
            auto_minor_version_upgrade=True,
            monitoring_interval=Duration.seconds(60),
            enable_performance_insights=True,
            performance_insight_retention=rds.PerformanceInsightRetention.DEFAULT,
            removal_policy=RemovalPolicy.DESTROY  # Change for production
        )
        
        return database

    def _create_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer for high availability."""
        load_balancer = elbv2.ApplicationLoadBalancer(
            self,
            "WebAppLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=self.web_security_group
        )
        
        return load_balancer

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group with EC2 instances and Apache configuration."""
        # User data script to install and configure Apache
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "yum install -y postgresql15",  # PostgreSQL client for database connectivity
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Web Application Server</h1>' > /var/www/html/index.html",
            f"echo '<p>Environment: {self.environment_suffix}</p>' >> /var/www/html/index.html",
            "echo '<p>Server: '$(hostname)'</p>' >> /var/www/html/index.html",
            "echo '<p>Availability Zone: '$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)'</p>' >> /var/www/html/index.html",
            # Install CloudWatch agent for monitoring
            "yum install -y amazon-cloudwatch-agent",
            # Configure log forwarding
            "echo '<!DOCTYPE html>' > /var/www/html/health.html",
            "echo '<html><body><h1>Health Check OK</h1></body></html>' >> /var/www/html/health.html"
        )
        
        # Create launch template
        launch_template = ec2.LaunchTemplate(
            self,
            "WebServerLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            user_data=user_data,
            security_group=self.web_security_group,
            role=self.ec2_role,
            detailed_monitoring=True
        )
        
        # Create Auto Scaling Group
        auto_scaling_group = autoscaling.AutoScalingGroup(
            self,
            "WebServerAutoScalingGroup",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=5,
            desired_capacity=2,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            )
        )
        
        # Create target group for load balancer
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "WebServerTargetGroup",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            targets=[auto_scaling_group],
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/health.html",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )
        
        # Create listener for load balancer
        self.load_balancer.add_listener(
            "WebServerListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        return auto_scaling_group

    def _apply_tags(self) -> None:
        """Apply comprehensive tags to all resources."""
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("Project", "WebApp")
        Tags.of(self).add("Owner", "DevOps Team")
        Tags.of(self).add("CostCenter", "Engineering")
        Tags.of(self).add("Backup", "Required")
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("EnvironmentSuffix", self.environment_suffix)

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for important resources."""
        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=self.load_balancer.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name=f"WebApp-LoadBalancer-DNS-{self.environment_suffix}"
        )
        
        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="PostgreSQL database endpoint",
            export_name=f"WebApp-Database-Endpoint-{self.environment_suffix}"
        )
        
        CfnOutput(
            self,
            "DatabasePort",
            value=str(self.database.instance_endpoint.port),
            description="PostgreSQL database port",
            export_name=f"WebApp-Database-Port-{self.environment_suffix}"
        )
        
        CfnOutput(
            self,
            "VPCId", 
            value=self.vpc.vpc_id,
            description="VPC ID for the web application",
            export_name=f"WebApp-VPC-Id-{self.environment_suffix}"
        )
        
        CfnOutput(
            self,
            "WebURL",
            value=f"http://{self.load_balancer.load_balancer_dns_name}",
            description="Web application URL",
            export_name=f"WebApp-URL-{self.environment_suffix}"
        )

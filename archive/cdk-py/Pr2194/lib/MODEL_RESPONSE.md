# AWS CDK Python Web Application Infrastructure Implementation

I'll help you create a highly available web application infrastructure using AWS CDK with Python. This solution will implement all your requirements including Auto Scaling, Application Load Balancer, health checks, security groups, and secure parameter storage.

## Architecture Overview

The infrastructure will include:
- VPC with public and private subnets across multiple AZs
- Application Load Balancer (ALB) for traffic distribution
- Auto Scaling Group with EC2 instances
- Security groups for network access control
- AWS Secrets Manager for secure configuration
- CloudFormation outputs for easy access

## Implementation Files

### File: lib/tap_stack.py

```python
"""tap_stack.py
CDK stack for highly available web application infrastructure
with Auto Scaling and Application Load Balancer.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack, Duration, CfnOutput,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_secretsmanager as secretsmanager,
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
    Highly available web application infrastructure with Auto Scaling and Load Balancer.
    
    This stack creates a complete web application infrastructure including:
    - VPC with public and private subnets across multiple AZs
    - Application Load Balancer for traffic distribution
    - Auto Scaling Group with health checks
    - Security groups for network access control
    - AWS Secrets Manager for secure configuration storage
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
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create VPC with public and private subnets across multiple AZs
        vpc = ec2.Vpc(
            self, f"WebAppVPC{environment_suffix}",
            max_azs=3,
            nat_gateways=2,  # For high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"PublicSubnet{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"PrivateSubnet{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Create security group for Application Load Balancer
        alb_security_group = ec2.SecurityGroup(
            self, f"ALBSecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        # Allow HTTP and HTTPS traffic from internet to ALB
        alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic from internet"
        )
        alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic from internet"
        )

        # Create security group for EC2 instances
        ec2_security_group = ec2.SecurityGroup(
            self, f"EC2SecurityGroup{environment_suffix}",
            vpc=vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )

        # Allow traffic from ALB to EC2 instances
        ec2_security_group.add_ingress_rule(
            alb_security_group,
            ec2.Port.tcp(80),
            "Allow HTTP traffic from ALB"
        )

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, f"WebAppALB{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_security_group,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            )
        )

        # Create target group for ALB
        target_group = elbv2.ApplicationTargetGroup(
            self, f"WebAppTargetGroup{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            vpc=vpc,
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
                timeout=Duration.seconds(10),
                interval=Duration.seconds(30),
                protocol=elbv2.Protocol.HTTP
            )
        )

        # Add listener to ALB
        alb.add_listener(
            f"WebAppListener{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        # Create AWS Secrets Manager secret for application configuration
        app_secrets = secretsmanager.Secret(
            self, f"WebAppSecrets{environment_suffix}",
            description="Secrets for web application configuration",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_characters='"@/\\'
            )
        )

        # Create IAM role for EC2 instances
        ec2_role = iam.Role(
            self, f"WebAppEC2Role{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # Grant EC2 instances read access to secrets
        app_secrets.grant_read(ec2_role)

        # User data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Healthy Web Application Instance</h1>' > /var/www/html/index.html",
            "echo '<p>Instance ID: ' > /tmp/instance_id.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /tmp/instance_id.html",
            "echo '</p>' >> /tmp/instance_id.html",
            "cat /tmp/instance_id.html >> /var/www/html/index.html"
        )

        # Create launch template for Auto Scaling Group
        launch_template = ec2.LaunchTemplate(
            self, f"WebAppLaunchTemplate{environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=ec2_security_group,
            role=ec2_role,
            user_data=user_data
        )

        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, f"WebAppASG{environment_suffix}",
            vpc=vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.seconds(300)
            ),
            target_group=target_group
        )

        # Add scaling policies
        asg.scale_on_cpu_utilization(
            f"WebAppCPUScaling{environment_suffix}",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(300),
            scale_out_cooldown=Duration.seconds(300)
        )

        # Create CloudFormation outputs
        CfnOutput(
            self, f"LoadBalancerURL{environment_suffix}",
            value=f"http://{alb.load_balancer_dns_name}",
            description="URL of the Application Load Balancer",
            export_name=f"WebApp-LoadBalancer-URL-{environment_suffix}"
        )

        CfnOutput(
            self, f"LoadBalancerDNS{environment_suffix}",
            value=alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name=f"WebApp-LoadBalancer-DNS-{environment_suffix}"
        )

        CfnOutput(
            self, f"SecretsManagerArn{environment_suffix}",
            value=app_secrets.secret_arn,
            description="ARN of the Secrets Manager secret",
            export_name=f"WebApp-Secrets-ARN-{environment_suffix}"
        )

        # Store references for potential use by other stacks
        self.vpc = vpc
        self.alb = alb
        self.asg = asg
        self.app_secrets = app_secrets
```

## Key Features Implemented

### High Availability
- VPC spans multiple Availability Zones (up to 3 AZs)
- Auto Scaling Group distributes instances across AZs
- Application Load Balancer is internet-facing and multi-AZ
- NAT Gateways in multiple AZs for outbound internet access

### Auto Scaling Configuration
- Minimum 2 instances, maximum 6 instances
- CPU-based scaling policy (70% threshold)
- ELB health checks with 300-second grace period
- Automatic instance replacement for failed health checks

### Security Implementation
- Separate security groups for ALB and EC2 instances
- ALB accepts HTTP/HTTPS from internet (ports 80/443)
- EC2 instances only accept traffic from ALB
- IAM role with least privilege access
- AWS Secrets Manager for secure configuration storage

### Load Balancer Features
- Application Load Balancer with HTTP listener
- Health checks on "/" path every 30 seconds
- Automatic target registration/deregistration
- Load balancer URL provided as CloudFormation output

### Latest AWS Features Integration
- Uses latest Amazon Linux 2 AMIs
- IAM role supports AWS Systems Manager for enhanced management
- Launch templates instead of deprecated launch configurations
- Modern CDK v2 constructs and best practices

## Usage

After deployment, you can access your web application using the LoadBalancerURL output value. The infrastructure will automatically scale based on CPU utilization and maintain high availability across multiple Availability Zones.

The application secrets can be accessed programmatically using the AWS SDK with the provided IAM role permissions.
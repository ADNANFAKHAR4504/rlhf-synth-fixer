"""TapStack module for AWS CDK infrastructure deployment.

This module contains the TapStack class that creates a comprehensive
AWS infrastructure with VPCs, ALBs, Auto Scaling Groups, and related resources.
"""

import os
import json
from pathlib import Path
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    Tags,
    CfnOutput,
    Duration,
    StackProps,
    RemovalPolicy
)
from constructs import Construct

# Detect LocalStack environment
# Check both environment variable (runtime) and metadata.json (synth time)
def _is_localstack_environment():
    """Detect if running in LocalStack environment."""
    # Check AWS_ENDPOINT_URL environment variable
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL", "")
    if "localhost" in endpoint_url or "4566" in endpoint_url:
        return True

    # Check metadata.json provider field (for CDK synth time)
    metadata_path = Path(__file__).parent.parent / "metadata.json"
    if metadata_path.exists():
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                if metadata.get("provider") == "localstack":
                    return True
        except Exception:
            pass

    return False

is_localstack = _is_localstack_environment()


class TapStackProps(StackProps):
    """Properties for TapStack."""
    
    def __init__(self, *, environment_suffix: str = 'dev', **kwargs):
        """Initialize TapStackProps.
        
        Args:
            environment_suffix: Suffix for environment-specific resource naming
            **kwargs: Additional stack properties
        """
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """AWS CDK stack for creating comprehensive infrastructure.
    
    This stack creates a multi-VPC infrastructure with Application Load Balancers,
    Auto Scaling Groups, and all necessary supporting resources for high availability.
    """
    
    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps = None) -> None:
        if props is None:
            props = TapStackProps()
        super().__init__(scope, construct_id, env=props.env)
        
        self.environment_suffix = props.environment_suffix
        
        # Common tags for all resources
        self.common_tags = {
            "Environment": self.environment_suffix,
            "Owner": "DevOps-Team",
            "Project": "TapInfrastructure",
            "ManagedBy": "AWS-CDK"
        }
        
        # Apply common tags to the stack
        for key, value in self.common_tags.items():
            Tags.of(self).add(key, value)
        
        # Create VPCs
        self.vpc1 = self._create_vpc(f"VPC1-{self.environment_suffix}", "10.0.0.0/16")
        self.vpc2 = self._create_vpc(f"VPC2-{self.environment_suffix}", "10.1.0.0/16")
        
        # Create security groups
        self.alb_sg_vpc1 = self._create_alb_security_group(
            self.vpc1, f"ALB-SG-VPC1-{self.environment_suffix}"
        )
        self.alb_sg_vpc2 = self._create_alb_security_group(
            self.vpc2, f"ALB-SG-VPC2-{self.environment_suffix}"
        )
        
        self.ec2_sg_vpc1 = self._create_ec2_security_group(
            self.vpc1, f"EC2-SG-VPC1-{self.environment_suffix}", self.alb_sg_vpc1
        )
        self.ec2_sg_vpc2 = self._create_ec2_security_group(
            self.vpc2, f"EC2-SG-VPC2-{self.environment_suffix}", self.alb_sg_vpc2
        )
        
        # Create IAM role for EC2 instances
        self.ec2_role = self._create_ec2_role()
        
        # Create Application Load Balancers
        self.alb_vpc1 = self._create_alb(
            self.vpc1, self.alb_sg_vpc1, f"ALB-VPC1-{self.environment_suffix}"
        )
        self.alb_vpc2 = self._create_alb(
            self.vpc2, self.alb_sg_vpc2, f"ALB-VPC2-{self.environment_suffix}"
        )
        
        # Create Auto Scaling Groups
        self.asg_vpc1 = self._create_auto_scaling_group(
            self.vpc1, self.ec2_sg_vpc1, self.alb_vpc1,
            f"ASG-VPC1-{self.environment_suffix}"
        )
        self.asg_vpc2 = self._create_auto_scaling_group(
            self.vpc2, self.ec2_sg_vpc2, self.alb_vpc2,
            f"ASG-VPC2-{self.environment_suffix}"
        )
        
        # Create outputs
        self._create_outputs()
    
    def _create_vpc(self, name: str, cidr: str) -> ec2.Vpc:
        """Create a VPC with public and private subnets across multiple AZs"""

        if is_localstack:
            # LocalStack: Use only public subnets to avoid NAT Gateway issues
            subnet_configuration = [
                ec2.SubnetConfiguration(
                    name=f"{name}-Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
            nat_gateways = 0
        else:
            # AWS: Use public and private subnets with NAT Gateways
            subnet_configuration = [
                ec2.SubnetConfiguration(
                    name=f"{name}-Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"{name}-Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
            nat_gateways = 2

        vpc = ec2.Vpc(
            self, name,
            ip_addresses=ec2.IpAddresses.cidr(cidr),
            max_azs=2,  # Use 2 AZs for high availability
            subnet_configuration=subnet_configuration,
            nat_gateways=nat_gateways,
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Tag the VPC
        Tags.of(vpc).add("Name", name)

        # Apply RemovalPolicy for LocalStack
        if is_localstack:
            vpc.apply_removal_policy(RemovalPolicy.DESTROY)

        return vpc
    
    def _create_alb_security_group(self, vpc: ec2.Vpc, name: str) -> ec2.SecurityGroup:
        """Create security group for Application Load Balancer"""
        sg = ec2.SecurityGroup(
            self, name,
            vpc=vpc,
            description=f"Security group for {name}",
            allow_all_outbound=True
        )
        
        # Allow HTTP traffic from anywhere
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from anywhere"
        )
        
        # Allow HTTPS traffic from anywhere
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from anywhere"
        )
        
        Tags.of(sg).add("Name", name)
        return sg
    
    def _create_ec2_security_group(
        self, vpc: ec2.Vpc, name: str, alb_sg: ec2.SecurityGroup
    ) -> ec2.SecurityGroup:
        """Create security group for EC2 instances"""
        sg = ec2.SecurityGroup(
            self, name,
            vpc=vpc,
            description=f"Security group for {name}",
            allow_all_outbound=True
        )
        
        # Allow HTTP traffic from ALB security group only
        sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(alb_sg.security_group_id),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB"
        )
        
        # Allow SSH from within VPC only (private access)
        sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(22),
            description="Allow SSH from within VPC"
        )
        
        Tags.of(sg).add("Name", name)
        return sg
    
    def _create_ec2_role(self) -> iam.Role:
        """Create IAM role for EC2 instances"""
        role = iam.Role(
            self, f"EC2Role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances in Auto Scaling Groups"
        )

        if is_localstack:
            # Use inline policies for LocalStack compatibility
            role.add_to_policy(iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:UpdateInstanceInformation",
                    "ssm:ListAssociations",
                    "ssm:ListInstanceAssociations",
                    "ec2messages:GetMessages",
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            ))
        else:
            # Add SSM managed policy for Systems Manager access
            role.add_managed_policy(
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            )

            # Add CloudWatch agent policy
            role.add_managed_policy(
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            )

        Tags.of(role).add("Name", f"EC2-AutoScaling-Role-{self.environment_suffix}")
        return role
    
    def _create_alb(
        self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, name: str
    ) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer"""
        alb = elbv2.ApplicationLoadBalancer(
            self, name,
            vpc=vpc,
            internet_facing=True,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        Tags.of(alb).add("Name", name)
        return alb
    
    def _create_auto_scaling_group(
        self, 
        vpc: ec2.Vpc, 
        security_group: ec2.SecurityGroup, 
        alb: elbv2.ApplicationLoadBalancer,
        name: str
    ) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group with EC2 instances"""
        
        # User data script to install and start a simple web server
        user_data = ec2.UserData.for_linux()
        if is_localstack:
            # Simplified user data for LocalStack (avoid metadata service)
            user_data.add_commands(
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                f"echo '<h1>Hello from {name}</h1><p>Server is running</p>' > /var/www/html/index.html"
            )
        else:
            user_data.add_commands(
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                f"echo '<h1>Hello from {name}</h1><p>Instance ID: ' > /var/www/html/index.html",
                "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
                "echo '</p>' >> /var/www/html/index.html"
            )
        
        # Use T2 for LocalStack compatibility, T3 for AWS
        instance_class = ec2.InstanceClass.T2 if is_localstack else ec2.InstanceClass.T3

        # Auto Scaling Group
        # Use EC2 health check for better LocalStack compatibility
        health_check = autoscaling.HealthCheck.ec2(grace=Duration.seconds(300))

        # Choose subnet type based on environment
        # LocalStack: Use PUBLIC subnets (no NAT Gateway issues)
        # AWS: Use PRIVATE_WITH_EGRESS subnets (behind NAT Gateway)
        subnet_type = ec2.SubnetType.PUBLIC if is_localstack else ec2.SubnetType.PRIVATE_WITH_EGRESS

        # For LocalStack, use instance_type directly instead of launch_template
        # to avoid LatestVersionNumber error
        if is_localstack:
            asg = autoscaling.AutoScalingGroup(
                self, name,
                vpc=vpc,
                instance_type=ec2.InstanceType.of(
                    instance_class,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=ec2.AmazonLinuxImage(
                    generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
                ),
                security_group=security_group,
                user_data=user_data,
                role=self.ec2_role,
                min_capacity=2,
                max_capacity=6,
                desired_capacity=2,
                vpc_subnets=ec2.SubnetSelection(subnet_type=subnet_type),
                health_check=health_check
            )
        else:
            # Create launch template for AWS (not supported well in LocalStack)
            launch_template = ec2.LaunchTemplate(
                self, f"{name}-LaunchTemplate",
                instance_type=ec2.InstanceType.of(
                    instance_class,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=ec2.AmazonLinuxImage(
                    generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
                ),
                security_group=security_group,
                user_data=user_data,
                role=self.ec2_role
            )

            Tags.of(launch_template).add("Name", f"{name}-LaunchTemplate")

            asg = autoscaling.AutoScalingGroup(
                self, name,
                vpc=vpc,
                launch_template=launch_template,
                min_capacity=2,
                max_capacity=6,
                desired_capacity=2,
                vpc_subnets=ec2.SubnetSelection(subnet_type=subnet_type),
                health_check=health_check
            )
        
        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"{name}-TargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/",
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )
        
        # Attach ASG to target group
        asg.attach_to_application_target_group(target_group)
        
        # Add listener to ALB
        alb.add_listener(
            f"{name}-Listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # Add scaling policies
        asg.scale_on_cpu_utilization(
            f"{name}-CPUScaling",
            target_utilization_percent=70,
            cooldown=Duration.seconds(300)
        )
        
        Tags.of(asg).add("Name", name)
        Tags.of(target_group).add("Name", f"{name}-TargetGroup")
        
        return asg
    
    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "VPC1-ID",
            value=self.vpc1.vpc_id,
            description="VPC1 ID"
        )
        
        CfnOutput(
            self, "VPC2-ID",
            value=self.vpc2.vpc_id,
            description="VPC2 ID"
        )
        
        CfnOutput(
            self, "ALB1-DNS",
            value=self.alb_vpc1.load_balancer_dns_name,
            description="DNS name of ALB in VPC1"
        )
        
        CfnOutput(
            self, "ALB2-DNS",
            value=self.alb_vpc2.load_balancer_dns_name,
            description="DNS name of ALB in VPC2"
        )
        
        CfnOutput(
            self, "ALB1-URL",
            value=f"http://{self.alb_vpc1.load_balancer_dns_name}",
            description="URL for ALB in VPC1"
        )
        
        CfnOutput(
            self, "ALB2-URL",
            value=f"http://{self.alb_vpc2.load_balancer_dns_name}",
            description="URL for ALB in VPC2"
        )

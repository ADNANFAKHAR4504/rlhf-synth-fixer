from aws_cdk import (
  aws_ec2 as ec2,
  aws_autoscaling as autoscaling,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_s3 as s3,
  NestedStack,
  Stack,
  CfnOutput,
  Duration,
  RemovalPolicy,
)
from constructs import Construct
from typing import Optional
import os

# LocalStack configuration
is_localstack = (
    "localhost" in os.environ.get("AWS_ENDPOINT_URL", "")
    or "4566" in os.environ.get("AWS_ENDPOINT_URL", "")
)


class TapStackProps(NestedStack):
    """
    Properties for the TapStack, defining the core infrastructure components.
    This nested stack encapsulates the S3 bucket, IAM role, VPC, Security Group,
    Auto Scaling Group, and Application Load Balancer.
    """
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str = "dev",
        instance_type: str = "t3.micro",  # Make instance type configurable
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for logs
        self.log_bucket = s3.Bucket(
            self,
            f"AppLogsBucket-{environment_suffix}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        )
                    ],
                )
            ],
            # Implement public access block for S3 bucket
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            # Add RemovalPolicy.DESTROY for LocalStack cleanup
            removal_policy=RemovalPolicy.DESTROY,
        )

        # IAM Role for EC2
        self.ec2_role = iam.Role(
            self,
            f"EC2Role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances with access to log bucket",
        )
        self.log_bucket.grant_read_write(self.ec2_role)

        # VPC - Simplified for LocalStack (no NAT Gateway)
        self.vpc = ec2.Vpc(
            self,
            f"AppVPC-{environment_suffix}",
            max_azs=2,  # Use 2 Availability Zones
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
            ],
            nat_gateways=0,  # No NAT Gateway for LocalStack compatibility
        )

        # Security group
        self.security_group = ec2.SecurityGroup(
            self,
            f"InstanceSG-{environment_suffix}",
            vpc=self.vpc,
            description="Allow HTTP and SSH",
            allow_all_outbound=True,
        )
        # Allow HTTP access from ALB
        self.security_group.add_ingress_rule(
            ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            ec2.Port.tcp(80),
            "Allow HTTP access from within VPC (ALB)",
        )
        # Allow SSH access for management
        self.security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(22),
            "Allow SSH access"
        )

        # User data for EC2 bootstrap
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from CDK!</h1>' > /var/www/html/index.html"
        )

        # AMI
        ami = ec2.MachineImage.latest_amazon_linux2()

        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self,
            f"AppASG-{environment_suffix}",
            vpc=self.vpc,
            instance_type=ec2.InstanceType(instance_type),
            machine_image=ami,
            role=self.ec2_role,
            security_group=self.security_group,
            min_capacity=1,
            max_capacity=3,
            # Deploy ASG into public subnets for LocalStack compatibility
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            user_data=user_data,
        )

        # Add auto scaling policies
        self.asg.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=50,
            cooldown=Duration.seconds(300)
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"AppALB-{environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
        )

        # HTTP Listener only (port 80)
        self.listener = self.alb.add_listener(
            f"Listener-{environment_suffix}",
            port=80,
            open=True,
        )

        # Implement proper health checks for ALB targets
        self.listener.add_targets(
            f"AppTargets-{environment_suffix}",
            port=80,
            targets=[self.asg],
            health_check=elbv2.HealthCheck(
                path="/",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=5,
                healthy_http_codes="200",
            )
        )

        # Outputs
        CfnOutput(
            self,
            f"LogBucketName-{environment_suffix}",
            value=self.log_bucket.bucket_name,
            description="Name of the S3 bucket for application logs.",
        )
        CfnOutput(
            self,
            f"EC2RoleName-{environment_suffix}",
            value=self.ec2_role.role_name,
            description="Name of the IAM role for EC2 instances.",
        )
        CfnOutput(
            self,
            f"ASGName-{environment_suffix}",
            value=self.asg.auto_scaling_group_name,
            description="Name of the Auto Scaling Group.",
        )
        CfnOutput(
            self,
            f"ALBDNS-{environment_suffix}",
            value=self.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer.",
        )
        CfnOutput(
            self,
            f"VPCId-{environment_suffix}",
            value=self.vpc.vpc_id,
            description="ID of the main VPC.",
        )
        CfnOutput(
            self,
            f"SecurityGroupId-{environment_suffix}",
            value=self.security_group.security_group_id,
            description="ID of the EC2 instance Security Group.",
        )


class TapStack(Stack):
    """
    Main CDK Stack for the Test Automation Platform (TAP).
    This stack deploys the core infrastructure components by instantiating
    the TapStackProps nested stack.
    """
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str = "dev",
        instance_type: str = "t3.micro",
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Instantiate the TapStackProps nested stack with configurable instance type
        TapStackProps(
            self,
            f"{construct_id}Props",
            environment_suffix=environment_suffix,
            instance_type=instance_type
        )

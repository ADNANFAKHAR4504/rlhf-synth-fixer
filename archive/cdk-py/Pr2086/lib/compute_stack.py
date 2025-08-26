"""Compute Stack with ALB, ASG, and EC2 instances."""

from aws_cdk import (
    NestedStack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    Duration,
    CfnOutput,
)
from constructs import Construct


class ComputeStack(NestedStack):
    """Creates compute resources including ALB, ASG, and EC2 instances."""
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        web_security_group: ec2.SecurityGroup,
        alb_security_group: ec2.SecurityGroup,
        instance_profile: iam.InstanceProfile,
        environment_suffix: str = "dev",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.environment_suffix = environment_suffix
        
        self.vpc = vpc
        self.web_security_group = web_security_group
        self.alb_security_group = alb_security_group
        self.instance_profile = instance_profile
        
        # Create Application Load Balancer
        self._create_alb()
        
        # Create Auto Scaling Group
        self._create_asg()
    
    def _create_alb(self):
        """Create Application Load Balancer."""
        
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "prod-alb",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            load_balancer_name=f"prod-alb-{self.environment_suffix}",
        )
        
        # Create target group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "prod-web-tg",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
        )
        
        # Create listener
        self.listener = self.alb.add_listener(
            "prod-alb-listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([self.target_group]),
        )
        
        CfnOutput(self, "LoadBalancerDnsName", value=self.alb.load_balancer_dns_name)
    
    def _create_asg(self):
        """Create Auto Scaling Group with EC2 instances."""
        
        # User data script for web server setup
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<html><body><h1>Production Web Server</h1></body></html>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            # Install SSM agent
            "yum install -y amazon-ssm-agent",
            "systemctl start amazon-ssm-agent",
            "systemctl enable amazon-ssm-agent",
        )
        
        # Launch template
        launch_template = ec2.LaunchTemplate(
            self, "prod-web-lt",
            launch_template_name=f"prod-web-lt-{self.environment_suffix}",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.web_security_group,
            user_data=user_data,
            role=self.instance_profile.role,
            detailed_monitoring=True,
        )
        
        # Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self, "prod-web-asg",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=1,
                min_instances_in_service=1,
                pause_time=Duration.minutes(5),
            ),
        )
        
        # Attach ASG to target group
        self.asg.attach_to_application_target_group(self.target_group)
        
        # Add scaling policies
        self.asg.scale_on_cpu_utilization(
            "prod-cpu-scaling",
            target_utilization_percent=70,
            cooldown=Duration.minutes(5),
        )
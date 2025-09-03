"""compute_stack.py
Compute infrastructure including ALB, Auto Scaling, and EC2 instances.
"""

import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
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

        # Instance profile is created automatically from the role

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

        # SSL Certificate - commented out for testing (requires domain validation)
        # In production, uncomment and use DNS validation with a real domain
        # self.certificate = acm.Certificate(
        #     self, f"prod-ssl-cert-{environment_suffix}",
        #     domain_name=f"prod-app-{environment_suffix}.example.com",
        #     subject_alternative_names=[f"*.prod-app-{environment_suffix}.example.com"],
        #     validation=acm.CertificateValidation.from_dns()
        # )
        self.certificate = None  # For testing without SSL

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

        # HTTP Listener (for testing - in production, use HTTPS)
        self.load_balancer.add_listener(
            f"prod-http-listener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )

        # HTTPS Listener - commented out for testing (requires valid certificate)
        # In production, uncomment and use a valid certificate with DNS validation
        # self.load_balancer.add_listener(
        #     f"prod-https-listener-{environment_suffix}",
        #     port=443,
        #     protocol=elbv2.ApplicationProtocol.HTTPS,
        #     certificates=[self.certificate],
        #     default_target_groups=[target_group]
        # )

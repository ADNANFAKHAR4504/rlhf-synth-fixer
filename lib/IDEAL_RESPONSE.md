1. tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the Web Application infrastructure.

This module defines the core Pulumi stack and instantiates the WebAppStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi

# Add lib to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import WebAppStack

# Initialize the web application stack
webapp_stack = WebAppStack()

```

2. lib\_\_init\_\_.py

```py
# empty
```

3. lib\tap_stack.py

```py
import pulumi
import pulumi_aws as aws
from infrastructure.autoscaling import AutoScalingStack
from infrastructure.aws_provider import AWSProviderStack
from infrastructure.cloudwatch import CloudWatchStack
from infrastructure.config import WebAppConfig
from infrastructure.ec2 import EC2Stack
from infrastructure.iam import IAMStack
from infrastructure.s3 import S3Stack


class WebAppStack:
    """Main web application infrastructure stack."""

    def __init__(self):
        # Initialize configuration
        self.config = WebAppConfig()

        # Initialize AWS provider
        self.provider_stack = AWSProviderStack(self.config)
        self.provider = self.provider_stack.get_provider()

        # Initialize infrastructure components
        self.s3_stack = S3Stack(self.config, self.provider)
        self.iam_stack = IAMStack(self.config, self.provider)
        self.cloudwatch_stack = CloudWatchStack(self.config, self.provider)

        # Attach IAM policies to role (requires bucket name)
        self.iam_stack.attach_policies_to_role(self.s3_stack.get_bucket_name())

        # Initialize Auto Scaling first (creates VPC and security group)
        self.autoscaling_stack = AutoScalingStack(
            self.config,
            self.provider
        )

        # Initialize EC2 (requires security group from autoscaling)
        self.ec2_stack = EC2Stack(
            self.config,
            self.provider,
            self.iam_stack.get_instance_profile_name(),
            self.s3_stack.get_bucket_name(),
            self.autoscaling_stack.security_group.id
        )

        # Create Auto Scaling Group with EC2 resources
        self.autoscaling_stack.create_auto_scaling_group(self.ec2_stack.get_launch_template_id())

        # Register all outputs
        self._register_outputs()

    def _register_outputs(self):
        """Register all stack outputs for integration tests."""
        try:
            # S3 outputs
            pulumi.export("s3_bucket_name", self.s3_stack.get_bucket_name())
            pulumi.export("s3_bucket_arn", self.s3_stack.get_bucket_arn())

            # IAM outputs
            pulumi.export("iam_role_name", self.iam_stack.instance_role.name)
            pulumi.export("iam_instance_profile_name", self.iam_stack.get_instance_profile_name())
            pulumi.export("iam_instance_profile_arn", self.iam_stack.get_instance_profile_arn())

            # EC2 outputs
            pulumi.export("launch_template_id", self.ec2_stack.get_launch_template_id())
            pulumi.export("security_group_id", self.ec2_stack.get_security_group_id())

            # Auto Scaling outputs
            pulumi.export("load_balancer_dns_name", self.autoscaling_stack.get_load_balancer_dns_name())
            pulumi.export("load_balancer_arn", self.autoscaling_stack.get_load_balancer_arn())
            pulumi.export("target_group_arn", self.autoscaling_stack.get_target_group_arn())
            pulumi.export("auto_scaling_group_name", self.autoscaling_stack.get_auto_scaling_group_name())

            # CloudWatch outputs
            pulumi.export("log_group_name", self.cloudwatch_stack.get_log_group_name())
            pulumi.export("log_group_arn", self.cloudwatch_stack.get_log_group_arn())

            # Configuration outputs (these are strings, not Outputs)
            pulumi.export("region", self.config.region)
            pulumi.export("environment", self.config.environment)
            pulumi.export("app_name", self.config.app_name)
            pulumi.export("instance_type", self.config.instance_type)
            pulumi.export("min_size", self.config.min_size)
            pulumi.export("max_size", self.config.max_size)
            pulumi.export("desired_capacity", self.config.desired_capacity)

        except Exception as e:
            # Handle cases where pulumi.export might not be available
            print(f"Warning: Could not register outputs: {e}")
```

4. lib\infrastructure\autoscaling.py

```py
import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class AutoScalingStack:
    """Auto Scaling Group with Application Load Balancer and health checks."""

    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.vpc, self.subnet1, self.subnet2 = self._create_vpc_and_subnets()
        self.subnets = pulumi.Output.all([self.subnet1.id, self.subnet2.id])
        self.security_group = self._create_security_group()
        self.load_balancer = self._create_load_balancer()
        self.target_group = self._create_target_group()
        self.load_balancer_listener = self._create_load_balancer_listener()
        self.auto_scaling_group = None

    def _create_vpc_and_subnets(self):
        """Create VPC and subnets for the web application."""
        # Create VPC
        vpc = aws.ec2.Vpc(
            "webapp-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("vpc")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        # Create internet gateway
        igw = aws.ec2.InternetGateway(
            "webapp-igw",
            vpc_id=vpc.id,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("igw")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        # Create subnets in different AZs
        subnet1 = aws.ec2.Subnet(
            "webapp-subnet-1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{self.config.region}a",
            map_public_ip_on_launch=True,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("subnet-1")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        subnet2 = aws.ec2.Subnet(
            "webapp-subnet-2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{self.config.region}b",
            map_public_ip_on_launch=True,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("subnet-2")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        # Create route table and routes
        route_table = aws.ec2.RouteTable(
            "webapp-rt",
            vpc_id=vpc.id,
            tags={
                **self.config.get_common_tags(),
                "Name": self.config.get_tag_name("rt")
            },
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        # Route to internet gateway
        aws.ec2.Route(
            "webapp-route",
            route_table_id=route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        # Associate subnets with route table
        aws.ec2.RouteTableAssociation(
            "webapp-rta-1",
            subnet_id=subnet1.id,
            route_table_id=route_table.id,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        aws.ec2.RouteTableAssociation(
            "webapp-rta-2",
            subnet_id=subnet2.id,
            route_table_id=route_table.id,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        return vpc, subnet1, subnet2

    def _create_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for load balancer and EC2 instances."""
        return aws.ec2.SecurityGroup(
            "webapp-sg",
            name=self.config.get_tag_name("webapp-sg"),
            description="Security group for web application",
            vpc_id=self.vpc,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP access"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS access"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow SSH access"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all egress"
                )
            ],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_load_balancer(self) -> aws.lb.LoadBalancer:
        """Create Application Load Balancer."""
        return aws.lb.LoadBalancer(
            "webapp-alb",
            name=self.config.lb_name,
            load_balancer_type="application",
            security_groups=[self.security_group.id],
            subnets=[self.subnet1.id, self.subnet2.id],
            enable_deletion_protection=False,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_target_group(self) -> aws.lb.TargetGroup:
        """Create target group for load balancer."""
        return aws.lb.TargetGroup(
            "webapp-tg",
            name=self.config.target_group_name,
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_load_balancer_listener(self) -> aws.lb.Listener:
        """Create load balancer listener."""
        return aws.lb.Listener(
            "webapp-alb-listener",
            load_balancer_arn=self.load_balancer.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def create_auto_scaling_group(self, launch_template_id: pulumi.Output[str]) -> None:
        """Create Auto Scaling Group with launch template."""
        self.auto_scaling_group = aws.autoscaling.Group(
            "webapp-asg",
            name=self.config.asg_name,
            vpc_zone_identifiers=[self.subnet1.id, self.subnet2.id],
            target_group_arns=[self.target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=self.config.min_size,
            max_size=self.config.max_size,
            desired_capacity=self.config.desired_capacity,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template_id,
                version="$Latest"
            ),
            tags=[aws.autoscaling.GroupTagArgs(
                key="Name",
                value=self.config.get_tag_name("asg-instance"),
                propagate_at_launch=True
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def get_load_balancer_dns_name(self) -> pulumi.Output[str]:
        """Get load balancer DNS name."""
        return self.load_balancer.dns_name

    def get_load_balancer_arn(self) -> pulumi.Output[str]:
        """Get load balancer ARN."""
        return self.load_balancer.arn

    def get_target_group_arn(self) -> pulumi.Output[str]:
        """Get target group ARN."""
        return self.target_group.arn

    def get_auto_scaling_group_name(self) -> pulumi.Output[str]:
        """Get Auto Scaling Group name."""
        if self.auto_scaling_group is None:
            return pulumi.Output.from_input("")
        return self.auto_scaling_group.name

```

5. lib\infrastructure\aws_provider.py

```py
import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class AWSProviderStack:
    """AWS Provider configuration with proper region enforcement."""

    def __init__(self, config: WebAppConfig):
        self.config = config
        self.provider = self._create_aws_provider()

    def _create_aws_provider(self) -> aws.Provider:
        """Create AWS provider with explicit region enforcement."""
        import random
        import time
        timestamp = str(int(time.time()))[-6:]
        random_suffix = str(random.randint(1000, 9999))

        return aws.Provider(
            f"aws-provider-{timestamp}-{random_suffix}",
            region=self.config.region
        )

    def get_provider(self) -> aws.Provider:
        """Get the AWS provider instance."""
        return self.provider

```

6. lib\infrastructure\cloudwatch.py

```py
import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class CloudWatchStack:
    """CloudWatch log groups and monitoring configuration."""

    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.log_group = self._create_log_group()
        self.log_stream = self._create_log_stream()

    def _create_log_group(self) -> aws.cloudwatch.LogGroup:
        """Create CloudWatch log group for application logs."""
        return aws.cloudwatch.LogGroup(
            "webapp-log-group",
            name=self.config.log_group_name,
            retention_in_days=14,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_log_stream(self) -> aws.cloudwatch.LogStream:
        """Create log stream for the log group."""
        return aws.cloudwatch.LogStream(
            "webapp-log-stream",
            name="main-stream",
            log_group_name=self.log_group.name,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def get_log_group_name(self) -> pulumi.Output[str]:
        """Get log group name."""
        return self.log_group.name

    def get_log_group_arn(self) -> pulumi.Output[str]:
        """Get log group ARN."""
        return self.log_group.arn

```

7. lib\infrastructure\config.py

```py

```

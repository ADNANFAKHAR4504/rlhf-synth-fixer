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
        return aws.Provider(
            "aws-provider-461889-2857",
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
import os
from typing import Any, Dict


class WebAppConfig:
    """Centralized configuration for web application infrastructure."""

    def __init__(self):
        # Environment configuration
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', f'-{self.environment}')
        self.region = os.getenv('AWS_REGION', 'us-west-2')
        self.project_name = os.getenv('PROJECT_NAME', 'web-app')

        # Application configuration
        self.app_name = os.getenv('APP_NAME', 'webapp')
        self.instance_type = os.getenv('INSTANCE_TYPE', 't3.micro')
        self.min_size = int(os.getenv('MIN_SIZE', '1'))
        self.max_size = int(os.getenv('MAX_SIZE', '3'))
        self.desired_capacity = int(os.getenv('DESIRED_CAPACITY', '2'))

        # S3 configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '30'))

        # Normalize names for AWS compliance
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        region_normalized = self.region.replace('-', '')

        # Resource naming with stable identifiers (environment + region + environment for uniqueness)
        self.s3_bucket_name = f"{project_name_normalized}-{app_name_normalized}-mlogs-{region_normalized}-{environment_normalized}"
        self.iam_role_name = f"{project_name_normalized}-{app_name_normalized}-mec2-role-{region_normalized}-{environment_normalized}"
        self.launch_template_name = f"{project_name_normalized}-{app_name_normalized}-mtemplate-{region_normalized}-{environment_normalized}"
        self.asg_name = f"{project_name_normalized}-{app_name_normalized}-masg-{region_normalized}-{environment_normalized}"
        self.lb_name = f"{project_name_normalized}-{app_name_normalized}-mlb-{region_normalized}-{environment_normalized}"[:32]
        self.target_group_name = f"{project_name_normalized}-{app_name_normalized}-mtg-{region_normalized}-{environment_normalized}"[:32]
        self.log_group_name = f"/aws/ec2/{project_name_normalized}-{app_name_normalized}-mlogs-{region_normalized}-{environment_normalized}"

        # Validate region
        if self.region not in ['us-west-2', 'us-east-1']:
            raise ValueError(f"Region must be us-west-2 or us-east-1, got {self.region}")

    def get_resource_name(self, resource_type: str, suffix: str = "") -> str:
        """Generate normalized resource name."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        base_name = f"{project_name_normalized}-{app_name_normalized}-{resource_type}{self.environment_suffix}"
        return f"{base_name}{suffix}" if suffix else base_name

    def get_tag_name(self, resource_name: str) -> str:
        """Generate tag name for resources."""
        project_name_normalized = self.project_name.lower().replace('_', '-')
        environment_normalized = self.environment.lower()
        app_name_normalized = self.app_name.lower().replace('_', '-')
        region_normalized = self.region.replace('-', '')
        return f"{project_name_normalized}-{app_name_normalized}-{resource_name}-{environment_normalized}-{region_normalized}-{environment_normalized}"

    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            "Name": self.get_tag_name("webapp"),
            "Environment": self.environment,
            "Project": self.project_name,
            "Application": self.app_name,
            "ManagedBy": "Pulumi",
            "Purpose": "WebApplication"
        }

```

8. lib\infrastructure\ec2.py

```py
import base64

import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class EC2Stack:
    """EC2 launch template and security group configuration."""

    def __init__(self, config: WebAppConfig, provider: aws.Provider,
                 instance_profile_name: pulumi.Output[str], bucket_name: pulumi.Output[str],
                 security_group_id: pulumi.Output[str]):
        self.config = config
        self.provider = provider
        self.instance_profile_name = instance_profile_name
        self.bucket_name = bucket_name
        self.security_group_id = security_group_id
        self.launch_template = self._create_launch_template()


    def _get_latest_amazon_linux_ami(self) -> pulumi.Output[str]:
        """Get the latest Amazon Linux 2 AMI ID."""
        return aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.provider)
        ).id

    def _create_user_data_script(self) -> pulumi.Output[str]:
        """Create user data script for EC2 instances."""
        return pulumi.Output.all(self.bucket_name).apply(
            lambda args: f"""#!/bin/bash
# Update system
yum update -y

# Install web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create logs directory
mkdir -p /var/log/webapp

# Configure CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{{
    "logs": {{
        "logs_collected": {{
            "files": {{
                "collect_list": [
                    {{
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "{self.config.log_group_name}",
                        "log_stream_name": "{{instance_id}}/httpd/access.log"
                    }},
                    {{
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "{self.config.log_group_name}",
                        "log_stream_name": "{{instance_id}}/httpd/error.log"
                    }},
                    {{
                        "file_path": "/var/log/webapp/application.log",
                        "log_group_name": "{self.config.log_group_name}",
                        "log_stream_name": "{{instance_id}}/webapp/application.log"
                    }}
                ]
            }}
        }}
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create a simple web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>Welcome to the Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Region: {self.config.region}</p>
    <p>Environment: {self.config.environment}</p>
</body>
</html>
EOF

# Upload logs to S3 (example)
echo "Application started at $(date)" > /var/log/webapp/application.log
aws s3 cp /var/log/webapp/application.log s3://{args[0]}/logs/$(curl -s http://169.254.169.254/latest/meta-data/instance-id)/application.log || true
"""
        )

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """Create launch template for EC2 instances."""
        return aws.ec2.LaunchTemplate(
            "webapp-launch-template",
            name=self.config.launch_template_name,
            image_id=self._get_latest_amazon_linux_ami(),
            instance_type=self.config.instance_type,
            vpc_security_group_ids=[self.security_group_id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile_name
            ),
            user_data=self._create_user_data_script().apply(
                lambda script: base64.b64encode(script.encode('utf-8')).decode('utf-8')
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=self.config.get_common_tags()
                )
            ],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def get_launch_template_id(self) -> pulumi.Output[str]:
        """Get launch template ID."""
        return self.launch_template.id

    def get_security_group_id(self) -> pulumi.Output[str]:
        """Get security group ID."""
        return self.security_group_id
```

9. lib\infrastructure\iam.py

```py
import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class IAMStack:
    """IAM roles and policies with least privilege principles."""

    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.instance_role = self._create_instance_role()
        self.instance_profile = self._create_instance_profile()

    def _create_instance_role(self) -> aws.iam.Role:
        """Create IAM role for EC2 instances with least privilege."""
        return aws.iam.Role(
            "ec2-instance-role",
            name=self.config.iam_role_name,
            assume_role_policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create instance profile for EC2 instances."""
        return aws.iam.InstanceProfile(
            "ec2-instance-profile",
            name=f"{self.config.iam_role_name}-profile",
            role=self.instance_role.name,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_s3_policy(self, bucket_name: pulumi.Output[str]) -> aws.iam.Policy:
        """Create least privilege S3 policy for log access."""
        return aws.iam.Policy(
            "ec2-s3-policy",
            name=f"{self.config.get_tag_name('s3-policy')}",
            description="Least privilege S3 access for application logs",
            policy=bucket_name.apply(
                lambda name: {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        "Resource": f"arn:aws:s3:::{name}/logs/*"
                    }, {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": f"arn:aws:s3:::{name}"
                    }]
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_cloudwatch_policy(self) -> aws.iam.Policy:
        """Create CloudWatch logs policy for EC2 instances."""
        return aws.iam.Policy(
            "ec2-cloudwatch-policy",
            name=f"{self.config.get_tag_name('cloudwatch-policy')}",
            description="CloudWatch logs access for EC2 instances",
            policy=pulumi.Output.from_input({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": f"arn:aws:logs:{self.config.region}:*:log-group:{self.config.log_group_name}*"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def attach_policies_to_role(self, bucket_name: pulumi.Output[str]) -> None:
        """Attach policies to the instance role."""
        s3_policy = self._create_s3_policy(bucket_name)
        cloudwatch_policy = self._create_cloudwatch_policy()

        # Attach S3 policy
        aws.iam.RolePolicyAttachment(
            "ec2-s3-policy-attachment",
            role=self.instance_role.name,
            policy_arn=s3_policy.arn,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

        # Attach CloudWatch policy
        aws.iam.RolePolicyAttachment(
            "ec2-cloudwatch-policy-attachment",
            role=self.instance_role.name,
            policy_arn=cloudwatch_policy.arn,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def get_instance_profile_arn(self) -> pulumi.Output[str]:
        """Get instance profile ARN."""
        return self.instance_profile.arn

    def get_instance_profile_name(self) -> pulumi.Output[str]:
        """Get instance profile name."""
        return self.instance_profile.name

```

10. lib\infrastructure\s3,py

```py
import pulumi
import pulumi_aws as aws

from .config import WebAppConfig


class S3Stack:
    """S3 bucket for application logs with encryption and lifecycle rules."""

    def __init__(self, config: WebAppConfig, provider: aws.Provider):
        self.config = config
        self.provider = provider
        self.bucket = self._create_logs_bucket()
        self.public_access_block = self._create_public_access_block()
        self.encryption_configuration = self._create_encryption_configuration()
        self.versioning_configuration = self._create_versioning_configuration()
        self.lifecycle_configuration = self._create_lifecycle_configuration()

    def _create_logs_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket for application logs with SSE-S3 encryption."""
        return aws.s3.Bucket(
            "logs-bucket",
            bucket=self.config.s3_bucket_name,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_public_access_block(self) -> aws.s3.BucketPublicAccessBlock:
        """Create public access block for S3 bucket security."""
        return aws.s3.BucketPublicAccessBlock(
            "logs-bucket-pab",
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_encryption_configuration(self) -> aws.s3.BucketServerSideEncryptionConfiguration:
        """Create server-side encryption configuration."""
        return aws.s3.BucketServerSideEncryptionConfiguration(
            "logs-bucket-encryption",
            bucket=self.bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_versioning_configuration(self) -> aws.s3.BucketVersioning:
        """Create versioning configuration."""
        return aws.s3.BucketVersioning(
            "logs-bucket-versioning",
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def _create_lifecycle_configuration(self) -> aws.s3.BucketLifecycleConfiguration:
        """Create lifecycle configuration to delete logs after 30 days."""
        return aws.s3.BucketLifecycleConfiguration(
            "logs-bucket-lifecycle",
            bucket=self.bucket.id,
            rules=[aws.s3.BucketLifecycleConfigurationRuleArgs(
                id="delete-logs-after-30-days",
                status="Enabled",
                expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                    days=self.config.log_retention_days
                ),
                filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                    prefix="logs/"
                )
            )],
            opts=pulumi.ResourceOptions(provider=self.provider)
        )

    def get_bucket_name(self) -> pulumi.Output[str]:
        """Get bucket name."""
        return self.bucket.id

    def get_bucket_arn(self) -> pulumi.Output[str]:
        """Get bucket ARN."""
        return self.bucket.arn

```

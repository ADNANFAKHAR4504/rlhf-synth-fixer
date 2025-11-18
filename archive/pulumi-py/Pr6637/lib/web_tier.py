"""
Web tier ComponentResource.
Encapsulates ALB, Target Group, and Auto Scaling Group.
"""
from typing import Any, Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, Output, ResourceOptions


class WebTierArgs:
    """Arguments for WebTier component."""

    def __init__(self,
                 vpc_id: Output[str],
                 public_subnet_ids: List[Output[str]],
                 private_subnet_ids: List[Output[str]],
                 alb_security_group_id: Output[str],
                 ec2_security_group_id: Output[str],
                 instance_profile_arn: Output[str],
                 ami_id: Optional[str],
                 instance_type: str,
                 min_size: int,
                 max_size: int,
                 desired_capacity: int,
                 environment_suffix: str,
                 tags: Dict[str, str]):
        """
        Initialize web tier arguments.

        Args:
            vpc_id: VPC ID
            public_subnet_ids: List of public subnet IDs
            private_subnet_ids: List of private subnet IDs
            alb_security_group_id: ALB security group ID
            ec2_security_group_id: EC2 security group ID
            instance_profile_arn: IAM instance profile ARN
            ami_id: AMI ID for EC2 instances (optional, will use latest AL2 if not provided)
            instance_type: EC2 instance type
            min_size: Minimum ASG size
            max_size: Maximum ASG size
            desired_capacity: Desired ASG capacity
            environment_suffix: Environment suffix
            tags: Common tags
        """
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.private_subnet_ids = private_subnet_ids
        self.alb_security_group_id = alb_security_group_id
        self.ec2_security_group_id = ec2_security_group_id
        self.instance_profile_arn = instance_profile_arn
        self.ami_id = ami_id
        self.instance_type = instance_type
        self.min_size = min_size
        self.max_size = max_size
        self.desired_capacity = desired_capacity
        self.environment_suffix = environment_suffix
        self.tags = tags


class WebTier(ComponentResource):
    """
    Web tier component resource.
    Encapsulates ALB, Target Group, and Auto Scaling Group.
    """

    def __init__(self, name: str, args: WebTierArgs, opts: Optional[ResourceOptions] = None):
        """
        Initialize web tier component.

        Args:
            name: Component name
            args: Web tier arguments
            opts: Pulumi resource options
        """
        super().__init__("custom:infrastructure:WebTier", name, None, opts)

        # Get AMI ID
        if args.ami_id:
            ami_id = args.ami_id
        else:
            # Get the latest Amazon Linux 2 AMI
            ami = aws.ec2.get_ami(
                most_recent=True,
                owners=["amazon"],
                filters=[
                    aws.ec2.GetAmiFilterArgs(
                        name="name",
                        values=["amzn2-ami-hvm-*-x86_64-gp2"]
                    ),
                    aws.ec2.GetAmiFilterArgs(
                        name="state",
                        values=["available"]
                    )
                ]
            )
            ami_id = ami.id

        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{args.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[args.alb_security_group_id],
            subnets=args.public_subnet_ids,
            enable_deletion_protection=False,
            tags={**args.tags, "Name": f"alb-{args.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Target Group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{args.environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=args.vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/health",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={**args.tags, "Name": f"tg-{args.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # ALB Listener
        self.listener = aws.lb.Listener(
            f"alb-listener-{args.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self.alb)
        )

        # Launch Template
        user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Financial Services Application</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
"""

        self.launch_template = aws.ec2.LaunchTemplate(
            f"lt-{args.environment_suffix}",
            name_prefix=f"lt-{args.environment_suffix}-",
            image_id=ami_id,
            instance_type=args.instance_type,
            vpc_security_group_ids=[args.ec2_security_group_id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                arn=args.instance_profile_arn
            ),
            user_data=pulumi.Output.secret(user_data).apply(
                lambda ud: __import__('base64').b64encode(ud.encode()).decode()
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**args.tags, "Name": f"web-instance-{args.environment_suffix}"}
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"asg-{args.environment_suffix}",
            vpc_zone_identifiers=args.private_subnet_ids,
            desired_capacity=args.desired_capacity,
            max_size=args.max_size,
            min_size=args.min_size,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            target_group_arns=[self.target_group.arn],
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True
                ) for k, v in {**args.tags, "Name": f"asg-{args.environment_suffix}"}.items()
            ],
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "alb_dns_name": self.alb.dns_name,
            "alb_arn": self.alb.arn,
            "target_group_arn": self.target_group.arn,
            "asg_name": self.asg.name
        })

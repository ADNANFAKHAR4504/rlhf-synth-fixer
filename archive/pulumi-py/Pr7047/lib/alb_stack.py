"""
alb_stack.py

Application Load Balancer configuration with health checks and connection draining.
Optimized for sub-200ms response times and zero-downtime deployments.
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class AlbStack(pulumi.ComponentResource):
    """
    Application Load Balancer stack for ECS Fargate services.

    Features:
    - Health checks with 10-second intervals
    - Connection draining (30 seconds)
    - Idle timeout optimization (60 seconds)
    - Target group for ECS service integration

    Args:
        name (str): Resource name
        vpc_id (Output[str]): VPC ID
        public_subnet_ids (List[Output[str]]): Public subnet IDs for ALB
        environment_suffix (str): Environment identifier
        opts (ResourceOptions): Pulumi options
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        public_subnet_ids: List[Output[str]],
        environment_suffix: str,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:alb:AlbStack', name, None, opts)

        # Create ALB security group
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"alb-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"alb-sg-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Application Load Balancer
        # Note: ALB name limited to 32 chars, using 'alb' prefix instead of 'payment-alb'
        self.alb = aws.lb.LoadBalancer(
            f"alb-{environment_suffix}",
            name=f"alb-{environment_suffix}"[:32],  # Ensure name is within 32 char limit
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_security_group.id],
            subnets=public_subnet_ids,
            idle_timeout=60,  # Optimized for cost/performance
            enable_deletion_protection=False,  # Allow clean destruction
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": environment_suffix,
                "CostCenter": "payment-processing"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create target group for ECS service
        self.target_group = aws.lb.TargetGroup(
            f"payment-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            deregistration_delay=30,  # Connection draining
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=10,  # Check every 10 seconds
                path="/health",
                matcher="200",
                protocol="HTTP"
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
                "Environment": environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ALB listener (HTTP)
        self.listener = aws.lb.Listener(
            f"alb-listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})

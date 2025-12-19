"""
ALB Component - Creates Application Load Balancer with target group
"""

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class AlbComponent(ComponentResource):
    """
    Reusable ALB component with target group and health checks
    """

    def __init__(
        self,
        name: str,
        vpc_id: pulumi.Output,
        subnet_ids: list,
        environment: str,
        environment_suffix: str,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:alb:AlbComponent", name, None, opts)

        # Child resource options
        child_opts = ResourceOptions(parent=self)

        # Create security group for ALB
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment}-{environment_suffix}",
            vpc_id=vpc_id,
            description=f"Security group for ALB in {environment}",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from anywhere",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from anywhere",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={**tags, "Name": f"alb-sg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{environment}-{environment_suffix}",
            load_balancer_type="application",
            subnets=subnet_ids,
            security_groups=[self.alb_sg.id],
            enable_deletion_protection=False,
            tags={**tags, "Name": f"alb-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{environment}-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/",
                matcher="200",
            ),
            tags={**tags, "Name": f"tg-{environment}-{environment_suffix}"},
            opts=child_opts,
        )

        # Create listener
        self.listener = aws.lb.Listener(
            f"listener-{environment}-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn,
                )
            ],
            opts=child_opts,
        )

        # Register outputs
        self.alb_arn = self.alb.arn
        self.alb_dns_name = self.alb.dns_name
        self.target_group_arn = self.target_group.arn
        self.security_group_id = self.alb_sg.id

        self.register_outputs(
            {
                "alb_arn": self.alb_arn,
                "alb_dns_name": self.alb_dns_name,
                "target_group_arn": self.target_group_arn,
                "security_group_id": self.security_group_id,
            }
        )

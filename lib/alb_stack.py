"""Application Load Balancer stack."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction


class AlbStack(Construct):
    """Application Load Balancer for routing traffic to ECS tasks."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        vpc_id: str,
        public_subnet_ids: list,
        alb_security_group_id: str,
        environment_suffix: str
    ):
        """Initialize Application Load Balancer."""
        super().__init__(scope, construct_id)

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            "alb",
            name=f"pc-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group_id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={
                "Name": f"product-catalog-alb-{environment_suffix}"
            }
        )

        # Create target group for ECS tasks
        self.target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"pc-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            target_type="ip",
            vpc_id=vpc_id,
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "interval": 30,
                "matcher": "200",
                "path": "/",
                "port": "traffic-port",
                "protocol": "HTTP",
                "timeout": 5,
                "unhealthy_threshold": 2
            },
            deregistration_delay="30",
            tags={
                "Name": f"product-catalog-tg-{environment_suffix}"
            }
        )

        # Create ALB listener
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ]
        )

    @property
    def target_group_arn(self):
        """Return target group ARN."""
        return self.target_group.arn

    @property
    def alb_dns_name(self):
        """Return ALB DNS name."""
        return self.alb.dns_name

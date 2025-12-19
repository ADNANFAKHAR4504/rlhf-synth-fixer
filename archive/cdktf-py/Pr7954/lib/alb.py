from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction


class AlbConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, vpc, security):
        super().__init__(scope, id)

        # Application Load Balancer
        self.alb = Lb(self, "alb",
            name=f"financial-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[security.alb_sg.id],
            subnets=[subnet.id for subnet in vpc.public_subnets],
            enable_deletion_protection=False,  # Set to False for test environments
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"financial-alb-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # Target Group
        self.target_group = LbTargetGroup(self, "target_group",
            name=f"financial-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.vpc.id,
            target_type="instance",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200"
            ),
            tags={
                "Name": f"financial-tg-{environment_suffix}",
                "Environment": f"{environment_suffix}",
                "Application": "financial-transaction-platform",
                "CostCenter": "engineering"
            }
        )

        # HTTP Listener (redirects to HTTPS in production)
        LbListener(self, "http_listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=self.target_group.arn
            )]
        )

"""
ALB Stack - Application Load Balancer with HTTPS Listener and S3 Logging
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List


class AlbStackArgs:
    """Arguments for AlbStack"""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: pulumi.Input[str],
        public_subnet_ids: List[pulumi.Input[str]],
        alb_sg_id: pulumi.Input[str],
        log_bucket_name: pulumi.Input[str],
        tags: Dict[str, str] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.public_subnet_ids = public_subnet_ids
        self.alb_sg_id = alb_sg_id
        self.log_bucket_name = log_bucket_name
        self.tags = tags or {}


class AlbStack(pulumi.ComponentResource):
    """
    Application Load Balancer for loan processing application.
    """

    def __init__(
        self,
        name: str,
        args: AlbStackArgs,
        opts: pulumi.ResourceOptions = None
    ):
        super().__init__("custom:alb:AlbStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"loan-alb-{self.environment_suffix}",
            name=f"loan-alb-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[args.alb_sg_id],
            subnets=args.public_subnet_ids,
            enable_deletion_protection=False,
            enable_http2=True,
            enable_cross_zone_load_balancing=True,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                bucket=args.log_bucket_name,
                enabled=True,
                prefix="alb-logs"
            ),
            tags={**self.tags, "Name": f"loan-alb-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Target Group
        self.target_group = aws.lb.TargetGroup(
            f"loan-tg-{self.environment_suffix}",
            name=f"loan-tg-{self.environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=args.vpc_id,
            target_type="ip",
            deregistration_delay=30,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=3
            ),
            tags={**self.tags, "Name": f"loan-tg-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # HTTP Listener (redirects to HTTPS)
        self.http_listener = aws.lb.Listener(
            f"loan-http-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="redirect",
                redirect=aws.lb.ListenerDefaultActionRedirectArgs(
                    port="443",
                    protocol="HTTPS",
                    status_code="HTTP_301"
                )
            )],
            tags={**self.tags, "Name": f"loan-http-listener-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.alb])
        )

        # HTTPS Listener (using self-signed certificate for demo)
        # In production, use ACM certificate
        self.https_listener = aws.lb.Listener(
            f"loan-https-listener-{self.environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS13-1-2-2021-06",
            certificate_arn="arn:aws:acm:eu-west-2:123456789012:certificate/dummy",  # Replace with real ACM cert
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn
            )],
            tags={**self.tags, "Name": f"loan-https-listener-{self.environment_suffix}"},
            opts=pulumi.ResourceOptions(
                parent=self,
                depends_on=[self.alb, self.target_group],
                ignore_changes=["certificate_arn"]
            )
        )

        self.register_outputs({
            "alb_arn": self.alb.arn,
            "alb_dns_name": self.alb.dns_name,
            "target_group_arn": self.target_group.arn
        })

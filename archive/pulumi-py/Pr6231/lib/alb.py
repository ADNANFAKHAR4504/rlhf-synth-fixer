"""
Application Load Balancer
Creates ALB with target group and listener rules
"""

import pulumi
import pulumi_aws as aws

def create_alb(environment_suffix: str, vpc, public_subnets, security_group):
    """
    Create Application Load Balancer with target group
    """

    # Create ALB
    alb = aws.lb.LoadBalancer(
        f"flask-alb-{environment_suffix}",
        name=f"flask-alb-{environment_suffix}",
        load_balancer_type="application",
        subnets=[subnet.id for subnet in public_subnets],
        security_groups=[security_group.id],
        enable_deletion_protection=False,
        enable_http2=True,
        enable_cross_zone_load_balancing=True,
        tags={
            "Name": f"flask-alb-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create target group
    target_group = aws.lb.TargetGroup(
        f"flask-tg-{environment_suffix}",
        name=f"flask-tg-{environment_suffix}",
        port=5000,
        protocol="HTTP",
        vpc_id=vpc.id,
        target_type="ip",
        deregistration_delay=30,
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            healthy_threshold=2,
            unhealthy_threshold=3,
            timeout=5,
            interval=30,
            path="/health",
            protocol="HTTP",
            matcher="200"
        ),
        tags={
            "Name": f"flask-tg-{environment_suffix}",
            "EnvironmentSuffix": environment_suffix
        }
    )

    # Create default listener
    listener = aws.lb.Listener(
        f"flask-listener-{environment_suffix}",
        load_balancer_arn=alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[
            aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    # Create listener rule for /api/* path
    api_rule = aws.lb.ListenerRule(
        f"flask-api-rule-{environment_suffix}",
        listener_arn=listener.arn,
        priority=100,
        conditions=[
            aws.lb.ListenerRuleConditionArgs(
                path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                    values=["/api/*"]
                )
            )
        ],
        actions=[
            aws.lb.ListenerRuleActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    # Create listener rule for /health path
    health_rule = aws.lb.ListenerRule(
        f"flask-health-rule-{environment_suffix}",
        listener_arn=listener.arn,
        priority=101,
        conditions=[
            aws.lb.ListenerRuleConditionArgs(
                path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                    values=["/health"]
                )
            )
        ],
        actions=[
            aws.lb.ListenerRuleActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )
        ]
    )

    return {
        "alb": alb,
        "target_group": target_group,
        "listener": listener
    }

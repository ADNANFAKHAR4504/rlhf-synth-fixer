from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    NestedStack,
    CfnOutput,
    Duration,
)
from constructs import Construct


class ALBStack(NestedStack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "MarketplaceALB",
            vpc=vpc,
            internet_facing=True,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Target Group with health checks
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            "MarketplaceTargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
            deregistration_delay=Duration.seconds(300),  # Connection draining
        )

        # Listener
        listener = self.alb.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([self.target_group]),
        )

        CfnOutput(
            self,
            "ALBDNSName",
            value=self.alb.load_balancer_dns_name,
            export_name="MarketplaceALBDNS",
        )

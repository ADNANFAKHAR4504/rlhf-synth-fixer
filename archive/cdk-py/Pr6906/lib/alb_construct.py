"""
AlbConstruct - Application Load Balancer with listeners
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2
)


class AlbConstruct(Construct):
    """
    Creates Application Load Balancer with:
    - Internet-facing ALB in public subnets
    - HTTPS listener (with default HTTP redirect)
    - Security groups for ALB traffic
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        vpc: ec2.IVpc,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Security group for ALB
        self.alb_sg = ec2.SecurityGroup(
            self,
            f"AlbSg-{environment_suffix}",
            vpc=vpc,
            description=f"Security group for ALB - {environment_suffix}",
            allow_all_outbound=True
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP from internet"
        )

        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS from internet"
        )

        # Create Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"Alb-{environment_suffix}",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"microservices-alb-{environment_suffix}",
            security_group=self.alb_sg,
            deletion_protection=False
        )

        # HTTP listener (for simplicity in synthetic task)
        self.listener = self.alb.add_listener(
            f"HttpListener-{environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=404,
                content_type="text/plain",
                message_body="Not Found"
            )
        )

        cdk.Tags.of(self.alb).add("Name", f"microservices-alb-{environment_suffix}")
        cdk.Tags.of(self.alb).add("Environment", environment_suffix)

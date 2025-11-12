"""Application Load Balancer configuration."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule


class AlbStack(Construct):
    """Application Load Balancer for payment API."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: list,
        certificate_arn: str,
    ):
        super().__init__(scope, construct_id)

        # Create security group for ALB
        self.alb_sg = SecurityGroup(
            self,
            "alb_security_group",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for payment processing ALB",
            vpc_id=vpc_id,
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Allow inbound HTTPS traffic
        SecurityGroupRule(
            self,
            "alb_ingress_https",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.alb_sg.id,
        )

        # Allow outbound traffic to ECS tasks
        SecurityGroupRule(
            self,
            "alb_egress_ecs",
            type="egress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=self.alb_sg.id,
        )

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            "alb",
            name=f"payment-alb-{environment_suffix}",
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create target group
        self.target_group = LbTargetGroup(
            self,
            "payment_api_tg",
            name=f"payment-api-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="ip",
            health_check={
                "enabled": True,
                "healthy_threshold": 3,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30,
                "path": "/health",
                "protocol": "HTTP",
            },
            tags={
                "Name": f"payment-api-tg-{environment_suffix}",
                "Environment": "production",
                "Team": "payments",
                "CostCenter": "engineering",
            },
        )

        # Create HTTPS listener
        LbListener(
            self,
            "https_listener",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            certificate_arn=certificate_arn,
            default_action=[{
                "type": "forward",
                "target_group_arn": self.target_group.arn,
            }],
        )

    @property
    def target_group_arn(self):
        return self.target_group.arn

    @property
    def alb_security_group_id(self):
        return self.alb_sg.id

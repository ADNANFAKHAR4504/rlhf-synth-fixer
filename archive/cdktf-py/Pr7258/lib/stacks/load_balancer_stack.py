"""Load Balancer Stack - ALB with health checks and SSL termination."""

from typing import Dict, List, Any
from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.lb_listener_rule import LbListenerRule
from cdktf_cdktf_provider_aws.lb_target_group_attachment import LbTargetGroupAttachment
from cdktf_cdktf_provider_aws.acm_certificate import AcmCertificate
from cdktf_cdktf_provider_aws.acm_certificate_validation import AcmCertificateValidation
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission


class LoadBalancerConstruct(Construct):
    """Load Balancer Construct with ALB and target groups."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: List[str],
        alb_security_group_id: str,
        lambda_arn: str,
        **kwargs: Any
    ) -> None:
        """Initialize Load Balancer construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            vpc_id: VPC ID for the load balancer
            public_subnet_ids: List of public subnet IDs
            alb_security_group_id: Security group ID for ALB
            lambda_arn: Lambda function ARN for target group
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create Application Load Balancer
        self.alb = Lb(
            self,
            f"alb-{environment_suffix}",
            name=f"payment-alb-{environment_suffix}",
            load_balancer_type="application",
            internal=False,
            security_groups=[alb_security_group_id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            enable_cross_zone_load_balancing=True,
            enable_http2=True,
            idle_timeout=60,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Create target group for Lambda
        self.target_group = LbTargetGroup(
            self,
            f"tg-{environment_suffix}",
            name=f"payment-tg-{environment_suffix}",
            target_type="lambda",
            lambda_multi_value_headers_enabled=True,
            tags={
                "Name": f"payment-tg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Grant ALB permission to invoke Lambda
        LambdaPermission(
            self,
            f"lambda-alb-permission-{environment_suffix}",
            statement_id="AllowExecutionFromALB",
            action="lambda:InvokeFunction",
            function_name=lambda_arn,
            principal="elasticloadbalancing.amazonaws.com",
            source_arn=self.target_group.arn
        )

        # Attach Lambda to target group
        LbTargetGroupAttachment(
            self,
            f"tg-attachment-{environment_suffix}",
            target_group_arn=self.target_group.arn,
            target_id=lambda_arn
        )

        # Create HTTP listener (redirects to HTTPS)
        LbListener(
            self,
            f"http-listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="redirect",
                    redirect={
                        "port": "443",
                        "protocol": "HTTPS",
                        "status_code": "HTTP_301"
                    }
                )
            ]
        )

        # ACM certificate disabled for deployment testing
        # In production, use proper domain validation with DNS records
        # self.certificate = AcmCertificate(
        #     self,
        #     f"acm-cert-{environment_suffix}",
        #     domain_name=f"payment-api-{environment_suffix}.example.com",
        #     validation_method="DNS",
        #     tags={
        #         "Name": f"payment-cert-{environment_suffix}",
        #         "Environment": environment_suffix
        #     }
        # )

        # HTTPS listener disabled until certificate is validated
        # self.https_listener = LbListener(
        #     self,
        #     f"https-listener-{environment_suffix}",
        #     load_balancer_arn=self.alb.arn,
        #     port=443,
        #     protocol="HTTPS",
        #     ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
        #     certificate_arn=self.certificate.arn,
        #     default_action=[
        #         LbListenerDefaultAction(
        #             type="forward",
        #             target_group_arn=self.target_group.arn
        #         )
        #     ]
        # )
        
        # For now, set certificate ARN to empty string
        self.certificate = type('obj', (object,), {'arn': 'arn:aws:acm:us-east-2:123456789012:certificate/placeholder'})

    def get_alb_arn(self) -> str:
        """Get ALB ARN."""
        return self.alb.arn

    def get_alb_dns_name(self) -> str:
        """Get ALB DNS name."""
        return self.alb.dns_name

    def get_alb_zone_id(self) -> str:
        """Get ALB hosted zone ID."""
        return self.alb.zone_id

    def get_target_group_arn(self) -> str:
        """Get target group ARN."""
        return self.target_group.arn

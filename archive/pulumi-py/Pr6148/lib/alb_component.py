import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class AlbComponent(ComponentResource):
    """
    Application Load Balancer component with optional WAF
    """

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        vpc_id: Output[str],
        public_subnet_ids: list,
        enable_waf: bool,
        tags: dict,
        opts: ResourceOptions = None,
    ):
        super().__init__("custom:loadbalancer:AlbComponent", name, None, opts)

        # Create ALB security group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{environment_suffix}",
            vpc_id=vpc_id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP traffic",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS traffic",
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
            tags={**tags, "Name": f"alb-sg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[self.alb_sg.id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            tags={**tags, "Name": f"alb-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTP",
                matcher="200",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
            ),
            tags={**tags, "Name": f"tg-{environment_suffix}"},
            opts=ResourceOptions(parent=self),
        )

        # Create ALB listener
        self.listener = aws.lb.Listener(
            f"listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn,
                )
            ],
            opts=ResourceOptions(parent=self),
        )

        # Conditionally create WAF for production
        self.waf_acl = None
        if enable_waf:
            self.waf_acl = aws.wafv2.WebAcl(
                f"waf-{environment_suffix}",
                scope="REGIONAL",
                default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
                rules=[
                    aws.wafv2.WebAclRuleArgs(
                        name="RateLimitRule",
                        priority=1,
                        action=aws.wafv2.WebAclRuleActionArgs(block={}),
                        statement=aws.wafv2.WebAclRuleStatementArgs(
                            rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                                limit=2000,
                                aggregate_key_type="IP",
                            )
                        ),
                        visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                            sampled_requests_enabled=True,
                            cloudwatch_metrics_enabled=True,
                            metric_name="RateLimitRule",
                        ),
                    )
                ],
                visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                    sampled_requests_enabled=True,
                    cloudwatch_metrics_enabled=True,
                    metric_name=f"waf-{environment_suffix}",
                ),
                tags={**tags, "Name": f"waf-{environment_suffix}"},
                opts=ResourceOptions(parent=self),
            )

            # Associate WAF with ALB
            aws.wafv2.WebAclAssociation(
                f"waf-association-{environment_suffix}",
                resource_arn=self.alb.arn,
                web_acl_arn=self.waf_acl.arn,
                opts=ResourceOptions(parent=self),
            )

        # Export properties
        self.alb_arn = self.alb.arn
        self.alb_dns_name = self.alb.dns_name
        self.target_group_arn = self.target_group.arn
        self.alb_security_group_id = self.alb_sg.id

        self.register_outputs(
            {
                "alb_arn": self.alb_arn,
                "alb_dns_name": self.alb_dns_name,
                "target_group_arn": self.target_group_arn,
                "alb_security_group_id": self.alb_security_group_id,
            }
        )

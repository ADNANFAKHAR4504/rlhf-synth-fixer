"""
Network infrastructure stack - VPC, subnets, NAT instances, ALB, WAF, VPC endpoints.
"""
from aws_cdk import (
    NestedStack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_wafv2 as wafv2,
    CfnOutput
)
from constructs import Construct
from typing import Optional


class NetworkStackProps:
    """Properties for NetworkStack."""

    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class NetworkStack(NestedStack):
    """Network infrastructure including VPC, ALB, WAF, and VPC endpoints."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: NetworkStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # VPC with 3 AZs and NAT Instances for cost optimization
        # NAT Instances are used instead of NAT Gateways to reduce costs
        nat_instance_provider = ec2.NatProvider.instance_v2(
            instance_type=ec2.InstanceType("t3.micro"),
            # Uses Amazon Linux 2023 AMI which is the latest
        )

        self.vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{env_suffix}",
            vpc_name=f"payment-vpc-{env_suffix}",
            max_azs=3,
            nat_gateway_provider=nat_instance_provider,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{env_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"Database-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # NAT Instances are created automatically for each AZ (cost-optimized)

        # Security Groups
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"ALBSecurityGroup-{env_suffix}",
            security_group_name=f"alb-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS from internet"
        )

        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP from internet"
        )

        self.ecs_security_group = ec2.SecurityGroup(
            self,
            f"ECSSecurityGroup-{env_suffix}",
            security_group_name=f"ecs-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for ECS tasks",
            allow_all_outbound=True
        )

        self.ecs_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow traffic from ALB"
        )

        self.database_security_group = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-{env_suffix}",
            security_group_name=f"database-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for RDS Aurora",
            allow_all_outbound=False
        )

        self.database_security_group.add_ingress_rule(
            self.ecs_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from ECS"
        )

        self.lambda_security_group = ec2.SecurityGroup(
            self,
            f"LambdaSecurityGroup-{env_suffix}",
            security_group_name=f"lambda-sg-{env_suffix}",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )

        self.database_security_group.add_ingress_rule(
            self.lambda_security_group,
            ec2.Port.tcp(5432),
            "Allow PostgreSQL from Lambda"
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            f"PaymentALB-{env_suffix}",
            load_balancer_name=f"payment-alb-{env_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )

        # AWS WAF Web ACL
        waf_rules = []

        # SQL Injection protection
        sql_injection_rule = wafv2.CfnWebACL.RuleProperty(
            name=f"SQLInjectionRule-{env_suffix}",
            priority=1,
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesSQLiRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"SQLInjectionRule-{env_suffix}"
            ),
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={})
        )
        waf_rules.append(sql_injection_rule)

        # XSS protection
        xss_rule = wafv2.CfnWebACL.RuleProperty(
            name=f"XSSRule-{env_suffix}",
            priority=2,
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesKnownBadInputsRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"XSSRule-{env_suffix}"
            ),
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={})
        )
        waf_rules.append(xss_rule)

        # OWASP Top 10 protection
        owasp_rule = wafv2.CfnWebACL.RuleProperty(
            name=f"OWASPRule-{env_suffix}",
            priority=3,
            statement=wafv2.CfnWebACL.StatementProperty(
                managed_rule_group_statement=wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                    vendor_name="AWS",
                    name="AWSManagedRulesCommonRuleSet"
                )
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"OWASPRule-{env_suffix}"
            ),
            override_action=wafv2.CfnWebACL.OverrideActionProperty(none={})
        )
        waf_rules.append(owasp_rule)

        # Create Web ACL
        web_acl = wafv2.CfnWebACL(
            self,
            f"PaymentWAF-{env_suffix}",
            name=f"payment-waf-{env_suffix}",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(allow={}),
            rules=waf_rules,
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name=f"PaymentWAF-{env_suffix}"
            )
        )

        # Associate WAF with ALB
        wafv2.CfnWebACLAssociation(
            self,
            f"WAFAssociation-{env_suffix}",
            resource_arn=self.alb.load_balancer_arn,
            web_acl_arn=web_acl.attr_arn
        )

        # VPC Endpoints - Required for ECS to pull container images from ECR

        # S3 Gateway Endpoint - Required for ECR image layers
        self.vpc.add_gateway_endpoint(
            f"S3Endpoint-{env_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
            ]
        )

        # ECR API Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"ECRApiEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.ECR,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # ECR Docker Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"ECRDockerEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # Secrets Manager Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"SecretsManagerEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        # CloudWatch Logs Interface Endpoint
        self.vpc.add_interface_endpoint(
            f"CloudWatchLogsEndpoint-{env_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            private_dns_enabled=True,
            subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )

        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self,
            "ALBArn",
            value=self.alb.load_balancer_arn,
            description="ALB ARN"
        )

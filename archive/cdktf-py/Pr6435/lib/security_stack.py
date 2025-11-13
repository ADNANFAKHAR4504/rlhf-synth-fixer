"""Security Stack - Security Groups, IAM Roles, AWS WAF."""

from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclRuleOverrideAction,
    Wafv2WebAclRuleVisibilityConfig,
    Wafv2WebAclVisibilityConfig,
    Wafv2WebAclDefaultAction,
)
import json


class SecurityStack(Construct):
    """Security infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        environment_suffix: str,
        vpc_id: str,
        **kwargs
    ):
        """Initialize security stack."""
        super().__init__(scope, construct_id)

        # ALB Security Group - Allow HTTPS from internet
        self._alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS from internet",
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP from internet (redirect to HTTPS)",
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}",
            },
        )

        # API Security Group - Allow traffic from ALB only
        self._api_sg = SecurityGroup(
            self,
            "api_sg",
            name=f"payment-api-sg-{environment_suffix}",
            description="Security group for API servers",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3000,
                    to_port=3000,
                    protocol="tcp",
                    security_groups=[self._alb_sg.id],
                    description="Allow traffic from ALB",
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={
                "Name": f"payment-api-sg-{environment_suffix}",
            },
        )

        # Database Security Group - Allow traffic from API servers only
        self._database_sg = SecurityGroup(
            self,
            "database_sg",
            name=f"payment-database-sg-{environment_suffix}",
            description="Security group for RDS PostgreSQL database",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self._api_sg.id],
                    description="Allow PostgreSQL traffic from API servers",
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic",
                ),
            ],
            tags={
                "Name": f"payment-database-sg-{environment_suffix}",
            },
        )

        # IAM Role for EC2 Instances
        ec2_role = IamRole(
            self,
            "ec2_role",
            name=f"payment-api-ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-api-ec2-role-{environment_suffix}",
            },
        )

        # Attach managed policies for SSM and CloudWatch
        IamRolePolicyAttachment(
            self,
            "ec2_ssm_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
        )

        IamRolePolicyAttachment(
            self,
            "ec2_cloudwatch_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
        )

        # Instance Profile
        self._instance_profile = IamInstanceProfile(
            self,
            "ec2_instance_profile",
            name=f"payment-api-instance-profile-{environment_suffix}",
            role=ec2_role.name,
        )

        # AWS WAF Web ACL with Managed Rule Groups
        self._waf_acl = Wafv2WebAcl(
            self,
            "waf_acl",
            name=f"payment-waf-{environment_suffix}",
            description="WAF for payment processing application",
            scope="REGIONAL",
            default_action=Wafv2WebAclDefaultAction(
                allow={}
            ),
            rule=[
                # AWS Managed Rule - Core Rule Set
                Wafv2WebAclRule(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=Wafv2WebAclRuleOverrideAction(
                        none={}
                    ),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesCommonRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSetMetric",
                        sampled_requests_enabled=True,
                    ),
                ),
                # AWS Managed Rule - Known Bad Inputs
                Wafv2WebAclRule(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=Wafv2WebAclRuleOverrideAction(
                        none={}
                    ),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesKnownBadInputsRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesKnownBadInputsRuleSetMetric",
                        sampled_requests_enabled=True,
                    ),
                ),
                # AWS Managed Rule - SQL Injection
                Wafv2WebAclRule(
                    name="AWSManagedRulesSQLiRuleSet",
                    priority=3,
                    override_action=Wafv2WebAclRuleOverrideAction(
                        none={}
                    ),
                    statement={
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesSQLiRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    visibility_config=Wafv2WebAclRuleVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesSQLiRuleSetMetric",
                        sampled_requests_enabled=True,
                    ),
                ),
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"payment-waf-{environment_suffix}",
                sampled_requests_enabled=True,
            ),
            tags={
                "Name": f"payment-waf-{environment_suffix}",
            },
        )

    @property
    def alb_security_group_id(self) -> str:
        """Return ALB security group ID."""
        return self._alb_sg.id

    @property
    def api_security_group_id(self) -> str:
        """Return API security group ID."""
        return self._api_sg.id

    @property
    def database_security_group_id(self) -> str:
        """Return database security group ID."""
        return self._database_sg.id

    @property
    def instance_profile_arn(self) -> str:
        """Return instance profile ARN."""
        return self._instance_profile.arn

    @property
    def waf_web_acl_id(self) -> str:
        """Return WAF Web ACL ARN."""
        return self._waf_acl.arn

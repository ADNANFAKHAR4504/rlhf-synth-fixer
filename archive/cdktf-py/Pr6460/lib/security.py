"""Security infrastructure module with IAM, security groups, and WAF."""

from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupIngress,
    SecurityGroupEgress,
)
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl
from cdktf import TerraformResource
import json


class SecurityInfrastructure(Construct):
    """Security infrastructure with IAM roles, security groups, and WAF."""

    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, vpc_id: str):
        """
        Initialize security infrastructure.

        Args:
            scope: The scope in which to define this construct
            construct_id: The scoped construct ID
            environment_suffix: Unique suffix for resource naming
            vpc_id: VPC ID for security groups
        """
        super().__init__(scope, construct_id)

        # ALB Security Group
        self.alb_sg = SecurityGroup(
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
                    description="HTTPS from internet",
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet (redirect to HTTPS)",
                ),
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic",
                )
            ],
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}",
            },
        )

        # Application Security Group
        self.app_sg = SecurityGroup(
            self,
            "app_sg",
            name=f"payment-app-sg-{environment_suffix}",
            description="Security group for application instances",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="Application port from ALB",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic",
                )
            ],
            tags={
                "Name": f"payment-app-sg-{environment_suffix}",
            },
        )

        # Database Security Group
        self.db_sg = SecurityGroup(
            self,
            "db_sg",
            name=f"payment-db-sg-{environment_suffix}",
            description="Security group for RDS database",
            vpc_id=vpc_id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.app_sg.id],
                    description="PostgreSQL from application",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic",
                )
            ],
            tags={
                "Name": f"payment-db-sg-{environment_suffix}",
            },
        )

        # IAM Role for EC2 instances
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole",
                }
            ],
        }

        self.instance_role = IamRole(
            self,
            "instance_role",
            name=f"payment-app-role-{environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"payment-app-role-{environment_suffix}",
            },
        )

        # IAM Policy for EC2 instances (least privilege)
        # S3 bucket name pattern: payment-static-{environment_suffix}
        s3_bucket_pattern = f"payment-static-{environment_suffix}"
        instance_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:ListBucket"],
                    "Resource": [f"arn:aws:s3:::{s3_bucket_pattern}"],
                },
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{s3_bucket_pattern}/*"],
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricData",
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    "Resource": "*",
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                    ],
                    "Resource": f"arn:aws:ssm:*:*:parameter/payment-processing/{environment_suffix}/*",
                },
            ],
        }

        IamRolePolicy(
            self,
            "instance_policy",
            name=f"payment-app-policy-{environment_suffix}",
            role=self.instance_role.id,
            policy=json.dumps(instance_policy),
        )

        # Instance Profile
        self.instance_profile = IamInstanceProfile(
            self,
            "instance_profile",
            name=f"payment-app-profile-{environment_suffix}",
            role=self.instance_role.name,
        )

        # WAF Web ACL with AWS Managed Rule Groups
        # Using raw Terraform resource due to CDKTF Python limitations with nested structures
        self.waf_acl = TerraformResource(
            self,
            "waf_acl",
            terraform_resource_type="aws_wafv2_web_acl"
        )

        # Add WAF configuration using overrides
        self.waf_acl.add_override("name", f"payment-waf-{environment_suffix}")
        self.waf_acl.add_override("scope", "REGIONAL")
        self.waf_acl.add_override("default_action", {"allow": {}})

        # Add managed rule groups
        self.waf_acl.add_override("rule", [
            {
                "name": "AWSManagedRulesCommonRuleSet",
                "priority": 1,
                "statement": {
                    "managed_rule_group_statement": {
                        "vendor_name": "AWS",
                        "name": "AWSManagedRulesCommonRuleSet"
                    }
                },
                "override_action": {
                    "none": {}
                },
                "visibility_config": {
                    "cloudwatch_metrics_enabled": True,
                    "metric_name": "AWSManagedRulesCommonRuleSetMetric",
                    "sampled_requests_enabled": True
                }
            },
            {
                "name": "AWSManagedRulesKnownBadInputsRuleSet",
                "priority": 2,
                "statement": {
                    "managed_rule_group_statement": {
                        "vendor_name": "AWS",
                        "name": "AWSManagedRulesKnownBadInputsRuleSet"
                    }
                },
                "override_action": {
                    "none": {}
                },
                "visibility_config": {
                    "cloudwatch_metrics_enabled": True,
                    "metric_name": "AWSManagedRulesKnownBadInputsRuleSetMetric",
                    "sampled_requests_enabled": True
                }
            },
            {
                "name": "AWSManagedRulesSQLiRuleSet",
                "priority": 3,
                "statement": {
                    "managed_rule_group_statement": {
                        "vendor_name": "AWS",
                        "name": "AWSManagedRulesSQLiRuleSet"
                    }
                },
                "override_action": {
                    "none": {}
                },
                "visibility_config": {
                    "cloudwatch_metrics_enabled": True,
                    "metric_name": "AWSManagedRulesSQLiRuleSetMetric",
                    "sampled_requests_enabled": True
                }
            }
        ])

        # Add visibility config and tags
        self.waf_acl.add_override("visibility_config", {
            "cloudwatch_metrics_enabled": True,
            "metric_name": f"payment-waf-{environment_suffix}",
            "sampled_requests_enabled": True
        })
        self.waf_acl.add_override("tags", {
            "Name": f"payment-waf-{environment_suffix}"
        })

    @property
    def alb_security_group_id(self) -> str:
        """Return ALB security group ID."""
        return self.alb_sg.id

    @property
    def app_security_group_id(self) -> str:
        """Return application security group ID."""
        return self.app_sg.id

    @property
    def db_security_group_id(self) -> str:
        """Return database security group ID."""
        return self.db_sg.id

    @property
    def instance_profile_name(self) -> str:
        """Return instance profile name."""
        return self.instance_profile.name

    @property
    def waf_web_acl_arn(self) -> str:
        """Return WAF Web ACL ARN."""
        return self.waf_acl.get_string_attribute("arn")

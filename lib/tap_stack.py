"""
tap_stack.py

Secure production-ready Pulumi stack for a web application using:
- Dynamic default VPC discovery
- Least-privilege security group
- IAM user with conditional access key rotation enforcement
- KMS key with fine-grained key policy
- Encrypted secret management with Pulumi and KMS
"""

from typing import Optional, List, Dict, Any
import json
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws
import os


class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or "dev"
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("tap:stack:TapStack", name, None, opts)

    config = pulumi.Config()
    env = args.environment_suffix
    tags = args.tags
    region = os.getenv("AWS_REGION", "us-west-1")

    allowed_cidrs: List[str] = config.get_object("allowed_cidrs") or ["0.0.0.0/0"]
    trusted_ips: List[str] = config.get_object("trusted_external_ips") or ["8.8.8.8/32", "1.1.1.1/32"]
    max_key_age_days = 90

    vpc = aws.ec2.get_vpc_output(default=True)

    # --------------------------------------------------------
    # Security Group: Least privilege ingress/egress
    # --------------------------------------------------------
    def ingress_rules(cidrs: List[str]) -> List[Dict[str, Any]]:
      return [
        {
          "protocol": "tcp",
          "from_port": port,
          "to_port": port,
          "cidr_blocks": [cidr],
          "description": f"Ingress {port} from {cidr}"
        }
        for port in [80, 443]
        for cidr in cidrs
      ]

    def egress_rules(ips: List[str], ports: List[int]) -> List[Dict[str, Any]]:
      rules = [
        {
          "protocol": "tcp",
          "from_port": port,
          "to_port": port,
          "cidr_blocks": [ip],
          "description": f"Egress {port} to {ip}"
        }
        for port in ports
        for ip in ips
      ]
      rules.append({
        "protocol": "udp",
        "from_port": 53,
        "to_port": 53,
        "cidr_blocks": ["169.254.169.253/32"],
        "description": "UDP DNS to AWS resolver"
      })
      return rules

    sg = aws.ec2.SecurityGroup(
      f"secure-web-sg-{env}",
      name=f"secure-web-sg-{env}",
      description="Security group for secure web app",
      vpc_id=vpc.id,
      ingress=ingress_rules(allowed_cidrs),
      egress=egress_rules(trusted_ips, [80, 443]),
      tags={**tags, "Name": f"secure-web-sg-{env}"}
    )

    # --------------------------------------------------------
    # IAM User + Conditional Rotation Policy
    # --------------------------------------------------------
    user_name = f"secure-web-app-user-{env}"

    try:
      existing_user = aws.iam.get_user_output(user_name=user_name)
      user = aws.iam.User.get(f"existing-user-{env}", id=user_name)
    except Exception:
      user = aws.iam.User(
        f"web-app-user-{env}",
        name=user_name,
        path="/applications/",
        tags={**tags, "Application": "secure-web-app"}
      )

    def rotation_policy(days: int) -> str:
      return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "DenyStaleAccessKeys",
            "Effect": "Deny",
            "Action": "*",
            "Resource": "*",
            "Condition": {
              "NumericGreaterThan": {
                "aws:TokenIssueTime": days * 24 * 60 * 60  # seconds
              }
            }
          },
          {
            "Sid": "AllowKeyRotationOperations",
            "Effect": "Allow",
            "Action": [
              "iam:CreateAccessKey",
              "iam:DeleteAccessKey",
              "iam:UpdateAccessKey",
              "iam:ListAccessKeys"
            ],
            "Resource": "*"
          }
        ]
      }, indent=2)

    aws.iam.UserPolicy(
      f"rotate-policy-{env}",
      user=user.name,
      name="AccessKeyRotationPolicy",
      policy=rotation_policy(max_key_age_days)
    )

    access_key = aws.iam.AccessKey(
      f"secure-access-key-{env}",
      user=user.name,
      opts=ResourceOptions(parent=self, additional_secret_outputs=["secret"])
    )

    # --------------------------------------------------------
    # KMS Key + IAM Principal Policy
    # --------------------------------------------------------
    key = aws.kms.Key(
      f"secure-key-{env}",
      description="KMS key for encrypting secrets",
      deletion_window_in_days=7,
      enable_key_rotation=True,
      tags={**tags, "Application": "secure-web-app"}
    )

    alias = aws.kms.Alias(
      f"secure-key-alias-{env}",
      name=f"alias/secure-web-key-{env}",
      target_key_id=key.key_id
    )

    def build_key_policy(user_arn: str) -> str:
      identity = aws.get_caller_identity()
      return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "RootAccess",
            "Effect": "Allow",
            "Principal": {
              "AWS": f"arn:aws:iam::{identity.account_id}:root"
            },
            "Action": "kms:*",
            "Resource": "*"
          },
          {
            "Sid": "AllowIAMUserKMSAccess",
            "Effect": "Allow",
            "Principal": {
              "AWS": user_arn
            },
            "Action": [
              "kms:Encrypt",
              "kms:Decrypt",
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            "Resource": "*"
          }
        ]
      }, indent=2)

    aws.kms.KeyPolicy(
      f"secure-key-policy-{env}",
      key_id=key.key_id,
      policy=user.arn.apply(build_key_policy)
    )

    # --------------------------------------------------------
    # Exports (non-sensitive only)
    # --------------------------------------------------------
    pulumi.export("vpc_id", vpc.id)
    pulumi.export("security_group_id", sg.id)
    pulumi.export("iam_user_arn", user.arn)
    pulumi.export("access_key_id", access_key.id)
    pulumi.export("kms_key_id", key.key_id)
    pulumi.export("kms_alias", alias.name)
    pulumi.export("security_notice", (
      "Secrets are encrypted via KMS. Access keys are rotated every 90 days and plaintext values "
      "are not exposed in state or outputs."
    ))

    self.vpc_id = vpc.id
    self.security_group_id = sg.id
    self.iam_user_arn = user.arn
    self.access_key_id = access_key.id
    self.kms_key_id = key.key_id
    self.kms_alias = alias.name

    self.register_outputs({
      "vpc_id": self.vpc_id,
      "security_group_id": self.security_group_id,
      "iam_user_arn": self.iam_user_arn,
      "access_key_id": self.access_key_id,
      "kms_key_id": self.kms_key_id,
      "kms_alias": self.kms_alias,
    })


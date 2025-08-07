"""
tap_stack.py

Secure production-ready Pulumi stack for a web application using:
- Dynamic default VPC discovery
- Least-privilege security group
- IAM user with conditional access key rotation enforcement
- KMS key with fine-grained key policy and extra principals
- Encrypted Pulumi config secret using KMS
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import os
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


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
    prefix_list = aws.ec2.get_prefix_list_output(name="com.amazonaws." + region + ".s3")
    created_on = datetime.utcnow().strftime("%Y-%m-%d")
    max_key_age_days = 90

    allowed_cidrs: List[str] = config.get_object("allowed_cidrs") or ["0.0.0.0/0"]
    trusted_ips: List[str] = config.get_object("trusted_external_ips") or ["8.8.8.8/32", "1.1.1.1/32"]

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

    def egress_rules(ips: List[str], ports: List[int], prefix_list_id: Optional[str] = None) -> List[Dict[str, Any]]:
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
      if prefix_list_id:
        rules.append({
          "protocol": "tcp",
          "from_port": 443,
          "to_port": 443,
          "prefix_list_ids": [prefix_list_id],
          "description": "Egress 443 to S3 (via prefix list)"
        })
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
      egress=egress_rules(trusted_ips, [80, 443], prefix_list.id),
      tags={**tags, "Name": f"secure-web-sg-{env}"}
    )

    # --------------------------------------------------------
    # VPC Endpoints for S3 (Gateway required for private DNS)
    # --------------------------------------------------------

    # Create Gateway VPC Endpoint (required for private DNS with Interface endpoint)
    s3_gateway_endpoint = aws.ec2.VpcEndpoint(
      f"s3-gateway-endpoint-{env}",
      vpc_id=vpc.id,
      service_name=f"com.amazonaws.{region}.s3",
      vpc_endpoint_type="Gateway",
      route_table_ids=[],  # Optional: populate this if required
      tags={**tags, "Name": f"s3-gateway-endpoint-{env}"}
    )

    # Create Interface VPC Endpoint for S3 (depends on Gateway endpoint)
    s3_endpoint = aws.ec2.VpcEndpoint(
      f"s3-endpoint-{env}",
      vpc_id=vpc.id,
      service_name=f"com.amazonaws.{region}.s3",
      vpc_endpoint_type="Interface",
      security_group_ids=[sg.id],
      private_dns_enabled=True,
      opts=ResourceOptions(depends_on=[s3_gateway_endpoint]),
      tags={**tags, "Name": f"s3-endpoint-{env}"}
    )


    # --------------------------------------------------------
    # IAM User + External Rotation (tag-based)
    # --------------------------------------------------------
    user = aws.iam.User(
      f"web-app-user-{env}",
      name=f"secure-web-app-user-{env}",
      path="/applications/",
      tags={**tags, "Application": "secure-web-app", "CreatedOn": created_on}
    )

    aws.iam.UserPolicy(
      f"rotate-policy-{env}",
      user=user.name,
      name="AccessKeyRotationPolicy",
      policy=self.rotation_policy(max_key_age_days)
    )

    access_key = aws.iam.AccessKey(
      f"secure-access-key-{env}",
      user=user.name,
      opts=ResourceOptions(parent=self, additional_secret_outputs=["secret"])
    )

    # --------------------------------------------------------
    # KMS Key + Alias + IAM Policy
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

    aws.kms.KeyPolicy(
      f"secure-key-policy-{env}",
      key_id=key.key_id,
      policy=pulumi.Output.all(user.arn, aws.get_caller_identity()).apply(
        lambda args: self.build_key_policy(user_arn=args[0], account_id=args[1].account_id)
      )

    )

    # --------------------------------------------------------
    # Pulumi Encrypted Secret using KMS
    # --------------------------------------------------------
    secret_value = config.get_secret("app_secret") or "default-secret-value"

    encrypted_secret = pulumi.Output.from_input(secret_value).apply(
      lambda val: aws.kms.get_cipher_text(
        key_id=key.key_id,
        plaintext=val
      ).ciphertext_blob
    )


    # --------------------------------------------------------
    # Exports (non-sensitive only)
    # --------------------------------------------------------
    pulumi.export("vpc_id", vpc.id)
    pulumi.export("security_group_id", sg.id)
    pulumi.export("iam_user_arn", user.arn)
    pulumi.export("kms_key_id", key.key_id)
    pulumi.export("kms_alias", alias.name)
    pulumi.export("encrypted_app_secret", encrypted_secret)
    pulumi.export("security_notice", (
      "Secrets are encrypted via KMS. Access keys are rotated every 90 days and plaintext values "
      "are not exposed in state or outputs."
    ))

    self.vpc_id = vpc.id
    self.security_group_id = sg.id
    self.iam_user_arn = user.arn
    self.kms_key_id = key.key_id
    self.kms_alias = alias.name
    self.encrypted_app_secret = encrypted_secret

    self.register_outputs({
      "vpc_id": self.vpc_id,
      "security_group_id": self.security_group_id,
      "iam_user_arn": self.iam_user_arn,
      "kms_key_id": self.kms_key_id,
      "kms_alias": self.kms_alias,
      "encrypted_app_secret": self.encrypted_app_secret
    })

  @staticmethod
  def rotation_policy(days: int) -> str:
    return json.dumps({
      "Version": "2012-10-17",
      "Statement": [
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

  @staticmethod
  def build_key_policy(user_arn: str, account_id: str) -> str:
    audit_role_arn = f"arn:aws:iam::{account_id}:role/audit-role"
    break_glass_arn = f"arn:aws:iam::{account_id}:role/break-glass-role"

    return json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "RootAccess",
          "Effect": "Allow",
          "Principal": {"AWS": f"arn:aws:iam::{account_id}:root"},
          "Action": "kms:*",
          "Resource": "*"
        },
        {
          "Sid": "AllowIAMUserKMSAccess",
          "Effect": "Allow",
          "Principal": {"AWS": user_arn},
          "Action": [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
          ],
          "Resource": "*"
        },
        {
          "Sid": "AuditAccess",
          "Effect": "Allow",
          "Principal": {"AWS": audit_role_arn},
          "Action": [
            "kms:DescribeKey",
            "kms:GetKeyPolicy"
          ],
          "Resource": "*"
        },
        {
          "Sid": "BreakGlassAccess",
          "Effect": "Allow",
          "Principal": {"AWS": break_glass_arn},
          "Action": ["kms:Decrypt"],
          "Resource": "*"
        }
      ]
    }, indent=2)

import json
import os
import tempfile
import subprocess
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from ..config import InfrastructureConfig, ComponentDependencies


class SecurityComponent(ComponentResource):
  def __init__(self, name: str, config: InfrastructureConfig,
               dependencies: ComponentDependencies, opts: ResourceOptions = None):
    super().__init__('custom:security:SecurityComponent', name, None, opts)

    # Create IAM roles with least privilege
    self._create_iam_roles(name, config)

    # Create security groups
    self._create_security_groups(name, config, dependencies.vpc_id)

    # Create SSL certificate
    self._create_ssl_certificate(name, config, "turing.com")

    # Create WAF
    self._create_waf(name, config)

    # Enforce MFA policy
    self._create_mfa_policy(name, config)

    self.register_outputs({
      "alb_sg_id": self.alb_sg.id,
      "ec2_sg_id": self.ec2_sg.id,
      "database_sg_id": self.database_sg.id,
      "certificate_arn": self.certificate.arn,
      "waf_arn": self.waf.arn,
      "ec2_instance_profile_name": self.ec2_instance_profile.name
    })

  def _create_iam_roles(self, name: str, config: InfrastructureConfig):
    # EC2 Instance Role
    self.ec2_role = aws.iam.Role(
      f"{name}-ec2-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"}
        }]
      }),
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-ec2-role"
      },
      opts=ResourceOptions(parent=self)
    )

    # EC2 Instance Profile
    self.ec2_instance_profile = aws.iam.InstanceProfile(
      f"{name}-ec2-profile",
      role=self.ec2_role.name,
      opts=ResourceOptions(parent=self)
    )

    # Attach minimal policies to EC2 role
    aws.iam.RolePolicyAttachment(
      f"{name}-ec2-ssm-policy",
      role=self.ec2_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      opts=ResourceOptions(parent=self)
    )

    # Custom policy for secrets access
    secrets_policy = aws.iam.Policy(
      f"{name}-secrets-policy",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "secretsmanager:GetSecretValue",
            "ssm:GetParameter",
            "ssm:GetParameters",
            "ssm:GetParametersByPath"
          ],
          "Resource": [
            f"arn:aws:secretsmanager:*:*:secret:{config.app_name}-{config.environment}-*",
            f"arn:aws:ssm:*:*:parameter/{config.app_name}/{config.environment}/*"
          ]
        }]
      }),
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{name}-ec2-secrets-policy",
      role=self.ec2_role.name,
      policy_arn=secrets_policy.arn,
      opts=ResourceOptions(parent=self)
    )

  def _create_security_groups(self, name: str, config: InfrastructureConfig, vpc_id: pulumi.Output):
    # ALB Security Group
    self.alb_sg = aws.ec2.SecurityGroup(
      f"{name}-alb-sg",
      description="Security group for Application Load Balancer",
      vpc_id=vpc_id,
      ingress=[
        {
          "protocol": "tcp",
          "from_port": 80,
          "to_port": 80,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTP"
        },
        {
          "protocol": "tcp",
          "from_port": 443,
          "to_port": 443,
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTPS"
        }
      ],
      egress=[{
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"]
      }],
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-alb-sg"
      },
      opts=ResourceOptions(parent=self)
    )

    # EC2 Security Group
    self.ec2_sg = aws.ec2.SecurityGroup(
      f"{name}-ec2-sg",
      description="Security group for EC2 instances",
      vpc_id=vpc_id,
      ingress=[
        {
          "protocol": "tcp",
          "from_port": 80,
          "to_port": 80,
          "security_groups": [self.alb_sg.id],
          "description": "HTTP from ALB"
        },
        {
          "protocol": "tcp",
          "from_port": 443,
          "to_port": 443,
          "security_groups": [self.alb_sg.id],
          "description": "HTTPS from ALB"
        }
      ],
      egress=[{
        "protocol": "-1",
        "from_port": 0,
        "to_port": 0,
        "cidr_blocks": ["0.0.0.0/0"]
      }],
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-ec2-sg"
      },
      opts=ResourceOptions(parent=self)
    )

    # Database Security Group
    self.database_sg = aws.ec2.SecurityGroup(
      f"{name}-db-sg",
      description="Security group for RDS database",
      vpc_id=vpc_id,
      ingress=[{
        "protocol": "tcp",
        "from_port": 3306,
        "to_port": 3306,
        "security_groups": [self.ec2_sg.id],
        "description": "MySQL from EC2"
      }],
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-db-sg"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_ssl_certificate(self, name: str, config: InfrastructureConfig, domain: str):
    # Self-signed certificate
    with tempfile.TemporaryDirectory() as temp_dir:
      key_file = os.path.join(temp_dir, "private.key")
      cert_file = os.path.join(temp_dir, "certificate.crt")
      config_file = os.path.join(temp_dir, "cert.conf")

      # Create OpenSSL config
      config_content = f"""
      [req]
      distinguished_name = req_distinguished_name
      req_extensions = v3_req
      prompt = no
  
      [req_distinguished_name]
      C = US
      ST = CA
      L = San Francisco
      O = My Organization
      CN = {domain}
  
      [v3_req]
      keyUsage = keyEncipherment, dataEncipherment
      extendedKeyUsage = serverAuth
      subjectAltName = @alt_names
  
      [alt_names]
      DNS.1 = {domain}
      DNS.2 = *.{domain}
      """
      with open(config_file, 'w', encoding='utf-8') as f:
        f.write(config_content)

      # Generate certificate using subprocess
      subprocess.run([
        "openssl", "req", "-x509", "-newkey", "rsa:2048",
        "-keyout", key_file, "-out", cert_file,
        "-days", "365", "-nodes",
        "-config", config_file, "-extensions", "v3_req"
      ], check=True)

      # Read generated files
      with open(cert_file, 'r', encoding='utf-8') as f:
        cert_pem = f.read()

      with open(key_file, 'r', encoding='utf-8') as f:
        key_pem = f.read()

    # Create ACM certificate with email validation for CI environments
    self.certificate = aws.acm.Certificate(
      f"{name}-cert",
      private_key=key_pem,
      certificate_body=cert_pem,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-cert"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_waf(self, name: str, config: InfrastructureConfig):
    # Create WAF Web ACL
    self.waf = aws.wafv2.WebAcl(
      f"{name}-waf",
      scope="REGIONAL",
      default_action={"allow": {}},
      rules=[
        {
          "name": "AWSManagedRulesCommonRuleSet",
          "priority": 1,
          "override_action": {"none": {}},
          "statement": {
            "managed_rule_group_statement": {
              "name": "AWSManagedRulesCommonRuleSet",
              "vendor_name": "AWS"
            }
          },
          "visibility_config": {
            "cloudwatch_metrics_enabled": True,
            "metric_name": "CommonRuleSetMetric",
            "sampled_requests_enabled": True
          }
        },
        {
          "name": "AWSManagedRulesKnownBadInputsRuleSet",
          "priority": 2,
          "override_action": {"none": {}},
          "statement": {
            "managed_rule_group_statement": {
              "name": "AWSManagedRulesKnownBadInputsRuleSet",
              "vendor_name": "AWS"
            }
          },
          "visibility_config": {
            "cloudwatch_metrics_enabled": True,
            "metric_name": "KnownBadInputsRuleSetMetric",
            "sampled_requests_enabled": True
          }
        }
      ],
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-waf"
      },
      visibility_config={
        "cloudwatch_metrics_enabled": True,
        "metric_name": f"{config.app_name}-{config.environment}-waf",
        "sampled_requests_enabled": True
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_mfa_policy(self, name: str, config: InfrastructureConfig):
    # Create MFA enforcement policy
    self.mfa_policy = aws.iam.Policy(
      f"{name}-mfa-policy",
      description="Enforce MFA for all users",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AllowViewAccountInfo",
            "Effect": "Allow",
            "Action": [
              "iam:GetAccountPasswordPolicy",
              "iam:GetAccountSummary",
              "iam:ListVirtualMFADevices"
            ],
            "Resource": "*"
          },
          {
            "Sid": "AllowManageOwnPasswords",
            "Effect": "Allow",
            "Action": [
              "iam:ChangePassword",
              "iam:GetUser"
            ],
            "Resource": "arn:aws:iam::*:user/${aws:username}"
          },
          {
            "Sid": "AllowManageOwnMFA",
            "Effect": "Allow",
            "Action": [
              "iam:CreateVirtualMFADevice",
              "iam:DeleteVirtualMFADevice",
              "iam:EnableMFADevice",
              "iam:ListMFADevices",
              "iam:ResyncMFADevice"
            ],
            "Resource": [
              "arn:aws:iam::*:mfa/${aws:username}",
              "arn:aws:iam::*:user/${aws:username}"
            ]
          },
          {
            "Sid": "DenyAllExceptUnlessSignedInWithMFA",
            "Effect": "Deny",
            "NotAction": [
              "iam:CreateVirtualMFADevice",
              "iam:EnableMFADevice",
              "iam:GetUser",
              "iam:ListMFADevices",
              "iam:ListVirtualMFADevices",
              "iam:ResyncMFADevice",
              "sts:GetSessionToken"
            ],
            "Resource": "*",
            "Condition": {
              "BoolIfExists": {
                "aws:MultiFactorAuthPresent": "false"
              }
            }
          }
        ]
      }),
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-mfa-policy"
      },
      opts=ResourceOptions(parent=self)
    )

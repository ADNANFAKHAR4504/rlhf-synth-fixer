"""Security infrastructure including KMS, security groups, and Network Firewall."""
from cdktf import TerraformOutput, Fn
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupEgress,
    SecurityGroupIngress
)
from cdktf_cdktf_provider_aws.networkfirewall_firewall import (
    NetworkfirewallFirewall,
    NetworkfirewallFirewallSubnetMapping
)
from cdktf_cdktf_provider_aws.networkfirewall_firewall_policy import (
    NetworkfirewallFirewallPolicy,
    NetworkfirewallFirewallPolicyFirewallPolicy,
    NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference
)
from cdktf_cdktf_provider_aws.networkfirewall_rule_group import (
    NetworkfirewallRuleGroup,
    NetworkfirewallRuleGroupRuleGroup,
    NetworkfirewallRuleGroupRuleGroupRulesSource,
    NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule,
    NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader,
    NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption
)
from constructs import Construct


class SecurityStack(Construct):
    """Creates security resources including KMS keys, security groups, and Network Firewall."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        vpc_id: str,
        subnet_ids: list,
        account_id: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.account_id = account_id

        # Create KMS keys for different services
        self._create_kms_keys()

        # Create security groups
        self._create_security_groups()

        # Create Network Firewall
        self._create_network_firewall()

    def _create_kms_keys(self):
        """Create customer-managed KMS keys with automatic rotation."""
        # KMS key for EBS encryption
        self.ebs_kms_key = KmsKey(
            self,
            "ebs_kms_key",
            description=f"KMS key for EBS encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            tags={
                "Name": f"ebs-kms-key-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        KmsAlias(
            self,
            "ebs_kms_alias",
            name=f"alias/ebs-{self.environment_suffix}",
            target_key_id=self.ebs_kms_key.key_id
        )

        # KMS key for S3 encryption
        self.s3_kms_key = KmsKey(
            self,
            "s3_kms_key",
            description=f"KMS key for S3 encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            tags={
                "Name": f"s3-kms-key-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        KmsAlias(
            self,
            "s3_kms_alias",
            name=f"alias/s3-{self.environment_suffix}",
            target_key_id=self.s3_kms_key.key_id
        )

        # KMS key for RDS encryption
        self.rds_kms_key = KmsKey(
            self,
            "rds_kms_key",
            description=f"KMS key for RDS encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            tags={
                "Name": f"rds-kms-key-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        KmsAlias(
            self,
            "rds_kms_alias",
            name=f"alias/rds-{self.environment_suffix}",
            target_key_id=self.rds_kms_key.key_id
        )

        # KMS key for SSM Parameter Store
        self.ssm_kms_key = KmsKey(
            self,
            "ssm_kms_key",
            description=f"KMS key for SSM Parameter Store - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            tags={
                "Name": f"ssm-kms-key-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        KmsAlias(
            self,
            "ssm_kms_alias",
            name=f"alias/ssm-{self.environment_suffix}",
            target_key_id=self.ssm_kms_key.key_id
        )

        # KMS key for CloudWatch Logs with service policy
        import json
        cloudwatch_logs_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {"AWS": f"arn:aws:iam::{self.account_id}:root"},
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {"Service": f"logs.us-east-1.amazonaws.com"},
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:us-east-1:{self.account_id}:log-group:*"
                        }
                    }
                }
            ]
        }

        self.cloudwatch_kms_key = KmsKey(
            self,
            "cloudwatch_kms_key",
            description=f"KMS key for CloudWatch Logs - {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            policy=json.dumps(cloudwatch_logs_policy),
            tags={
                "Name": f"cloudwatch-kms-key-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        KmsAlias(
            self,
            "cloudwatch_kms_alias",
            name=f"alias/cloudwatch-{self.environment_suffix}",
            target_key_id=self.cloudwatch_kms_key.key_id
        )

        # Outputs
        TerraformOutput(
            self,
            "ebs_kms_key_arn",
            value=self.ebs_kms_key.arn,
            description="EBS KMS key ARN"
        )

        TerraformOutput(
            self,
            "s3_kms_key_arn",
            value=self.s3_kms_key.arn,
            description="S3 KMS key ARN"
        )

        TerraformOutput(
            self,
            "rds_kms_key_arn",
            value=self.rds_kms_key.arn,
            description="RDS KMS key ARN"
        )

    def _create_security_groups(self):
        """Create security groups with explicit deny rules."""
        # Application security group - deny all by default
        self.app_security_group = SecurityGroup(
            self,
            "app_sg",
            name=f"payment-app-sg-{self.environment_suffix}",
            description="Application security group with explicit deny",
            vpc_id=self.vpc_id,
            egress=[
                SecurityGroupEgress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS outbound only"
                )
            ],
            ingress=[
                SecurityGroupIngress(
                    from_port=8443,
                    to_port=8443,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow application port from VPC"
                )
            ],
            tags={
                "Name": f"payment-app-sg-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Database security group
        self.db_security_group = SecurityGroup(
            self,
            "db_sg",
            name=f"payment-db-sg-{self.environment_suffix}",
            description="Database security group - deny all by default",
            vpc_id=self.vpc_id,
            egress=[],  # No outbound allowed
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[],  # Will be updated to reference app_sg
                    description="Allow PostgreSQL from application"
                )
            ],
            tags={
                "Name": f"payment-db-sg-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        TerraformOutput(
            self,
            "app_security_group_id",
            value=self.app_security_group.id,
            description="Application security group ID"
        )

    def _create_network_firewall(self):
        """Create AWS Network Firewall with stateful HTTPS-only rules."""
        # Create stateful rule group for HTTPS-only traffic
        rule_group = NetworkfirewallRuleGroup(
            self,
            "https_rule_group",
            capacity=100,
            name=f"https-only-rules-{self.environment_suffix}",
            type="STATEFUL",
            rule_group=NetworkfirewallRuleGroupRuleGroup(
                rules_source=NetworkfirewallRuleGroupRuleGroupRulesSource(
                    stateful_rule=[
                        NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule(
                            action="PASS",
                            header=NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader(
                                destination="ANY",
                                destination_port="443",
                                direction="FORWARD",
                                protocol="TCP",
                                source="10.0.0.0/16",
                                source_port="ANY"
                            ),
                            rule_option=[
                                NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption(
                                    keyword="sid:1"
                                )
                            ]
                        ),
                        NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule(
                            action="DROP",
                            header=NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader(
                                destination="ANY",
                                destination_port="ANY",
                                direction="FORWARD",
                                protocol="IP",
                                source="10.0.0.0/16",
                                source_port="ANY"
                            ),
                            rule_option=[
                                NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleRuleOption(
                                    keyword="sid:2"
                                )
                            ]
                        )
                    ]
                )
            ),
            tags={
                "Name": f"https-only-rules-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Create firewall policy
        firewall_policy = NetworkfirewallFirewallPolicy(
            self,
            "firewall_policy",
            name=f"zero-trust-policy-{self.environment_suffix}",
            firewall_policy=NetworkfirewallFirewallPolicyFirewallPolicy(
                stateless_default_actions=["aws:drop"],
                stateless_fragment_default_actions=["aws:drop"],
                stateful_rule_group_reference=[
                    NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference(
                        resource_arn=rule_group.arn
                    )
                ]
            ),
            tags={
                "Name": f"zero-trust-policy-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Create Network Firewall
        self.network_firewall = NetworkfirewallFirewall(
            self,
            "network_firewall",
            name=f"payment-firewall-{self.environment_suffix}",
            firewall_policy_arn=firewall_policy.arn,
            vpc_id=self.vpc_id,
            subnet_mapping=[
                NetworkfirewallFirewallSubnetMapping(subnet_id=subnet_id)
                for subnet_id in self.subnet_ids
            ],
            tags={
                "Name": f"payment-firewall-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        TerraformOutput(
            self,
            "network_firewall_id",
            value=self.network_firewall.id,
            description="Network Firewall ID"
        )

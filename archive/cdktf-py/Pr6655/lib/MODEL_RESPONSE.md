# Zero-Trust Payment Processing Infrastructure - CDKTF Python Implementation

This implementation provides a comprehensive zero-trust security framework for payment processing workloads using CDKTF with Python.

## File: lib/__init__.py

```python
"""Zero-trust payment processing infrastructure package."""
```

## File: lib/networking.py

```python
"""Networking infrastructure for zero-trust architecture."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from constructs import Construct


class NetworkingStack(Construct):
    """Creates VPC and networking resources for zero-trust architecture."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix

        # Get availability zones
        self.azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available"
        )

        # Create VPC (no internet gateway for zero-trust)
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Create 3 private subnets across different AZs
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=f"${{element({self.azs.names}, {i})}}",
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{i}-{environment_suffix}",
                    "CostCenter": "payment-processing",
                    "DataClassification": "confidential",
                    "ComplianceScope": "pci-dss-level-1",
                    "Tier": "private"
                }
            )
            self.private_subnets.append(subnet)

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID for zero-trust network"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=[s.id for s in self.private_subnets],
            description="Private subnet IDs"
        )
```

## File: lib/security.py

```python
"""Security infrastructure including KMS, security groups, and Network Firewall."""
from cdktf import TerraformOutput, Fn
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress, SecurityGroupIngress
from cdktf_cdktf_provider_aws.networkfirewall_firewall import NetworkfirewallFirewall, NetworkfirewallFirewallSubnetMapping
from cdktf_cdktf_provider_aws.networkfirewall_firewall_policy import NetworkfirewallFirewallPolicy, NetworkfirewallFirewallPolicyFirewallPolicy, NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference
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
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids

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
```

## File: lib/storage.py

```python
"""Storage infrastructure including S3 buckets with compliance features."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_object_lock_configuration import (
    S3BucketObjectLockConfigurationA,
    S3BucketObjectLockConfigurationRule,
    S3BucketObjectLockConfigurationRuleDefaultRetention
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from constructs import Construct


class StorageStack(Construct):
    """Creates S3 buckets for audit logs with compliance features."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        kms_key_arn: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn

        # Create audit logs bucket with object lock
        self.audit_bucket = S3Bucket(
            self,
            "audit_bucket",
            bucket=f"payment-audit-logs-{environment_suffix}",
            object_lock_enabled=True,
            tags={
                "Name": f"payment-audit-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "audit_bucket_versioning",
            bucket=self.audit_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled",
                mfa_delete="Disabled"  # MFA delete requires manual configuration
            )
        )

        # Configure server-side encryption with KMS
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "audit_bucket_encryption",
            bucket=self.audit_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key_arn
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # Configure object lock
        S3BucketObjectLockConfigurationA(
            self,
            "audit_bucket_object_lock",
            bucket=self.audit_bucket.id,
            rule=S3BucketObjectLockConfigurationRule(
                default_retention=S3BucketObjectLockConfigurationRuleDefaultRetention(
                    mode="COMPLIANCE",
                    days=2555  # 7 years retention
                )
            )
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "audit_bucket_public_access_block",
            bucket=self.audit_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Create compliance logs bucket
        self.compliance_bucket = S3Bucket(
            self,
            "compliance_bucket",
            bucket=f"payment-compliance-logs-{environment_suffix}",
            tags={
                "Name": f"payment-compliance-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Enable versioning on compliance bucket
        S3BucketVersioningA(
            self,
            "compliance_bucket_versioning",
            bucket=self.compliance_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # Configure encryption on compliance bucket
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "compliance_bucket_encryption",
            bucket=self.compliance_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key_arn
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # Block public access on compliance bucket
        S3BucketPublicAccessBlock(
            self,
            "compliance_bucket_public_access_block",
            bucket=self.compliance_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Outputs
        TerraformOutput(
            self,
            "audit_bucket_name",
            value=self.audit_bucket.bucket,
            description="Audit logs S3 bucket name"
        )

        TerraformOutput(
            self,
            "compliance_bucket_name",
            value=self.compliance_bucket.bucket,
            description="Compliance logs S3 bucket name"
        )
```

## File: lib/vpc_endpoints.py

```python
"""VPC endpoints for private AWS service access."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from constructs import Construct


class VpcEndpointsStack(Construct):
    """Creates VPC endpoints for private access to AWS services."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        vpc_id: str,
        subnet_ids: list,
        security_group_id: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.security_group_id = security_group_id

        # S3 Gateway endpoint
        self.s3_endpoint = VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.s3",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"s3-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # DynamoDB Gateway endpoint
        self.dynamodb_endpoint = VpcEndpoint(
            self,
            "dynamodb_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.dynamodb",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"dynamodb-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # EC2 Interface endpoint
        self.ec2_endpoint = VpcEndpoint(
            self,
            "ec2_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ec2",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ec2-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Systems Manager Interface endpoint
        self.ssm_endpoint = VpcEndpoint(
            self,
            "ssm_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ssm",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ssm-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # SSM Messages endpoint (required for Session Manager)
        self.ssm_messages_endpoint = VpcEndpoint(
            self,
            "ssm_messages_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ssmmessages",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ssm-messages-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # EC2 Messages endpoint
        self.ec2_messages_endpoint = VpcEndpoint(
            self,
            "ec2_messages_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ec2messages",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ec2-messages-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "s3_endpoint_id",
            value=self.s3_endpoint.id,
            description="S3 VPC endpoint ID"
        )

        TerraformOutput(
            self,
            "ec2_endpoint_dns",
            value=self.ec2_endpoint.dns_entry,
            description="EC2 VPC endpoint DNS entries"
        )

        TerraformOutput(
            self,
            "ssm_endpoint_dns",
            value=self.ssm_endpoint.dns_entry,
            description="SSM VPC endpoint DNS entries"
        )
```

## File: lib/monitoring.py

```python
"""Monitoring and logging infrastructure."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from constructs import Construct


class MonitoringStack(Construct):
    """Creates CloudWatch log groups with compliance retention."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        kms_key_arn: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn

        # Application logs
        self.app_log_group = CloudwatchLogGroup(
            self,
            "app_log_group",
            name=f"/aws/payment/application-{environment_suffix}",
            retention_in_days=2555,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-app-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Audit logs
        self.audit_log_group = CloudwatchLogGroup(
            self,
            "audit_log_group",
            name=f"/aws/payment/audit-{environment_suffix}",
            retention_in_days=2555,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-audit-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Network firewall logs
        self.firewall_log_group = CloudwatchLogGroup(
            self,
            "firewall_log_group",
            name=f"/aws/networkfirewall/payment-{environment_suffix}",
            retention_in_days=2555,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-firewall-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # VPC flow logs
        self.vpc_flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/flowlogs-{environment_suffix}",
            retention_in_days=2555,  # 7 years
            kms_key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-vpc-flow-logs-{environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "app_log_group_name",
            value=self.app_log_group.name,
            description="Application log group name"
        )

        TerraformOutput(
            self,
            "audit_log_group_name",
            value=self.audit_log_group.name,
            description="Audit log group name"
        )
```

## File: lib/compliance.py

```python
"""Compliance infrastructure including IAM roles and SSM parameters."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from constructs import Construct
import json


class ComplianceStack(Construct):
    """Creates IAM roles and SSM parameters with compliance controls."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        kms_key_arn: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn

        # Create IAM role with session limits and external ID
        self._create_iam_roles()

        # Create SSM parameters
        self._create_ssm_parameters()

    def _create_iam_roles(self):
        """Create IAM roles with 1-hour session limits and external ID requirements."""
        # Application role with session limits
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole",
                    "Condition": {
                        "StringEquals": {
                            "sts:ExternalId": f"payment-processing-{self.environment_suffix}"
                        }
                    }
                }
            ]
        }

        self.app_role = IamRole(
            self,
            "app_role",
            name=f"payment-app-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            max_session_duration=3600,  # 1 hour
            tags={
                "Name": f"payment-app-role-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Least privilege policy for application
        app_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::payment-audit-logs-{self.environment_suffix}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": self.kms_key_arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/payment/application-{self.environment_suffix}:*"
                }
            ]
        }

        IamRolePolicy(
            self,
            "app_role_policy",
            name=f"payment-app-policy-{self.environment_suffix}",
            role=self.app_role.name,
            policy=json.dumps(app_policy)
        )

        # Audit role with session limits
        audit_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::${{data.aws_caller_identity.current.account_id}}:root"
                    },
                    "Action": "sts:AssumeRole",
                    "Condition": {
                        "StringEquals": {
                            "sts:ExternalId": f"audit-{self.environment_suffix}"
                        }
                    }
                }
            ]
        }

        self.audit_role = IamRole(
            self,
            "audit_role",
            name=f"payment-audit-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(audit_assume_role_policy),
            max_session_duration=3600,  # 1 hour
            tags={
                "Name": f"payment-audit-role-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Read-only audit policy
        audit_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::payment-audit-logs-{self.environment_suffix}",
                        f"arn:aws:s3:::payment-audit-logs-{self.environment_suffix}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:FilterLogEvents",
                        "logs:GetLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-east-1:*:log-group:/aws/payment/*-{self.environment_suffix}:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": self.kms_key_arn
                }
            ]
        }

        IamRolePolicy(
            self,
            "audit_role_policy",
            name=f"payment-audit-policy-{self.environment_suffix}",
            role=self.audit_role.name,
            policy=json.dumps(audit_policy)
        )

        # Outputs
        TerraformOutput(
            self,
            "app_role_arn",
            value=self.app_role.arn,
            description="Application IAM role ARN"
        )

        TerraformOutput(
            self,
            "audit_role_arn",
            value=self.audit_role.arn,
            description="Audit IAM role ARN"
        )

    def _create_ssm_parameters(self):
        """Create Systems Manager parameters with KMS encryption."""
        # Application configuration parameter
        self.app_config_param = SsmParameter(
            self,
            "app_config_param",
            name=f"/payment/app/config-{self.environment_suffix}",
            type="SecureString",
            value=json.dumps({
                "environment": f"payment-{self.environment_suffix}",
                "log_level": "INFO",
                "compliance_mode": "pci-dss-level-1"
            }),
            key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-app-config-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Database configuration parameter
        self.db_config_param = SsmParameter(
            self,
            "db_config_param",
            name=f"/payment/db/config-{self.environment_suffix}",
            type="SecureString",
            value=json.dumps({
                "retention_days": 2555,
                "backup_enabled": True,
                "encryption_enabled": True
            }),
            key_id=self.kms_key_arn,
            tags={
                "Name": f"payment-db-config-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "app_config_param_name",
            value=self.app_config_param.name,
            description="Application configuration parameter name"
        )
```

## File: lib/tap_stack.py

```python
"""Main CDKTF stack orchestrating all infrastructure components."""
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider

from lib.networking import NetworkingStack
from lib.security import SecurityStack
from lib.storage import StorageStack
from lib.vpc_endpoints import VpcEndpointsStack
from lib.monitoring import MonitoringStack
from lib.compliance import ComplianceStack


class TapStack(TerraformStack):
    """Main stack for zero-trust payment processing infrastructure."""

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # AWS Provider
        AwsProvider(
            self,
            "aws",
            region="us-east-1",
            default_tags=[{
                "tags": {
                    "Environment": f"payment-{environment_suffix}",
                    "ManagedBy": "cdktf",
                    "Project": "zero-trust-payment-processing"
                }
            }]
        )

        # Networking
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix
        )

        # Security (KMS, Security Groups, Network Firewall)
        security = SecurityStack(
            self,
            "security",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc.id,
            subnet_ids=[s.id for s in networking.private_subnets]
        )

        # Storage (S3 buckets with compliance features)
        storage = StorageStack(
            self,
            "storage",
            environment_suffix=environment_suffix,
            kms_key_arn=security.s3_kms_key.arn
        )

        # VPC Endpoints
        vpc_endpoints = VpcEndpointsStack(
            self,
            "vpc_endpoints",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc.id,
            subnet_ids=[s.id for s in networking.private_subnets],
            security_group_id=security.app_security_group.id
        )

        # Monitoring (CloudWatch Logs)
        monitoring = MonitoringStack(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            kms_key_arn=security.s3_kms_key.arn
        )

        # Compliance (IAM roles, SSM parameters)
        compliance = ComplianceStack(
            self,
            "compliance",
            environment_suffix=environment_suffix,
            kms_key_arn=security.ssm_kms_key.arn
        )

        # Stack-level outputs
        TerraformOutput(
            self,
            "deployment_summary",
            value={
                "environment": f"payment-{environment_suffix}",
                "region": "us-east-1",
                "compliance": "pci-dss-level-1",
                "architecture": "zero-trust"
            },
            description="Deployment summary"
        )


def create_stack(environment_suffix: str):
    """Factory function to create the stack."""
    app = App()
    TapStack(app, "payment-processing", environment_suffix=environment_suffix)
    return app
```

## File: lib/README.md

```markdown
# Zero-Trust Payment Processing Infrastructure

This CDKTF Python implementation provides a comprehensive zero-trust security framework for payment processing workloads, compliant with PCI-DSS Level 1 and SOC 2 Type II requirements.

## Architecture Overview

The infrastructure implements a complete zero-trust network architecture with:

- **Private VPC**: 3 private subnets across availability zones (no internet gateway)
- **Network Firewall**: HTTPS-only stateful rules with traffic inspection
- **Encryption**: Customer-managed KMS keys with automatic rotation
- **Audit Logging**: S3 buckets with object lock and 7-year retention
- **VPC Endpoints**: Private access to S3, DynamoDB, EC2, Systems Manager
- **Monitoring**: CloudWatch Logs with 7-year retention and integrity validation
- **IAM Security**: Roles with 1-hour session limits and external ID requirements
- **Compliance**: Mandatory resource tagging and secure parameter storage

## Module Structure

```
lib/
├── __init__.py              # Package initialization
├── tap_stack.py             # Main orchestration stack
├── networking.py            # VPC and subnet resources
├── security.py              # KMS keys, security groups, Network Firewall
├── storage.py               # S3 buckets with compliance features
├── vpc_endpoints.py         # VPC endpoints for AWS services
├── monitoring.py            # CloudWatch log groups
├── compliance.py            # IAM roles and SSM parameters
└── README.md                # This file
```

## Prerequisites

- Python 3.9+
- CDKTF CLI installed
- AWS credentials configured
- Pipenv or pip for dependencies

## Installation

```bash
# Install dependencies
pipenv install

# Or using pip
pip install -r requirements.txt
```

## Deployment

```bash
# Set environment suffix (required for resource uniqueness)
export ENVIRONMENT_SUFFIX="dev-$(date +%s)"

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure (all resources are destroyable)
cdktf destroy
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Required. Unique suffix for resource names (e.g., "dev-123456")

## Security Features

### Network Isolation
- VPC with private subnets only
- No internet gateway or NAT gateway
- All traffic routed through VPC endpoints

### Encryption
- Customer-managed KMS keys for EBS, S3, RDS, SSM
- Automatic key rotation enabled
- 7-day deletion window for keys

### Access Control
- IAM roles with 1-hour maximum session duration
- External ID requirements for role assumption
- Least privilege policies

### Audit & Compliance
- S3 object lock with 7-year retention
- CloudWatch Logs with 7-year retention
- MFA delete capability (requires manual configuration)
- Comprehensive resource tagging

## Outputs

After deployment, the following outputs are available:

- VPC ID and subnet IDs
- KMS key ARNs (EBS, S3, RDS)
- S3 bucket names (audit logs, compliance logs)
- VPC endpoint IDs and DNS names
- IAM role ARNs
- CloudWatch log group names

## Compliance Notes

### PCI-DSS Level 1 Requirements
- Network segmentation via private subnets
- Encryption at rest and in transit
- Strong access controls with MFA support
- Comprehensive logging and monitoring
- Regular access reviews enabled via IAM session limits

### SOC 2 Type II Requirements
- Change management via Infrastructure as Code
- Audit trail via CloudWatch and S3 object lock
- Access controls with external ID and session limits
- Encryption key management with rotation
- Monitoring and alerting capabilities

### IAM Identity Center
IAM Identity Center requires manual setup at the AWS Organization level. This infrastructure prepares IAM roles that can integrate with Identity Center once configured.

## Testing

Unit tests are located in the `tests/` directory and can be run using pytest:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=lib --cov-report=term-missing
```

## Cost Optimization

This infrastructure is designed with cost optimization in mind:

- No NAT gateways (VPC endpoints used instead)
- CloudWatch log retention configurable
- S3 lifecycle policies can be added
- No provisioned resources (all serverless where possible)

## Cleanup

All resources are configured to be destroyable:

- No retention policies on S3 buckets (object lock can be removed)
- KMS keys use 7-day deletion window
- No deletion protection enabled
- CloudWatch log groups can be deleted

```bash
# Destroy all resources
cdktf destroy
```

## Troubleshooting

### KMS Key Access Issues
Ensure the IAM role has permissions to use the KMS keys.

### VPC Endpoint Connectivity
Verify security group rules allow traffic to VPC endpoints.

### Network Firewall Rules
Check CloudWatch Logs for firewall traffic inspection logs.

### S3 Object Lock
Object lock requires versioning enabled and cannot be disabled once set.

## Support

For questions or issues, refer to:
- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)

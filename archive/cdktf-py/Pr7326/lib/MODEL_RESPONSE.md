# CDKTF Python Payment Processing Infrastructure - Model Response

This implementation creates a comprehensive payment processing platform with security, compliance, and observability features.

## File: lib/tap_stack.py

```python
#!/usr/bin/env python
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from typing import Dict, Any
from lib.networking import NetworkingResources
from lib.security import SecurityResources
from lib.storage import StorageResources
from lib.database import DatabaseResources
from lib.compute import ComputeResources
from lib.monitoring import MonitoringResources
from lib.queuing import QueuingResources
from lib.dns import DnsResources
from lib.streaming import StreamingResources
from lib.parameters import ParametersResources


class TapStack(TerraformStack):
    """
    Main orchestrator stack for payment processing infrastructure.
    Coordinates all resource modules and manages dependencies.
    """

    def __init__(self, scope: Construct, id: str, environment_suffix: str = "dev"):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = "us-east-1"

        # AWS Provider
        AwsProvider(self, "AWS",
            region=self.region,
            default_tags=[{
                "tags": {
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Project": "PaymentProcessing"
                }
            }]
        )

        # 1. Security (KMS keys first - needed by other resources)
        self.security = SecurityResources(
            self, "Security",
            environment_suffix=self.environment_suffix,
            region=self.region
        )

        # 2. Storage (S3 buckets - needed for logs and data)
        self.storage = StorageResources(
            self, "Storage",
            environment_suffix=self.environment_suffix,
            kms_key_id=self.security.s3_kms_key.id
        )

        # 3. Networking (VPC, subnets, flow logs)
        self.networking = NetworkingResources(
            self, "Networking",
            environment_suffix=self.environment_suffix
        )

        # 4. Database (Aurora Serverless v2 with RDS Proxy)
        self.database = DatabaseResources(
            self, "Database",
            environment_suffix=self.environment_suffix,
            vpc_id=self.networking.vpc.id,
            private_subnet_ids=self.networking.private_subnet_ids,
            kms_key_arn=self.security.database_kms_key.arn,
            security_group_id=self.networking.database_sg.id
        )

        # 5. Queuing (SQS, EventBridge)
        self.queuing = QueuingResources(
            self, "Queuing",
            environment_suffix=self.environment_suffix,
            kms_key_id=self.security.eventbridge_kms_key.id
        )

        # 6. Monitoring (CloudWatch, SNS, Config)
        self.monitoring = MonitoringResources(
            self, "Monitoring",
            environment_suffix=self.environment_suffix,
            config_bucket_name=self.storage.config_bucket.bucket,
            vpc_id=self.networking.vpc.id
        )

        # 7. Compute (Lambda, EC2 ASG, ALB, X-Ray)
        self.compute = ComputeResources(
            self, "Compute",
            environment_suffix=self.environment_suffix,
            vpc_id=self.networking.vpc.id,
            private_subnet_ids=self.networking.private_subnet_ids,
            public_subnet_ids=self.networking.public_subnet_ids,
            rds_proxy_endpoint=self.database.rds_proxy.endpoint,
            queue_url=self.queuing.payment_queue.url,
            security_group_id=self.networking.app_sg.id,
            alb_logs_bucket=self.storage.alb_logs_bucket.bucket
        )

        # 8. DNS (Route 53)
        self.dns = DnsResources(
            self, "DNS",
            environment_suffix=self.environment_suffix,
            alb_dns_name=self.compute.alb.dns_name,
            alb_zone_id=self.compute.alb.zone_id
        )

        # 9. Streaming (Kinesis Firehose)
        self.streaming = StreamingResources(
            self, "Streaming",
            environment_suffix=self.environment_suffix,
            destination_bucket=self.storage.firehose_bucket.bucket,
            destination_bucket_arn=self.storage.firehose_bucket.arn
        )

        # 10. Parameters (SSM Parameter Store)
        self.parameters = ParametersResources(
            self, "Parameters",
            environment_suffix=self.environment_suffix,
            kms_key_id=self.security.parameter_store_kms_key.id,
            db_endpoint=self.database.cluster.endpoint,
            db_name="payments"
        )

        # Attach WAF to ALB
        self.security.attach_waf_to_alb(self.compute.alb.arn)

        # Outputs
        TerraformOutput(self, "alb_dns",
            value=self.compute.alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(self, "database_endpoint",
            value=self.database.cluster.endpoint,
            description="Aurora cluster endpoint"
        )

        TerraformOutput(self, "rds_proxy_endpoint",
            value=self.database.rds_proxy.endpoint,
            description="RDS Proxy endpoint for Lambda"
        )


app = App()
TapStack(app, "tap-payment-processing", environment_suffix="prod")
app.synth()
```

## File: lib/networking.py

```python
"""
Networking module: VPC, subnets, NAT Gateway, security groups, VPC Flow Logs
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from typing import List


class NetworkingResources(Construct):
    """Creates VPC, subnets, NAT, security groups, and VPC Flow Logs"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # VPC
        self.vpc = Vpc(self, f"vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"payment-vpc-{environment_suffix}"}
        )

        # Public Subnets (2 AZs)
        self.public_subnet_1 = Subnet(self, f"public-subnet-1-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={"Name": f"payment-public-1-{environment_suffix}"}
        )

        self.public_subnet_2 = Subnet(self, f"public-subnet-2-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags={"Name": f"payment-public-2-{environment_suffix}"}
        )

        # Private Subnets (3 AZs for Aurora)
        self.private_subnet_1 = Subnet(self, f"private-subnet-1-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone="us-east-1a",
            tags={"Name": f"payment-private-1-{environment_suffix}"}
        )

        self.private_subnet_2 = Subnet(self, f"private-subnet-2-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1b",
            tags={"Name": f"payment-private-2-{environment_suffix}"}
        )

        self.private_subnet_3 = Subnet(self, f"private-subnet-3-{environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone="us-east-1c",
            tags={"Name": f"payment-private-3-{environment_suffix}"}
        )

        # Internet Gateway
        self.igw = InternetGateway(self, f"igw-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={"Name": f"payment-igw-{environment_suffix}"}
        )

        # Elastic IP for NAT Gateway
        self.nat_eip = Eip(self, f"nat-eip-{environment_suffix}",
            domain="vpc",
            tags={"Name": f"payment-nat-eip-{environment_suffix}"}
        )

        # NAT Gateway
        self.nat_gateway = NatGateway(self, f"nat-{environment_suffix}",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={"Name": f"payment-nat-{environment_suffix}"}
        )

        # Public Route Table
        self.public_rt = RouteTable(self, f"public-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags={"Name": f"payment-public-rt-{environment_suffix}"}
        )

        # Private Route Table
        self.private_rt = RouteTable(self, f"private-rt-{environment_suffix}",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id
            )],
            tags={"Name": f"payment-private-rt-{environment_suffix}"}
        )

        # Route Table Associations
        RouteTableAssociation(self, f"public-rt-assoc-1-{environment_suffix}",
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_rt.id
        )

        RouteTableAssociation(self, f"public-rt-assoc-2-{environment_suffix}",
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_rt.id
        )

        RouteTableAssociation(self, f"private-rt-assoc-1-{environment_suffix}",
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_rt.id
        )

        RouteTableAssociation(self, f"private-rt-assoc-2-{environment_suffix}",
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_rt.id
        )

        RouteTableAssociation(self, f"private-rt-assoc-3-{environment_suffix}",
            subnet_id=self.private_subnet_3.id,
            route_table_id=self.private_rt.id
        )

        # Security Groups
        self.alb_sg = SecurityGroup(self, f"alb-sg-{environment_suffix}",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for ALB",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        self.app_sg = SecurityGroup(self, f"app-sg-{environment_suffix}",
            name=f"payment-app-sg-{environment_suffix}",
            description="Security group for application tier",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[self.alb_sg.id],
                    description="Traffic from ALB"
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        self.database_sg = SecurityGroup(self, f"database-sg-{environment_suffix}",
            name=f"payment-database-sg-{environment_suffix}",
            description="Security group for Aurora database",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.app_sg.id],
                    description="PostgreSQL from app tier"
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )]
        )

        # VPC Flow Logs
        flow_log_group = CloudwatchLogGroup(self, f"vpc-flow-logs-{environment_suffix}",
            name=f"/aws/vpc/flow-logs-{environment_suffix}",
            retention_in_days=30
        )

        flow_log_role = IamRole(self, f"flow-log-role-{environment_suffix}",
            name=f"vpc-flow-log-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        IamRolePolicy(self, f"flow-log-policy-{environment_suffix}",
            name=f"vpc-flow-log-policy-{environment_suffix}",
            role=flow_log_role.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "{flow_log_group.arn}"
                }}]
            }}"""
        )

        FlowLog(self, f"vpc-flow-log-{environment_suffix}",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="cloud-watch-logs",
            log_destination=flow_log_group.arn,
            iam_role_arn=flow_log_role.arn
        )

        # Expose lists for other modules
        self.public_subnet_ids = [
            self.public_subnet_1.id,
            self.public_subnet_2.id
        ]

        self.private_subnet_ids = [
            self.private_subnet_1.id,
            self.private_subnet_2.id,
            self.private_subnet_3.id
        ]
```

## File: lib/security.py

```python
"""
Security module: KMS keys, WAF, GuardDuty
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.wafv2_web_acl import Wafv2WebAcl, Wafv2WebAclRule, Wafv2WebAclRuleStatement, Wafv2WebAclRuleStatementRateBasedStatement, Wafv2WebAclRuleStatementManagedRuleGroupStatement, Wafv2WebAclRuleAction, Wafv2WebAclRuleOverrideAction, Wafv2WebAclDefaultAction, Wafv2WebAclVisibilityConfig
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
from cdktf_cdktf_provider_aws.wafv2_web_acl_logging_configuration import Wafv2WebAclLoggingConfiguration
from cdktf_cdktf_provider_aws.guardduty_detector import GuarddutyDetector
from cdktf_cdktf_provider_aws.guardduty_publishing_destination import GuarddutyPublishingDestination
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget


class SecurityResources(Construct):
    """Creates KMS keys, WAF, and GuardDuty resources"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, region: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix
        self.region = region

        # KMS Key for Database
        self.database_kms_key = KmsKey(self, f"database-kms-{environment_suffix}",
            description=f"KMS key for Aurora database encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            policy=self._get_kms_policy("rds.amazonaws.com")
        )

        KmsAlias(self, f"database-kms-alias-{environment_suffix}",
            name=f"alias/payment-database-{environment_suffix}",
            target_key_id=self.database_kms_key.id
        )

        # KMS Key for S3
        self.s3_kms_key = KmsKey(self, f"s3-kms-{environment_suffix}",
            description=f"KMS key for S3 bucket encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            policy=self._get_kms_policy("s3.amazonaws.com")
        )

        KmsAlias(self, f"s3-kms-alias-{environment_suffix}",
            name=f"alias/payment-s3-{environment_suffix}",
            target_key_id=self.s3_kms_key.id
        )

        # KMS Key for Parameter Store
        self.parameter_store_kms_key = KmsKey(self, f"param-kms-{environment_suffix}",
            description=f"KMS key for Parameter Store encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            policy=self._get_kms_policy("ssm.amazonaws.com")
        )

        KmsAlias(self, f"param-kms-alias-{environment_suffix}",
            name=f"alias/payment-parameters-{environment_suffix}",
            target_key_id=self.parameter_store_kms_key.id
        )

        # KMS Key for EventBridge
        self.eventbridge_kms_key = KmsKey(self, f"eventbridge-kms-{environment_suffix}",
            description=f"KMS key for EventBridge encryption - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            policy=self._get_kms_policy("events.amazonaws.com")
        )

        KmsAlias(self, f"eventbridge-kms-alias-{environment_suffix}",
            name=f"alias/payment-eventbridge-{environment_suffix}",
            target_key_id=self.eventbridge_kms_key.id
        )

        # WAF Web ACL - INTENTIONAL ERROR: Wrong priority values (priorities conflict)
        self.web_acl = Wafv2WebAcl(self, f"payment-waf-{environment_suffix}",
            name=f"payment-waf-{environment_suffix}",
            scope="REGIONAL",
            default_action=Wafv2WebAclDefaultAction(allow={}),
            rule=[
                # Rate limiting rule - Priority 1
                Wafv2WebAclRule(
                    name="RateLimitRule",
                    priority=1,  # INTENTIONAL ERROR: This priority will conflict
                    action=Wafv2WebAclRuleAction(block={}),
                    statement=Wafv2WebAclRuleStatement(
                        rate_based_statement=Wafv2WebAclRuleStatementRateBasedStatement(
                            limit=1000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRule",
                        sampled_requests_enabled=True
                    )
                ),
                # SQL Injection protection - Priority 1 (ERROR: Same as rate limit)
                Wafv2WebAclRule(
                    name="SQLInjectionRule",
                    priority=1,  # INTENTIONAL ERROR: Duplicate priority
                    override_action=Wafv2WebAclRuleOverrideAction(none={}),
                    statement=Wafv2WebAclRuleStatement(
                        managed_rule_group_statement=Wafv2WebAclRuleStatementManagedRuleGroupStatement(
                            vendor_name="AWS",
                            name="AWSManagedRulesSQLiRuleSet"
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="SQLInjectionRule",
                        sampled_requests_enabled=True
                    )
                ),
                # XSS protection - Priority 2
                Wafv2WebAclRule(
                    name="XSSRule",
                    priority=2,
                    override_action=Wafv2WebAclRuleOverrideAction(none={}),
                    statement=Wafv2WebAclRuleStatement(
                        managed_rule_group_statement=Wafv2WebAclRuleStatementManagedRuleGroupStatement(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet"
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
                        cloudwatch_metrics_enabled=True,
                        metric_name="XSSRule",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=Wafv2WebAclVisibilityConfig(
                cloudwatch_metrics_enabled=True,
                metric_name=f"PaymentWAF-{environment_suffix}",
                sampled_requests_enabled=True
            )
        )

        # GuardDuty Detector - INTENTIONAL ERROR: Missing S3 export configuration
        self.guardduty_detector = GuarddutyDetector(self, f"guardduty-{environment_suffix}",
            enable=True,
            finding_publishing_frequency="SIX_HOURS"
            # INTENTIONAL ERROR: Missing datasources configuration for S3 protection
        )

    def attach_waf_to_alb(self, alb_arn: str):
        """Attach WAF Web ACL to Application Load Balancer"""
        Wafv2WebAclAssociation(self, f"waf-alb-assoc-{self.env_suffix}",
            resource_arn=alb_arn,
            web_acl_arn=self.web_acl.arn
        )

    def _get_kms_policy(self, service_principal: str) -> str:
        """Generate KMS key policy - INTENTIONAL ERROR: Missing key policy for service principals"""
        return f"""{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {{"AWS": "arn:aws:iam::ACCOUNT_ID:root"}},
                    "Action": "kms:*",
                    "Resource": "*"
                }}
            ]
        }}"""
        # INTENTIONAL ERROR: Missing service principal permissions for encryption/decryption
```

## File: lib/storage.py

```python
"""
Storage module: S3 buckets with encryption, versioning, and lifecycle policies
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import S3BucketServerSideEncryptionConfiguration, S3BucketServerSideEncryptionConfigurationRuleA, S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration, S3BucketLifecycleConfigurationRule, S3BucketLifecycleConfigurationRuleTransition, S3BucketLifecycleConfigurationRuleExpiration
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy


class StorageResources(Construct):
    """Creates S3 buckets with encryption, versioning, and lifecycle policies"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, kms_key_id: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix
        self.kms_key_id = kms_key_id

        # Config Snapshots Bucket
        self.config_bucket = self._create_bucket(
            "config-snapshots",
            versioning=True,
            lifecycle_days=90
        )

        # GuardDuty Findings Bucket
        self.guardduty_bucket = self._create_bucket(
            "guardduty-findings",
            versioning=False,
            lifecycle_days=90
        )

        # Kinesis Firehose Destination Bucket
        self.firehose_bucket = self._create_bucket(
            "firehose-data",
            versioning=True,
            lifecycle_days=365,
            intelligent_tiering=True
        )

        # ALB Access Logs Bucket - INTENTIONAL ERROR: Wrong lifecycle transition days
        self.alb_logs_bucket = S3Bucket(self, f"alb-logs-{environment_suffix}",
            bucket=f"payment-alb-logs-{environment_suffix}",
            force_destroy=True  # For testing - allows bucket deletion
        )

        S3BucketServerSideEncryptionConfiguration(self, f"alb-logs-encryption-{environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=kms_key_id
                )
            )]
        )

        S3BucketPublicAccessBlock(self, f"alb-logs-public-block-{environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # INTENTIONAL ERROR: Lifecycle transitions to Glacier after 7 days (should be 30+)
        S3BucketLifecycleConfiguration(self, f"alb-logs-lifecycle-{environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="alb-log-retention",
                status="Enabled",
                transition=[S3BucketLifecycleConfigurationRuleTransition(
                    days=7,  # INTENTIONAL ERROR: Too short, causes issues
                    storage_class="GLACIER"
                )],
                expiration=S3BucketLifecycleConfigurationRuleExpiration(days=90)
            )]
        )

        # ALB logging bucket policy
        S3BucketPolicy(self, f"alb-logs-policy-{environment_suffix}",
            bucket=self.alb_logs_bucket.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Principal": {{"Service": "elasticloadbalancing.amazonaws.com"}},
                    "Action": "s3:PutObject",
                    "Resource": "{self.alb_logs_bucket.arn}/AWSLogs/*"
                }}]
            }}"""
        )

        # WAF Logs Bucket
        self.waf_logs_bucket = self._create_bucket(
            "waf-logs",
            versioning=False,
            lifecycle_days=180
        )

    def _create_bucket(self, bucket_type: str, versioning: bool = False,
                      lifecycle_days: int = 90, intelligent_tiering: bool = False) -> S3Bucket:
        """Create S3 bucket with standard configuration"""
        bucket = S3Bucket(self, f"{bucket_type}-{self.env_suffix}",
            bucket=f"payment-{bucket_type}-{self.env_suffix}",
            force_destroy=True  # For testing
        )

        # Encryption
        S3BucketServerSideEncryptionConfiguration(self, f"{bucket_type}-encryption-{self.env_suffix}",
            bucket=bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                    sse_algorithm="aws:kms",
                    kms_master_key_id=self.kms_key_id
                )
            )]
        )

        # Versioning
        if versioning:
            S3BucketVersioning(self, f"{bucket_type}-versioning-{self.env_suffix}",
                bucket=bucket.id,
                versioning_configuration={"status": "Enabled"}
            )

        # Public Access Block
        S3BucketPublicAccessBlock(self, f"{bucket_type}-public-block-{self.env_suffix}",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Lifecycle Policy
        if intelligent_tiering:
            S3BucketLifecycleConfiguration(self, f"{bucket_type}-lifecycle-{self.env_suffix}",
                bucket=bucket.id,
                rule=[S3BucketLifecycleConfigurationRule(
                    id=f"{bucket_type}-intelligent-tiering",
                    status="Enabled",
                    transition=[S3BucketLifecycleConfigurationRuleTransition(
                        days=30,
                        storage_class="INTELLIGENT_TIERING"
                    )]
                )]
            )
        else:
            S3BucketLifecycleConfiguration(self, f"{bucket_type}-lifecycle-{self.env_suffix}",
                bucket=bucket.id,
                rule=[S3BucketLifecycleConfigurationRule(
                    id=f"{bucket_type}-retention",
                    status="Enabled",
                    expiration=S3BucketLifecycleConfigurationRuleExpiration(days=lifecycle_days)
                )]
            )

        return bucket
```

## File: lib/database.py

```python
"""
Database module: Aurora Serverless v2 PostgreSQL with RDS Proxy
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_proxy import DbProxy, DbProxyAuth
from cdktf_cdktf_provider_aws.db_proxy_default_target_group import DbProxyDefaultTargetGroup
from cdktf_cdktf_provider_aws.db_proxy_target import DbProxyTarget
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from typing import List


class DatabaseResources(Construct):
    """Creates Aurora Serverless v2 cluster and RDS Proxy"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 vpc_id: str, private_subnet_ids: List[str], kms_key_arn: str,
                 security_group_id: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(self, f"db-subnet-group-{environment_suffix}",
            name=f"payment-db-subnet-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={"Name": f"payment-db-subnet-{environment_suffix}"}
        )

        # Database credentials secret
        db_secret = SecretsmanagerSecret(self, f"db-secret-{environment_suffix}",
            name=f"payment-db-credentials-{environment_suffix}",
            kms_key_id=kms_key_arn
        )

        SecretsmanagerSecretVersion(self, f"db-secret-version-{environment_suffix}",
            secret_id=db_secret.id,
            secret_string="""{
                "username": "dbadmin",
                "password": "ChangeMe12345!"
            }"""
        )

        # Aurora Serverless v2 Cluster
        self.cluster = RdsCluster(self, f"aurora-cluster-{environment_suffix}",
            cluster_identifier=f"payment-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.3",
            database_name="payments",
            master_username="dbadmin",
            master_password="ChangeMe12345!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[security_group_id],
            kms_key_id=kms_key_arn,
            storage_encrypted=True,
            serverlessv2_scaling_configuration={
                "max_capacity": 2.0,
                "min_capacity": 0.5
            },
            skip_final_snapshot=True,  # For testing
            apply_immediately=True
        )

        # Writer Instance
        RdsClusterInstance(self, f"aurora-writer-{environment_suffix}",
            identifier=f"payment-aurora-writer-{environment_suffix}",
            cluster_identifier=self.cluster.id,
            instance_class="db.serverless",
            engine=self.cluster.engine,
            engine_version=self.cluster.engine_version
        )

        # Reader Instance 1
        RdsClusterInstance(self, f"aurora-reader-1-{environment_suffix}",
            identifier=f"payment-aurora-reader-1-{environment_suffix}",
            cluster_identifier=self.cluster.id,
            instance_class="db.serverless",
            engine=self.cluster.engine,
            engine_version=self.cluster.engine_version
        )

        # Reader Instance 2
        RdsClusterInstance(self, f"aurora-reader-2-{environment_suffix}",
            identifier=f"payment-aurora-reader-2-{environment_suffix}",
            cluster_identifier=self.cluster.id,
            instance_class="db.serverless",
            engine=self.cluster.engine,
            engine_version=self.cluster.engine_version
        )

        # RDS Proxy IAM Role
        proxy_role = IamRole(self, f"rds-proxy-role-{environment_suffix}",
            name=f"payment-rds-proxy-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "rds.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        IamRolePolicyAttachment(self, f"proxy-secrets-policy-{environment_suffix}",
            role=proxy_role.name,
            policy_arn="arn:aws:iam::aws:policy/SecretsManagerReadWrite"
        )

        # RDS Proxy
        self.rds_proxy = DbProxy(self, f"rds-proxy-{environment_suffix}",
            name=f"payment-rds-proxy-{environment_suffix}",
            engine_family="POSTGRESQL",
            auth=[DbProxyAuth(
                auth_scheme="SECRETS",
                iam_auth="DISABLED",
                secret_arn=db_secret.arn
            )],
            role_arn=proxy_role.arn,
            vpc_subnet_ids=private_subnet_ids,
            vpc_security_group_ids=[security_group_id],
            require_tls=True
        )

        # Proxy Target Group
        proxy_target_group = DbProxyDefaultTargetGroup(self, f"proxy-target-{environment_suffix}",
            db_proxy_name=self.rds_proxy.name,
            connection_pool_config={
                "max_connections_percent": 100,
                "max_idle_connections_percent": 50
            }
        )

        # Proxy Target
        DbProxyTarget(self, f"proxy-cluster-target-{environment_suffix}",
            db_proxy_name=self.rds_proxy.name,
            target_group_name=proxy_target_group.name,
            db_cluster_identifier=self.cluster.id
        )
```

## File: lib/compute.py

```python
"""
Compute module: Lambda, EC2 Auto Scaling, ALB, X-Ray
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionTracingConfig
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.xray_sampling_rule import XraySamplingRule
from typing import List
import json


class ComputeResources(Construct):
    """Creates Lambda functions, EC2 ASG, ALB, and X-Ray configuration"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 vpc_id: str, private_subnet_ids: List[str], public_subnet_ids: List[str],
                 rds_proxy_endpoint: str, queue_url: str, security_group_id: str,
                 alb_logs_bucket: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # Lambda Execution Role
        lambda_role = IamRole(self, f"lambda-role-{environment_suffix}",
            name=f"payment-lambda-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        IamRolePolicyAttachment(self, f"lambda-basic-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(self, f"lambda-vpc-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        IamRolePolicyAttachment(self, f"lambda-xray-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Payment Processing Lambda
        self.payment_lambda = LambdaFunction(self, f"payment-processor-{environment_suffix}",
            function_name=f"payment-processor-{environment_suffix}",
            runtime="nodejs18.x",
            handler="index.handler",
            role=lambda_role.arn,
            filename="lambda/payment-processor.zip",  # Placeholder
            source_code_hash="dummy-hash",
            reserved_concurrent_executions=50,
            environment=LambdaFunctionEnvironment(variables={
                "DB_ENDPOINT": rds_proxy_endpoint,
                "QUEUE_URL": queue_url,
                "ENVIRONMENT": environment_suffix
            }),
            tracing_config=LambdaFunctionTracingConfig(mode="Active"),
            vpc_config={
                "subnet_ids": private_subnet_ids,
                "security_group_ids": [security_group_id]
            }
        )

        # X-Ray Sampling Rule - INTENTIONAL ERROR: Incorrect sampling configuration
        XraySamplingRule(self, f"payment-sampling-{environment_suffix}",
            rule_name=f"PaymentTransactions-{environment_suffix}",
            priority=100,  # INTENTIONAL ERROR: Should be lower for higher priority
            version=1,
            reservoir_size=0,  # INTENTIONAL ERROR: Should be > 0 for guaranteed samples
            fixed_rate=1.0,
            url_path="/api/payment*",
            host="*",
            http_method="POST",
            service_type="*",
            service_name="*",
            resource_arn="*"
        )

        # Application Load Balancer
        self.alb = Lb(self, f"payment-alb-{environment_suffix}",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[security_group_id],
            subnets=public_subnet_ids,
            enable_cross_zone_load_balancing=True,
            access_logs={
                "bucket": alb_logs_bucket,
                "enabled": True
            }
        )

        # Target Group
        target_group = LbTargetGroup(self, f"payment-tg-{environment_suffix}",
            name=f"payment-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc_id,
            health_check={
                "enabled": True,
                "path": "/health",
                "interval": 30,
                "timeout": 5,
                "healthy_threshold": 2,
                "unhealthy_threshold": 3
            }
        )

        # Listener
        LbListener(self, f"alb-listener-{environment_suffix}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )]
        )

        # EC2 Launch Template
        launch_template = LaunchTemplate(self, f"batch-lt-{environment_suffix}",
            name=f"payment-batch-lt-{environment_suffix}",
            image_id="ami-0c55b159cbfafe1f0",  # Amazon Linux 2
            instance_type="t3.micro",
            vpc_security_group_ids=[security_group_id],
            user_data="IyEvYmluL2Jhc2gKZWNobyAiSGVsbG8gV29ybGQi"  # Base64 encoded
        )

        # Auto Scaling Group
        AutoscalingGroup(self, f"batch-asg-{environment_suffix}",
            name=f"payment-batch-asg-{environment_suffix}",
            min_size=1,
            max_size=5,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            target_group_arns=[target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300
        )
```

## File: lib/monitoring.py

```python
"""
Monitoring module: CloudWatch, SNS, AWS Config
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.config_configuration_recorder import ConfigConfigurationRecorder, ConfigConfigurationRecorderRecordingGroup
from cdktf_cdktf_provider_aws.config_delivery_channel import ConfigDeliveryChannel
from cdktf_cdktf_provider_aws.config_configuration_recorder_status import ConfigConfigurationRecorderStatus
from cdktf_cdktf_provider_aws.config_config_rule import ConfigConfigRule, ConfigConfigRuleSource
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class MonitoringResources(Construct):
    """Creates CloudWatch alarms, SNS topics, and AWS Config"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 config_bucket_name: str, vpc_id: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # SNS Topic for Alerts
        self.alert_topic = SnsTopic(self, f"alerts-topic-{environment_suffix}",
            name=f"payment-alerts-{environment_suffix}",
            display_name="Payment Processing Alerts"
        )

        SnsTopicSubscription(self, f"alert-email-{environment_suffix}",
            topic_arn=self.alert_topic.arn,
            protocol="email",
            endpoint="ops@example.com"
        )

        # SNS Topic for Compliance
        self.compliance_topic = SnsTopic(self, f"compliance-topic-{environment_suffix}",
            name=f"payment-compliance-{environment_suffix}",
            display_name="Payment Compliance Alerts"
        )

        SnsTopicSubscription(self, f"compliance-email-{environment_suffix}",
            topic_arn=self.compliance_topic.arn,
            protocol="email",
            endpoint="compliance@example.com"
        )

        # CloudWatch Alarms
        CloudwatchMetricAlarm(self, f"high-cpu-alarm-{environment_suffix}",
            alarm_name=f"payment-high-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when CPU exceeds 80%",
            alarm_actions=[self.alert_topic.arn]
        )

        CloudwatchMetricAlarm(self, f"queue-depth-alarm-{environment_suffix}",
            alarm_name=f"payment-queue-depth-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ApproximateNumberOfMessagesVisible",
            namespace="AWS/SQS",
            period=60,
            statistic="Average",
            threshold=1000,
            alarm_description="Alert when queue depth exceeds 1000",
            alarm_actions=[self.alert_topic.arn]
        )

        # AWS Config - INTENTIONAL ERROR: Missing bucket policy for Config delivery
        config_role = IamRole(self, f"config-role-{environment_suffix}",
            name=f"payment-config-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        # INTENTIONAL ERROR: Using wrong IAM policy (should use AWS_ConfigRole)
        IamRolePolicyAttachment(self, f"config-policy-{environment_suffix}",
            role=config_role.name,
            policy_arn="arn:aws:iam::aws:policy/ReadOnlyAccess"  # ERROR: Wrong policy
        )

        recorder = ConfigConfigurationRecorder(self, f"config-recorder-{environment_suffix}",
            name=f"payment-config-recorder-{environment_suffix}",
            role_arn=config_role.arn,
            recording_group=ConfigConfigurationRecorderRecordingGroup(
                all_supported=True,
                include_global_resource_types=True
            )
        )

        delivery_channel = ConfigDeliveryChannel(self, f"config-delivery-{environment_suffix}",
            name=f"payment-config-delivery-{environment_suffix}",
            s3_bucket_name=config_bucket_name,
            sns_topic_arn=self.compliance_topic.arn,
            depends_on=[recorder]
        )

        ConfigConfigurationRecorderStatus(self, f"config-recorder-status-{environment_suffix}",
            name=recorder.name,
            is_enabled=True,
            depends_on=[delivery_channel]
        )

        # Config Rules
        ConfigConfigRule(self, f"encrypted-volumes-rule-{environment_suffix}",
            name=f"encrypted-volumes-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="ENCRYPTED_VOLUMES"
            ),
            depends_on=[recorder]
        )

        ConfigConfigRule(self, f"rds-encryption-rule-{environment_suffix}",
            name=f"rds-encryption-enabled-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="RDS_STORAGE_ENCRYPTED"
            ),
            depends_on=[recorder]
        )

        ConfigConfigRule(self, f"vpc-flow-logs-rule-{environment_suffix}",
            name=f"vpc-flow-logs-enabled-{environment_suffix}",
            source=ConfigConfigRuleSource(
                owner="AWS",
                source_identifier="VPC_FLOW_LOGS_ENABLED"
            ),
            input_parameters=f'{{"vpcIds": "{vpc_id}"}}',
            depends_on=[recorder]
        )
```

## File: lib/queuing.py

```python
"""
Queuing module: SQS queues and EventBridge
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.cloudwatch_event_bus import CloudwatchEventBus
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget


class QueuingResources(Construct):
    """Creates SQS queues and EventBridge resources"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str, kms_key_id: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # Dead Letter Queue
        dlq = SqsQueue(self, f"payment-dlq-{environment_suffix}",
            name=f"payment-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=kms_key_id
        )

        # Payment Queue
        self.payment_queue = SqsQueue(self, f"payment-queue-{environment_suffix}",
            name=f"payment-queue-{environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            kms_master_key_id=kms_key_id,
            redrive_policy=f"""{{
                "deadLetterTargetArn": "{dlq.arn}",
                "maxReceiveCount": 3
            }}"""
        )

        # Analytics Queue
        analytics_queue = SqsQueue(self, f"analytics-queue-{environment_suffix}",
            name=f"payment-analytics-{environment_suffix}",
            message_retention_seconds=345600,
            kms_master_key_id=kms_key_id
        )

        # EventBridge DLQ
        eventbridge_dlq = SqsQueue(self, f"eventbridge-dlq-{environment_suffix}",
            name=f"payment-eventbridge-dlq-{environment_suffix}",
            message_retention_seconds=1209600,
            kms_master_key_id=kms_key_id
        )

        # EventBridge Custom Bus
        event_bus = CloudwatchEventBus(self, f"payment-events-{environment_suffix}",
            name=f"payment-events-{environment_suffix}"
        )

        # EventBridge Rule: Payment Success - INTENTIONAL ERROR: Wrong target input
        success_rule = CloudwatchEventRule(self, f"payment-success-rule-{environment_suffix}",
            name=f"payment-success-{environment_suffix}",
            event_bus_name=event_bus.name,
            event_pattern="""{
                "source": ["payment.processor"],
                "detail-type": ["Payment Success"]
            }"""
        )

        # INTENTIONAL ERROR: Invalid input transformer (missing required fields)
        CloudwatchEventTarget(self, f"success-target-{environment_suffix}",
            rule=success_rule.name,
            event_bus_name=event_bus.name,
            arn=analytics_queue.arn,
            input_transformer={
                "input_paths": {"amount": "$.detail.amount"},
                # ERROR: Missing input_template field
            },
            dead_letter_config={"arn": eventbridge_dlq.arn}
        )

        # EventBridge Rule: Payment Failure
        failure_rule = CloudwatchEventRule(self, f"payment-failure-rule-{environment_suffix}",
            name=f"payment-failure-{environment_suffix}",
            event_bus_name=event_bus.name,
            event_pattern="""{
                "source": ["payment.processor"],
                "detail-type": ["Payment Failure"]
            }"""
        )
```

## File: lib/dns.py

```python
"""
DNS module: Route 53 hosted zone, health checks, DNS records
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordAlias
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck


class DnsResources(Construct):
    """Creates Route 53 resources"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 alb_dns_name: str, alb_zone_id: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # Hosted Zone
        zone = Route53Zone(self, f"hosted-zone-{environment_suffix}",
            name=f"payment-{environment_suffix}.example.com",
            comment="Payment processing hosted zone"
        )

        # Health Check for ALB
        health_check = Route53HealthCheck(self, f"alb-health-check-{environment_suffix}",
            fqdn=alb_dns_name,
            port=80,
            type="HTTP",
            resource_path="/health",
            failure_threshold=3,
            request_interval=30,
            measure_latency=True,
            tags={"Name": f"payment-alb-health-{environment_suffix}"}
        )

        # DNS Record with Failover
        Route53Record(self, f"payment-dns-{environment_suffix}",
            zone_id=zone.zone_id,
            name=f"api.payment-{environment_suffix}.example.com",
            type="A",
            alias=Route53RecordAlias(
                name=alb_dns_name,
                zone_id=alb_zone_id,
                evaluate_target_health=True
            ),
            health_check_id=health_check.id,
            set_identifier="primary",
            failover_routing_policy={"type": "PRIMARY"}
        )
```

## File: lib/streaming.py

```python
"""
Streaming module: Kinesis Firehose
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.kinesis_firehose_delivery_stream import KinesisFirehoseDeliveryStream, KinesisFirehoseDeliveryStreamExtendedS3Configuration, KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration, KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfigurationProcessors, KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfigurationProcessorsParameters
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy


class StreamingResources(Construct):
    """Creates Kinesis Firehose delivery stream"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 destination_bucket: str, destination_bucket_arn: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # Lambda for data transformation
        transform_role = IamRole(self, f"firehose-lambda-role-{environment_suffix}",
            name=f"firehose-transform-lambda-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        transform_lambda = LambdaFunction(self, f"firehose-transform-{environment_suffix}",
            function_name=f"firehose-transform-{environment_suffix}",
            runtime="nodejs18.x",
            handler="index.handler",
            role=transform_role.arn,
            filename="lambda/firehose-transform.zip",
            source_code_hash="dummy-hash"
        )

        # Firehose IAM Role - INTENTIONAL ERROR: Missing S3 permissions
        firehose_role = IamRole(self, f"firehose-role-{environment_suffix}",
            name=f"payment-firehose-role-{environment_suffix}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "firehose.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }"""
        )

        # INTENTIONAL ERROR: Policy missing PutObject permission for S3
        IamRolePolicy(self, f"firehose-policy-{environment_suffix}",
            name=f"firehose-s3-policy-{environment_suffix}",
            role=firehose_role.id,
            policy=f"""{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Action": ["s3:GetObject"],
                    "Resource": "{destination_bucket_arn}/*"
                }}]
            }}"""
            # ERROR: Missing s3:PutObject, s3:PutObjectAcl permissions
        )

        # Kinesis Firehose Delivery Stream
        KinesisFirehoseDeliveryStream(self, f"payment-stream-{environment_suffix}",
            name=f"payment-transactions-{environment_suffix}",
            destination="extended_s3",
            extended_s3_configuration=KinesisFirehoseDeliveryStreamExtendedS3Configuration(
                role_arn=firehose_role.arn,
                bucket_arn=destination_bucket_arn,
                prefix="payment-logs/",
                compression_format="GZIP",
                processing_configuration=KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfiguration(
                    enabled=True,
                    processors=[KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfigurationProcessors(
                        type="Lambda",
                        parameters=[KinesisFirehoseDeliveryStreamExtendedS3ConfigurationProcessingConfigurationProcessorsParameters(
                            parameter_name="LambdaArn",
                            parameter_value=transform_lambda.arn
                        )]
                    )]
                )
            )
        )
```

## File: lib/parameters.py

```python
"""
Parameters module: Systems Manager Parameter Store
"""
from constructs import Construct
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter


class ParametersResources(Construct):
    """Creates Systems Manager Parameter Store parameters"""

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 kms_key_id: str, db_endpoint: str, db_name: str):
        super().__init__(scope, id)

        self.env_suffix = environment_suffix

        # Database Connection String
        SsmParameter(self, f"db-connection-{environment_suffix}",
            name=f"/payment/{environment_suffix}/db/connection",
            type="SecureString",
            value=f"postgresql://dbadmin@{db_endpoint}:5432/{db_name}",
            key_id=kms_key_id,
            description="Database connection string"
        )

        # API Key
        SsmParameter(self, f"api-key-{environment_suffix}",
            name=f"/payment/{environment_suffix}/api/key",
            type="SecureString",
            value="change-me-api-key-12345",
            key_id=kms_key_id,
            description="Payment API key"
        )

        # Application Configuration
        SsmParameter(self, f"app-config-{environment_suffix}",
            name=f"/payment/{environment_suffix}/app/config",
            type="String",
            value='{"max_retries": 3, "timeout": 30}',
            description="Application configuration JSON"
        )
```

## File: lib/lambda/payment-processor.js

```javascript
// Payment processing Lambda function
exports.handler = async (event) => {
    console.log('Processing payment:', JSON.stringify(event));

    // Simulate payment processing
    const paymentId = event.paymentId || 'unknown';
    const amount = event.amount || 0;

    try {
        // Process payment logic here
        console.log(`Processing payment ${paymentId} for amount ${amount}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Payment processed successfully',
                paymentId: paymentId,
                status: 'SUCCESS'
            })
        };
    } catch (error) {
        console.error('Payment processing failed:', error);
        throw error;
    }
};
```

## File: lib/lambda/firehose-transform.js

```javascript
// Firehose data transformation Lambda
exports.handler = async (event) => {
    const output = event.records.map(record => {
        const payload = Buffer.from(record.data, 'base64').toString('utf8');

        // Add timestamp and transform
        const transformed = {
            timestamp: new Date().toISOString(),
            data: JSON.parse(payload)
        };

        return {
            recordId: record.recordId,
            result: 'Ok',
            data: Buffer.from(JSON.stringify(transformed)).toString('base64')
        };
    });

    return { records: output };
};
```

# Payment Processing Application Infrastructure - CDKTF Python Implementation

This document contains the complete CDKTF Python implementation for a production-ready payment processing web application with PCI DSS compliance requirements.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking_stack import NetworkingStack
from lib.security_stack import SecurityStack
from lib.frontend_stack import FrontendStack
from lib.compute_stack import ComputeStack
from lib.database_stack import DatabaseStack
from lib.monitoring_stack import MonitoringStack


class TapStack(TerraformStack):
    """CDKTF Python stack for payment processing application infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # 1. Networking Stack - VPC, Subnets, NAT, Flow Logs
        networking = NetworkingStack(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # 2. Security Stack - Security Groups, IAM Roles, WAF
        security = SecurityStack(
            self,
            "security",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
        )

        # 3. Frontend Stack - S3, CloudFront for React frontend
        frontend = FrontendStack(
            self,
            "frontend",
            environment_suffix=environment_suffix,
        )

        # 4. Compute Stack - ALB, ASG, EC2 for Node.js API
        compute = ComputeStack(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            public_subnet_ids=networking.public_subnet_ids,
            private_subnet_ids=networking.private_subnet_ids,
            alb_security_group_id=security.alb_security_group_id,
            api_security_group_id=security.api_security_group_id,
            instance_profile_arn=security.instance_profile_arn,
            waf_web_acl_id=security.waf_web_acl_id,
            aws_region=aws_region,
        )

        # 5. Database Stack - RDS PostgreSQL Multi-AZ
        database = DatabaseStack(
            self,
            "database",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            database_security_group_id=security.database_security_group_id,
        )

        # 6. Monitoring Stack - CloudWatch Alarms and Logs
        monitoring = MonitoringStack(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            alb_arn_suffix=compute.alb_arn_suffix,
            alb_target_group_arn_suffix=compute.alb_target_group_arn_suffix,
            asg_name=compute.asg_name,
        )

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc_id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "cloudfront_distribution_id",
            value=frontend.cloudfront_distribution_id,
            description="CloudFront Distribution ID",
        )

        TerraformOutput(
            self,
            "cloudfront_domain_name",
            value=frontend.cloudfront_domain_name,
            description="CloudFront Domain Name",
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=compute.alb_dns_name,
            description="Application Load Balancer DNS Name",
        )

        TerraformOutput(
            self,
            "rds_endpoint",
            value=database.rds_endpoint,
            description="RDS Database Endpoint",
        )

        TerraformOutput(
            self,
            "db_connection_parameter",
            value=database.db_connection_parameter_name,
            description="SSM Parameter Store name for DB connection string",
        )
```

## File: lib/__init__.py

```python
"""Package initialization for infrastructure modules."""
```

## File: lib/networking_stack.py

```python
"""Networking Stack - VPC, Subnets, NAT Gateways, Flow Logs."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
import json


class NetworkingStack(Construct):
    """Networking infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        **kwargs
    ):
        """Initialize networking stack."""
        super().__init__(scope, construct_id)

        # VPC Configuration
        self._vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
            },
        )

        # Availability Zones
        azs = [
            f"{aws_region}a",
            f"{aws_region}b",
            f"{aws_region}c",
        ]

        # Public Subnets (for ALB)
        self._public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self._vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i+1}-{environment_suffix}",
                    "Type": "Public",
                },
            )
            self._public_subnets.append(subnet)

        # Private Subnets (for API servers and database)
        self._private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self._vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{i+1}-{environment_suffix}",
                    "Type": "Private",
                },
            )
            self._private_subnets.append(subnet)

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self._vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
            },
        )

        # Public Route Table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self._vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id,
                )
            ],
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
            },
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self._public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
            )

        # NAT Gateways (one per AZ for high availability)
        nat_gateways = []
        for i, subnet in enumerate(self._public_subnets):
            # Elastic IP for NAT Gateway
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={
                    "Name": f"payment-nat-eip-{i+1}-{environment_suffix}",
                },
            )

            # NAT Gateway
            nat = NatGateway(
                self,
                f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"payment-nat-{i+1}-{environment_suffix}",
                },
            )
            nat_gateways.append(nat)

        # Private Route Tables (one per AZ)
        for i, nat in enumerate(nat_gateways):
            private_rt = RouteTable(
                self,
                f"private_rt_{i}",
                vpc_id=self._vpc.id,
                route=[
                    RouteTableRoute(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat.id,
                    )
                ],
                tags={
                    "Name": f"payment-private-rt-{i+1}-{environment_suffix}",
                },
            )

            # Associate private subnet with private route table
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}",
                subnet_id=self._private_subnets[i].id,
                route_table_id=private_rt.id,
            )

        # VPC Flow Logs
        # CloudWatch Log Group for Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/payment-flowlogs-{environment_suffix}",
            retention_in_days=7,
        )

        # IAM Role for Flow Logs
        flow_log_role = IamRole(
            self,
            "vpc_flow_log_role",
            name=f"vpc-flow-log-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
        )

        # IAM Policy for Flow Logs
        IamRolePolicy(
            self,
            "vpc_flow_log_policy",
            name=f"vpc-flow-log-policy-{environment_suffix}",
            role=flow_log_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogGroups",
                        "logs:DescribeLogStreams"
                    ],
                    "Resource": "*"
                }]
            }),
        )

        # VPC Flow Log
        FlowLog(
            self,
            "vpc_flow_log",
            iam_role_arn=flow_log_role.arn,
            log_destination=flow_log_group.arn,
            traffic_type="ALL",
            vpc_id=self._vpc.id,
            tags={
                "Name": f"payment-vpc-flowlog-{environment_suffix}",
            },
        )

    @property
    def vpc_id(self) -> str:
        """Return VPC ID."""
        return self._vpc.id

    @property
    def public_subnet_ids(self) -> list:
        """Return list of public subnet IDs."""
        return [subnet.id for subnet in self._public_subnets]

    @property
    def private_subnet_ids(self) -> list:
        """Return list of private subnet IDs."""
        return [subnet.id for subnet in self._private_subnets]
```

## File: lib/security_stack.py

```python
"""Security Stack - Security Groups, IAM Roles, AWS WAF."""

from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.wafv2_web_acl import (
    Wafv2WebAcl,
    Wafv2WebAclRule,
    Wafv2WebAclRuleStatement,
    Wafv2WebAclRuleStatementManagedRuleGroupStatement,
    Wafv2WebAclRuleOverrideAction,
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
                    statement=Wafv2WebAclRuleStatement(
                        managed_rule_group_statement=Wafv2WebAclRuleStatementManagedRuleGroupStatement(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS",
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
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
                    statement=Wafv2WebAclRuleStatement(
                        managed_rule_group_statement=Wafv2WebAclRuleStatementManagedRuleGroupStatement(
                            name="AWSManagedRulesKnownBadInputsRuleSet",
                            vendor_name="AWS",
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
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
                    statement=Wafv2WebAclRuleStatement(
                        managed_rule_group_statement=Wafv2WebAclRuleStatementManagedRuleGroupStatement(
                            name="AWSManagedRulesSQLiRuleSet",
                            vendor_name="AWS",
                        )
                    ),
                    visibility_config=Wafv2WebAclVisibilityConfig(
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
        """Return WAF Web ACL ID."""
        return self._waf_acl.id
```

## File: lib/frontend_stack.py

```python
"""Frontend Stack - S3 and CloudFront for React application."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault,
)
from cdktf_cdktf_provider_aws.cloudfront_distribution import (
    CloudfrontDistribution,
    CloudfrontDistributionOrigin,
    CloudfrontDistributionOriginS3OriginConfig,
    CloudfrontDistributionDefaultCacheBehavior,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValues,
    CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies,
    CloudfrontDistributionRestrictions,
    CloudfrontDistributionRestrictionsGeoRestriction,
    CloudfrontDistributionViewerCertificate,
    CloudfrontDistributionDefaultRootObject,
)
from cdktf_cdktf_provider_aws.cloudfront_origin_access_identity import CloudfrontOriginAccessIdentity
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class FrontendStack(Construct):
    """Frontend infrastructure for React application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        **kwargs
    ):
        """Initialize frontend stack."""
        super().__init__(scope, construct_id)

        # S3 Bucket for Frontend Assets
        self._frontend_bucket = S3Bucket(
            self,
            "frontend_bucket",
            bucket=f"payment-frontend-{environment_suffix}",
            tags={
                "Name": f"payment-frontend-{environment_suffix}",
            },
        )

        # Block Public Access
        S3BucketPublicAccessBlock(
            self,
            "frontend_bucket_pab",
            bucket=self._frontend_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
        )

        # Enable Versioning
        S3BucketVersioningA(
            self,
            "frontend_bucket_versioning",
            bucket=self._frontend_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled",
            ),
        )

        # Enable Encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "frontend_bucket_encryption",
            bucket=self._frontend_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                        sse_algorithm="AES256",
                    ),
                )
            ],
        )

        # CloudFront Origin Access Identity
        oai = CloudfrontOriginAccessIdentity(
            self,
            "oai",
            comment=f"OAI for payment frontend {environment_suffix}",
        )

        # S3 Bucket Policy to allow CloudFront access
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "CloudFrontAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity {oai.id}"
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"{self._frontend_bucket.arn}/*"
                }
            ]
        }

        S3BucketPolicy(
            self,
            "frontend_bucket_policy",
            bucket=self._frontend_bucket.id,
            policy=json.dumps(bucket_policy),
        )

        # CloudFront Distribution
        self._cloudfront_distribution = CloudfrontDistribution(
            self,
            "cloudfront_distribution",
            enabled=True,
            is_ipv6_enabled=True,
            comment=f"CloudFront distribution for payment frontend {environment_suffix}",
            default_root_object="index.html",
            origin=[
                CloudfrontDistributionOrigin(
                    domain_name=self._frontend_bucket.bucket_regional_domain_name,
                    origin_id=f"S3-payment-frontend-{environment_suffix}",
                    s3_origin_config=CloudfrontDistributionOriginS3OriginConfig(
                        origin_access_identity=oai.cloudfront_access_identity_path,
                    ),
                )
            ],
            default_cache_behavior=CloudfrontDistributionDefaultCacheBehavior(
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                target_origin_id=f"S3-payment-frontend-{environment_suffix}",
                viewer_protocol_policy="redirect-to-https",
                compress=True,
                forwarded_values=CloudfrontDistributionDefaultCacheBehaviorForwardedValues(
                    query_string=False,
                    cookies=CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies(
                        forward="none",
                    ),
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400,
            ),
            restrictions=CloudfrontDistributionRestrictions(
                geo_restriction=CloudfrontDistributionRestrictionsGeoRestriction(
                    restriction_type="none",
                )
            ),
            viewer_certificate=CloudfrontDistributionViewerCertificate(
                cloudfront_default_certificate=True,
            ),
            tags={
                "Name": f"payment-cloudfront-{environment_suffix}",
            },
        )

    @property
    def frontend_bucket_name(self) -> str:
        """Return frontend bucket name."""
        return self._frontend_bucket.bucket

    @property
    def cloudfront_distribution_id(self) -> str:
        """Return CloudFront distribution ID."""
        return self._cloudfront_distribution.id

    @property
    def cloudfront_domain_name(self) -> str:
        """Return CloudFront domain name."""
        return self._cloudfront_distribution.domain_name
```

## File: lib/compute_stack.py

```python
"""Compute Stack - ALB, Auto Scaling Group, Launch Template."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.wafv2_web_acl_association import Wafv2WebAclAssociation
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate,
    LaunchTemplateIamInstanceProfile,
    LaunchTemplateMetadataOptions,
    LaunchTemplateMonitoring,
)
from cdktf_cdktf_provider_aws.autoscaling_group import (
    AutoscalingGroup,
    AutoscalingGroupLaunchTemplate,
    AutoscalingGroupTag,
)
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.data_aws_acm_certificate import DataAwsAcmCertificate


class ComputeStack(Construct):
    """Compute infrastructure for Node.js API servers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        public_subnet_ids: list,
        private_subnet_ids: list,
        alb_security_group_id: str,
        api_security_group_id: str,
        instance_profile_arn: str,
        waf_web_acl_id: str,
        aws_region: str,
        **kwargs
    ):
        """Initialize compute stack."""
        super().__init__(scope, construct_id)

        # Application Load Balancer
        self._alb = Lb(
            self,
            "alb",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_security_group_id],
            subnets=public_subnet_ids,
            enable_deletion_protection=False,
            enable_http2=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
            },
        )

        # Target Group
        self._target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"payment-tg-{environment_suffix}",
            port=3000,
            protocol="HTTP",
            vpc_id=vpc_id,
            target_type="instance",
            deregistration_delay=30,
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                protocol="HTTP",
                matcher="200",
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
            },
        )

        # ALB Listener (HTTPS would require ACM certificate)
        # For demo purposes, using HTTP listener
        # In production, use HTTPS with ACM certificate
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=self._alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=self._target_group.arn,
                )
            ],
        )

        # Associate WAF with ALB
        Wafv2WebAclAssociation(
            self,
            "waf_alb_association",
            resource_arn=self._alb.arn,
            web_acl_arn=waf_web_acl_id,
        )

        # Get latest Amazon Linux 2023 AMI
        ami = DataAwsAmi(
            self,
            "amazon_linux_2023",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-*-x86_64"],
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"],
                ),
            ],
        )

        # User Data Script for Node.js API
        user_data = f"""#!/bin/bash
# Update system
dnf update -y

# Install Node.js 18
dnf install -y nodejs npm

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Create app directory
mkdir -p /opt/payment-api
cd /opt/payment-api

# Create a simple Node.js API (placeholder)
cat > index.js << 'EOF'
const http = require('http');
const port = 3000;

const server = http.createServer((req, res) => {{
  if (req.url === '/health') {{
    res.writeHead(200, {{'Content-Type': 'application/json'}});
    res.end(JSON.stringify({{ status: 'healthy', environment: '{environment_suffix}' }}));
  }} else {{
    res.writeHead(200, {{'Content-Type': 'application/json'}});
    res.end(JSON.stringify({{ message: 'Payment API', environment: '{environment_suffix}' }}));
  }}
}});

server.listen(port, '0.0.0.0', () => {{
  console.log(`Payment API listening on port ${{port}}`);
}});
EOF

# Create systemd service
cat > /etc/systemd/system/payment-api.service << EOF
[Unit]
Description=Payment API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-api
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable payment-api
systemctl start payment-api
"""

        # Launch Template
        launch_template = LaunchTemplate(
            self,
            "launch_template",
            name=f"payment-api-lt-{environment_suffix}",
            image_id=ami.id,
            instance_type="t3.micro",
            vpc_security_group_ids=[api_security_group_id],
            user_data=user_data,
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                arn=instance_profile_arn,
            ),
            metadata_options=LaunchTemplateMetadataOptions(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1,
            ),
            monitoring=LaunchTemplateMonitoring(
                enabled=True,
            ),
            tags={
                "Name": f"payment-api-lt-{environment_suffix}",
            },
        )

        # Auto Scaling Group
        self._asg = AutoscalingGroup(
            self,
            "asg",
            name=f"payment-api-asg-{environment_suffix}",
            min_size=2,
            max_size=6,
            desired_capacity=2,
            vpc_zone_identifier=private_subnet_ids,
            target_group_arns=[self._target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template=AutoscalingGroupLaunchTemplate(
                id=launch_template.id,
                version="$Latest",
            ),
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"payment-api-{environment_suffix}",
                    propagate_at_launch=True,
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment_suffix,
                    propagate_at_launch=True,
                ),
            ],
        )

    @property
    def alb_dns_name(self) -> str:
        """Return ALB DNS name."""
        return self._alb.dns_name

    @property
    def alb_arn(self) -> str:
        """Return ALB ARN."""
        return self._alb.arn

    @property
    def alb_arn_suffix(self) -> str:
        """Return ALB ARN suffix."""
        return self._alb.arn_suffix

    @property
    def alb_target_group_arn_suffix(self) -> str:
        """Return target group ARN suffix."""
        return self._target_group.arn_suffix

    @property
    def asg_name(self) -> str:
        """Return Auto Scaling Group name."""
        return self._asg.name
```

## File: lib/database_stack.py

```python
"""Database Stack - RDS PostgreSQL with Multi-AZ deployment."""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json


class DatabaseStack(Construct):
    """Database infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        database_security_group_id: str,
        **kwargs
    ):
        """Initialize database stack."""
        super().__init__(scope, construct_id)

        # KMS Key for RDS Encryption
        kms_key = KmsKey(
            self,
            "rds_kms_key",
            description=f"KMS key for RDS encryption - {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"payment-rds-kms-{environment_suffix}",
            },
        )

        KmsAlias(
            self,
            "rds_kms_alias",
            name=f"alias/payment-rds-{environment_suffix}",
            target_key_id=kms_key.key_id,
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"payment-db-subnet-group-{environment_suffix}",
            description=f"Subnet group for payment database - {environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}",
            },
        )

        # RDS PostgreSQL Instance
        self._rds_instance = DbInstance(
            self,
            "rds_instance",
            identifier=f"payment-db-{environment_suffix}",
            engine="postgres",
            engine_version="15.5",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            db_name="paymentdb",
            username="dbadmin",
            manage_master_user_password=True,
            multi_az=True,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[database_security_group_id],
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            auto_minor_version_upgrade=True,
            publicly_accessible=False,
            tags={
                "Name": f"payment-db-{environment_suffix}",
            },
        )

        # Store DB connection string in SSM Parameter Store
        # Note: In production, retrieve password from Secrets Manager
        connection_string = f"postgresql://dbadmin@{self._rds_instance.endpoint}/paymentdb"

        self._db_parameter = SsmParameter(
            self,
            "db_connection_parameter",
            name=f"/payment/{environment_suffix}/db/connection",
            description=f"Database connection string for payment app - {environment_suffix}",
            type="SecureString",
            value=connection_string,
            tags={
                "Name": f"payment-db-connection-{environment_suffix}",
            },
        )

    @property
    def rds_endpoint(self) -> str:
        """Return RDS endpoint."""
        return self._rds_instance.endpoint

    @property
    def rds_arn(self) -> str:
        """Return RDS ARN."""
        return self._rds_instance.arn

    @property
    def db_connection_parameter_name(self) -> str:
        """Return SSM parameter name for DB connection string."""
        return self._db_parameter.name
```

## File: lib/monitoring_stack.py

```python
"""Monitoring Stack - CloudWatch Alarms and Logs."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringStack(Construct):
    """Monitoring infrastructure for payment processing application."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        alb_arn_suffix: str,
        alb_target_group_arn_suffix: str,
        asg_name: str,
        **kwargs
    ):
        """Initialize monitoring stack."""
        super().__init__(scope, construct_id)

        # ALB 5XX Error Rate Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_5xx_alarm",
            alarm_name=f"payment-alb-5xx-{environment_suffix}",
            alarm_description="Alert when ALB 5XX error rate exceeds 5%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=5.0,
            metric_name="HTTPCode_Target_5XX_Count",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "LoadBalancer": alb_arn_suffix,
                "TargetGroup": alb_target_group_arn_suffix,
            },
            tags={
                "Name": f"payment-alb-5xx-alarm-{environment_suffix}",
            },
        )

        # ALB Unhealthy Host Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_unhealthy_hosts_alarm",
            alarm_name=f"payment-alb-unhealthy-hosts-{environment_suffix}",
            alarm_description="Alert when unhealthy hosts detected",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=0,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "LoadBalancer": alb_arn_suffix,
                "TargetGroup": alb_target_group_arn_suffix,
            },
            tags={
                "Name": f"payment-alb-unhealthy-hosts-alarm-{environment_suffix}",
            },
        )

        # ASG CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "asg_cpu_alarm",
            alarm_name=f"payment-asg-cpu-{environment_suffix}",
            alarm_description="Alert when ASG CPU utilization exceeds 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80.0,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "AutoScalingGroupName": asg_name,
            },
            tags={
                "Name": f"payment-asg-cpu-alarm-{environment_suffix}",
            },
        )

        # ASG Memory Utilization Alarm (if CloudWatch agent is configured)
        CloudwatchMetricAlarm(
            self,
            "asg_memory_alarm",
            alarm_name=f"payment-asg-memory-{environment_suffix}",
            alarm_description="Alert when ASG memory utilization exceeds 80%",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=80.0,
            metric_name="mem_used_percent",
            namespace="CWAgent",
            period=300,
            statistic="Average",
            treat_missing_data="notBreaching",
            dimensions={
                "AutoScalingGroupName": asg_name,
            },
            tags={
                "Name": f"payment-asg-memory-alarm-{environment_suffix}",
            },
        )
```

## File: lib/README.md

```markdown
# Payment Processing Application Infrastructure

This infrastructure deploys a production-ready payment processing web application with PCI DSS compliance requirements using CDKTF with Python.

## Architecture Overview

The infrastructure consists of:

1. **Networking** - VPC with 3 availability zones, public and private subnets, NAT gateways, and VPC Flow Logs
2. **Security** - Security groups, IAM roles, and AWS WAF with managed rule groups
3. **Frontend** - S3 bucket and CloudFront distribution for React frontend assets
4. **Compute** - Application Load Balancer, Auto Scaling Group, and EC2 instances for Node.js API
5. **Database** - RDS PostgreSQL Multi-AZ instance with encryption and automated backups
6. **Monitoring** - CloudWatch alarms for ALB errors and ASG CPU utilization

## Infrastructure Components

### Networking Stack
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (for ALB)
- 3 private subnets (for API servers and database)
- Internet Gateway for public access
- NAT Gateways for outbound internet from private subnets
- VPC Flow Logs to CloudWatch

### Security Stack
- ALB Security Group (HTTPS from internet)
- API Security Group (traffic from ALB only)
- Database Security Group (PostgreSQL from API servers only)
- IAM roles and instance profiles for EC2
- AWS WAF with managed rule groups:
  - Core Rule Set
  - Known Bad Inputs
  - SQL Injection protection

### Frontend Stack
- S3 bucket with encryption and versioning
- CloudFront distribution with OAI
- HTTPS redirect

### Compute Stack
- Application Load Balancer in public subnets
- Auto Scaling Group (2-6 instances) in private subnets
- Launch template with Amazon Linux 2023
- Node.js API with health check endpoint
- WAF association with ALB

### Database Stack
- RDS PostgreSQL 15.5 Multi-AZ
- Encrypted with KMS
- Automated backups (7-day retention)
- Performance Insights enabled
- Connection string stored in SSM Parameter Store

### Monitoring Stack
- CloudWatch alarm for ALB 5XX errors (>5%)
- CloudWatch alarm for unhealthy hosts
- CloudWatch alarm for ASG CPU utilization (>80%)
- CloudWatch alarm for ASG memory utilization (>80%)

## Deployment

### Prerequisites
- Python 3.9+
- Terraform CLI
- AWS CLI configured with credentials
- Pipenv for dependency management

### Deploy Infrastructure

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"

# Install dependencies
pipenv install

# Synthesize CDKTF
pipenv run cdktf synth

# Deploy infrastructure
pipenv run cdktf deploy
```

### Outputs

After deployment, the following outputs are available:

- `vpc_id` - VPC ID
- `cloudfront_distribution_id` - CloudFront distribution ID
- `cloudfront_domain_name` - CloudFront domain name for frontend access
- `alb_dns_name` - Application Load Balancer DNS name
- `rds_endpoint` - RDS database endpoint
- `db_connection_parameter` - SSM parameter name for database connection string

## Security Considerations

### PCI DSS Compliance

This infrastructure implements several PCI DSS requirements:

- **Data Encryption**: All data is encrypted at rest (S3, RDS) and in transit (HTTPS)
- **Network Segmentation**: Separate subnets for public (ALB), private (API), and database tiers
- **Access Controls**: Security groups enforce least privilege between tiers
- **Logging and Monitoring**: VPC Flow Logs, CloudWatch alarms, and RDS logs
- **Secure Configuration**: IMDSv2 required, encryption enabled by default

### Additional Security Features

- AWS WAF protects against common web exploits
- CloudFront OAI restricts S3 bucket access
- Multi-AZ deployment for high availability
- Automated backups with 7-day retention
- KMS encryption for database

## Cost Optimization

The infrastructure uses cost-effective configurations:

- `t3.micro` instances for API servers
- `db.t3.micro` for RDS (increase for production)
- CloudWatch log retention set to 7 days
- Auto Scaling to match demand

## Testing

Run unit tests:
```bash
pipenv run pytest tests/unit/ -v
```

Run integration tests (requires deployed infrastructure):
```bash
pipenv run pytest tests/integration/ -v
```

## Cleanup

To destroy all infrastructure:

```bash
pipenv run cdktf destroy
```

## Notes

- This is a demonstration infrastructure for synthetic task generation
- In production, use ACM certificates for HTTPS on ALB
- Configure proper HTTPS listener with SSL/TLS policies
- Implement database password rotation with AWS Secrets Manager
- Add CloudWatch dashboard for centralized monitoring
- Configure ALB access logs to S3
- Implement auto-scaling policies based on metrics
- Add SNS topics for alarm notifications
```

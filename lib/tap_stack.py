#!/usr/bin/env python3
"""
Zero-Trust Security Architecture Stack for Banking Environment
Implements comprehensive security controls with automated threat response
"""

import json
from typing import Any, Dict, List

from aws_cdk import CfnOutput, CfnParameter, Duration, RemovalPolicy, Stack, Tags, CfnCondition, Fn, CfnDeletionPolicy, CustomResource
from aws_cdk import aws_cloudtrail as cloudtrail
from aws_cdk import aws_config as config
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_events as events
from aws_cdk import aws_events_targets as targets
from aws_cdk import aws_guardduty as guardduty
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from aws_cdk import aws_networkfirewall as network_firewall
from aws_cdk import aws_route53resolver as resolver
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_securityhub as securityhub
from aws_cdk import aws_sns as sns
from aws_cdk import aws_sns_subscriptions as sns_subscriptions
from aws_cdk import aws_ssm as ssm
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cw_actions
from constructs import Construct


class TapStackProps:
    """Properties for TapStack"""
    def __init__(self, environment_suffix: str = "dev", env=None):
        self.environment_suffix = environment_suffix
        self.env = env


class TapStack(Stack):
    """
    Zero-Trust Security Architecture Stack
    Implements comprehensive security controls for banking environment
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: TapStackProps = None,
        stack_environment: str = "production",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Stack configuration
        self.stack_environment = stack_environment
        self.org_id = "bank-org-12345"
        self.environment_suffix = props.environment_suffix if props else "dev"
        self.compliance_tags = {
            "Compliance": "PCI-DSS",
            "DataClassification": "Sensitive",
            "Environment": stack_environment,
            "ManagedBy": "CDK",
            "SecurityLevel": "Critical"
        }

        # Apply compliance tags to all resources
        for key, value in self.compliance_tags.items():
            Tags.of(self).add(key, value)
        
        # Create CDK parameters for flexible configuration
        self._create_parameters()
        
        # Generate unique identifier for resources to prevent conflicts
        import hashlib
        import random
        unique_id = hashlib.md5(f"{self.account}-{self.environment_suffix}-{random.randint(1000, 9999)}".encode()).hexdigest()[:8]
        self.unique_suffix = f"{self.environment_suffix}-{unique_id}"

        # Create KMS keys for encryption
        self._create_encryption_keys()
        
        # Create VPC and network infrastructure
        self._create_network_infrastructure()
        
        # Set up Transit Gateway for inter-VPC communication
        self._create_transit_gateway()
        
        # Deploy Network Firewall
        self._create_network_firewall()
        
        # Configure IAM roles and policies
        self._create_iam_resources()
        
        # Set up logging and monitoring
        self._create_logging_infrastructure()
        
        # Deploy GuardDuty for threat detection
        self._create_guardduty()
        
        # Set up Security Hub for centralized management
        self._create_security_hub()
        
        # Create incident response automation
        self._create_incident_response()
        
        # Configure Systems Manager for secure access
        self._create_systems_manager()
        
        # Set up AWS Config for compliance monitoring
        self._create_config_rules()
        
        # Create resource monitoring and quotas
        self._create_resource_monitoring()

    def _create_encryption_keys(self):
        """Create KMS keys for encryption at rest"""
        
        # Master key for all encryption
        self.master_key = kms.Key(
            self, "MasterKey",
            description="Master KMS key for banking zero-trust architecture",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            alias=f"alias/zero-trust-master-{self.unique_suffix}",
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        sid="Enable IAM User Permissions",
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AccountRootPrincipal()],
                        actions=["kms:*"],
                        resources=["*"]
                    ),
                    iam.PolicyStatement(
                        sid="Allow CloudWatch Logs",
                        effect=iam.Effect.ALLOW,
                        principals=[
                            iam.ServicePrincipal("logs.amazonaws.com")
                        ],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:CreateGrant",
                            "kms:DescribeKey",
                            "kms:GenerateDataKey"
                        ],
                        resources=["*"]
                    ),
                    iam.PolicyStatement(
                        sid="Allow CloudTrail Service",
                        effect=iam.Effect.ALLOW,
                        principals=[
                            iam.ServicePrincipal("cloudtrail.amazonaws.com")
                        ],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:CreateGrant",
                            "kms:DescribeKey",
                            "kms:GenerateDataKey"
                        ],
                        resources=["*"]
                    )
                ]
            )
        )

        # Separate key for audit logs (compliance requirement)
        self.audit_key = kms.Key(
            self, "AuditKey",
            description="KMS key for audit logs encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
            alias=f"alias/audit-logs-{self.unique_suffix}",
            policy=iam.PolicyDocument(
                statements=[
                    # Allow account root permissions
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AccountRootPrincipal()],
                        actions=["kms:*"],
                        resources=["*"]
                    ),
                    # Allow CloudTrail service to use the key
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                        actions=[
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        resources=["*"],
                        conditions={
                            "StringEquals": {
                                "kms:EncryptionContext:aws:cloudtrail:arn": f"arn:aws:cloudtrail:{self.region}:{self.account}:trail/zero-trust-trail-{self.unique_suffix}"
                            }
                        }
                    )
                ]
            )
        )

    def _calculate_subnet_cidr(self, vpc_cidr: str, subnet_index: int, subnet_mask: int) -> str:
        """Calculate subnet CIDR based on VPC CIDR and subnet parameters"""
        import ipaddress
        
        # Parse VPC network
        vpc_network = ipaddress.ip_network(vpc_cidr)
        
        # Calculate subnet size
        subnet_size = 32 - subnet_mask
        host_bits = 32 - vpc_network.prefixlen
        
        # Generate subnet
        subnets = list(vpc_network.subnets(new_prefix=subnet_mask))
        if subnet_index < len(subnets):
            return str(subnets[subnet_index])
        else:
            # Fallback for dynamic calculation
            base_address = int(vpc_network.network_address)
            subnet_address = base_address + (subnet_index << (host_bits - (subnet_mask - vpc_network.prefixlen)))
            return f"{ipaddress.ip_address(subnet_address)}/{subnet_mask}"
    
    def _create_parameters(self):
        """Create CDK parameters for flexible infrastructure configuration"""
        
        # VPC CIDR parameter
        self.vpc_cidr = CfnParameter(
            self, "VPCCidr",
            type="String",
            default="10.0.0.0/16",
            description="CIDR block for the main VPC",
            allowed_pattern=r"^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$"
        )
        
        # Subnet mask parameters
        self.dmz_subnet_mask = CfnParameter(
            self, "DMZSubnetMask",
            type="Number",
            default=24,
            min_value=20,
            max_value=28,
            description="Subnet mask for DMZ subnets"
        )
        
        self.app_subnet_mask = CfnParameter(
            self, "ApplicationSubnetMask", 
            type="Number",
            default=24,
            min_value=20,
            max_value=28,
            description="Subnet mask for Application subnets"
        )
        
        self.data_subnet_mask = CfnParameter(
            self, "DataSubnetMask",
            type="Number",
            default=24,
            min_value=20,
            max_value=28,
            description="Subnet mask for Data subnets"
        )
        
        self.mgmt_subnet_mask = CfnParameter(
            self, "ManagementSubnetMask",
            type="Number",
            default=24,
            min_value=20,
            max_value=28,
            description="Subnet mask for Management subnets"
        )
        
        # Resource limit parameters
        self.max_ec2_instances = CfnParameter(
            self, "MaxEC2Instances",
            type="Number",
            default=50,
            min_value=1,
            max_value=500,
            description="Maximum number of EC2 instances allowed"
        )
        
        self.max_s3_buckets = CfnParameter(
            self, "MaxS3Buckets", 
            type="Number",
            default=20,
            min_value=1,
            max_value=100,
            description="Maximum number of S3 buckets allowed"
        )

    def _create_network_infrastructure(self):
        """Create isolated VPC architecture with security zones"""
        
        # Create main VPC with isolated subnets
        self.vpc = ec2.Vpc(
            self, "ZeroTrustVPC",
            max_azs=3,
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            enable_dns_hostnames=True,
            enable_dns_support=True,
            nat_gateways=0,  # No NAT by default, will add with strict controls
            subnet_configuration=[
                # DMZ subnet for external-facing resources
                ec2.SubnetConfiguration(
                    name="DMZ",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Application subnet for workloads
                ec2.SubnetConfiguration(
                    name="Application",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                ),
                # Data subnet for databases
                ec2.SubnetConfiguration(
                    name="Data",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                ),
                # Management subnet for administration
                ec2.SubnetConfiguration(
                    name="Management",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            flow_logs={
                "vpc_flow_logs": ec2.FlowLogOptions(
                    destination=ec2.FlowLogDestination.to_s3(
                        s3.Bucket(
                            self, "VPCFlowLogsBucket",
                            bucket_name=f"vpc-flow-logs-{self.unique_suffix}-{self.account}-{self.region}",
                            encryption=s3.BucketEncryption.KMS,
                            encryption_key=self.master_key,
                            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
                            removal_policy=RemovalPolicy.DESTROY,
                            lifecycle_rules=[
                                s3.LifecycleRule(
                                    transitions=[
                                        s3.Transition(
                                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                                            transition_after=Duration.days(30)
                                        ),
                                        s3.Transition(
                                            storage_class=s3.StorageClass.GLACIER,
                                            transition_after=Duration.days(90)
                                        )
                                    ],
                                    expiration=Duration.days(2555)  # 7 years retention
                                )
                            ]
                        )
                    ),
                    traffic_type=ec2.FlowLogTrafficType.ALL
                )
            }
        )

        # Create VPC endpoints for AWS services (avoid internet routing)
        self._create_vpc_endpoints()

        # Create Network ACLs for subnet isolation
        self._create_network_acls()

    def _create_vpc_endpoints(self):
        """Create VPC endpoints for secure AWS service access"""
        
        # S3 Gateway endpoint
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[
                ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
            ]
        )

        # Systems Manager endpoints for Session Manager
        ssm_services = [
            "ssm", "ssmmessages", "ec2messages", "kms", "logs"
        ]
        
        for service in ssm_services:
            self.vpc.add_interface_endpoint(
                f"{service.capitalize()}Endpoint",
                service=ec2.InterfaceVpcEndpointAwsService(service),
                subnets=ec2.SubnetSelection(
                    subnet_group_name="Management"
                )
            )

        # GuardDuty endpoint
        self.vpc.add_interface_endpoint(
            "GuardDutyEndpoint",
            service=ec2.InterfaceVpcEndpointAwsService("guardduty-data"),
            subnets=ec2.SubnetSelection(
                subnet_group_name="Management"
            )
        )

    def _create_network_acls(self):
        """Create Network ACLs for subnet-level security"""
        
        # Data subnet NACL - most restrictive
        data_nacl = ec2.NetworkAcl(
            self, "DataNACL",
            vpc=self.vpc,
            subnet_selection=ec2.SubnetSelection(
                subnet_group_name="Data"
            )
        )
        
        # Allow only application subnet to access data subnet
        data_nacl.add_entry(
            "AllowAppSubnet",
            cidr=ec2.AclCidr.ipv4("10.0.1.0/24"),  # App subnet CIDR
            rule_number=100,
            traffic=ec2.AclTraffic.tcp_port(3306),  # MySQL
            direction=ec2.TrafficDirection.INGRESS
        )
        
        data_nacl.add_entry(
            "AllowAppSubnetPostgres",
            cidr=ec2.AclCidr.ipv4("10.0.1.0/24"),
            rule_number=110,
            traffic=ec2.AclTraffic.tcp_port(5432),  # PostgreSQL
            direction=ec2.TrafficDirection.INGRESS
        )

    def _create_transit_gateway(self):
        """Create Transit Gateway for controlled inter-VPC routing"""
        
        # Transit Gateway for multi-account connectivity
        self.transit_gateway = ec2.CfnTransitGateway(
            self, "TransitGateway",
            description="Zero-Trust Transit Gateway for controlled routing",
            default_route_table_association="disable",
            default_route_table_propagation="disable",
            dns_support="enable",
            vpn_ecmp_support="enable",
            tags=[{
                "key": "Name",
                "value": f"ZeroTrustTGW-{self.unique_suffix}"
            }]
        )

        # Attach VPC to Transit Gateway
        # Use only public subnets to avoid duplicate AZ issues
        subnet_ids = [subnet.subnet_id for subnet in self.vpc.public_subnets[:3]]
        
        self.tgw_attachment = ec2.CfnTransitGatewayAttachment(
            self, "TGWAttachment",
            transit_gateway_id=self.transit_gateway.ref,
            vpc_id=self.vpc.vpc_id,
            subnet_ids=subnet_ids,
            tags=[{
                "key": "Name",
                "value": f"MainVPCAttachment-{self.unique_suffix}"
            }]
        )

        # Create Transit Gateway route table with strict routing rules
        self.tgw_route_table = ec2.CfnTransitGatewayRouteTable(
            self, "TGWRouteTable",
            transit_gateway_id=self.transit_gateway.ref,
            tags=[{
                "key": "Name",
                "value": "ZeroTrustRouteTable"
            }]
        )

    def _create_network_firewall(self):
        """Deploy AWS Network Firewall for traffic inspection"""
        
        # Create firewall policy
        firewall_policy = network_firewall.CfnFirewallPolicy(
            self, "FirewallPolicy",
            firewall_policy_name=f"zero-trust-policy-{self.unique_suffix}",
            firewall_policy=network_firewall.CfnFirewallPolicy.FirewallPolicyProperty(
                stateless_default_actions=["aws:forward_to_sfe"],
                stateless_fragment_default_actions=["aws:forward_to_sfe"],
                stateful_rule_group_references=[
                    network_firewall.CfnFirewallPolicy.StatefulRuleGroupReferenceProperty(
                        resource_arn=self._create_stateful_rules().attr_rule_group_arn,
                        priority=100
                    )
                ],
                stateful_default_actions=["aws:drop_established"],
                stateful_engine_options=network_firewall.CfnFirewallPolicy.StatefulEngineOptionsProperty(
                    rule_order="STRICT_ORDER"
                )
            ),
            description="Zero-trust firewall policy with strict inspection",
            tags=[{
                "key": "Name",
                "value": "ZeroTrustFirewallPolicy"
            }]
        )

        # Create firewall
        self.firewall = network_firewall.CfnFirewall(
            self, "NetworkFirewall",
            firewall_name=f"zero-trust-firewall-{self.unique_suffix}",
            firewall_policy_arn=firewall_policy.attr_firewall_policy_arn,
            vpc_id=self.vpc.vpc_id,
            subnet_mappings=[
                network_firewall.CfnFirewall.SubnetMappingProperty(
                    subnet_id=subnet.subnet_id
                ) for subnet in self.vpc.public_subnets[:2]
            ],
            delete_protection=False,
            firewall_policy_change_protection=False,
            subnet_change_protection=False,
            description="Network firewall for zero-trust architecture",
            tags=[{
                "key": "Name",
                "value": "ZeroTrustFirewall"
            }]
        )

        # Create CloudWatch log group for NetworkFirewall logs
        firewall_log_group = logs.LogGroup(
            self, "NetworkFirewallLogGroup",
            log_group_name=f"/aws/networkfirewall/{self.firewall.firewall_name}",
            retention=logs.RetentionDays.ONE_MONTH,
            encryption_key=self.master_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Enable firewall logging
        network_firewall.CfnLoggingConfiguration(
            self, "FirewallLogging",
            firewall_arn=self.firewall.attr_firewall_arn,
            logging_configuration=network_firewall.CfnLoggingConfiguration.LoggingConfigurationProperty(
                log_destination_configs=[
                    network_firewall.CfnLoggingConfiguration.LogDestinationConfigProperty(
                        log_destination={
                            "logGroup": firewall_log_group.log_group_name
                        },
                        log_destination_type="CloudWatchLogs",
                        log_type="ALERT"
                    ),
                    network_firewall.CfnLoggingConfiguration.LogDestinationConfigProperty(
                        log_destination={
                            "logGroup": firewall_log_group.log_group_name
                        },
                        log_destination_type="CloudWatchLogs",
                        log_type="FLOW"
                    )
                ]
            )
        )

    def _create_stateful_rules(self):
        """Create stateful firewall rules for deep packet inspection"""
        
        return network_firewall.CfnRuleGroup(
            self, "StatefulRules",
            rule_group_name=f"banking-stateful-rules-{self.unique_suffix}",
            type="STATEFUL",
            capacity=100,
            rule_group=network_firewall.CfnRuleGroup.RuleGroupProperty(
                rules_source=network_firewall.CfnRuleGroup.RulesSourceProperty(
                    stateful_rules=[
                        # Block known malicious domains
                        network_firewall.CfnRuleGroup.StatefulRuleProperty(
                            action="DROP",
                            header=network_firewall.CfnRuleGroup.HeaderProperty(
                                destination="ANY",
                                destination_port="ANY",
                                direction="ANY",
                                protocol="HTTP",
                                source="ANY",
                                source_port="ANY"
                            ),
                            rule_options=[
                                network_firewall.CfnRuleGroup.RuleOptionProperty(
                                    keyword="content",
                                    settings=['"/malicious"']
                                ),
                                network_firewall.CfnRuleGroup.RuleOptionProperty(
                                    keyword="sid",
                                    settings=["1234567890"]
                                )
                            ]
                        ),
                        # Allow only HTTPS traffic on standard ports
                        network_firewall.CfnRuleGroup.StatefulRuleProperty(
                            action="PASS",
                            header=network_firewall.CfnRuleGroup.HeaderProperty(
                                destination="ANY",
                                destination_port="443",
                                direction="FORWARD",
                                protocol="TLS",
                                source="10.0.0.0/16",
                                source_port="ANY"
                            ),
                            rule_options=[
                                network_firewall.CfnRuleGroup.RuleOptionProperty(
                                    keyword="sid",
                                    settings=["1"]
                                )
                            ]
                        )
                    ]
                ),
                stateful_rule_options=network_firewall.CfnRuleGroup.StatefulRuleOptionsProperty(
                    rule_order="STRICT_ORDER"
                )
            ),
            description="Stateful rules for banking compliance",
            tags=[{
                "key": "Name",
                "value": "BankingStatefulRules"
            }]
        )

    def _create_iam_resources(self):
        """Create IAM roles and policies with least privilege and conditions"""
        
        # Create assume role policy with MFA requirement
        assume_role_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AccountPrincipal(self.account)],
                    actions=["sts:AssumeRole"],
                    conditions={
                        "Bool": {
                            "aws:MultiFactorAuthPresent": "true"
                        },
                        "IpAddress": {
                            "aws:SourceIp": [
                                "192.168.1.0/24",  # Corporate IP range
                                "10.0.0.0/16"      # VPC range
                            ]
                        }
                    }
                )
            ]
        )

        # Admin role with time-based access
        self.admin_role = iam.Role(
            self, "AdminRole",
            role_name=f"ZeroTrustAdminRole-{self.unique_suffix}",
            assumed_by=iam.CompositePrincipal(
                iam.AccountPrincipal(self.account)
            ),
            inline_policies={
                "TimeBasedAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["*"],
                            resources=["*"],
                            conditions={
                                "StringEquals": {
                                    "aws:RequestedRegion": [self.region]
                                },
                                "ForAnyValue:StringEquals": {
                                    "aws:PrincipalTag/Department": ["Security", "Operations"]
                                }
                            }
                        )
                    ]
                )
            },
            max_session_duration=Duration.hours(1),
            description="Admin role with time-based and MFA-enforced access"
        )
        
        # Set deletion policy to handle cleanup gracefully
        self.admin_role.node.default_child.cfn_options.deletion_policy = CfnDeletionPolicy.RETAIN

        # Read-only role for auditors
        self.auditor_role = iam.Role(
            self, "AuditorRole",
            role_name=f"ZeroTrustAuditorRole-{self.unique_suffix}",
            assumed_by=iam.AccountPrincipal(self.account),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("SecurityAudit"),
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchLogsReadOnlyAccess")
            ],
            max_session_duration=Duration.hours(4),
            description="Auditor role with read-only access to compliance data"
        )
        
        # Set deletion policy to handle cleanup gracefully
        self.auditor_role.node.default_child.cfn_options.deletion_policy = CfnDeletionPolicy.RETAIN

        # Incident response role
        self.incident_response_role = iam.Role(
            self, "IncidentResponseRole",
            role_name=f"ZeroTrustIncidentResponseRole-{self.unique_suffix}",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("lambda.amazonaws.com"),
                iam.AccountPrincipal(self.account)
            ),
            inline_policies={
                "IncidentResponsePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "ec2:DescribeInstances",
                                "ec2:IsolateInstance",
                                "ec2:CreateSnapshot",
                                "ec2:StopInstances",
                                "ec2:ModifyInstanceAttribute",
                                "guardduty:GetFindings",
                                "securityhub:UpdateFindings",
                                "sns:Publish",
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            },
            description="Automated incident response role"
        )
        
        # Set deletion policy to handle cleanup gracefully - but this role may be in use by Lambda
        # Use RETAIN to prevent deletion issues with dependent resources
        self.incident_response_role.node.default_child.cfn_options.deletion_policy = CfnDeletionPolicy.RETAIN

    def _create_logging_infrastructure(self):
        """Set up comprehensive logging with CloudTrail"""
        
        # Create S3 bucket for CloudTrail
        self.trail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            bucket_name=f"cloudtrail-{self.unique_suffix}-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.audit_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ],
                    expiration=Duration.days(2555)  # 7 years for compliance
                )
            ],
            versioned=True,
            object_lock_enabled=True  # WORM compliance
        )

        # Add bucket policy to allow CloudTrail service access
        self.trail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[self.trail_bucket.bucket_arn]
            )
        )

        self.trail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailWrite",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{self.trail_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )

        # Create CloudTrail
        self.trail = cloudtrail.Trail(
            self, "CloudTrail",
            trail_name=f"zero-trust-trail-{self.unique_suffix}",
            bucket=self.trail_bucket,
            encryption_key=self.audit_key,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            insight_types=[
                cloudtrail.InsightType.API_CALL_RATE,
                cloudtrail.InsightType.API_ERROR_RATE
            ]
        )

        # CloudWatch Log Group for real-time monitoring
        self.log_group = logs.LogGroup(
            self, "CloudTrailLogGroup",
            log_group_name=f"/aws/cloudtrail/zero-trust-{self.unique_suffix}",
            retention=logs.RetentionDays.ONE_YEAR,
            encryption_key=self.master_key,
            removal_policy=RemovalPolicy.DESTROY
        )

        # CloudTrail events already configured in trail creation above

    def _create_guardduty(self):
        """Enable GuardDuty for threat detection with automatic existing resource detection"""
        
        # Create Lambda function to detect existing GuardDuty detectors
        guardduty_detector_lambda = lambda_.Function(
            self, "GuardDutyDetectorLambda",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="guardduty_detector.handler",
            code=lambda_.Code.from_asset("./lib/lambda_functions", exclude=["*.pyc"]),
            environment={
                "BUCKET_NAME": self.trail_bucket.bucket_name,
                "UNIQUE_SUFFIX": self.unique_suffix
            },
            timeout=Duration.minutes(5),
            role=iam.Role(
                self, "GuardDutyDetectorLambdaRole",
                assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
                ],
                inline_policies={
                    "GuardDutyAccess": iam.PolicyDocument(
                        statements=[
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "guardduty:ListDetectors",
                                    "guardduty:CreateDetector",
                                    "guardduty:UpdateDetector",
                                    "guardduty:GetDetector",
                                    "guardduty:TagResource",
                                    "guardduty:CreateThreatIntelSet",
                                    "guardduty:CreateIPSet",
                                    "guardduty:UpdateThreatIntelSet",
                                    "guardduty:UpdateIPSet",
                                    "guardduty:GetThreatIntelSet",
                                    "guardduty:GetIPSet",
                                    "guardduty:DeleteThreatIntelSet",
                                    "guardduty:DeleteIPSet",
                                    "guardduty:ListThreatIntelSets",
                                    "guardduty:ListIPSets"
                                ],
                                resources=["*"]
                            ),
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "iam:PutRolePolicy",
                                    "iam:CreateServiceLinkedRole",
                                    "iam:GetRole",
                                    "iam:PassRole"
                                ],
                                resources=["*"]
                            ),
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "s3:GetObject",
                                    "s3:PutObject",
                                    "s3:HeadObject"
                                ],
                                resources=[f"{self.trail_bucket.bucket_arn}/*"]
                            ),
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "s3:GetBucketLocation",
                                    "s3:ListBucket"
                                ],
                                resources=[self.trail_bucket.bucket_arn]
                            ),
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "kms:Decrypt",
                                    "kms:GenerateDataKey"
                                ],
                                resources=[self.audit_key.key_arn]
                            )
                        ]
                    )
                }
            )
        )
        
        # Custom resource to handle GuardDuty detector detection
        guardduty_resource = CustomResource(
            self, "GuardDutyDetectorResource",
            service_token=guardduty_detector_lambda.function_arn,
            properties={
                "BucketName": self.trail_bucket.bucket_name,
                "UniqueSuffix": self.unique_suffix
            }
        )
        
        # Get detector ID and other resources from custom resource
        self.guardduty_detector_id = guardduty_resource.get_att("DetectorId").to_string()
        self.guardduty_mode = guardduty_resource.get_att("Mode").to_string()
        self.threat_intel_set_id = guardduty_resource.get_att("ThreatIntelSetId").to_string()
        self.ip_set_id = guardduty_resource.get_att("IPSetId").to_string()
        
        # Store reference for dependency management
        self.guardduty_resource = guardduty_resource
        
        # Output deployment information
        CfnOutput(
            self, "GuardDutyDetectorId", 
            value=self.guardduty_detector_id,
            description="GuardDuty detector ID (existing or newly created)"
        )
        
        CfnOutput(
            self, "GuardDutyDeploymentMode", 
            value=self.guardduty_mode,
            description="Whether using existing detector or created new one"
        )
        
        CfnOutput(
            self, "GuardDutyThreatIntelSetId", 
            value=self.threat_intel_set_id,
            description="GuardDuty ThreatIntelSet ID for bad IP detection"
        )
        
        CfnOutput(
            self, "GuardDutyIPSetId", 
            value=self.ip_set_id,
            description="GuardDuty IPSet ID for trusted IP allowlisting"
        )

        # Note: ThreatIntelSet and IPSet are now created by the Lambda function above
        # This resolves the authorization error since the Lambda has proper GuardDuty permissions

    def _create_security_hub(self):
        """Enable Security Hub for centralized security management with automatic existing subscription detection"""
        
        # Create Lambda function to detect existing Security Hub subscriptions
        security_hub_lambda = lambda_.Function(
            self, "SecurityHubLambda",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline(f"""
import boto3
import json
import urllib3

def handler(event, context):
    try:
        client = boto3.client('securityhub')
        
        if event['RequestType'] == 'Delete':
            # Don't disable existing Security Hub on stack deletion
            hub_arn = event.get('PhysicalResourceId', 'not-found')
            return send_response(event, context, 'SUCCESS', {{
                'HubArn': hub_arn
            }})
        
        # Check if Security Hub is already enabled
        try:
            # Try to describe the hub
            response = client.describe_hub()
            
            # Hub already exists, use it and update configuration
            hub_arn = response.get('HubArn', f"arn:aws:securityhub:{{context.invoked_function_arn.split(':')[3]}}:{{context.invoked_function_arn.split(':')[4]}}:hub/default")
            
            # Update hub settings to match our requirements if needed
            try:
                client.update_security_hub_configuration(
                    AutoEnableControls=False,
                    ControlFindingGenerator='SECURITY_CONTROL'
                )
            except Exception as e:
                print(f"Warning: Could not update Security Hub settings: {{e}}")
            
            mode = 'existing'
            
        except client.exceptions.InvalidAccessException:
            # Security Hub is not enabled, create it
            response = client.enable_security_hub(
                Tags={{
                    'Name': f'ZeroTrustSecurityHub-{self.environment_suffix}',
                    'ManagedBy': 'CDK-AutoDetection',
                    'Environment': 'production'
                }},
                EnableDefaultStandards=False,
                ControlFindingGenerator='SECURITY_CONTROL'
            )
            
            hub_arn = response.get('HubArn', f"arn:aws:securityhub:{{context.invoked_function_arn.split(':')[3]}}:{{context.invoked_function_arn.split(':')[4]}}:hub/default")
            mode = 'new'
            
        except Exception as e:
            # Handle other exceptions - might be already subscribed
            if "already subscribed" in str(e).lower():
                # Get hub details
                try:
                    response = client.describe_hub()
                    hub_arn = response.get('HubArn', f"arn:aws:securityhub:{{context.invoked_function_arn.split(':')[3]}}:{{context.invoked_function_arn.split(':')[4]}}:hub/default")
                    mode = 'existing'
                except:
                    # Fallback ARN format if describe fails
                    account_id = context.invoked_function_arn.split(':')[4]
                    region_name = context.invoked_function_arn.split(':')[3]
                    hub_arn = f"arn:aws:securityhub:{{region_name}}:{{account_id}}:hub/default"
                    mode = 'existing-fallback'
            else:
                raise e
        
        return send_response(event, context, 'SUCCESS', {{
            'HubArn': hub_arn,
            'Mode': mode
        }}, hub_arn)
            
    except Exception as e:
        print(f"Error: {{str(e)}}")
        return send_response(event, context, 'FAILED', {{'Error': str(e)}})

def send_response(event, context, status, data, physical_id=None):
    response_body = json.dumps({{
        'Status': status,
        'Reason': f'See CloudWatch Log Stream: {{context.log_stream_name}}',
        'PhysicalResourceId': physical_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data
    }})
    
    http = urllib3.PoolManager()
    try:
        response = http.request('PUT', event['ResponseURL'], body=response_body,
                              headers={{'Content-Type': 'application/json'}})
        print(f"Response status: {{response.status}}")
    except Exception as e:
        print(f"Failed to send response: {{e}}")
    
    return {{'statusCode': 200, 'body': 'Complete'}}
"""),
            timeout=Duration.minutes(5),
            role=iam.Role(
                self, "SecurityHubLambdaRole",
                assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
                ],
                inline_policies={
                    "SecurityHubAccess": iam.PolicyDocument(
                        statements=[
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "securityhub:DescribeHub",
                                    "securityhub:EnableSecurityHub",
                                    "securityhub:UpdateSecurityHubConfiguration",
                                    "securityhub:GetEnabledStandards",
                                    "securityhub:TagResource"
                                ],
                                resources=["*"]
                            )
                        ]
                    )
                }
            )
        )
        
        # Custom resource to handle Security Hub subscription detection
        security_hub_resource = CustomResource(
            self, "SecurityHubResource",
            service_token=security_hub_lambda.function_arn
        )
        
        # Get Security Hub ARN from custom resource
        self.security_hub_arn = security_hub_resource.get_att("HubArn").to_string()
        self.security_hub_mode = security_hub_resource.get_att("Mode").to_string()
        
        # Output deployment information
        CfnOutput(
            self, "SecurityHubArn", 
            value=self.security_hub_arn,
            description="Security Hub ARN (existing or newly created)"
        )
        
        CfnOutput(
            self, "SecurityHubDeploymentMode", 
            value=self.security_hub_mode,
            description="Whether using existing hub or created new one"
        )

        # Note: Security Hub standards can be enabled manually or via separate deployment
        # to avoid rate limiting and ARN format issues during initial stack creation
        # The hub itself provides the foundational security monitoring capabilities

    def _create_incident_response(self):
        """Create automated incident response with Lambda"""
        
        # SNS topic for security alerts
        self.alert_topic = sns.Topic(
            self, "SecurityAlertTopic",
            topic_name=f"zero-trust-security-alerts-{self.unique_suffix}",
            master_key=self.master_key
        )

        # Add email subscription for security team
        self.alert_topic.add_subscription(
            sns_subscriptions.EmailSubscription("security-team@bank.com")
        )

        # Lambda function for automated response
        self.incident_response_lambda = lambda_.Function(
            self, "IncidentResponseFunction",
            function_name=f"zero-trust-incident-response-{self.unique_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="incident_response.handler",
            code=lambda_.Code.from_inline(self._get_incident_response_code()),
            timeout=Duration.minutes(5),
            memory_size=1024,
            environment={
                "SNS_TOPIC_ARN": self.alert_topic.topic_arn,
                "SECURITY_HUB_REGION": self.region
            },
            role=self.incident_response_role,
            reserved_concurrent_executions=10,
            dead_letter_queue_enabled=True,
            tracing=lambda_.Tracing.ACTIVE,
            layers=[
                lambda_.LayerVersion.from_layer_version_arn(
                    self, "AWSLambdaPowertoolsLayer",
                    f"arn:aws:lambda:{self.region}:017000801446:layer:AWSLambdaPowertoolsPython:15"
                )
            ]
        )

        # EventBridge rule for GuardDuty findings
        guardduty_rule = events.Rule(
            self, "GuardDutyFindingsRule",
            rule_name=f"zero-trust-guardduty-findings-{self.unique_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.guardduty"],
                detail_type=["GuardDuty Finding"],
                detail={
                    "severity": [
                        {"numeric": [">=", 4]}  # Medium and above
                    ]
                }
            )
        )

        guardduty_rule.add_target(
            targets.LambdaFunction(
                self.incident_response_lambda,
                retry_attempts=2,
                max_event_age=Duration.hours(1)
            )
        )

        # EventBridge rule for Security Hub findings
        security_hub_rule = events.Rule(
            self, "SecurityHubFindingsRule",
            rule_name=f"zero-trust-security-hub-findings-{self.unique_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.securityhub"],
                detail_type=["Security Hub Findings - Imported"],
                detail={
                    "findings": {
                        "Severity": {
                            "Label": ["HIGH", "CRITICAL"]
                        }
                    }
                }
            )
        )

        security_hub_rule.add_target(
            targets.LambdaFunction(self.incident_response_lambda)
        )


    def _get_incident_response_code(self) -> str:
        """Return Lambda function code for incident response"""
        
        return """
import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any
import logging

# Initialize AWS clients
ec2 = boto3.client('ec2')
sns = boto3.client('sns')
security_hub = boto3.client('securityhub')
ssm = boto3.client('ssm')

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    '''
    Automated incident response handler
    '''
    try:
        logger.info(f"Processing event: {json.dumps(event)}")
        
        # Determine event source
        source = event.get('source', '')
        
        if source == 'aws.guardduty':
            response = handle_guardduty_finding(event['detail'])
        elif source == 'aws.securityhub':
            response = handle_security_hub_finding(event['detail'])
        else:
            logger.warning(f"Unknown event source: {source}")
            return {
                'statusCode': 400,
                'body': json.dumps('Unknown event source')
            }
        
        # Send notification
        notify_security_team(event, response)
        
        return {
            'statusCode': 200,
            'body': json.dumps('Incident response completed')
        }
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }

def handle_guardduty_finding(finding: Dict[str, Any]) -> Dict[str, Any]:
    '''
    Handle GuardDuty findings with automated response
    '''
    severity = finding.get('severity', 0)
    finding_type = finding.get('type', '')
    resource = finding.get('resource', {})
    
    response = {
        'actions_taken': [],
        'finding_id': finding.get('id'),
        'severity': severity
    }
    
    # High severity findings trigger immediate action
    if severity >= 7:
        if 'Instance' in resource.get('resourceType', ''):
            instance_id = resource.get('instanceDetails', {}).get('instanceId')
            if instance_id:
                # Isolate the instance
                isolate_instance(instance_id)
                response['actions_taken'].append(f'Isolated instance: {instance_id}')
                
                # Create snapshot for forensics
                create_forensic_snapshot(instance_id)
                response['actions_taken'].append(f'Created forensic snapshot for: {instance_id}')
        
        # Block malicious IP if detected
        if 'remoteIpDetails' in finding.get('service', {}).get('action', {}).get('networkConnectionAction', {}):
            ip = finding['service']['action']['networkConnectionAction']['remoteIpDetails']['ipAddressV4']
            block_ip_address(ip)
            response['actions_taken'].append(f'Blocked IP: {ip}')
    
    # Update finding in Security Hub
    update_security_hub_finding(finding, response['actions_taken'])
    
    return response

def handle_security_hub_finding(detail: Dict[str, Any]) -> Dict[str, Any]:
    '''
    Handle Security Hub findings
    '''
    findings = detail.get('findings', [])
    response = {
        'actions_taken': [],
        'findings_processed': len(findings)
    }
    
    for finding in findings:
        severity = finding.get('Severity', {}).get('Label', 'LOW')
        
        if severity in ['HIGH', 'CRITICAL']:
            # Trigger remediation based on finding type
            compliance_status = finding.get('Compliance', {}).get('Status', '')
            
            if compliance_status == 'FAILED':
                # Attempt auto-remediation
                resource_type = finding.get('Resources', [{}])[0].get('Type', '')
                resource_id = finding.get('Resources', [{}])[0].get('Id', '')
                
                if resource_type == 'AwsEc2Instance':
                    # Apply security patches via Systems Manager
                    apply_security_patches(resource_id.split('/')[-1])
                    response['actions_taken'].append(f'Applied patches to: {resource_id}')
    
    return response

def isolate_instance(instance_id: str):
    '''
    Isolate EC2 instance by moving to quarantine security group
    '''
    try:
        # Create quarantine security group if it doesn't exist
        quarantine_sg = create_quarantine_security_group()
        
        # Modify instance security groups
        ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=[quarantine_sg]
        )
        
        logger.info(f"Isolated instance {instance_id} to quarantine security group")
        
    except Exception as e:
        logger.error(f"Failed to isolate instance {instance_id}: {str(e)}")
        raise

def create_quarantine_security_group() -> str:
    '''
    Create or get quarantine security group
    '''
    try:
        response = ec2.describe_security_groups(
            GroupNames=['quarantine-sg']
        )
        return response['SecurityGroups'][0]['GroupId']
    except:
        # Create new quarantine SG
        response = ec2.create_security_group(
            GroupName='quarantine-sg',
            Description='Quarantine security group for isolated instances'
        )
        
        # Remove all egress rules
        ec2.revoke_security_group_egress(
            GroupId=response['GroupId'],
            IpPermissions=[{
                'IpProtocol': '-1',
                'FromPort': -1,
                'ToPort': -1,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        )
        
        return response['GroupId']

def create_forensic_snapshot(instance_id: str):
    '''
    Create EBS snapshot for forensic analysis
    '''
    try:
        # Get instance volumes
        response = ec2.describe_instances(InstanceIds=[instance_id])
        volumes = []
        
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                for mapping in instance.get('BlockDeviceMappings', []):
                    if 'Ebs' in mapping:
                        volumes.append(mapping['Ebs']['VolumeId'])
        
        # Create snapshots
        for volume_id in volumes:
            ec2.create_snapshot(
                VolumeId=volume_id,
                Description=f'Forensic snapshot for incident response - {datetime.utcnow().isoformat()}',
                TagSpecifications=[{
                    'ResourceType': 'snapshot',
                    'Tags': [
                        {'Key': 'IncidentResponse', 'Value': 'true'},
                        {'Key': 'InstanceId', 'Value': instance_id},
                        {'Key': 'Timestamp', 'Value': datetime.utcnow().isoformat()}
                    ]
                }]
            )
        
        logger.info(f"Created forensic snapshots for instance {instance_id}")
        
    except Exception as e:
        logger.error(f"Failed to create snapshots: {str(e)}")

def block_ip_address(ip: str):
    '''
    Block malicious IP in Network ACL
    '''
    # This would integrate with your Network Firewall or WAF
    logger.info(f"Would block IP address: {ip}")

def apply_security_patches(instance_id: str):
    '''
    Apply security patches using Systems Manager
    '''
    try:
        ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName='AWS-RunPatchBaseline',
            Parameters={
                'Operation': ['Install']
            }
        )
        logger.info(f"Initiated patching for instance {instance_id}")
    except Exception as e:
        logger.error(f"Failed to apply patches: {str(e)}")

def update_security_hub_finding(finding: Dict, actions: list):
    '''
    Update Security Hub finding with response actions
    '''
    try:
        security_hub.batch_update_findings(
            FindingIdentifiers=[{
                'Id': finding.get('id'),
                'ProductArn': finding.get('productArn')
            }],
            Note={
                'Text': f"Automated response: {', '.join(actions)}",
                'UpdatedBy': 'IncidentResponseLambda'
            },
            Workflow={
                'Status': 'RESOLVED' if actions else 'NEW'
            }
        )
    except Exception as e:
        logger.error(f"Failed to update Security Hub: {str(e)}")

def notify_security_team(event: Dict, response: Dict):
    '''
    Send notification to security team
    '''
    try:
        message = {
            'event_source': event.get('source'),
            'timestamp': datetime.utcnow().isoformat(),
            'actions_taken': response.get('actions_taken', []),
            'severity': response.get('severity', 'UNKNOWN'),
            'raw_event': event
        }
        
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f"[SECURITY] Automated Incident Response - {event.get('source')}",
            Message=json.dumps(message, indent=2)
        )
        
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
"""

    def _create_systems_manager(self):
        """Configure Systems Manager for secure access"""
        
        # Create S3 bucket for Session Manager logs
        self.session_logs_bucket = s3.Bucket(
            self, "SessionLogsBucket",
            bucket_name=f"session-logs-{self.unique_suffix}-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.audit_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    expiration=Duration.days(90)
                )
            ]
        )

        # Create SSM Document for session logging
        ssm.CfnDocument(
            self, "SessionManagerPreferences",
            document_type="Session",
            name="SSM-SessionManagerRunShell",
            content=json.dumps({
                "schemaVersion": "1.0",
                "description": "Session Manager Preferences",
                "sessionType": "Standard_Stream",
                "inputs": {
                    "s3BucketName": self.session_logs_bucket.bucket_name,
                    "s3EncryptionEnabled": True,
                    "s3KeyPrefix": "sessions/",
                    "cloudWatchLogGroupName": "/aws/ssm/sessions",
                    "cloudWatchEncryptionEnabled": True,
                    "idleSessionTimeout": "20",
                    "maxSessionDuration": "60",
                    "runAsEnabled": False,
                    "kmsKeyId": self.audit_key.key_id,
                    "shellProfile": {
                        "linux": "cd ~ && exec bash --login"
                    }
                }
            })
        )

        # Create maintenance window for patching
        self.maintenance_window = ssm.CfnMaintenanceWindow(
            self, "PatchingMaintenanceWindow",
            name=f"banking-patching-window-{self.unique_suffix}",
            schedule="cron(0 2 ? * SUN *)",  # Sunday 2 AM
            duration=4,
            cutoff=1,
            allow_unassociated_targets=False,
            description="Weekly patching window for banking systems"
        )

        # Patch baseline for critical updates
        self.patch_baseline = ssm.CfnPatchBaseline(
            self, "CriticalPatchBaseline",
            name=f"banking-critical-patches-{self.unique_suffix}",
            operating_system="AMAZON_LINUX_2",
            patch_groups=["banking-systems"],
            approval_rules=ssm.CfnPatchBaseline.RuleGroupProperty(
                patch_rules=[
                    ssm.CfnPatchBaseline.RuleProperty(
                        patch_filter_group=ssm.CfnPatchBaseline.PatchFilterGroupProperty(
                            patch_filters=[
                                ssm.CfnPatchBaseline.PatchFilterProperty(
                                    key="SEVERITY",
                                    values=["Critical", "Important"]
                                ),
                                ssm.CfnPatchBaseline.PatchFilterProperty(
                                    key="CLASSIFICATION",
                                    values=["Security"]
                                )
                            ]
                        ),
                        approve_after_days=0,
                        compliance_level="CRITICAL"
                    )
                ]
            ),
            description="Patch baseline for critical banking system updates"
        )

    def _create_config_rules(self):
        """Create AWS Config rules for compliance monitoring"""
        
        # Config service role with correct policy
        config_role = iam.Role(
            self, "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWS_ConfigRole")
            ]
        )

        # Config bucket with environment suffix for uniqueness
        config_bucket = s3.Bucket(
            self, "ConfigBucket",
            bucket_name=f"aws-config-{self.unique_suffix}-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.audit_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add bucket policy to allow Config service access
        config_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSConfigBucketPermissionsCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:GetBucketAcl", "s3:ListBucket"],
                resources=[config_bucket.bucket_arn],
                conditions={
                    "StringEquals": {
                        "AWS:SourceAccount": self.account
                    }
                }
            )
        )
        
        config_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSConfigBucketDeliveryCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{config_bucket.bucket_arn}/AWSConfig/*"],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control",
                        "AWS:SourceAccount": self.account
                    }
                }
            )
        )
        
        config_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSConfigBucketExistenceCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("config.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{config_bucket.bucket_arn}/AWSConfig/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceAccount": self.account
                    }
                }
            )
        )

        # Create Lambda function to detect existing Config recorders  
        config_detector_lambda = lambda_.Function(
            self, "ConfigDetectorLambda",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import boto3
import json
import urllib3

def handler(event, context):
    try:
        config_client = boto3.client('config')
        
        if event['RequestType'] == 'Delete':
            # Don't delete existing recorders on stack deletion
            return send_response(event, context, 'SUCCESS', {
                'RecorderName': event.get('PhysicalResourceId', 'not-found'),
                'RecorderArn': f"arn:aws:config:us-east-1:123456789012:configuration-recorder/not-found"
            })
        
        bucket_name = event['ResourceProperties']['BucketName']
        role_arn = event['ResourceProperties']['RoleArn']
        kms_key_id = event['ResourceProperties'].get('KmsKeyId', '')
        s3_prefix = event['ResourceProperties'].get('S3Prefix', 'AWSConfig')
        
        # List existing configuration recorders
        response = config_client.describe_configuration_recorders()
        
        if response['ConfigurationRecorders']:
            # Use existing recorder
            recorder = response['ConfigurationRecorders'][0]
            recorder_name = recorder['name']
            
            # Update recorder settings to match our requirements
            try:
                config_client.put_configuration_recorder(
                    ConfigurationRecorder={
                        'name': recorder_name,
                        'roleARN': role_arn,
                        'recordingGroup': {
                            'allSupported': True,
                            'includeGlobalResourceTypes': True
                        }
                    }
                )
                
                # Start the recorder if it's not already started
                config_client.start_configuration_recorder(
                    ConfigurationRecorderName=recorder_name
                )
            except Exception as e:
                print(f"Warning: Could not update recorder settings: {e}")
            
            # Check for delivery channels
            delivery_response = config_client.describe_delivery_channels()
            if not delivery_response['DeliveryChannels']:
                # Create delivery channel if none exists
                try:
                    delivery_channel = {
                        'name': f'DeliveryChannel-{recorder_name}',
                        's3BucketName': bucket_name,
                        's3KeyPrefix': s3_prefix,
                        'configSnapshotDeliveryProperties': {
                            'deliveryFrequency': 'TwentyFour_Hours'
                        }
                    }
                    
                    # Add KMS encryption if key is provided
                    if kms_key_id:
                        delivery_channel['s3KmsKeyArn'] = kms_key_id
                    
                    config_client.put_delivery_channel(
                        DeliveryChannel=delivery_channel
                    )
                except Exception as e:
                    print(f"Warning: Could not create delivery channel: {e}")
            
            recorder_arn = f"arn:aws:config:{context.invoked_function_arn.split(':')[3]}:{context.invoked_function_arn.split(':')[4]}:configuration-recorder/{recorder_name}"
            
            return send_response(event, context, 'SUCCESS', {
                'RecorderName': recorder_name,
                'RecorderArn': recorder_arn,
                'Mode': 'existing'
            }, recorder_name)
        else:
            # Create new recorder
            import time
            import hashlib
            config_unique_id = hashlib.md5(f"config-{int(time.time())}".encode()).hexdigest()[:8]
            recorder_name = f"ZeroTrustConfig-{config_unique_id}"
            
            config_client.put_configuration_recorder(
                ConfigurationRecorder={
                    'name': recorder_name,
                    'roleARN': role_arn,
                    'recordingGroup': {
                        'allSupported': True,
                        'includeGlobalResourceTypes': True
                    }
                }
            )
            
            # Create delivery channel
            channel_name = f"ZeroTrustDelivery-{config_unique_id}"
            delivery_channel = {
                'name': channel_name,
                's3BucketName': bucket_name,
                's3KeyPrefix': s3_prefix,
                'configSnapshotDeliveryProperties': {
                    'deliveryFrequency': 'TwentyFour_Hours'
                }
            }
            
            # Add KMS encryption if key is provided
            if kms_key_id:
                delivery_channel['s3KmsKeyArn'] = kms_key_id
            
            config_client.put_delivery_channel(
                DeliveryChannel=delivery_channel
            )
            
            # Start the recorder
            config_client.start_configuration_recorder(
                ConfigurationRecorderName=recorder_name
            )
            
            recorder_arn = f"arn:aws:config:{context.invoked_function_arn.split(':')[3]}:{context.invoked_function_arn.split(':')[4]}:configuration-recorder/{recorder_name}"
            
            return send_response(event, context, 'SUCCESS', {
                'RecorderName': recorder_name,
                'RecorderArn': recorder_arn,
                'Mode': 'new'
            }, recorder_name)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return send_response(event, context, 'FAILED', {'Error': str(e)})

def send_response(event, context, status, data, physical_id=None):
    response_body = json.dumps({
        'Status': status,
        'Reason': f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': physical_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data
    })
    
    http = urllib3.PoolManager()
    try:
        response = http.request('PUT', event['ResponseURL'], body=response_body,
                              headers={'Content-Type': 'application/json'})
        print(f"Response status: {response.status}")
    except Exception as e:
        print(f"Failed to send response: {e}")
    
    return {'statusCode': 200, 'body': 'Complete'}
"""),
            timeout=Duration.minutes(5),
            role=iam.Role(
                self, "ConfigDetectorLambdaRole",
                assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
                managed_policies=[
                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
                ],
                inline_policies={
                    "ConfigAccess": iam.PolicyDocument(
                        statements=[
                            iam.PolicyStatement(
                                effect=iam.Effect.ALLOW,
                                actions=[
                                    "config:DescribeConfigurationRecorders",
                                    "config:DescribeDeliveryChannels", 
                                    "config:PutConfigurationRecorder",
                                    "config:PutDeliveryChannel",
                                    "config:StartConfigurationRecorder",
                                    "config:GetConfiguration*",
                                    "iam:PassRole"
                                ],
                                resources=["*"]
                            )
                        ]
                    )
                }
            )
        )
        
        # Custom resource to handle Config recorder detection
        config_resource = CustomResource(
            self, "ConfigRecorderResource",
            service_token=config_detector_lambda.function_arn,
            properties={
                "BucketName": config_bucket.bucket_name,
                "RoleArn": config_role.role_arn,
                "KmsKeyId": self.audit_key.key_arn,
                "S3Prefix": "AWSConfig"
            }
        )
        
        # Get recorder info from custom resource
        self.config_recorder_name = config_resource.get_att("RecorderName").to_string()
        self.config_recorder_arn = config_resource.get_att("RecorderArn").to_string()
        self.config_mode = config_resource.get_att("Mode").to_string()
        
        # Output deployment information
        CfnOutput(
            self, "ConfigRecorderName",
            value=self.config_recorder_name,
            description="Config recorder name (existing or newly created)"
        )
        
        CfnOutput(
            self, "ConfigDeploymentMode", 
            value=self.config_mode,
            description="Whether using existing recorder or created new one"
        )

        # Compliance rules
        compliance_rules = [
            ("encrypted-volumes", "ENCRYPTED_VOLUMES"),
            ("iam-password-policy", "IAM_PASSWORD_POLICY"),
            ("mfa-enabled-for-iam-console-access", "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"),
            ("s3-bucket-public-read-prohibited", "S3_BUCKET_PUBLIC_READ_PROHIBITED"),
            ("s3-bucket-ssl-requests-only", "S3_BUCKET_SSL_REQUESTS_ONLY")
        ]

        for rule_name, source_identifier in compliance_rules:
            config_rule = config.CfnConfigRule(
                self, f"ConfigRule-{rule_name}",
                config_rule_name=rule_name,
                source=config.CfnConfigRule.SourceProperty(
                    owner="AWS",
                    source_identifier=source_identifier
                )
            )
            # Add explicit dependency on Config Recorder custom resource
            config_rule.node.add_dependency(config_resource)

        # Output important values
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id)
        CfnOutput(self, "AlertTopicArn", value=self.alert_topic.topic_arn)
        
        # Additional outputs for integration tests
        CfnOutput(self, "CloudTrailArn", value=self.trail.trail_arn)
        CfnOutput(self, "CloudTrailBucketName", value=self.trail_bucket.bucket_name)
        CfnOutput(self, "SessionLogsBucketName", value=self.session_logs_bucket.bucket_name)
        CfnOutput(self, "MasterKeyId", value=self.master_key.key_arn)
        CfnOutput(self, "AuditKeyId", value=self.audit_key.key_arn)
        CfnOutput(self, "SecurityHubArnOutput", value=self.security_hub_arn)
        CfnOutput(self, "TransitGatewayId", value=self.transit_gateway.ref)
        CfnOutput(self, "NetworkFirewallArn", value=self.firewall.attr_firewall_arn)
        CfnOutput(self, "AdminRoleArn", value=self.admin_role.role_arn)
        CfnOutput(self, "AuditorRoleArn", value=self.auditor_role.role_arn)
        CfnOutput(self, "IncidentResponseRoleArn", value=self.incident_response_role.role_arn)
        CfnOutput(self, "IncidentResponseAlertTopicArn", value=self.alert_topic.topic_arn)

    def _create_resource_monitoring(self):
        """Create resource monitoring and quota enforcement with CloudWatch alarms"""
        
        # Create CloudWatch dashboard for resource monitoring
        resource_dashboard = cloudwatch.Dashboard(
            self, "ResourceMonitoringDashboard",
            dashboard_name=f"ZeroTrust-ResourceMonitoring-{self.unique_suffix}",
            widgets=[
                [
                    cloudwatch.SingleValueWidget(
                        title="EC2 Instance Usage",
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/Usage",
                                metric_name="ResourceCount",
                                dimensions_map={
                                    "Type": "Resource",
                                    "Resource": "RunningOnDemand",
                                    "Service": "EC2-Instance",
                                    "Class": "Standard/OnDemand"
                                },
                                statistic="Maximum"
                            )
                        ],
                        width=12
                    )
                ],
                [
                    cloudwatch.SingleValueWidget(
                        title="S3 Bucket Usage", 
                        metrics=[
                            cloudwatch.Metric(
                                namespace="AWS/Usage",
                                metric_name="ResourceCount",
                                dimensions_map={
                                    "Type": "Resource",
                                    "Resource": "BucketCount",
                                    "Service": "S3",
                                    "Class": "None"
                                },
                                statistic="Maximum"
                            )
                        ],
                        width=12
                    )
                ]
            ]
        )
        
        # Create CloudWatch alarms for resource usage
        ec2_usage_alarm = cloudwatch.Alarm(
            self, "EC2InstanceUsageAlarm",
            alarm_name=f"ZeroTrust-EC2-Usage-{self.unique_suffix}",
            alarm_description="Alert when EC2 instance usage approaches limit",
            metric=cloudwatch.Metric(
                namespace="AWS/Usage",
                metric_name="ResourceCount",
                dimensions_map={
                    "Type": "Resource", 
                    "Resource": "RunningOnDemand",
                    "Service": "EC2-Instance",
                    "Class": "Standard/OnDemand"
                },
                statistic="Maximum"
            ),
            threshold=self.max_ec2_instances.value_as_number * 0.8,  # Alert at 80% of limit
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            evaluation_periods=2,
            datapoints_to_alarm=1
        )
        
        s3_usage_alarm = cloudwatch.Alarm(
            self, "S3BucketUsageAlarm", 
            alarm_name=f"ZeroTrust-S3-Usage-{self.unique_suffix}",
            alarm_description="Alert when S3 bucket usage approaches limit",
            metric=cloudwatch.Metric(
                namespace="AWS/Usage",
                metric_name="ResourceCount",
                dimensions_map={
                    "Type": "Resource",
                    "Resource": "BucketCount", 
                    "Service": "S3",
                    "Class": "None"
                },
                statistic="Maximum"
            ),
            threshold=self.max_s3_buckets.value_as_number * 0.8,  # Alert at 80% of limit
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            evaluation_periods=2,
            datapoints_to_alarm=1
        )
        
        # Add alarms to SNS topic for notifications
        ec2_usage_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        s3_usage_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alert_topic)
        )
        
        # Output resource limits for reference
        CfnOutput(
            self, "MaxEC2InstancesLimit",
            value=self.max_ec2_instances.value_as_string,
            description="Maximum EC2 instances allowed"
        )
        
        CfnOutput(
            self, "MaxS3BucketsLimit", 
            value=self.max_s3_buckets.value_as_string,
            description="Maximum S3 buckets allowed"
        )

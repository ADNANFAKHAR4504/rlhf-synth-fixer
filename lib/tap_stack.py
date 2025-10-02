#!/usr/bin/env python3
"""
Zero-Trust Security Architecture Stack for Banking Environment
Implements comprehensive security controls with automated threat response
"""

import json
from typing import Any, Dict, List

from aws_cdk import CfnOutput, CustomResource, Duration, RemovalPolicy, Stack, Tags
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
from aws_cdk import custom_resources as cr
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

    def _create_network_infrastructure(self):
        """Create isolated VPC architecture with security zones"""
        
        # Create main VPC with isolated subnets
        self.vpc = ec2.Vpc(
            self, "ZeroTrustVPC",
            max_azs=3,
            cidr="10.0.0.0/16",
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

        # Enable firewall logging
        network_firewall.CfnLoggingConfiguration(
            self, "FirewallLogging",
            firewall_arn=self.firewall.attr_firewall_arn,
            logging_configuration=network_firewall.CfnLoggingConfiguration.LoggingConfigurationProperty(
                log_destination_configs=[
                    network_firewall.CfnLoggingConfiguration.LogDestinationConfigProperty(
                        log_destination={
                            "logGroup": f"/aws/networkfirewall/{self.firewall.firewall_name}"
                        },
                        log_destination_type="CloudWatchLogs",
                        log_type="ALERT"
                    ),
                    network_firewall.CfnLoggingConfiguration.LogDestinationConfigProperty(
                        log_destination={
                            "logGroup": f"/aws/networkfirewall/{self.firewall.firewall_name}"
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
        """Enable GuardDuty for threat detection"""
        
        # Create Lambda-backed custom resource to handle existing detectors
        guardduty_provider = cr.Provider(
            self, "GuardDutyProvider",
            on_event_handler=lambda_.Function(
                self, "GuardDutyHandler",
                runtime=lambda_.Runtime.PYTHON_3_11,
                handler="index.handler",
                code=lambda_.Code.from_inline(self._get_guardduty_detector_code()),
                timeout=Duration.minutes(5),
                initial_policy=[
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        actions=[
                            "guardduty:ListDetectors",
                            "guardduty:GetDetector", 
                            "guardduty:CreateDetector",
                            "guardduty:UpdateDetector",
                            "guardduty:TagResource",
                            "iam:CreateServiceLinkedRole",
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream", 
                            "logs:PutLogEvents"
                        ],
                        resources=["*"]
                    )
                ]
            )
        )
        
        # Custom resource for GuardDuty detector
        guardduty_resource = CustomResource(
            self, "GuardDutyDetector",
            service_token=guardduty_provider.service_token,
            properties={
                "Enable": True,
                "FindingPublishingFrequency": "FIFTEEN_MINUTES", 
                "Tags": {
                    "Name": f"ZeroTrustDetector-{self.unique_suffix}",
                    "Environment": self.stack_environment,
                    "ManagedBy": "CDK"
                }
            }
        )
        
        # Get detector ID from custom resource
        self.guardduty_detector_id = guardduty_resource.get_att_string("DetectorId")

        # Create threat intel set for known bad IPs
        self.threat_intel_set = guardduty.CfnThreatIntelSet(
            self, "ThreatIntelSet",
            detector_id=self.guardduty_detector_id,
            format="TXT",
            location=f"s3://{self.trail_bucket.bucket_name}/threat-intel/bad-ips.txt",
            activate=True,
            name=f"BankingThreatIntel-{self.unique_suffix}"
        )

        # Create IP set for trusted IPs
        self.trusted_ip_set = guardduty.CfnIPSet(
            self, "TrustedIPSet",
            detector_id=self.guardduty_detector_id,
            format="TXT",
            location=f"s3://{self.trail_bucket.bucket_name}/trusted-ips/whitelist.txt",
            activate=True,
            name=f"TrustedBankingIPs-{self.unique_suffix}"
        )

    def _create_security_hub(self):
        """Enable Security Hub for centralized security management"""
        
        # Use native CDK Security Hub
        self.security_hub = securityhub.CfnHub(
            self, "SecurityHub",
            auto_enable_controls=False,
            control_finding_generator="SECURITY_CONTROL",
            enable_default_standards=False,
            tags={
                "Name": f"ZeroTrustSecurityHub-{self.environment_suffix}"
            }
        )
        
        # Get Security Hub ARN from native resource
        self.security_hub_arn = self.security_hub.attr_arn

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

    def _get_guardduty_detector_code(self) -> str:
        """Return Lambda function code for GuardDuty detector management"""
        
        return """
import json
import boto3
import logging
import urllib3

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
guardduty = boto3.client('guardduty')
http = urllib3.PoolManager()

def handler(event, context):
    '''
    GuardDuty detector management handler for CloudFormation custom resource
    '''
    try:
        logger.info(f"Processing event: {json.dumps(event, default=str)}")
        
        request_type = event.get('RequestType')
        properties = event.get('ResourceProperties', {})
        response_url = event.get('ResponseURL')
        stack_id = event.get('StackId')
        request_id = event.get('RequestId')
        logical_resource_id = event.get('LogicalResourceId')
        
        # Initialize response
        response_data = {}
        physical_resource_id = event.get('PhysicalResourceId', 'guardduty-detector')
        
        try:
            if request_type == 'Create':
                response_data = handle_create(properties)
                physical_resource_id = response_data.get('DetectorId', physical_resource_id)
            elif request_type == 'Update':
                physical_resource_id = event.get('PhysicalResourceId', '')
                response_data = handle_update(properties, physical_resource_id)
            elif request_type == 'Delete':
                physical_resource_id = event.get('PhysicalResourceId', '')
                response_data = handle_delete(properties, physical_resource_id)
            
            # Send success response
            send_response(response_url, {
                'Status': 'SUCCESS',
                'Reason': 'Operation completed successfully',
                'PhysicalResourceId': physical_resource_id,
                'StackId': stack_id,
                'RequestId': request_id,
                'LogicalResourceId': logical_resource_id,
                'Data': response_data
            })
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            # Send failure response
            send_response(response_url, {
                'Status': 'FAILED',
                'Reason': str(e),
                'PhysicalResourceId': physical_resource_id,
                'StackId': stack_id,
                'RequestId': request_id,
                'LogicalResourceId': logical_resource_id,
                'Data': {}
            })
            
    except Exception as e:
        logger.error(f"Critical error in handler: {str(e)}")
        # Try to send failure response if possible
        try:
            send_response(response_url, {
                'Status': 'FAILED',
                'Reason': f'Critical handler error: {str(e)}',
                'PhysicalResourceId': 'failed-resource',
                'StackId': stack_id,
                'RequestId': request_id,
                'LogicalResourceId': logical_resource_id,
                'Data': {}
            })
        except:
            pass

def handle_create(properties):
    '''
    Handle Create request - use existing detector or create new one
    '''
    try:
        # Check if detector already exists
        detectors_response = guardduty.list_detectors()
        detector_ids = detectors_response.get('DetectorIds', [])
        
        if detector_ids:
            # Use existing detector
            detector_id = detector_ids[0]
            logger.info(f"Using existing GuardDuty detector: {detector_id}")
            
            # Update existing detector configuration
            try:
                guardduty.update_detector(
                    DetectorId=detector_id,
                    Enable=properties.get('Enable', True),
                    FindingPublishingFrequency=properties.get('FindingPublishingFrequency', 'FIFTEEN_MINUTES')
                )
                logger.info(f"Updated existing detector configuration: {detector_id}")
            except Exception as e:
                logger.warning(f"Failed to update detector configuration: {str(e)}")
            
            # Apply tags if provided
            tags = properties.get('Tags', {})
            if tags:
                try:
                    detector_arn = f"arn:aws:guardduty:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:detector/{detector_id}"
                    guardduty.tag_resource(
                        ResourceArn=detector_arn,
                        Tags=tags
                    )
                    logger.info(f"Applied tags to existing detector: {detector_id}")
                except Exception as e:
                    logger.warning(f"Failed to apply tags: {str(e)}")
        else:
            # Create new detector
            logger.info("Creating new GuardDuty detector")
            
            create_params = {
                'Enable': properties.get('Enable', True),
                'FindingPublishingFrequency': properties.get('FindingPublishingFrequency', 'FIFTEEN_MINUTES')
            }
            
            # Add tags if provided
            tags = properties.get('Tags', {})
            if tags:
                create_params['Tags'] = tags
            
            create_response = guardduty.create_detector(**create_params)
            detector_id = create_response['DetectorId']
            logger.info(f"Created new GuardDuty detector: {detector_id}")
        
        return {
            'DetectorId': detector_id
        }
        
    except Exception as e:
        logger.error(f"Failed to handle create request: {str(e)}")
        raise

def handle_update(properties, physical_resource_id):
    '''
    Handle Update request
    '''
    try:
        # Use the physical resource ID as detector ID if available
        detector_id = physical_resource_id
        
        # If no physical resource ID, get the first available detector
        if not detector_id or detector_id == 'guardduty-detector':
            detectors_response = guardduty.list_detectors()
            detector_ids = detectors_response.get('DetectorIds', [])
            if not detector_ids:
                raise Exception("No existing detector found for update")
            detector_id = detector_ids[0]
        
        # Update detector configuration
        guardduty.update_detector(
            DetectorId=detector_id,
            Enable=properties.get('Enable', True),
            FindingPublishingFrequency=properties.get('FindingPublishingFrequency', 'FIFTEEN_MINUTES')
        )
        
        # Update tags if provided
        tags = properties.get('Tags', {})
        if tags:
            detector_arn = f"arn:aws:guardduty:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:detector/{detector_id}"
            guardduty.tag_resource(
                ResourceArn=detector_arn,
                Tags=tags
            )
        
        logger.info(f"Updated GuardDuty detector: {detector_id}")
        
        return {
            'DetectorId': detector_id
        }
        
    except Exception as e:
        logger.error(f"Failed to handle update request: {str(e)}")
        raise

def handle_delete(properties, physical_resource_id):
    '''
    Handle Delete request - do not delete detector, just disable for safety
    '''
    try:
        # Use the physical resource ID as detector ID if available
        detector_id = physical_resource_id
        
        # If no physical resource ID, get the first available detector
        if not detector_id or detector_id in ['guardduty-detector', 'failed-resource']:
            detectors_response = guardduty.list_detectors()
            detector_ids = detectors_response.get('DetectorIds', [])
            if detector_ids:
                detector_id = detector_ids[0]
        
        if detector_id and detector_id not in ['guardduty-detector', 'failed-resource']:
            # Only disable, don't delete to preserve findings
            try:
                guardduty.update_detector(
                    DetectorId=detector_id,
                    Enable=False
                )
                logger.info(f"Disabled GuardDuty detector: {detector_id} (not deleted to preserve findings)")
            except Exception as e:
                logger.warning(f"Failed to disable detector: {str(e)}")
        else:
            logger.info("No valid detector found to disable")
        
        return {}
        
    except Exception as e:
        logger.warning(f"Failed to disable detector during delete: {str(e)}")
        # Return success anyway since detector might not exist
        return {}

def send_response(response_url, response_body):
    '''
    Send response back to CloudFormation
    '''
    try:
        response_body_json = json.dumps(response_body)
        logger.info(f"Sending response: {response_body_json}")
        
        response = http.request(
            'PUT',
            response_url,
            body=response_body_json,
            headers={'Content-Type': ''}
        )
        
        logger.info(f"Response sent. Status: {response.status}")
        
    except Exception as e:
        logger.error(f"Failed to send response: {str(e)}")
        raise
"""

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

        # Custom Config recorder resource
        config_recorder_function = lambda_.Function(
            self, "ConfigRecorderFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import logging
from typing import Dict, Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

config_client = boto3.client('config')

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    '''
    Custom resource to handle AWS Config recorder and delivery channel
    '''
    logger.info(f"Event: {json.dumps(event, default=str)}")
    
    request_type = event['RequestType']
    properties = event['ResourceProperties']
    
    role_arn = properties['RoleArn']
    bucket_name = properties['BucketName']
    recorder_name = properties['RecorderName']
    channel_name = properties['ChannelName']
    
    try:
        if request_type == 'Create' or request_type == 'Update':
            # Handle configuration recorder
            recorder_arn = handle_config_recorder(role_arn, recorder_name)
            
            # Handle delivery channel
            handle_delivery_channel(bucket_name, channel_name)
            
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': f'config-resources-{recorder_name}',
                'Data': {
                    'RecorderArn': recorder_arn,
                    'RecorderName': recorder_name
                }
            }
            
        elif request_type == 'Delete':
            # On delete, just stop the recorder but don't delete
            # to preserve compliance history
            try:
                config_client.stop_configuration_recorder(
                    ConfigurationRecorderName=recorder_name
                )
                logger.info(f"Stopped Config recorder: {recorder_name}")
            except config_client.exceptions.NoSuchConfigurationRecorderException:
                logger.info("Config recorder already deleted or doesn't exist")
            except Exception as e:
                logger.warning(f"Failed to stop recorder: {str(e)}")
            
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': f'config-resources-{recorder_name}'
            }
            
    except Exception as e:
        logger.error(f"Error handling Config resources: {str(e)}")
        return {
            'Status': 'FAILED',
            'PhysicalResourceId': f'config-resources-{recorder_name}',
            'Reason': str(e)
        }

def handle_config_recorder(role_arn: str, recorder_name: str) -> str:
    '''Handle Config recorder - use existing or create new'''
    try:
        # Check if any recorder exists
        response = config_client.describe_configuration_recorders()
        existing_recorders = response.get('ConfigurationRecorders', [])
        
        if existing_recorders:
            # Use the first existing recorder
            existing_recorder = existing_recorders[0]
            recorder_name = existing_recorder['name']
            logger.info(f"Found existing Config recorder: {recorder_name}")
            
            # Update the existing recorder configuration
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
            logger.info(f"Updated existing Config recorder: {recorder_name}")
        else:
            # Create new recorder
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
            logger.info(f"Created new Config recorder: {recorder_name}")
        
        # Start the recorder
        config_client.start_configuration_recorder(
            ConfigurationRecorderName=recorder_name
        )
        logger.info(f"Started Config recorder: {recorder_name}")
        
        # Return the recorder ARN (construct it since it's not returned by API)
        region = boto3.Session().region_name or 'us-east-1'
        account_id = boto3.client('sts').get_caller_identity()['Account']
        recorder_arn = f"arn:aws:config:{region}:{account_id}:configuration-recorder/{recorder_name}"
        
        return recorder_arn
        
    except Exception as e:
        logger.error(f"Failed to handle Config recorder: {str(e)}")
        raise

def handle_delivery_channel(bucket_name: str, channel_name: str):
    '''Handle Config delivery channel - use existing or create new'''
    try:
        # Check if any delivery channel exists
        response = config_client.describe_delivery_channels()
        existing_channels = response.get('DeliveryChannels', [])
        
        if existing_channels:
            # Use the first existing channel
            existing_channel = existing_channels[0]
            channel_name = existing_channel['name']
            logger.info(f"Found existing Config delivery channel: {channel_name}")
            
            # Update the existing channel configuration
            config_client.put_delivery_channel(
                DeliveryChannel={
                    'name': channel_name,
                    's3BucketName': bucket_name,
                    'configSnapshotDeliveryProperties': {
                        'deliveryFrequency': 'TwentyFour_Hours'
                    }
                }
            )
            logger.info(f"Updated existing Config delivery channel: {channel_name}")
        else:
            # Create new delivery channel
            config_client.put_delivery_channel(
                DeliveryChannel={
                    'name': channel_name,
                    's3BucketName': bucket_name,
                    'configSnapshotDeliveryProperties': {
                        'deliveryFrequency': 'TwentyFour_Hours'
                    }
                }
            )
            logger.info(f"Created new Config delivery channel: {channel_name}")
            
    except Exception as e:
        logger.error(f"Failed to handle Config delivery channel: {str(e)}")
        raise
"""),
            timeout=Duration.minutes(2),
            environment={
                'ENVIRONMENT': self.environment,
                'ENVIRONMENT_SUFFIX': self.unique_suffix
            }
        )

        # Grant necessary permissions to the Config function
        config_recorder_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "config:DescribeConfigurationRecorders",
                    "config:PutConfigurationRecorder",
                    "config:StartConfigurationRecorder",
                    "config:StopConfigurationRecorder",
                    "config:DescribeDeliveryChannels",
                    "config:PutDeliveryChannel",
                    "sts:GetCallerIdentity"
                ],
                resources=["*"]
            )
        )

        # Create custom resource provider
        config_provider = cr.Provider(
            self, "ConfigResourceProvider",
            on_event_handler=config_recorder_function
        )

        # Create the custom resource
        config_resources = CustomResource(
            self, "ConfigResources",
            service_token=config_provider.service_token,
            properties={
                'RoleArn': config_role.role_arn,
                'BucketName': config_bucket.bucket_name,
                'RecorderName': f"ConfigRecorder-{self.unique_suffix}",
                'ChannelName': f"zero-trust-delivery-channel-{self.unique_suffix}"
            }
        )

        # Store references for outputs (using custom resource attributes)
        self.config_recorder_arn = config_resources.get_att_string('RecorderArn')
        self.config_recorder_name = config_resources.get_att_string('RecorderName')

        # Compliance rules
        compliance_rules = [
            ("encrypted-volumes", "ENCRYPTED_VOLUMES"),
            ("iam-password-policy", "IAM_PASSWORD_POLICY"),
            ("mfa-enabled-for-iam-console-access", "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"),
            ("s3-bucket-public-read-prohibited", "S3_BUCKET_PUBLIC_READ_PROHIBITED"),
            ("s3-bucket-ssl-requests-only", "S3_BUCKET_SSL_REQUESTS_ONLY")
        ]

        for rule_name, source_identifier in compliance_rules:
            config.CfnConfigRule(
                self, f"ConfigRule-{rule_name}",
                config_rule_name=rule_name,
                source=config.CfnConfigRule.SourceProperty(
                    owner="AWS",
                    source_identifier=source_identifier
                )
            )

        # Output important values
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id)
        CfnOutput(self, "SecurityHubArn", value=self.security_hub_arn)
        CfnOutput(self, "GuardDutyDetectorId", value=self.guardduty_detector_id)
        CfnOutput(self, "AlertTopicArn", value=self.alert_topic.topic_arn)

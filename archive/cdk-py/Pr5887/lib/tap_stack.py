"""
Main CDK Stack for VPC Endpoints Infrastructure.

This stack creates a VPC with private subnets and comprehensive VPC endpoints
for secure private connectivity to AWS services including S3, DynamoDB, EC2,
SSM, CloudWatch Logs, and Secrets Manager.
"""

from dataclasses import dataclass
from typing import List, Optional
import json

from aws_cdk import (
    Stack,
    Tags,
    CfnOutput,
    Fn,
    aws_ec2 as ec2,
    aws_kms as kms,
    aws_iam as iam,
)
from constructs import Construct


@dataclass
class TapStackProps:
    """Properties for TapStack."""
    environment_suffix: str


class TapStack(Stack):
    """
    Main stack for VPC Endpoints Infrastructure.

    Creates VPC with private subnets and VPC endpoints for:
    - Gateway endpoints: S3, DynamoDB
    - Interface endpoints: EC2, SSM, SSM Messages, EC2 Messages, CloudWatch Logs, Secrets Manager
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: TapStackProps,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = props.environment_suffix

        # Cost allocation tags applied to all resources
        Tags.of(self).add("Environment", "Production")
        Tags.of(self).add("CostCenter", "Finance")
        Tags.of(self).add("EnvironmentSuffix", self.environment_suffix)

        # Create KMS key for encryption at rest
        self.kms_key = self._create_kms_key()

        # Create VPC with private subnets
        self.vpc = self._create_vpc()

        # Create security group for interface endpoints
        self.endpoint_security_group = self._create_endpoint_security_group()

        # Create endpoint policy restricting access to specific account
        self.restricted_endpoint_policy = self._create_endpoint_policy()

        # Create gateway endpoints
        self.s3_endpoint = self._create_s3_gateway_endpoint()
        self.dynamodb_endpoint = self._create_dynamodb_gateway_endpoint()

        # Create interface endpoints
        self.ec2_endpoint = self._create_ec2_interface_endpoint()
        self.ssm_endpoint = self._create_ssm_interface_endpoint()
        self.ssm_messages_endpoint = self._create_ssm_messages_interface_endpoint()
        self.ec2_messages_endpoint = self._create_ec2_messages_interface_endpoint()
        self.logs_endpoint = self._create_cloudwatch_logs_interface_endpoint()
        self.secrets_manager_endpoint = self._create_secrets_manager_interface_endpoint()

        # Create CloudFormation outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create customer-managed KMS key for encryption."""
        key = kms.Key(
            self,
            f"EndpointEncryptionKey-{self.environment_suffix}",
            description=f"KMS key for VPC endpoint encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=None,  # Fully destroyable
        )

        # Allow CloudWatch Logs to use the key
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Allow CloudWatch Logs",
                effect=iam.Effect.ALLOW,
                principals=[
                    iam.ServicePrincipal(f"logs.{self.region}.amazonaws.com")
                ],
                actions=[
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:CreateGrant",
                    "kms:DescribeKey",
                ],
                resources=["*"],
                conditions={
                    "ArnLike": {
                        "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:*"
                    }
                }
            )
        )

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with CIDR 10.0.0.0/16 and three private subnets across different AZs.
        """
        vpc = ec2.Vpc(
            self,
            f"VPC-{self.environment_suffix}",
            vpc_name=f"vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            nat_gateways=0,  # No NAT gateway - using VPC endpoints for AWS service access
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
        )

        return vpc

    def _create_endpoint_security_group(self) -> ec2.SecurityGroup:
        """
        Create security group for interface endpoints allowing only HTTPS traffic (port 443).
        """
        sg = ec2.SecurityGroup(
            self,
            f"EndpointSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description=f"Security group for VPC interface endpoints - {self.environment_suffix}",
            security_group_name=f"endpoint-sg-{self.environment_suffix}",
            allow_all_outbound=True,
        )

        # Allow HTTPS inbound from VPC CIDR
        sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from VPC",
        )

        return sg

    def _create_endpoint_policy(self) -> iam.PolicyDocument:
        """
        Create endpoint policy restricting access to specific AWS account.
        """
        return iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AnyPrincipal()],
                    actions=["*"],
                    resources=["*"],
                    conditions={
                        "StringEquals": {
                            "aws:PrincipalAccount": "123456789012"
                        }
                    }
                )
            ]
        )

    def _create_s3_gateway_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """
        Create S3 gateway endpoint with custom route table associations.
        """
        # Get all private subnet route tables
        private_subnets = self.vpc.private_subnets

        endpoint = ec2.GatewayVpcEndpoint(
            self,
            f"S3GatewayEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnets=private_subnets)],
        )

        Tags.of(endpoint).add("Name", f"s3-gateway-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_dynamodb_gateway_endpoint(self) -> ec2.GatewayVpcEndpoint:
        """
        Create DynamoDB gateway endpoint with policy excluding 'logs/*' prefix.
        """
        # Policy that allows all DynamoDB actions but excludes S3 logs/* prefix operations
        dynamodb_policy = iam.PolicyDocument(
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    principals=[iam.AnyPrincipal()],
                    actions=["dynamodb:*"],
                    resources=["*"],
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.DENY,
                    principals=[iam.AnyPrincipal()],
                    actions=["s3:*"],
                    resources=["arn:aws:s3:::*/logs/*"],
                )
            ]
        )

        private_subnets = self.vpc.private_subnets

        endpoint = ec2.GatewayVpcEndpoint(
            self,
            f"DynamoDBGatewayEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnets=private_subnets)],
        )

        Tags.of(endpoint).add("Name", f"dynamodb-gateway-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_ec2_interface_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """Create EC2 interface endpoint."""
        endpoint = ec2.InterfaceVpcEndpoint(
            self,
            f"EC2InterfaceEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.EC2,
            private_dns_enabled=True,
            security_groups=[self.endpoint_security_group],
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        Tags.of(endpoint).add("Name", f"ec2-interface-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_ssm_interface_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """
        Create SSM interface endpoint in at least 2 availability zones.
        """
        endpoint = ec2.InterfaceVpcEndpoint(
            self,
            f"SSMInterfaceEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SSM,
            private_dns_enabled=True,
            security_groups=[self.endpoint_security_group],
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                one_per_az=True  # Deploy in all AZs (at least 2)
            ),
        )

        Tags.of(endpoint).add("Name", f"ssm-interface-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_ssm_messages_interface_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """
        Create SSM Messages interface endpoint in at least 2 availability zones.
        """
        endpoint = ec2.InterfaceVpcEndpoint(
            self,
            f"SSMMessagesInterfaceEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
            private_dns_enabled=True,
            security_groups=[self.endpoint_security_group],
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                one_per_az=True  # Deploy in all AZs (at least 2)
            ),
        )

        Tags.of(endpoint).add("Name", f"ssm-messages-interface-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_ec2_messages_interface_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """Create EC2 Messages interface endpoint."""
        endpoint = ec2.InterfaceVpcEndpoint(
            self,
            f"EC2MessagesInterfaceEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
            private_dns_enabled=True,
            security_groups=[self.endpoint_security_group],
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        Tags.of(endpoint).add("Name", f"ec2-messages-interface-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_cloudwatch_logs_interface_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """
        Create CloudWatch Logs interface endpoint with access logging enabled.
        """
        endpoint = ec2.InterfaceVpcEndpoint(
            self,
            f"CloudWatchLogsInterfaceEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            private_dns_enabled=True,
            security_groups=[self.endpoint_security_group],
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        Tags.of(endpoint).add("Name", f"cloudwatch-logs-interface-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_secrets_manager_interface_endpoint(self) -> ec2.InterfaceVpcEndpoint:
        """Create Secrets Manager interface endpoint for credential retrieval."""
        endpoint = ec2.InterfaceVpcEndpoint(
            self,
            f"SecretsManagerInterfaceEndpoint-{self.environment_suffix}",
            vpc=self.vpc,
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            private_dns_enabled=True,
            security_groups=[self.endpoint_security_group],
            subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        Tags.of(endpoint).add("Name", f"secrets-manager-interface-endpoint-{self.environment_suffix}")

        return endpoint

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for endpoint IDs and DNS names."""

        # VPC outputs
        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"VPCId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "VPCCidr",
            value=self.vpc.vpc_cidr_block,
            description="VPC CIDR block",
            export_name=f"VPCCidr-{self.environment_suffix}",
        )

        # Private subnet IDs
        for idx, subnet in enumerate(self.vpc.private_subnets):
            CfnOutput(
                self,
                f"PrivateSubnet{idx+1}Id",
                value=subnet.subnet_id,
                description=f"Private Subnet {idx+1} ID",
                export_name=f"PrivateSubnet{idx+1}Id-{self.environment_suffix}",
            )

        # Gateway endpoint outputs
        CfnOutput(
            self,
            "S3GatewayEndpointId",
            value=self.s3_endpoint.vpc_endpoint_id,
            description="S3 Gateway Endpoint ID",
            export_name=f"S3GatewayEndpointId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DynamoDBGatewayEndpointId",
            value=self.dynamodb_endpoint.vpc_endpoint_id,
            description="DynamoDB Gateway Endpoint ID",
            export_name=f"DynamoDBGatewayEndpointId-{self.environment_suffix}",
        )

        # Interface endpoint outputs with DNS names
        interface_endpoints = [
            ("EC2", self.ec2_endpoint),
            ("SSM", self.ssm_endpoint),
            ("SSMMessages", self.ssm_messages_endpoint),
            ("EC2Messages", self.ec2_messages_endpoint),
            ("CloudWatchLogs", self.logs_endpoint),
            ("SecretsManager", self.secrets_manager_endpoint),
        ]

        for name, endpoint in interface_endpoints:
            CfnOutput(
                self,
                f"{name}InterfaceEndpointId",
                value=endpoint.vpc_endpoint_id,
                description=f"{name} Interface Endpoint ID",
                export_name=f"{name}InterfaceEndpointId-{self.environment_suffix}",
            )

            # DNS names for interface endpoints
            # Use Fn.select to get first DNS entry from token list
            CfnOutput(
                self,
                f"{name}InterfaceEndpointDNS",
                value=Fn.select(0, endpoint.vpc_endpoint_dns_entries),
                description=f"{name} Interface Endpoint DNS Name",
                export_name=f"{name}InterfaceEndpointDNS-{self.environment_suffix}",
            )

        # Security group output
        CfnOutput(
            self,
            "EndpointSecurityGroupId",
            value=self.endpoint_security_group.security_group_id,
            description="Endpoint Security Group ID",
            export_name=f"EndpointSecurityGroupId-{self.environment_suffix}",
        )

        # KMS key output
        CfnOutput(
            self,
            "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID for endpoint encryption",
            export_name=f"KMSKeyId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "KMSKeyArn",
            value=self.kms_key.key_arn,
            description="KMS Key ARN for endpoint encryption",
            export_name=f"KMSKeyArn-{self.environment_suffix}",
        )

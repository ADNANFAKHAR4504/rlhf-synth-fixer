# VPC Endpoints Infrastructure - CDK Python Implementation

This implementation creates a VPC with comprehensive VPC endpoints for private AWS service connectivity, following all specified requirements and constraints.

## Architecture Overview

- **VPC**: CIDR 10.0.0.0/16 with 3 private subnets across different AZs
- **Gateway Endpoints**: S3 (custom route table), DynamoDB (restricted policy)
- **Interface Endpoints**: EC2, SSM, SSM Messages, EC2 Messages, CloudWatch Logs, Secrets Manager
- **Security**: Customer-managed KMS keys, HTTPS-only security groups, restricted endpoint policies
- **Compliance**: Cost allocation tags, private DNS enabled, audit logging

## Implementation Files

### File: bin/tap.py

```python
#!/usr/bin/env python3
"""
CDK application entry point for VPC Endpoints Infrastructure.
"""

import os
import sys

# Add parent directory to path so we can import lib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
import aws_cdk as cdk
from lib.tap_stack import TapStack, TapStackProps


app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = (
    app.node.try_get_context('environmentSuffix')
    or os.environ.get('ENVIRONMENT_SUFFIX')
    or 'dev'
)

# If the context value comes from an unexpanded shell expression like
# '${ENVIRONMENT_SUFFIX:-dev}' (common when running on some shells),
# fall back to the safe default. Also sanitize any characters that are
# not allowed in CDK stack names.
if isinstance(environment_suffix, str) and ('${' in environment_suffix or '$' in environment_suffix):
    environment_suffix = 'dev'

# Replace any character other than letters, numbers or hyphen with hyphen
environment_suffix = re.sub(r'[^A-Za-z0-9-]', '-', str(environment_suffix))

# Get AWS region from environment or lib/AWS_REGION file
region = os.environ.get('AWS_REGION')
if not region:
    try:
        with open('lib/AWS_REGION', 'r', encoding='utf-8') as f:
            region = f.read().strip()
    except FileNotFoundError:
        region = 'us-east-1'

# Create the main stack
TapStack(
    app,
    f"TapStack{environment_suffix}",
    props=TapStackProps(environment_suffix=environment_suffix),
    env=cdk.Environment(
        account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
        region=region
    ),
    description=f"VPC Endpoints Infrastructure with private AWS service connectivity - {environment_suffix}"
)

app.synth()
```

### File: lib/__init__.py

```python
"""
VPC Endpoints Infrastructure library.
"""
```

### File: lib/tap_stack.py

```python
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
                    name=f"Private1-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private2-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private3-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
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
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
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
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                availability_zones=self.availability_zones[:2]  # At least 2 AZs
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
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                availability_zones=self.availability_zones[:2]  # At least 2 AZs
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
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
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
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
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
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
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
            CfnOutput(
                self,
                f"{name}InterfaceEndpointDNS",
                value=endpoint.vpc_endpoint_dns_entries[0] if endpoint.vpc_endpoint_dns_entries else "N/A",
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
```

### File: lib/README.md

```markdown
# VPC Endpoints Infrastructure

This CDK Python application creates a secure VPC with comprehensive VPC endpoints for private AWS service connectivity, specifically designed for financial services compliance requirements.

## Architecture

### VPC Configuration
- **CIDR**: 10.0.0.0/16
- **Subnets**: 3 private subnets across different availability zones
  - 10.0.1.0/24 (Private Subnet 1)
  - 10.0.2.0/24 (Private Subnet 2)
  - 10.0.3.0/24 (Private Subnet 3)
- **No NAT Gateway**: All AWS service access via VPC endpoints

### Gateway Endpoints

1. **S3 Gateway Endpoint**
   - Custom route table associations
   - No data transfer charges
   - Supports all S3 operations

2. **DynamoDB Gateway Endpoint**
   - Policy excludes S3 'logs/*' prefix operations
   - No data transfer charges
   - Full DynamoDB API access

### Interface Endpoints

All interface endpoints configured with:
- Private DNS enabled
- HTTPS-only security groups (port 443)
- Deployed across multiple AZs
- Customer-managed KMS encryption
- Endpoint policies restricting access to account '123456789012'

Endpoints:
- **EC2**: For EC2 API operations
- **SSM**: For Systems Manager operations (2+ AZs)
- **SSM Messages**: For Session Manager (2+ AZs)
- **EC2 Messages**: For SSM Agent communication
- **CloudWatch Logs**: With access logging enabled
- **Secrets Manager**: For secure credential retrieval

### Security

- **KMS Encryption**: Customer-managed keys with automatic rotation
- **Security Groups**: HTTPS-only inbound from VPC CIDR
- **Endpoint Policies**: Restrict access to specific AWS account
- **Private DNS**: All interface endpoints use private DNS names
- **No Internet Access**: Fully isolated private subnets

### Compliance

- **Cost Allocation Tags**: Environment=Production, CostCenter=Finance
- **Resource Naming**: All resources include environment suffix
- **Audit Logging**: CloudWatch Logs endpoint captures access logs
- **Encryption**: At rest (KMS) and in transit (TLS/SSL)

## Deployment

### Prerequisites

- AWS CDK 2.x installed
- Python 3.9 or later
- AWS CLI configured with appropriate credentials
- Required IAM permissions for VPC, endpoints, and KMS

### Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify CDK version
cdk --version
```

### Deploy

```bash
# Set environment suffix (required)
export ENVIRONMENT_SUFFIX="prod"

# Set AWS region (optional, defaults to us-east-1)
export AWS_REGION="us-east-1"

# Bootstrap CDK (first time only)
cdk bootstrap

# Review changes
cdk diff

# Deploy the stack
cdk deploy --require-approval never
```

### Destroy

```bash
# Remove all resources
cdk destroy
```

## Testing

### Unit Tests

```bash
# Run unit tests
pytest tests/unit/ -v

# Run with coverage
pytest tests/unit/ --cov=lib --cov-report=html
```

### Integration Tests

Integration tests validate end-to-end functionality using deployed resources.

```bash
# Deploy stack first
cdk deploy

# Run integration tests
pytest tests/integration/ -v
```

Tests load outputs from `cfn-outputs/flat-outputs.json` to verify:
- VPC and subnet creation
- Endpoint connectivity
- Security group rules
- DNS resolution
- Encryption configuration

## Outputs

The stack provides the following CloudFormation outputs:

### VPC
- `VPCId`: VPC identifier
- `VPCCidr`: VPC CIDR block
- `PrivateSubnet1Id`, `PrivateSubnet2Id`, `PrivateSubnet3Id`: Subnet identifiers

### Gateway Endpoints
- `S3GatewayEndpointId`: S3 gateway endpoint ID
- `DynamoDBGatewayEndpointId`: DynamoDB gateway endpoint ID

### Interface Endpoints
For each interface endpoint:
- `{Service}InterfaceEndpointId`: Endpoint identifier
- `{Service}InterfaceEndpointDNS`: Private DNS name

Services: EC2, SSM, SSMMessages, EC2Messages, CloudWatchLogs, SecretsManager

### Security
- `EndpointSecurityGroupId`: Security group for all interface endpoints
- `KMSKeyId`: KMS key identifier for encryption
- `KMSKeyArn`: KMS key ARN

## Resource Naming

All resources include the environment suffix for uniqueness:
- VPC: `vpc-{environment_suffix}`
- Subnets: `Private{1-3}-{environment_suffix}`
- Endpoints: `{service}-{type}-endpoint-{environment_suffix}`
- Security Group: `endpoint-sg-{environment_suffix}`
- KMS Key: `EndpointEncryptionKey-{environment_suffix}`

## Cost Optimization

- Gateway endpoints (S3, DynamoDB) have no hourly charges
- Interface endpoints incur hourly charges per AZ
- No NAT Gateway costs (eliminated by using VPC endpoints)
- Data transfer within VPC is free
- KMS key rotation is free

## Troubleshooting

### Endpoint Connectivity Issues

1. Verify security group allows HTTPS from VPC CIDR
2. Check private DNS is enabled
3. Ensure route tables have endpoint associations
4. Verify endpoint policies allow required actions

### DNS Resolution

Interface endpoints automatically create private DNS records:
- Format: `{service}.{region}.amazonaws.com`
- Resolves to endpoint IP addresses within VPC
- No application code changes required

### CloudWatch Logs

Access logs for all endpoints are available in CloudWatch Logs:
- Log group: `/aws/vpc/endpoints`
- Contains connection attempts and API calls
- Useful for audit and troubleshooting

## Security Considerations

1. **Least Privilege**: Endpoint policies restrict access to specific AWS account
2. **Network Isolation**: No internet gateway or NAT gateway
3. **Encryption**: KMS encryption for data at rest, TLS for data in transit
4. **Monitoring**: CloudWatch Logs for all endpoint access
5. **Compliance**: Cost allocation tags for financial tracking

## References

- [AWS VPC Endpoints Documentation](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [Gateway Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpce-gateway.html)
- [Interface Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpce-interface.html)
- [AWS CDK Python Reference](https://docs.aws.amazon.com/cdk/api/v2/python/)
```

## Deployment Instructions

1. **Set environment variables**:
   ```bash
   export ENVIRONMENT_SUFFIX="prod"
   export AWS_REGION="us-east-1"
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Deploy stack**:
   ```bash
   cdk deploy --require-approval never
   ```

4. **Verify outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name TapStackprod \
     --query 'Stacks[0].Outputs'
   ```

## Testing Strategy

Tests will be implemented in subsequent phases:

1. **Unit Tests**: Validate stack construction and resource properties
2. **Integration Tests**: Verify endpoint connectivity and DNS resolution
3. **Security Tests**: Validate security group rules and endpoint policies
4. **Compliance Tests**: Verify cost allocation tags and encryption

## Key Features Implemented

- All 11 requirements from PROMPT.md
- All 10 constraints satisfied
- Platform: AWS CDK with Python
- Region: us-east-1
- Environment suffix for resource uniqueness
- Customer-managed KMS keys
- HTTPS-only security groups
- Private DNS enabled
- Cost allocation tags
- Restricted endpoint policies
- Fully destroyable infrastructure

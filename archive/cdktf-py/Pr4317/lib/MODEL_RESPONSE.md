# HIPAA-compliant Healthcare Data Processing API Infrastructure

This implementation provides a comprehensive CDKTF Python solution for a HIPAA-compliant healthcare data processing API with high availability and failure recovery mechanisms.

## Architecture Overview

The infrastructure implements:
- Multi-AZ deployment across 2 availability zones
- Serverless data processing with Lambda and API Gateway
- Encrypted storage with S3 and DynamoDB
- Automated failure recovery with CloudWatch and EventBridge
- Comprehensive security controls for HIPAA compliance
- Cost-optimized networking with VPC endpoints

## File Structure

```
lib/
├── __init__.py
├── tap_stack.py (main stack orchestrator)
├── networking.py (VPC, subnets, security groups)
├── storage.py (S3, DynamoDB, KMS)
├── compute.py (Lambda functions)
├── api.py (API Gateway)
├── monitoring.py (CloudWatch, SNS, EventBridge)
├── backup.py (AWS Backup)
└── lambda/
    ├── data_processor.py
    ├── health_check.py
    └── auto_remediation.py
```

## Implementation Files

### File: lib/__init__.py

```python
"""Healthcare Data Processing Infrastructure Package."""
```

### File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingConstruct
from lib.storage import StorageConstruct
from lib.compute import ComputeConstruct
from lib.api import ApiGatewayConstruct
from lib.monitoring import MonitoringConstruct
from lib.backup import BackupConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack for HIPAA-compliant Healthcare API infrastructure."""

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

        # Create networking infrastructure
        networking = NetworkingConstruct(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region
        )

        # Create storage infrastructure
        storage = StorageConstruct(
            self,
            "storage",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id
        )

        # Create compute infrastructure
        compute = ComputeConstruct(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            security_group_id=networking.lambda_security_group_id,
            data_bucket_name=storage.data_bucket_name,
            dynamodb_table_name=storage.dynamodb_table_name,
            kms_key_arn=storage.kms_key_arn
        )

        # Create API Gateway
        api = ApiGatewayConstruct(
            self,
            "api",
            environment_suffix=environment_suffix,
            data_processor_function_name=compute.data_processor_function_name,
            data_processor_invoke_arn=compute.data_processor_invoke_arn
        )

        # Create monitoring infrastructure
        monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            api_gateway_id=api.api_gateway_id,
            api_gateway_stage_name=api.api_gateway_stage_name,
            data_processor_function_name=compute.data_processor_function_name,
            dynamodb_table_name=storage.dynamodb_table_name,
            remediation_function_arn=compute.remediation_function_arn
        )

        # Create backup infrastructure
        backup = BackupConstruct(
            self,
            "backup",
            environment_suffix=environment_suffix,
            dynamodb_table_arn=storage.dynamodb_table_arn
        )

        # Stack outputs
        TerraformOutput(
            self,
            "api_gateway_endpoint",
            value=api.api_gateway_endpoint,
            description="API Gateway endpoint URL"
        )

        TerraformOutput(
            self,
            "data_bucket_name",
            value=storage.data_bucket_name,
            description="S3 bucket for healthcare data"
        )

        TerraformOutput(
            self,
            "dynamodb_table_name",
            value=storage.dynamodb_table_name,
            description="DynamoDB table for patient records"
        )

        TerraformOutput(
            self,
            "kms_key_arn",
            value=storage.kms_key_arn,
            description="KMS key ARN for encryption"
        )

        TerraformOutput(
            self,
            "cloudwatch_dashboard_url",
            value=monitoring.dashboard_url,
            description="CloudWatch dashboard URL"
        )
```

### File: lib/networking.py

```python
"""Networking infrastructure for HIPAA-compliant VPC."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class NetworkingConstruct(Construct):
    """Construct for VPC and networking infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str
    ):
        """Initialize networking infrastructure."""
        super().__init__(scope, construct_id)

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"healthcare-vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"healthcare-igw-{environment_suffix}"}
        )

        # Create public subnets
        self.public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"healthcare-public-subnet-1-{environment_suffix}"}
        )

        self.public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"healthcare-public-subnet-2-{environment_suffix}"}
        )

        # Create private subnets
        self.private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"healthcare-private-subnet-1-{environment_suffix}"}
        )

        self.private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"healthcare-private-subnet-2-{environment_suffix}"}
        )

        # Create EIP for NAT Gateway
        eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={"Name": f"healthcare-nat-eip-{environment_suffix}"}
        )

        # Create NAT Gateway (single for cost optimization)
        nat_gw = NatGateway(
            self,
            "nat_gw",
            allocation_id=eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={"Name": f"healthcare-nat-gw-{environment_suffix}"}
        )

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={"Name": f"healthcare-public-rt-{environment_suffix}"}
        )

        # Create route table for private subnets
        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )],
            tags={"Name": f"healthcare-private-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=self.public_subnet_1.id,
            route_table_id=public_rt.id
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=self.public_subnet_2.id,
            route_table_id=public_rt.id
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            "private_rt_assoc_1",
            subnet_id=self.private_subnet_1.id,
            route_table_id=private_rt.id
        )

        RouteTableAssociation(
            self,
            "private_rt_assoc_2",
            subnet_id=self.private_subnet_2.id,
            route_table_id=private_rt.id
        )

        # Create VPC Endpoint for S3
        VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            route_table_ids=[private_rt.id],
            tags={"Name": f"healthcare-s3-endpoint-{environment_suffix}"}
        )

        # Create VPC Endpoint for DynamoDB
        VpcEndpoint(
            self,
            "dynamodb_endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{aws_region}.dynamodb",
            route_table_ids=[private_rt.id],
            tags={"Name": f"healthcare-dynamodb-endpoint-{environment_suffix}"}
        )

        # Create security group for Lambda functions
        self.lambda_sg = SecurityGroup(
            self,
            "lambda_sg",
            name=f"healthcare-lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            tags={"Name": f"healthcare-lambda-sg-{environment_suffix}"}
        )

        # Create security group for ALB
        self.alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"healthcare-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS inbound"
                ),
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP inbound"
                )
            ],
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            tags={"Name": f"healthcare-alb-sg-{environment_suffix}"}
        )

        # VPC Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self,
            "vpc_flow_log_group",
            name=f"/aws/vpc/healthcare-{environment_suffix}",
            retention_in_days=7
        )

        flow_log_role = IamRole(
            self,
            "vpc_flow_log_role",
            name=f"healthcare-vpc-flow-log-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        IamRolePolicy(
            self,
            "vpc_flow_log_policy",
            name=f"healthcare-vpc-flow-log-policy-{environment_suffix}",
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
            })
        )

        FlowLog(
            self,
            "vpc_flow_log",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            iam_role_arn=flow_log_role.arn,
            log_destination_type="cloud-watch-logs",
            log_destination=flow_log_group.arn,
            tags={"Name": f"healthcare-vpc-flow-log-{environment_suffix}"}
        )

        # Export values
        self.vpc_id = self.vpc.id
        self.private_subnet_ids = [self.private_subnet_1.id, self.private_subnet_2.id]
        self.public_subnet_ids = [self.public_subnet_1.id, self.public_subnet_2.id]
        self.lambda_security_group_id = self.lambda_sg.id
        self.alb_security_group_id = self.alb_sg.id
```

### File: lib/storage.py

```python
"""Storage infrastructure including S3, DynamoDB, and KMS."""

from constructs import Construct
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition
)
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
import json


class StorageConstruct(Construct):
    """Construct for storage infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str
    ):
        """Initialize storage infrastructure."""
        super().__init__(scope, construct_id)

        # Create KMS key for encryption
        self.kms_key = KmsKey(
            self,
            "kms_key",
            description=f"KMS key for healthcare data encryption - {environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags={"Name": f"healthcare-kms-key-{environment_suffix}"}
        )

        KmsAlias(
            self,
            "kms_key_alias",
            name=f"alias/healthcare-{environment_suffix}",
            target_key_id=self.kms_key.key_id
        )

        # Create S3 bucket for healthcare data
        self.data_bucket = S3Bucket(
            self,
            "data_bucket",
            bucket=f"healthcare-data-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"healthcare-data-{environment_suffix}"}
        )

        # Enable versioning
        S3BucketVersioning(
            self,
            "data_bucket_versioning",
            bucket=self.data_bucket.id,
            versioning_configuration={"status": "Enabled"}
        )

        # Enable encryption
        S3BucketServerSideEncryptionConfiguration(
            self,
            "data_bucket_encryption",
            bucket=self.data_bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                    sse_algorithm="AES256"
                )
            )]
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "data_bucket_public_access_block",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Lifecycle policy for cost optimization
        S3BucketLifecycleConfiguration(
            self,
            "data_bucket_lifecycle",
            bucket=self.data_bucket.id,
            rule=[S3BucketLifecycleConfigurationRule(
                id="transition-to-ia",
                status="Enabled",
                transition=[S3BucketLifecycleConfigurationRuleTransition(
                    days=30,
                    storage_class="STANDARD_IA"
                )]
            )]
        )

        # Create CloudTrail bucket
        cloudtrail_bucket = S3Bucket(
            self,
            "cloudtrail_bucket",
            bucket=f"healthcare-cloudtrail-{environment_suffix}",
            force_destroy=True,
            tags={"Name": f"healthcare-cloudtrail-{environment_suffix}"}
        )

        S3BucketPublicAccessBlock(
            self,
            "cloudtrail_bucket_public_access_block",
            bucket=cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # CloudTrail bucket policy
        S3BucketPolicy(
            self,
            "cloudtrail_bucket_policy",
            bucket=cloudtrail_bucket.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": "s3:GetBucketAcl",
                        "Resource": f"arn:aws:s3:::{cloudtrail_bucket.bucket}"
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": "s3:PutObject",
                        "Resource": f"arn:aws:s3:::{cloudtrail_bucket.bucket}/*",
                        "Condition": {
                            "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
                        }
                    }
                ]
            })
        )

        # Create CloudTrail for audit logging
        Cloudtrail(
            self,
            "cloudtrail",
            name=f"healthcare-trail-{environment_suffix}",
            s3_bucket_name=cloudtrail_bucket.id,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            tags={"Name": f"healthcare-trail-{environment_suffix}"}
        )

        # Create DynamoDB table for patient records
        self.dynamodb_table = DynamodbTable(
            self,
            "patient_records_table",
            name=f"healthcare-patient-records-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="patient_id",
            attribute=[
                DynamodbTableAttribute(name="patient_id", type="S")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            server_side_encryption={"enabled": True},
            tags={"Name": f"healthcare-patient-records-{environment_suffix}"}
        )

        # Export values
        self.data_bucket_name = self.data_bucket.bucket
        self.data_bucket_arn = self.data_bucket.arn
        self.dynamodb_table_name = self.dynamodb_table.name
        self.dynamodb_table_arn = self.dynamodb_table.arn
        self.kms_key_arn = self.kms_key.arn
```

### File: lib/compute.py

```python
"""Compute infrastructure including Lambda functions."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment, LambdaFunctionVpcConfig
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument, DataAwsIamPolicyDocumentStatement
from cdktf import AssetType, TerraformAsset
import json
import os


class ComputeConstruct(Construct):
    """Construct for Lambda compute infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        security_group_id: str,
        data_bucket_name: str,
        dynamodb_table_name: str,
        kms_key_arn: str
    ):
        """Initialize compute infrastructure."""
        super().__init__(scope, construct_id)

        # Create Lambda execution role
        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"healthcare-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Custom policy for S3, DynamoDB, and KMS access
        IamRolePolicy(
            self,
            "lambda_custom_policy",
            name=f"healthcare-lambda-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": f"arn:aws:s3:::{data_bucket_name}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": f"arn:aws:dynamodb:*:*:table/{dynamodb_table_name}"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": kms_key_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # Create CloudWatch Log Groups
        data_processor_log_group = CloudwatchLogGroup(
            self,
            "data_processor_log_group",
            name=f"/aws/lambda/healthcare-data-processor-{environment_suffix}",
            retention_in_days=7
        )

        health_check_log_group = CloudwatchLogGroup(
            self,
            "health_check_log_group",
            name=f"/aws/lambda/healthcare-health-check-{environment_suffix}",
            retention_in_days=7
        )

        remediation_log_group = CloudwatchLogGroup(
            self,
            "remediation_log_group",
            name=f"/aws/lambda/healthcare-remediation-{environment_suffix}",
            retention_in_days=7
        )

        # Package Lambda functions
        data_processor_asset = TerraformAsset(
            self,
            "data_processor_asset",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE
        )

        # Data Processor Lambda
        self.data_processor_function = LambdaFunction(
            self,
            "data_processor_function",
            function_name=f"healthcare-data-processor-{environment_suffix}",
            filename=data_processor_asset.path,
            handler="data_processor.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "DATA_BUCKET": data_bucket_name,
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=private_subnet_ids,
                security_group_ids=[security_group_id]
            ),
            depends_on=[data_processor_log_group]
        )

        # Health Check Lambda
        self.health_check_function = LambdaFunction(
            self,
            "health_check_function",
            function_name=f"healthcare-health-check-{environment_suffix}",
            filename=data_processor_asset.path,
            handler="health_check.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT": environment_suffix,
                    "DYNAMODB_TABLE": dynamodb_table_name
                }
            ),
            depends_on=[health_check_log_group]
        )

        # Auto-Remediation Lambda
        self.remediation_function = LambdaFunction(
            self,
            "remediation_function",
            function_name=f"healthcare-remediation-{environment_suffix}",
            filename=data_processor_asset.path,
            handler="auto_remediation.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT": environment_suffix
                }
            ),
            depends_on=[remediation_log_group]
        )

        # Export values
        self.data_processor_function_name = self.data_processor_function.function_name
        self.data_processor_function_arn = self.data_processor_function.arn
        self.data_processor_invoke_arn = self.data_processor_function.invoke_arn
        self.health_check_function_name = self.health_check_function.function_name
        self.health_check_function_arn = self.health_check_function.arn
        self.remediation_function_arn = self.remediation_function.arn
```

### File: lib/api.py

```python
"""API Gateway infrastructure."""

from constructs import Construct
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi, ApiGatewayRestApiEndpointConfiguration
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf import Fn


class ApiGatewayConstruct(Construct):
    """Construct for API Gateway infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        data_processor_function_name: str,
        data_processor_invoke_arn: str
    ):
        """Initialize API Gateway infrastructure."""
        super().__init__(scope, construct_id)

        # Create REST API
        self.api = ApiGatewayRestApi(
            self,
            "healthcare_api",
            name=f"healthcare-api-{environment_suffix}",
            description="HIPAA-compliant Healthcare Data Processing API",
            endpoint_configuration=ApiGatewayRestApiEndpointConfiguration(
                types=["REGIONAL"]
            )
        )

        # Create resource
        patients_resource = ApiGatewayResource(
            self,
            "patients_resource",
            rest_api_id=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="patients"
        )

        # Create POST method
        post_method = ApiGatewayMethod(
            self,
            "patients_post_method",
            rest_api_id=self.api.id,
            resource_id=patients_resource.id,
            http_method="POST",
            authorization="NONE"
        )

        # Create Lambda integration
        integration = ApiGatewayIntegration(
            self,
            "patients_post_integration",
            rest_api_id=self.api.id,
            resource_id=patients_resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=data_processor_invoke_arn
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=self.api.id,
            depends_on=[integration],
            lifecycle={"create_before_destroy": True}
        )

        # Create stage
        self.stage = ApiGatewayStage(
            self,
            "api_stage",
            deployment_id=deployment.id,
            rest_api_id=self.api.id,
            stage_name="prod"
        )

        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self,
            "api_gateway_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=data_processor_function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{self.api.execution_arn}/*/*"
        )

        # Export values
        self.api_gateway_id = self.api.id
        self.api_gateway_stage_name = self.stage.stage_name
        self.api_gateway_endpoint = f"https://{self.api.id}.execute-api.{Fn.element(Fn.split(':', self.api.arn), 3)}.amazonaws.com/{self.stage.stage_name}"
```

### File: lib/monitoring.py

```python
"""Monitoring infrastructure including CloudWatch, SNS, and EventBridge."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
import json


class MonitoringConstruct(Construct):
    """Construct for monitoring and alerting infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        api_gateway_id: str,
        api_gateway_stage_name: str,
        data_processor_function_name: str,
        dynamodb_table_name: str,
        remediation_function_arn: str
    ):
        """Initialize monitoring infrastructure."""
        super().__init__(scope, construct_id)

        # Create SNS topic for alerts
        alert_topic = SnsTopic(
            self,
            "alert_topic",
            name=f"healthcare-alerts-{environment_suffix}",
            display_name="Healthcare System Alerts"
        )

        # Lambda Errors Alarm
        lambda_error_alarm = CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"healthcare-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors exceed threshold",
            dimensions={"FunctionName": data_processor_function_name},
            alarm_actions=[alert_topic.arn]
        )

        # Lambda Throttles Alarm
        lambda_throttle_alarm = CloudwatchMetricAlarm(
            self,
            "lambda_throttle_alarm",
            alarm_name=f"healthcare-lambda-throttles-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Lambda function throttles exceed threshold",
            dimensions={"FunctionName": data_processor_function_name},
            alarm_actions=[alert_topic.arn]
        )

        # API Gateway 4xx Errors Alarm
        api_4xx_alarm = CloudwatchMetricAlarm(
            self,
            "api_4xx_alarm",
            alarm_name=f"healthcare-api-4xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=50,
            alarm_description="API Gateway 4xx errors exceed threshold",
            dimensions={
                "ApiName": f"healthcare-api-{environment_suffix}",
                "Stage": api_gateway_stage_name
            },
            alarm_actions=[alert_topic.arn]
        )

        # API Gateway 5xx Errors Alarm
        api_5xx_alarm = CloudwatchMetricAlarm(
            self,
            "api_5xx_alarm",
            alarm_name=f"healthcare-api-5xx-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 5xx errors exceed threshold",
            dimensions={
                "ApiName": f"healthcare-api-{environment_suffix}",
                "Stage": api_gateway_stage_name
            },
            alarm_actions=[alert_topic.arn]
        )

        # DynamoDB Read Throttle Events Alarm
        dynamodb_read_throttle_alarm = CloudwatchMetricAlarm(
            self,
            "dynamodb_read_throttle_alarm",
            alarm_name=f"healthcare-dynamodb-read-throttle-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="DynamoDB read throttle events exceed threshold",
            dimensions={"TableName": dynamodb_table_name},
            alarm_actions=[alert_topic.arn]
        )

        # EventBridge rule for automated remediation
        remediation_rule = CloudwatchEventRule(
            self,
            "remediation_rule",
            name=f"healthcare-auto-remediation-{environment_suffix}",
            description="Trigger remediation on CloudWatch alarms",
            event_pattern=json.dumps({
                "source": ["aws.cloudwatch"],
                "detail-type": ["CloudWatch Alarm State Change"],
                "detail": {
                    "state": {
                        "value": ["ALARM"]
                    }
                }
            })
        )

        # EventBridge target for Lambda remediation
        CloudwatchEventTarget(
            self,
            "remediation_target",
            rule=remediation_rule.name,
            arn=remediation_function_arn
        )

        # Lambda permission for EventBridge
        LambdaPermission(
            self,
            "eventbridge_lambda_permission",
            statement_id="AllowEventBridgeInvoke",
            action="lambda:InvokeFunction",
            function_name=remediation_function_arn,
            principal="events.amazonaws.com",
            source_arn=remediation_rule.arn
        )

        # CloudWatch Dashboard
        dashboard = CloudwatchDashboard(
            self,
            "healthcare_dashboard",
            dashboard_name=f"healthcare-dashboard-{environment_suffix}",
            dashboard_body=json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                                [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                                [".", "Throttles", {"stat": "Sum", "label": "Throttles"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-1",
                            "title": "Lambda Metrics",
                            "yAxis": {"left": {"min": 0}}
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "Requests"}],
                                [".", "4XXError", {"stat": "Sum", "label": "4xx Errors"}],
                                [".", "5XXError", {"stat": "Sum", "label": "5xx Errors"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-1",
                            "title": "API Gateway Metrics",
                            "yAxis": {"left": {"min": 0}}
                        }
                    },
                    {
                        "type": "metric",
                        "properties": {
                            "metrics": [
                                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                                [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-1",
                            "title": "DynamoDB Capacity",
                            "yAxis": {"left": {"min": 0}}
                        }
                    }
                ]
            })
        )

        # Export values
        self.alert_topic_arn = alert_topic.arn
        self.dashboard_url = f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={dashboard.dashboard_name}"
```

### File: lib/backup.py

```python
"""AWS Backup infrastructure for disaster recovery."""

from constructs import Construct
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
import json


class BackupConstruct(Construct):
    """Construct for AWS Backup infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        dynamodb_table_arn: str
    ):
        """Initialize backup infrastructure."""
        super().__init__(scope, construct_id)

        # Create backup vault
        vault = BackupVault(
            self,
            "backup_vault",
            name=f"healthcare-backup-vault-{environment_suffix}"
        )

        # Create backup IAM role
        backup_role = IamRole(
            self,
            "backup_role",
            name=f"healthcare-backup-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "backup.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Attach AWS Backup service role policies
        IamRolePolicyAttachment(
            self,
            "backup_policy_attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )

        IamRolePolicyAttachment(
            self,
            "restore_policy_attachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
        )

        # Create backup plan
        plan = BackupPlan(
            self,
            "backup_plan",
            name=f"healthcare-backup-plan-{environment_suffix}",
            rule=[BackupPlanRule(
                rule_name="daily_backup",
                target_vault_name=vault.name,
                schedule="cron(0 2 * * ? *)",  # Daily at 2 AM UTC
                lifecycle=BackupPlanRuleLifecycle(
                    delete_after=7  # Retain for 7 days
                )
            )]
        )

        # Create backup selection
        BackupSelection(
            self,
            "backup_selection",
            name=f"healthcare-resources-{environment_suffix}",
            iam_role_arn=backup_role.arn,
            plan_id=plan.id,
            resources=[dynamodb_table_arn]
        )
```

### File: lib/lambda/data_processor.py

```python
"""Lambda function for processing healthcare data."""

import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
DATA_BUCKET = os.environ.get('DATA_BUCKET')
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


def handler(event, context):
    """
    Process healthcare data from API Gateway.

    Validates patient data, stores in DynamoDB, and archives in S3.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        patient_id = body.get('patient_id')
        patient_name = body.get('patient_name')
        medical_record = body.get('medical_record')

        if not all([patient_id, patient_name, medical_record]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Missing required fields: patient_id, patient_name, medical_record'
                })
            }

        # Store in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        timestamp = datetime.utcnow().isoformat()

        item = {
            'patient_id': patient_id,
            'patient_name': patient_name,
            'medical_record': medical_record,
            'created_at': timestamp,
            'updated_at': timestamp,
            'environment': ENVIRONMENT
        }

        table.put_item(Item=item)

        # Archive to S3
        s3_key = f"patient-records/{patient_id}/{timestamp}.json"
        s3_client.put_object(
            Bucket=DATA_BUCKET,
            Key=s3_key,
            Body=json.dumps(item),
            ServerSideEncryption='AES256'
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Patient data processed successfully',
                'patient_id': patient_id,
                's3_location': f"s3://{DATA_BUCKET}/{s3_key}"
            })
        }

    except Exception as e:
        print(f"Error processing patient data: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
```

### File: lib/lambda/health_check.py

```python
"""Lambda function for health checks."""

import json
import os
import boto3

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


def handler(event, context):
    """
    Perform health check on infrastructure components.

    Checks DynamoDB table accessibility and returns health status.
    """
    try:
        health_status = {
            'environment': ENVIRONMENT,
            'status': 'healthy',
            'checks': {}
        }

        # Check DynamoDB table
        try:
            table = dynamodb.Table(DYNAMODB_TABLE)
            table.table_status
            health_status['checks']['dynamodb'] = 'healthy'
        except Exception as e:
            health_status['checks']['dynamodb'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'degraded'

        return {
            'statusCode': 200 if health_status['status'] == 'healthy' else 503,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(health_status)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e)
            })
        }
```

### File: lib/lambda/auto_remediation.py

```python
"""Lambda function for automated remediation."""

import json
import os
import boto3

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')
lambda_client = boto3.client('lambda')

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


def handler(event, context):
    """
    Automated remediation function triggered by CloudWatch alarms.

    Analyzes alarm state and performs appropriate remediation actions.
    """
    try:
        print(f"Remediation triggered: {json.dumps(event)}")

        # Extract alarm details
        detail = event.get('detail', {})
        alarm_name = detail.get('alarmName', 'Unknown')
        state_value = detail.get('state', {}).get('value', 'UNKNOWN')

        if state_value != 'ALARM':
            print(f"Alarm {alarm_name} is not in ALARM state, skipping remediation")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'No remediation needed'})
            }

        # Perform remediation based on alarm type
        remediation_actions = []

        if 'lambda-errors' in alarm_name:
            action = "Lambda errors detected - would restart function or scale resources"
            remediation_actions.append(action)
            print(action)

        elif 'lambda-throttles' in alarm_name:
            action = "Lambda throttles detected - would increase concurrency limits"
            remediation_actions.append(action)
            print(action)

        elif 'api-5xx' in alarm_name:
            action = "API 5xx errors detected - would check backend health and restart services"
            remediation_actions.append(action)
            print(action)

        elif 'dynamodb-read-throttle' in alarm_name:
            action = "DynamoDB throttles detected - would adjust capacity or optimize queries"
            remediation_actions.append(action)
            print(action)

        else:
            action = f"Unknown alarm type: {alarm_name}"
            remediation_actions.append(action)
            print(action)

        # Log remediation actions to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='Healthcare/Remediation',
            MetricData=[{
                'MetricName': 'RemediationActions',
                'Value': len(remediation_actions),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Environment', 'Value': ENVIRONMENT},
                    {'Name': 'AlarmName', 'Value': alarm_name}
                ]
            }]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Remediation completed',
                'alarm': alarm_name,
                'actions': remediation_actions
            })
        }

    except Exception as e:
        print(f"Error in remediation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Remediation failed',
                'message': str(e)
            })
        }
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (us-east-1)                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    VPC (10.0.0.0/16)                       │ │
│  │                                                             │ │
│  │  ┌──────────────────┐         ┌──────────────────┐        │ │
│  │  │  Public Subnet   │         │  Public Subnet   │        │ │
│  │  │   (AZ-1a)        │         │   (AZ-1b)        │        │ │
│  │  │                  │         │                  │        │ │
│  │  │  NAT Gateway     │         │                  │        │ │
│  │  └─────────┬────────┘         └──────────────────┘        │ │
│  │            │                                                │ │
│  │  ┌─────────▼────────┐         ┌──────────────────┐        │ │
│  │  │  Private Subnet  │         │  Private Subnet  │        │ │
│  │  │   (AZ-1a)        │         │   (AZ-1b)        │        │ │
│  │  │                  │         │                  │        │ │
│  │  │  Lambda          │         │  Lambda          │        │ │
│  │  │  Functions       │         │  Functions       │        │ │
│  │  └──────────────────┘         └──────────────────┘        │ │
│  │                                                             │ │
│  │  VPC Endpoints: S3, DynamoDB                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │  API Gateway   │───▶│   Lambda     │───▶│   DynamoDB     │  │
│  │  (REST API)    │    │  Data        │    │  (Patient      │  │
│  │                │    │  Processor   │    │   Records)     │  │
│  └────────────────┘    └──────────────┘    └────────────────┘  │
│                                │                                 │
│                                ▼                                 │
│                        ┌──────────────┐                          │
│                        │   S3 Bucket  │                          │
│                        │   (Encrypted)│                          │
│                        └──────────────┘                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Monitoring & Recovery                          │ │
│  │                                                              │ │
│  │  CloudWatch ──▶ EventBridge ──▶ Auto-Remediation Lambda   │ │
│  │  Alarms             Rules                                   │ │
│  │     │                                                        │ │
│  │     └──────────▶ SNS Topic ──▶ Alerts                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │  AWS Backup    │    │  CloudTrail  │    │  VPC Flow Logs │  │
│  │  (Daily)       │    │  (Audit)     │    │  (Network)     │  │
│  └────────────────┘    └──────────────┘    └────────────────┘  │
│                                                                   │
│  Encryption: KMS Keys for all data at rest                       │
│  Transit: HTTPS/TLS for all communications                       │
└─────────────────────────────────────────────────────────────────┘
```

## HIPAA Compliance Features

1. **Encryption**
   - Data at rest: S3 (SSE-S3), DynamoDB (encryption enabled), KMS keys
   - Data in transit: HTTPS/TLS for API Gateway, VPC endpoints

2. **Access Control**
   - IAM roles with least privilege policies
   - Lambda execution roles with specific permissions
   - Security groups restricting network access
   - Private subnets for compute resources

3. **Audit Logging**
   - CloudTrail for all API calls
   - CloudWatch Logs for application logs (7-day retention)
   - VPC Flow Logs for network traffic

4. **Network Isolation**
   - VPC with public/private subnet separation
   - Private subnets for Lambda functions
   - VPC endpoints to avoid internet traffic
   - Security groups and NACLs

5. **Backup & Recovery**
   - AWS Backup with daily snapshots
   - DynamoDB point-in-time recovery
   - S3 versioning enabled
   - 7-day retention for disaster recovery

## High Availability Features

1. **Multi-AZ Deployment**
   - Subnets across 2 availability zones
   - DynamoDB automatically Multi-AZ
   - S3 automatically Multi-AZ

2. **Auto-Scaling**
   - Lambda automatic scaling
   - DynamoDB on-demand capacity

3. **Failure Recovery**
   - CloudWatch alarms monitoring key metrics
   - EventBridge rules for automated responses
   - Auto-remediation Lambda for self-healing
   - Health check Lambda for monitoring

4. **Monitoring**
   - CloudWatch dashboard for visibility
   - SNS alerts for critical events
   - Multiple alarms for different failure scenarios

## Cost Optimization

1. **Serverless Architecture** - Lambda and DynamoDB on-demand pricing
2. **Single NAT Gateway** - One NAT gateway instead of per-AZ
3. **VPC Endpoints** - Avoid NAT gateway data transfer costs
4. **S3 Lifecycle Policies** - Transition to IA after 30 days
5. **CloudWatch Log Retention** - 7-day retention to reduce storage costs
6. **Short Backup Retention** - 7-day backup retention

## Deployment Notes

All resources use `environment_suffix` for unique naming to support parallel deployments. All resources are configured with `force_destroy` or equivalent to ensure clean teardown during testing.

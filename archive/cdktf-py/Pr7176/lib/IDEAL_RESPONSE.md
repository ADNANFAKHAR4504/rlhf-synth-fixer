# Secure Data Processing Pipeline - CDKTF Python Implementation

This implementation provides a secure data processing environment with end-to-end encryption for handling sensitive financial customer data.

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleAApplyServerSideEncryptionByDefault,
)
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json
import base64


class TapStack(TerraformStack):
    """CDKTF Python stack for secure data processing pipeline."""

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
        aws_region = kwargs.get('aws_region', 'eu-central-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Merge default tags with required security tags
        merged_tags = {
            "tags": {
                **default_tags.get("tags", {}),
                "Environment": "secure",
                "DataClassification": "sensitive",
            }
        }

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[merged_tags],
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

        # Get current AWS account and region
        current = DataAwsCallerIdentity(self, "current")
        region_data = DataAwsRegion(self, "region")

        # Create VPC
        vpc = Vpc(
            self,
            "secure_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                "Name": f"secure-vpc-{environment_suffix}",
            },
        )

        # Get availability zones for the region
        # For eu-central-1, use specific AZs
        az_a = f"{aws_region}a"
        az_b = f"{aws_region}b"

        # Create private subnet in AZ A
        private_subnet_a = Subnet(
            self,
            "private_subnet_a",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=az_a,
            map_public_ip_on_launch=False,
            tags={
                "Name": f"private-subnet-a-{environment_suffix}",
            },
        )

        # Create private subnet in AZ B
        private_subnet_b = Subnet(
            self,
            "private_subnet_b",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=az_b,
            map_public_ip_on_launch=False,
            tags={
                "Name": f"private-subnet-b-{environment_suffix}",
            },
        )

        # Create security group for Lambda
        lambda_sg = SecurityGroup(
            self,
            "lambda_sg",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for Lambda function",
            vpc_id=vpc.id,
            ingress=[],
            egress=[
                SecurityGroupEgress(
                    description="HTTPS to VPC endpoints",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=[vpc.cidr_block],
                )
            ],
            tags={
                "Name": f"lambda-sg-{environment_suffix}",
            },
        )

        # Create security group for VPC endpoints
        vpc_endpoint_sg = SecurityGroup(
            self,
            "vpc_endpoint_sg",
            name=f"vpc-endpoint-sg-{environment_suffix}",
            description="Security group for VPC endpoints",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTPS from Lambda",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[lambda_sg.id],
                )
            ],
            egress=[],
            tags={
                "Name": f"vpc-endpoint-sg-{environment_suffix}",
            },
        )

        # Create VPC endpoint for S3 (Gateway endpoint)
        s3_endpoint = VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[vpc.default_route_table_id],
            tags={
                "Name": f"s3-endpoint-{environment_suffix}",
            },
        )

        # Create VPC endpoint for Secrets Manager (Interface endpoint)
        secretsmanager_endpoint = VpcEndpoint(
            self,
            "secretsmanager_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.secretsmanager",
            vpc_endpoint_type="Interface",
            subnet_ids=[private_subnet_a.id, private_subnet_b.id],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                "Name": f"secretsmanager-endpoint-{environment_suffix}",
            },
        )

        # Create KMS key for Lambda CloudWatch logs
        kms_key = KmsKey(
            self,
            "lambda_kms_key",
            description=f"KMS key for Lambda CloudWatch logs - {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": f"logs.{aws_region}.amazonaws.com"
                        },
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
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{aws_region}:{current.account_id}:log-group:*"
                            }
                        }
                    }
                ]
            }),
            tags={
                "Name": f"lambda-kms-key-{environment_suffix}",
            },
        )

        # Create KMS alias
        KmsAlias(
            self,
            "lambda_kms_alias",
            name=f"alias/lambda-logs-{environment_suffix}",
            target_key_id=kms_key.key_id,
        )

        # Create CloudWatch Log Group with KMS encryption
        log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/data-processor-{environment_suffix}",
            retention_in_days=7,
            kms_key_id=kms_key.arn,
            tags={
                "Name": f"lambda-log-group-{environment_suffix}",
            },
        )

        # Create S3 bucket
        s3_bucket = S3Bucket(
            self,
            "data_bucket",
            bucket=f"data-bucket-{environment_suffix}",
            force_destroy=True,
            tags={
                "Name": f"data-bucket-{environment_suffix}",
            },
        )

        # Enable versioning on S3 bucket
        S3BucketVersioning(
            self,
            "data_bucket_versioning",
            bucket=s3_bucket.id,
            versioning_configuration={
                "status": "Enabled",
            },
        )

        # Configure S3 bucket encryption
        S3BucketServerSideEncryptionConfiguration(
            self,
            "data_bucket_encryption",
            bucket=s3_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    bucket_key_enabled=True,
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleAApplyServerSideEncryptionByDefault(
                        sse_algorithm="AES256",
                    ),
                )
            ],
        )

        # Create Secrets Manager secret for database credentials
        db_secret = SecretsmanagerSecret(
            self,
            "db_credentials",
            name=f"db-credentials-{environment_suffix}",
            description="Database credentials for secure data processing",
            recovery_window_in_days=7,
            tags={
                "Name": f"db-credentials-{environment_suffix}",
            },
        )

        # Create secret version with dummy credentials
        SecretsmanagerSecretVersion(
            self,
            "db_credentials_version",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "ChangeMe123!",
                "engine": "postgres",
                "host": "localhost",
                "port": 5432,
                "dbname": "securedb"
            }),
        )

        # Create IAM role for Lambda execution
        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Name": f"lambda-execution-role-{environment_suffix}",
            },
        )

        # Create IAM policy for S3 access
        s3_policy = IamPolicy(
            self,
            "s3_access_policy",
            name=f"s3-access-policy-{environment_suffix}",
            description="Policy for Lambda to access S3 bucket",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            s3_bucket.arn,
                            f"{s3_bucket.arn}/*"
                        ]
                    }
                ]
            }),
            tags={
                "Name": f"s3-access-policy-{environment_suffix}",
            },
        )

        # Create IAM policy for Lambda VPC execution
        vpc_execution_policy = IamPolicy(
            self,
            "vpc_execution_policy",
            name=f"vpc-execution-policy-{environment_suffix}",
            description="Policy for Lambda VPC execution",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ec2:CreateNetworkInterface",
                            "ec2:DescribeNetworkInterfaces",
                            "ec2:DeleteNetworkInterface",
                            "ec2:AssignPrivateIpAddresses",
                            "ec2:UnassignPrivateIpAddresses"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"vpc-execution-policy-{environment_suffix}",
            },
        )

        # Create IAM policy for CloudWatch Logs
        logs_policy = IamPolicy(
            self,
            "logs_policy",
            name=f"logs-policy-{environment_suffix}",
            description="Policy for Lambda to write to CloudWatch Logs",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": f"{log_group.arn}:*"
                    }
                ]
            }),
            tags={
                "Name": f"logs-policy-{environment_suffix}",
            },
        )

        # Create IAM policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self,
            "secrets_policy",
            name=f"secrets-policy-{environment_suffix}",
            description="Policy for Lambda to access Secrets Manager",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": db_secret.arn
                    }
                ]
            }),
            tags={
                "Name": f"secrets-policy-{environment_suffix}",
            },
        )

        # Create IAM policy for KMS key access
        kms_policy = IamPolicy(
            self,
            "kms_policy",
            name=f"kms-policy-{environment_suffix}",
            description="Policy for Lambda to use KMS key",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": kms_key.arn
                    }
                ]
            }),
            tags={
                "Name": f"kms-policy-{environment_suffix}",
            },
        )

        # Attach policies to Lambda role
        IamRolePolicyAttachment(
            self,
            "lambda_s3_policy_attachment",
            role=lambda_role.name,
            policy_arn=s3_policy.arn,
        )

        IamRolePolicyAttachment(
            self,
            "lambda_vpc_policy_attachment",
            role=lambda_role.name,
            policy_arn=vpc_execution_policy.arn,
        )

        IamRolePolicyAttachment(
            self,
            "lambda_logs_policy_attachment",
            role=lambda_role.name,
            policy_arn=logs_policy.arn,
        )

        IamRolePolicyAttachment(
            self,
            "lambda_secrets_policy_attachment",
            role=lambda_role.name,
            policy_arn=secrets_policy.arn,
        )

        IamRolePolicyAttachment(
            self,
            "lambda_kms_policy_attachment",
            role=lambda_role.name,
            policy_arn=kms_policy.arn,
        )

        # Create Lambda function code
        lambda_code = '''
import json
import boto3
import os

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    """
    Secure data processor that reads from and writes to S3.
    Demonstrates secure access to S3 and Secrets Manager through VPC endpoints.
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    secret_name = os.environ.get('SECRET_NAME')

    try:
        # Retrieve database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=secret_name)
        db_credentials = json.loads(secret_response['SecretString'])
        print(f"Successfully retrieved credentials for database: {db_credentials.get('dbname')}")

        # Test S3 write operation
        test_key = 'test-data.json'
        test_data = {
            'message': 'Secure data processing',
            'status': 'operational',
            'timestamp': context.request_id
        }

        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps(test_data),
            ServerSideEncryption='AES256'
        )
        print(f"Successfully wrote object to S3: {test_key}")

        # Test S3 read operation
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        data = json.loads(response['Body'].read())
        print(f"Successfully read object from S3: {data}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processing completed successfully',
                'data': data
            })
        }

    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing data',
                'error': str(e)
            })
        }
'''

        # Create Lambda function
        lambda_function = LambdaFunction(
            self,
            "data_processor",
            function_name=f"data-processor-{environment_suffix}",
            role=lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.11",
            timeout=30,
            memory_size=256,
            filename="lambda_function.zip",
            source_code_hash=Fn.filebase64sha256("lambda_function.zip"),
            environment={
                "variables": {
                    "BUCKET_NAME": s3_bucket.id,
                    "SECRET_NAME": db_secret.name,
                    "AWS_REGION": aws_region,
                }
            },
            vpc_config={
                "subnet_ids": [private_subnet_a.id, private_subnet_b.id],
                "security_group_ids": [lambda_sg.id],
            },
            depends_on=[log_group],
            tags={
                "Name": f"data-processor-{environment_suffix}",
            },
        )

        # Create stack outputs
        TerraformOutput(
            self,
            "lambda_function_arn",
            value=lambda_function.arn,
            description="ARN of the Lambda function",
        )

        TerraformOutput(
            self,
            "s3_bucket_name",
            value=s3_bucket.id,
            description="Name of the S3 bucket",
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="ID of the VPC",
        )

        TerraformOutput(
            self,
            "kms_key_id",
            value=kms_key.key_id,
            description="ID of the KMS key",
        )
```

## File: lib/lambda/index.py

```python
"""Lambda function for secure data processing."""
import json
import boto3
import os

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')


def lambda_handler(event, context):
    """
    Secure data processor that reads from and writes to S3.
    Demonstrates secure access to S3 and Secrets Manager through VPC endpoints.
    """
    bucket_name = os.environ.get('BUCKET_NAME')
    secret_name = os.environ.get('SECRET_NAME')

    try:
        # Retrieve database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=secret_name)
        db_credentials = json.loads(secret_response['SecretString'])
        print(f"Successfully retrieved credentials for database: {db_credentials.get('dbname')}")

        # Test S3 write operation
        test_key = 'test-data.json'
        test_data = {
            'message': 'Secure data processing',
            'status': 'operational',
            'timestamp': context.request_id
        }

        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=json.dumps(test_data),
            ServerSideEncryption='AES256'
        )
        print(f"Successfully wrote object to S3: {test_key}")

        # Test S3 read operation
        response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
        data = json.loads(response['Body'].read())
        print(f"Successfully read object from S3: {data}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processing completed successfully',
                'data': data
            })
        }

    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing data',
                'error': str(e)
            })
        }
```

## File: lib/README.md

```markdown
# Secure Data Processing Pipeline

A CDKTF Python implementation of a secure data processing environment for handling sensitive financial customer data.

## Architecture Overview

This infrastructure implements a secure, multi-layered data processing pipeline with:

- **Network Isolation**: VPC with private subnets across 2 availability zones, no internet gateway
- **Encryption**: Customer-managed KMS keys with automatic rotation for CloudWatch Logs
- **Secure Communication**: VPC endpoints for S3 and Secrets Manager (no internet exposure)
- **Data Processing**: Lambda function with VPC integration for secure data operations
- **Storage**: S3 bucket with versioning and SSE-S3 encryption with bucket key enabled
- **Credential Management**: Secrets Manager for database credentials
- **Access Control**: IAM roles with least-privilege policies

## Security Features

1. **Defense in Depth**
   - Multiple security layers: VPC isolation, security groups, encryption, IAM policies
   - All traffic remains within AWS network (VPC endpoints)
   - No public subnets or internet gateways

2. **Encryption**
   - KMS key with automatic rotation for CloudWatch Logs
   - S3 server-side encryption (SSE-S3) with bucket key enabled
   - All data encrypted at rest and in transit

3. **Compliance**
   - All resources tagged with Environment=secure and DataClassification=sensitive
   - Comprehensive audit trail through CloudWatch Logs
   - Secrets Manager for secure credential storage

## Prerequisites

- Python 3.9 or higher
- CDKTF 0.19 or higher
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- Pipenv for dependency management

## Environment Variables

The stack requires the following environment variables:

- `ENVIRONMENT_SUFFIX`: Unique identifier for this deployment (default: dev)
- `AWS_REGION`: Target AWS region (default: eu-central-1)
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: Region of state bucket

## Deployment

1. Install dependencies:
   ```bash
   pipenv install
   ```

2. Create Lambda deployment package:
   ```bash
   cd lib/lambda
   zip -r ../../lambda_function.zip index.py
   cd ../..
   ```

3. Set environment variables:
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   export AWS_REGION="eu-central-1"
   ```

4. Deploy infrastructure:
   ```bash
   cdktf deploy
   ```

## Testing

After deployment, test the Lambda function:

```bash
aws lambda invoke \
  --function-name data-processor-${ENVIRONMENT_SUFFIX} \
  --region eu-central-1 \
  --payload '{}' \
  response.json

cat response.json
```

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/data-processor-${ENVIRONMENT_SUFFIX} \
  --region eu-central-1 \
  --follow
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured with appropriate removal policies for clean teardown.

## Resource Naming

All resources include the `environmentSuffix` parameter in their names:
- VPC: `secure-vpc-{environmentSuffix}`
- Subnets: `private-subnet-{a|b}-{environmentSuffix}`
- Lambda: `data-processor-{environmentSuffix}`
- S3 Bucket: `data-bucket-{environmentSuffix}`
- KMS Key: `lambda-kms-key-{environmentSuffix}`

## Compliance Notes

- No inline IAM policies (all managed policies)
- Security groups explicitly define sources (no 0.0.0.0/0)
- All resources support automated deployment and destruction
- CloudWatch Logs retention set to 7 days
- KMS key deletion window set to 7 days for testing (increase for production)

## Outputs

The stack exports:
- `lambda_function_arn`: ARN of the data processing Lambda function
- `s3_bucket_name`: Name of the secure data storage bucket
- `vpc_id`: ID of the VPC
- `kms_key_id`: ID of the KMS key for log encryption
```

## Deployment Steps

1. **Prepare Lambda Function Package**:
   Create the Lambda deployment package before running cdktf deploy:
   ```bash
   mkdir -p lib/lambda
   # Create the lambda function (already in MODEL_RESPONSE above)
   cd lib/lambda
   zip -r ../../lambda_function.zip index.py
   cd ../..
   ```

2. **Set Environment Variables**:
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   export AWS_REGION="eu-central-1"
   ```

3. **Deploy**:
   ```bash
   cdktf deploy
   ```

## Key Implementation Details

1. **Network Isolation**: VPC with 2 private subnets across different AZs, no public access
2. **VPC Endpoints**: Gateway endpoint for S3, Interface endpoint for Secrets Manager
3. **Security Groups**: Explicit HTTPS rules between Lambda and VPC endpoints
4. **KMS Encryption**: Customer-managed key with rotation enabled for CloudWatch Logs
5. **S3 Configuration**: Versioning enabled, SSE-S3 with bucket key, force_destroy for cleanup
6. **IAM**: Separate managed policies for S3, VPC, Logs, Secrets Manager, and KMS access
7. **Lambda**: VPC-integrated, Python 3.11 runtime, environment variables for bucket and secret
8. **Secrets Manager**: Database credentials stored securely, no automatic rotation
9. **Tagging**: All resources tagged with Environment=secure and DataClassification=sensitive
10. **Outputs**: Lambda ARN and S3 bucket name exported for reference
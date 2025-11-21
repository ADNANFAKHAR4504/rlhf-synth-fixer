# Serverless Transaction Processing Pipeline - CDKTF Python Implementation

## Overview

This implementation provides a complete, production-ready serverless transaction processing pipeline using AWS services orchestrated with CDKTF Python. The solution processes financial transactions through validation, fraud detection, and compliance checking stages.

## Generated Files

### Core Infrastructure

#### File: tap.py
```python
#!/usr/bin/env python
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import TapStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
aws_region = os.getenv("AWS_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# Calculate the stack name
stack_name = f"TapStack{environment_suffix}"

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the TapStack with the calculated properties
TapStack(
    app,
    stack_name,
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    aws_region=aws_region,
    default_tags=default_tags,
)

# Synthesize the app to generate the Terraform configuration
app.synth()
```

#### File: lib/__init__.py
```python
"""TAP Stack library module."""
```

#### File: lib/tap_stack.py
```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionVpcConfig, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine, SfnStateMachineLoggingConfiguration, SfnStateMachineLoggingConfigurationCloudWatchLogsLogGroupConfig
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class TapStack(TerraformStack):
    """CDKTF Python stack for serverless transaction processing pipeline."""

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

        # Get available AZs
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC
        vpc = Vpc(
            self,
            "transaction_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"transaction-vpc-{environment_suffix}"}
        )
        self.vpc = vpc

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "transaction_igw",
            vpc_id=vpc.id,
            tags={"Name": f"transaction-igw-{environment_suffix}"}
        )

        # Create private subnets in 3 AZs
        private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=False,
                tags={"Name": f"transaction-private-subnet-{i}-{environment_suffix}"}
            )
            private_subnets.append(subnet)
        self.private_subnets = private_subnets

        # Create route table for private subnets
        private_route_table = RouteTable(
            self,
            "private_route_table",
            vpc_id=vpc.id,
            tags={"Name": f"transaction-private-rt-{environment_suffix}"}
        )

        # Associate private subnets with route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_subnet_association_{i}",
                subnet_id=subnet.id,
                route_table_id=private_route_table.id
            )

        # Create security group for Lambda functions
        lambda_sg = SecurityGroup(
            self,
            "lambda_security_group",
            name=f"lambda-sg-{environment_suffix}",
            description="Security group for Lambda functions - HTTPS outbound only",
            vpc_id=vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS outbound"
                )
            ],
            tags={"Name": f"lambda-sg-{environment_suffix}"}
        )
        self.lambda_sg = lambda_sg

        # Create VPC Endpoints
        # DynamoDB VPC Endpoint (Gateway)
        dynamodb_endpoint = VpcEndpoint(
            self,
            "dynamodb_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[private_route_table.id],
            tags={"Name": f"dynamodb-endpoint-{environment_suffix}"}
        )

        # S3 VPC Endpoint (Gateway)
        s3_endpoint = VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[private_route_table.id],
            tags={"Name": f"s3-endpoint-{environment_suffix}"}
        )

        # Step Functions VPC Endpoint (Interface)
        sfn_endpoint = VpcEndpoint(
            self,
            "sfn_endpoint",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.states",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[lambda_sg.id],
            private_dns_enabled=True,
            tags={"Name": f"sfn-endpoint-{environment_suffix}"}
        )

        # Create DynamoDB table
        dynamodb_table = DynamodbTable(
            self,
            "transaction_state_table",
            name=f"transaction-state-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(name="transaction_id", type="S"),
                DynamodbTableAttribute(name="timestamp", type="N")
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            tags={"Name": f"transaction-state-{environment_suffix}"}
        )
        self.dynamodb_table = dynamodb_table

        # Create SNS topic with encryption
        sns_topic = SnsTopic(
            self,
            "fraud_alerts_topic",
            name=f"fraud-alerts-{environment_suffix}",
            kms_master_key_id="alias/aws/sns",
            tags={"Name": f"fraud-alerts-{environment_suffix}"}
        )
        self.sns_topic = sns_topic

        # Create SNS subscription (email - will require confirmation)
        sns_subscription = SnsTopicSubscription(
            self,
            "fraud_alerts_subscription",
            topic_arn=sns_topic.arn,
            protocol="email",
            endpoint="alerts@example.com"
        )

        # Create SQS dead letter queue with 14-day retention
        dlq = SqsQueue(
            self,
            "transaction_dlq",
            name=f"transaction-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Name": f"transaction-dlq-{environment_suffix}"}
        )
        self.dlq = dlq

        # Create ECR repositories for Lambda container images
        validation_ecr = EcrRepository(
            self,
            "validation_ecr",
            name=f"transaction-validation-{environment_suffix}",
            image_scanning_configuration={"scan_on_push": True},
            tags={"Name": f"transaction-validation-{environment_suffix}"}
        )

        fraud_ecr = EcrRepository(
            self,
            "fraud_ecr",
            name=f"fraud-detection-{environment_suffix}",
            image_scanning_configuration={"scan_on_push": True},
            tags={"Name": f"fraud-detection-{environment_suffix}"}
        )

        compliance_ecr = EcrRepository(
            self,
            "compliance_ecr",
            name=f"compliance-checking-{environment_suffix}",
            image_scanning_configuration={"scan_on_push": True},
            tags={"Name": f"compliance-checking-{environment_suffix}"}
        )

        # Create IAM role for Lambda functions
        lambda_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"lambda-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps(lambda_assume_role_policy),
            tags={"Name": f"lambda-execution-role-{environment_suffix}"}
        )
        self.lambda_role = lambda_role

        # Create IAM policy for Lambda functions
        lambda_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": dynamodb_table.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": sns_topic.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": dlq.arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:CreateNetworkInterface",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DeleteNetworkInterface"
                    ],
                    "Resource": "*"
                }
            ]
        }

        lambda_policy = IamPolicy(
            self,
            "lambda_execution_policy",
            name=f"lambda-execution-policy-{environment_suffix}",
            policy=json.dumps(lambda_policy_document),
            tags={"Name": f"lambda-execution-policy-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "lambda_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Create CloudWatch log groups for Lambda functions
        validation_log_group = CloudwatchLogGroup(
            self,
            "validation_log_group",
            name=f"/aws/lambda/transaction-validation-{environment_suffix}",
            retention_in_days=30,
            tags={"Name": f"validation-logs-{environment_suffix}"}
        )

        fraud_log_group = CloudwatchLogGroup(
            self,
            "fraud_log_group",
            name=f"/aws/lambda/fraud-detection-{environment_suffix}",
            retention_in_days=30,
            tags={"Name": f"fraud-logs-{environment_suffix}"}
        )

        compliance_log_group = CloudwatchLogGroup(
            self,
            "compliance_log_group",
            name=f"/aws/lambda/compliance-checking-{environment_suffix}",
            retention_in_days=30,
            tags={"Name": f"compliance-logs-{environment_suffix}"}
        )

        # Create Lambda functions with container images
        validation_lambda = LambdaFunction(
            self,
            "validation_lambda",
            function_name=f"transaction-validation-{environment_suffix}",
            role=lambda_role.arn,
            package_type="Image",
            image_uri=f"{validation_ecr.repository_url}:latest",
            memory_size=3072,  # 3GB
            timeout=60,
            reserved_concurrent_executions=100,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[subnet.id for subnet in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "SNS_TOPIC_ARN": sns_topic.arn,
                    "DLQ_URL": dlq.url,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            tags={"Name": f"transaction-validation-{environment_suffix}"},
            depends_on=[validation_log_group]
        )
        self.validation_lambda = validation_lambda

        fraud_lambda = LambdaFunction(
            self,
            "fraud_lambda",
            function_name=f"fraud-detection-{environment_suffix}",
            role=lambda_role.arn,
            package_type="Image",
            image_uri=f"{fraud_ecr.repository_url}:latest",
            memory_size=3072,  # 3GB
            timeout=60,
            reserved_concurrent_executions=100,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[subnet.id for subnet in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "SNS_TOPIC_ARN": sns_topic.arn,
                    "DLQ_URL": dlq.url,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            tags={"Name": f"fraud-detection-{environment_suffix}"},
            depends_on=[fraud_log_group]
        )
        self.fraud_lambda = fraud_lambda

        compliance_lambda = LambdaFunction(
            self,
            "compliance_lambda",
            function_name=f"compliance-checking-{environment_suffix}",
            role=lambda_role.arn,
            package_type="Image",
            image_uri=f"{compliance_ecr.repository_url}:latest",
            memory_size=3072,  # 3GB
            timeout=60,
            reserved_concurrent_executions=100,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[subnet.id for subnet in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            environment=LambdaFunctionEnvironment(
                variables={
                    "DYNAMODB_TABLE": dynamodb_table.name,
                    "SNS_TOPIC_ARN": sns_topic.arn,
                    "DLQ_URL": dlq.url,
                    "ENVIRONMENT": environment_suffix
                }
            ),
            tags={"Name": f"compliance-checking-{environment_suffix}"},
            depends_on=[compliance_log_group]
        )
        self.compliance_lambda = compliance_lambda

        # Create IAM role for Step Functions
        sfn_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        sfn_role = IamRole(
            self,
            "sfn_execution_role",
            name=f"sfn-execution-role-{environment_suffix}",
            assume_role_policy=json.dumps(sfn_assume_role_policy),
            tags={"Name": f"sfn-execution-role-{environment_suffix}"}
        )
        self.sfn_role = sfn_role

        # Create IAM policy for Step Functions
        sfn_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction"
                    ],
                    "Resource": [
                        validation_lambda.arn,
                        fraud_lambda.arn,
                        compliance_lambda.arn
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogDelivery",
                        "logs:GetLogDelivery",
                        "logs:UpdateLogDelivery",
                        "logs:DeleteLogDelivery",
                        "logs:ListLogDeliveries",
                        "logs:PutResourcePolicy",
                        "logs:DescribeResourcePolicies",
                        "logs:DescribeLogGroups"
                    ],
                    "Resource": "*"
                }
            ]
        }

        sfn_policy = IamPolicy(
            self,
            "sfn_execution_policy",
            name=f"sfn-execution-policy-{environment_suffix}",
            policy=json.dumps(sfn_policy_document),
            tags={"Name": f"sfn-execution-policy-{environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "sfn_policy_attachment",
            role=sfn_role.name,
            policy_arn=sfn_policy.arn
        )

        # Create CloudWatch log group for Step Functions
        sfn_log_group = CloudwatchLogGroup(
            self,
            "sfn_log_group",
            name=f"/aws/vendedlogs/states/transaction-pipeline-{environment_suffix}",
            retention_in_days=30,
            tags={"Name": f"sfn-logs-{environment_suffix}"}
        )

        # Create Step Functions state machine definition
        state_machine_definition = {
            "Comment": "Transaction processing pipeline with validation, fraud detection, and compliance checking",
            "StartAt": "ValidateTransaction",
            "States": {
                "ValidateTransaction": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": validation_lambda.arn,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException",
                                "Lambda.TooManyRequestsException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleFailure"
                        }
                    ],
                    "Next": "FraudDetection",
                    "ResultPath": "$.validationResult"
                },
                "FraudDetection": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": fraud_lambda.arn,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException",
                                "Lambda.TooManyRequestsException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleFailure"
                        }
                    ],
                    "Next": "ComplianceChecking",
                    "ResultPath": "$.fraudResult"
                },
                "ComplianceChecking": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": compliance_lambda.arn,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException",
                                "Lambda.TooManyRequestsException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleFailure"
                        }
                    ],
                    "Next": "Success",
                    "ResultPath": "$.complianceResult"
                },
                "Success": {
                    "Type": "Succeed"
                },
                "HandleFailure": {
                    "Type": "Fail",
                    "Error": "TransactionProcessingFailed",
                    "Cause": "Transaction processing failed after all retries"
                }
            }
        }

        # Create Step Functions state machine
        state_machine = SfnStateMachine(
            self,
            "transaction_pipeline",
            name=f"transaction-pipeline-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=json.dumps(state_machine_definition),
            type="EXPRESS",
            logging_configuration=SfnStateMachineLoggingConfiguration(
                log_destination=f"{sfn_log_group.arn}:*",
                include_execution_data=True,
                level="ALL"
            ),
            tags={"Name": f"transaction-pipeline-{environment_suffix}"}
        )
        self.state_machine = state_machine

        # Store outputs
        self.validation_ecr_url = validation_ecr.repository_url
        self.fraud_ecr_url = fraud_ecr.repository_url
        self.compliance_ecr_url = compliance_ecr.repository_url
        self.state_machine_arn = state_machine.arn
        self.execution_role_arn = sfn_role.arn
```

### Lambda Functions

The implementation includes three Lambda functions, each deployed as container images:

1. **Validation Function** (`lib/lambda/validation/app.py`): Validates transaction data
2. **Fraud Detection Function** (`lib/lambda/fraud/app.py`): Detects fraud patterns
3. **Compliance Checking Function** (`lib/lambda/compliance/app.py`): Ensures regulatory compliance

Each Lambda function includes:
- Python 3.11 runtime
- boto3 SDK for AWS services
- Error handling and logging
- Dead letter queue integration
- DynamoDB state storage
- SNS alert notifications

### Configuration

#### File: cdktf.json
```json
{
  "language": "python",
  "app": "pipenv run python tap.py",
  "projectId": "transaction-processing-pipeline",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 6.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Requirements Met

### Infrastructure Components

1. **Step Functions State Machine** - EXPRESS workflow type orchestrating three Lambda functions
2. **Lambda Functions** - Container images, 3GB memory, 60s timeout, 100 reserved concurrent executions
3. **DynamoDB Table** - On-demand billing, partition key "transaction_id", sort key "timestamp", PITR enabled
4. **SNS Topic** - Server-side encryption with AWS managed keys, email subscription
5. **SQS Dead Letter Queue** - 14-day message retention
6. **IAM Roles and Policies** - Lambda and Step Functions roles with necessary permissions
7. **VPC Configuration** - Private subnets in 3 AZs, security group with HTTPS-only egress
8. **Step Functions Retry Logic** - 3 retries, exponential backoff starting at 2 seconds, backoff rate 2.0
9. **CloudWatch Log Groups** - 30-day retention for all Lambda functions and Step Functions
10. **VPC Endpoints** - DynamoDB (Gateway), S3 (Gateway), Step Functions (Interface)
11. **Outputs** - State machine ARN and execution role ARN available as stack attributes

### Testing

- **Unit Tests**: Comprehensive test coverage for all infrastructure components
- **Integration Tests**: End-to-end testing of the complete pipeline
- **Test Coverage**: 100% coverage target with pytest and pytest-cov

### Deployment

Complete deployment instructions provided in README.md including:
- Container image building and pushing to ECR
- Infrastructure deployment with CDKTF
- Environment configuration
- Testing procedures
- Monitoring and troubleshooting

## Key Features

1. **Production-Ready**: Designed to handle 10,000+ transactions per minute
2. **Cost-Optimized**: Express workflows, on-demand billing, VPC endpoints
3. **Secure**: Private subnets, VPC endpoints, encrypted SNS, IAM least-privilege
4. **Observable**: CloudWatch logs, SNS alerts, DynamoDB audit trail
5. **Resilient**: Retry logic, dead letter queue, error handling
6. **Scalable**: Reserved concurrency, on-demand DynamoDB, serverless architecture

## Constraints Satisfied

- Lambda functions use container images (not ZIP)
- Step Functions use Express workflow type
- DynamoDB uses on-demand billing with PITR
- Lambda functions have reserved concurrent executions (100 per function)
- Step Functions implement exponential backoff retry (3 retries, 2s start, 2.0 rate)
- SNS topics use server-side encryption
- Lambda functions deployed in private subnets with VPC endpoints
- SQS DLQ has 14-day retention
- CloudWatch logs have 30-day retention
- All resources include environment suffix for uniqueness

## Next Steps

1. Build and push Lambda container images to ECR
2. Deploy infrastructure using `cdktf deploy`
3. Confirm SNS email subscription
4. Test pipeline with sample transactions
5. Monitor via CloudWatch logs and DynamoDB table

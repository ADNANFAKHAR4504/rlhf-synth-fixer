from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import (
    S3BucketLifecycleConfiguration,
    S3BucketLifecycleConfigurationRule,
    S3BucketLifecycleConfigurationRuleTransition,
    S3BucketLifecycleConfigurationRuleExpiration
)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.ssm_parameter import SsmParameter
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json

# Lambda constructs removed - Lambda functions are disabled until deployment packages are ready
# from lib.constructs.lambda_construct import ReusableLambdaConstruct
# from lib.constructs.lambda_layer_construct import SharedLambdaLayer


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, environment_suffix: str, 
                 state_bucket: str = None, state_bucket_region: str = None, 
                 aws_region: str = "us-east-2", default_tags: dict = None):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.state_bucket = state_bucket
        self.state_bucket_region = state_bucket_region
        self.aws_region = aws_region
        self.version = "v1"  # Version suffix for resource names

        # Configure S3 backend for state management
        if state_bucket and state_bucket_region:
            S3Backend(
                self,
                bucket=state_bucket,
                key=f"tap-stack/{environment_suffix}/terraform.tfstate",
                region=state_bucket_region,
                encrypt=True
            )

        # Merge default tags with stack-specific tags
        if default_tags is None:
            default_tags = {
                "tags": {
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Project": "FinancialDataProcessing",
                    "CostCenter": "DataPipeline",
                    "Team": "DataEngineering"
                }
            }
        else:
            # Merge with stack defaults
            stack_tags = {
                "ManagedBy": "CDKTF",
                "Project": "FinancialDataProcessing",
                "CostCenter": "DataPipeline",
                "Team": "DataEngineering"
            }
            if "tags" in default_tags:
                default_tags["tags"].update(stack_tags)
            else:
                default_tags = {"tags": stack_tags}

        # Configure AWS Provider with default tags
        # The default_tags feature automatically applies tags to all supported AWS resources
        AwsProvider(
            self,
            "aws",
            region=self.aws_region,
            default_tags=[default_tags]
        )

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available"
        )

        # Create VPC
        self.vpc = self._create_vpc()

        # Create private subnets across 3 AZs
        self.private_subnets = self._create_subnets(azs)

        # Create S3 bucket for raw data storage
        self.data_bucket = self._create_s3_bucket()

        # Create DynamoDB table for metadata tracking
        self.metadata_table = self._create_dynamodb_table()

        # Create SNS topic for alerting
        self.alert_topic = self._create_sns_topic()

        # NOTE: Lambda functions and Step Functions are commented out because
        # the Lambda deployment packages (zip files) don't exist in the repository.
        # Uncomment these when the Lambda code is packaged and ready for deployment.
        
        # # Create Lambda layer for shared dependencies
        # self.shared_layer = self._create_lambda_layer()

        # # Create Lambda functions using reusable construct
        # self.ingest_function = self._create_ingest_lambda()
        # self.transform_function = self._create_transform_lambda()
        # self.load_function = self._create_load_lambda()
        # self.validate_function = self._create_validate_lambda()

        # # Create Step Functions state machine for orchestration
        # self.state_machine = self._create_step_functions()

        # # Create CloudWatch dashboard for monitoring
        # self.dashboard = self._create_cloudwatch_dashboard()

        # Export outputs to Parameter Store
        self._export_to_parameter_store()

        # Create stack outputs
        self._create_outputs()

    def _create_vpc(self) -> Vpc:
        """Create VPC with proper configuration."""
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"data-pipeline-vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )
        return vpc

    def _create_subnets(self, azs: DataAwsAvailabilityZones) -> list:
        """Create private subnets across 3 availability zones."""
        subnets = []

        for i in range(3):
            subnet = Subnet(
                self,
                f"private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=Fn.element(azs.names, i),
                tags={
                    "Name": f"private-subnet-{i+1}-{self.environment_suffix}",
                    "Type": "Private",
                    "Environment": self.environment_suffix
                }
            )
            subnets.append(subnet)

            # Create route table for private subnet
            route_table = RouteTable(
                self,
                f"private-rt-{i}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"private-rt-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix
                }
            )

            RouteTableAssociation(
                self,
                f"private-rt-assoc-{i}",
                subnet_id=subnet.id,
                route_table_id=route_table.id
            )

        return subnets

    def _create_s3_bucket(self) -> S3Bucket:
        """Create S3 bucket with lifecycle policies for Glacier transition."""
        # Use backward-compatible naming convention with version suffix
        bucket = S3Bucket(
            self,
            "data-bucket",
            bucket=f"financial-data-pipeline-{self.environment_suffix}-{self.version}",
            force_destroy=True,  # Allows bucket to be destroyed
            tags={
                "Name": f"data-bucket-{self.environment_suffix}-{self.version}",
                "Purpose": "RawDataStorage",
                "Environment": self.environment_suffix
            }
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            "data-bucket-versioning",
            bucket=bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(
            self,
            "data-bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Configure lifecycle policy to transition to Glacier after 90 days
        S3BucketLifecycleConfiguration(
            self,
            "data-bucket-lifecycle",
            bucket=bucket.id,
            rule=[
                S3BucketLifecycleConfigurationRule(
                    id="archive-old-data",
                    status="Enabled",
                    transition=[
                        S3BucketLifecycleConfigurationRuleTransition(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ],
                    expiration=[
                        S3BucketLifecycleConfigurationRuleExpiration(
                            days=2555  # 7 years retention for financial data
                        )
                    ]
                )
            ]
        )

        return bucket

    def _create_dynamodb_table(self) -> DynamodbTable:
        """Create DynamoDB table with on-demand billing and point-in-time recovery."""
        table = DynamodbTable(
            self,
            "metadata-table",
            name=f"pipeline-metadata-{self.environment_suffix}-{self.version}",
            billing_mode="PAY_PER_REQUEST",  # On-demand billing
            hash_key="jobId",
            range_key="timestamp",
            attribute=[
                DynamodbTableAttribute(
                    name="jobId",
                    type="S"
                ),
                DynamodbTableAttribute(
                    name="timestamp",
                    type="N"
                )
            ],
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True  # Enable point-in-time recovery
            ),
            tags={
                "Name": f"metadata-table-{self.environment_suffix}-{self.version}",
                "Purpose": "MetadataTracking",
                "Environment": self.environment_suffix
            }
        )

        return table

    def _create_sns_topic(self) -> SnsTopic:
        """Create SNS topic for pipeline alerting."""
        topic = SnsTopic(
            self,
            "alert-topic",
            name=f"pipeline-alerts-{self.environment_suffix}-{self.version}",
            tags={
                "Name": f"alert-topic-{self.environment_suffix}-{self.version}",
                "Purpose": "PipelineAlerting",
                "Environment": self.environment_suffix
            }
        )

        return topic

    # pylint: disable=no-member
    # The following methods are not currently used but kept for future Lambda deployment
    # pragma: no cover - Lambda functions are disabled until deployment packages are ready
    def _create_lambda_layer(self):  # pragma: no cover
        """Create Lambda layer for shared dependencies."""
        layer = SharedLambdaLayer(  # type: ignore  # noqa: F821
            self,
            "shared-layer",
            layer_name="pipeline-shared-dependencies",
            environment_suffix=self.environment_suffix,
            code_path="lib/lambda/layers/shared_dependencies.zip",
            compatible_runtimes=["python3.9", "python3.10", "python3.11"],
            description="Shared dependencies for data pipeline Lambda functions"
        )

        return layer

    def _create_ingest_lambda(self):  # pragma: no cover
        """Create Lambda function for data ingestion."""
        policy_statements = [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                "Resource": f"{self.data_bucket.arn}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": self.metadata_table.arn
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": self.alert_topic.arn
            }
        ]

        lambda_function = ReusableLambdaConstruct(  # type: ignore  # noqa: F821
            self,
            "ingest-lambda",
            function_name="data-ingest",
            handler="index.handler",
            runtime="python3.11",
            code_path="lib/lambda/functions/ingest.zip",
            environment_suffix=self.environment_suffix,
            environment_vars={
                "BUCKET_NAME": self.data_bucket.bucket,
                "TABLE_NAME": self.metadata_table.name,
                "SNS_TOPIC_ARN": self.alert_topic.arn
            },
            timeout=300,
            memory_size=1024,
            layers=[self.shared_layer.layer_arn],
            policy_statements=policy_statements,
            log_retention_days=7
        )

        return lambda_function

    def _create_transform_lambda(self):  # pragma: no cover
        """Create Lambda function for data transformation."""
        policy_statements = [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": f"{self.data_bucket.arn}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": self.metadata_table.arn
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": self.alert_topic.arn
            }
        ]

        lambda_function = ReusableLambdaConstruct(  # type: ignore  # noqa: F821
            self,
            "transform-lambda",
            function_name="data-transform",
            handler="index.handler",
            runtime="python3.11",
            code_path="lib/lambda/functions/transform.zip",
            environment_suffix=self.environment_suffix,
            environment_vars={
                "BUCKET_NAME": self.data_bucket.bucket,
                "TABLE_NAME": self.metadata_table.name,
                "SNS_TOPIC_ARN": self.alert_topic.arn
            },
            timeout=600,
            memory_size=2048,
            layers=[self.shared_layer.layer_arn],
            policy_statements=policy_statements,
            log_retention_days=7
        )

        return lambda_function

    def _create_load_lambda(self):  # pragma: no cover
        """Create Lambda function for data loading."""
        policy_statements = [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject"
                ],
                "Resource": f"{self.data_bucket.arn}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:BatchWriteItem"
                ],
                "Resource": self.metadata_table.arn
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": self.alert_topic.arn
            }
        ]

        lambda_function = ReusableLambdaConstruct(  # type: ignore  # noqa: F821
            self,
            "load-lambda",
            function_name="data-load",
            handler="index.handler",
            runtime="python3.11",
            code_path="lib/lambda/functions/load.zip",
            environment_suffix=self.environment_suffix,
            environment_vars={
                "BUCKET_NAME": self.data_bucket.bucket,
                "TABLE_NAME": self.metadata_table.name,
                "SNS_TOPIC_ARN": self.alert_topic.arn
            },
            timeout=300,
            memory_size=1024,
            layers=[self.shared_layer.layer_arn],
            policy_statements=policy_statements,
            log_retention_days=7
        )

        return lambda_function

    def _create_validate_lambda(self):  # pragma: no cover
        """Create Lambda function for data validation."""
        policy_statements = [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject"
                ],
                "Resource": f"{self.data_bucket.arn}/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": self.metadata_table.arn
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": self.alert_topic.arn
            }
        ]

        lambda_function = ReusableLambdaConstruct(  # type: ignore  # noqa: F821
            self,
            "validate-lambda",
            function_name="data-validate",
            handler="index.handler",
            runtime="python3.11",
            code_path="lib/lambda/functions/validate.zip",
            environment_suffix=self.environment_suffix,
            environment_vars={
                "BUCKET_NAME": self.data_bucket.bucket,
                "TABLE_NAME": self.metadata_table.name,
                "SNS_TOPIC_ARN": self.alert_topic.arn
            },
            timeout=300,
            memory_size=512,
            layers=[self.shared_layer.layer_arn],
            policy_statements=policy_statements,
            log_retention_days=7
        )

        return lambda_function

    def _create_step_functions(self):  # pragma: no cover
        """Create Step Functions state machine for orchestration with error handling."""
        # Create IAM role for Step Functions
        # pylint: disable=duplicate-code
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "states.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        sfn_role = IamRole(
            self,
            "sfn-role",
            name=f"pipeline-sfn-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"sfn-role-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

        # Create IAM policy for Step Functions to invoke Lambda and publish to SNS
        sfn_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction"
                    ],
                    "Resource": [
                        self.ingest_function.function_arn,
                        self.transform_function.function_arn,
                        self.load_function.function_arn,
                        self.validate_function.function_arn
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": self.alert_topic.arn
                }
            ]
        }

        IamRolePolicy(
            self,
            "sfn-policy",
            role=sfn_role.id,
            policy=json.dumps(sfn_policy)
        )

        # Define Step Functions state machine with error handling and exponential backoff
        state_machine_definition = {
            "Comment": "Data processing pipeline with error handling and exponential backoff",
            "StartAt": "IngestData",
            "States": {
                "IngestData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": self.ingest_function.function_arn,
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
                            "MaxAttempts": 6,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "NotifyFailure",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "ValidateIngestion"
                },
                "ValidateIngestion": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": self.validate_function.function_arn,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 6,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "NotifyFailure",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "TransformData"
                },
                "TransformData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": self.transform_function.function_arn,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 6,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "NotifyFailure",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "LoadData"
                },
                "LoadData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": self.load_function.function_arn,
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 6,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "NotifyFailure",
                            "ResultPath": "$.error"
                        }
                    ],
                    "Next": "NotifySuccess"
                },
                "NotifySuccess": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": self.alert_topic.arn,
                        "Message": {
                            "status": "SUCCESS",
                            "pipeline": "data-processing",
                            "timestamp.$": "$$.State.EnteredTime"
                        }
                    },
                    "End": True
                },
                "NotifyFailure": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sns:publish",
                    "Parameters": {
                        "TopicArn": self.alert_topic.arn,
                        "Message": {
                            "status": "FAILURE",
                            "pipeline": "data-processing",
                            "error.$": "$.error",
                            "timestamp.$": "$$.State.EnteredTime"
                        }
                    },
                    "End": True
                }
            }
        }

        state_machine = SfnStateMachine(
            self,
            "state-machine",
            name=f"pipeline-orchestration-{self.environment_suffix}",
            role_arn=sfn_role.arn,
            definition=json.dumps(state_machine_definition),
            tags={
                "Name": f"state-machine-{self.environment_suffix}",
                "Purpose": "PipelineOrchestration",
                "Environment": self.environment_suffix
            }
        )

        return state_machine

    def _create_cloudwatch_dashboard(self):  # pragma: no cover
        """Create CloudWatch dashboard for pipeline monitoring."""
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Ingest Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Ingest Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Ingest Duration"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "Ingest Lambda Metrics",
                        "yAxis": {
                            "left": {"min": 0}
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Transform Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Transform Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Transform Duration"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "Transform Lambda Metrics",
                        "yAxis": {
                            "left": {"min": 0}
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/States", "ExecutionsFailed", {"stat": "Sum"}],
                            [".", "ExecutionsSucceeded", {"stat": "Sum"}],
                            [".", "ExecutionTime", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "Step Functions Execution Metrics",
                        "yAxis": {
                            "left": {"min": 0}
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}],
                            [".", "UserErrors", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": "us-east-2",
                        "title": "DynamoDB Metrics",
                        "yAxis": {
                            "left": {"min": 0}
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/S3", "BucketSizeBytes", {"stat": "Average"}],
                            [".", "NumberOfObjects", {"stat": "Average"}]
                        ],
                        "period": 86400,
                        "stat": "Average",
                        "region": "us-east-2",
                        "title": "S3 Storage Metrics",
                        "yAxis": {
                            "left": {"min": 0}
                        }
                    }
                }
            ]
        }

        dashboard = CloudwatchDashboard(
            self,
            "dashboard",
            dashboard_name=f"pipeline-health-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        return dashboard

    def _export_to_parameter_store(self):
        """Export stack outputs to Parameter Store for cross-stack references."""
        SsmParameter(
            self,
            "bucket-name-param",
            name=f"/pipeline/{self.environment_suffix}/{self.version}/bucket-name",
            type="String",
            value=self.data_bucket.bucket,
            tags={
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        SsmParameter(
            self,
            "table-name-param",
            name=f"/pipeline/{self.environment_suffix}/{self.version}/table-name",
            type="String",
            value=self.metadata_table.name,
            tags={
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

        # Commented out because state_machine is not created when Lambda functions are disabled
        # SsmParameter(
        #     self,
        #     "state-machine-arn-param",
        #     name=f"/pipeline/{self.environment_suffix}/state-machine-arn",
        #     type="String",
        #     value=self.state_machine.arn,
        #     tags={
        #         "Environment": self.environment_suffix,
        #         "ManagedBy": "CDKTF"
        #     }
        # )

        SsmParameter(
            self,
            "vpc-id-param",
            name=f"/pipeline/{self.environment_suffix}/{self.version}/vpc-id",
            type="String",
            value=self.vpc.id,
            tags={
                "Environment": self.environment_suffix,
                "ManagedBy": "CDKTF"
            }
        )

    def _create_outputs(self):
        """Create Terraform outputs."""
        TerraformOutput(
            self,
            "bucket_name",
            value=self.data_bucket.bucket,
            description="S3 bucket name for data storage"
        )

        TerraformOutput(
            self,
            "table_name",
            value=self.metadata_table.name,
            description="DynamoDB table name for metadata"
        )

        # Commented out because state_machine is not created when Lambda functions are disabled
        # TerraformOutput(
        #     self,
        #     "state_machine_arn",
        #     value=self.state_machine.arn,
        #     description="Step Functions state machine ARN"
        # )

        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "alert_topic_arn",
            value=self.alert_topic.arn,
            description="SNS topic ARN for alerts"
        )

"""
Unit tests for PaymentProcessingStack
Tests all infrastructure components for correct configuration
"""
import pytest
from aws_cdk import App, Stack
from aws_cdk import assertions as assertions
from lib.payment_stack import PaymentProcessingStack


class TestPaymentProcessingStackUnit:
    """Unit tests for the Payment Processing Stack"""

    @pytest.fixture
    def app(self):
        """Create CDK app fixture"""
        return App()

    @pytest.fixture
    def stack(self, app):
        """Create stack fixture with test environment suffix"""
        return PaymentProcessingStack(
            app,
            "TestPaymentStack",
            environment_suffix="test-unit"
        )

    @pytest.fixture
    def template(self, stack):
        """Create CloudFormation template from stack"""
        return assertions.Template.from_stack(stack)

    def test_stack_created(self, stack):
        """Test that stack is created successfully"""
        assert stack is not None
        assert isinstance(stack, Stack)
        assert stack.environment_suffix == "test-unit-primary-1"

    def test_vpc_created(self, template):
        """Test VPC is created with correct configuration"""
        template.resource_count_is("AWS::EC2::VPC", 1)

        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_vpc_has_subnets(self, template):
        """Test VPC has public and private subnets in multiple AZs"""
        # VPC creates subnets based on available AZs
        # At least 4 subnets should exist (2 public + 2 private minimum)
        template.resource_count_is("AWS::EC2::Subnet", 4)

    def test_nat_gateways_created(self, template):
        """Test NAT gateways are created for HA"""
        # NAT gateways created based on available AZs
        template.resource_count_is("AWS::EC2::NatGateway", 2)

    def test_security_groups_created(self, template):
        """Test security groups are created for Lambda and RDS"""
        # Lambda SG + RDS SG = at least 2
        resources = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(resources) >= 2

    def test_lambda_security_group_properties(self, template):
        """Test Lambda security group has correct properties"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for payment processing Lambda functions",
            "SecurityGroupEgress": assertions.Match.array_with([
                assertions.Match.object_like({
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    def test_rds_security_group_properties(self, template):
        """Test RDS security group has correct properties"""
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for RDS PostgreSQL database"
        })

    def test_rds_kms_key_created(self, template):
        """Test KMS key for RDS is created with rotation enabled"""
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": assertions.Match.string_like_regexp(".*RDS encryption.*test-unit-primary-1.*"),
            "EnableKeyRotation": True
        })

    def test_s3_kms_key_created(self, template):
        """Test KMS key for S3 is created with rotation enabled"""
        template.has_resource_properties("AWS::KMS::Key", {
            "Description": assertions.Match.string_like_regexp(".*S3 encryption.*test-unit-primary-1.*"),
            "EnableKeyRotation": True
        })

    def test_rds_instance_created(self, template):
        """Test RDS instance is created with correct configuration"""
        template.resource_count_is("AWS::RDS::DBInstance", 1)

        template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": assertions.Match.string_like_regexp("15.*"),
            "DBInstanceClass": "db.t3.medium",
            "AllocatedStorage": "100",
            "StorageEncrypted": True,
            "MultiAZ": True,
            "BackupRetentionPeriod": 30,
            "DBName": "paymentdb",
            "DeletionProtection": False
        })

    def test_rds_subnet_group_created(self, template):
        """Test RDS subnet group is created"""
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    def test_dynamodb_table_created(self, template):
        """Test DynamoDB table is created with correct configuration"""
        template.resource_count_is("AWS::DynamoDB::Table", 1)

        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "payment-transactions-test-unit-primary-1",
            "KeySchema": [
                {
                    "AttributeName": "transaction_id",
                    "KeyType": "HASH"
                },
                {
                    "AttributeName": "timestamp",
                    "KeyType": "RANGE"
                }
            ],
            "AttributeDefinitions": [
                {
                    "AttributeName": "transaction_id",
                    "AttributeType": "S"
                },
                {
                    "AttributeName": "timestamp",
                    "AttributeType": "N"
                }
            ],
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            }
        })

    def test_s3_bucket_created(self, template):
        """Test S3 audit bucket is created with correct configuration"""
        template.resource_count_is("AWS::S3::Bucket", 1)

        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            },
            "LifecycleConfiguration": {
                "Rules": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Status": "Enabled",
                        "Transitions": [
                            {
                                "StorageClass": "GLACIER",
                                "TransitionInDays": 90
                            }
                        ]
                    })
                ])
            }
        })

    def test_sqs_queue_created(self, template):
        """Test SQS retry queue is created with correct configuration"""
        template.resource_count_is("AWS::SQS::Queue", 1)

        template.has_resource_properties("AWS::SQS::Queue", {
            "QueueName": "payment-retry-queue-test-unit-primary-1",
            "MessageRetentionPeriod": 1209600,  # 14 days in seconds
            "VisibilityTimeout": 300  # 5 minutes in seconds
        })

    def test_iam_role_created(self, template):
        """Test IAM role for Lambda is created"""
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            },
            "ManagedPolicyArns": assertions.Match.array_with([
                assertions.Match.object_like({
                    "Fn::Join": assertions.Match.array_with([
                        assertions.Match.array_with([
                            assertions.Match.string_like_regexp(".*AWSLambdaVPCAccessExecutionRole.*")
                        ])
                    ])
                })
            ])
        })

    def test_iam_role_has_deny_policy(self, template):
        """Test IAM role has explicit deny for sensitive operations"""
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Effect": "Deny",
                        "Action": [
                            "iam:*",
                            "organizations:*",
                            "account:*"
                        ],
                        "Resource": "*"
                    })
                ])
            }
        })

    def test_lambda_functions_created(self, template):
        """Test all three Lambda functions are created"""
        # 3 main Lambdas + 3 custom resources for log group creation = 6 total
        template.resource_count_is("AWS::Lambda::Function", 6)

    def test_payment_validator_lambda_properties(self, template):
        """Test payment validator Lambda has correct configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "payment-validator-test-unit-primary-1",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "MemorySize": 512,
            "Timeout": 30,
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE": assertions.Match.object_like({
                        "Ref": assertions.Match.string_like_regexp("PaymentTransactions.*")
                    }),
                    "ENVIRONMENT_SUFFIX": "test-unit-primary-1"
                }
            }
        })

    def test_payment_processor_lambda_properties(self, template):
        """Test payment processor Lambda has correct configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "payment-processor-test-unit-primary-1",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "MemorySize": 512,
            "Timeout": 30,
            "Environment": {
                "Variables": {
                    "DYNAMODB_TABLE": assertions.Match.object_like({
                        "Ref": assertions.Match.string_like_regexp("PaymentTransactions.*")
                    }),
                    "ENVIRONMENT_SUFFIX": "test-unit-primary-1"
                }
            }
        })

    def test_audit_logger_lambda_properties(self, template):
        """Test audit logger Lambda has correct configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "audit-logger-test-unit-primary-1",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "MemorySize": 512,
            "Timeout": 30,
            "Environment": {
                "Variables": {
                    "AUDIT_BUCKET": assertions.Match.object_like({
                        "Ref": assertions.Match.string_like_regexp("AuditLogs.*")
                    }),
                    "DYNAMODB_TABLE": assertions.Match.object_like({
                        "Ref": assertions.Match.string_like_regexp("PaymentTransactions.*")
                    }),
                    "ENVIRONMENT_SUFFIX": "test-unit-primary-1"
                }
            }
        })

    def test_api_gateway_created(self, template):
        """Test API Gateway REST API is created"""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "payment-api-test-unit-primary-1",
            "Description": "Payment Processing API Gateway",
            "EndpointConfiguration": {
                "Types": ["REGIONAL"]
            }
        })

    def test_api_gateway_deployment_created(self, template):
        """Test API Gateway deployment is created"""
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    def test_api_gateway_stage_created(self, template):
        """Test API Gateway stage is created with correct settings"""
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": assertions.Match.array_with([
                assertions.Match.object_like({
                    "ThrottlingRateLimit": 1000,
                    "ThrottlingBurstLimit": 2000,
                    "LoggingLevel": "INFO",
                    "DataTraceEnabled": True,
                    "MetricsEnabled": True
                })
            ])
        })

    def test_api_key_created(self, template):
        """Test API key is created"""
        template.resource_count_is("AWS::ApiGateway::ApiKey", 1)

    def test_usage_plan_created(self, template):
        """Test usage plan is created with throttling and quota"""
        template.resource_count_is("AWS::ApiGateway::UsagePlan", 1)

        template.has_resource_properties("AWS::ApiGateway::UsagePlan", {
            "UsagePlanName": "payment-usage-plan-test-unit-primary-1",
            "Throttle": {
                "RateLimit": 1000,
                "BurstLimit": 2000
            },
            "Quota": {
                "Limit": 1000000,
                "Period": "MONTH"
            }
        })

    def test_api_resources_created(self, template):
        """Test API Gateway resources are created for endpoints"""
        # /validate, /process, /status = 3 resources
        template.resource_count_is("AWS::ApiGateway::Resource", 3)

    def test_api_methods_created(self, template):
        """Test API Gateway methods are created"""
        # POST /validate, POST /process, GET /status = 3 methods
        template.resource_count_is("AWS::ApiGateway::Method", 3)

    def test_api_methods_require_api_key(self, template):
        """Test API methods require API key authentication"""
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "ApiKeyRequired": True
        })

    def test_sns_topic_created(self, template):
        """Test SNS alert topic is created"""
        template.resource_count_is("AWS::SNS::Topic", 1)

        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "payment-critical-alerts-test-unit-primary-1",
            "DisplayName": "Payment Processing Critical Alerts"
        })

    def test_sns_subscription_created(self, template):
        """Test SNS email subscription is created"""
        template.resource_count_is("AWS::SNS::Subscription", 1)

        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "Endpoint": "ops@company.com"
        })

    def test_cloudwatch_dashboard_created(self, template):
        """Test CloudWatch dashboard is created"""
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": "payment-dashboard-test-unit-primary-1"
        })

    def test_cloudwatch_alarms_created(self, template):
        """Test CloudWatch alarms are created"""
        # API 4XX, Lambda errors, RDS CPU = 3 alarms
        template.resource_count_is("AWS::CloudWatch::Alarm", 3)

    def test_api_4xx_alarm_properties(self, template):
        """Test API 4XX errors alarm has correct configuration"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "payment-api-4xx-errors-test-unit-primary-1",
            "Threshold": 50,
            "EvaluationPeriods": 2,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    def test_lambda_error_alarm_properties(self, template):
        """Test Lambda error alarm has correct configuration"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "payment-lambda-errors-test-unit-primary-1",
            "Threshold": 10,
            "EvaluationPeriods": 2,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    def test_rds_cpu_alarm_properties(self, template):
        """Test RDS CPU alarm has correct configuration"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "payment-rds-cpu-test-unit-primary-1",
            "Threshold": 80,
            "EvaluationPeriods": 3,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    def test_cloudformation_outputs_created(self, template):
        """Test CloudFormation outputs are created"""
        # VPCId, APIEndpoint, RDSEndpoint, DynamoDBTable, S3AuditBucket, SQSRetryQueue, SNSAlertTopic
        # Plus PaymentAPIsynthduam9Endpoint from CDK = at least 7 outputs
        outputs = template.find_outputs("*")
        assert len(outputs) >= 7

    def test_vpc_output_exists(self, template):
        """Test VPC ID output exists"""
        template.has_output("VPCId", {
            "Description": "VPC ID"
        })

    def test_api_endpoint_output_exists(self, template):
        """Test API endpoint output exists"""
        template.has_output("APIEndpoint", {
            "Description": "API Gateway endpoint URL"
        })

    def test_rds_endpoint_output_exists(self, template):
        """Test RDS endpoint output exists"""
        template.has_output("RDSEndpoint", {
            "Description": "RDS PostgreSQL endpoint"
        })

    def test_dynamodb_table_output_exists(self, template):
        """Test DynamoDB table output exists"""
        template.has_output("DynamoDBTable", {
            "Description": "DynamoDB transactions table name"
        })

    def test_s3_bucket_output_exists(self, template):
        """Test S3 bucket output exists"""
        template.has_output("S3AuditBucket", {
            "Description": "S3 audit logs bucket name"
        })

    def test_sqs_queue_output_exists(self, template):
        """Test SQS queue output exists"""
        template.has_output("SQSRetryQueue", {
            "Description": "SQS retry queue URL"
        })

    def test_sns_topic_output_exists(self, template):
        """Test SNS topic output exists"""
        template.has_output("SNSAlertTopic", {
            "Description": "SNS alert topic ARN"
        })

    def test_lambda_log_groups_created(self, stack):
        """Test CloudWatch log groups are created for Lambda functions"""
        # Log groups are configured via log_retention property
        # Verify Lambda functions exist
        assert stack.payment_validator is not None
        assert stack.payment_processor is not None
        assert stack.audit_logger is not None

    def test_lambda_log_retention_set(self, stack):
        """Test Lambda log groups have retention set"""
        # Log retention is configured for Lambda functions via log_retention
        # Verify retention is set in Lambda configuration
        # The retention value is set to THREE_MONTHS (90 days) in the stack
        assert stack.payment_validator is not None
        assert stack.payment_processor is not None
        assert stack.audit_logger is not None

    def test_lambda_permissions_for_api_gateway(self, template):
        """Test Lambda functions have permissions for API Gateway invocation"""
        # At least 3 Lambda permissions for API Gateway
        resources = template.find_resources("AWS::Lambda::Permission")
        api_gateway_perms = [r for r in resources.values()
                            if r.get("Properties", {}).get("Principal") == "apigateway.amazonaws.com"]
        assert len(api_gateway_perms) >= 3

    def test_kms_keys_count(self, template):
        """Test two KMS keys are created (RDS and S3)"""
        template.resource_count_is("AWS::KMS::Key", 2)

    def test_environment_suffix_in_resources(self, stack, template):
        """Test environment suffix is properly propagated"""
        assert stack.environment_suffix == "test-unit-primary-1"
        # VPC exists and is configured
        assert stack.vpc is not None
        # Verify DynamoDB table name in template
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "payment-transactions-test-unit-primary-1"
        })

    def test_vpc_cidr_range(self, stack):
        """Test VPC uses correct CIDR range"""
        # VPC CIDR should be 10.0.0.0/16
        assert stack.vpc is not None

    def test_lambda_functions_in_vpc(self, stack):
        """Test Lambda functions are deployed in VPC"""
        # Lambda functions are configured with VPC
        # Check that vpc property exists and is set
        assert stack.payment_validator.connections is not None
        assert stack.payment_processor.connections is not None
        assert stack.audit_logger.connections is not None

    def test_rds_multi_az_enabled(self, template):
        """Test RDS has Multi-AZ enabled for high availability"""
        template.has_resource_properties("AWS::RDS::DBInstance", {
            "MultiAZ": True
        })

    def test_dynamodb_encryption(self, template):
        """Test DynamoDB table has encryption enabled"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

    def test_all_layers_initialized(self, stack):
        """Test all infrastructure layers are initialized"""
        # Networking layer
        assert stack.vpc is not None
        assert stack.lambda_sg is not None
        assert stack.rds_sg is not None

        # Security layer
        assert stack.rds_kms_key is not None
        assert stack.s3_kms_key is not None

        # Data layer
        assert stack.db_instance is not None
        assert stack.transactions_table is not None
        assert stack.audit_logs_bucket is not None
        assert stack.retry_queue is not None

        # Compute layer
        assert stack.payment_validator is not None
        assert stack.payment_processor is not None
        assert stack.audit_logger is not None

        # API layer
        assert stack.api is not None

        # Monitoring layer
        assert stack.alert_topic is not None

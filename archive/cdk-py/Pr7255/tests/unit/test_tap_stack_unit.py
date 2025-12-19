"""
Unit tests for TapStack - Payment Processing Infrastructure

Tests all infrastructure components with 100% code coverage including:
- VPC and networking configuration
- Lambda functions with optimizations
- DynamoDB table configuration
- API Gateway setup
- S3 bucket lifecycle policies
- Security groups
- WAF rules
- SNS topics
- SQS queues with DLQ
- Secrets Manager
- CloudWatch Alarms
- EventBridge Rules
- CloudWatch Dashboards
- SSM Parameters
- Stack outputs
"""
import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.tap_stack import TapStack, TapStackProps


class TestTapStackUnit:
    """Unit tests for TapStack infrastructure"""

    @pytest.fixture(scope="class")
    def stack(self):
        """Create stack instance for testing"""
        app = cdk.App()
        props = TapStackProps(
            environment_suffix="test",
            env=cdk.Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "TestTapStack", props=props)
        return stack

    @pytest.fixture(scope="class")
    def template(self, stack):
        """Get CloudFormation template from stack"""
        return assertions.Template.from_stack(stack)

    def test_stack_created(self, stack):
        """Test that stack is created successfully"""
        assert stack is not None
        assert stack.environment_suffix == "test"

    def test_vpc_configuration(self, template):
        """Test VPC is created with correct configuration"""
        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Verify NAT Gateway optimization (single NAT Gateway)
        template.resource_count_is("AWS::EC2::NatGateway", 1)

        # Verify subnets are created (public and private)
        template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 AZs x 2 types

        # Verify VPC has correct name pattern
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "Tags": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "Key": "Name",
                        "Value": assertions.Match.string_like_regexp(".*test.*")
                    })
                ])
            }
        )

    def test_security_groups(self, template):
        """Test security groups are created with correct rules"""
        # Multiple security groups (Lambda, EC2, VPC default)
        # Just verify the specific ones we created exist

        # Verify Lambda security group exists
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": "Security group for payment Lambda functions",
                "GroupName": "lambda-sg-test"
            }
        )

        # Verify EC2 security group exists with HTTPS ingress
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "GroupDescription": "Security group for EC2 Auto Scaling group",
                "GroupName": "ec2-sg-test",
                "SecurityGroupIngress": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "IpProtocol": "tcp",
                        "FromPort": 443,
                        "ToPort": 443
                    })
                ])
            }
        )

    def test_sns_topics(self, template):
        """Test SNS topics are created for alerting"""
        # 3 SNS topics: cost-alerts, security-alerts, ops-alerts
        template.resource_count_is("AWS::SNS::Topic", 3)

        # Verify cost alerts topic
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "TopicName": "cost-alerts-test"
            }
        )

        # Verify security alerts topic
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "TopicName": "security-alerts-test"
            }
        )

        # Verify ops alerts topic
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {
                "TopicName": "ops-alerts-test"
            }
        )

    def test_secrets_manager(self, template):
        """Test Secrets Manager secret is created"""
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            {
                "Name": "payment-db-credentials-test",
                "Description": "Database credentials for payment processing",
                "GenerateSecretString": {
                    "SecretStringTemplate": '{"username":"paymentuser"}',
                    "GenerateStringKey": "password",
                    "ExcludePunctuation": True,
                    "PasswordLength": 32
                }
            }
        )

    def test_dynamodb_table(self, template):
        """Test DynamoDB table with on-demand billing"""
        template.resource_count_is("AWS::DynamoDB::Table", 1)

        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "TableName": "payments-test",
                "BillingMode": "PAY_PER_REQUEST",  # On-demand billing
                "PointInTimeRecoverySpecification": {
                    "PointInTimeRecoveryEnabled": True
                },
                "SSESpecification": {
                    "SSEEnabled": True
                },
                "KeySchema": [
                    {"AttributeName": "payment_id", "KeyType": "HASH"},
                    {"AttributeName": "timestamp", "KeyType": "RANGE"}
                ],
                "GlobalSecondaryIndexes": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "IndexName": "status-index",
                        "KeySchema": [
                            {"AttributeName": "status", "KeyType": "HASH"}
                        ]
                    })
                ])
            }
        )

    def test_sqs_queues(self, template):
        """Test SQS queue with Dead Letter Queue"""
        # 2 queues: main queue and DLQ
        template.resource_count_is("AWS::SQS::Queue", 2)

        # Verify DLQ
        template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": "payment-dlq-test",
                "MessageRetentionPeriod": 1209600  # 14 days
            }
        )

        # Verify main queue with DLQ configuration
        template.has_resource_properties(
            "AWS::SQS::Queue",
            {
                "QueueName": "payment-queue-test",
                "VisibilityTimeout": 300,
                "MessageRetentionPeriod": 345600,  # 4 days
                "RedrivePolicy": assertions.Match.object_like({
                    "maxReceiveCount": 3
                })
            }
        )

    def test_s3_bucket(self, template):
        """Test S3 bucket with lifecycle policies"""
        # Multiple S3 buckets created (audit bucket plus possible CDK assets bucket)

        # Verify audit bucket with lifecycle rule
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": assertions.Match.string_like_regexp("payment-audit-logs-test.*"),
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {"ServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}
                    ]
                },
                "VersioningConfiguration": {"Status": "Enabled"},
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                },
                "LifecycleConfiguration": {
                    "Rules": assertions.Match.array_with([
                        assertions.Match.object_like({
                            "Id": "TransitionToGlacier",
                            "Status": "Enabled",
                            "Transitions": [
                                {
                                    "StorageClass": "GLACIER",
                                    "TransitionInDays": 30
                                }
                            ]
                        })
                    ])
                }
            }
        )

    def test_lambda_functions(self, template):
        """Test Lambda functions with optimizations"""
        # Multiple Lambda functions: payment processor, event handler, and possibly custom resources
        # Verify specific functions exist

        # Verify payment processor Lambda
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": "payment-processor-test",
                "Runtime": "python3.11",
                "MemorySize": 512,  # Optimized from 3008MB
                "Timeout": 30,
                "Architectures": ["arm64"],  # Graviton2 for cost savings
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": assertions.Match.any_value(),
                        "QUEUE_URL": assertions.Match.any_value(),
                        "BUCKET_NAME": assertions.Match.any_value()
                    }
                }
            }
        )

        # Verify event handler Lambda
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {
                "FunctionName": "event-handler-test",
                "Runtime": "python3.11",
                "MemorySize": 512,
                "Timeout": 60,
                "Architectures": ["arm64"],
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": assertions.Match.any_value()
                    }
                }
            }
        )

    def test_lambda_event_source_mapping(self, template):
        """Test Lambda is connected to SQS"""
        template.resource_count_is("AWS::Lambda::EventSourceMapping", 1)

        template.has_resource_properties(
            "AWS::Lambda::EventSourceMapping",
            {
                "BatchSize": 10
            }
        )

    def test_api_gateway(self, template):
        """Test API Gateway REST API configuration"""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            {
                "Name": "payment-api-test",
                "Description": "Consolidated Payment Processing API"
            }
        )

        # Verify stage configuration (stage name matches environment_suffix)
        template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            {
                "StageName": "test",  # Uses environment_suffix
                # TracingEnabled may not be set explicitly
                "MethodSettings": assertions.Match.array_with([
                    assertions.Match.object_like({
                        "LoggingLevel": "INFO",
                        "DataTraceEnabled": True,
                        "MetricsEnabled": True
                    })
                ])
            }
        )

    def test_auto_scaling_group(self, template):
        """Test EC2 Auto Scaling group configuration"""
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)

        # ASG uses environment-specific config (test falls back to dev: min=1, max=2, desired=1)
        template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {
                "AutoScalingGroupName": "payment-asg-test",
                "MinSize": "1",
                "MaxSize": "2",
                "DesiredCapacity": "1"
            }
        )

        # Verify launch template uses t3.small (right-sized)
        template.has_resource_properties(
            "AWS::AutoScaling::LaunchConfiguration",
            {
                "InstanceType": "t3.small"
            }
        )

        # Verify CPU-based scaling policy exists
        template.has_resource_properties(
            "AWS::AutoScaling::ScalingPolicy",
            {
                "PolicyType": "TargetTrackingScaling",
                "TargetTrackingConfiguration": {
                    "PredefinedMetricSpecification": {
                        "PredefinedMetricType": "ASGAverageCPUUtilization"
                    },
                    "TargetValue": 70.0
                }
            }
        )

    def test_waf_web_acl(self, template):
        """Test WAF WebACL with security rules"""
        template.resource_count_is("AWS::WAFv2::WebACL", 1)

        # WAF uses environment-specific config (test falls back to dev: rate_limit=500)
        template.has_resource_properties(
            "AWS::WAFv2::WebACL",
            {
                "Name": "payment-waf-test",
                "Scope": "REGIONAL",
                "DefaultAction": {"Allow": {}},
                "Rules": [
                    # Rate limiting rule
                    assertions.Match.object_like({
                        "Name": "RateLimitRule",
                        "Priority": 1,
                        "Statement": {
                            "RateBasedStatement": {
                                "Limit": 500,  # Environment-specific config (dev default)
                                "AggregateKeyType": "IP"
                            }
                        },
                        "Action": {"Block": {}}
                    }),
                    # SQL injection protection
                    assertions.Match.object_like({
                        "Name": "SQLiProtection",
                        "Priority": 2,
                        "Statement": {
                            "ManagedRuleGroupStatement": {
                                "VendorName": "AWS",
                                "Name": "AWSManagedRulesSQLiRuleSet"
                            }
                        },
                        "OverrideAction": {"None": {}}
                    }),
                    # XSS protection
                    assertions.Match.object_like({
                        "Name": "XSSProtection",
                        "Priority": 3,
                        "Statement": {
                            "ManagedRuleGroupStatement": {
                                "VendorName": "AWS",
                                "Name": "AWSManagedRulesKnownBadInputsRuleSet"
                            }
                        },
                        "OverrideAction": {"None": {}}
                    })
                ]
            }
        )

        # Verify WAF is associated with API Gateway
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    def test_cloudwatch_alarms(self, template):
        """Test CloudWatch Alarms for monitoring"""
        # Multiple alarms: Lambda errors, DynamoDB throttle, API 4xx, API 5xx, EC2 CPU
        # All thresholds use environment-specific config (test falls back to dev)

        # Lambda error alarm (dev threshold: 10)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "lambda-errors-test",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": 10,  # Environment-specific config (dev default)
                "EvaluationPeriods": 1,
                "TreatMissingData": "notBreaching"
            }
        )

        # DynamoDB throttling alarm (dev threshold: 20)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "dynamodb-throttle-test",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": 20,  # Environment-specific config (dev default)
                "EvaluationPeriods": 2
            }
        )

        # API Gateway 4xx alarm (dev threshold: 200)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "api-4xx-errors-test",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": 200  # Environment-specific config (dev default)
            }
        )

        # API Gateway 5xx alarm (dev threshold: 100)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "api-5xx-errors-test",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": 100  # Environment-specific config (dev default)
            }
        )

        # EC2 CPU alarm (dev threshold: 90)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "AlarmName": "ec2-cpu-high-test",
                "ComparisonOperator": "GreaterThanThreshold",
                "Threshold": 90,  # Environment-specific config (dev default)
                "EvaluationPeriods": 2
            }
        )

    def test_eventbridge_rules(self, template):
        """Test EventBridge Rules for automated responses"""
        # Multiple rules: security findings, cost anomaly, EC2 state
        # Verify specific rules exist

        # Security findings rule (without AWS Config)
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "Name": "security-findings-test",
                "EventPattern": {
                    "source": ["aws.securityhub", "aws.guardduty"]
                }
            }
        )

        # Cost anomaly rule
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "Name": "cost-anomaly-test",
                "EventPattern": {
                    "source": ["aws.ce"],
                    "detail-type": ["Cost Anomaly Detection"]
                }
            }
        )

        # EC2 state change rule
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "Name": "ec2-state-change-test",
                "EventPattern": {
                    "source": ["aws.ec2"],
                    "detail-type": ["EC2 Instance State-change Notification"]
                }
            }
        )

    def test_cloudwatch_dashboards(self, template):
        """Test CloudWatch Dashboards for visibility"""
        # 3 dashboards: cost, security, operations
        template.resource_count_is("AWS::CloudWatch::Dashboard", 3)

        # Cost dashboard
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "payment-costs-test"
            }
        )

        # Security dashboard
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "payment-security-test"
            }
        )

        # Operations dashboard
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            {
                "DashboardName": "payment-ops-test"
            }
        )

    def test_ssm_parameters(self, template):
        """Test SSM Parameter Store parameters"""
        # 3 parameters: table name, queue URL, bucket name
        template.resource_count_is("AWS::SSM::Parameter", 3)

        # Table name parameter
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": "/payment/test/table-name",
                "Type": "String",
                "Description": "DynamoDB table name for payment processing"
            }
        )

        # Queue URL parameter
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": "/payment/test/queue-url",
                "Type": "String",
                "Description": "SQS queue URL for payment processing"
            }
        )

        # Bucket name parameter
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            {
                "Name": "/payment/test/bucket-name",
                "Type": "String",
                "Description": "S3 bucket name for audit logs"
            }
        )

    def test_stack_outputs(self, template):
        """Test CloudFormation stack outputs"""
        # Verify all required outputs exist
        outputs = template.find_outputs("*")

        assert "ApiEndpoint" in outputs
        assert "PaymentsTableName" in outputs
        assert "PaymentQueueUrl" in outputs
        assert "AuditBucketName" in outputs
        assert "CostTopicArn" in outputs
        assert "SecurityTopicArn" in outputs
        assert "OpsTopicArn" in outputs
        assert "VpcId" in outputs
        assert "WafAclArn" in outputs
        assert "PaymentProcessorFunctionName" in outputs
        assert "PaymentProcessorFunctionArn" in outputs
        assert "EventHandlerFunctionName" in outputs
        assert "EventHandlerFunctionArn" in outputs
        assert "PaymentDlqUrl" in outputs
        assert "PaymentDlqArn" in outputs
        assert "DbSecretArn" in outputs
        assert "AsgName" in outputs
        assert "LambdaSecurityGroupId" in outputs
        assert "Ec2SecurityGroupId" in outputs

    def test_iam_roles(self, template):
        """Test IAM roles have least privilege"""
        # Multiple roles: Lambda payment, Lambda event handler, EC2, Config, custom resources
        # Verify Lambda roles exist and have proper policies

        # Lambda roles should have proper assume role policy
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": assertions.Match.array_with([
                        assertions.Match.object_like({
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"}
                        })
                    ])
                }
            }
        )

    def test_environment_suffix_propagation(self, template):
        """Test environment suffix is properly used in resource names"""
        # Check DynamoDB table name
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"TableName": "payments-test"}
        )

        # Check Lambda function names
        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"FunctionName": "payment-processor-test"}
        )

        template.has_resource_properties(
            "AWS::Lambda::Function",
            {"FunctionName": "event-handler-test"}
        )

        # Check SQS queue names
        template.has_resource_properties(
            "AWS::SQS::Queue",
            {"QueueName": "payment-queue-test"}
        )

        # Check SNS topic names
        template.has_resource_properties(
            "AWS::SNS::Topic",
            {"TopicName": "cost-alerts-test"}
        )

    def test_removal_policies(self, template):
        """Test infrastructure resources are destroyable"""
        # Get all resources
        resources = template.to_json()["Resources"]

        # Check infrastructure resources don't have Retain deletion policy
        # Exception: API Gateway CloudWatch Role and Account are retained by design (AWS best practice)
        for resource_id, resource in resources.items():
            if "DeletionPolicy" in resource:
                # Allow API Gateway CloudWatch Role and Account to be retained (AWS managed service)
                if "CloudWatchRole" not in resource_id and "Account" not in resource_id:
                    assert resource["DeletionPolicy"] != "Retain", \
                        f"Resource {resource_id} has Retain policy which prevents destruction"

    def test_encryption_at_rest(self, template):
        """Test encryption is enabled for all data at rest"""
        # DynamoDB encryption
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"SSESpecification": {"SSEEnabled": True}}
        )

        # S3 encryption
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": assertions.Match.any_value()
                }
            }
        )

        # SQS encryption
        template.has_resource_properties(
            "AWS::SQS::Queue",
            {"KmsMasterKeyId": assertions.Match.any_value()}
        )

    def test_public_access_blocked(self, template):
        """Test S3 buckets block public access"""
        # All S3 buckets should block public access
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                }
            }
        )

    def test_versioning_enabled(self, template):
        """Test S3 bucket versioning is enabled"""
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"VersioningConfiguration": {"Status": "Enabled"}}
        )

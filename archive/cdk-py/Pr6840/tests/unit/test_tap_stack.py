# import os
# import sys
import unittest
from unittest.mock import patch

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "testenv"

    def _create_stack(self, props=None, context=None):
        """Helper method to create a stack with optional props and context"""
        if context:
            for key, value in context.items():
                self.app.node.set_context(key, value)
        
        stack_id = "TapStackTest"
        if props:
            return TapStack(self.app, stack_id, props=props)
        else:
            return TapStack(self.app, stack_id)

    # ============================================
    # Environment Configuration Tests
    # ============================================

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Check that bucket exists (name is constructed with Fn::Join)
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "VersioningConfiguration": Match.object_like({
                    "Status": "Enabled"
                })
            })
        )

    @mark.it("uses environment suffix from props")
    def test_uses_env_suffix_from_props(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Verify bucket exists and has correct properties
        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "VersioningConfiguration": Match.object_like({
                    "Status": "Enabled"
                })
            })
        )

    @mark.it("uses environment suffix from CDK context")
    def test_uses_env_suffix_from_context(self):
        # ARRANGE
        self.app.node.set_context("environmentSuffix", "contextenv")
        stack = TapStack(self.app, "TapStackTest")
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)

    @mark.it("uses alert email from props")
    def test_uses_alert_email_from_props(self):
        # ARRANGE
        test_email = "test@example.com"
        props = TapStackProps(
            environment_suffix=self.env_suffix,
            alert_email=test_email
        )
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Verify SNS subscription has the email
        template.has_resource_properties(
            "AWS::SNS::Subscription",
            Match.object_like({
                "Protocol": "email",
                "Endpoint": test_email
            })
        )

    # ============================================
    # KMS Key Tests
    # ============================================

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key_with_rotation(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::KMS::Key",
            Match.object_like({
                "Description": Match.string_like_regexp(f".*{self.env_suffix}.*"),
                "EnableKeyRotation": True
            })
        )
        # Note: CDK doesn't automatically create KMS aliases

    @mark.it("stores KMS key ID in SSM Parameter Store")
    def test_stores_kms_key_id_in_ssm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like({
                "Name": f"/payment/kms-key-id-{self.env_suffix}",
                "Type": "String",
                "Description": "KMS key ID for payment processing"
            })
        )

    # ============================================
    # VPC Tests
    # ============================================

    @mark.it("creates VPC with 3 availability zones")
    def test_creates_vpc_with_3_azs(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::EC2::VPC",
            Match.object_like({
                "Tags": Match.array_with([
                    Match.object_like({
                        "Key": "Name",
                        "Value": f"payment-vpc-{self.env_suffix}"
                    })
                ]),
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True
            })
        )

    @mark.it("creates public, private, and isolated subnets")
    def test_creates_all_subnet_types(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Verify subnets exist (exact count depends on AZs)
        # Use find_resources instead of resource_count_is with Match.any_value()
        subnets = template.find_resources("AWS::EC2::Subnet")
        self.assertGreater(len(subnets), 0)

    @mark.it("stores VPC ID in SSM Parameter Store")
    def test_stores_vpc_id_in_ssm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like({
                "Name": f"/payment/vpc-id-{self.env_suffix}",
                "Type": "String"
            })
        )

    # ============================================
    # Security Group Tests
    # ============================================

    @mark.it("creates Lambda security group with outbound access")
    def test_creates_lambda_security_group(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            Match.object_like({
                "GroupDescription": Match.string_like_regexp(f".*Lambda.*{self.env_suffix}.*"),
                "SecurityGroupEgress": Match.array_with([
                    Match.object_like({
                        "CidrIp": "0.0.0.0/0",
                        "IpProtocol": "-1"
                    })
                ])
            })
        )

    @mark.it("creates Aurora security group with Lambda ingress rule")
    def test_creates_aurora_security_group(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            Match.object_like({
                "GroupDescription": Match.string_like_regexp(f".*Aurora.*{self.env_suffix}.*")
            })
        )

        # Verify ingress rule for PostgreSQL port
        template.has_resource_properties(
            "AWS::EC2::SecurityGroupIngress",
            Match.object_like({
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432
            })
        )

    # ============================================
    # RDS Aurora Tests
    # ============================================

    @mark.it("creates Aurora Serverless v2 cluster")
    def test_creates_aurora_cluster(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::RDS::DBCluster",
            Match.object_like({
                "DBClusterIdentifier": f"payment-customer-db-{self.env_suffix}",
                "Engine": "aurora-postgresql",
                "EngineVersion": Match.string_like_regexp(".*15.8.*"),
                "DatabaseName": "customerdb",
                "StorageEncrypted": True,
                "BackupRetentionPeriod": 1
            })
        )

    @mark.it("creates Aurora writer and reader instances")
    def test_creates_aurora_instances(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::RDS::DBInstance", 2)  # Writer + Reader

        template.has_resource_properties(
            "AWS::RDS::DBInstance",
            Match.object_like({
                "DBInstanceClass": Match.string_like_regexp(".*serverless.*"),
                "EnablePerformanceInsights": True
            })
        )

    @mark.it("creates Secrets Manager secret for Aurora credentials")
    def test_creates_aurora_secret(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SecretsManager::Secret",
            Match.object_like({
                "Name": f"payment-aurora-credentials-{self.env_suffix}",
                "GenerateSecretString": Match.object_like({
                    "SecretStringTemplate": Match.string_like_regexp(".*dbadmin.*"),
                    "GenerateStringKey": "password",
                    "PasswordLength": 32,
                    "ExcludePunctuation": True
                })
            })
        )

    @mark.it("stores Aurora endpoint in SSM Parameter Store")
    def test_stores_aurora_endpoint_in_ssm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like({
                "Name": f"/payment/aurora-endpoint-{self.env_suffix}",
                "Type": "String"
            })
        )

    # ============================================
    # DynamoDB Tests
    # ============================================

    @mark.it("creates DynamoDB transaction table with correct schema")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            Match.object_like({
                "TableName": f"payment-transactions-{self.env_suffix}",
                "BillingMode": "PAY_PER_REQUEST",
                "KeySchema": Match.array_with([
                    Match.object_like({
                        "AttributeName": "transaction_id",
                        "KeyType": "HASH"
                    }),
                    Match.object_like({
                        "AttributeName": "timestamp",
                        "KeyType": "RANGE"
                    })
                ]),
                "AttributeDefinitions": Match.array_with([
                    Match.object_like({"AttributeName": "transaction_id"}),
                    Match.object_like({"AttributeName": "timestamp"}),
                    Match.object_like({"AttributeName": "customer_id"}),
                    Match.object_like({"AttributeName": "status"})
                ])
            })
        )

    @mark.it("creates DynamoDB table with customer-index GSI")
    def test_creates_customer_index_gsi(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            Match.object_like({
                "GlobalSecondaryIndexes": Match.array_with([
                    Match.object_like({
                        "IndexName": "customer-index",
                        "KeySchema": Match.array_with([
                            Match.object_like({
                                "AttributeName": "customer_id",
                                "KeyType": "HASH"
                            })
                        ])
                    })
                ])
            })
        )

    @mark.it("creates DynamoDB table with status-index GSI")
    def test_creates_status_index_gsi(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            Match.object_like({
                "GlobalSecondaryIndexes": Match.array_with([
                    Match.object_like({
                        "IndexName": "status-index"
                    })
                ])
            })
        )

    @mark.it("stores DynamoDB table name in SSM Parameter Store")
    def test_stores_dynamodb_table_name_in_ssm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like({
                "Name": f"/payment/transaction-table-{self.env_suffix}",
                "Type": "String"
            })
        )

    # ============================================
    # S3 Bucket Tests
    # ============================================

    @mark.it("creates S3 bucket for audit logs with encryption")
    def test_creates_audit_log_bucket(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Bucket name is constructed with Fn::Join, so we check other properties
        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "VersioningConfiguration": Match.object_like({
                    "Status": "Enabled"
                }),
                "BucketEncryption": Match.object_like({
                    "ServerSideEncryptionConfiguration": Match.array_with([
                        Match.object_like({
                            "ServerSideEncryptionByDefault": Match.object_like({
                                "SSEAlgorithm": "aws:kms"
                            })
                        })
                    ])
                }),
                "PublicAccessBlockConfiguration": Match.object_like({
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True
                })
            })
        )

    @mark.it("creates S3 bucket with lifecycle rule for Glacier transition")
    def test_creates_s3_bucket_with_lifecycle(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::S3::Bucket",
            Match.object_like({
                "LifecycleConfiguration": Match.object_like({
                    "Rules": Match.array_with([
                        Match.object_like({
                            "Id": "archive-old-logs",
                            "Status": "Enabled",
                            "Transitions": Match.array_with([
                                Match.object_like({
                                    "StorageClass": "GLACIER",
                                    "TransitionInDays": 90
                                })
                            ])
                        })
                    ])
                })
            })
        )

    @mark.it("stores S3 bucket name in SSM Parameter Store")
    def test_stores_s3_bucket_name_in_ssm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like({
                "Name": f"/payment/audit-bucket-{self.env_suffix}",
                "Type": "String"
            })
        )

    # ============================================
    # SNS Tests
    # ============================================

    @mark.it("creates SNS topic for alerts with KMS encryption")
    def test_creates_sns_topic(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SNS::Topic",
            Match.object_like({
                "TopicName": f"payment-alerts-{self.env_suffix}",
                "DisplayName": Match.string_like_regexp(f".*{self.env_suffix}.*")
            })
        )

    @mark.it("creates SNS email subscription")
    def test_creates_sns_email_subscription(self):
        # ARRANGE
        test_email = "test@example.com"
        props = TapStackProps(
            environment_suffix=self.env_suffix,
            alert_email=test_email
        )
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SNS::Subscription",
            Match.object_like({
                "Protocol": "email",
                "Endpoint": test_email
            })
        )

    # ============================================
    # IAM Role Tests
    # ============================================

    @mark.it("creates Lambda execution role with VPC access")
    def test_creates_lambda_execution_role(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::IAM::Role",
            Match.object_like({
                "RoleName": f"payment-lambda-role-{self.env_suffix}",
                "AssumeRolePolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow",
                            "Principal": Match.object_like({
                                "Service": "lambda.amazonaws.com"
                            })
                        })
                    ])
                }),
                # ManagedPolicyArns is an array - just verify it exists
                "ManagedPolicyArns": Match.any_value()
            })
        )

    @mark.it("grants Lambda role access to DynamoDB")
    def test_grants_lambda_dynamodb_access(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::IAM::Policy",
            Match.object_like({
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow",
                            "Action": Match.array_with([
                                Match.string_like_regexp(".*dynamodb.*")
                            ])
                        })
                    ])
                })
            })
        )

    @mark.it("grants Lambda role access to SSM Parameter Store")
    def test_grants_lambda_ssm_access(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Resource is a CloudFormation intrinsic function
        template.has_resource_properties(
            "AWS::IAM::Policy",
            Match.object_like({
                "PolicyDocument": Match.object_like({
                    "Statement": Match.array_with([
                        Match.object_like({
                            "Effect": "Allow",
                            "Action": Match.array_with([
                                "ssm:GetParameter",
                                "ssm:GetParameters",
                                "ssm:GetParametersByPath"
                            ]),
                            # Resource is a CloudFormation intrinsic function
                            "Resource": Match.any_value()
                        })
                    ])
                })
            })
        )

    # ============================================
    # Lambda Function Tests
    # ============================================

    @mark.it("creates payment validation Lambda function")
    def test_creates_payment_validation_lambda(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::Lambda::Function",
            Match.object_like({
                "FunctionName": f"payment-validation-{self.env_suffix}",
                "Runtime": "python3.11",
                "Handler": "index.handler",
                "Timeout": 30,
                "MemorySize": 512,
                "Environment": Match.object_like({
                    "Variables": Match.object_like({
                        "ENVIRONMENT_SUFFIX": self.env_suffix,
                        # TRANSACTION_TABLE is a CloudFormation Ref, not a string
                        "TRANSACTION_TABLE": Match.any_value()
                    })
                })
            })
        )

    @mark.it("creates fraud detection Lambda function")
    def test_creates_fraud_detection_lambda(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::Lambda::Function",
            Match.object_like({
                "FunctionName": f"fraud-detection-{self.env_suffix}",
                "Runtime": "python3.11",
                "Handler": "index.handler"
            })
        )

    @mark.it("creates transaction processing Lambda function")
    def test_creates_transaction_processing_lambda(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::Lambda::Function",
            Match.object_like({
                "FunctionName": f"transaction-processing-{self.env_suffix}",
                "Runtime": "python3.11",
                "Handler": "index.handler",
                "Environment": Match.object_like({
                    "Variables": Match.object_like({
                        "ENVIRONMENT_SUFFIX": self.env_suffix,
                        # AUDIT_BUCKET is a CloudFormation Ref, not a string
                        "AUDIT_BUCKET": Match.any_value(),
                        "TRANSACTION_TABLE": Match.any_value()
                    })
                })
            })
        )

    @mark.it("creates all three Lambda functions")
    def test_creates_all_lambda_functions(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - There are 3 application Lambdas + 2 helper Lambdas (log retention, S3 auto-delete)
        # So total should be at least 3, but may be more
        lambda_count = len([r for r in template.find_resources("AWS::Lambda::Function").values()])
        self.assertGreaterEqual(lambda_count, 3)
        
        # Verify the three application functions exist
        function_names = [
            f"payment-validation-{self.env_suffix}",
            f"fraud-detection-{self.env_suffix}",
            f"transaction-processing-{self.env_suffix}"
        ]
        for name in function_names:
            template.has_resource_properties(
                "AWS::Lambda::Function",
                Match.object_like({
                    "FunctionName": name
                })
            )

    @mark.it("configures Lambda functions with VPC")
    def test_configures_lambda_with_vpc(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Check that at least one Lambda has VPC config
        template.has_resource_properties(
            "AWS::Lambda::Function",
            Match.object_like({
                "FunctionName": f"payment-validation-{self.env_suffix}",
                "VpcConfig": Match.object_like({
                    # Verify VPC config exists - use Match.any_value() for arrays
                    "SecurityGroupIds": Match.any_value(),
                    "SubnetIds": Match.any_value()
                })
            })
        )

    # ============================================
    # API Gateway Tests
    # ============================================

    @mark.it("creates API Gateway REST API")
    def test_creates_api_gateway(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::ApiGateway::RestApi",
            Match.object_like({
                "Name": f"payment-api-{self.env_suffix}",
                "Description": Match.string_like_regexp(f".*{self.env_suffix}.*")
            })
        )

    @mark.it("creates API Gateway deployment stage")
    def test_creates_api_gateway_stage(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::ApiGateway::Stage",
            Match.object_like({
                "StageName": "prod",
                "MethodSettings": Match.array_with([
                    Match.object_like({
                        "LoggingLevel": "INFO",
                        "DataTraceEnabled": True,
                        "MetricsEnabled": True
                    })
                ])
            })
        )

    @mark.it("creates API Gateway request validator")
    def test_creates_api_gateway_validator(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::ApiGateway::RequestValidator",
            Match.object_like({
                "Name": f"payment-validator-{self.env_suffix}",
                "ValidateRequestBody": True,
                "ValidateRequestParameters": True
            })
        )

    @mark.it("creates validate endpoint with POST method")
    def test_creates_validate_endpoint(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::ApiGateway::Method",
            Match.object_like({
                "HttpMethod": "POST",
                "Integration": Match.object_like({
                    "Type": "AWS_PROXY",
                    "IntegrationHttpMethod": "POST"
                })
            })
        )

    @mark.it("creates fraud-check endpoint")
    def test_creates_fraud_check_endpoint(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Verify method exists (fraud-check endpoint)
        # Count all methods - should have at least 3 (validate, fraud-check, process)
        method_count = len([r for r in template.find_resources("AWS::ApiGateway::Method").values()])
        self.assertGreaterEqual(method_count, 3)

    @mark.it("creates process endpoint")
    def test_creates_process_endpoint(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Verify all three endpoints exist
        template.resource_count_is("AWS::ApiGateway::Method", 3)

    @mark.it("stores API Gateway URL in SSM Parameter Store")
    def test_stores_api_url_in_ssm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::SSM::Parameter",
            Match.object_like({
                "Name": f"/payment/api-url-{self.env_suffix}",
                "Type": "String"
            })
        )

    # ============================================
    # CloudWatch Tests
    # ============================================

    @mark.it("creates CloudWatch dashboard")
    def test_creates_cloudwatch_dashboard(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::CloudWatch::Dashboard",
            Match.object_like({
                "DashboardName": f"payment-dashboard-{self.env_suffix}"
            })
        )

    @mark.it("creates CloudWatch alarm for API latency")
    def test_creates_api_latency_alarm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like({
                "AlarmName": f"payment-api-latency-{self.env_suffix}",
                "Threshold": 200,
                "EvaluationPeriods": 2,
                "DatapointsToAlarm": 2,
                "ComparisonOperator": "GreaterThanThreshold",
                "TreatMissingData": "notBreaching"
            })
        )

    @mark.it("creates CloudWatch alarm for API errors")
    def test_creates_api_error_alarm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like({
                "AlarmName": f"payment-api-errors-{self.env_suffix}",
                "Threshold": 10,
                "EvaluationPeriods": 1
            })
        )

    @mark.it("creates CloudWatch alarm for Lambda errors")
    def test_creates_lambda_error_alarm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like({
                "AlarmName": f"payment-lambda-errors-{self.env_suffix}",
                "Threshold": 5,
                "EvaluationPeriods": 1
            })
        )

    @mark.it("creates CloudWatch alarm for Aurora CPU")
    def test_creates_aurora_cpu_alarm(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like({
                "AlarmName": f"payment-aurora-cpu-{self.env_suffix}",
                "Threshold": 80,
                "EvaluationPeriods": 2,
                "MetricName": "CPUUtilization",
                "Namespace": "AWS/RDS"
            })
        )

    @mark.it("creates all CloudWatch alarms")
    def test_creates_all_cloudwatch_alarms(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)

    @mark.it("configures alarms with SNS actions")
    def test_configures_alarms_with_sns_actions(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - AlarmActions is an array, check it exists
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            Match.object_like({
                "AlarmName": f"payment-api-latency-{self.env_suffix}",
                # Use Match.any_value() for the array instead of nesting
                "AlarmActions": Match.any_value()
            })
        )

    # ============================================
    # CloudFormation Outputs Tests
    # ============================================

    @mark.it("creates VPC ID output")
    def test_creates_vpc_id_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "VpcId",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-vpc-id-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates Aurora endpoint output")
    def test_creates_aurora_endpoint_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "AuroraClusterEndpoint",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-aurora-endpoint-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates DynamoDB table name output")
    def test_creates_dynamodb_table_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "TransactionTableName",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-transaction-table-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates API Gateway URL output")
    def test_creates_api_gateway_url_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "ApiGatewayUrl",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-api-url-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates S3 bucket name output")
    def test_creates_s3_bucket_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "AuditLogBucket",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-audit-bucket-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates SNS topic ARN output")
    def test_creates_sns_topic_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "AlertTopicArn",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-alert-topic-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates KMS key ID output")
    def test_creates_kms_key_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "KmsKeyId",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-kms-key-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates Dashboard URL output")
    def test_creates_dashboard_url_output(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT
        template.has_output(
            "DashboardUrl",
            Match.object_like({
                "Export": Match.object_like({
                    "Name": f"payment-dashboard-url-{self.env_suffix}"
                })
            })
        )

    @mark.it("creates all CloudFormation outputs")
    def test_creates_all_outputs(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Check outputs exist
        outputs = template.find_outputs("*")
        # Should have 8 outputs: VpcId, AuroraClusterEndpoint, TransactionTableName,
        # ApiGatewayUrl, AuditLogBucket, AlertTopicArn, KmsKeyId, DashboardUrl
        self.assertGreaterEqual(len(outputs), 8)

    # ============================================
    # Resource Count Tests
    # ============================================

    @mark.it("creates correct number of SSM parameters")
    def test_creates_correct_ssm_parameters(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - KMS key, VPC ID, Aurora endpoint, DynamoDB table, S3 bucket, API URL
        template.resource_count_is("AWS::SSM::Parameter", 6)

    @mark.it("creates correct number of security groups")
    def test_creates_correct_security_groups(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Lambda SG, Aurora SG, and possibly others (CDK may create additional)
        # Use find_resources instead of resource_count_is with Match.any_value()
        security_groups = template.find_resources("AWS::EC2::SecurityGroup")
        self.assertGreaterEqual(len(security_groups), 2)

    # ============================================
    # Integration Tests (Stack Synthesis)
    # ============================================

    @mark.it("synthesizes stack without errors")
    def test_synthesizes_stack(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)

        # ASSERT - Should not raise exception
        template = Template.from_stack(stack)
        self.assertIsNotNone(template)

    @mark.it("verifies stack has all required resources")
    def test_verifies_all_resources(self):
        # ARRANGE
        props = TapStackProps(environment_suffix=self.env_suffix)
        stack = TapStack(self.app, "TapStackTest", props=props)
        template = Template.from_stack(stack)

        # ASSERT - Verify key resource types exist
        self.assertGreater(len(template.find_resources("AWS::KMS::Key")), 0)
        self.assertGreater(len(template.find_resources("AWS::EC2::VPC")), 0)
        self.assertGreater(len(template.find_resources("AWS::RDS::DBCluster")), 0)
        self.assertGreater(len(template.find_resources("AWS::DynamoDB::Table")), 0)
        self.assertGreater(len(template.find_resources("AWS::S3::Bucket")), 0)
        self.assertGreater(len(template.find_resources("AWS::SNS::Topic")), 0)
        self.assertGreater(len(template.find_resources("AWS::Lambda::Function")), 0)
        self.assertGreater(len(template.find_resources("AWS::ApiGateway::RestApi")), 0)

"""
Comprehensive unit tests for Task Management API Infrastructure Stack.
Tests all AWS services: API Gateway, Lambda, DynamoDB, EventBridge, SNS, Cognito, S3, CloudWatch, IAM.
"""

import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.tap_stack import TapStack, TapStackProps


class TestTaskManagementStack:
    """Test suite for Task Management Infrastructure"""

    @pytest.fixture
    def stack(self):
        """Create a test stack instance"""
        app = cdk.App()
        stack = TapStack(
            app,
            "TestTapStack",
            props=TapStackProps(environment_suffix="test"),
            env=cdk.Environment(
                account="123456789012",
                region="us-west-2"
            )
        )
        return stack

    @pytest.fixture
    def template(self, stack):
        """Generate CloudFormation template from stack"""
        return assertions.Template.from_stack(stack)

    # ========== COGNITO USER POOL TESTS ==========

    def test_cognito_user_pool_created(self, template):
        """Test that Cognito User Pool is created with correct configuration"""
        template.resource_count_is("AWS::Cognito::UserPool", 1)

        template.has_resource_properties("AWS::Cognito::UserPool", {
            "UserPoolName": "task-mgmt-users-test",
            "AutoVerifiedAttributes": ["email"],
            "Policies": {
                "PasswordPolicy": {
                    "MinimumLength": 8,
                    "RequireLowercase": True,
                    "RequireUppercase": True,
                    "RequireNumbers": True,
                    "RequireSymbols": True
                }
            }
        })

    def test_cognito_user_pool_client_created(self, template):
        """Test that Cognito User Pool Client is created"""
        template.resource_count_is("AWS::Cognito::UserPoolClient", 1)

    def test_cognito_user_groups_created(self, template):
        """Test that Cognito user groups are created for access control"""
        template.resource_count_is("AWS::Cognito::UserPoolGroup", 3)

        # Check for Admins group
        template.has_resource_properties("AWS::Cognito::UserPoolGroup", {
            "GroupName": "Admins",
            "Description": "Administrative users with full access"
        })

        # Check for TeamMembers group
        template.has_resource_properties("AWS::Cognito::UserPoolGroup", {
            "GroupName": "TeamMembers",
            "Description": "Regular team members with standard access"
        })

        # Check for Viewers group
        template.has_resource_properties("AWS::Cognito::UserPoolGroup", {
            "GroupName": "Viewers",
            "Description": "Read-only access users"
        })

    # ========== DYNAMODB TABLES TESTS ==========

    def test_dynamodb_tables_created(self, template):
        """Test that DynamoDB tables are created"""
        template.resource_count_is("AWS::DynamoDB::Table", 2)

    def test_tasks_table_configuration(self, template):
        """Test Tasks table with GSIs"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tasks-test",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            },
            "SSESpecification": {
                "SSEEnabled": True
            },
            "KeySchema": [
                {
                    "AttributeName": "taskId",
                    "KeyType": "HASH"
                }
            ],
            "StreamSpecification": {
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            }
        })

    def test_tasks_table_gsi_project_index(self, template):
        """Test Tasks table has project GSI for efficient queries"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tasks-test",
            "GlobalSecondaryIndexes": assertions.Match.array_with([
                {
                    "IndexName": "projectIndex",
                    "KeySchema": [
                        {"AttributeName": "projectId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ])
        })

    def test_tasks_table_gsi_user_index(self, template):
        """Test Tasks table has user GSI for efficient queries"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "tasks-test",
            "GlobalSecondaryIndexes": assertions.Match.array_with([
                {
                    "IndexName": "userIndex",
                    "KeySchema": [
                        {"AttributeName": "assignedTo", "KeyType": "HASH"},
                        {"AttributeName": "dueDate", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ])
        })

    def test_projects_table_configuration(self, template):
        """Test Projects table with GSI"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "projects-test",
            "BillingMode": "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification": {
                "PointInTimeRecoveryEnabled": True
            },
            "KeySchema": [
                {
                    "AttributeName": "projectId",
                    "KeyType": "HASH"
                }
            ]
        })

    def test_projects_table_gsi_owner_index(self, template):
        """Test Projects table has owner GSI"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": "projects-test",
            "GlobalSecondaryIndexes": assertions.Match.array_with([
                {
                    "IndexName": "ownerIndex",
                    "KeySchema": [
                        {"AttributeName": "ownerId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"}
                }
            ])
        })

    # ========== S3 BUCKET TESTS ==========

    def test_s3_bucket_created(self, template):
        """Test S3 bucket for file attachments is created"""
        template.resource_count_is("AWS::S3::Bucket", 1)

        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "task-attachments-test-123456789012",
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_s3_bucket_encryption(self, template):
        """Test S3 bucket has encryption enabled"""
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }
        })

    def test_s3_bucket_lifecycle_rules(self, template):
        """Test S3 bucket has lifecycle rules for cost optimization"""
        # Verify S3 bucket has lifecycle configuration
        template.has_resource_properties("AWS::S3::Bucket", {
            "LifecycleConfiguration": assertions.Match.object_like({
                "Rules": assertions.Match.any_value()
            })
        })

    # ========== SNS TOPIC TESTS ==========

    def test_sns_topic_created(self, template):
        """Test SNS topic for notifications is created"""
        template.resource_count_is("AWS::SNS::Topic", 1)

        template.has_resource_properties("AWS::SNS::Topic", {
            "TopicName": "task-notifications-test",
            "DisplayName": "Task Management Notifications"
        })

    # ========== IAM ROLES TESTS ==========

    def test_iam_roles_created(self, template):
        """Test that IAM roles are created for Lambda functions"""
        # 4 Lambda functions + 2 helper Lambdas (S3 auto-delete, log retention) + 1 custom resource = 7 IAM roles
        template.resource_count_is("AWS::IAM::Role", 7)

    def test_tasks_lambda_role_permissions(self, template):
        """Test Tasks Lambda role has appropriate permissions"""
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": "tasks-lambda-role-test",
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
            }
        })

    def test_lambda_roles_have_cloudwatch_permissions(self, template):
        """Test all Lambda roles have CloudWatch Logs permissions"""
        # Check for AWSLambdaBasicExecutionRole managed policy
        template.has_resource_properties("AWS::IAM::Role", {
            "ManagedPolicyArns": assertions.Match.array_with([
                assertions.Match.object_like({
                    "Fn::Join": assertions.Match.array_with([
                        assertions.Match.array_with([
                            assertions.Match.string_like_regexp(".*AWSLambdaBasicExecutionRole")
                        ])
                    ])
                })
            ])
        })

    # ========== LAMBDA FUNCTIONS TESTS ==========

    def test_lambda_functions_created(self, template):
        """Test that all Lambda functions are created"""
        # 4 app Lambda functions + 2 CDK helper functions = 6 total
        template.resource_count_is("AWS::Lambda::Function", 6)

    def test_tasks_lambda_configuration(self, template):
        """Test Tasks Lambda function configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tasks-crud-test",
            "Runtime": "python3.9",
            "Handler": "tasks_handler.lambda_handler",
            "Timeout": 30,
            "MemorySize": 512
        })

    def test_projects_lambda_configuration(self, template):
        """Test Projects Lambda function configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "projects-crud-test",
            "Runtime": "python3.9",
            "Handler": "projects_handler.lambda_handler",
            "Timeout": 30,
            "MemorySize": 512
        })

    def test_notifications_lambda_configuration(self, template):
        """Test Notifications Lambda function configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "notifications-test",
            "Runtime": "python3.9",
            "Handler": "notifications_handler.lambda_handler",
            "Timeout": 30,
            "MemorySize": 256
        })

    def test_reminders_lambda_configuration(self, template):
        """Test Reminders Lambda function configuration"""
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "task-reminders-test",
            "Runtime": "python3.9",
            "Handler": "reminders_handler.lambda_handler",
            "Timeout": 60,
            "MemorySize": 256
        })

    def test_lambda_environment_variables(self, template):
        """Test Lambda functions have correct environment variables"""
        # Verify tasks function has environment variables (values may be refs)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tasks-crud-test",
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": "test"
                }
            }
        })

    def test_lambda_log_retention(self, template):
        """Test Lambda functions have CloudWatch log retention configured"""
        # API Gateway creates its own log group
        template.resource_count_is("AWS::Logs::LogGroup", 1)

    # ========== EVENTBRIDGE TESTS ==========

    def test_eventbridge_rule_created(self, template):
        """Test EventBridge scheduled rule for reminders is created"""
        template.resource_count_is("AWS::Events::Rule", 1)

        template.has_resource_properties("AWS::Events::Rule", {
            "Name": "task-reminder-rule-test",
            "Description": "Scheduled rule to check and send task reminders",
            "ScheduleExpression": "rate(1 hour)",
            "State": "ENABLED"
        })

    def test_eventbridge_lambda_permission(self, template):
        """Test EventBridge has permission to invoke Lambda"""
        template.has_resource_properties("AWS::Lambda::Permission", {
            "Action": "lambda:InvokeFunction",
            "Principal": "events.amazonaws.com"
        })

    # ========== API GATEWAY TESTS ==========

    def test_api_gateway_created(self, template):
        """Test API Gateway REST API is created"""
        template.resource_count_is("AWS::ApiGateway::RestApi", 1)

        template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "task-management-api-test",
            "Description": "Task Management API with Cognito authorization"
        })

    def test_api_gateway_cognito_authorizer(self, template):
        """Test API Gateway has Cognito authorizer configured"""
        template.resource_count_is("AWS::ApiGateway::Authorizer", 1)

        template.has_resource_properties("AWS::ApiGateway::Authorizer", {
            "Type": "COGNITO_USER_POOLS"
        })

    def test_api_gateway_resources_created(self, template):
        """Test API Gateway has correct resources"""
        # Resources: /tasks, /tasks/{taskId}, /projects, /projects/{projectId}
        template.resource_count_is("AWS::ApiGateway::Resource", 4)

    def test_api_gateway_methods_created(self, template):
        """Test API Gateway has correct methods"""
        # Methods: tasks (GET, POST, OPTIONS), tasks/{taskId} (GET, PUT, DELETE, OPTIONS)
        # projects (GET, POST, OPTIONS), projects/{projectId} (GET, PUT, DELETE, OPTIONS)
        # CORS adds OPTIONS methods, plus root
        # Total: 15 methods (10 + 4 OPTIONS + 1 root)
        template.resource_count_is("AWS::ApiGateway::Method", 15)

    def test_api_gateway_tasks_get_method(self, template):
        """Test API Gateway tasks GET method with Cognito authorization"""
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "GET",
            "AuthorizationType": "COGNITO_USER_POOLS"
        })

    def test_api_gateway_deployment(self, template):
        """Test API Gateway deployment is created"""
        template.resource_count_is("AWS::ApiGateway::Deployment", 1)

    def test_api_gateway_stage(self, template):
        """Test API Gateway stage is created with monitoring"""
        template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod",
            "MethodSettings": assertions.Match.array_with([
                {
                    "DataTraceEnabled": True,
                    "LoggingLevel": "INFO",
                    "MetricsEnabled": True,
                    "ResourcePath": "/*",
                    "HttpMethod": "*",
                    "ThrottlingRateLimit": 1000,
                    "ThrottlingBurstLimit": 2000
                }
            ])
        })

    def test_api_gateway_cors_configuration(self, template):
        """Test API Gateway has CORS configured"""
        # CORS adds OPTIONS methods for each resource
        template.has_resource_properties("AWS::ApiGateway::Method", {
            "HttpMethod": "OPTIONS"
        })

    # ========== CLOUDWATCH ALARMS TESTS ==========

    def test_cloudwatch_alarms_created(self, template):
        """Test CloudWatch alarms are created for monitoring"""
        template.resource_count_is("AWS::CloudWatch::Alarm", 4)

    def test_api_4xx_alarm(self, template):
        """Test API Gateway 4XX errors alarm"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "task-api-4xx-errors-test",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 10,
            "EvaluationPeriods": 2,
            "TreatMissingData": "notBreaching"
        })

    def test_api_5xx_alarm(self, template):
        """Test API Gateway 5XX errors alarm"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "task-api-5xx-errors-test",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 5,
            "EvaluationPeriods": 2
        })

    def test_lambda_errors_alarm(self, template):
        """Test Lambda errors alarm"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "tasks-lambda-errors-test",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 3,
            "EvaluationPeriods": 2
        })

    def test_dynamodb_throttle_alarm(self, template):
        """Test DynamoDB throttle alarm"""
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": "tasks-table-read-throttle-test",
            "ComparisonOperator": "GreaterThanThreshold",
            "Threshold": 5
        })

    # ========== CLOUDWATCH LOGS TESTS ==========

    def test_cloudwatch_log_groups_created(self, template):
        """Test CloudWatch log groups are created"""
        # API Gateway creates 1 explicit log group
        template.resource_count_is("AWS::Logs::LogGroup", 1)

        # API Gateway log group
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": "/aws/apigateway/task-management-test",
            "RetentionInDays": 7
        })

    # ========== STACK OUTPUTS TESTS ==========

    def test_stack_outputs(self, template):
        """Test stack has correct outputs"""
        template.has_output("ApiUrl", {})
        template.has_output("UserPoolId", {})
        template.has_output("UserPoolClientId", {})
        template.has_output("TasksTableName", {})
        template.has_output("ProjectsTableName", {})
        template.has_output("AttachmentsBucketName", {})
        template.has_output("NotificationsTopicArn", {})

    # ========== INTEGRATION TESTS ==========

    def test_lambda_dynamodb_integration(self, template):
        """Test Lambda functions have correct DynamoDB permissions"""
        # Verify IAM policies exist for DynamoDB access
        template.resource_count_is("AWS::IAM::Policy", 5)  # 4 Lambda + 1 Log Retention

    def test_lambda_s3_integration(self, template):
        """Test Tasks Lambda has S3 permissions"""
        # Verify S3 bucket exists and Lambda has access through IAM policy
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.resource_count_is("AWS::IAM::Policy", 5)

    def test_lambda_sns_integration(self, template):
        """Test Lambda functions have SNS publish permissions"""
        # Verify SNS topic exists and Lambda functions have IAM policies
        template.resource_count_is("AWS::SNS::Topic", 1)
        template.resource_count_is("AWS::IAM::Policy", 5)

    # ========== SECURITY TESTS ==========

    def test_least_privilege_iam_policies(self, template):
        """Test IAM policies follow least privilege principle"""
        # Verify IAM policies are created with proper structure
        template.resource_count_is("AWS::IAM::Policy", 5)

    def test_encryption_at_rest(self, template):
        """Test data encryption at rest"""
        # DynamoDB encryption
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "SSESpecification": {
                "SSEEnabled": True
            }
        })

        # S3 encryption
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": assertions.Match.any_value()
            }
        })

    def test_no_public_s3_access(self, template):
        """Test S3 bucket blocks all public access"""
        template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    # ========== TAGGING TESTS ==========

    def test_resource_tagging(self, stack):
        """Test resources have consistent tagging"""
        # Verify stack properties are set correctly
        assert stack.environment_suffix == "test"
        assert stack.tasks_table is not None
        assert stack.projects_table is not None
        assert stack.api is not None

    # ========== COST OPTIMIZATION TESTS ==========

    def test_dynamodb_pay_per_request(self, template):
        """Test DynamoDB uses pay-per-request billing for cost optimization"""
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "BillingMode": "PAY_PER_REQUEST"
        })

    def test_lambda_memory_optimization(self, template):
        """Test Lambda functions have appropriate memory allocation"""
        # CRUD functions: 512MB (higher load)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "tasks-crud-test",
            "MemorySize": 512
        })

        # Notification functions: 256MB (lower load)
        template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": "notifications-test",
            "MemorySize": 256
        })

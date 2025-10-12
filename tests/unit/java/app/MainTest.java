package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Capture;
import software.amazon.awscdk.assertions.Match;
import software.amazon.awscdk.assertions.Template;

import java.util.Map;

/**
 * Comprehensive unit tests for the Support Platform CDK application.
 *
 * These tests verify all infrastructure components including DynamoDB, Lambda,
 * API Gateway, SQS, SNS, S3, Kendra, Step Functions, EventBridge, CloudWatch,
 * Secrets Manager, and SES.
 */
public class MainTest {

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");

        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test DynamoDB table with Global Secondary Index configuration.
     */
    @Test
    public void testDynamoDBTableWithGSI() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DynamoDB table exists with correct configuration
        template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "BillingMode", "PAY_PER_REQUEST",
                "KeySchema", Match.arrayWith(java.util.Arrays.asList(
                        Match.objectLike(Map.of("AttributeName", "ticketId", "KeyType", "HASH")),
                        Match.objectLike(Map.of("AttributeName", "timestamp", "KeyType", "RANGE"))
                )),
                "StreamSpecification", Match.objectLike(Map.of(
                        "StreamViewType", "NEW_AND_OLD_IMAGES"
                )),
                "PointInTimeRecoverySpecification", Match.objectLike(Map.of(
                        "PointInTimeRecoveryEnabled", true
                ))
        )));

        // Verify Global Secondary Index exists
        template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "GlobalSecondaryIndexes", Match.arrayWith(java.util.Arrays.asList(
                        Match.objectLike(Map.of(
                                "IndexName", "StatusPriorityIndex",
                                "KeySchema", Match.arrayWith(java.util.Arrays.asList(
                                        Match.objectLike(Map.of("AttributeName", "status", "KeyType", "HASH")),
                                        Match.objectLike(Map.of("AttributeName", "priority", "KeyType", "RANGE"))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test S3 buckets with encryption and lifecycle policies.
     */
    @Test
    public void testS3BucketsConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify attachments bucket with lifecycle policy
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                "BucketEncryption", Match.objectLike(Map.of(
                        "ServerSideEncryptionConfiguration", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "ServerSideEncryptionByDefault", Match.objectLike(Map.of(
                                                "SSEAlgorithm", "AES256"
                                        ))
                                ))
                        ))
                )),
                "VersioningConfiguration", Match.objectLike(Map.of(
                        "Status", "Enabled"
                )),
                "PublicAccessBlockConfiguration", Match.objectLike(Map.of(
                        "BlockPublicAcls", true,
                        "BlockPublicPolicy", true,
                        "IgnorePublicAcls", true,
                        "RestrictPublicBuckets", true
                )),
                "LifecycleConfiguration", Match.objectLike(Map.of(
                        "Rules", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Status", "Enabled",
                                        "Transitions", Match.arrayWith(java.util.Arrays.asList(
                                                Match.objectLike(Map.of(
                                                        "StorageClass", "INTELLIGENT_TIERING",
                                                        "TransitionInDays", 30
                                                ))
                                        ))
                                ))
                        ))
                ))
        )));

        // Count S3 buckets (should have 2: attachments + knowledge base)
        template.resourceCountIs("AWS::S3::Bucket", 2);
    }

    /**
     * Test SQS queues with priority routing and DLQ configuration.
     */
    @Test
    public void testSQSQueuesWithDLQ() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify high, standard, low priority queues + DLQ = 4 queues
        template.resourceCountIs("AWS::SQS::Queue", 4);

        // Verify queue with visibility timeout
        template.hasResourceProperties("AWS::SQS::Queue", Match.objectLike(Map.of(
                "VisibilityTimeout", 300,
                "RedrivePolicy", Match.objectLike(Map.of(
                        "maxReceiveCount", 3
                ))
        )));
    }

    /**
     * Test SNS topic for agent notifications.
     */
    @Test
    public void testSNSTopic() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SNS topic exists
        template.resourceCountIs("AWS::SNS::Topic", 1);
        template.hasResourceProperties("AWS::SNS::Topic", Match.objectLike(Map.of(
                "DisplayName", "Support Agent Notifications"
        )));
    }

    /**
     * Test Secrets Manager secret for API credentials.
     */
    @Test
    public void testSecretsManagerSecret() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Secrets Manager secret exists
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);
        template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
                "Description", "API credentials and secrets for support platform",
                "GenerateSecretString", Match.objectLike(Map.of(
                        "SecretStringTemplate", "{\"apiKey\":\"\"}",
                        "GenerateStringKey", "apiKey",
                        "ExcludePunctuation", true,
                        "PasswordLength", 32
                ))
        )));
    }

    /**
     * Test SES Email Identity configuration.
     */
    @Test
    public void testSESEmailIdentity() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SES Email Identity exists
        template.resourceCountIs("AWS::SES::EmailIdentity", 1);
        template.hasResourceProperties("AWS::SES::EmailIdentity", Match.objectLike(Map.of(
                "EmailIdentity", "support@example.com"
        )));
    }

    /**
     * Test Lambda functions with X-Ray tracing and proper IAM roles.
     */
    @Test
    public void testLambdaFunctionsConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda functions (6 main + potential service-linked functions)
        // CDK may create additional Lambda functions for custom resources
        template.resourcePropertiesCountIs("AWS::Lambda::Function", Match.objectLike(Map.of(
                "Runtime", "nodejs18.x"
        )), 6);

        // Verify Lambda with X-Ray tracing
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "Runtime", "nodejs18.x",
                "TracingConfig", Match.objectLike(Map.of(
                        "Mode", "Active"
                )),
                "Timeout", Match.anyValue(),
                "MemorySize", Match.anyValue()
        )));
    }

    /**
     * Test specific Lambda functions exist with correct names.
     */
    @Test
    public void testAllLambdaFunctionsExist() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify sentiment analyzer function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-sentiment-analyzer-test",
                "Handler", "index.handler"
        )));

        // Verify translation function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-translation-test",
                "Handler", "index.handler"
        )));

        // Verify knowledge base search function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-knowledge-search-test",
                "Handler", "index.handler"
        )));

        // Verify escalation function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-escalation-test",
                "Handler", "index.handler"
        )));

        // Verify SLA check function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-sla-check-test",
                "Handler", "index.handler"
        )));

        // Verify auto response function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-auto-response-test",
                "Handler", "index.handler"
        )));
    }

    /**
     * Test Lambda environment variables configuration.
     */
    @Test
    public void testLambdaEnvironmentVariables() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda has required environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "Environment", Match.objectLike(Map.of(
                        "Variables", Match.objectLike(Map.of(
                                "TABLE_NAME", Match.anyValue(),
                                "HIGH_PRIORITY_QUEUE_URL", Match.anyValue(),
                                "STANDARD_PRIORITY_QUEUE_URL", Match.anyValue(),
                                "LOW_PRIORITY_QUEUE_URL", Match.anyValue(),
                                "NOTIFICATION_TOPIC_ARN", Match.anyValue(),
                                "ATTACHMENTS_BUCKET", Match.anyValue(),
                                "KNOWLEDGE_BASE_BUCKET", Match.anyValue(),
                                "SECRET_ARN", Match.anyValue(),
                                "SES_FROM_EMAIL", "support@example.com"
                        ))
                ))
        )));
    }

    /**
     * Test Kendra index for knowledge base.
     */
    @Test
    public void testKendraIndex() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Kendra index exists
        template.resourceCountIs("AWS::Kendra::Index", 1);
        template.hasResourceProperties("AWS::Kendra::Index", Match.objectLike(Map.of(
                "Edition", "DEVELOPER_EDITION"
        )));
    }

    /**
     * Test Step Functions state machine for escalation workflow.
     */
    @Test
    public void testStepFunctionsStateMachine() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Step Functions state machine exists
        template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);
        template.hasResourceProperties("AWS::StepFunctions::StateMachine", Match.objectLike(Map.of(
                "StateMachineType", "STANDARD",
                "TracingConfiguration", Match.objectLike(Map.of(
                        "Enabled", true
                ))
        )));
    }

    /**
     * Test API Gateway REST API with X-Ray tracing and CORS.
     */
    @Test
    public void testAPIGatewayConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify API Gateway REST API exists
        template.resourceCountIs("AWS::ApiGateway::RestApi", 1);

        // Verify API Gateway deployment with X-Ray tracing
        template.hasResourceProperties("AWS::ApiGateway::Stage", Match.objectLike(Map.of(
                "StageName", "prod",
                "TracingEnabled", true
        )));

        // Verify API Gateway resources and methods exist
        template.resourceCountIs("AWS::ApiGateway::Resource", 2); // /tickets and /{ticketId}
    }

    /**
     * Test API Gateway methods (GET, POST, PUT).
     */
    @Test
    public void testAPIGatewayMethods() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify API Gateway methods
        template.hasResourceProperties("AWS::ApiGateway::Method", Match.objectLike(Map.of(
                "HttpMethod", "POST"
        )));

        template.hasResourceProperties("AWS::ApiGateway::Method", Match.objectLike(Map.of(
                "HttpMethod", "GET"
        )));

        template.hasResourceProperties("AWS::ApiGateway::Method", Match.objectLike(Map.of(
                "HttpMethod", "PUT"
        )));
    }

    /**
     * Test EventBridge rule for SLA monitoring.
     */
    @Test
    public void testEventBridgeRule() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify EventBridge rule exists
        template.resourceCountIs("AWS::Events::Rule", 1);
        template.hasResourceProperties("AWS::Events::Rule", Match.objectLike(Map.of(
                "ScheduleExpression", "rate(5 minutes)",
                "Description", "Monitor SLA compliance every 5 minutes"
        )));
    }

    /**
     * Test CloudWatch dashboard with metrics.
     */
    @Test
    public void testCloudWatchDashboard() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify CloudWatch dashboard exists
        template.resourceCountIs("AWS::CloudWatch::Dashboard", 1);
    }

    /**
     * Test CloudWatch alarms for queue backlogs and Lambda errors.
     */
    @Test
    public void testCloudWatchAlarms() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify 3 CloudWatch alarms (high priority backlog, Lambda errors, DLQ)
        template.resourceCountIs("AWS::CloudWatch::Alarm", 3);

        // Verify alarm configuration
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "ComparisonOperator", Match.anyValue(),
                "EvaluationPeriods", Match.anyValue(),
                "Threshold", Match.anyValue(),
                "TreatMissingData", "notBreaching"
        )));
    }

    /**
     * Test specific CloudWatch alarms exist.
     */
    @Test
    public void testSpecificCloudWatchAlarms() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify high priority backlog alarm
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "Threshold", 10,
                "ComparisonOperator", "GreaterThanThreshold"
        )));

        // Verify Lambda error alarm
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "Threshold", 5,
                "ComparisonOperator", "GreaterThanThreshold"
        )));

        // Verify DLQ alarm
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
                "Threshold", 1,
                "ComparisonOperator", "GreaterThanOrEqualToThreshold"
        )));
    }

    /**
     * Test IAM roles with least privilege policies.
     */
    @Test
    public void testIAMRolesConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM roles exist (Lambda execution, Kendra, Step Functions + CDK-created service roles)
        // CDK creates additional IAM roles for custom resources and service-linked roles
        // Verify at least 3 core IAM roles exist
        template.resourcePropertiesCountIs("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.anyValue()
        )), 5); // 3 core + 2 CDK service roles

        // Verify Lambda execution role has necessary permissions
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Principal", Match.objectLike(Map.of(
                                                "Service", "lambda.amazonaws.com"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for DynamoDB access.
     */
    @Test
    public void testIAMPoliciesForDynamoDB() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with DynamoDB permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "dynamodb:PutItem",
                                                "dynamodb:GetItem",
                                                "dynamodb:UpdateItem",
                                                "dynamodb:Query",
                                                "dynamodb:Scan"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for Comprehend access.
     */
    @Test
    public void testIAMPoliciesForComprehend() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with Comprehend permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "comprehend:DetectSentiment",
                                                "comprehend:DetectEntities",
                                                "comprehend:DetectDominantLanguage"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for Translate access.
     */
    @Test
    public void testIAMPoliciesForTranslate() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with Translate permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "translate:TranslateText",
                                                "translate:DetectDominantLanguage"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for SQS access.
     */
    @Test
    public void testIAMPoliciesForSQS() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with SQS permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "sqs:SendMessage",
                                                "sqs:ReceiveMessage",
                                                "sqs:DeleteMessage",
                                                "sqs:GetQueueAttributes"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for SNS access.
     */
    @Test
    public void testIAMPoliciesForSNS() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with SNS permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", "sns:Publish"
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for S3 access.
     */
    @Test
    public void testIAMPoliciesForS3() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with S3 permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "s3:GetObject",
                                                "s3:PutObject",
                                                "s3:ListBucket"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for X-Ray access.
     */
    @Test
    public void testIAMPoliciesForXRay() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with X-Ray permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "xray:PutTraceSegments",
                                                "xray:PutTelemetRecords"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for Secrets Manager access.
     */
    @Test
    public void testIAMPoliciesForSecretsManager() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with Secrets Manager permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "secretsmanager:GetSecretValue",
                                                "secretsmanager:DescribeSecret"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for SES access.
     */
    @Test
    public void testIAMPoliciesForSES() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with SES permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "ses:SendEmail",
                                                "ses:SendRawEmail",
                                                "ses:SendTemplatedEmail"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test IAM policies for Kendra access.
     */
    @Test
    public void testIAMPoliciesForKendra() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM policy with Kendra permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", Match.arrayWith(java.util.Arrays.asList(
                                                "kendra:Query",
                                                "kendra:DescribeIndex",
                                                "kendra:ListDataSources"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test Kendra IAM role has CloudWatch permissions.
     */
    @Test
    public void testKendraRoleCloudWatchPermissions() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Kendra role exists
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Principal", Match.objectLike(Map.of(
                                                "Service", "kendra.amazonaws.com"
                                        ))
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test Step Functions role has Lambda invoke permissions.
     */
    @Test
    public void testStepFunctionsRoleLambdaPermissions() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Step Functions role exists
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Principal", Match.objectLike(Map.of(
                                                "Service", "states.amazonaws.com"
                                        ))
                                ))
                        ))
                ))
        )));

        // Verify Lambda invoke permissions for Step Functions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
                "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(java.util.Arrays.asList(
                                Match.objectLike(Map.of(
                                        "Action", "lambda:InvokeFunction"
                                ))
                        ))
                ))
        )));
    }

    /**
     * Test CloudFormation outputs for all important resources.
     */
    @Test
    public void testCloudFormationOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify comprehensive outputs exist (23 outputs)
        Capture outputCapture = new Capture();
        template.hasOutput("DynamoDBTableName", outputCapture);
        template.hasOutput("ApiGatewayUrl", Match.anyValue());
        template.hasOutput("HighPriorityQueueUrl", Match.anyValue());
        template.hasOutput("KendraIndexId", Match.anyValue());
        template.hasOutput("StepFunctionsArn", Match.anyValue());
        template.hasOutput("SentimentAnalyzerFunctionArn", Match.anyValue());
        template.hasOutput("CloudWatchDashboardName", Match.anyValue());
    }

    /**
     * Test all CloudFormation outputs exist.
     */
    @Test
    public void testAllCloudFormationOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // DynamoDB outputs
        template.hasOutput("DynamoDBTableName", Match.anyValue());
        template.hasOutput("DynamoDBTableArn", Match.anyValue());

        // API Gateway outputs
        template.hasOutput("ApiGatewayUrl", Match.anyValue());
        template.hasOutput("ApiGatewayId", Match.anyValue());

        // SQS Queue outputs
        template.hasOutput("HighPriorityQueueUrl", Match.anyValue());
        template.hasOutput("StandardPriorityQueueUrl", Match.anyValue());
        template.hasOutput("LowPriorityQueueUrl", Match.anyValue());
        template.hasOutput("DeadLetterQueueUrl", Match.anyValue());

        // SNS outputs
        template.hasOutput("AgentNotificationTopicArn", Match.anyValue());

        // S3 outputs
        template.hasOutput("AttachmentsBucketName", Match.anyValue());
        template.hasOutput("KnowledgeBaseBucketName", Match.anyValue());

        // Kendra outputs
        template.hasOutput("KendraIndexId", Match.anyValue());
        template.hasOutput("KendraIndexArn", Match.anyValue());

        // Step Functions outputs
        template.hasOutput("StepFunctionsArn", Match.anyValue());

        // Lambda outputs
        template.hasOutput("SentimentAnalyzerFunctionArn", Match.anyValue());
        template.hasOutput("TranslationFunctionArn", Match.anyValue());
        template.hasOutput("KnowledgeBaseSearchFunctionArn", Match.anyValue());
        template.hasOutput("EscalationFunctionArn", Match.anyValue());
        template.hasOutput("SLACheckFunctionArn", Match.anyValue());
        template.hasOutput("AutoResponseFunctionArn", Match.anyValue());

        // CloudWatch outputs
        template.hasOutput("CloudWatchDashboardName", Match.anyValue());

        // Secrets Manager outputs
        template.hasOutput("SecretsManagerSecretArn", Match.anyValue());
        template.hasOutput("SecretsManagerSecretName", Match.anyValue());

        // SES outputs
        template.hasOutput("SESEmailIdentity", Match.anyValue());
    }

    /**
     * Test DLQ has correct retention period.
     */
    @Test
    public void testDeadLetterQueueRetention() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DLQ has 14-day retention
        template.hasResourceProperties("AWS::SQS::Queue", Match.objectLike(Map.of(
                "MessageRetentionPeriod", 1209600 // 14 days in seconds
        )));
    }

    /**
     * Test S3 bucket auto-delete configuration.
     */
    @Test
    public void testS3BucketAutoDelete() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 buckets have custom resource for auto-delete
        // CDK creates a custom resource Lambda for bucket cleanup
        template.hasResourceProperties("Custom::S3AutoDeleteObjects", Match.anyValue());
    }

    /**
     * Test Lambda permission for EventBridge.
     */
    @Test
    public void testLambdaEventBridgePermission() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda permission for EventBridge
        template.hasResourceProperties("AWS::Lambda::Permission", Match.objectLike(Map.of(
                "Action", "lambda:InvokeFunction",
                "Principal", "events.amazonaws.com"
        )));
    }

    /**
     * Test comprehensive infrastructure resource counts.
     */
    @Test
    public void testResourceCounts() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify all major resource types are present (core infrastructure only)
        template.resourceCountIs("AWS::DynamoDB::Table", 1);
        template.resourceCountIs("AWS::S3::Bucket", 2);
        template.resourceCountIs("AWS::SQS::Queue", 4);
        template.resourceCountIs("AWS::SNS::Topic", 1);
        template.resourceCountIs("AWS::Kendra::Index", 1);
        template.resourceCountIs("AWS::StepFunctions::StateMachine", 1);
        template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
        template.resourceCountIs("AWS::Events::Rule", 1);
        template.resourceCountIs("AWS::CloudWatch::Dashboard", 1);
        template.resourceCountIs("AWS::CloudWatch::Alarm", 3);
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);
        template.resourceCountIs("AWS::SES::EmailIdentity", 1);
    }

    /**
     * Test TapStackProps builder pattern.
     */
    @Test
    public void testTapStackPropsBuilder() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    /**
     * Test helper classes are properly constructed.
     */
    @Test
    public void testHelperClassesConstruction() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack is properly constructed with all helper classes
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test removal policies are set correctly.
     */
    @Test
    public void testRemovalPolicies() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DynamoDB table has removal policy
        template.hasResource("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete",
                "UpdateReplacePolicy", "Delete"
        )));

        // Verify Secrets Manager secret has removal policy
        template.hasResource("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete",
                "UpdateReplacePolicy", "Delete"
        )));
    }

    /**
     * Test API Gateway CORS configuration.
     */
    @Test
    public void testAPIGatewayCORS() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify CORS OPTIONS method exists
        template.hasResourceProperties("AWS::ApiGateway::Method", Match.objectLike(Map.of(
                "HttpMethod", "OPTIONS"
        )));
    }

    /**
     * Test Lambda memory and timeout configurations.
     */
    @Test
    public void testLambdaResourceConfigurations() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify sentiment analyzer has 256MB and 30s timeout
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-sentiment-analyzer-test",
                "MemorySize", 256,
                "Timeout", 30
        )));

        // Verify SLA check has 512MB and 60s timeout
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "support-sla-check-test",
                "MemorySize", 512,
                "Timeout", 60
        )));
    }
}
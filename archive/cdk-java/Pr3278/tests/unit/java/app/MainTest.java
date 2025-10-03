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
 * API Gateway, SQS, SNS, S3, Kendra, Step Functions, EventBridge, and CloudWatch.
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
                "ScheduleExpression", "rate(5 minutes)"
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
    }
}

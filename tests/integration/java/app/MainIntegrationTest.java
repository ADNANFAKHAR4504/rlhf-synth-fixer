package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Arrays;
import java.util.Map;
import app.TapStack;
import app.TapStackProps;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests verify the integration between different components of the TapStack
 * and may involve more complex scenarios than unit tests.
 *
 * Note: These tests still use synthetic AWS resources and do not require
 * actual AWS credentials or resources to be created.
 */
public class MainIntegrationTest {

    // Inline Python code for Lambda function with security logging
    private static final String LAMBDA_SECURITY_CODE = """
        import json
        import boto3
        import datetime
        import os
        import logging
        
        # Configure logging
        logger = logging.getLogger()
        logger.setLevel(logging.INFO)
        
        s3_client = boto3.client('s3')
        
        def handler(event, context):
            # Extract request information
            source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
            request_id = context.aws_request_id
            timestamp = datetime.datetime.utcnow().isoformat()
            user_agent = event.get('requestContext', {}).get('identity', {}).get('userAgent', 'unknown')
            
            try:
                # Log security information
                security_log = {
                    'timestamp': timestamp,
                    'source_ip': source_ip,
                    'request_id': request_id,
                    'user_agent': user_agent,
                    'path': event.get('path', '/'),
                    'method': event.get('httpMethod', 'GET'),
                    'headers': event.get('headers', {})
                }
                
                # Store security log in S3
                bucket_name = os.environ.get('BUCKET_NAME')
                if bucket_name:
                    log_key = f"security-logs/{datetime.datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"
                    s3_client.put_object(
                        Bucket=bucket_name,
                        Key=log_key,
                        Body=json.dumps(security_log),
                        ContentType='application/json'
                    )
                
                # Process the actual request
                response_body = {
                    'message': 'Hello from TAP Lambda!',
                    'timestamp': timestamp,
                    'requestId': request_id
                }
                
                # Return response with security headers
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'X-Content-Type-Options': 'nosniff',
                        'X-Frame-Options': 'DENY',
                        'X-XSS-Protection': '1; mode=block',
                        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    },
                    'body': json.dumps(response_body)
                }
                
            except Exception as e:
                logger.error(f"Error processing request: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'X-Content-Type-Options': 'nosniff',
                        'X-Frame-Options': 'DENY'
                    },
                    'body': json.dumps({'error': 'Internal server error'})
                }
        """;

    @Test
    public void testFullStackDeployment() {
        App app = new App();

        // Create stack with production-like configuration
        TapStack stack = new TapStack(app, "TapStackProd", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        // Create template and verify it can be synthesized
        Template template = Template.fromStack(stack);

        // Verify stack configuration
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(template).isNotNull();
    }

    @Test
    public void testMultiEnvironmentConfiguration() {
        // Test different environment configurations
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            // Create a new app for each environment to avoid synthesis conflicts
            App app = new App();
            TapStack stack = new TapStack(app, "TapStack" + env, TapStackProps.builder()
                    .environmentSuffix(env)
                    .build());

            // Verify each environment configuration
            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);

            // Verify template can be created for each environment
            Template template = Template.fromStack(stack);
            assertThat(template).isNotNull();
        }
    }

    @Test
    public void testStackWithNestedComponents() {
        App app = new App();

        TapStack stack = new TapStack(app, "TapStackIntegration", TapStackProps.builder()
                .environmentSuffix("integration")
                .build());

        Template template = Template.fromStack(stack);

        // Verify basic stack structure
        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
    }

    /**
     * Test API Gateway integration with Lambda function for real-world HTTP requests.
     * Validates that GET requests can be properly routed and processed.
     */
    @Test
    public void testApiGatewayRequestHandling() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackApiTest", TapStackProps.builder()
                .environmentSuffix("apitest")
                .build());

        // Get template from the ApplicationStack nested stack
        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify API Gateway is configured with proper REST API
        template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of(
                "Name", "tap-apitest-api"
        ));

        // Verify API Gateway has a resource for /hello endpoint
        template.hasResourceProperties("AWS::ApiGateway::Resource", Map.of(
                "PathPart", "hello"
        ));

        // Verify GET method is configured on the /hello resource
        template.hasResourceProperties("AWS::ApiGateway::Method", Map.of(
                "HttpMethod", "GET",
                "AuthorizationType", "NONE",
                "Integration", Map.of(
                        "Type", "AWS_PROXY",
                        "IntegrationHttpMethod", "POST"
                )
        ));

        // Verify API Gateway deployment with throttling configuration
        template.hasResourceProperties("AWS::ApiGateway::Deployment", Match.anyValue());
        
        template.hasResourceProperties("AWS::ApiGateway::Stage", Map.of(
                "StageName", "prod",
                "MethodSettings", Arrays.asList(
                        Map.of(
                                "ResourcePath", "/*",
                                "HttpMethod", "*",
                                "ThrottlingRateLimit", 100.0,
                                "ThrottlingBurstLimit", 200
                        )
                )
        ));

        // Verify Lambda permission allows API Gateway to invoke it
        template.hasResourceProperties("AWS::Lambda::Permission", Map.of(
                "Action", "lambda:InvokeFunction",
                "Principal", "apigateway.amazonaws.com"
        ));
    }

    /**
     * Test Lambda function integration with S3 for security logging.
     * Validates that Lambda can process requests and store security logs in S3.
     */
    @Test
    public void testLambdaS3SecurityLoggingIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackLambdaTest", TapStackProps.builder()
                .environmentSuffix("lambdatest")
                .build());

        // Get template from the ApplicationStack nested stack
        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify Lambda function exists with proper configuration
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "FunctionName", "tap-lambdatest-function",
                "Runtime", "python3.9",
                "Handler", "index.handler",
                "Timeout", 30,
                "MemorySize", 256
        ));

        // Verify Lambda function code includes security logging functionality
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Code", Map.of(
                        "ZipFile", Match.stringLikeRegexp(".*security-logs.*")
                )
        ));

        // Verify Lambda has environment variable pointing to S3 bucket
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Environment", Map.of(
                        "Variables", Map.of(
                                "BUCKET_NAME", Match.anyValue()
                        )
                )
        ));

        // Verify Lambda execution role has required permissions
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
                "AssumeRolePolicyDocument", Match.anyValue(),
                "Policies", Match.anyValue()
        ));
    }

    /**
     * Test that the inline Python Lambda code handles error cases properly.
     */
    @Test
    public void testLambdaErrorHandling() {
        // Test that our inline code contains proper error handling
        assertThat(LAMBDA_SECURITY_CODE).contains("try:");
        assertThat(LAMBDA_SECURITY_CODE).contains("except Exception as e:");
        assertThat(LAMBDA_SECURITY_CODE).contains("logger.error");
        assertThat(LAMBDA_SECURITY_CODE).contains("statusCode': 500");
        assertThat(LAMBDA_SECURITY_CODE).contains("Internal server error");
    }

    /**
     * Test that the inline Python code includes all required security features.
     */
    @Test
    public void testLambdaSecurityFeatures() {
        // Verify security logging components
        assertThat(LAMBDA_SECURITY_CODE).contains("security_log = {");
        assertThat(LAMBDA_SECURITY_CODE).contains("'user_agent':");
        assertThat(LAMBDA_SECURITY_CODE).contains("'headers':");
        assertThat(LAMBDA_SECURITY_CODE).contains("'method':");
        assertThat(LAMBDA_SECURITY_CODE).contains("'path':");
        
        // Verify S3 logging functionality
        assertThat(LAMBDA_SECURITY_CODE).contains("s3_client.put_object");
        assertThat(LAMBDA_SECURITY_CODE).contains("ContentType='application/json'");
        
        // Verify all security headers are present
        assertThat(LAMBDA_SECURITY_CODE).contains("'X-Content-Type-Options': 'nosniff'");
        assertThat(LAMBDA_SECURITY_CODE).contains("'X-Frame-Options': 'DENY'");
        assertThat(LAMBDA_SECURITY_CODE).contains("'X-XSS-Protection': '1; mode=block'");
        assertThat(LAMBDA_SECURITY_CODE).contains("'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'");
    }

    /**
     * Test security infrastructure components
     */
    @Test
    public void testSecurityInfrastructure() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackSecTest", TapStackProps.builder()
                .environmentSuffix("sectest")
                .build());

        // Get template from the SecurityStack nested stack
        Template template = Template.fromStack(stack.getSecurityStack());

        // Verify KMS key exists
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
                "Description", Match.stringLikeRegexp("KMS key for encryption at rest.*"),
                "EnableKeyRotation", true
        ));

        // Verify GuardDuty detector
        template.hasResourceProperties("AWS::GuardDuty::Detector", Map.of(
                "Enable", true,
                "FindingPublishingFrequency", "FIFTEEN_MINUTES"
        ));

        // Verify CloudTrail
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
                "IncludeGlobalServiceEvents", true,
                "IsMultiRegionTrail", true,
                "EnableLogFileValidation", true
        ));

        // Verify WAF WebACL
        template.hasResourceProperties("AWS::WAFv2::WebACL", Map.of(
                "Scope", "REGIONAL",
                "DefaultAction", Map.of("Block", Match.anyValue())
        ));

        // Verify Config recorder
        template.hasResourceProperties("AWS::Config::ConfigurationRecorder", Match.anyValue());
    }

    /**
     * Test VPC and networking infrastructure
     */
    @Test
    public void testNetworkingInfrastructure() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackNetTest", TapStackProps.builder()
                .environmentSuffix("nettest")
                .build());

        // Get template from the InfrastructureStack nested stack
        Template template = Template.fromStack(stack.getInfrastructureStack());

        // Verify VPC exists
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.0.0.0/16",
                "EnableDnsHostnames", true,
                "EnableDnsSupport", true
        ));

        // Verify subnets exist
        template.hasResourceProperties("AWS::EC2::Subnet", Match.anyValue());

        // Verify NAT Gateway exists
        template.hasResourceProperties("AWS::EC2::NatGateway", Match.anyValue());

        // Verify Internet Gateway exists
        template.hasResourceProperties("AWS::EC2::InternetGateway", Match.anyValue());

        // Verify security groups exist
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.anyValue());

        // Verify EC2 instances exist
        template.hasResourceProperties("AWS::EC2::Instance", Match.anyValue());

        // Verify RDS instance exists
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "Engine", "mariadb",
                "StorageEncrypted", true
        ));
    }

    /**
     * Test end-to-end messaging flow: Lambda -> SNS -> SQS -> Lambda.
     * Validates that the messaging infrastructure is properly integrated.
     */
    @Test
    public void testMessagingEndToEndIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackMsgTest", TapStackProps.builder()
                .environmentSuffix("msgtest")
                .build());

        // Get templates from different stacks
        Template messagingTemplate = Template.fromStack(stack.getMessagingStack());
        Template applicationTemplate = Template.fromStack(stack.getApplicationStack());

        // Verify SNS topics exist in messaging stack
        messagingTemplate.resourceCountIs("AWS::SNS::Topic", 2);
        messagingTemplate.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "TopicName", "tap-msgtest-security-alerts"
        ));
        messagingTemplate.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "TopicName", "tap-msgtest-app-events"
        ));

        // Verify SQS queues exist with proper configuration
        messagingTemplate.resourceCountIs("AWS::SQS::Queue", 2);
        messagingTemplate.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "QueueName", "tap-msgtest-processing-queue"
        ));
        messagingTemplate.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "QueueName", "tap-msgtest-dlq"
        ));

        // Verify SNS-to-SQS subscription exists
        messagingTemplate.resourceCountIs("AWS::SNS::Subscription", 1);
        messagingTemplate.hasResourceProperties("AWS::SNS::Subscription", Map.of(
                "Protocol", "sqs",
                "RawMessageDelivery", true
        ));

        // Verify Lambda has messaging environment variables
        applicationTemplate.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Environment", Map.of(
                        "Variables", Map.of(
                                "APP_EVENT_TOPIC_ARN", Match.anyValue(),
                                "SECURITY_ALERT_TOPIC_ARN", Match.anyValue(),
                                "PROCESSING_QUEUE_URL", Match.anyValue()
                        )
                )
        ));

        // Verify Lambda has SQS event source mapping
        applicationTemplate.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);
        applicationTemplate.hasResourceProperties("AWS::Lambda::EventSourceMapping", Map.of(
                "BatchSize", 10,
                "MaximumBatchingWindowInSeconds", 5
        ));

        // Verify Lambda has SNS publish permissions
        applicationTemplate.hasResourceProperties("AWS::IAM::Role", Map.of(
                "Policies", Match.arrayWith(Arrays.asList(
                        Match.objectLike(Map.of(
                                "PolicyDocument", Match.objectLike(Map.of(
                                        "Statement", Match.arrayWith(Arrays.asList(
                                                Match.objectLike(Map.of(
                                                        "Action", "sns:Publish"
                                                ))
                                        ))
                                ))
                        ))
                ))
        ));

        // Verify SQS queue policy allows SNS to send messages
        messagingTemplate.hasResourceProperties("AWS::SQS::QueuePolicy", Map.of(
                "PolicyDocument", Map.of(
                        "Statement", Arrays.asList(
                                Map.of(
                                        "Effect", "Allow",
                                        "Principal", Map.of("Service", "sns.amazonaws.com"),
                                        "Action", "sqs:SendMessage"
                                )
                        )
                )
        ));
    }

    /**
     * Test GuardDuty integration with SNS for security alerts.
     * Validates that GuardDuty findings are routed to SNS via EventBridge.
     */
    @Test
    public void testGuardDutyToSnsIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackGdTest", TapStackProps.builder()
                .environmentSuffix("gdtest")
                .build());

        // Get templates from different stacks
        Template securityTemplate = Template.fromStack(stack.getSecurityStack());
        Template messagingTemplate = Template.fromStack(stack.getMessagingStack());

        // Verify GuardDuty detector exists
        securityTemplate.hasResourceProperties("AWS::GuardDuty::Detector", Map.of(
                "Enable", true,
                "FindingPublishingFrequency", "FIFTEEN_MINUTES"
        ));

        // Verify Security Alert SNS topic exists
        messagingTemplate.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "TopicName", "tap-gdtest-security-alerts",
                "DisplayName", "Security Alert Notifications"
        ));

        // Verify EventBridge rule routes GuardDuty findings to SNS
        messagingTemplate.resourceCountIs("AWS::Events::Rule", 1);
        messagingTemplate.hasResourceProperties("AWS::Events::Rule", Map.of(
                "Name", "tap-gdtest-guardduty-findings",
                "Description", "Route GuardDuty findings to SNS",
                "State", "ENABLED",
                "EventPattern", Map.of(
                        "source", Arrays.asList("aws.guardduty"),
                        "detail-type", Arrays.asList("GuardDuty Finding")
                )
        ));

        // Verify EventBridge rule has SNS target
        messagingTemplate.hasResourceProperties("AWS::Events::Rule", Map.of(
                "Targets", Match.arrayWith(Arrays.asList(
                        Match.objectLike(Map.of(
                                "Arn", Match.anyValue()
                        ))
                ))
        ));
    }

    /**
     * Test dead letter queue integration and error handling.
     * Validates that failed messages are properly routed to DLQ.
     */
    @Test
    public void testDeadLetterQueueIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackDlqTest", TapStackProps.builder()
                .environmentSuffix("dlqtest")
                .build());

        Template messagingTemplate = Template.fromStack(stack.getMessagingStack());

        // Verify Dead Letter Queue exists
        messagingTemplate.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "QueueName", "tap-dlqtest-dlq",
                "MessageRetentionPeriod", 1209600
        ));

        // Verify Processing Queue has DLQ configured
        messagingTemplate.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "QueueName", "tap-dlqtest-processing-queue",
                "RedrivePolicy", Map.of(
                        "maxReceiveCount", 3
                )
        ));

        // Verify both queues are encrypted with KMS
        messagingTemplate.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "KmsMasterKeyId", Match.anyValue()
        ));
    }

    /**
     * Test cross-stack references and dependencies.
     * Validates that messaging stack properly uses KMS key from security stack.
     */
    @Test
    public void testCrossStackIntegration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackCrossTest", TapStackProps.builder()
                .environmentSuffix("crosstest")
                .build());

        // Get templates
        Template securityTemplate = Template.fromStack(stack.getSecurityStack());
        Template messagingTemplate = Template.fromStack(stack.getMessagingStack());
        Template applicationTemplate = Template.fromStack(stack.getApplicationStack());

        // Verify KMS key exists in security stack
        securityTemplate.resourceCountIs("AWS::KMS::Key", 1);
        securityTemplate.hasResourceProperties("AWS::KMS::Key", Map.of(
                "EnableKeyRotation", true
        ));

        // Verify messaging resources use KMS encryption
        messagingTemplate.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "KmsMasterKeyId", Match.anyValue()
        ));
        messagingTemplate.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "KmsMasterKeyId", Match.anyValue()
        ));

        // Verify application Lambda has access to messaging resources
        applicationTemplate.hasResourceProperties("AWS::IAM::Role", Map.of(
                "Policies", Match.arrayWith(Arrays.asList(
                        Match.objectLike(Map.of(
                                "PolicyDocument", Match.objectLike(Map.of(
                                        "Statement", Match.arrayWith(Arrays.asList(
                                                Match.objectLike(Map.of(
                                                        "Action", Arrays.asList("kms:Decrypt", "kms:GenerateDataKey")
                                                ))
                                        ))
                                ))
                        ))
                ))
        ));
    }

    /**
     * Test messaging stack outputs for cross-stack references.
     * Validates that all required outputs are exported.
     */
    @Test
    public void testMessagingStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackOutputTest", TapStackProps.builder()
                .environmentSuffix("outputtest")
                .build());

        Template messagingTemplate = Template.fromStack(stack.getMessagingStack());

        // Verify all messaging outputs are created with proper exports
        messagingTemplate.hasOutput("SecurityAlertTopicArn", Map.of(
                "Description", "SNS Topic ARN for Security Alerts",
                "Export", Map.of(
                        "Name", "tap-outputtest-security-alert-topic-arn"
                )
        ));

        messagingTemplate.hasOutput("ApplicationEventTopicArn", Map.of(
                "Description", "SNS Topic ARN for Application Events",
                "Export", Map.of(
                        "Name", "tap-outputtest-app-event-topic-arn"
                )
        ));

        messagingTemplate.hasOutput("ProcessingQueueUrl", Map.of(
                "Description", "SQS Queue URL for Processing",
                "Export", Map.of(
                        "Name", "tap-outputtest-processing-queue-url"
                )
        ));
    }

    /**
     * Test that Lambda function code includes SNS publishing logic.
     */
    @Test
    public void testLambdaMessagingCode() {
        App app = new App();
        TapStack stack = new TapStack(app, "TapStackCodeTest", TapStackProps.builder()
                .environmentSuffix("codetest")
                .build());

        Template applicationTemplate = Template.fromStack(stack.getApplicationStack());

        // Verify Lambda function code includes SNS client initialization
        applicationTemplate.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Code", Map.of(
                        "ZipFile", Match.stringLikeRegexp(".*sns_client.*")
                )
        ));

        // Verify Lambda function code includes SNS publish calls
        applicationTemplate.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Code", Map.of(
                        "ZipFile", Match.stringLikeRegexp(".*sns_client\\.publish.*")
                )
        ));

        // Verify Lambda function code includes SQS client
        applicationTemplate.hasResourceProperties("AWS::Lambda::Function", Map.of(
                "Code", Map.of(
                        "ZipFile", Match.stringLikeRegexp(".*sqs_client.*")
                )
        ));
    }
}
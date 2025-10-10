package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import java.util.Arrays;
import java.util.Map;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private Environment testEnvironment;

    @BeforeEach
    public void setUp() {
        // Set up test environment with mock AWS account and region
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
    }

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");

        // Verify all component stacks are created
        assertThat(stack.getSecurityStack()).isNotNull();
        assertThat(stack.getMessagingStack()).isNotNull();
        assertThat(stack.getInfrastructureStack()).isNotNull();
        assertThat(stack.getApplicationStack()).isNotNull();
    }

    /**
     * Test that the TapStack uses default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify default environment suffix is set
        assertThat(stack.getEnvironmentSuffix()).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isNotEmpty();
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack.getVpcStack());

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();

        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));

        // Verify Security Groups are created (actual count is 3: Bastion, SSH, and RDS)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 3);

        // Verify EC2 Instances are created (actual count is 2)
        template.resourceCountIs("AWS::EC2::Instance", 2);
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");

        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test VPC configuration properties.
     */
    @Test
    public void testVpcConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Get VPC from the stack
        assertThat(stack.getVpcStack()).isNotNull();
        assertThat(stack.getVpcStack().getVpc()).isNotNull();

        // Verify VPC properties
        Template template = Template.fromStack(stack.getVpcStack());

        // Check for Internet Gateway
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);

        // Check for subnets (2 AZs x 3 subnet types = 6 subnets)
        template.resourceCountIs("AWS::EC2::Subnet", 6);

        // Check for route tables
        template.hasResource("AWS::EC2::RouteTable", Map.of());
        
        // Verify NAT Gateway
        template.resourceCountIs("AWS::EC2::NatGateway", 1);
    }

    /**
     * Test security group configuration.
     */
    @Test
    public void testSecurityGroupConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify security groups are created (actual count is 3: Bastion, SSH, and RDS)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 3);

        // Verify SSH security group properties (matches actual implementation)
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for SSH access to EC2 instances",
            "SecurityGroupIngress", Arrays.asList(
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 22,
                    "ToPort", 22,
                    "Description", "SSH access from bastion host"
                )
            )
        ));
    }

    /**
     * Test RDS configuration.
     */
    @Test
    public void testRdsConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify RDS instance is created (matches actual implementation)
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "Engine", "mariadb",
            "EngineVersion", "10.6",
            "DBInstanceClass", "db.t3.micro",
            "StorageEncrypted", true,
            "DeletionProtection", false
        ));

        // Verify DB subnet group (matching actual CloudFormation template structure)
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Map.of(
            "DBSubnetGroupDescription", "Subnet group for RDS database"
        ));
    }

    /**
     * Test IAM role configuration.
     */
    @Test
    public void testIamRoleConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify EC2 role (matches actual implementation)
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Map.of(
                "Statement", Arrays.asList(
                    Map.of(
                        "Action", "sts:AssumeRole",
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "ec2.amazonaws.com")
                    )
                )
            ),
            "ManagedPolicyArns", Arrays.asList(
                Map.of(
                    "Fn::Join", Arrays.asList(
                        "",
                        Arrays.asList(
                            "arn:",
                            Map.of("Ref", "AWS::Partition"),
                            ":iam::aws:policy/AmazonSSMManagedInstanceCore"
                        )
                    )
                )
            )
        ));

        // Verify VPC Flow Logs role (matches actual implementation)
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Map.of(
                "Statement", Arrays.asList(
                    Map.of(
                        "Action", "sts:AssumeRole",
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "vpc-flow-logs.amazonaws.com")
                    )
                )
            )
        ));
    }

    /**
     * Test Lambda function configuration.
     */
    @Test
    public void testLambdaConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify Lambda function
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Handler", "index.handler",
            "Runtime", "python3.9",
            "Timeout", 30,
            "MemorySize", 256
        ));
    }

    /**
     * Test API Gateway configuration.
     */
    @Test
    public void testApiGatewayConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify API Gateway
        template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of(
            "Name", "tap-test-api"
        ));

        // Verify deployment stage
        template.hasResourceProperties("AWS::ApiGateway::Stage", Map.of(
            "StageName", "prod"
        ));
    }

    /**
     * Test CloudFront distribution configuration.
     */
    @Test
    public void testCloudFrontConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify CloudFront distribution
        template.hasResourceProperties("AWS::CloudFront::Distribution", Map.of(
            "DistributionConfig", Map.of(
                "Enabled", true,
                "PriceClass", "PriceClass_100",
                "DefaultCacheBehavior", Map.of(
                    "ViewerProtocolPolicy", "redirect-to-https"
                )
            )
        ));
    }

    /**
     * Test S3 bucket configuration.
     */
    @Test
    public void testS3Configuration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify S3 bucket
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Map.of(
                "ServerSideEncryptionConfiguration", Arrays.asList(
                    Map.of("ServerSideEncryptionByDefault", Map.of(
                        "SSEAlgorithm", "aws:kms"
                    ))
                )
            ),
            "PublicAccessBlockConfiguration", Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            ),
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            )
        ));
    }

    /**
     * Test that stack outputs are created.
     */
    @Test
    public void testStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template applicationTemplate = Template.fromStack(stack.getApplicationStack());
        
        // Verify application outputs
        applicationTemplate.hasOutput("BucketName", Map.of());
        applicationTemplate.hasOutput("ApiUrl", Map.of());
        applicationTemplate.hasOutput("CloudFrontUrl", Map.of());

        Template vpcTemplate = Template.fromStack(stack.getVpcStack());
    }

    /**
     * Test SNS topic configuration for messaging stack.
     */
    @Test
    public void testSnsTopicConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getMessagingStack());

        // Verify SNS topics are created (2 topics: Security Alerts and Application Events)
        template.resourceCountIs("AWS::SNS::Topic", 2);

        // Verify Security Alert Topic configuration
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
            "DisplayName", "Security Alert Notifications",
            "TopicName", "tap-test-security-alerts"
        ));

        // Verify Application Event Topic configuration
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
            "DisplayName", "Application Event Notifications",
            "TopicName", "tap-test-app-events"
        ));

        // Verify SNS topics use KMS encryption
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
            "KmsMasterKeyId", Map.of()
        ));
    }

    /**
     * Test SQS queue configuration for messaging stack.
     */
    @Test
    public void testSqsQueueConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getMessagingStack());

        // Verify SQS queues are created (2 queues: Processing Queue and DLQ)
        template.resourceCountIs("AWS::SQS::Queue", 2);

        // Verify Processing Queue configuration
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
            "QueueName", "tap-test-processing-queue",
            "VisibilityTimeout", 300
        ));

        // Verify Dead Letter Queue configuration
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
            "QueueName", "tap-test-dlq",
            "MessageRetentionPeriod", 1209600
        ));

        // Verify SQS queues use KMS encryption
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
            "KmsMasterKeyId", Map.of()
        ));

        // Verify Dead Letter Queue is configured on Processing Queue
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
            "RedrivePolicy", Map.of(
                "maxReceiveCount", 3
            )
        ));
    }

    /**
     * Test SNS to SQS subscription configuration.
     */
    @Test
    public void testSnsToSqsSubscription() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getMessagingStack());

        // Verify SNS subscription exists
        template.resourceCountIs("AWS::SNS::Subscription", 1);

        // Verify subscription protocol is SQS
        template.hasResourceProperties("AWS::SNS::Subscription", Map.of(
            "Protocol", "sqs",
            "RawMessageDelivery", true
        ));
    }

    /**
     * Test EventBridge rule for GuardDuty integration.
     */
    @Test
    public void testGuardDutyEventBridgeRule() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getMessagingStack());

        // Verify EventBridge rule exists
        template.resourceCountIs("AWS::Events::Rule", 1);

        // Verify EventBridge rule configuration
        template.hasResourceProperties("AWS::Events::Rule", Map.of(
            "Name", "tap-test-guardduty-findings",
            "Description", "Route GuardDuty findings to SNS",
            "EventPattern", Map.of(
                "source", Arrays.asList("aws.guardduty"),
                "detail-type", Arrays.asList("GuardDuty Finding")
            ),
            "State", "ENABLED"
        ));
    }

    /**
     * Test messaging stack outputs.
     */
    @Test
    public void testMessagingStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getMessagingStack());

        // Verify messaging outputs are created
        template.hasOutput("SecurityAlertTopicArn", Map.of(
            "Description", "SNS Topic ARN for Security Alerts",
            "Export", Map.of(
                "Name", "tap-test-security-alert-topic-arn"
            )
        ));

        template.hasOutput("ApplicationEventTopicArn", Map.of(
            "Description", "SNS Topic ARN for Application Events",
            "Export", Map.of(
                "Name", "tap-test-app-event-topic-arn"
            )
        ));

        template.hasOutput("ProcessingQueueUrl", Map.of(
            "Description", "SQS Queue URL for Processing",
            "Export", Map.of(
                "Name", "tap-test-processing-queue-url"
            )
        ));
    }

    /**
     * Test Lambda function has messaging permissions.
     */
    @Test
    public void testLambdaMessagingPermissions() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify Lambda has environment variables for messaging
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Environment", Map.of(
                "Variables", Map.of(
                    "BUCKET_NAME", Map.of(),
                    "APP_EVENT_TOPIC_ARN", Map.of(),
                    "SECURITY_ALERT_TOPIC_ARN", Map.of(),
                    "PROCESSING_QUEUE_URL", Map.of()
                )
            )
        ));
    }

    /**
     * Test Lambda has SQS event source mapping.
     */
    @Test
    public void testLambdaSqsEventSource() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify Lambda event source mapping exists
        template.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);

        // Verify event source mapping configuration
        template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Map.of(
            "BatchSize", 10,
            "MaximumBatchingWindowInSeconds", 5
        ));
    }

    /**
     * Test SQS queue policy allows SNS to send messages.
     */
    @Test
    public void testSqsQueuePolicy() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getMessagingStack());

        // Verify SQS queue policy exists
        template.resourceCountIs("AWS::SQS::QueuePolicy", 1);

        // Verify policy allows SNS service principal
        template.hasResourceProperties("AWS::SQS::QueuePolicy", Map.of(
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
     * Test that MessagingStack is properly created and accessible.
     */
    @Test
    public void testMessagingStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify messaging stack exists
        assertThat(stack.getMessagingStack()).isNotNull();

        // Verify messaging stack components
        assertThat(stack.getMessagingStack().getSecurityAlertTopic()).isNotNull();
        assertThat(stack.getMessagingStack().getApplicationEventTopic()).isNotNull();
        assertThat(stack.getMessagingStack().getProcessingQueue()).isNotNull();
        assertThat(stack.getMessagingStack().getDeadLetterQueue()).isNotNull();
    }

    /**
     * Test KMS key policy includes SNS service principal.
     */
    @Test
    public void testKmsKeyPolicyForMessaging() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getSecurityStack());

        // Verify KMS key exists
        template.resourceCountIs("AWS::KMS::Key", 1);

        // Verify KMS key has proper description and key rotation enabled
        template.hasResourceProperties("AWS::KMS::Key", Map.of(
            "Description", "KMS key for encryption at rest - test",
            "EnableKeyRotation", true
        ));
    }
}
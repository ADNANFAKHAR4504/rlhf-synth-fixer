# AWS CDK Java Implementation: Secure Cloud Infrastructure with Messaging & Notifications

## Problem Statement

Your task is to write a **Java program using AWS Cloud Development Kit (CDK)** to set up a secure AWS cloud environment following best practices for security and compliance. The environment includes a collection of interconnected AWS services such as EC2, Lambda, S3, RDS, **SNS, SQS**, and others within a VPC. The implementation must adhere to the following security constraints:

## Security Requirements

### 1. IAM Security
- **Requirement 1**: Ensure IAM roles allow only specific actions to the Lambda function
- **Requirement 2**: Enforce MFA for IAM users accessing the application  
- **Requirement 14**: Limit IAM user policies to specific resource ARNs for least privilege

### 2. Network Security
- **Requirement 7**: Ensure that EC2 instances are launched within a VPC
- **Requirement 8**: Ensure no security groups permit inbound SSH access from 0.0.0.0/0
- **Requirement 17**: Deploy a bastion host for SSH access to production servers
- **Requirement 19**: Setup VPC flow logs to monitor and log traffic into the VPC

### 3. Storage Security
- **Requirement 3**: Restrict S3 bucket access to only specific IP addresses
- **Requirement 6**: Encrypt all data at rest using AWS KMS wherever applicable
- **Requirement 13**: Ensure that EBS volumes are encrypted when created
- **Requirement 16**: Require all actions in S3 buckets to be logged with AWS CloudTrail

### 4. Database Security
- **Requirement 4**: Disable public access to all RDS instances within the VPC

### 5. Web Application Security
- **Requirement 9**: Ensure that any CloudFront distribution enforces HTTPS-only traffic
- **Requirement 15**: Ensure that AWS WAF is used for any publicly facing API
- **Requirement 18**: Implement AWS Shield to protect against volumetric DDoS attacks

### 6. Monitoring and Compliance
- **Requirement 5**: Implement CloudTrail to monitor all AWS API calls
- **Requirement 10**: Audit logs should be set with a retention period of at least 365 days
- **Requirement 11**: Deploy GuardDuty to continuously monitor AWS accounts for threats
- **Requirement 12**: Utilize AWS Config to track resource configuration and compliance

### 7. Messaging and Notifications (NEW)
- **Requirement 20**: Implement SNS topics with KMS encryption for security alerts and notifications
- **Requirement 21**: Deploy SQS queues with encryption and dead-letter queues for reliable message processing
- **Requirement 22**: Configure SNS to send alerts for GuardDuty findings and CloudWatch alarms
- **Requirement 23**: Ensure SQS queues have restricted access policies allowing only authorized services

## Expected Deliverables

### Core Implementation

Create a **Java program utilizing AWS CDK** with the following components:

#### 1. Security Stack

```java
/**
 * Security Infrastructure Stack
 * 
 * Creates comprehensive security infrastructure including KMS, IAM, GuardDuty,
 * CloudTrail, Config, and WAF components.
 */
class SecurityStack extends Stack {
    private final Key kmsKey;
    private final CfnDetector guardDutyDetector;
    private final Trail cloudTrail;
    private final CfnWebACL webAcl;
    private final LogGroup securityLogGroup;

    SecurityStack(final Construct scope, final String id, 
                  final String environmentSuffix, final List<String> allowedIpAddresses, 
                  final StackProps props) {
        super(scope, id, props);

        // Create KMS Key for encryption at rest
        this.kmsKey = Key.Builder.create(this, "SecurityKmsKey")
                .description("KMS key for encryption at rest - " + environmentSuffix)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create Security Log Group with 365 days retention
        this.securityLogGroup = LogGroup.Builder.create(this, "SecurityLogGroup")
                .logGroupName("/aws/security/tap-" + environmentSuffix)
                .retention(RetentionDays.ONE_YEAR)
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Enable GuardDuty
        this.guardDutyDetector = CfnDetector.Builder.create(this, "GuardDutyDetector")
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .build();

        // Setup CloudTrail, AWS Config, and WAF...
    }
}
```

#### 2. Infrastructure Stack

```java
/**
 * VPC Infrastructure Stack with enhanced security
 */
class InfrastructureStack extends Stack {
    private final Vpc vpc;
    private final Instance ec2Instance;
    private final Instance bastionHost;
    private final SecurityGroup sshSecurityGroup;
    private final SecurityGroup bastionSecurityGroup;
    private final DatabaseInstance rdsInstance;

    InfrastructureStack(final Construct scope, final String id, 
                       final String environmentSuffix, final List<String> allowedIpAddresses,
                       final Key kmsKey, final StackProps props) {
        super(scope, id, props);

        // Create VPC with both public and private subnets
        this.vpc = Vpc.Builder.create(this, "MainVpc")
                .vpcName("tap-" + environmentSuffix + "-vpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .enableDnsSupport(true)
                .enableDnsHostnames(true)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PUBLIC)
                                .name("PublicSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .name("PrivateSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .name("DatabaseSubnet")
                                .cidrMask(28)
                                .build()))
                .natGateways(1)
                .build();

        // Enable VPC Flow Logs
        LogGroup vpcFlowLogGroup = LogGroup.Builder.create(this, "VpcFlowLogGroup")
                .logGroupName("/aws/vpc/flowlogs-" + environmentSuffix)
                .retention(RetentionDays.ONE_YEAR)
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        FlowLog.Builder.create(this, "VpcFlowLog")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .destination(FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup))
                .build();

        // Create bastion host and secure EC2 instances...
    }
}
```

#### 3. Messaging Stack (NEW)

```java
/**
 * Messaging and Notification Stack
 * 
 * Creates SNS topics for alerts and SQS queues for asynchronous processing
 */
class MessagingStack extends Stack {
    private final Topic securityAlertTopic;
    private final Topic applicationEventTopic;
    private final Queue processingQueue;
    private final Queue deadLetterQueue;

    MessagingStack(final Construct scope, final String id, 
                  final String environmentSuffix, final Key kmsKey, 
                  final StackProps props) {
        super(scope, id, props);

        // Create Dead Letter Queue for failed messages
        this.deadLetterQueue = Queue.Builder.create(this, "DeadLetterQueue")
                .queueName("tap-" + environmentSuffix + "-dlq")
                .encryption(QueueEncryption.KMS)
                .encryptionMasterKey(kmsKey)
                .retentionPeriod(Duration.days(14))
                .build();

        // Create main processing queue with DLQ
        this.processingQueue = Queue.Builder.create(this, "ProcessingQueue")
                .queueName("tap-" + environmentSuffix + "-processing-queue")
                .encryption(QueueEncryption.KMS)
                .encryptionMasterKey(kmsKey)
                .visibilityTimeout(Duration.seconds(300))
                .deadLetterQueue(DeadLetterQueue.builder()
                        .queue(deadLetterQueue)
                        .maxReceiveCount(3)
                        .build())
                .build();

        // Create SNS topic for security alerts
        this.securityAlertTopic = Topic.Builder.create(this, "SecurityAlertTopic")
                .topicName("tap-" + environmentSuffix + "-security-alerts")
                .displayName("Security Alert Notifications")
                .masterKey(kmsKey)
                .build();

        // Create SNS topic for application events
        this.applicationEventTopic = Topic.Builder.create(this, "ApplicationEventTopic")
                .topicName("tap-" + environmentSuffix + "-app-events")
                .displayName("Application Event Notifications")
                .masterKey(kmsKey)
                .build();

        // Subscribe SQS queue to application events topic
        this.applicationEventTopic.addSubscription(
                SqsSubscription.Builder.create(processingQueue)
                        .rawMessageDelivery(true)
                        .build());

        // Add email subscription for security alerts (optional)
        // this.securityAlertTopic.addSubscription(
        //         new EmailSubscription("security-team@example.com"));

        // Add access policies for SQS
        processingQueue.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(Arrays.asList(new ServicePrincipal("sns.amazonaws.com")))
                .actions(Arrays.asList("sqs:SendMessage"))
                .resources(Arrays.asList(processingQueue.getQueueArn()))
                .conditions(Map.of("ArnEquals", Map.of(
                        "aws:SourceArn", applicationEventTopic.getTopicArn())))
                .build());
    }

    public Topic getSecurityAlertTopic() {
        return securityAlertTopic;
    }

    public Topic getApplicationEventTopic() {
        return applicationEventTopic;
    }

    public Queue getProcessingQueue() {
        return processingQueue;
    }

    public Queue getDeadLetterQueue() {
        return deadLetterQueue;
    }
}
```

#### 4. Application Stack

```java
/**
 * Application Stack with Lambda, S3, API Gateway, and messaging integration
 */
class ApplicationStack extends Stack {
    private final Function lambdaFunction;
    private final Bucket s3Bucket;
    private final RestApi apiGateway;
    private final Distribution cloudFrontDistribution;

    ApplicationStack(final Construct scope, final String id, 
                    final String environmentSuffix, final List<String> allowedIpAddresses,
                    final Key kmsKey, final CfnWebACL webAcl, 
                    final Topic securityAlertTopic, final Topic applicationEventTopic,
                    final Queue processingQueue, final StackProps props) {
        super(scope, id, props);

        // Create S3 bucket with IP restrictions and encryption
        this.s3Bucket = Bucket.Builder.create(this, "AppBucket")
                .bucketName("tap-" + environmentSuffix + "-app-data-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create IAM role for Lambda with least privilege + messaging permissions
        Role lambdaRole = Role.Builder.create(this, "LambdaRole")
                .roleName("tap-" + environmentSuffix + "-lambda-role")
                .assumedBy(ServicePrincipal.Builder.create("lambda.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")))
                .inlinePolicies(Map.of("RestrictedAccess", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                                        .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("sns:Publish"))
                                        .resources(Arrays.asList(
                                                applicationEventTopic.getTopicArn(),
                                                securityAlertTopic.getTopicArn()))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList(
                                                "sqs:SendMessage",
                                                "sqs:ReceiveMessage",
                                                "sqs:DeleteMessage",
                                                "sqs:GetQueueAttributes"))
                                        .resources(Arrays.asList(processingQueue.getQueueArn()))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("kms:Decrypt", "kms:GenerateDataKey"))
                                        .resources(Arrays.asList(kmsKey.getKeyArn()))
                                        .build()))
                        .build()))
                .build();

        // Create Lambda function with environment variables for SNS/SQS
        this.lambdaFunction = Function.Builder.create(this, "AppFunction")
                .functionName("tap-" + environmentSuffix + "-app-function")
                .runtime(Runtime.PYTHON_3_11)
                .handler("index.handler")
                .code(Code.fromInline(
                        "import json\n" +
                        "import boto3\n" +
                        "import os\n\n" +
                        "sns = boto3.client('sns')\n" +
                        "sqs = boto3.client('sqs')\n\n" +
                        "def handler(event, context):\n" +
                        "    # Publish to SNS\n" +
                        "    sns.publish(\n" +
                        "        TopicArn=os.environ['APP_EVENT_TOPIC_ARN'],\n" +
                        "        Message=json.dumps({'event': 'processed', 'data': event})\n" +
                        "    )\n" +
                        "    return {'statusCode': 200, 'body': json.dumps('Success')}\n"))
                .environment(Map.of(
                        "APP_EVENT_TOPIC_ARN", applicationEventTopic.getTopicArn(),
                        "SECURITY_ALERT_TOPIC_ARN", securityAlertTopic.getTopicArn(),
                        "PROCESSING_QUEUE_URL", processingQueue.getQueueUrl()))
                .role(lambdaRole)
                .timeout(Duration.seconds(30))
                .build();

        // Add SQS as event source for Lambda
        lambdaFunction.addEventSource(SqsEventSource.Builder.create(processingQueue)
                .batchSize(10)
                .maxBatchingWindow(Duration.seconds(5))
                .build());

        // Create API Gateway with WAF protection and rate limiting...
    }
}
```

### Main Stack Orchestration

```java
/**
 * Main CDK stack that orchestrates all components
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final SecurityStack securityStack;
    private final InfrastructureStack infrastructureStack;
    private final MessagingStack messagingStack;
    private final ApplicationStack applicationStack;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix and allowed IPs
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        List<String> allowedIpAddresses = Optional.ofNullable(props)
                .map(TapStackProps::getAllowedIpAddresses)
                .orElse(Arrays.asList("203.0.113.0/32"));

        // Create security stack first
        this.securityStack = new SecurityStack(
                this, "Security", environmentSuffix, allowedIpAddresses,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Security Stack for environment: " + environmentSuffix)
                        .build());

        // Create messaging stack
        this.messagingStack = new MessagingStack(
                this, "Messaging", environmentSuffix, securityStack.getKmsKey(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Messaging Stack for environment: " + environmentSuffix)
                        .build());

        // Create infrastructure stack
        this.infrastructureStack = new InfrastructureStack(
                this, "Infrastructure", environmentSuffix, allowedIpAddresses,
                securityStack.getKmsKey(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Infrastructure Stack for environment: " + environmentSuffix)
                        .build());

        // Create application stack with messaging integration
        this.applicationStack = new ApplicationStack(
                this, "Application", environmentSuffix, allowedIpAddresses,
                securityStack.getKmsKey(), securityStack.getWebAcl(),
                messagingStack.getSecurityAlertTopic(),
                messagingStack.getApplicationEventTopic(),
                messagingStack.getProcessingQueue(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? 
                            props.getStackProps().getEnv() : null)
                        .description("Application Stack for environment: " + environmentSuffix)
                        .build());

        // Add stack dependencies
        messagingStack.addDependency(securityStack);
        infrastructureStack.addDependency(securityStack);
        applicationStack.addDependency(securityStack);
        applicationStack.addDependency(messagingStack);
        applicationStack.addDependency(infrastructureStack);
    }
}
```

## Project Structure

```
src/
├── main/
│   └── java/
│       └── app/
│           ├── Main.java
│           ├── TapStack.java
│           ├── SecurityStack.java
│           ├── InfrastructureStack.java
│           ├── MessagingStack.java (NEW)
│           └── ApplicationStack.java
└── test/
    └── java/
        └── SecurityComplianceTest.java

build.gradle
cdk.json
README.md
```

## Security Implementation Checklist

### IAM & Access Control
- [ ] **IAM Roles**: Lambda role with specific S3, KMS, SNS, and SQS permissions only
- [ ] **MFA Enforcement**: IAM policies requiring MFA for user access
- [ ] **Least Privilege**: All IAM policies scoped to specific resource ARNs

### Network Security
- [ ] **VPC Deployment**: All EC2 instances launched within VPC subnets
- [ ] **SSH Security**: No direct SSH from internet, bastion host with IP restrictions
- [ ] **VPC Flow Logs**: Network traffic monitoring and logging enabled

### Storage & Encryption
- [ ] **S3 IP Restrictions**: Bucket policies limiting access to specified IP ranges
- [ ] **KMS Encryption**: All S3 buckets, EBS volumes, RDS instances, SNS topics, SQS queues, and logs encrypted
- [ ] **EBS Encryption**: All EC2 block devices encrypted with KMS

### Database Security
- [ ] **Private RDS**: Database instances in isolated subnets, no public access

### Web Application Security
- [ ] **HTTPS Enforcement**: CloudFront distributions redirect HTTP to HTTPS
- [ ] **WAF Protection**: Web Application Firewall protecting public APIs
- [ ] **Shield Protection**: AWS Shield Standard enabled for DDoS protection

### Messaging & Notifications (NEW)
- [ ] **SNS Encryption**: All SNS topics encrypted with KMS
- [ ] **SQS Encryption**: All SQS queues encrypted with KMS
- [ ] **Dead Letter Queues**: Failed message handling with DLQ configuration
- [ ] **Restricted Access**: SNS/SQS access policies limiting to authorized services only
- [ ] **Security Alerts**: SNS configured for GuardDuty and CloudWatch alarm notifications

### Monitoring & Compliance
- [ ] **CloudTrail**: Multi-region trail with encryption and 365-day log retention
- [ ] **365-Day Retention**: All CloudWatch log groups configured for 1-year retention
- [ ] **GuardDuty**: Threat detection enabled with S3 and malware protection
- [ ] **AWS Config**: Resource compliance monitoring and configuration tracking
- [ ] **CloudTrail S3 Logging**: All S3 API calls logged and monitored

### Infrastructure Security
- [ ] **Bastion Host**: Secure SSH access through dedicated jump server

## Testing Requirements

The implementation must include **unit tests** that verify security configurations comply with the requirements:

```java
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.cdk.assertions.Template;
import software.amazon.awscdk.cdk.assertions.Match;

class SecurityComplianceTest {

    @Test
    void testSecurityGroupRestrictionsCompliance() {
        // Arrange
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .allowedIpAddresses(Arrays.asList("203.0.113.0/32"))
                .build());

        // Act
        Template template = Template.fromStack(stack);

        // Assert - Verify no security groups allow SSH from 0.0.0.0/0
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
                "SecurityGroupIngress", Match.arrayWith(
                        Match.objectLike(Map.of(
                                "IpProtocol", "tcp",
                                "FromPort", 22,
                                "CidrIp", Match.not("0.0.0.0/0")
                        ))
                )
        ));
    }

    @Test
    void testS3BucketEncryptionCompliance() {
        // Verify all S3 buckets use KMS encryption
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of(
                        "ServerSideEncryptionConfiguration", Match.arrayWith(
                                Match.objectLike(Map.of(
                                        "ServerSideEncryptionByDefault", Map.of(
                                                "SSEAlgorithm", "aws:kms"
                                        )
                                ))
                        )
                )
        ));
    }

    @Test
    void testRDSPrivateAccessCompliance() {
        // Verify RDS instances are not publicly accessible
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "PubliclyAccessible", false
        ));
    }

    @Test
    void testSNSEncryptionCompliance() {
        // Verify SNS topics use KMS encryption
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::SNS::Topic", Map.of(
                "KmsMasterKeyId", Match.anyValue()
        ));
    }

    @Test
    void testSQSEncryptionCompliance() {
        // Verify SQS queues use KMS encryption
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "KmsMasterKeyId", Match.anyValue()
        ));
    }

    @Test
    void testDeadLetterQueueCompliance() {
        // Verify processing queue has DLQ configured
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::SQS::Queue", Map.of(
                "RedrivePolicy", Match.objectLike(Map.of(
                        "maxReceiveCount", 3
                ))
        ));
    }

    @Test
    void testCloudTrailEncryptionCompliance() {
        // Verify CloudTrail uses KMS encryption
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::CloudTrail::Trail", Map.of(
                "KMSKeyId", Match.anyValue(),
                "IncludeGlobalServiceEvents", true,
                "IsMultiRegionTrail", true
        ));
    }

    @Test
    void testVPCFlowLogsCompliance() {
        // Verify VPC Flow Logs are enabled
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        
        template.hasResourceProperties("AWS::EC2::FlowLog", Map.of(
                "ResourceType", "VPC"
        ));
    }
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Security Layer                          │
│  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌────────────┐     │
│  │    KMS   │  │ GuardDuty │  │CloudTrail│ │ AWS Config │     │
│  └──────────┘  └───────────┘  └─────────┘  └────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Messaging Layer (NEW)                       │
│  ┌────────────────┐         ┌─────────────────────────┐        │
│  │  SNS Topics    │────────▶│    SQS Queues + DLQ     │        │
│  │  - Security    │         │  - Processing Queue      │        │
│  │  - App Events  │         │  - Dead Letter Queue     │        │
│  └────────────────┘         └─────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────┐  ┌────────────┐  ┌─────────┐  ┌──────────────┐  │
│  │ Lambda   │─▶│ API Gateway│─▶│   WAF   │─▶│  CloudFront  │  │
│  └──────────┘  └────────────┘  └─────────┘  └──────────────┘  │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                   │
│  │ S3 Bucket│                                                   │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                         │
│  ┌─────────────────────────────────────────────────────┐       │
│  │                VPC (10.0.0.0/16)                     │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │       │
│  │  │Public Subnet │  │Private Subnet│  │  Database │ │       │
│  │  │              │  │              │  │  Subnet   │ │       │
│  │  │  Bastion     │  │  EC2         │  │           │ │       │
│  │  │  Host        │  │  Instance    │  │  RDS      │ │       │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │       │
│  │                                                      │       │
│  │  VPC Flow Logs ────────────────────────────────────▶│       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

The implementation should support environment-specific configuration through environment variables and context:

```java
/**
 * Main entry point for the CDK Java application
 */
public final class Main {

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable, context, or default
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        }
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Get allowed IP addresses from environment or use defaults
        String allowedIpsEnv = System.getenv("ALLOWED_IP_ADDRESSES");
        List<String> allowedIpAddresses;
        if (allowedIpsEnv != null && !allowedIpsEnv.isEmpty()) {
            allowedIpAddresses = Arrays.asList(allowedIpsEnv.split(","));
        } else {
            // Default to example IP - replace with your actual IPs
            allowedIpAddresses = Arrays.asList("203.0.113.0/32", "198.51.100.0/32");
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .allowedIpAddresses(allowedIpAddresses)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-1")
                                .build())
                        .build())
                .build());

        app.synth();
    }
}
```

## Build Configuration

### build.gradle

```gradle
plugins {
    id 'application'
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'software.amazon.awscdk:aws-cdk-lib:2.90.0'
    implementation 'software.constructs:constructs:10.2.69'
    
    testImplementation 'org.junit.jupiter:junit-jupiter:5.9.2'
    testImplementation 'software.amazon.awscdk:cdk-assertions:2.90.0'
}

application {
    mainClass = 'app.Main'
}

test {
    useJUnitPlatform()
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(11)
    }
}

compileJava {
    options.compilerArgs += ['-Xlint:unchecked', '-Xlint:deprecation']
}
```

### cdk.json

```json
{
  "app": "./gradlew run",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "build/**",
      ".gradle/**",
      "node_modules/**",
      "*.iml"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

## SNS and SQS Integration Examples

### Lambda Function Processing SQS Messages

```python
# Lambda function code for processing SQS messages
import json
import boto3
import os

sns = boto3.client('sns')
s3 = boto3.client('s3')

def handler(event, context):
    """
    Process messages from SQS queue and publish results to SNS
    """
    security_alert_topic = os.environ['SECURITY_ALERT_TOPIC_ARN']
    app_event_topic = os.environ['APP_EVENT_TOPIC_ARN']
    
    for record in event['Records']:
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            
            # Process the message
            result = process_message(message_body)
            
            # Publish success notification to app events topic
            sns.publish(
                TopicArn=app_event_topic,
                Subject='Message Processed Successfully',
                Message=json.dumps({
                    'status': 'success',
                    'messageId': record['messageId'],
                    'result': result
                })
            )
            
        except Exception as e:
            # Publish error notification to security alerts topic
            sns.publish(
                TopicArn=security_alert_topic,
                Subject='Message Processing Failed',
                Message=json.dumps({
                    'status': 'error',
                    'messageId': record['messageId'],
                    'error': str(e)
                })
            )
            raise
    
    return {
        'statusCode': 200,
        'body': json.dumps('Messages processed successfully')
    }

def process_message(message):
    """Process the message logic"""
    # Your business logic here
    return {'processed': True}
```

### CloudWatch Alarm Integration with SNS

```java
// Add CloudWatch alarm for DLQ messages
Alarm dlqAlarm = Alarm.Builder.create(this, "DeadLetterQueueAlarm")
        .alarmName("tap-" + environmentSuffix + "-dlq-messages")
        .alarmDescription("Alert when messages arrive in DLQ")
        .metric(deadLetterQueue.metricApproximateNumberOfMessagesVisible())
        .threshold(1)
        .evaluationPeriods(1)
        .comparisonOperator(ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD)
        .treatMissingData(TreatMissingData.NOT_BREACHING)
        .build();

// Add SNS action to alarm
dlqAlarm.addAlarmAction(new SnsAction(securityAlertTopic));
```

### GuardDuty Findings to SNS

```java
// Create EventBridge rule for GuardDuty findings
Rule guardDutyRule = Rule.Builder.create(this, "GuardDutyFindingsRule")
        .ruleName("tap-" + environmentSuffix + "-guardduty-findings")
        .description("Route GuardDuty findings to SNS")
        .eventPattern(EventPattern.builder()
                .source(Arrays.asList("aws.guardduty"))
                .detailType(Arrays.asList("GuardDuty Finding"))
                .detail(Map.of(
                        "severity", Arrays.asList(4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9,
                                                  5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9,
                                                  6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9,
                                                  7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9,
                                                  8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9)
                ))
                .build())
        .build();

guardDutyRule.addTarget(SnsTopic.Builder.create(securityAlertTopic)
        .message(RuleTargetInput.fromText(
                "GuardDuty Finding: " + EventField.fromPath("$.detail.type") + 
                " - Severity: " + EventField.fromPath("$.detail.severity")))
        .build());
```

## Deployment Instructions

### Prerequisites

1. **Install required tools:**
   ```bash
   # Install Node.js (required for CDK)
   brew install node
   
   # Install AWS CLI
   brew install awscli
   
   # Install CDK CLI
   npm install -g aws-cdk
   
   # Install Java 11+
   brew install openjdk@11
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

### Environment Setup

```bash
# Set environment variables
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-west-1
export ENVIRONMENT_SUFFIX=prod
export ALLOWED_IP_ADDRESSES="YOUR.IP.ADDRESS/32"

# Find your current IP address
curl -s https://ipinfo.io/ip
```

### Deployment Steps

1. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

2. **Build the project:**
   ```bash
   ./gradlew clean build
   ```

3. **Synthesize CloudFormation templates:**
   ```bash
   cdk synth
   ```

4. **Run security tests:**
   ```bash
   ./gradlew test
   ```

5. **Deploy the infrastructure:**
   ```bash
   # Deploy all stacks
   cdk deploy --all
   
   # Or deploy specific stacks
   cdk deploy TapStackprodSecurity
   cdk deploy TapStackprodMessaging
   cdk deploy TapStackprodInfrastructure
   cdk deploy TapStackprodApplication
   ```

6. **Subscribe to SNS topics (optional):**
   ```bash
   # Subscribe email to security alerts
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-west-1:ACCOUNT-ID:tap-prod-security-alerts \
     --protocol email \
     --notification-endpoint security-team@example.com
   
   # Subscribe email to application events
   aws sns subscribe \
     --topic-arn arn:aws:sns:us-west-1:ACCOUNT-ID:tap-prod-app-events \
     --protocol email \
     --notification-endpoint dev-team@example.com
   ```

7. **Clean up (when needed):**
   ```bash
   cdk destroy --all
   ```

## Success Criteria

Once deployed, the infrastructure must:

1. **Pass all security compliance checks**
2. **Successfully deploy without errors**  
3. **Allow secure access only through designated entry points**
4. **Maintain comprehensive audit trails**
5. **Encrypt all data at rest and in transit**
6. **Provide real-time threat monitoring**
7. **Enforce least-privilege access patterns**
8. **Meet all 23 specified security requirements (including new SNS/SQS requirements)**
9. **Successfully deliver notifications through SNS topics**
10. **Process messages asynchronously through SQS queues**
11. **Handle failed messages with Dead Letter Queue**

## Validation Commands

After deployment, verify security compliance:

```bash
# Verify CloudTrail is enabled
aws cloudtrail describe-trails --region us-west-1

# Verify GuardDuty is enabled  
aws guardduty list-detectors --region us-west-1

# Verify S3 bucket encryption
aws s3api get-bucket-encryption --bucket YOUR-BUCKET-NAME

# Verify RDS encryption
aws rds describe-db-instances --region us-west-1 \
  --query 'DBInstances[*].{DBInstanceIdentifier:DBInstanceIdentifier,StorageEncrypted:StorageEncrypted}'

# Verify VPC Flow Logs
aws ec2 describe-flow-logs --region us-west-1

# Verify security group rules
aws ec2 describe-security-groups --region us-west-1 \
  --query 'SecurityGroups[*].{GroupId:GroupId,IpPermissions:IpPermissions}'

# Verify SNS topics
aws sns list-topics --region us-west-1

# Verify SNS topic encryption
aws sns get-topic-attributes \
  --topic-arn arn:aws:sns:us-west-1:ACCOUNT-ID:tap-prod-security-alerts \
  --query 'Attributes.KmsMasterKeyId'

# Verify SQS queues
aws sqs list-queues --region us-west-1

# Verify SQS queue encryption
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-west-1.amazonaws.com/ACCOUNT-ID/tap-prod-processing-queue \
  --attribute-names KmsMasterKeyId

# Verify Dead Letter Queue configuration
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-west-1.amazonaws.com/ACCOUNT-ID/tap-prod-processing-queue \
  --attribute-names RedrivePolicy

# Test SNS notification
aws sns publish \
  --topic-arn arn:aws:sns:us-west-1:ACCOUNT-ID:tap-prod-app-events \
  --subject "Test Notification" \
  --message "This is a test message"

# Monitor SQS queue messages
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-west-1.amazonaws.com/ACCOUNT-ID/tap-prod-processing-queue \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible

# Check DLQ for failed messages
aws sqs receive-message \
  --queue-url https://sqs.us-west-1.amazonaws.com/ACCOUNT-ID/tap-prod-dlq \
  --max-number-of-messages 10
```

## Monitoring Dashboard Setup

Create a CloudWatch dashboard to monitor your messaging infrastructure:

```java
// Add to ApplicationStack or create new MonitoringStack
Dashboard messagingDashboard = Dashboard.Builder.create(this, "MessagingDashboard")
        .dashboardName("tap-" + environmentSuffix + "-messaging-metrics")
        .build();

messagingDashboard.addWidgets(
        // SQS Queue Metrics
        GraphWidget.Builder.create()
                .title("SQS Messages - Processing Queue")
                .left(Arrays.asList(
                        processingQueue.metricApproximateNumberOfMessagesVisible(),
                        processingQueue.metricApproximateNumberOfMessagesNotVisible(),
                        processingQueue.metricNumberOfMessagesSent(),
                        processingQueue.metricNumberOfMessagesReceived()
                ))
                .width(12)
                .build(),
        
        // DLQ Metrics
        GraphWidget.Builder.create()
                .title("Dead Letter Queue Messages")
                .left(Arrays.asList(
                        deadLetterQueue.metricApproximateNumberOfMessagesVisible()
                ))
                .width(12)
                .build(),
        
        // SNS Metrics
        GraphWidget.Builder.create()
                .title("SNS Topic Metrics")
                .left(Arrays.asList(
                        applicationEventTopic.metricNumberOfMessagesPublished(),
                        applicationEventTopic.metricNumberOfNotificationsFailed(),
                        securityAlertTopic.metricNumberOfMessagesPublished()
                ))
                .width(12)
                .build()
);
```

## Cost Optimization Tips

### SNS Cost Optimization
- Use message filtering to reduce unnecessary Lambda invocations
- Batch notifications where possible
- Set up billing alarms for SNS usage

### SQS Cost Optimization
- Use long polling to reduce empty receives
- Set appropriate visibility timeouts
- Configure message retention based on actual needs
- Monitor DLQ messages and fix processing issues promptly

```bash
# Set up billing alarm for SNS
aws cloudwatch put-metric-alarm \
  --alarm-name sns-high-usage \
  --alarm-description "Alert when SNS usage is high" \
  --metric-name NumberOfMessagesPublished \
  --namespace AWS/SNS \
  --statistic Sum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 100000 \
  --comparison-operator GreaterThanThreshold

# Set up billing alarm for SQS
aws cloudwatch put-metric-alarm \
  --alarm-name sqs-high-usage \
  --alarm-description "Alert when SQS usage is high" \
  --metric-name NumberOfMessagesSent \
  --namespace AWS/SQS \
  --statistic Sum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 1000000 \
  --comparison-operator GreaterThanThreshold
```

## Common Integration Patterns

### Pattern 1: Event-Driven Processing
```
API Gateway → Lambda → SNS Topic → SQS Queue → Lambda (Async Processing)
```

### Pattern 2: Fan-Out Pattern
```
Lambda → SNS Topic → Multiple SQS Queues (different processing pipelines)
```

### Pattern 3: Security Alert Pipeline
```
GuardDuty/CloudWatch → EventBridge → SNS Topic → Email/SMS/Lambda
```

### Pattern 4: Retry with DLQ
```
SQS Queue (3 retries) → Processing fails → DLQ → Alert via SNS → Manual review
```

## Troubleshooting Guide

### SNS Issues

**Problem**: Messages not being delivered
```bash
# Check SNS topic subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-west-1:ACCOUNT-ID:tap-prod-app-events

# Check SNS topic policy
aws sns get-topic-attributes \
  --topic-arn arn:aws:sns:us-west-1:ACCOUNT-ID:tap-prod-app-events \
  --query 'Attributes.Policy'
```

**Problem**: Permission denied errors
- Verify IAM policies grant `sns:Publish` permissions
- Check KMS key policies allow encryption/decryption
- Verify resource-based policies on SNS topics

### SQS Issues

**Problem**: Messages stuck in queue
```bash
# Check queue attributes
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-west-1.amazonaws.com/ACCOUNT-ID/tap-prod-processing-queue \
  --attribute-names All

# Purge queue if needed (careful!)
aws sqs purge-queue \
  --queue-url https://sqs.us-west-1.amazonaws.com/ACCOUNT-ID/tap-prod-processing-queue
```

**Problem**: Messages going to DLQ
- Check Lambda function logs for errors
- Verify message format is correct
- Increase visibility timeout if processing takes longer
- Check maxReceiveCount setting

### Integration Issues

**Problem**: Lambda not triggered by SQS
```bash
# Check event source mapping
aws lambda list-event-source-mappings \
  --function-name tap-prod-app-function

# Check Lambda permissions
aws lambda get-policy \
  --function-name tap-prod-app-function
```


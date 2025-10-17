# CDK Support Platform Implementation Prompt

Hello, I need you to generate a CDK code which is production ready, implements a comprehensive customer support platform in **us-west-2** region using AWS CDK with Java. The platform should integrate API Gateway for ticket submission, Lambda functions running Node.js 18 for ticket processing, DynamoDB for ticket storage with Global Secondary Index, Amazon Comprehend for sentiment analysis, Amazon Translate for multilingual support, Amazon Lex for chatbot functionality, Amazon Kendra for knowledge base search, S3 for attachment storage, SES for email support, SNS for agent notifications, SQS for ticket queues with priority routing, Step Functions for escalation workflows, Amazon Connect for phone support integration, Amazon Pinpoint for customer communication, Secrets Manager for secure credential storage, CloudWatch with dashboards for monitoring, X-Ray for distributed tracing, and EventBridge for SLA monitoring.

## Core Requirements

### Infrastructure Setup
- Deploy everything in **us-west-2** region
- Use AWS CDK with Java
- Enable production-ready configurations (encryption, versioning, monitoring)
- Follow AWS best practices for security and scalability

### Data Storage
- **DynamoDB**: Create tickets table with `ticketId` (partition key) and `timestamp` (sort key)
- Add Global Secondary Index: `StatusPriorityIndex` with `status` (partition) and `priority` (sort key)
- Enable point-in-time recovery and streams for audit trail
- Use on-demand billing mode for cost optimization

### API and Processing
- **API Gateway**: REST API with `/tickets` endpoint for ticket submission
- Enable X-Ray tracing on API stage for performance monitoring
- Add CORS support for web clients
- **Lambda (Node.js 18)**: Functions for ticket processing, sentiment analysis, translation, search, escalation, SLA checking, auto-response
- Enable X-Ray tracing on all Lambda functions
- Set appropriate timeout and memory configurations per function

### AI Services Integration
- **Comprehend**: Use for automatic sentiment analysis and entity detection to route tickets intelligently
- Route negative sentiment to high-priority queue automatically
- Extract entities like product names, customer IDs for better categorization
- **Lex**: Build tier-1 chatbot for handling common queries, integrate with Kendra for smart responses
- **Kendra**: Configure DEVELOPER_EDITION index for intelligent knowledge base search
- Index support documentation, FAQs, and historical ticket resolutions
- **Translate**: Implement automatic language detection and multilingual support
- Support ticket translation in real-time for global support teams

### Message Routing
- **SQS**: Create three priority queues (high, standard, low) with visibility timeout of 300 seconds
- Add dead letter queue with max receive count of 3 for failed messages
- Route based on sentiment analysis and priority scores
- High priority: negative sentiment, VIP customers, escalated tickets
- Standard: neutral sentiment, regular tickets
- Low: positive sentiment, feedback, feature requests

### Workflow Orchestration
- **Step Functions**: Design escalation workflow that checks ticket age and priority
- Escalate tickets with priority > 8 or negative sentiment automatically
- Include human approval steps for edge cases
- **EventBridge**: Schedule SLA monitoring rule to run every 5 minutes
- Track response times and trigger alerts for SLA violations

### Communication Channels
- **SNS**: Agent notification topic for high-priority tickets and SLA breaches
- Send notifications via email/SMS when tickets need immediate attention
- **SES**: Email support for inbound/outbound communication
- Verify email identity for sending support emails
- Handle both transactional emails and bulk communications
- **Connect**: Integrate phone support for omnichannel experience
- **Pinpoint**: Customer communication and targeted campaigns
- Send proactive notifications and gather feedback

### Security & Secrets Management
- **Secrets Manager**: Store API credentials, third-party integration keys, and sensitive configuration
- Auto-generate API keys with rotation capability
- Grant Lambda functions read-only access to secrets
- Use encrypted storage with automatic key rotation
- Pass secret ARN to Lambda functions via environment variables

### Storage
- **S3**: Attachments bucket with server-side encryption and versioning enabled
- Knowledge base bucket for Kendra content indexing
- Lifecycle policies to transition objects to Intelligent Tiering after 30 days
- Block all public access by default
- Enable auto-delete on stack removal for dev environments

### Monitoring & Observability
- **CloudWatch**: Comprehensive dashboard showing ticket metrics, queue depths, sentiment distribution, response times
- Set alarms for queue backlogs, Lambda errors, and DLQ messages
- Monitor API Gateway 4xx/5xx errors
- **X-Ray**: Distributed tracing for performance optimization across all services
- Identify bottlenecks in the ticket processing pipeline

## Implementation Pattern

```java
public class SupportPlatformStack extends Stack {
    public SupportPlatformStack(final Construct scope, final String id) {
        super(scope, id, StackProps.builder()
            .env(Environment.builder().region("us-west-2").build())
            .build());

        // DynamoDB with GSI
        Table ticketsTable = Table.Builder.create(this, "TicketsTable")
            .partitionKey(Attribute.builder().name("ticketId").type(AttributeType.STRING).build())
            .sortKey(Attribute.builder().name("timestamp").type(AttributeType.NUMBER).build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .pointInTimeRecovery(true)
            .stream(StreamViewType.NEW_AND_OLD_IMAGES)
            .build();

        ticketsTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
            .indexName("StatusPriorityIndex")
            .partitionKey(Attribute.builder().name("status").type(AttributeType.STRING).build())
            .sortKey(Attribute.builder().name("priority").type(AttributeType.NUMBER).build())
            .build());

        // Secrets Manager for API credentials
        Secret apiCredentials = Secret.Builder.create(this, "ApiCredentials")
            .description("API credentials for support platform")
            .generateSecretString(SecretStringGenerator.builder()
                .secretStringTemplate("{\"apiKey\":\"\"}")
                .generateStringKey("apiKey")
                .excludePunctuation(true)
                .passwordLength(32)
                .build())
            .build();

        // SQS Priority Queues with DLQ
        Queue deadLetterQueue = Queue.Builder.create(this, "DeadLetterQueue")
            .retentionPeriod(Duration.days(14))
            .build();

        Queue highPriorityQueue = Queue.Builder.create(this, "HighPriorityQueue")
            .visibilityTimeout(Duration.seconds(300))
            .deadLetterQueue(DeadLetterQueue.builder()
                .maxReceiveCount(3)
                .queue(deadLetterQueue)
                .build())
            .build();

        // Lambda with Comprehend permissions
        Function sentimentAnalyzer = Function.Builder.create(this, "SentimentAnalyzer")
            .runtime(Runtime.NODEJS_18_X)
            .handler("sentiment.handler")
            .code(Code.fromAsset("lambda/sentiment"))
            .tracing(Tracing.ACTIVE)
            .environment(Map.of(
                "SECRET_ARN", apiCredentials.getSecretArn(),
                "TABLE_NAME", ticketsTable.getTableName()
            ))
            .build();

        sentimentAnalyzer.addToRolePolicy(PolicyStatement.Builder.create()
            .actions(List.of("comprehend:DetectSentiment", "comprehend:DetectEntities"))
            .resources(List.of("*"))
            .build());

        apiCredentials.grantRead(sentimentAnalyzer);

        // SES Email Identity
        EmailIdentity supportEmail = EmailIdentity.Builder.create(this, "SupportEmail")
            .identity(Identity.email("support@example.com"))
            .build();

        // Kendra Index
        CfnIndex kendraIndex = CfnIndex.Builder.create(this, "KnowledgeBase")
            .edition("DEVELOPER_EDITION")
            .roleArn(kendraRole.getRoleArn())
            .build();

        // API Gateway with X-Ray
        RestApi api = RestApi.Builder.create(this, "SupportAPI")
            .deployOptions(StageOptions.builder()
                .tracingEnabled(true)
                .stageName("prod")
                .build())
            .defaultCorsPreflightOptions(CorsOptions.builder()
                .allowOrigins(Cors.ALL_ORIGINS)
                .allowMethods(Cors.ALL_METHODS)
                .build())
            .build();

        // Step Functions Escalation
        StateMachine escalationWorkflow = StateMachine.Builder.create(this, "EscalationWorkflow")
            .definition(checkAge.next(priorityChoice))
            .tracingEnabled(true)
            .build();

        // EventBridge SLA Monitor
        Rule.Builder.create(this, "SLAMonitor")
            .schedule(Schedule.rate(Duration.minutes(5)))
            .targets(List.of(new LambdaFunction(slaChecker)))
            .build();
    }
}
```

## Key Features to Implement

1. **Auto-Routing**: Use Comprehend sentiment to route tickets to appropriate queues automatically
2. **AI Auto-Response**: Lex chatbot with Kendra integration for tier-1 support and common questions
3. **Multilingual**: Translate service for automatic language support across all customer communications
4. **Priority Queuing**: Smart message priority in SQS based on sentiment analysis and customer tier
5. **Escalation**: Step Functions workflow for complex escalation paths with conditional logic
6. **SLA Monitoring**: EventBridge rules that alert teams when response time thresholds are breached
7. **Performance**: X-Ray tracing across all services to identify and optimize bottlenecks
8. **Security**: Secrets Manager integration for secure credential storage and automatic rotation
9. **Email Support**: SES integration for professional email communications with customers

## Architecture Highlights

- **Event-driven**: Use SNS, SQS, and EventBridge for decoupled, scalable architecture
- **Serverless**: Leverage Lambda and managed services for cost-effectiveness
- **AI-Powered**: Comprehend, Lex, Kendra for intelligent automation
- **Observable**: CloudWatch dashboards and X-Ray for full visibility
- **Secure**: Encryption at rest, secrets management, least privilege IAM
- **Resilient**: Dead letter queues, retry logic, circuit breakers

Make sure all resources have proper naming conventions with environment suffixes, enable removal policies for dev/test, and create CloudFormation outputs for all critical resource identifiers.
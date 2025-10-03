# CDK Support Platform Implementation Prompt

@claude, generate a CDK code which is production ready, implements a comprehensive customer support platform in **us-west-2** region using AWS CDK with Java. The platform should integrates API Gateway for ticket submission, Lambda functions running Node.js 18 for ticket processing, DynamoDB for ticket storage with Global Secondary Index, Amazon Comprehend for sentiment analysis, Amazon Translate for multilingual support, Amazon Lex for chatbot functionality, Amazon Kendra for knowledge base search, S3 for attachment storage, SES for email support, SNS for agent notifications, SQS for ticket queues with priority routing, Step Functions for escalation workflows, Amazon Connect for phone support integration, Amazon Pinpoint for customer communication, CloudWatch with dashboards for monitoring, X-Ray for distributed tracing, and EventBridge for SLA monitoring.

## Core Requirements

### Infrastructure Setup
- Deploy in **us-west-2** region
- Use AWS CDK with Java
- Enable production-ready configurations (encryption, versioning, monitoring)

### Data Storage
- **DynamoDB**: Create tickets table with `ticketId` (partition key) and `timestamp` (sort key)
- Add Global Secondary Index: `StatusPriorityIndex` with `status` (partition) and `priority` (sort key)
- Enable point-in-time recovery and streams

### API and Processing
- **API Gateway**: REST API with `/tickets` endpoint for ticket submission
- Enable X-Ray tracing on API stage
- **Lambda (Node.js 18)**: Functions for ticket processing, sentiment analysis, translation, search, escalation, SLA checking, auto-response
- Enable X-Ray tracing on all Lambda functions

### AI Services Integration
- **Comprehend**: Use for automatic sentiment analysis and entity detection to route tickets
- Route negative sentiment to high-priority queue automatically
- **Lex**: Build tier-1 chatbot for common queries, integrate with Kendra
- **Kendra**: Configure DEVELOPER_EDITION index for intelligent knowledge base search
- **Translate**: Implement automatic language detection and multilingual support

### Message Routing
- **SQS**: Create three priority queues (high, standard, low) with visibility timeout of 300 seconds
- Add dead letter queue with max receive count of 3
- Route based on sentiment analysis and priority scores

### Workflow Orchestration
- **Step Functions**: Design escalation workflow checking ticket age and priority
- Escalate tickets with priority > 8 or negative sentiment
- **EventBridge**: Schedule SLA monitoring rule every 5 minutes

### Communication Channels
- **SNS**: Agent notification topic for high-priority tickets and SLA breaches
- **SES**: Email support for inbound/outbound communication
- **Connect**: Integrate phone support for omnichannel experience
- **Pinpoint**: Customer communication and campaigns

### Storage
- **S3**: Attachments bucket with encryption, versioning, lifecycle policies (transition to Intelligent Tiering after 30 days)
- Knowledge base bucket for Kendra content

### Monitoring
- **CloudWatch**: Dashboard with ticket metrics, queue depths, sentiment distribution, response times
- Set alarms for queue backlogs and Lambda errors
- **X-Ray**: Distributed tracing for performance optimization

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
            .build();

        ticketsTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
            .indexName("StatusPriorityIndex")
            .partitionKey(Attribute.builder().name("status").type(AttributeType.STRING).build())
            .sortKey(Attribute.builder().name("priority").type(AttributeType.NUMBER).build())
            .build());

        // SQS Priority Queues
        Queue highPriorityQueue = Queue.Builder.create(this, "HighPriorityQueue")
            .visibilityTimeout(Duration.seconds(300))
            .build();

        // Lambda with Comprehend permissions
        Function sentimentAnalyzer = Function.Builder.create(this, "SentimentAnalyzer")
            .runtime(Runtime.NODEJS_18_X)
            .handler("sentiment.handler")
            .code(Code.fromAsset("lambda/sentiment"))
            .tracing(Tracing.ACTIVE)
            .build();

        sentimentAnalyzer.addToRolePolicy(PolicyStatement.Builder.create()
            .actions(List.of("comprehend:DetectSentiment", "comprehend:DetectEntities"))
            .resources(List.of("*"))
            .build());

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

1. **Auto-Routing**: Use Comprehend sentiment to route tickets to appropriate queues
2. **AI Auto-Response**: Lex chatbot with Kendra integration for tier-1 support
3. **Multilingual**: Translate service for automatic language support
4. **Priority Queuing**: Message priority in SQS based on sentiment and customer tier
5. **Escalation**: Step Functions workflow for complex escalation paths
6. **SLA Monitoring**: EventBridge alerts for threshold breaches
7. **Performance**: X-Ray tracing across all services for optimization
We're designing the infrastructure for a new real-time trading event processing system, which requires extreme resilience and multi-region disaster recovery. We'll be building this with the AWS CDK and TypeScript.

The architecture is an active-passive setup, with us-east-1 as the primary region and us-west-2 as the standby. To handle event ingestion, let's use an EventBridge Global Endpoint. This will give our event producers a single, static endpoint to publish to. Configure this endpoint with us-east-1 as the primary, us-west-2 as the secondary, and set up health checks so EventBridge can automatically fail over event ingestion if the primary region becomes unavailable.

In the primary region, the global endpoint will route events to a custom EventBridge event bus. Create a rule on this bus to forward events to our processing Lambda. This rule is critical for resilience: it must be configured with a retry policy and a dead-letter queue (DLQ) to capture any events that fail processing.

The target of the EventBridge rule is a Lambda function. This function must be highly performant, maintaining sub-second processing time. For observability, the Lambda must have AWS X-Ray active tracing enabled. Its code should also use the Lambda Powertools for TypeScript library to implement our standard for structured logging and tracing.

For the data layer, we'll use DynamoDB Global Tables. Your CDK code should define the global table, which will automatically replicate all transaction data from the primary region to the secondary. Make sure to enable point-in-time recovery (PITR) and configure on-demand capacity or auto-scaling for the table.

Of course, all IAM roles must be created with strict least-privilege permissions. The Lambda role should only allow writing to the DynamoDB global table and its own CloudWatch logs. For monitoring, set up a CloudWatch alarm that triggers if the number of messages in the EventBridge rule's dead-letter queue is greater than zero

Implement using AWS CDK TypeScript with separate modular stack files in lib/ for each component, instantiated in lib/tap-stack.ts.

Functional scope - build everything new:
Design and implement a brand-new asynchronous message processing stack for a high-volume financial analytics platform that ingests and processes millions of market data events per day. The current synchronous architecture creates bottlenecks during market open hours. This stack must provide resilient, FIFO-aware, DR-ready asynchronous processing using AWS managed services.

The solution must be delivered as a single CloudFormation YAML template named TapStack.yml that builds all required resources from scratch in us-east-1 as the primary region with us-west-2 as the secondary region for disaster recovery. No resource must point to or import from any pre-existing infrastructure or external stacks. Everything required for this async processing path must be created in this one template.

Architecture context and requirements:
- Domain: financial analytics, processing market data, trade events, and order messages that must preserve FIFO ordering for per-instrument or per-account event streams.
- Primary region: us-east-1 - active.
- Secondary region: us-west-2 - DR, used for cross-region replication of critical queues and DynamoDB state where applicable.
- Network assumptions: application workloads run in a VPC with private subnets across 3 AZs and use VPC endpoints to access AWS services. You can assume the VPC and subnets already exist, but this template must still be self-contained for the messaging and state layers. Do not create or reference any VPC resources.
- Objective: replace synchronous, tightly-coupled processing with an asynchronous, decoupled design built around SQS FIFO, Lambda, DynamoDB, and EventBridge, with monitoring and failure handling tailored for financial workloads.

Core services - focus:
- Mandatory core: Amazon SQS with FIFO queues, AWS Lambda as queue processors, Amazon DynamoDB for message and state tracking.
- Optional: EventBridge or CloudWatch for dashboards, alarms, routing as needed to correctly support failure routing, DR, or operational visibility.
- Implement at least 5-7 of the major functional requirements listed below, with emphasis on correctness, DR, and operational safety.

Functional requirements - system behaviour:
1. Deploy primary and secondary FIFO SQS queues for order and trade processing:
   - Use FIFO queues with content-based deduplication enabled.
   - Configure appropriate visibility timeouts that are not hard-coded in application code.
   - Ensure queue names and related resources always include the ENVIRONMENT_SUFFIX for safe multi-environment deployments.
2. Configure dead-letter queues with specific retry policies:
   - Main FIFO queues must use RedrivePolicy that sends messages to their DLQs after exactly 3 failed receive or processing attempts.
   - DLQs must be FIFO where appropriate and also include ENVIRONMENT_SUFFIX in their names.
   - CloudWatch alarms must be created to monitor DLQ message depth and alert when thresholds are exceeded - for instance, more than N messages.
3. Create Lambda functions to process messages from the primary FIFO queues:
   - Use appropriate event source mappings from SQS to Lambda.
   - Set reserved concurrent executions on the Lambdas to prevent downstream system overload.
   - Configure environment variables for EnvironmentSuffix as ENVIRONMENT_SUFFIX.
   - Configure references to SQS queue URLs and ARNs.
   - Configure references to DynamoDB table names.
   - Configure references to SSM Parameters that hold dynamic configuration like visibility timeout or other tuning values.
4. Implement DynamoDB tables with on-demand billing for processed message tracking:
   - Use on-demand with PAY_PER_REQUEST billing mode.
   - Define a primary key that supports tracking processed messages - could be MessageId, TradeId, or composite keys.
   - Include attributes suitable for idempotency checks, processing status, timestamps, and region markers.
   - Configure DynamoDB global tables or equivalent cross-region replication so that processing state can be accessed in both us-east-1 and us-west-2.
   - Include ENVIRONMENT_SUFFIX in table names.
5. Create EventBridge rules to route failed messages to notification or remediation systems:
   - EventBridge rules must match relevant events like DLQ alarms, processing failures exposed via custom events, or CloudWatch alarm state changes.
   - Targets may include SNS topics or additional Lambdas used for operations notifications, incident tickets, or automated remediation.
   - All EventBridge rules and targets must use names that include ENVIRONMENT_SUFFIX.
6. Configure cross-region queue replication using Lambda and cross-account roles:
   - Implement a Lambda function that reads from a primary region FIFO queue and writes to a DR queue in us-west-2 while preserving ordering guarantees where possible.
   - Use IAM roles and policies that support cross-region and optionally cross-account access - assume a trusted monitoring or DR account may consume replicated messages.
   - Include appropriate retry and error handling semantics for the replication Lambda and surface failures via EventBridge or CloudWatch alarms.
7. Set up CloudWatch dashboards and alarms:
   - Create a CloudWatch dashboard that visualizes SQS queue depth with ApproximateNumberOfMessagesVisible metric.
   - Create a CloudWatch dashboard that visualizes DLQ depth.
   - Create a CloudWatch dashboard that visualizes Lambda invocation count, success and failure metrics, and throttles.
   - Create a CloudWatch dashboard that visualizes ApproximateAgeOfOldestMessage and processing rates.
   - Configure alarms for high queue depth and sustained processing lag during peak trading hours.
8. Implement queue policies allowing specific IAM roles from trusted accounts:
   - Queue policies must explicitly allow only specific IAM roles or Principals by ARN from one or more trusted AWS accounts.
   - These trusted account IDs should be configurable via parameters and must not be hard-coded.
   - Use least-privilege permissions like sqs:SendMessage and sqs:ReceiveMessage and avoid overly broad principals.
9. Configure automatic queue purging for test environments:
   - For non-production environments like QA or staging, define a scheduled EventBridge rule that triggers a small Lambda function to purge test queues on a safe cadence.
   - Implement this behaviour using CloudWatch Events or EventBridge Scheduler without impacting production environments.
10. Create SSM parameters to enable dynamic configuration:
    - Store SQS queue URLs, ARN references, and other configuration items in SSM Parameter Store at least for primary and DLQ queues.
    - Store dynamic values such as queue visibility timeout or tuning thresholds in SSM so they can be changed without altering the CloudFormation template.
    - Lambdas must receive the SSM parameter names via environment variables. The template does not implement application code but must wire all configuration correctly.

Implementation details and best practices:
- The template must be valid CloudFormation YAML, not JSON, and syntactically correct for cfn-lint.
- Top-level sections must include AWSTemplateFormatVersion, Description, optionally Metadata, Parameters, Mappings or Conditions if used, Resources, and Outputs.
- All logical IDs and resource names must be deterministic and must include ENVIRONMENT_SUFFIX, applied via !Sub wherever names are constructed - for queues, tables, Lambdas, dashboards, rules, topics, and SSM parameters.
- Avoid any hard-coded environment names like "prod" or "qa" inside resource names. Derive them from the EnvironmentSuffix parameter.
- The EnvironmentSuffix parameter must be declared in the Parameters section.
- The EnvironmentSuffix parameter must be Type String.
- The EnvironmentSuffix parameter must not use hard AllowedValues. Instead, enforce a safe naming regex via AllowedPattern and optional MinLength or MaxLength.
- The description can mention example values such as "prod-us", "production", "qa", but these must remain examples only.
- The AllowedPattern should restrict to safe characters for use in resource names - lowercase letters, digits, hyphens.
- All queues must be FIFO queues with .fifo suffix in the queue names where FIFO behaviour is required and content-based deduplication must be enabled where appropriate.
- ReservedConcurrentExecutions must be set on all production Lambdas and should be parameterized or configurable via parameters with safe defaults.
- Use on-demand billing with PAY_PER_REQUEST for all DynamoDB tables.
- Use appropriate IAM roles and policies for Lambdas and any cross-account access - prefer least-privilege, resource-scoped policies.
- Use condition keys where appropriate like aws:PrincipalArn or aws:SourceArn for SQS queue policies.
- Implement dependencies correctly via !Ref, !GetAtt, and DependsOn when needed so that resources like event source mappings, dashboards, alarms are created only after their targets exist.
- Ensure that queue visibility timeouts and Lambda timeouts are configured to avoid runaway processing or message duplication.

Deliverable:
- Output a single, complete CloudFormation template in valid YAML syntax only, representing TapStack.yml.
- The output must contain all Parameters required for environment-specific configuration and safe reuse across multiple deployments including EnvironmentSuffix, any concurrency settings, threshold values, and trusted account IDs.
- The output must contain all Resources required to satisfy the functional requirements - SQS FIFO queues and DLQs, Lambda functions, DynamoDB tables, EventBridge rules, CloudWatch dashboards and alarms, SSM parameters, IAM roles, and queue policies.
- The output must contain proper intrinsic functions like !Ref, !Sub, !GetAtt, Fn::Join wherever needed.
- The output must not contain placeholders like "TODO" and no external references to existing stacks or manually created resources.
- The Outputs section must expose primary and DLQ SQS queue URLs and ARNs.
- The Outputs section must expose Lambda function ARNs for main processors and replication Lambdas.
- The Outputs section must expose DynamoDB table names and ARNs.
- The Outputs section must expose key SSM parameter names or ARNs that will be used by application code.
- The final response must be raw YAML only with no markdown code fences, no explanation text, no comments describing the code.

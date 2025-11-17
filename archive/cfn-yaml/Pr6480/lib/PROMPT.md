Functional scope (build everything new):
Design and implement a brand-new asynchronous message processing stack for a high-volume financial analytics platform that ingests and processes millions of market data events per day. The current synchronous architecture creates bottlenecks during market open hours; this stack must provide resilient, FIFO-aware, DR-ready asynchronous processing using AWS managed services.

The solution must be delivered as a single CloudFormation YAML template named TapStack.yml that builds all required resources from scratch in us-east-1 as the primary region with us-west-2 as the secondary region for disaster recovery. No resource must point to or import from any pre-existing infrastructure or external stacks; everything required for this async processing path must be created in this one template.

Architecture context and requirements:
- Domain: financial analytics, processing market data, trade events, and order messages that must preserve FIFO ordering for per-instrument or per-account event streams.
- Primary region: us-east-1 (active).
- Secondary region: us-west-2 (DR), used for cross-region replication of critical queues and DynamoDB state where applicable.
- Network assumptions: application workloads run in a VPC with private subnets across 3 AZs and use VPC endpoints to access AWS services (you can assume the VPC and subnets already exist, but this template must still be self-contained for the messaging and state layers; do not create or reference any VPC resources).
- Objective: replace synchronous, tightly-coupled processing with an asynchronous, decoupled design built around SQS FIFO, Lambda, DynamoDB, and EventBridge, with monitoring and failure handling tailored for financial workloads.

Core services (focus):
- Mandatory core: Amazon SQS (FIFO queues), AWS Lambda (queue processors), Amazon DynamoDB (message/state tracking).
- Optional (0–1): EventBridge and/or CloudWatch (dashboards, alarms, routing) as needed to correctly support failure routing, DR, or operational visibility.
- Implement at least 5–7 of the major functional requirements listed below, with emphasis on correctness, DR, and operational safety.

Functional requirements (system behaviour):
1. Deploy primary and secondary FIFO SQS queues for order and trade processing:
   - Use FIFO queues with content-based deduplication enabled.
   - Configure appropriate visibility timeouts that are not hard-coded in application code.
   - Ensure queue names and related resources always include the ENVIRONMENT_SUFFIX for safe multi-environment deployments.
2. Configure dead-letter queues (DLQs) with specific retry policies:
   - Main FIFO queues must use RedrivePolicy that sends messages to their DLQs after exactly 3 failed receive/processing attempts.
   - DLQs must be FIFO where appropriate and also include ENVIRONMENT_SUFFIX in their names.
   - CloudWatch alarms must be created to monitor DLQ message depth and alert when thresholds are exceeded (e.g., more than N messages).
3. Create Lambda functions to process messages from the primary FIFO queues:
   - Use appropriate event source mappings from SQS to Lambda.
   - Set reserved concurrent executions on the Lambdas to prevent downstream system overload.
   - Configure environment variables for:
     - EnvironmentSuffix (ENVIRONMENT_SUFFIX).
     - References to SQS queue URLs and ARNs.
     - References to DynamoDB table names.
     - References to SSM Parameters that hold dynamic configuration (such as visibility timeout or other tuning values).
4. Implement DynamoDB tables with on-demand billing for processed message tracking:
   - Use on-demand (PAY_PER_REQUEST) billing mode.
   - Define a primary key that supports tracking processed messages (e.g., MessageId, TradeId, or composite keys).
   - Include attributes suitable for idempotency checks, processing status, timestamps, and region markers.
   - Configure DynamoDB global tables (or equivalent cross-region replication) so that processing state can be accessed in both us-east-1 and us-west-2.
   - Include ENVIRONMENT_SUFFIX in table names.
5. Create EventBridge rules to route failed messages to notification or remediation systems:
   - EventBridge rules must match relevant events (e.g., DLQ alarms, processing failures exposed via custom events, or CloudWatch alarm state changes).
   - Targets may include SNS topics or additional Lambdas used for operations notifications, incident tickets, or automated remediation.
   - All EventBridge rules and targets must use names that include ENVIRONMENT_SUFFIX.
6. Configure cross-region queue replication using Lambda and cross-account roles:
   - Implement a Lambda function that reads from a primary region FIFO queue and writes to a DR queue in us-west-2 while preserving ordering guarantees where possible.
   - Use IAM roles and policies that support cross-region and optionally cross-account access (assume a “trusted monitoring or DR account” may consume replicated messages).
   - Include appropriate retry and error handling semantics for the replication Lambda and surface failures via EventBridge or CloudWatch alarms.
7. Set up CloudWatch dashboards and alarms:
   - Create a CloudWatch dashboard that visualizes:
     - SQS queue depth (ApproximateNumberOfMessagesVisible).
     - DLQ depth.
     - Lambda invocation count, success/failure metrics, and throttles.
     - ApproximateAgeOfOldestMessage and processing rates.
   - Configure alarms for high queue depth and sustained processing lag during peak trading hours.
8. Implement queue policies allowing specific IAM roles from trusted accounts:
   - Queue policies must explicitly allow only specific IAM roles/Principals (by ARN) from one or more trusted AWS accounts.
   - These trusted account IDs should be configurable via parameters and must not be hard-coded.
   - Use least-privilege permissions (e.g., sqs:SendMessage, sqs:ReceiveMessage) and avoid overly broad principals.
9. Configure automatic queue purging for test environments:
   - For non-production environments (e.g., QA, staging), define a scheduled EventBridge rule that triggers a small Lambda function to purge test queues on a safe cadence.
   - Implement this behaviour using CloudWatch Events / EventBridge Scheduler without impacting production environments.
10. Create SSM parameters to enable dynamic configuration:
    - Store SQS queue URLs, ARN references, and other configuration items in SSM Parameter Store (at least for primary and DLQ queues).
    - Store dynamic values such as queue visibility timeout or tuning thresholds in SSM so they can be changed without altering the CloudFormation template.
    - Lambdas must receive the SSM parameter names via environment variables; the template does not implement application code but must wire all configuration correctly.

Implementation details and best practices:
- The template must be valid CloudFormation YAML (not JSON) and syntactically correct for cfn-lint.
- Top-level sections must include: AWSTemplateFormatVersion, Description, (optionally Metadata), Parameters, Mappings or Conditions (if used), Resources, and Outputs.
- All logical IDs and resource names must be deterministic and must include ENVIRONMENT_SUFFIX, applied via !Sub wherever names are constructed (e.g., queues, tables, Lambdas, dashboards, rules, topics, and SSM parameters).
- Avoid any hard-coded environment names like “prod” or “qa” inside resource names; derive them from the EnvironmentSuffix parameter.
- The EnvironmentSuffix parameter:
  - Must be declared in the Parameters section.
  - Must be Type: String.
  - Must not use hard AllowedValues; instead, enforce a safe naming regex via AllowedPattern and optional MinLength/MaxLength.
  - The description can mention example values such as “prod-us”, “production”, “qa”, but these must remain examples only.
  - The AllowedPattern should restrict to safe characters for use in resource names (e.g., lowercase letters, digits, hyphens).
- All queues must be FIFO queues (use .fifo suffix in the queue names) where FIFO behaviour is required and content-based deduplication must be enabled where appropriate.
- ReservedConcurrentExecutions must be set on all production Lambdas and should be parameterized or configurable via parameters with safe defaults.
- Use on-demand billing (PAY_PER_REQUEST) for all DynamoDB tables.
- Use appropriate IAM roles and policies for Lambdas and any cross-account access:
  - Prefer least-privilege, resource-scoped policies.
  - Use condition keys where appropriate (e.g., aws:PrincipalArn or aws:SourceArn) for SQS queue policies.
- Implement dependencies correctly via !Ref, !GetAtt, and DependsOn when needed so that resources (e.g., event source mappings, dashboards, alarms) are created only after their targets exist.
- Ensure that queue visibility timeouts and Lambda timeouts are configured to avoid runaway processing or message duplication.

Deliverable:
- Output a single, complete CloudFormation template in valid YAML syntax only, representing TapStack.yml.
- The output must contain:
  - All Parameters required for environment-specific configuration and safe reuse across multiple deployments (including EnvironmentSuffix, any concurrency settings, threshold values, and trusted account IDs).
  - All Resources required to satisfy the functional requirements (SQS FIFO queues and DLQs, Lambda functions, DynamoDB tables, EventBridge rules, CloudWatch dashboards/alarms, SSM parameters, IAM roles, and queue policies).
  - Proper intrinsic functions (!Ref, !Sub, !GetAtt, Fn::Join, etc.) wherever needed.
  - No placeholders like “TODO” and no external references to existing stacks or manually created resources.
- The Outputs section must:
  - Expose primary and DLQ SQS queue URLs and ARNs.
  - Expose Lambda function ARNs for main processors and replication Lambdas.
  - Expose DynamoDB table names and ARNs.
  - Expose key SSM parameter names or ARNs that will be used by application code.
- The final response must be raw YAML only (no markdown code fences, no explanation text, no comments describing the code).

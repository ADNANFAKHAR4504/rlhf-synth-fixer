You are an AWS CloudFormation expert.

Create a CloudFormation YAML template that builds an asynchronous event processing pipeline for financial transactions with the following configuration and constraints:

Functional Requirements

SNS Topic (FIFO) that receives transaction events from a payment gateway.

Three SQS FIFO queues for processing different transaction priorities:

High-value: amount > $10,000

Standard: $1,000 ≤ amount ≤ $10,000

Low-value: amount < $1,000

SNS Subscriptions for each queue using message attribute filters to route transactions based on the amount attribute.

Dead-letter queues (DLQs) for each primary SQS FIFO queue, configured with a maximum receive count of 3.

EventBridge custom event bus to receive processed transaction results.

EventBridge rule that triggers alerts for failed transactions where amount > 5000, publishing to an SNS Alerts topic.

SQS configuration for all queues:

Message retention: 14 days (1209600 seconds)

Visibility timeout: 300 seconds

Long polling: 20 seconds

FIFO enabled

KMS encryption using a customer-managed CMK

CloudWatch alarms for each queue where ApproximateNumberOfMessagesVisible > 1000, triggering the Alerts SNS topic.

Include all necessary IAM roles and policies for cross-service interactions (SNS → SQS, EventBridge → SNS, etc.).

Provide CloudFormation Outputs for:

Queue URLs (all 3)

SNS Topic ARN

EventBus name

KMS Key ARN

Architecture Constraints

Use only SQS FIFO queues to guarantee message ordering and exactly-once processing.

All dead-letter queues must be FIFO and use maxReceiveCount: 3.

Configure 14-day message retention for compliance.

Enable server-side encryption using a customer-managed KMS key (created in the same template).

Use SNS filter policies based on the amount message attribute for routing logic.

The EventBridge rule must use numeric filtering in the event pattern to detect failed transactions > $5,000.

Cross-Account & Portability Requirements

The template must be fully executable across AWS accounts and regions without modification.

No hardcoded values (e.g., no fixed ARNs, account IDs, or region names).

Use CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt) wherever possible.

Use Parameters for all environment-specific values.

Mandatory Parameter
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Mandatory Naming Convention

Every resource name must follow this pattern:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

Lambda → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda

Apply this naming pattern consistently for all resources (SNS topics, queues, event buses, alarms, etc.).

Output Requirements

Include Outputs for:

All 3 SQS queue URLs

The SNS topic ARN

EventBridge event bus name

KMS Key ARN

Deliverable

A single CloudFormation YAML template that:

Follows the mandatory naming convention

Uses parameters for all configurable values

Contains IAM roles/policies for cross-service communication

Avoids hardcoding any account or region

Can be deployed as-is in any AWS account or region

Is logically ordered with clear comments and dependencies

Expected Output:
A complete, production-ready CloudFormation YAML template, formatted with consistent indentation and inline documentation for clarity.
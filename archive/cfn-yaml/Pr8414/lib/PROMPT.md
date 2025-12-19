## Title

Refined Problem Statement — Workflow Orchestration for Payment Processing (Step Functions)

## Summary

A fintech application must orchestrate **~1,500 daily payment workflows**. Each workflow includes steps such as validation, processing, external API calls, and status tracking. The system must guarantee reliability, support retries, and provide full visibility into workflow execution. Simplicity and maintainability are critical to ensure adoption by the engineering team. The solution will leverage AWS services: **Step Functions** (workflow orchestration), **Lambda** (business logic), **DynamoDB** (state persistence), **CloudWatch** (monitoring), **SNS** (alerts), and **IAM** (secure execution).

## Goals

* Orchestrate 1,500 daily payment workflows reliably.
* Handle retries gracefully with exponential backoff.
* Provide clear operational visibility into workflow state, metrics, and errors.
* Deliver a simple and maintainable architecture.
* Deploy via AWS CloudFormation for reproducibility and scalability.

---
## Functional Requirements

1. Support a state machine that models the payment workflow steps:

   * `ValidatePayment` (input validation, check customer data)
   * `ProcessPayment` (interact with payment gateway or external API)
   * `StoreTransaction` (write payment record into DynamoDB)
   * `NotifyCustomer` (success/failure notification)
2. Implement retries for transient failures with exponential backoff.
3. Persist workflow outcomes in DynamoDB with attributes: `paymentId`, `status`, `timestamp`, `retries`, `errorReason`.
4. Trigger SNS alerts for failed workflows after max retries.
5. Provide CloudWatch dashboards & alarms for observability.

## Non-Functional Requirements

* Handle ~1,500 workflows/day (low concurrency, moderate throughput).
* Ensure fault-tolerance and exactly-once execution per paymentId.
* Keep architecture simple to ensure adoption.
* Enforce least-privilege access with IAM roles.

## Constraints & Assumptions

* External payment API is assumed idempotent or guarded with dedupe keys.
* DynamoDB is chosen for lightweight, scalable persistence.
* Step Functions Standard (not Express) is used for full visibility and retries.

---

## High-level Flow

1. **API Gateway / Event Trigger** -> Initiates a Step Functions state machine execution with `paymentId` and payment data.
2. **Step Functions** orchestrates:

   * `ValidatePaymentLambda`
   * `ProcessPaymentLambda` (calls external API)
   * `StoreTransactionLambda` (writes results to DynamoDB)
   * `NotifyCustomerLambda` (publishes notification)
3. **DynamoDB** stores workflow state and transaction logs.
4. **SNS** sends alerts on workflow failures.
5. **CloudWatch** collects metrics, provides dashboards, and sends alarms.

## Components

* Step Functions State Machine (`PaymentWorkflowStateMachine`)
* Lambda Functions

  * `ValidatePayment`
  * `ProcessPayment`
  * `StoreTransaction`
  * `NotifyCustomer`
* DynamoDB Table `PaymentTransactions`
* SNS Topic `PaymentWorkflowAlerts`
* CloudWatch Dashboard & Alarms
* IAM Roles for Step Functions and Lambda (least-privilege)

---

## Template Structure

* **Parameters**

  * `Environment` (dev/test/prod)
  * `AlertEmail` (for SNS subscription)
* **Resources**

  * `DynamoDBTablePaymentTransactions`
  * `SNSTopicPaymentWorkflowAlerts`
  * `StepFunctionsStateMachinePaymentWorkflow`
  * Lambda functions (`ValidatePayment`, `ProcessPayment`, `StoreTransaction`, `NotifyCustomer`) + IAM roles
  * `CloudWatchDashboard` + `CloudWatchAlarms`
* **Outputs**

  * State Machine ARN, DynamoDB table name, SNS topic ARN

## Implementation Notes

* Use Step Functions retry/catch blocks for transient failures.
* Configure SNS with email subscription for alerts.
* Use DynamoDB conditional writes for idempotency on `paymentId`.
* Add Lambda DLQs for error capture.

---

## Cost Optimization

* Step Functions Standard pricing (1,500 executions/day = ~45k/month → low cost).
* Lambda and DynamoDB usage within free-tier/low range.
* SNS and CloudWatch alarms negligible cost.

## Monitoring & Alerts

* CloudWatch metrics: executions started, succeeded, failed.
* Custom metrics for retry counts.
* Alerts via SNS for failure thresholds.

## Security

* Use least-privilege IAM roles.
* Encrypt DynamoDB data at rest.
* Restrict SNS subscription to approved email endpoints.

---


1. The system can orchestrate 1,500 daily workflows reliably.
2. Each workflow execution is tracked in Step Functions with full visibility.
3. Failures are retried; if retries exhausted, SNS alert is triggered.
4. DynamoDB contains consistent records of payment workflow outcomes.
5. CloudWatch dashboard and alarms are live with metrics.
6. Deployable end-to-end via CloudFormation.

---

## Prompt: Generate CloudFormation + Lambda code

```
You are an AWS solutions architect. Produce a CloudFormation template (YAML) that deploys a payment workflow orchestration system. Requirements:
- Step Functions state machine with steps: ValidatePayment, ProcessPayment, StoreTransaction, NotifyCustomer.
- Each step runs on a Lambda function.
- DynamoDB table for storing workflow results keyed by `paymentId`.
- SNS topic for workflow failure alerts, with email subscription parameterized by `AlertEmail`.
- CloudWatch dashboard + alarms for monitoring workflow success/failure.
- IAM roles with least-privilege for Step Functions and Lambdas.
- Add retries and error handling in the state machine definition.
- Provide Lambda function code stubs (Node.js or Python) inline for each step, with comments.
- Parameterize environment name and output key ARNs (State Machine ARN, DynamoDB table, SNS topic).

Return: CloudFormation YAML template + Lambda function handler stubs + brief README on how to deploy.
```

---

# 08-next-steps.md

* Confirm preferred language for Lambda handlers (Python or Node.js).
* Validate whether payment API integration details are available.
* Then generate the CloudFormation YAML + code bundle for deployment.
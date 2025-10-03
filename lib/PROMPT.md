## Title

Refined Problem Statement — Email Notification System (SNS + SES)

## Summary

An e-commerce platform must send **~2,000** order confirmation emails per day to customers. The system must guarantee delivery tracking, minimize operational cost, integrate with existing backend systems (order service and user database), and provide clear observability (logs, metrics, and alerts). The implementation will use AWS services: **SNS** (pub/sub), **SES** (email delivery), **Lambda** (processing & transformation), **DynamoDB** (delivery logs), **CloudWatch** (metrics & alarms), and **IAM** (least-privilege access).

## Goals

- Deliver reliable order confirmation emails at low cost for 2k/day volume.
- Track per-message delivery status and store events for audit and troubleshooting.
- Integrate easily with existing order processing systems (push or pull integration).
- Provide operational visibility (CloudWatch dashboards, alarms) and cost controls.
- Deploy everything through AWS CloudFormation for reproducibility.

---

## Functional Requirements

1. Accept notifications from the order system containing: `orderId`, `customerEmail`, `customerName`, `items[]`, `total`, `timestamp`, `metadata`.
2. Publish an order confirmation event to an SNS topic.
3. Subscribe a Lambda function to the SNS topic to enrich, validate and transform the message into an SES send request.
4. Use SES to send transactional email (order confirmation) to the customer.
5. Record message lifecycle events (sent, delivered, bounced, complaint) into DynamoDB.
6. Provide a queryable API (or DynamoDB view) for recent delivery statuses per `orderId`.

## Non-Functional Requirements

- Handle 2,000 emails/day with peaks safely (burst capacity for retries).
- Design for cost efficiency: leverage SNS + Lambda + SES (transactional) — avoid over-provisioned resources.
- Secure: least-privilege IAM roles, restrict SES sending to verified domains, protect DynamoDB with encryption at rest.
- Observability: CloudWatch metrics + logs, dashboard, alarms for bounce rate / sending errors.
- Idempotency and retry: avoid duplicate sends; use deduplication keys or DynamoDB conditional writes.

## Constraints & Assumptions

- SES is set up in a production region with appropriate sending limits or in production mode (not sandbox).
- The existing order system can publish to SNS or call a small API that publishes to SNS.
- No requirement for internationalisation beyond UTF-8 in emails.

---

## High-level flow

1. **Order System** -> Publishes event to **SNS Topic: order-confirmations** (or pushes to API Gateway which publishes to SNS).
2. **SNS** -> Fan-out to subscribers; primary subscriber is **Lambda: send-order-email**.
3. **Lambda** -> Validates/enriches event, checks DynamoDB to avoid duplicate sends, calls **SES** SendEmail/SendRawEmail, writes a `MessageRecord` to **DynamoDB** with status `SENT` and SES `MessageId`.
4. **SES** -> Delivers email. SES generates feedback (delivery, bounce, complaint) via **SNS** topics configured for SES notifications.
5. **SES feedback SNS topics** -> Subscribed Lambda `ses-feedback-processor` updates DynamoDB status to `DELIVERED` / `BOUNCE` / `COMPLAINT` and emits CloudWatch metrics.
6. **CloudWatch** -> Dashboard, alarms (e.g., bounce rate > 5%, send failures > threshold), and logs are stored in CloudWatch Logs.

## Components

- SNS Topics
  - `order-confirmations` (application events)
  - `ses-delivery-notifications` (SES -> SNS for delivery)
  - `ses-bounce-notifications`
  - `ses-complaint-notifications`

- Lambda Functions
  - `send-order-email` (subscribed to `order-confirmations`)
  - `ses-feedback-processor` (subscribed to SES notification topics)

- SES
  - Verified sending domain (preferably DKIM enabled)
  - Configuration Set to publish event types to SNS topics

- DynamoDB
  - Table `EmailDeliveries` (partition key: `orderId`, sort key: `messageId` or `eventTimestamp`)
  - Attributes: `orderId`, `messageId`, `to`, `status`, `sesMessageId`, `attempts`, `lastUpdated`, `reason`

- IAM Roles/Policies
  - Lambda execution roles with least-privilege: publish logs, write DynamoDB, call SES, read SNS (subscribe invocation is managed by AWS, but role to call SES & DynamoDB is needed)

- CloudWatch
  - Metrics: `EmailsSent`, `SendFailures`, `Bounces`, `Complaints`, `DeliveryLatency`
  - Alarms & Dashboard

---

## Template Structure

- **Parameters**
  - `Environment` (dev/test/prod)
  - `VerfiedDomain` (SES domain)
  - `SesFromAddress` (no-reply@domain)
  - `EnableProductionSES` (bool) — guard for sandbox vs prod

- **Resources**
  - `SNSTopicOrderConfirmations` (AWS::SNS::Topic)
  - `LambdaSendOrderEmail` (AWS::Lambda::Function) + `LambdaExecutionRole`
  - `LambdaPermissionForSNS` (AWS::Lambda::Permission) to allow SNS to invoke Lambda
  - `DynamoDBTableEmailDeliveries` (AWS::DynamoDB::Table) with GSI for `to` or `status` queries
  - `SESConfigurationSet` (AWS::SES::ConfigurationSet) + `SESNotificationTopicBounce/Complaint/Delivery` (SNS topics) and `AWS::SES::ConfigurationSetEventDestination`
  - `CloudWatchDashboard`, `CloudWatchAlarms`
  - `IAM Roles` and `Policies` with least-privilege

- **Outputs**
  - SNS topic ARN, DynamoDB table name, Lambda ARNs

## Important Implementation Notes

- Use environment variables to pass SES From address, DynamoDB table name and other configuration to Lambdas.
- Use Lambda dead-letter queue (DLQ) or Lambda destinations to capture failed invocations.
- Add Conditional logic for SES sandbox mode: in sandbox, route to a test address or stub so production SES isn’t called.
- Configure SNS subscription filter policy if you plan multiple message types on the same topic.
- Use DynamoDB conditional write (PutItem with ConditionExpression attribute_not_exists(messageId)) to ensure idempotency.

---

## Cost Optimization

- SES costs are per-email; 2k/day ~ 60k/month. Monitor and estimate costs: SES (per message), Lambda duration (short), DynamoDB storage and read/write capacity — use on-demand for low ops overhead.
- Use SES bulk or dedicated IP only when necessary; prefer SES standard transactional.

## Monitoring & Alerts

- CloudWatch metrics from Lambda: `Invocations`, `Errors`, `Duration`.
- Custom metrics published by `ses-feedback-processor`: `Bounces`, `Complaints`, `Deliveries`.
- Alarms: bounce rate > 2% (threshold configurable), lambda errors > x, delivery latency > y.

## Security

- Keep SES sending domain verified and use DKIM to protect deliverability.
- Encrypt DynamoDB at rest and restrict access to the Lambda role only.
- Use IAM policy conditions `aws:SourceArn` on SES publish permissions if you expose SES APIs.

---

1. System can send 2,000 order confirmation emails in a 24-hour window without manual intervention.
2. Each sent message has a corresponding DynamoDB record with `status=SENT` and later updated to `DELIVERED` / `BOUNCE` / `COMPLAINT` when SES notifications arrive.
3. Duplicate emails do not occur for the same `orderId` (idempotency enforced).
4. CloudWatch dashboard shows key metrics and alarms trigger when thresholds breached.
5. The whole system deploys successfully via CloudFormation stack and outputs the relevant ARNs and endpoints.

---

## Implementation Guidelines

When implementing this email notification system, consider the following technical requirements:

**CloudFormation Template Structure:**

- Use parameterized resource naming with Environment parameter
- Implement proper IAM roles with least-privilege access
- Include comprehensive error handling and monitoring
- Add cost optimization features like DynamoDB on-demand billing

**Lambda Function Requirements:**

- Implement idempotency checks to prevent duplicate email sends
- Add proper error handling and retry logic
- Include comprehensive logging for troubleshooting
- Use environment variables for configuration

**SES Configuration:**

- Set up proper domain verification and DKIM
- Configure bounce and complaint handling
- Implement sandbox mode for testing
- Use configuration sets for event tracking

**Monitoring and Alerting:**

- Create CloudWatch dashboards for key metrics
- Set up alarms for bounce rates and failures
- Implement custom metrics for business KPIs
- Add log aggregation and analysis

**Security Considerations:**

- Encrypt data at rest and in transit
- Use least-privilege IAM policies
- Implement proper access controls
- Regular security audits and updates

---

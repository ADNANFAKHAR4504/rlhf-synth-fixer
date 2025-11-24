Create a Python script using Boto3 to audit SNS topics and SQS queues for misconfigurations, security gaps, and reliability risks.

## Required Analysis

### Message Loss & Resilience Checks

1. **Missing DLQs**: Identify all SQS queues without a Dead Letter Queue configured in their redrive policy.

2. **DLQ Message Accumulation**: Flag DLQs that have messages sitting in them (ApproximateNumberOfMessages > 0), indicating unprocessed failures.

3. **High DLQ Depth**: Identify DLQs approaching capacity (ApproximateNumberOfMessages within 10% of 120,000 messages).

4. **Excessive Retry Configuration**: Flag redrive policies where maxReceiveCount exceeds 10 retries.

5. **Visibility Timeout Issues**:
   - Flag queues with visibility timeout under 30 seconds (too short for typical processing)
   - Flag queues with visibility timeout exceeding 12 hours (delays failure recovery)

6. **DLQ Retention Gap**: Find DLQs where the message retention period equals or is less than the source queue retention, leaving insufficient time for investigation.

### Cost & Efficiency Checks

7. **Short Polling**: Flag queues where ReceiveMessageWaitTimeSeconds is 0 (should use long polling).

8. **Stale Queues**: Identify queues with zero messages (ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible, and ApproximateNumberOfMessagesDelayed all equal 0) and no recent activity based on queue attributes.

### Security Checks

9. **Unencrypted Sensitive Resources**: Find queues or topics tagged with `DataClassification: Confidential` that do not have KMS encryption enabled.

### SNS-Specific Checks

10. **Missing Subscription Filters**: Identify SNS subscriptions without filter policies attached.

11. **Subscription Status**: Flag SNS subscriptions that are not in `Confirmed` status or have delivery issues based on subscription attributes.

12. **FIFO Deduplication**: Flag FIFO queues where ContentBasedDeduplication is disabled.

## Output Requirements

### JSON Report (sns_sqs_analysis.json)

- Structured findings grouped by check category
- Include queue/topic ARNs and names
- Quantify message counts for DLQ-related findings
- Severity rating for each finding (critical, high, medium, low)

### Console Output

- Summary of findings ranked by severity with resource details
- Count of affected resources with details per check
- Total message volume at risk for DLQ issues with supporting resource details

Provide the complete Python code in a single code block for `analyse.py`.

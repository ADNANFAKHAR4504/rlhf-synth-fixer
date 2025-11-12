**model_failure**

# What can go wrong and how to remediate

## Email subscription not active

* The compliance email must confirm the SNS subscription before alerts are delivered. Without confirmation, fraud alerts will be published but not received.
* Remediation: Confirm the subscription from the inbox linked to the configured address.

## S3 event notifications not firing

* Notifications only trigger for `uploads/` prefix and `.csv` suffix. Files outside this path or with different extensions will be ignored.
* Remediation: Ensure merchant uploads target the exact prefix and extension. Validate object key normalization.

## Lambda DLQ permission errors

* Dead-letter publishing requires `sqs:SendMessage` permissions on the target queue. Missing permissions cause function creation or runtime failures.
* Remediation: Ensure each Lambda execution role includes `sqs:SendMessage` to the DLQ ARN.

## CloudWatch alarm creation failures

* Metric-math alarms must have exactly one metric with `ReturnData: true`. If multiple metrics return data, creation fails.
* Remediation: Mark the raw metrics with `ReturnData: false` and return only the computed expression.

## Circular dependency in S3 ➜ Lambda wiring

* Referencing the bucket ARN in Lambda invoke permissions while also embedding the Lambda ARN in the bucket notification can create a cycle.
* Remediation: Omit the bucket `SourceArn` in the permission and use deterministic ARNs in IAM statements rather than `Ref`-based references to the bucket.

## DynamoDB query semantics

* Retrieving the latest item relies on ISO-8601 `timestamp` sorting. Non-ISO strings or inconsistent formats will break descending retrieval expectations.
* Remediation: Normalize timestamps to ISO-8601 strings at ingestion. Consider a GSI for more complex query patterns.

## CSV schema drift and data quality

* Missing `transactionId` or malformed `amount` values will be skipped or coerced, potentially reducing data completeness.
* Remediation: Add stricter validation and reporting, or publish invalid rows to a quarantine bucket or a separate DLQ for review.

## API usage plan enforcement

* The API requires an API key and enforces a 1,000 requests per day quota. Requests without a key or beyond quota will fail.
* Remediation: Distribute and rotate API keys as needed and monitor usage to adjust quotas.

## Cost and concurrency constraints

* Reserved concurrency of ten contains runaway costs and protects downstream services but may throttle during spikes.
* Remediation: Adjust reserved concurrency and add buffering strategies if higher throughput is required.

## Region and naming constraints

* S3 bucket names are global and must be unique; the deterministic name uses the project and environment suffix, but collisions are still possible in large organizations.
* Remediation: Append a short hash or account identifier to bucket names if collisions are observed.

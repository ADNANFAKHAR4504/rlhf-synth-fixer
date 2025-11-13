**model_response**

# TapStack – Implemented Solution Summary

## What the template builds:

* **SQS FIFO** queues (primary + DLQ) and **DR FIFO** queues (DR + DR DLQ), all with content-based deduplication and proper redrive policies (`maxReceiveCount: 3`).
* **Primary Processor Lambda** with reserved concurrency; FIFO event source mapping with small batch size and **no batching window**; idempotent DynamoDB writes.
* **DynamoDB PAY_PER_REQUEST** table (`message-state-ENV`) with GSI for lookup and stream enabled for future extensibility.
* **Replication Lambda** that reads the primary queue and sends to the **DR queue** URL resolved from **SSM**; preserves group/dedup semantics.
* **EventBridge → SNS** path to notify on DLQ alarm state changes.
* **CloudWatch Alarms** (primary depth, DLQ depth, replication errors) and a **Dashboard** (queue depth and Lambda metrics).
* **SSM Parameters** for all queue URLs/ARNs, visibility timeout, and optionally the trusted role ARN (only created if provided).

## Parameters & guardrails:

* `EnvironmentSuffix` uses a **safe regex** (lowercase, digits, hyphens) and is included in every name.
* Concurrency, alarm thresholds, and purge schedule are parameterized with sane defaults.
* **Auto-purge** is enabled only in **non-prod** and when the feature flag is `true`.
* Optional **trusted role** access to queues is applied only when a non-empty ARN is provided.

## Multi-region deployment:

* Deploy **DR first in us-west-2**, then **Primary in us-east-1**.
* IAM names are made **region-unique** (or autonamed) to avoid global collisions.
* Replication Lambda in Primary uses the **DR SSM path** to resolve the DR queue URL.

## Notable implementation details:

* EventSourceMappings omit `MaximumBatchingWindowInSeconds` to satisfy FIFO constraints.
* `SNS::TopicPolicy.Topics` uses **TopicArn**, and the dashboard omits `DashboardName` for stricter linters.
* SSM parameter for a **blank TrustedRoleArn** is not created (avoids empty-value failures).
* Queue policies grant least-privilege actions to the specified trusted role only.

## What is out of scope:

* VPC/private subnets, VPC endpoints, KMS encryption, and DynamoDB Global Tables replication logic are not included in this core build (can be added later as optional enhancements).


Refined Problem Statement — Multi-Account Replication Framework (S3, DynamoDB, Lambda, EventBridge)

## Summary

A **financial services company** requires a **multi-account AWS infrastructure** to synchronize configuration and schema changes across **development**, **staging**, and **production** environments. The goal is to ensure configuration consistency, maintain schema parity, and enable automated propagation of infrastructure updates while enforcing **strict isolation** and **least-privilege access**. The framework will use **CloudFormation StackSets** for multi-account deployment.

The solution leverages **S3 (for configuration artifacts)**, **DynamoDB Global Tables (for metadata synchronization)**, **Lambda (for event-driven replication and validation)**, **EventBridge (for change propagation)**, **SSM Parameter Store (for configuration mirroring)**, **IAM (for cross-account roles and replication access)**, and **CloudWatch (for replication monitoring)**.

## Goals

* Establish automated multi-account replication for configuration artifacts and metadata.
* Maintain schema consistency across DynamoDB tables using Global Tables.
* Synchronize application configurations through SSM Parameter Store hierarchies.
* Ensure secure cross-account communication with least-privilege IAM roles.
* Enable visibility into replication health and lag via CloudWatch alarms.
* Deploy the full setup using a reusable, parameterized CloudFormation template.

## Functional Requirements

1. **S3 Buckets (per environment)**

   * Store configuration artifacts (JSON/YAML templates, metadata files).
   * Enable **cross-account replication** between dev → staging → prod buckets.
   * Enforce **SSE-S3 encryption** for all replicated objects.
   * S3 bucket policies should **allow read-only access** from other accounts and **restrict writes**.

2. **DynamoDB Global Tables**

   * Maintain identical schemas across accounts for metadata synchronization.
   * Achieve eventual consistency within 1 second.
   * Enable Streams to capture schema modification events.

3. **Lambda Functions (Python 3.11, 256MB)**

   * **ReplicationMonitorLambda** — Monitors S3/DynamoDB replication events.
   * **ConfigValidatorLambda** — Validates consistency across environments.
   * **StreamProcessorLambda** — Processes DynamoDB stream events for schema changes.
   * All Lambdas are triggered by EventBridge rules or DynamoDB Streams.

4. **EventBridge Rules**

   * Detect CloudFormation stack updates and configuration changes.
   * Route events to replication or validation Lambdas.

5. **SSM Parameter Store Hierarchies**

   * Mirror application settings (e.g., `/app/dev/config`, `/app/staging/config`, `/app/prod/config`).
   * Ensure automatic synchronization across accounts.

6. **IAM Roles (Cross-Account)**

   * Implement least-privilege roles to enable replication services.
   * Allow replication agents in one account to assume roles in another.

7. **CloudWatch Alarms & Metrics**

   * Monitor replication lag and error counts.
   * Trigger alerts when latency or failures exceed thresholds.


## High-Level Architecture

1. **S3 Replication Pipeline**

   * S3 buckets per environment with replication configuration and KMS encryption.
   * Replication uses IAM roles with scoped permissions for each environment.

2. **DynamoDB Global Tables**

   * One logical global table replicated across all three accounts.
   * Schema changes detected by DynamoDB Streams and processed by Lambda.

3. **Event-Driven Synchronization**

   * EventBridge detects CloudFormation or configuration changes and triggers Lambdas.
   * Lambdas replicate or validate changes as needed.

4. **Configuration Synchronization via SSM**

   * SSM Parameter Store maintains mirrored configurations across environments.

5. **Monitoring & Observability**

   * CloudWatch Dashboards and Alarms track replication metrics and validation results.

## Template Design

* **Parameters**

  * `Environment` (dev/staging/prod)
  * `AccountIdDev`, `AccountIdStaging`, `AccountIdProd`
  * `ReplicationRoleName`
  * `DynamoDBTableName`
  * `ReplicationBucketName`
  * `SSMPathPrefix`

* **Resources**

  * **S3 Buckets** (with ReplicationConfiguration, Policies, Encryption)
  * **DynamoDB Global Table**
  * **Lambda Functions** (3 total: monitor, validate, stream-processor)
  * **EventBridge Rules** (CloudFormation stack update and config change triggers)
  * **SSM Parameters** (hierarchical structure)
  * **IAM Roles & Policies** (cross-account replication access)
  * **CloudWatch Alarms & Dashboard** (replication lag metrics)

* **Conditions**

  * Environment-specific logic for replication direction and event targets.

* **Outputs**

  * `ReplicationStatusEndpoint`
  * `S3BucketName`
  * `DynamoDBTableArn`
  * `ReplicationRoleArn`
  * `CloudWatchDashboardUrl`


## Security

* Cross-account access limited to replication-specific roles.
* Enforce encryption in transit (HTTPS) and at rest (SSE-S3, SSE-KMS).
* IAM roles scoped with resource-level permissions.

## Observability

* CloudWatch metrics for replication lag and failure rates.
* Alarms triggered on excessive lag (>1 second) or Lambda invocation errors.

## Cost Optimization

* Minimize replication frequency for infrequently updated artifacts.
* Use DynamoDB on-demand capacity for metadata.


1. Each environment deploys successfully via CloudFormation StackSets.
2. Configuration artifacts replicate across accounts automatically.
3. DynamoDB schemas remain synchronized (validated by ConfigValidatorLambda).
4. SSM Parameter Store paths mirror application settings across all environments.
5. CloudWatch alarms detect replication lag or failures.
6. IAM roles enforce least-privilege cross-account access.
7. Template outputs replication and monitoring endpoints.


## Prompt: Generate CloudFormation YAML Template

```
You are an AWS infrastructure architect. Generate a CloudFormation YAML template that establishes a **multi-environment replication framework** across three AWS accounts (dev, staging, prod) in the us-east-1 region.

Requirements:
- Deploy S3 buckets in each account with cross-account replication (SSE-S3 encryption).
- Set up DynamoDB Global Tables for synchronized metadata (1-second eventual consistency).
- Create Lambda functions (Python 3.11, 256MB) for:
  - Monitoring configuration replication
  - Validating consistency across environments
  - Processing DynamoDB Streams for schema changes
- Configure SSM Parameter Store hierarchies for mirroring application settings.
- Establish IAM roles for cross-account replication with least-privilege.
- Deploy EventBridge rules that trigger on CloudFormation stack updates to initiate replication.
- Include S3 bucket policies allowing read-only access across environments.
- Set up CloudWatch alarms for replication lag and failure metrics.
- Use CloudFormation conditions for environment-specific resources.
- Include parameters for environment names, account IDs, replication role names, and table names.
- Outputs should include replication status endpoint, bucket names, and monitoring dashboard URL.

Return: A single CloudFormation YAML template with inline comments and resource explanations.
```


* Confirm preferred Lambda runtime packaging (ZIP from S3 or inline code).
* Validate account IDs and SSM path naming conventions.
* Then generate the full CloudFormation YAML and Lambda code package.
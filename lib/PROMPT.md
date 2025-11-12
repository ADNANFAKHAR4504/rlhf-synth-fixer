# Task: Build a Serverless ETL Pipeline Using CDKTF (TypeScript)

Develop a **serverless ETL (Extract, Transform, Load) pipeline** using **AWS CDK for Terraform (CDKTF)** in **TypeScript**.  
The infrastructure must be organized into only **two files**:

- `lib/modules.ts` – defines all reusable serverless modules (S3, Lambda, Step Functions, DynamoDB, SNS, IAM, CloudWatch).  
- `lib/tap-stack.ts` – composes and deploys the complete ETL pipeline stack using modules.

---

## Problem Overview

You are required to implement an **event-driven, fault-tolerant ETL system** that automatically processes CSV transaction files uploaded to an S3 bucket.  
The system must validate, transform, and store metadata for each file, ensuring proper error handling, monitoring, and notifications.

The CDKTF stack should follow **serverless best practices**, support **automated recovery**, and ensure **observability** and **security** through tagging, encryption, and least-privilege IAM design.

---

## Core Requirements

### 1. **S3 Bucket Setup**
- Create an **S3 bucket** with:
  - **Server-side encryption (SSE-S3)** enabled.
  - A `raw/` prefix for incoming CSV files.
  - A `processed/` prefix for successfully processed files.
  - A `failed/` prefix for files that fail processing.
- Configure **S3 event notifications** to trigger the validation Lambda function when a file is uploaded under `raw/`.
- Apply **lifecycle policies** to move `processed/` files to **Glacier after 90 days**.

---

### 2. **Lambda Functions**
- **Validation Lambda Function**:
  - Validates CSV structure and required columns:  
    `transaction_id`, `customer_id`, `amount`, `timestamp`.
  - Publishes failed file notifications to an **SNS topic**.
  - Sends valid data to the Step Functions workflow.
- **Transformation Lambda Function**:
  - Normalizes timestamps to **ISO 8601** format.
  - Converts amounts to **decimal** representation.
  - Moves successfully processed files to the `processed/` prefix.
- Both Lambdas must:
  - Include **AWS X-Ray tracing**.
  - Have **Dead Letter Queues (DLQs)** for failure handling.
  - Use **IAM roles** with least-privilege permissions.
  - Include **CloudWatch logging** for operational visibility.

---

### 3. **Step Functions Orchestration**
- Create a **Step Functions State Machine** that:
  - Orchestrates the **validation** and **transformation** Lambdas.
  - Implements **retry logic** and **error catching** for all states.
  - Includes a **notification step** to publish errors to the SNS topic.
  - Stores processing metadata in DynamoDB upon completion (success or failure).

---

### 4. **DynamoDB Table**
- Define a DynamoDB table for **processing metadata** with attributes:
  - `file_name`, `process_start_time`, `process_end_time`, `status`, `error_message`.
- Must use **on-demand billing mode**.
- Encrypt data using **AWS-managed keys (KMS)**.
- Include **tags** for `Environment=Production` and `Project=ETL-Pipeline`.

---

### 5. **Monitoring and Notifications**
- Create an **SNS topic** for email notifications on processing failures.
- Configure **CloudWatch alarms** to trigger when Lambda error rates exceed **5% over 5 minutes**.
- Enable **X-Ray tracing** across all Lambda functions and the Step Functions state machine.

---

### 6. **IAM and Security**
- Implement **least-privilege IAM roles** for all services:
  - Validation Lambda: read from `raw/`, write to `failed/`.
  - Transformation Lambda: read from validated output, write to `processed/`.
  - Step Functions: invoke Lambdas, write to DynamoDB, publish to SNS.
- Ensure all services are encrypted and secured following AWS best practices.

---

## CDKTF Configuration

- Use **AWS CDK for Terraform (TypeScript)** to define all resources.
- Split code into:
  - `lib/modules.ts`: Reusable constructs for S3, Lambda, Step Functions, DynamoDB, SNS, IAM, CloudWatch.
  - `lib/tap-stack.ts`: Composition and deployment of the ETL pipeline.
- Apply consistent tagging:  
  `Environment=Production`, `Project=ETL-Pipeline`.
- Use **Terraform remote backend** (S3 + DynamoDB) for state management.
- Use **provider version constraints** to ensure reproducible deployments.

---

## Constraints Summary

| Constraint | Description |
|-------------|-------------|
| **Serverless design** | Use only managed services (S3, Lambda, Step Functions, DynamoDB, SNS). |
| **Encryption** | S3, DynamoDB, and all data transfers must be encrypted. |
| **Tracing** | Enable AWS X-Ray for all Lambdas and Step Functions. |
| **Monitoring** | CloudWatch Alarms for >5% Lambda error rate. |
| **Reliability** | Each Lambda must include a DLQ for failure handling. |
| **Billing** | DynamoDB must use on-demand billing mode. |
| **Storage** | Processed files transition to Glacier after 90 days. |
| **Notifications** | Step Functions failure path must publish to SNS. |
| **Security** | Use IAM least-privilege and server-side encryption everywhere. |

---

## Deliverables

- **`modules.ts`** – reusable constructs for S3, Lambda, Step Functions, DynamoDB, SNS, IAM, and CloudWatch.  
- **`tap-stack.ts`** – integrates and deploys the ETL pipeline with event-driven flow and monitoring.  
- **Unit tests** verifying key resources, IAM roles, and event flows.  
- **Deployment guide** explaining `cdktf deploy` and `cdktf destroy` usage.

---

## Expected Outcome

A **fault-tolerant, event-driven serverless ETL system** deployed via CDKTF that automatically processes CSV files uploaded to S3,  
validates and transforms data through orchestrated Lambdas using Step Functions, logs all actions, and sends notifications on errors.
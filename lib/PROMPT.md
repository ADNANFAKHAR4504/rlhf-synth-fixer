# Data Backup System with S3 — Refined Problem Statement

## Context

A **small business** requires a simple and reliable system to back up approximately **500 documents per day**. The system must ensure high durability, follow data retention policies, and minimize costs. The architecture should use **AWS managed services** to keep operations simple, secure, and automated.

---

## Business Requirements

* Automatically back up daily business documents.
* Ensure data **durability, integrity, and security**.
* Retain documents for **30 days** before automatic deletion.
* Provide monitoring and visibility for backup success and failure.
* Keep infrastructure **low-cost** and **low-maintenance**.

---

## Technical Objectives

* Build an **automated backup system** using AWS CloudFormation.
* Store backups in **Amazon S3** with encryption and lifecycle policies.
* Schedule backups using **Amazon EventBridge** to trigger daily uploads.
* Use **AWS KMS** for encryption at rest.
* Configure **IAM policies** to restrict access.
* Enable **CloudWatch metrics and alerts** for monitoring.

---

## Core AWS Services

| Service                | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| **Amazon S3**          | Primary storage for backup documents.                       |
| **AWS KMS**            | Encrypts backup data for secure storage.                    |
| **AWS IAM**            | Provides fine-grained access control for backup operations. |
| **Amazon EventBridge** | Schedules daily backup triggers.                            |
| **AWS Lambda**         | Processes and uploads backup data to S3.                    |
| **Amazon CloudWatch**  | Tracks system health, backup success metrics, and alerts.   |

---

## Deployment Architecture

1. **EventBridge** triggers a **Lambda function** daily to initiate backups.
2. **Lambda** collects or processes the day’s documents and uploads them to **S3**.
3. **S3 Bucket** is configured with a **30-day lifecycle policy** to automatically delete old files.
4. **KMS Encryption** secures all stored data.
5. **CloudWatch** logs Lambda execution and S3 operations.
6. **IAM Roles & Policies** restrict access to S3, KMS, and EventBridge only as necessary.

---

## Success Criteria

* System automatically backs up 500+ daily documents without manual intervention.
* Data is encrypted at rest and automatically deleted after 30 days.
* Metrics and alerts available in CloudWatch.
* Entire solution deployable and maintainable using CloudFormation.
* Cost remains optimized through automation and lifecycle management.

---

## Prompt for CloudFormation Generation

Create an AWS CloudFormation YAML template that implements the following:

* S3 bucket with:

  * Server-side encryption using AWS KMS.
  * Lifecycle policy to delete objects after 30 days.
* Lambda function (Python 3.9) for daily backups.
* EventBridge rule that triggers Lambda every 24 hours.
* IAM roles and policies for Lambda with least-privilege access to S3 and KMS.
* CloudWatch log group and metrics for Lambda and S3 operations.
* Parameters for Environment and BackupBucketName.
* Outputs exporting S3 bucket name, EventBridge rule, and Lambda ARN.

Include resource tagging, logical naming conventions, and ensure minimal operational overhead.
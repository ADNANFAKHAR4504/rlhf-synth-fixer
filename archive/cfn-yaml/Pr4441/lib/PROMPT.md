# Image Processing System with S3 Triggered Lambda — Refined Problem Statement

## Context

A **media company** needs to process approximately **1,000 image uploads daily**, automatically generating thumbnails. The system should be **serverless**, cost-efficient, and easy to maintain while providing clear **metrics** and **monitoring** for operational visibility.

---

## Business Requirements

* Automatically process images uploaded to an S3 bucket.
* Generate and store image thumbnails in a dedicated S3 bucket or prefix.
* Track image metadata for auditing and retrieval.
* Provide monitoring and metrics on processing success and performance.
* Maintain low operational costs and minimal maintenance overhead.

---

## Technical Objectives

* Build a **serverless image processing pipeline** using AWS CloudFormation.
* Use **S3 event triggers** to automatically invoke Lambda when a new image is uploaded.
* Implement **Lambda (Python 3.9)** to generate thumbnails.
* Store image metadata (filename, size, thumbnail path, timestamp) in **DynamoDB**.
* Use **CloudWatch** for metrics, logging, and alerts.
* Configure **IAM** roles and policies for secure, least-privilege access.

---

## Core AWS Services

| Service               | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| **Amazon S3**         | Stores uploaded images and generated thumbnails.    |
| **AWS Lambda**        | Processes uploaded images and generates thumbnails. |
| **Amazon DynamoDB**   | Stores image metadata and processing details.       |
| **Amazon CloudWatch** | Monitors processing metrics, logs, and alerts.      |
| **AWS IAM**           | Provides secure, least-privilege access control.    |

---

## Deployment Architecture

1. **S3 Bucket (Uploads)** receives new image files from clients.
2. **S3 Event Trigger** invokes a **Lambda function** whenever a new image is uploaded.
3. **Lambda** function:

   * Reads the uploaded image from S3.
   * Generates a thumbnail using Python image processing libraries (e.g., Pillow).
   * Uploads the thumbnail to an **S3 Thumbnails** bucket or prefix.
   * Logs image details and metadata into **DynamoDB**.
4. **CloudWatch Logs and Metrics** record Lambda execution time, error counts, and invocation metrics.
5. **IAM Roles and Policies** restrict permissions to specific resources.

---

## Success Criteria

* System processes 1,000+ image uploads per day automatically.
* Thumbnails are generated and stored successfully with metadata recorded.
* Lambda errors and execution metrics are visible in CloudWatch.
* Entire infrastructure deployable via CloudFormation.
* Architecture is cost-efficient and requires minimal maintenance.

---

## Prompt for CloudFormation Generation

Create an AWS CloudFormation YAML template that implements the following:

* Two S3 buckets:

  * `SourceBucket` for uploaded images.
  * `ThumbnailBucket` for storing generated thumbnails.
* S3 event notification that triggers a Lambda function on `ObjectCreated` events.
* **Lambda (Python 3.9)** function to:

  * Download uploaded images.
  * Generate thumbnails using Pillow.
  * Upload thumbnails to `ThumbnailBucket`.
  * Write metadata (filename, size, upload time, thumbnail path) to DynamoDB.
* **DynamoDB table** `ImageMetadata` with `ImageID` as the primary key.
* **IAM roles** with least-privilege access to S3, DynamoDB, and CloudWatch.
* **CloudWatch log group** and metrics for Lambda performance.
* **Parameters** for `Environment`, `SourceBucketName`, and `ThumbnailBucketName`.
* **Outputs** exporting S3 bucket names, DynamoDB table name, and Lambda ARN.

Ensure the generated CloudFormation follows best practices, includes resource tagging, and uses consistent logical naming conventions for ease of maintenance.
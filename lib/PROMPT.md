---
## 📝 Serverless File Processing Application on AWS
---

### Objective

As a skilled cloud solutions architect, your task is to build a **serverless application** using **Pulumi and Python** that automatically processes files uploaded to an S3 bucket by triggering an AWS Lambda function. The implementation must be robust, secure, and easily configurable.

---

### Core Architectural Components

The Pulumi program must provision and configure the following essential AWS services:

- **Amazon S3 Bucket**: A dedicated bucket for receiving file uploads, which will act as the event source.
- **AWS Lambda Function**: A Python-based serverless function responsible for processing the uploaded files.
- **AWS Identity and Access Management (IAM)**: Necessary roles and policies to grant the Lambda function the precise permissions required for execution, S3 interactions, and logging.
- **AWS CloudWatch Logs**: To capture and store all execution and error logs from the Lambda function.

---

### Technical Specifications & Constraints

- **Deployment Technology**: The entire infrastructure must be defined using **Pulumi's Python SDK**.
- **Cloud Provider**: All resources must be deployed on **AWS**.
- **Target AWS Region**: The infrastructure must be geographically hosted in the **`us-west-2` (Oregon)** region.
- **S3 Bucket Name**: The S3 bucket **must be named `file-processing-bucket`**.
- **Lambda Trigger**: The Lambda function **must be triggered by object creation events** within the `file-processing-bucket`.
- **IAM Security**:
  - The Lambda's IAM role must adhere to the **principle of least privilege**, allowing it to:
    - Read from and write to the `file-processing-bucket`.
    - Create log groups and write log events to CloudWatch Logs.
- **Lambda Configuration**:
  - The Python Lambda function should accept **environment variables** to dynamically control its processing behavior (e.g., `PROCESSING_MODE`, `OUTPUT_PREFIX`).
  - The Lambda function's code **must include logging** to track all incoming request events and any errors encountered during processing.
- **Naming Conventions**: Resources should follow consistent and clear naming, reflecting their purpose (e.g., `file-processor-lambda`, `file-processing-bucket-log-group`).

---

### Expected Output

You will deliver a complete and runnable **Pulumi Python script** that successfully deploys the described infrastructure. The solution must include:

1.  **Pulumi Infrastructure Code**: Defines the S3 bucket, Lambda function, IAM roles/policies, and CloudWatch Log Group.
2.  **Lambda Function Code**: A simple Python handler for the Lambda function that demonstrates reading S3 event data, accessing environment variables, and logging.
3.  **Validation**: Although explicit unit tests are not requested, ensure the provided code is structured in a way that implies it would pass **function and integration tests**, and that the **IAM configuration adheres to security best practices**.

<!-- end list -->

```python
# Your complete Pulumi Python script will be provided here.
# It should be ready to deploy using `pulumi up` after setting up the stack.
# Include the Lambda function's Python code within the Pulumi script or as a separate inline asset.
```

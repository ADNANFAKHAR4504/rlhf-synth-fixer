You are tasked with designing and deploying a **production-ready, serverless application infrastructure** on **AWS using the AWS Cloud Development Kit (CDK) with Python**. Your solution must meet the following requirements and constraints:

---

### ✅ **Core Functional Requirements:**

1. **API Gateway + Lambda Integration:**

   * Deploy an **HTTP API using AWS API Gateway** that accepts **HTTP POST requests**.
   * Requests should invoke an **AWS Lambda function** that:

     * Parses the request payload.
     * Stores the payload in **Amazon S3**.
     * Logs metadata in a **DynamoDB table**.
     * Initiates an **AWS Step Functions state machine** for further asynchronous processing.

2. **AWS S3:**

   * Store **incoming request data** (payloads) in **S3 buckets**.
   * Ensure Lambda has **read/write permissions** to the bucket.

3. **AWS DynamoDB:**

   * Create a **DynamoDB table** to persist records of all processed requests.
   * Log fields such as: `request_id`, `timestamp`, `s3_key`, `status`, and `step_function_execution_arn`.

4. **AWS Step Functions:**

   * Define a sample **state machine** (can be a Pass or simple Task state) triggered from Lambda.

---

### 🔐 **Security & IAM Requirements:**

* Define **IAM roles and policies** to:

  * Grant the Lambda function permission to write to S3, write to DynamoDB, and start executions in Step Functions.
  * Ensure **least privilege** principles.
* Secure API Gateway using **IAM-based authentication** (or optionally Lambda authorizers if applicable).

---

### 📦 **Infrastructure as Code (IaC) Requirements:**

* Use **AWS CDK in Python** to programmatically define all resources.
* Follow **best practices** for:

  * Naming conventions: Use format like `projectname-environment-resourcetype` (e.g., `orders-prod-lambda`).
  * Tagging: All resources must be tagged with `Environment: Production`.
* Deploy the stack to the **us-east-1** region.
* Ensure the CDK stack can be synthesized and deployed via `cdk deploy`.

---

### ✅ **Success Criteria:**

Your AWS CDK (Python) application should result in a **fully deployed serverless architecture** where:

* An authenticated POST request to API Gateway:

  * Triggers the Lambda function.
  * Stores the request payload in S3.
  * Logs the request in DynamoDB.
  * Kicks off an execution of the Step Function.
* IAM permissions are secure and auditable.
* All resources follow naming/tagging standards.

Output only the **complete AWS CDK Python codebase**.

---
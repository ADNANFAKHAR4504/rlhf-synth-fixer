Here's your **refined expert-level CDK v2 Python prompt** based on your updated constraints:

---

### Prompt: CDK v2 Expert-Level Serverless Stack (Python)

You are tasked with implementing a **secure and production-grade serverless web application** using **AWS CDK v2 in Python**. All resources must be deployed in the **`us-west-2`** region. The infrastructure should be consolidated in a **single stack file** (`tap_stack.py`) and adhere to **security, performance, and efficiency best practices**.

---

### Technical Requirements

Implement the following **fully in `lib/tap_stack.py`** (no external modules, no uploading Lambda ZIPs manually):

#### 1. **AWS Lambda (Compute)**

* Create one or more Lambda functions inline using `lambda_.Function` with `code=lambda_.InlineCode(...)`.
* Constraints:

* Runtime: `PYTHON_3_11`.
* Timeout: **≤ 30 seconds**.
* Log retention: **7 days**.
* Use **environment variables for secrets**, sourced securely from AWS Secrets Manager.
* Log output must go to **CloudWatch Logs**.
* Ensure **IAM role follows least privilege**, scoped only to:

* Read specific secrets.
* Write to CloudWatch.
* Write to S3 (if needed).
* Access DynamoDB.

#### 2. **Amazon API Gateway (HTTP API)**

* Integrate Lambda as backend for HTTP endpoints.
* Requirements:

* Enable **CORS**.
* Implement **request validation** (payload schema or method/params).
* Return meaningful error responses on validation failure.

#### 3. **Amazon S3**

* Create an encrypted bucket with:

* **Block all public access**.
* **KMS-managed encryption**.
* Enforce **SSL-only access**.
* Bucket will store uploaded files, accessible via signed URLs (logic can be stubbed).

#### 4. **Amazon DynamoDB**

* Create a table with:

* **On-demand billing mode**.
* **KMS encryption at rest**.
* Partition key: `id` (string).
* Lambda must have permissions to read/write.

#### 5. **AWS Secrets Manager**

* Create or reference an existing secret.
* Inject secret values into Lambda via environment variables.
* Grant the Lambda function **read-only access** to specific secrets.

#### 6. **IAM Roles and Policies**

* Define IAM roles explicitly (no wildcards).
* Ensure:

* Lambda assumes a role with only required permissions.
* Principle of **least privilege** is strictly followed.

#### 7. **CloudWatch Logs**

* Automatically enabled by Lambda.
* Explicitly set log **retention period to 7 days** for cost optimization and compliance.

#### 8. **Security & Compliance**

* Enable encryption at rest (S3, DynamoDB, Secrets).
* All IAM roles must have **minimal permissions**.
* Use **`aws_kms.Key`** if creating a custom encryption key.

---

### Folder Structure (Fixed)

```plaintext
root/
├── tap.py # CDK App entry point
├── lib/
│ └── tap_stack.py # All resources defined here
├── tests/
│ ├── unit/
│ │ └── test_tap_stack.py # Unit tests for resources
│ └── integration/
│ └── test_tap_stack.py # Boto3-based integration tests
├── cdk.json # CDK context file
└── requirements.txt # Python dependencies
```

---

### Deliverables

You must deliver:

1. A single CDK Stack (`tap_stack.py`) defining all the resources above.
2. Lambda code using `InlineCode`, not ZIP uploads.
3. Proper IAM scoping with inline policies.
4. All resources restricted to **`us-west-2`**.
5. No additional modules or construct files keep everything in the stack file.
6. Unit and integration tests validating the deployed stack.

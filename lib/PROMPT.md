Here is a **comprehensive and production-grade user prompt** tailored for your use case:

---

### ✅ Prompt Title:

**Generate CloudFormation YAML for ServerlessApp: S3-Triggered Lambda with Secrets Manager, HA Design, IAM Least Privilege, and CloudWatch Monitoring**

---

### 📌 Prompt Description:

Act as an expert AWS Solutions Architect. Your task is to generate a **secure**, **highly available**, and **fault-tolerant** AWS CloudFormation YAML template that provisions a **serverless application infrastructure**. All resources must follow AWS best practices, least privilege IAM, and naming conventions based on the prefix `ServerlessApp`.

---

### 🧩 Functional Requirements:

1. **Lambda Function (`ServerlessAppLambda`)**
   - Must be the primary compute unit.
   - Must be triggered by **file uploads** (PUT events) to a specific **S3 bucket**.
   - Must retrieve **sensitive data** (e.g., API keys) securely from **AWS Secrets Manager**.
   - Must have **least privilege IAM role** with:
     - Access to read from S3
     - Access to specific Secrets Manager secret
     - Permissions to log to CloudWatch

2. **S3 Bucket (`ServerlessAppBucket`)**
   - Triggers the Lambda function on `s3:ObjectCreated:*` events.
   - Must include bucket policy that allows only necessary permissions.
   - Must be deployed with versioning enabled and encryption at rest.

3. **AWS Secrets Manager (`ServerlessAppSecret`)**
   - Stores confidential values such as API keys or database credentials.
   - Lambda must be granted **read-only access** to this secret.

4. **IAM Role and Policy (`ServerlessAppLambdaExecutionRole`)**
   - IAM Role for Lambda must use **AssumeRolePolicyDocument** for `lambda.amazonaws.com`.
   - IAM Policy must include:
     - `s3:GetObject` for the specific bucket
     - `secretsmanager:GetSecretValue` for the defined secret
     - `logs:CreateLogGroup`, `logs:CreateLogStream`, and `logs:PutLogEvents`

5. **CloudWatch Alarms**
   - Must monitor:
     - **Lambda invocation count**
     - **Lambda error count**

   - Alarms should be named using the `ServerlessApp` prefix and should be associated with `ServerlessAppLambda`.

---

### 🌍 Deployment Constraints:

- All resources must be deployed in **`us-west-2`**.
- High availability and fault tolerance must be considered (e.g., multi-AZ deployments where applicable).
- Use **CloudFormation YAML format**, not JSON.
- Ensure the template is **fully validated**, adheres to **AWS best practices**, and is **free from security misconfigurations**.
- Use appropriate **tags** for all resources (e.g., `Environment`, `Project`, etc.).
- All resource names must be **prefixed with `ServerlessApp`**, e.g., `ServerlessAppLambda`, `ServerlessAppBucket`, etc.

---

### ✅ Expected Output:

- A single YAML file named `serverlessapp-stack.yaml`.
- It should be **modular**, **readable**, and **production-grade**, passing all linter and CloudFormation validator checks.
- Include `Metadata` or `Description` blocks for major resources for clarity and documentation.
